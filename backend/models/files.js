const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fragmentCount: {
        type: Number,
        default: 5
    },
    fragments: [{
        fragmentNumber: Number,
        cloudinaryId: String,
        cloudinaryUrl: String,
        encryptionKey: String,
        iv: String,
        authTag: String
    }],
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    isComplete: {
        type: Boolean,
        default: false
    }
});

const File = mongoose.model('File', fileSchema);
module.exports = File;
