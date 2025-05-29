const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const vision = require('@google-cloud/vision');
const winston = require('winston');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Configure Google Cloud
const storage = new Storage({
    keyFilename: 'path/to/your/google-cloud-key.json',
    projectId: 'your-project-id'
});
const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: 'path/to/your/google-cloud-key.json'
});

// Configure Multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Only JPG and PNG allowed.'));
        }
        cb(null, true);
    }
});

// Validation patterns
const validationPatterns = {
    doctorName: /Dr\.?\s*([A-Za-z\s.]+)/i,
    doctorRegistration: /(?:Reg|Registration|License)\s*(?:No\.?|Number|#)\s*:\s*([A-Z0-9-]+)/i,
    patientName: /(?:Patient(?:'s)?\s*Name\s*:)?\s*([A-Za-z\s.]+)/i,
    patientAge: /Age\s*:\s*(\d+)/i,
    patientGender: /(?:Gender|Sex)\s*:\s*([MF]|Male|Female)/i,
    date: /Date\s*:\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    medication: /([A-Za-z\s]+)\s*(\d+(?:\.\d+)?\s*(?:mg|ml|g))?\s*(\d+\s*(?:times?|×)\s*daily)?/gi
};

// Helper function to extract text with confidence score
function extractWithConfidence(text, pattern) {
    const match = text.match(pattern);
    if (!match) return { value: null, confidence: 0 };
    
    return {
        value: match[1],
        confidence: calculateConfidence(match[0])
    };
}

// Calculate confidence score based on text clarity
function calculateConfidence(text) {
    const clarity = text.length > 3 ? 0.8 : 0.5;
    const formatting = /^[A-Z]/.test(text) ? 0.9 : 0.7;
    return Math.round((clarity + formatting) * 50);
}

// Prescription verification endpoint
app.post('/api/verify-prescription', upload.single('prescription'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        logger.info('Processing prescription upload', {
            filename: req.file.originalname,
            size: req.file.size
        });

        // Upload to Google Cloud Storage
        const bucket = storage.bucket('your-bucket-name');
        const blob = bucket.file(`prescriptions/${Date.now()}-${req.file.originalname}`);
        const blobStream = blob.createWriteStream();

        await new Promise((resolve, reject) => {
            blobStream.on('error', reject);
            blobStream.on('finish', resolve);
            blobStream.end(req.file.buffer);
        });

        // Perform OCR
        const [result] = await visionClient.textDetection({
            image: { content: req.file.buffer }
        });
        const detectedText = result.fullTextAnnotation.text;

        // Extract and validate information
        const extractedData = {
            doctor: {
                name: extractWithConfidence(detectedText, validationPatterns.doctorName),
                registration: extractWithConfidence(detectedText, validationPatterns.doctorRegistration)
            },
            patient: {
                name: extractWithConfidence(detectedText, validationPatterns.patientName),
                age: extractWithConfidence(detectedText, validationPatterns.patientAge),
                gender: extractWithConfidence(detectedText, validationPatterns.patientGender)
            },
            prescription: {
                date: extractWithConfidence(detectedText, validationPatterns.date),
                medications: []
            }
        };

        // Extract medications
        let medicationMatch;
        while ((medicationMatch = validationPatterns.medication.exec(detectedText)) !== null) {
            if (medicationMatch[1]) {
                extractedData.prescription.medications.push({
                    name: medicationMatch[1].trim(),
                    dosage: medicationMatch[2] || 'Not specified',
                    frequency: medicationMatch[3] || 'As directed',
                    confidence: calculateConfidence(medicationMatch[0])
                });
            }
        }

        // Validate extraction
        const validationResults = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Check required fields
        if (!extractedData.doctor.name.value) {
            validationResults.errors.push('Doctor name not found');
            validationResults.isValid = false;
        }
        if (!extractedData.patient.name.value) {
            validationResults.errors.push('Patient name not found');
            validationResults.isValid = false;
        }
        if (extractedData.prescription.medications.length === 0) {
            validationResults.errors.push('No medications found');
            validationResults.isValid = false;
        }

        // Check confidence scores
        Object.entries(extractedData).forEach(([category, data]) => {
            Object.entries(data).forEach(([field, value]) => {
                if (value.confidence && value.confidence < 70) {
                    validationResults.warnings.push(`Low confidence in ${category} ${field}`);
                }
            });
        });

        logger.info('Prescription processed successfully', {
            isValid: validationResults.isValid,
            medicationsFound: extractedData.prescription.medications.length
        });

        res.json({
            success: true,
            data: extractedData,
            validation: validationResults
        });

    } catch (error) {
        logger.error('Prescription processing failed', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('API Error', {
        error: err.message,
        stack: err.stack
    });

    res.status(500).json({
        success: false,
        error: err.message
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
}); 