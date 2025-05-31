const AppError = require('./appError');

// Regular expressions for data extraction
const patterns = {
    doctorName: /Dr\.\s+([A-Za-z\s.]+)/i,
    regNumber: /([A-Z]{2,}\d{5,})/,
    date: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
    medicines: /([A-Za-z]+)\s+(\d+(?:\.\d+)?(?:mg|g|ml))\s+(\d+(?:\s+times?)?\s+(?:daily|weekly|monthly)|as\s+needed)/gi
};

exports.extractPrescriptionData = async (text) => {
    try {
        // Extract doctor information
        const doctorName = text.match(patterns.doctorName)?.[1];
        const regNumber = text.match(patterns.regNumber)?.[1];
        
        if (!doctorName || !regNumber) {
            throw new AppError('Could not extract doctor information from prescription', 400);
        }

        // Extract date
        const dateMatch = text.match(patterns.date)?.[1];
        const date = dateMatch ? new Date(dateMatch) : new Date();

        // Extract medicines
        const medicines = [];
        let medicineMatch;
        while ((medicineMatch = patterns.medicines.exec(text)) !== null) {
            medicines.push({
                name: medicineMatch[1],
                dosage: medicineMatch[2],
                frequency: medicineMatch[3]
            });
        }

        if (medicines.length === 0) {
            throw new AppError('No medicines found in prescription', 400);
        }

        // Validate extracted data
        await validateExtractedData({
            doctor: { name: doctorName, regNumber },
            medicines,
            date
        });

        return {
            doctor: {
                name: doctorName,
                regNumber
            },
            medicines,
            date
        };
    } catch (error) {
        throw new AppError(error.message || 'Error extracting prescription data', 400);
    }
};

async function validateExtractedData(data) {
    // Validate doctor name format
    if (!/^[A-Za-z\s.]{3,50}$/.test(data.doctor.name)) {
        throw new AppError('Invalid doctor name format', 400);
    }

    // Validate registration number format
    if (!/^[A-Z]{2,}\d{5,}$/.test(data.doctor.regNumber)) {
        throw new AppError('Invalid registration number format', 400);
    }

    // Validate date
    const prescriptionDate = new Date(data.date);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    if (Date.now() - prescriptionDate.getTime() > maxAge) {
        throw new AppError('Prescription is too old (more than 30 days)', 400);
    }

    // Validate medicines
    data.medicines.forEach(medicine => {
        if (!/^[A-Za-z\s]{2,50}$/.test(medicine.name)) {
            throw new AppError(`Invalid medicine name: ${medicine.name}`, 400);
        }

        if (!/^\d+(?:\.\d+)?(?:mg|g|ml)$/.test(medicine.dosage)) {
            throw new AppError(`Invalid dosage format for ${medicine.name}`, 400);
        }

        if (!/^\d+(?:\s+times?)?\s+(?:daily|weekly|monthly)|as\s+needed$/i.test(medicine.frequency)) {
            throw new AppError(`Invalid frequency format for ${medicine.name}`, 400);
        }
    });

    return true;
} 