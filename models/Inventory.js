const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    status: {
        type: String,
        enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
        default: 'IN_STOCK'
    },
    batchNumber: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    alternativeMedicines: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine'
    }]
});

// Create geospatial index for location-based queries
inventorySchema.index({ location: '2dsphere' });

// Pre-save middleware to update status based on quantity
inventorySchema.pre('save', function(next) {
    if (this.quantity <= 0) {
        this.status = 'OUT_OF_STOCK';
    } else if (this.quantity <= this.lowStockThreshold) {
        this.status = 'LOW_STOCK';
    } else {
        this.status = 'IN_STOCK';
    }
    next();
});

// Method to check if medicine is about to expire
inventorySchema.methods.isNearExpiry = function() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.expiryDate <= thirtyDaysFromNow;
};

// Method to update stock status based on quantity
inventorySchema.methods.updateStockStatus = function() {
    if (this.quantity === 0) {
        this.status = 'OUT_OF_STOCK';
    } else if (this.quantity <= 10) {
        this.status = 'LOW_STOCK';
    } else {
        this.status = 'IN_STOCK';
    }
};

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory; 