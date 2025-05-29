const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const socket = require('socket.io');
const geolib = require('geolib');
const { Inventory, Pharmacy, Medicine } = require('./models');

const app = express();
const redis = new Redis();

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/mediquick', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());

// Redis Cache Middleware
const cacheInventory = async (req, res, next) => {
    try {
        const { lat, lng } = req.query;
        const cacheKey = `inventory:${lat}:${lng}`;
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            res.json(JSON.parse(cachedData));
            return;
        }
        next();
    } catch (error) {
        next(error);
    }
};

// API Routes

// Get nearby pharmacies with available medicine
app.get('/api/pharmacies/nearby', cacheInventory, async (req, res) => {
    try {
        const { lat, lng, medicineId, radius = 5000 } = req.query;

        const pharmacies = await Pharmacy.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: radius
                }
            },
            isActive: true
        });

        const pharmaciesWithInventory = await Promise.all(
            pharmacies.map(async (pharmacy) => {
                const inventory = medicineId 
                    ? await Inventory.find({
                        pharmacyId: pharmacy._id,
                        medicineId: medicineId,
                        quantity: { $gt: 0 }
                    })
                    : await Inventory.find({
                        pharmacyId: pharmacy._id,
                        quantity: { $gt: 0 }
                    });

                const distance = geolib.getDistance(
                    { latitude: lat, longitude: lng },
                    { latitude: pharmacy.location.coordinates[1], longitude: pharmacy.location.coordinates[0] }
                );

                return {
                    ...pharmacy.toObject(),
                    distance: (distance / 1000).toFixed(1),
                    inventory: inventory
                };
            })
        );

        // Cache the results
        const cacheKey = `inventory:${lat}:${lng}`;
        await redis.setex(cacheKey, 300, JSON.stringify(pharmaciesWithInventory));

        res.json(pharmaciesWithInventory);
    } catch (error) {
        console.error('Error fetching nearby pharmacies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get inventory statistics
app.get('/api/inventory/stats', async (req, res) => {
    try {
        const totalMedicines = await Medicine.countDocuments();
        const lowStockItems = await Inventory.countDocuments({
            quantity: { $lte: '$threshold' }
        });
        const outOfStockItems = await Inventory.countDocuments({
            quantity: 0
        });

        const stats = {
            totalMedicines,
            lowStockItems,
            outOfStockItems,
            lastUpdated: new Date()
        };

        // Cache stats for 5 minutes
        await redis.setex('inventory:stats', 300, JSON.stringify(stats));

        res.json(stats);
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update inventory
app.post('/api/inventory/update', async (req, res) => {
    try {
        const { medicineId, pharmacyId, quantity, action } = req.body;

        const inventory = await Inventory.findOne({
            medicineId,
            pharmacyId
        });

        if (!inventory) {
            return res.status(404).json({ error: 'Inventory not found' });
        }

        // Update quantity based on action
        if (action === 'increment') {
            inventory.quantity += quantity;
        } else if (action === 'decrement') {
            if (inventory.quantity < quantity) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            inventory.quantity -= quantity;
        }

        inventory.lastUpdated = new Date();
        await inventory.save();

        // Clear cache
        const cachePattern = 'inventory:*';
        const keys = await redis.keys(cachePattern);
        if (keys.length) {
            await redis.del(keys);
        }

        // Emit real-time update
        io.emit('inventoryUpdate', {
            medicineId,
            pharmacyId,
            quantity: inventory.quantity,
            reservedQuantity: inventory.reservedQuantity,
            lastUpdated: inventory.lastUpdated
        });

        res.json(inventory);
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reserve medicine
app.post('/api/inventory/reserve', async (req, res) => {
    try {
        const { medicineId, pharmacyId, quantity } = req.body;

        const inventory = await Inventory.findOne({
            medicineId,
            pharmacyId
        });

        if (!inventory) {
            return res.status(404).json({ error: 'Inventory not found' });
        }

        if (inventory.quantity - inventory.reservedQuantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        inventory.reservedQuantity += quantity;
        await inventory.save();

        // Emit real-time update
        io.emit('inventoryUpdate', {
            medicineId,
            pharmacyId,
            quantity: inventory.quantity,
            reservedQuantity: inventory.reservedQuantity,
            lastUpdated: inventory.lastUpdated
        });

        res.json(inventory);
    } catch (error) {
        console.error('Error reserving medicine:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get medicine details
app.get('/api/medicines/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ error: 'Medicine not found' });
        }
        res.json(medicine);
    } catch (error) {
        console.error('Error fetching medicine details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search medicines
app.get('/api/medicines/search', async (req, res) => {
    try {
        const { query, category } = req.query;
        const searchQuery = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        };

        if (category) {
            searchQuery.category = category;
        }

        const medicines = await Medicine.find(searchQuery);
        res.json(medicines);
    } catch (error) {
        console.error('Error searching medicines:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const server = app.listen(3000, () => {
    console.log('Server running on port 3000');
});

// Socket.IO setup
const io = socket(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Export for testing
module.exports = app; 