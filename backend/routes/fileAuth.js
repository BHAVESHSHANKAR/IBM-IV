const express = require("express");
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const File = require('../models/files');
const { authenticateToken } = require('../middleware/authMiddleware');
const { Buffer } = require('buffer');
const stream = require('stream');
const axios = require('axios');
const retry = require('async-retry');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Configure Multer for temporary storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const FRAGMENT_COUNT = 5;
const RETRY_ATTEMPTS = 3;

// Encryption functions
function generateEncryptionKey() {
    return crypto.randomBytes(32);
}

function generateIV() {
    return crypto.randomBytes(IV_LENGTH);
}

function encryptBuffer(buffer, key) {
    try {
        const iv = generateIV();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const authTag = cipher.getAuthTag();
        
        return { iv, authTag, encryptedData: encrypted };
    } catch (error) {
        console.error('Encryption error:', error.message);
        throw new Error('Encryption failed: ' + error.message);
    }
}

function decryptBuffer(encryptedBuffer, key, iv, authTag) {
    try {
        if (!Buffer.isBuffer(encryptedBuffer)) {
            throw new Error('Encrypted data must be a buffer');
        }
        if (!Buffer.isBuffer(key) || key.length !== 32) {
            throw new Error('Invalid encryption key');
        }
        if (!Buffer.isBuffer(iv) || iv.length !== IV_LENGTH) {
            throw new Error('Invalid IV');
        }
        if (!Buffer.isBuffer(authTag) || authTag.length !== AUTH_TAG_LENGTH) {
            throw new Error('Invalid auth tag');
        }

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    } catch (error) {
        console.error('Decryption error:', error.message);
        throw new Error('Decryption failed: ' + error.message);
    }
}

// Split buffer into fragments
function splitBuffer(buffer, numFragments) {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error('Input must be a buffer');
    }
    if (buffer.length === 0) {
        throw new Error('Buffer is empty');
    }
    if (numFragments <= 0) {
        throw new Error('Number of fragments must be positive');
    }

    const fragmentSize = Math.ceil(buffer.length / numFragments);
    const fragments = [];
    
    for (let i = 0; i < numFragments; i++) {
        const start = i * fragmentSize;
        const end = Math.min(start + fragmentSize, buffer.length);
        fragments.push(buffer.slice(start, end));
    }
    
    return fragments;
}

// Upload file route (unchanged)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (req.file.size === 0) {
            return res.status(400).json({ message: 'Empty file uploaded' });
        }

        const fileBuffer = req.file.buffer;
        const fragments = splitBuffer(fileBuffer, FRAGMENT_COUNT);
        const originalName = req.file.originalname;
        
        if (!originalName || originalName.trim().length === 0) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        const baseFileName = originalName.substring(0, originalName.lastIndexOf('.'));
        const extension = originalName.substring(originalName.lastIndexOf('.'));

        const fileRecord = new File({
            userId: req.user._id,
            originalName: originalName,
            mimeType: req.file.mimetype,
            size: req.file.size,
            fragmentCount: FRAGMENT_COUNT
        });

        for (let i = 0; i < fragments.length; i++) {
            try {
                const key = generateEncryptionKey();
                const encryptionResult = encryptBuffer(fragments[i], key);
                
                const fragmentName = `${baseFileName}_fragment${i + 1}${extension}`;
                const result = await new Promise((resolve, reject) => {
                    const bufferStream = new stream.PassThrough();
                    bufferStream.end(encryptionResult.encryptedData);
                    
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'raw',
                            public_id: `${req.user._id}/${fragmentName}`,
                            folder: 'encrypted_files',
                            sign_url: true
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );

                    bufferStream.pipe(uploadStream).on('error', (error) => {
                        reject(new Error(`Upload stream error: ${error.message}`));
                    });
                });

                const signedUrl = cloudinary.url(result.public_id, {
                    resource_type: 'raw',
                    sign_url: true,
                    secure: true
                });

                fileRecord.fragments.push({
                    fragmentNumber: i + 1,
                    cloudinaryId: result.public_id,
                    cloudinaryUrl: signedUrl,
                    encryptionKey: key.toString('hex'),
                    iv: encryptionResult.iv.toString('hex'),
                    authTag: encryptionResult.authTag.toString('hex')
                });
            } catch (error) {
                await Promise.all(fileRecord.fragments.map(fragment =>
                    cloudinary.uploader.destroy(fragment.cloudinaryId, { resource_type: 'raw' })
                        .catch(err => console.error('Cleanup error:', err))
                ));
                throw new Error(`Failed to process fragment ${i + 1}: ${error.message}`);
            }
        }

        fileRecord.isComplete = true;
        await fileRecord.save();

        res.status(200).json({
            message: 'File uploaded successfully',
            fileId: fileRecord._id,
            originalName: fileRecord.originalName,
            size: fileRecord.size,
            uploadDate: fileRecord.uploadDate
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            message: 'Error uploading file',
            error: error.message
        });
    }
});

// Download file route
router.get('/download/:fileId', authenticateToken, async (req, res) => {
    try {
        const fileRecord = await File.findOne({
            _id: req.params.fileId,
            userId: req.user._id
        });

        if (!fileRecord) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (!fileRecord.isComplete) {
            return res.status(400).json({ message: 'File upload is incomplete' });
        }

        console.log(`Downloading file: ${fileRecord.originalName} (ID: ${fileRecord._id})`);

        // Sort fragments by fragment number
        const sortedFragments = fileRecord.fragments.sort((a, b) => a.fragmentNumber - b.fragmentNumber);

        if (sortedFragments.length !== FRAGMENT_COUNT) {
            console.error(`File ${fileRecord._id}: Incorrect fragment count: ${sortedFragments.length}/${FRAGMENT_COUNT}`);
            return res.status(400).json({ message: 'File is corrupted: incorrect number of fragments' });
        }

        // Validate fragment data
        for (const fragment of sortedFragments) {
            if (!fragment.cloudinaryId || !fragment.encryptionKey || !fragment.iv || !fragment.authTag) {
                console.error(`File ${fileRecord._id}: Invalid fragment ${fragment.fragmentNumber} data`);
                return res.status(400).json({ 
                    message: `Invalid fragment data for fragment ${fragment.fragmentNumber}` 
                });
            }
        }

        // Download and decrypt all fragments
        const fragmentBuffers = await Promise.all(sortedFragments.map(async (fragment) => {
            return await retry(async () => {
                try {
                    // Generate fresh signed URL
                    const signedUrl = cloudinary.url(fragment.cloudinaryId, {
                        resource_type: 'raw',
                        sign_url: true,
                        secure: true,
                        // Ensure URL doesn't expire too soon
                        url_expiry: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
                    });

                    console.log(`Fetching fragment ${fragment.fragmentNumber} from: ${signedUrl}`);

                    // Download fragment
                    const response = await axios.get(signedUrl, {
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Node.js Cloudinary Download'
                        }
                    });

                    if (response.status !== 200) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const encryptedBuffer = Buffer.from(response.data);
                    console.log(`Fragment ${fragment.fragmentNumber}: Encrypted buffer size = ${encryptedBuffer.length}`);

                    // Convert components to Buffers
                    const key = Buffer.from(fragment.encryptionKey, 'hex');
                    const iv = Buffer.from(fragment.iv, 'hex');
                    const authTag = Buffer.from(fragment.authTag, 'hex');

                    console.log(`Fragment ${fragment.fragmentNumber}: Key length = ${key.length}, IV length = ${iv.length}, AuthTag length = ${authTag.length}`);

                    // Decrypt fragment
                    const decryptedBuffer = decryptBuffer(encryptedBuffer, key, iv, authTag);
                    console.log(`Fragment ${fragment.fragmentNumber}: Decrypted buffer size = ${decryptedBuffer.length}`);
                    
                    return decryptedBuffer;
                } catch (error) {
                    console.error(`Error processing fragment ${fragment.fragmentNumber} for file ${fileRecord._id}:`, error.message);
                    throw new Error(`Failed to process fragment ${fragment.fragmentNumber}: ${error.message}`);
                }
            }, {
                retries: RETRY_ATTEMPTS,
                factor: 2,
                minTimeout: 1000,
                maxTimeout: 5000,
                onRetry: (err) => {
                    console.log(`Retrying fragment ${fragment.fragmentNumber} for file ${fileRecord._id} due to error: ${err.message}`);
                }
            });
        }));

        // Combine fragments
        const completeFile = Buffer.concat(fragmentBuffers);

        if (completeFile.length !== fileRecord.size) {
            console.error(`File ${fileRecord._id}: Reconstructed size (${completeFile.length}) does not match original size (${fileRecord.size})`);
            throw new Error(`Reconstructed file size (${completeFile.length}) does not match original size (${fileRecord.size})`);
        }

        // Set response headers
        res.setHeader('Content-Type', fileRecord.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
        res.setHeader('Content-Length', completeFile.length);
        
        console.log(`File ${fileRecord._id} downloaded successfully: ${fileRecord.originalName}`);
        res.send(completeFile);

    } catch (error) {
        console.error(`Download error for file ${req.params.fileId}:`, error);
        res.status(500).json({ 
            message: 'Error downloading file',
            error: error.message
        });
    }
});

// Get user's files (unchanged)
router.get('/files', authenticateToken, async (req, res) => {
    try {
        const files = await File.find({ 
            userId: req.user._id,
            isComplete: true 
        }).select('-fragments.encryptionKey -fragments.iv -fragments.authTag');

        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Error fetching files' });
    }
});

// Delete file (unchanged)
router.delete('/files/:fileId', authenticateToken, async (req, res) => {
    try {
        const fileRecord = await File.findOne({
            _id: req.params.fileId,
            userId: req.user._id
        });

        if (!fileRecord) {
            return res.status(404).json({ message: 'File not found' });
        }

        await Promise.all(fileRecord.fragments.map(fragment =>
            cloudinary.uploader.destroy(fragment.cloudinaryId, { resource_type: 'raw' })
                .catch(error => {
                    console.error(`Failed to delete fragment ${fragment.fragmentNumber} from Cloudinary:`, error);
                })
        ));

        await File.deleteOne({ _id: req.params.fileId });

        res.json({ 
            message: 'File deleted successfully',
            fileId: req.params.fileId,
            originalName: fileRecord.originalName
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

// New endpoint to validate and clean up corrupted files
router.get('/validate-files', authenticateToken, async (req, res) => {
    try {
        const files = await File.find({ userId: req.user._id });
        const corruptedFiles = [];
        const validFiles = [];

        for (const file of files) {
            const issues = [];

            // Check fragment count
            if (file.fragments.length !== file.fragmentCount) {
                issues.push(`Incorrect fragment count: ${file.fragments.length}/${file.fragmentCount}`);
            }

            // Validate fragment data
            for (const fragment of file.fragments) {
                if (!fragment.cloudinaryId || !fragment.encryptionKey || !fragment.iv || !fragment.authTag) {
                    issues.push(`Fragment ${fragment.fragmentNumber} missing required fields`);
                } else {
                    // Verify fragment exists in Cloudinary
                    try {
                        const signedUrl = cloudinary.url(fragment.cloudinaryId, {
                            resource_type: 'raw',
                            sign_url: true,
                            secure: true
                        });
                        const response = await axios.head(signedUrl);
                        if (response.status !== 200) {
                            issues.push(`Fragment ${fragment.fragmentNumber} inaccessible in Cloudinary (status: ${response.status})`);
                        }
                    } catch (error) {
                        issues.push(`Fragment ${fragment.fragmentNumber} inaccessible: ${error.message}`);
                    }
                }
            }

            if (issues.length > 0) {
                corruptedFiles.push({
                    fileId: file._id,
                    originalName: file.originalName,
                    issues
                });
            } else {
                validFiles.push({
                    fileId: file._id,
                    originalName: file.originalName
                });
            }
        }

        res.json({
            message: 'File validation complete',
            validFiles,
            corruptedFiles
        });
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({ message: 'Error validating files', error: error.message });
    }
});

// New endpoint to clean up corrupted files
router.delete('/cleanup-corrupted', authenticateToken, async (req, res) => {
    try {
        const files = await File.find({ userId: req.user._id });
        const deletedFiles = [];

        for (const file of files) {
            let isCorrupted = false;
            const issues = [];

            if (file.fragments.length !== file.fragmentCount) {
                isCorrupted = true;
                issues.push(`Incorrect fragment count: ${file.fragments.length}/${file.fragmentCount}`);
            }

            for (const fragment of file.fragments) {
                if (!fragment.cloudinaryId || !fragment.encryptionKey || !fragment.iv || !fragment.authTag) {
                    isCorrupted = true;
                    issues.push(`Fragment ${fragment.fragmentNumber} missing required fields`);
                } else {
                    try {
                        const signedUrl = cloudinary.url(fragment.cloudinaryId, {
                            resource_type: 'raw',
                            sign_url: true,
                            secure: true
                        });
                        const response = await axios.head(signedUrl);
                        if (response.status !== 200) {
                            isCorrupted = true;
                            issues.push(`Fragment ${fragment.fragmentNumber} inaccessible (status: ${response.status})`);
                        }
                    } catch (error) {
                        isCorrupted = true;
                        issues.push(`Fragment ${fragment.fragmentNumber} inaccessible: ${error.message}`);
                    }
                }
            }

            if (isCorrupted) {
                // Delete fragments from Cloudinary
                await Promise.all(file.fragments.map(fragment =>
                    cloudinary.uploader.destroy(fragment.cloudinaryId, { resource_type: 'raw' })
                        .catch(error => {
                            console.error(`Failed to delete fragment ${fragment.fragmentNumber} for file ${file._id}:`, error);
                        })
                ));

                // Delete file record
                await File.deleteOne({ _id: file._id });
                deletedFiles.push({
                    fileId: file._id,
                    originalName: file.originalName,
                    issues
                });
            }
        }

        res.json({
            message: 'Cleanup complete',
            deletedFiles
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ message: 'Error cleaning up files', error: error.message });
    }
});

module.exports = router;