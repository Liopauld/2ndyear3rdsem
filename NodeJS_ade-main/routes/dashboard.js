const express = require('express');
const router = express.Router();

const { monthlySalesChart, ordersOverTimeChart, topCategoriesChart } = require('../controllers/dashboard');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

// Admin-only dashboard charts
router.get('/monthly-sales-chart', isAuthenticatedUser, isAdmin, monthlySalesChart);
router.get('/orders-over-time-chart', isAuthenticatedUser, isAdmin, ordersOverTimeChart);
router.get('/top-categories-chart', isAuthenticatedUser, isAdmin, topCategoriesChart);

module.exports = router;




