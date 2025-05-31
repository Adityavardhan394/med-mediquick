const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const InventoryCache = require('../utils/redisCache');
const logger = require('../utils/logger');

// Get inventory by location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, medicineId } = req.query; // radius in meters
    
    // Validate required parameters
    if (!lat || !lng) {
      logger.warn('Missing location parameters:', { lat, lng });
      return res.status(400).json({ 
        error: 'Missing location parameters',
        details: 'Both latitude and longitude are required'
      });
    }

    // Validate coordinate values
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      logger.warn('Invalid coordinates:', { lat, lng });
      return res.status(400).json({ 
        error: 'Invalid coordinates',
        details: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Check cache first
    const cacheKey = InventoryCache.generateLocationKey(lat, lng, radius);
    let cachedData;
    try {
      cachedData = await InventoryCache.getInventory(cacheKey);
    } catch (cacheError) {
      logger.error('Cache retrieval error:', cacheError);
      // Continue without cache
    }
    
    if (cachedData) {
      logger.info('Returning cached inventory data');
      return res.json(cachedData);
    }

    // Build query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: parseInt(radius)
        }
      },
      status: { $ne: 'OUT_OF_STOCK' }
    };

    // Add medicineId to query if provided
    if (medicineId) {
      query.medicineId = medicineId;
    }

    logger.info('Executing inventory query:', query);

    // Find nearby pharmacies with the medicine in stock
    const inventory = await Inventory.find(query)
      .populate('pharmacyId')
      .populate('medicineId')
      .lean()
      .exec();

    logger.info(`Found ${inventory.length} inventory items`);

    // Cache the results
    try {
      await InventoryCache.setInventory(cacheKey, inventory);
    } catch (cacheError) {
      logger.error('Cache storage error:', cacheError);
      // Continue without caching
    }

    res.json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    logger.error('Error fetching nearby inventory:', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });

    // Handle specific MongoDB errors
    if (error.name === 'MongoServerError') {
      return res.status(500).json({
        error: 'Database error',
        details: 'Error accessing inventory database'
      });
    }

    // Handle geospatial query errors
    if (error.message.includes('2dsphere')) {
      return res.status(500).json({
        error: 'Geospatial query error',
        details: 'Error processing location-based search'
      });
    }

    res.status(500).json({
      error: 'Error fetching inventory data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update inventory quantity
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    inventory.quantity = quantity;
    inventory.lastUpdated = new Date();
    await inventory.save();

    // Invalidate cache
    const cacheKey = InventoryCache.generateKey(inventory.pharmacyId, inventory.medicineId);
    await InventoryCache.invalidateInventory(cacheKey);

    res.json(inventory);
  } catch (error) {
    logger.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Error updating inventory' });
  }
});

// Get alternative medicines when out of stock
router.get('/alternatives/:medicineId', async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { lat, lng } = req.query;

    // Find medicines in the same category that are in stock nearby
    const currentMedicine = await Inventory.findOne({ medicineId }).populate('medicineId');
    if (!currentMedicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const alternatives = await Inventory.find({
      'medicineId.category': currentMedicine.medicineId.category,
      medicineId: { $ne: medicineId },
      status: 'IN_STOCK',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 5000 // 5km radius
        }
      }
    }).populate('medicineId');

    res.json(alternatives);
  } catch (error) {
    logger.error('Error fetching alternative medicines:', error);
    res.status(500).json({ error: 'Error fetching alternatives' });
  }
});

// Batch update inventory
router.post('/batch-update', async (req, res) => {
  try {
    const { updates } = req.body;
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { 
          $set: { 
            quantity: update.quantity,
            lastUpdated: new Date()
          }
        }
      }
    }));

    const result = await Inventory.bulkWrite(bulkOps);

    // Invalidate cache for all updated items
    const invalidationPromises = updates.map(async update => {
      const inventory = await Inventory.findById(update.id);
      if (inventory) {
        const cacheKey = InventoryCache.generateKey(inventory.pharmacyId, inventory.medicineId);
        await InventoryCache.invalidateInventory(cacheKey);
      }
    });

    await Promise.all(invalidationPromises);

    res.json(result);
  } catch (error) {
    logger.error('Error in batch inventory update:', error);
    res.status(500).json({ error: 'Error updating inventory' });
  }
});

module.exports = router; 