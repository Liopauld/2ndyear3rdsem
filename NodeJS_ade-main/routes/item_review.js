const express = require('express');
const router = express.Router();

const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

const { 
    createReview,
    getItemReviews,
    getSingleReview,
    updateReview,
    deleteReview,
    getCustomerReviews,
    getAllReviews
} = require('../controllers/item_review');

// Public routes (no authentication required)
router.get('/items/:item_id/reviews', getItemReviews); // Get all reviews for a specific item
router.get('/reviews/:review_id', getSingleReview); // Get single review details

// Protected routes (authentication required)
router.post('/reviews', isAuthenticatedUser, createReview); // Create a new review
router.put('/reviews/:review_id', isAuthenticatedUser, updateReview); // Update own review
router.delete('/reviews/:review_id', isAuthenticatedUser, deleteReview); // Delete own review or admin delete any
router.get('/my-reviews', isAuthenticatedUser, getCustomerReviews); // Get all reviews by authenticated user

// Admin only routes
router.get('/admin/reviews', isAuthenticatedUser, isAdmin, getAllReviews); // Get all reviews with pagination

module.exports = router;
