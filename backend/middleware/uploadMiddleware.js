import multer from 'multer';

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Adds a timestamp to avoid filename clashes
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter  
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Only .jpeg, .jpg and .png formats are allowed'), false); // Reject the file
    }
};

export default { storage, fileFilter };