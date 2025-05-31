const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const prescriptionController = require('../controllers/prescription');
const { validatePrescription } = require('../middleware/validation');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only JPG, PNG and PDF files are allowed.'));
            return;
        }
        cb(null, true);
    }
});

router.post('/verify',
    protect,
    upload.single('prescription'),
    validatePrescription,
    prescriptionController.verifyPrescription
);

router.get('/history',
    protect,
    prescriptionController.getPrescriptionHistory
);

router.get('/:id',
    protect,
    prescriptionController.getPrescriptionById
);

module.exports = router; 