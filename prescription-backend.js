const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Storage } = require('@google-cloud/storage');
const vision = require('@google-cloud/vision');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const winston = require('winston');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'prescription-verification' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Google Cloud services
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
});

const visionClient = new vision.ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
  }
});

// Enhanced prescription validation regex patterns
const validationPatterns = {
  doctorName: {
    pattern: /(?:Dr\.?\s+|Doctor\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    confidence: 0.8
  },
  doctorSpecialization: {
    pattern: /(?:Specialization:?\s*|Specialist:?\s*|Department:?\s*)([\w\s]+?)(?=\n|$)/gi,
    confidence: 0.75
  },
  doctorRegistration: {
    pattern: /(?:Reg\.?\s*No\.?:?\s*|Registration:?\s*|License:?\s*)([A-Z0-9\-]+)/gi,
    confidence: 0.85
  },
  patientName: {
    pattern: /(?:Patient:?\s*|Name:?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    confidence: 0.7
  },
  patientAge: {
    pattern: /(?:Age:?\s*|DOB:?\s*)(\d{1,3}\s*(?:years?|yrs?|Y)|[\d\/\-]+)/gi,
    confidence: 0.8
  },
  patientGender: {
    pattern: /(?:Gender:?\s*|Sex:?\s*)(Male|Female|M|F|Other)/gi,
    confidence: 0.85
  },
  medicationName: {
    pattern: /(?:Rx:?\s*|Medicine:?\s*|Drug:?\s*|Tab\.?\s*|Cap\.?\s*)([A-Z][a-z]+(?:\s+\d+mg)?)/gi,
    confidence: 0.9
  },
  dosage: {
    pattern: /(\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|units?|tablets?|capsules?|drops?))/gi,
    confidence: 0.85
  },
  frequency: {
    pattern: /(\d+\s*(?:times?|x)\s*(?:daily|per day|a day)|(?:once|twice|thrice|OD|BD|TDS|QID)\s*(?:daily|a day)?)/gi,
    confidence: 0.8
  },
  duration: {
    pattern: /(?:for\s+|duration:?\s*)(\d+\s*(?:days?|weeks?|months?))/gi,
    confidence: 0.75
  },
  instructions: {
    pattern: /(?:Instructions?:?\s*|Directions?:?\s*|Notes?:?\s*)(.*?)(?=\n|$)/gi,
    confidence: 0.7
  },
  date: {
    pattern: /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g,
    confidence: 0.9
  },
  validUntil: {
    pattern: /(?:Valid\s*(?:until|till|upto):?\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi,
    confidence: 0.8
  },
  diagnosis: {
    pattern: /(?:Diagnosis:?\s*|Condition:?\s*|For:?\s*)([\w\s,]+?)(?=\n|$)/gi,
    confidence: 0.75
  },
  hospitalName: {
    pattern: /(?:Hospital:?\s*|Clinic:?\s*|Medical Center:?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+Hospital|\s+Clinic)?)/gi,
    confidence: 0.75
  },
  hospitalAddress: {
    pattern: /(?:Address:?\s*|Located at:?\s*)([\w\s,\.\-]+?)(?=\n|Phone|Email|$)/gi,
    confidence: 0.7
  }
};

// Known medicine database (in production, this would be a proper database)
const knownMedicines = [
  'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Aspirin', 'Metformin',
  'Omeprazole', 'Cetirizine', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline',
  'Lisinopril', 'Atorvastatin', 'Simvastatin', 'Losartan', 'Amlodipine'
];

// Utility functions
const generateUniqueId = () => crypto.randomBytes(16).toString('hex');

const calculateConfidence = (extractedText, pattern) => {
  const matches = extractedText.match(pattern.pattern);
  if (!matches) return 0;
  
  // Base confidence from pattern
  let confidence = pattern.confidence * 100;
  
  // Adjust based on text quality indicators
  const textQuality = assessTextQuality(extractedText);
  confidence *= textQuality;
  
  return Math.min(Math.round(confidence), 100);
};

const assessTextQuality = (text) => {
  let quality = 1.0;
  
  // Penalize for too many special characters (OCR errors)
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;
  if (specialCharRatio > 0.1) quality *= 0.8;
  
  // Penalize for very short text
  if (text.length < 50) quality *= 0.7;
  
  // Reward for medical keywords
  const medicalKeywords = ['prescription', 'doctor', 'patient', 'medicine', 'dosage', 'mg', 'tablet'];
  const keywordCount = medicalKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  ).length;
  quality *= (1 + keywordCount * 0.05);
  
  return Math.min(quality, 1.0);
};

const validateMedicine = (medicineName) => {
  const normalizedName = medicineName.toLowerCase().trim();
  return knownMedicines.some(known => 
    normalizedName.includes(known.toLowerCase()) || 
    known.toLowerCase().includes(normalizedName)
  );
};

const extractPrescriptionData = (text) => {
  const extractedData = {};
  const validationResults = [];
  
  // Extract each field using regex patterns
  Object.entries(validationPatterns).forEach(([field, pattern]) => {
    const matches = text.match(pattern.pattern);
    if (matches && matches.length > 0) {
      let value = matches[0];
      
      // Clean up the extracted value
      if (field === 'doctorName') {
        value = value.replace(/^(?:Dr\.?\s+|Doctor\s+)/i, '').trim();
      } else if (field === 'patientName') {
        value = value.replace(/^(?:Patient:?\s*|Name:?\s*)/i, '').trim();
      } else if (field === 'hospitalName') {
        value = value.replace(/^(?:Hospital:?\s*|Clinic:?\s*)/i, '').trim();
      } else if (field === 'registrationNumber') {
        value = value.replace(/^(?:Reg\.?\s*No\.?:?\s*|Registration:?\s*)/i, '').trim();
      }
      
      extractedData[field] = {
        value: value,
        confidence: calculateConfidence(text, pattern),
        rawMatches: matches
      };
    } else {
      extractedData[field] = {
        value: null,
        confidence: 0,
        rawMatches: []
      };
    }
  });
  
  // Enhanced medication extraction with more details
  const medicationRegex = /(?:(?:Tab|Cap|Syrup|Inj|Cream|Drops?)\.?\s*)?([A-Z][a-z]+(?:\s+\d+\s*(?:mg|ml|mcg|g))?)\s*(?:[-–]\s*)?(\d+\s*(?:times?|x|OD|BD|TDS|QID)?\s*(?:daily|per day|a day)?)?(?:\s*(?:for|x)\s*(\d+\s*(?:days?|weeks?|months?)))?/gi;
  const medicationMatches = text.matchAll(medicationRegex);
  const medications = [];
  
  for (const match of medicationMatches) {
    const fullMatch = match[0];
    const name = match[1]?.trim();
    const frequency = match[2]?.trim() || 'As directed';
    const duration = match[3]?.trim() || 'As prescribed';
    
    // Extract additional instructions for this medication
    const instructionRegex = new RegExp(`${name}.*?(?:after|before|with)\\s*(meals?|food|water|milk)`, 'gi');
    const instructionMatch = text.match(instructionRegex);
    const instructions = instructionMatch ? instructionMatch[0] : 'Take as directed by physician';
    
    if (name && name.length > 2) {
      medications.push({
        name: name,
        dosage: frequency,
        duration: duration,
        instructions: instructions,
        confidence: validateMedicine(name) ? 95 : 70,
        isValid: validateMedicine(name)
      });
    }
  }
  
  // If no medications found with detailed regex, try simpler pattern
  if (medications.length === 0) {
    const simpleMedRegex = /(?:Tab|Cap|Syrup|Inj|Cream|Drops?)\.?\s*([A-Z][a-z]+(?:\s+\d+\s*(?:mg|ml|mcg|g))?)/gi;
    const simpleMedMatches = text.matchAll(simpleMedRegex);
    
    for (const match of simpleMedMatches) {
      const name = match[1]?.trim();
      if (name && name.length > 2) {
        medications.push({
          name: name,
          dosage: 'As prescribed',
          duration: 'As prescribed',
          instructions: 'Take as directed by physician',
          confidence: validateMedicine(name) ? 85 : 60,
          isValid: validateMedicine(name)
        });
      }
    }
  }
  
  extractedData.medications = medications;
  
  // Validation checks
  if (extractedData.doctorName?.confidence > 80) {
    validationResults.push({
      type: 'success',
      message: 'Doctor name successfully extracted and verified'
    });
  } else {
    validationResults.push({
      type: 'warning',
      message: 'Doctor name could not be clearly identified'
    });
  }
  
  if (extractedData.date?.confidence > 80) {
    validationResults.push({
      type: 'success',
      message: 'Prescription date is clearly visible and valid'
    });
  } else {
    validationResults.push({
      type: 'error',
      message: 'Prescription date is unclear or missing'
    });
  }
  
  if (extractedData.medications?.length > 0) {
    const validMeds = extractedData.medications.filter(med => med.isValid).length;
    if (validMeds === extractedData.medications.length) {
      validationResults.push({
        type: 'success',
        message: 'All prescribed medications are recognized and valid'
      });
    } else {
      validationResults.push({
        type: 'warning',
        message: `${validMeds}/${extractedData.medications.length} medications recognized`
      });
    }
  } else {
    validationResults.push({
      type: 'error',
      message: 'No medications could be extracted from the prescription'
    });
  }
  
  return { extractedData, validationResults };
};

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Main prescription verification endpoint
app.post('/api/verify-prescription', upload.single('prescription'), async (req, res) => {
  const requestId = generateUniqueId();
  
  try {
    logger.info(`Starting prescription verification`, { requestId });
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        requestId
      });
    }
    
    const file = req.file;
    const fileName = `prescriptions/${requestId}-${Date.now()}-${file.originalname}`;
    
    // Upload file to Google Cloud Storage
    const fileUpload = bucket.file(fileName);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          requestId,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(file.buffer);
    });
    
    logger.info(`File uploaded to storage`, { requestId, fileName });
    
    // Perform OCR using Google Cloud Vision API
    const [result] = await visionClient.textDetection({
      image: { content: file.buffer }
    });
    
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in the image');
    }
    
    const extractedText = detections[0].description;
    logger.info(`Text extracted successfully`, { 
      requestId, 
      textLength: extractedText.length 
    });
    
    // Process and validate the extracted text
    const { extractedData, validationResults } = extractPrescriptionData(extractedText);
    
    // Calculate overall confidence score
    const confidenceScores = Object.values(extractedData)
      .filter(item => item && typeof item.confidence === 'number')
      .map(item => item.confidence);
    
    const overallConfidence = confidenceScores.length > 0 
      ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
      : 0;
    
    // Prepare response
    const response = {
      success: true,
      requestId,
      data: {
        extractedText: extractedText.substring(0, 500) + '...', // Truncate for response
        extractedData,
        validationResults,
        overallConfidence,
        processingTime: Date.now(),
        metadata: {
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          processedAt: new Date().toISOString()
        }
      }
    };
    
    logger.info(`Prescription verification completed successfully`, {
      requestId,
      overallConfidence,
      medicationsFound: extractedData.medications?.length || 0
    });
    
    res.json(response);
    
  } catch (error) {
    logger.error(`Prescription verification failed`, {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process prescription',
      message: error.message,
      requestId
    });
  }
});

// Get prescription history (mock endpoint)
app.get('/api/prescriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // In production, this would query a database
    const mockHistory = [
      {
        id: '1',
        date: '2024-01-15',
        doctor: 'Dr. Sarah Johnson',
        status: 'verified',
        medications: ['Amoxicillin 500mg', 'Paracetamol 650mg']
      },
      {
        id: '2',
        date: '2024-01-10',
        doctor: 'Dr. Michael Chen',
        status: 'verified',
        medications: ['Metformin 500mg']
      }
    ];
    
    res.json({
      success: true,
      data: mockHistory
    });
    
  } catch (error) {
    logger.error(`Failed to fetch prescription history`, {
      userId: req.params.userId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prescription history'
    });
  }
});

// Validate individual medicine endpoint
app.post('/api/validate-medicine', async (req, res) => {
  try {
    const { medicineName } = req.body;
    
    if (!medicineName) {
      return res.status(400).json({
        success: false,
        error: 'Medicine name is required'
      });
    }
    
    const isValid = validateMedicine(medicineName);
    const suggestions = isValid ? [] : knownMedicines
      .filter(med => med.toLowerCase().includes(medicineName.toLowerCase().substring(0, 3)))
      .slice(0, 5);
    
    res.json({
      success: true,
      data: {
        medicineName,
        isValid,
        confidence: isValid ? 95 : 30,
        suggestions
      }
    });
    
  } catch (error) {
    logger.error(`Medicine validation failed`, {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate medicine'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  logger.error(`Unhandled error`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Prescription verification server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 