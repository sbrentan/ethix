const express = require('express');
const router = express.Router();

// Import route handlers from separate files
const rootRoutes = require('./root');
const authRoutes = require('./authRoutes');
const usersRoutes = require('./usersRoutes');

// Use the route handlers with their respective prefixes
router.use('/', rootRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

module.exports = router;