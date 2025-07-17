const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userAuthRoutes = require("./routes/userAuth");

dotenv.config();
const fileRoutes = require('./routes/fileAuth');

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Handle OPTIONS requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Backend is running" });
});

// Routes
app.use("/api/auth", userAuthRoutes);
app.use('/api/files', fileRoutes);

// 404 handler
app.use((req, res, next) => {
    if (!req.route) {
        return res.status(404).json({
            error: 'Not Found',
            message: `Cannot ${req.method} ${req.url}`,
            status: 404
        });
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle specific errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    
    if (err.name === 'MongoError' && err.code === 11000) {
        return res.status(409).json({ 
            message: 'Duplicate Key Error',
            error: err.message
        });
    }

    // Default error response
    res.status(err.status || 500).json({ 
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

// Start Server
const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});