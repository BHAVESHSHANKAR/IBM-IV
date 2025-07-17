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
    origin: "*", // Vite's default development port
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", userAuthRoutes);
app.use('/api/files', fileRoutes);

app.get("/", (req, res) => {
    res.send("backend is running");
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log(err);
    });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});