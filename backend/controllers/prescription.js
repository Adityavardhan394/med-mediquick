const vision = require('@google-cloud/vision');
const Prescription = require('../models/prescription');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { extractPrescriptionData } = require('../utils/prescriptionParser');

// Initialize Google Cloud Vision client
const client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

exports.verifyPrescription = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError('Please upload a prescription', 400);
        }

        logger.info('Starting prescription verification process');

        // Convert file buffer to base64
        const image = {
            content: req.file.buffer.toString('base64')
        };

        // Perform OCR using Google Cloud Vision API
        const [result] = await client.documentTextDetection(image);
        const fullText = result.fullTextAnnotation.text;

        // Extract and validate prescription data
        const prescriptionData = await extractPrescriptionData(fullText);

        // Validate doctor's registration
        await validateDoctorRegistration(prescriptionData.doctor);

        // Create prescription record
        const prescription = await Prescription.create({
            user: req.user._id,
            doctor: prescriptionData.doctor,
            medicines: prescriptionData.medicines,
            date: prescriptionData.date,
            status: 'verified',
            originalText: fullText
        });

        logger.info(`Prescription verified successfully for user ${req.user._id}`);

        res.status(200).json({
            success: true,
            data: {
                prescription: prescription,
                verificationResults: {
                    isValid: true,
                    doctor: prescriptionData.doctor,
                    medicines: prescriptionData.medicines,
                    date: prescriptionData.date
                }
            }
        });
    } catch (error) {
        logger.error('Prescription verification error:', error);
        next(new AppError(error.message || 'Error processing prescription', error.statusCode || 500));
    }
};

exports.getPrescriptionHistory = async (req, res, next) => {
    try {
        const prescriptions = await Prescription.find({ user: req.user._id })
            .sort('-createdAt')
            .populate('medicines.medicine');

        res.status(200).json({
            success: true,
            data: prescriptions
        });
    } catch (error) {
        next(new AppError('Error fetching prescription history', 500));
    }
};

exports.getPrescriptionById = async (req, res, next) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('medicines.medicine');

        if (!prescription) {
            throw new AppError('Prescription not found', 404);
        }

        // Check if the prescription belongs to the requesting user
        if (prescription.user.toString() !== req.user._id.toString()) {
            throw new AppError('Not authorized to access this prescription', 403);
        }

        res.status(200).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        next(error);
    }
};

async function validateDoctorRegistration(doctorInfo) {
    // In a production environment, this would validate against a medical council API
    // For demo purposes, we'll use a simple regex check
    const regNumberPattern = /^[A-Z]{2,}\d{5,}$/;
    if (!regNumberPattern.test(doctorInfo.regNumber)) {
        throw new AppError('Invalid doctor registration number', 400);
    }
    return true;
} 