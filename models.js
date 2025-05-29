const mongoose = require('mongoose');

// Inventory Schema
const InventorySchema = new mongoose.Schema({
    medicineId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    threshold: { type: Number, default: 20 },
    pharmacyId: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    lastUpdated: { type: Date, default: Date.now },
    price: { type: Number, required: true },
    manufacturer: String,
    expiryDate: Date,
    batchNumber: String,
    reservedQuantity: { type: Number, default: 0 }
});

InventorySchema.index({ location: '2dsphere' });

// Pharmacy Schema
const PharmacySchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    contactNumber: String,
    operatingHours: {
        open: String,
        close: String
    },
    rating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
});

PharmacySchema.index({ location: '2dsphere' });

// Medicine Schema
const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    manufacturer: { type: String, required: true },
    price: { type: Number, required: true },
    requiresPrescription: { type: Boolean, default: false },
    sideEffects: [String],
    dosage: String,
    warnings: [String],
    createdAt: { type: Date, default: Date.now }
});

const Inventory = mongoose.model('Inventory', InventorySchema);
const Pharmacy = mongoose.model('Pharmacy', PharmacySchema);
const Medicine = mongoose.model('Medicine', MedicineSchema);

module.exports = {
    Inventory,
    Pharmacy,
    Medicine
}; 