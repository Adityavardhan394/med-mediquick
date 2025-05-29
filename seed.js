const mongoose = require('mongoose');
const { Medicine, Pharmacy, Inventory } = require('./models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediquick', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    seedDatabase();
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Sample data
const medicines = [
    {
        name: 'Paracetamol',
        description: 'Effective relief from fever and mild to moderate pain',
        category: 'Pain Relief',
        manufacturer: 'MediCorp',
        price: 49.99,
        requiresPrescription: false,
        sideEffects: ['Rare liver problems', 'Skin rashes'],
        dosage: 'Adults: 1-2 tablets every 4-6 hours as needed',
        warnings: ['Do not exceed 8 tablets in 24 hours', 'Avoid alcohol']
    },
    {
        name: 'Ibuprofen',
        description: 'Relief from pain, inflammation, and fever',
        category: 'Anti-inflammatory',
        manufacturer: 'HealthPharm',
        price: 89.99,
        requiresPrescription: false,
        sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness'],
        dosage: 'Adults: 200-400mg every 4-6 hours',
        warnings: ['Take with food', 'Not recommended for stomach ulcer patients']
    },
    {
        name: 'Metformin',
        description: 'Control blood sugar levels in type 2 diabetes',
        category: 'Diabetes Care',
        manufacturer: 'DiaCare',
        price: 199.99,
        requiresPrescription: true,
        sideEffects: ['Nausea', 'Diarrhea', 'Stomach upset'],
        dosage: 'As prescribed by your doctor',
        warnings: ['Regular blood sugar monitoring required']
    }
];

const pharmacies = [
    {
        name: 'MediQuick Central',
        address: '123 Main St, City Center',
        location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139] // Delhi coordinates
        },
        contactNumber: '+91-9876543210',
        operatingHours: {
            open: '09:00',
            close: '22:00'
        },
        rating: 4.5,
        isActive: true
    },
    {
        name: 'QuickMeds South',
        address: '456 Park Road, South City',
        location: {
            type: 'Point',
            coordinates: [77.2310, 28.6000] // South Delhi coordinates
        },
        contactNumber: '+91-9876543211',
        operatingHours: {
            open: '08:00',
            close: '23:00'
        },
        rating: 4.2,
        isActive: true
    },
    {
        name: 'MediExpress North',
        address: '789 Ring Road, North City',
        location: {
            type: 'Point',
            coordinates: [77.2090, 28.7000] // North Delhi coordinates
        },
        contactNumber: '+91-9876543212',
        operatingHours: {
            open: '10:00',
            close: '21:00'
        },
        rating: 4.0,
        isActive: true
    }
];

async function seedDatabase() {
    try {
        // Clear existing data
        await Promise.all([
            Medicine.deleteMany({}),
            Pharmacy.deleteMany({}),
            Inventory.deleteMany({})
        ]);

        // Insert medicines
        const insertedMedicines = await Medicine.insertMany(medicines);
        console.log('Medicines seeded successfully');

        // Insert pharmacies
        const insertedPharmacies = await Pharmacy.insertMany(pharmacies);
        console.log('Pharmacies seeded successfully');

        // Create inventory for each medicine in each pharmacy
        const inventoryData = [];
        insertedPharmacies.forEach(pharmacy => {
            insertedMedicines.forEach(medicine => {
                inventoryData.push({
                    medicineId: medicine._id,
                    name: medicine.name,
                    quantity: Math.floor(Math.random() * 100) + 20,
                    threshold: 20,
                    pharmacyId: pharmacy._id,
                    location: pharmacy.location,
                    price: medicine.price,
                    manufacturer: medicine.manufacturer,
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
                    batchNumber: 'BATCH-' + Math.random().toString(36).substring(7).toUpperCase(),
                    reservedQuantity: 0
                });
            });
        });

        await Inventory.insertMany(inventoryData);
        console.log('Inventory seeded successfully');

        console.log('Database seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
} 