import express from 'express';
import {registerUser , loginUser, getUserInfo} from '../controllers/authControllers.js'
import protect from '../middleware/authMiddleware.js'
import upload from '../middleware/uploadMiddleware.js'

const router = express.Router();

router.post("/register" , registerUser);

router.post("/login" , loginUser);

router.get("/getUser", protect , getUserInfo);

router.post("/upload-image", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            message: "No file uploaded"
        });
    }

    // Construct the public URL for the uploaded image
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Send back a success response with the image URL
    res.status(200).json({
        message: "File uploaded successfully!",
        imageUrl: imageUrl,
        fileInfo: req.file
    });
});

export default router;