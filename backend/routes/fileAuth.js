// const express = require("express");
// const router = express.Router();
// const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
// const crypto = require('crypto');
// const File = require('../models/files');
// const { authenticateToken } = require('../middleware/authMiddleware');
// const { Buffer } = require('buffer');
// const fetch = require('node-fetch');

// // Configure Cloudinary
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // Configure Multer for temporary storage
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// const ALGORITHM = 'aes-256-gcm';
// const IV_LENGTH = 12;  // GCM mode uses 12 bytes IV
// const AUTH_TAG_LENGTH = 16; // GCM auth tag length is 16 bytes

// // Encryption functions
// function generateEncryptionKey() {
//     return crypto.randomBytes(32); // 256 bits for AES-256
// }

// function generateIV() {
//     return crypto.randomBytes(IV_LENGTH);
// }

// function encryptBuffer(buffer, key) {
//     try {
//         const iv = generateIV();
//         const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
//         const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
//         const authTag = cipher.getAuthTag();
        
//         // Return an object with all components needed for decryption
//         return {
//             iv,
//             authTag,
//             encryptedData: encrypted
//         };
//     } catch (error) {
//         console.error('Encryption error:', error);
//         throw new Error('Encryption failed');
//     }
// }

// function decryptBuffer(encryptedBuffer, key, iv, authTag) {
//     try {
//         const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
//         decipher.setAuthTag(authTag);
        
//         return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
//     } catch (error) {
//         console.error('Decryption error:', error);
//         throw new Error('Decryption failed');
//     }
// }

// // Split buffer into fragments
// function splitBuffer(buffer, numFragments) {
//     const fragmentSize = Math.ceil(buffer.length / numFragments);
//     const fragments = [];
    
//     for (let i = 0; i < numFragments; i++) {
//         const start = i * fragmentSize;
//         const end = Math.min(start + fragmentSize, buffer.length);
//         fragments.push(buffer.slice(start, end));
//     }
    
//     return fragments;
// }

// // Upload file route
// router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: 'No file uploaded' });
//         }

//         const fileBuffer = req.file.buffer;
//         const fragments = splitBuffer(fileBuffer, 5);
//         const originalName = req.file.originalname;
//         const baseFileName = originalName.substring(0, originalName.lastIndexOf('.'));
//         const extension = originalName.substring(originalName.lastIndexOf('.'));

//         // Create file record
//         const fileRecord = new File({
//             userId: req.user._id,
//             originalName: originalName,
//             mimeType: req.file.mimetype,
//             size: req.file.size,
//             fragmentCount: 5
//         });

//         // Process each fragment
//         for (let i = 0; i < fragments.length; i++) {
//             const key = generateEncryptionKey();
//             const encryptionResult = encryptBuffer(fragments[i], key);
            
//             // Combine IV, authTag, and encrypted data for storage
//             const fragmentData = Buffer.concat([
//                 encryptionResult.iv,
//                 encryptionResult.authTag,
//                 encryptionResult.encryptedData
//             ]);
            
//             // Upload to Cloudinary
//             const fragmentName = `${baseFileName}_fragment${i + 1}${extension}`;
//             const result = await new Promise((resolve, reject) => {
//                 cloudinary.uploader.upload_stream(
//                     {
//                         resource_type: 'raw',
//                         public_id: `${req.user._id}/${fragmentName}`,
//                         folder: 'encrypted_files'
//                     },
//                     (error, result) => {
//                         if (error) reject(error);
//                         else resolve(result);
//                     }
//                 ).end(fragmentData);
//             });

//             // Store fragment info
//             fileRecord.fragments.push({
//                 fragmentNumber: i + 1,
//                 cloudinaryId: result.public_id,
//                 cloudinaryUrl: result.secure_url,
//                 encryptionKey: key.toString('hex'),
//                 iv: encryptionResult.iv.toString('hex'),
//                 authTag: encryptionResult.authTag.toString('hex')
//             });
//         }

//         fileRecord.isComplete = true;
//         await fileRecord.save();

//         res.status(200).json({
//             message: 'File uploaded successfully',
//             fileId: fileRecord._id,
//             originalName: fileRecord.originalName,
//             size: fileRecord.size,
//             uploadDate: fileRecord.uploadDate
//         });

//     } catch (error) {
//         console.error('Upload error:', error);
//         res.status(500).json({ message: 'Error uploading file' });
//     }
// });

// // Download file route
// router.get('/download/:fileId', authenticateToken, async (req, res) => {
//     try {
//         const fileRecord = await File.findOne({
//             _id: req.params.fileId,
//             userId: req.user._id
//         });

//         if (!fileRecord) {
//             return res.status(404).json({ message: 'File not found' });
//         }

//         // Sort fragments by fragment number
//         const sortedFragments = fileRecord.fragments.sort((a, b) => a.fragmentNumber - b.fragmentNumber);

//         // Download and decrypt all fragments
//         const fragmentBuffers = await Promise.all(sortedFragments.map(async (fragment) => {
//             try {
//                 // Download from Cloudinary
//                 const response = await cloudinary.api.resource(fragment.cloudinaryId, { resource_type: 'raw' });
//                 const encryptedData = await fetch(response.secure_url).then(res => res.arrayBuffer());
//                 const encryptedBuffer = Buffer.from(encryptedData);
                
//                 // Extract IV, authTag, and encrypted data
//                 const iv = Buffer.from(fragment.iv, 'hex');
//                 const authTag = Buffer.from(fragment.authTag, 'hex');
//                 const key = Buffer.from(fragment.encryptionKey, 'hex');
//                 const encrypted = encryptedBuffer.slice(IV_LENGTH + AUTH_TAG_LENGTH);
                
//                 // Decrypt fragment
//                 return decryptBuffer(encrypted, key, iv, authTag);
//             } catch (error) {
//                 console.error(`Error processing fragment ${fragment.fragmentNumber}:`, error);
//                 throw new Error(`Failed to process fragment ${fragment.fragmentNumber}`);
//             }
//         }));

//         // Combine fragments
//         const completeFile = Buffer.concat(fragmentBuffers);

//         // Set response headers
//         res.setHeader('Content-Type', fileRecord.mimeType);
//         res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
//         res.setHeader('Content-Length', completeFile.length);
        
//         // Send the complete file
//         res.send(completeFile);

//     } catch (error) {
//         console.error('Download error:', error);
//         res.status(500).json({ 
//             message: 'Error downloading file',
//             error: error.message
//         });
//     }
// });

// // Get user's files
// router.get('/files', authenticateToken, async (req, res) => {
//     try {
//         const files = await File.find({ 
//             userId: req.user._id,
//             isComplete: true 
//         }).select('-fragments.encryptionKey -fragments.iv -fragments.authTag');

//         res.json(files);
//     } catch (error) {
//         console.error('Error fetching files:', error);
//         res.status(500).json({ message: 'Error fetching files' });
//     }
// });

// // Delete file
// router.delete('/files/:fileId', authenticateToken, async (req, res) => {
//     try {
//         const fileRecord = await File.findOne({
//             _id: req.params.fileId,
//             userId: req.user._id
//         });

//         if (!fileRecord) {
//             return res.status(404).json({ message: 'File not found' });
//         }

//         // Delete fragments from Cloudinary
//         await Promise.all(fileRecord.fragments.map(fragment =>
//             cloudinary.uploader.destroy(fragment.cloudinaryId, { resource_type: 'raw' })
//         ));

//         // Delete file record
//         await File.deleteOne({ _id: req.params.fileId });

//         res.json({ 
//             message: 'File deleted successfully',
//             fileId: req.params.fileId,
//             originalName: fileRecord.originalName
//         });
//     } catch (error) {
//         console.error('Delete error:', error);
//         res.status(500).json({ message: 'Error deleting file' });
//     }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const File = require('../models/files');
const { authenticateToken } = require('../middleware/authMiddleware');
const { Buffer } = require('buffer');
const fetch = require('node-fetch').default;
const stream = require('stream');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
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
const IV_LENGTH = 12;  // GCM mode uses 12 bytes IV
const AUTH_TAG_LENGTH = 16; // GCM auth tag length is 16 bytes
const FRAGMENT_COUNT = 5; // Number of fragments to split files into

// Encryption functions
function generateEncryptionKey() {
    return crypto.randomBytes(32); // 256 bits for AES-256
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
        
        return {
            iv,
            authTag,
            encryptedData: encrypted
        };
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

// Upload file route
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

        // Create file record
        const fileRecord = new File({
            userId: req.user._id,
            originalName: originalName,
            mimeType: req.file.mimetype,
            size: req.file.size,
            fragmentCount: FRAGMENT_COUNT
        });

        // Process each fragment
        for (let i = 0; i < fragments.length; i++) {
            try {
                const key = generateEncryptionKey();
                const encryptionResult = encryptBuffer(fragments[i], key);
                
                // Upload to Cloudinary
                const fragmentName = `${baseFileName}_fragment${i + 1}${extension}`;
                const result = await new Promise((resolve, reject) => {
                    const bufferStream = new stream.PassThrough();
                    bufferStream.end(encryptionResult.encryptedData);
                    
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'raw',
                            public_id: `${req.user._id}/${fragmentName}`,
                            folder: 'encrypted_files'
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

                // Store fragment info
                fileRecord.fragments.push({
                    fragmentNumber: i + 1,
                    cloudinaryId: result.public_id,
                    cloudinaryUrl: result.secure_url,
                    encryptionKey: key.toString('hex'),
                    iv: encryptionResult.iv.toString('hex'),
                    authTag: encryptionResult.authTag.toString('hex')
                });
            } catch (error) {
                // If any fragment fails, cleanup already uploaded fragments
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

        // Sort fragments by fragment number
        const sortedFragments = fileRecord.fragments.sort((a, b) => a.fragmentNumber - b.fragmentNumber);

        if (sortedFragments.length !== FRAGMENT_COUNT) {
            return res.status(400).json({ message: 'File is corrupted: incorrect number of fragments' });
        }

        // Download and decrypt all fragments
        const fragmentBuffers = await Promise.all(sortedFragments.map(async (fragment) => {
            try {
                // Download from Cloudinary using node-fetch with streaming
                const response = await fetch(fragment.cloudinaryUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Node.js Cloudinary Download'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Collect stream into buffer
                const chunks = [];
                for await (const chunk of response.body) {
                    chunks.push(chunk);
                }
                const encryptedBuffer = Buffer.concat(chunks);
                
                // Log buffer sizes for debugging
                console.log(`Fragment ${fragment.fragmentNumber}: Encrypted buffer size = ${encryptedBuffer.length}`);

                // Convert all components to Buffers
                const key = Buffer.from(fragment.encryptionKey, 'hex');
                const iv = Buffer.from(fragment.iv, 'hex');
                const authTag = Buffer.from(fragment.authTag, 'hex');

                // Log lengths for debugging
                console.log(`Fragment ${fragment.fragmentNumber}: Key length = ${key.length}, IV length = ${iv.length}, AuthTag length = ${authTag.length}`);

                // Decrypt fragment
                const decryptedBuffer = decryptBuffer(encryptedBuffer, key, iv, authTag);
                console.log(`Fragment ${fragment.fragmentNumber}: Decrypted buffer size = ${decryptedBuffer.length}`);
                
                return decryptedBuffer;
            } catch (error) {
                console.error(`Error processing fragment ${fragment.fragmentNumber}:`, error);
                throw new Error(`Failed to process fragment ${fragment.fragmentNumber}: ${error.message}`);
            }
        }));

        // Combine fragments
        const completeFile = Buffer.concat(fragmentBuffers);

        if (completeFile.length !== fileRecord.size) {
            throw new Error(`Reconstructed file size (${completeFile.length}) does not match original size (${fileRecord.size})`);
        }

        // Set response headers
        res.setHeader('Content-Type', fileRecord.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
        res.setHeader('Content-Length', completeFile.length);
        
        // Send the complete file
        res.send(completeFile);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            message: 'Error downloading file',
            error: error.message
        });
    }
});

// Get user's files
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

// Delete file
router.delete('/files/:fileId', authenticateToken, async (req, res) => {
    try {
        const fileRecord = await File.findOne({
            _id: req.params.fileId,
            userId: req.user._id
        });

        if (!fileRecord) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete fragments from Cloudinary
        await Promise.all(fileRecord.fragments.map(fragment =>
            cloudinary.uploader.destroy(fragment.cloudinaryId, { resource_type: 'raw' })
                .catch(error => {
                    console.error(`Failed to delete fragment ${fragment.fragmentNumber} from Cloudinary:`, error);
                    // Continue with deletion even if Cloudinary fails
                })
        ));

        // Delete file record
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

module.exports = router;