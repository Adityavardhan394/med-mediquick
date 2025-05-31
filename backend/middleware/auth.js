const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AppError = require('../utils/appError');

exports.protect = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new AppError('Not authorized to access this route', 401);
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new AppError('User no longer exists', 401);
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        next(new AppError('Not authorized to access this route', 401));
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Not authorized to access this route', 403));
        }
        next();
    };
}; 