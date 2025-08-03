const connection = require('../config/database');

// Create a new review
exports.createReview = (req, res) => {
    const { item_id, rating, review_text, order_id } = req.body;
    const userId = req.user && req.user.id;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!item_id || !rating) {
        return res.status(400).json({ error: 'item_id and rating are required' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get customer_id from user_id
    const getCustomerSql = 'SELECT customer_id FROM customer WHERE user_id = ?';
    connection.execute(getCustomerSql, [userId], (err, customerResults) => {
        if (err || !customerResults.length) {
            return res.status(500).json({ error: 'Customer not found', details: err });
        }

        const customer_id = customerResults[0].customer_id;

        // Check if customer has already reviewed this item
        const checkExistingSql = 'SELECT review_id FROM item_reviews WHERE customer_id = ? AND item_id = ?';
        connection.execute(checkExistingSql, [customer_id, item_id], (checkErr, existingResults) => {
            if (checkErr) {
                return res.status(500).json({ error: 'Error checking existing reviews', details: checkErr });
            }

            if (existingResults.length > 0) {
                return res.status(400).json({ error: 'You have already reviewed this item' });
            }

            // Create the review
            createReviewInDB(customer_id, item_id, rating, review_text, null, res);
        });
    });
};

// Helper function to insert review into database
function createReviewInDB(customer_id, item_id, rating, review_text, order_id, res) {
    const sql = `
        INSERT INTO item_reviews (item_id, customer_id, rating, review_text) 
        VALUES (?, ?, ?, ?)
    `;
    const values = [item_id, customer_id, rating, review_text];

    connection.execute(sql, values, (err, result) => {
        if (err) {
            // Check for duplicate review (unique constraint violation)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'You have already reviewed this item' });
            }
            return res.status(500).json({ error: 'Error creating review', details: err });
        }

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            review_id: result.insertId
        });
    });
}

// Get all reviews for a specific item
exports.getItemReviews = (req, res) => {
    const item_id = req.params.item_id;

    if (!item_id) {
        return res.status(400).json({ error: 'item_id is required' });
    }

    const sql = `
        SELECT 
            ir.review_id, ir.item_id, ir.rating, ir.review_text, 
            ir.created_at, ir.updated_at,
            c.first_name, c.last_name, c.image_path
        FROM item_reviews ir
        INNER JOIN customer c ON ir.customer_id = c.customer_id
        WHERE ir.item_id = ?
        ORDER BY ir.created_at DESC
    `;

    connection.execute(sql, [item_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching reviews', details: err });
        }

        // Calculate rating statistics
        if (rows.length > 0) {
            const totalRating = rows.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = (totalRating / rows.length).toFixed(1);
            const totalReviews = rows.length;

            // Count ratings by star
            const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            rows.forEach(review => {
                ratingCounts[review.rating]++;
            });

            res.status(200).json({
                success: true,
                reviews: rows,
                statistics: {
                    average_rating: parseFloat(averageRating),
                    total_reviews: totalReviews,
                    rating_breakdown: ratingCounts
                }
            });
        } else {
            res.status(200).json({
                success: true,
                reviews: [],
                statistics: {
                    average_rating: 0,
                    total_reviews: 0,
                    rating_breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                }
            });
        }
    });
};

// Get a single review by review_id
exports.getSingleReview = (req, res) => {
    const review_id = req.params.review_id;

    if (!review_id) {
        return res.status(400).json({ error: 'review_id is required' });
    }

    const sql = `
        SELECT 
            ir.review_id, ir.item_id, ir.rating, ir.review_text, 
            ir.created_at, ir.updated_at,
            c.customer_id, c.first_name, c.last_name, c.image_path,
            i.name as item_name
        FROM item_reviews ir
        INNER JOIN customer c ON ir.customer_id = c.customer_id
        INNER JOIN items i ON ir.item_id = i.item_id
        WHERE ir.review_id = ?
    `;

    connection.execute(sql, [review_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching review', details: err });
        }

        if (!rows.length) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.status(200).json({
            success: true,
            review: rows[0]
        });
    });
};

// Update a review (only by the review author)
exports.updateReview = (req, res) => {
    const review_id = req.params.review_id;
    const { rating, review_text } = req.body;
    const userId = req.user && req.user.id;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!rating && !review_text) {
        return res.status(400).json({ error: 'At least rating or review_text must be provided' });
    }

    if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get customer_id from user_id
    const getCustomerSql = 'SELECT customer_id FROM customer WHERE user_id = ?';
    connection.execute(getCustomerSql, [userId], (err, customerResults) => {
        if (err || !customerResults.length) {
            return res.status(500).json({ error: 'Customer not found', details: err });
        }

        const customer_id = customerResults[0].customer_id;

        // Check if the review exists and belongs to this customer
        const checkReviewSql = 'SELECT * FROM item_reviews WHERE review_id = ? AND customer_id = ?';
        connection.execute(checkReviewSql, [review_id, customer_id], (checkErr, checkResults) => {
            if (checkErr) {
                return res.status(500).json({ error: 'Error checking review ownership', details: checkErr });
            }

            if (!checkResults.length) {
                return res.status(404).json({ error: 'Review not found or you do not have permission to edit it' });
            }

            // Build dynamic update query
            let updateFields = [];
            let updateValues = [];

            if (rating) {
                updateFields.push('rating = ?');
                updateValues.push(rating);
            }

            if (review_text !== undefined) {
                updateFields.push('review_text = ?');
                updateValues.push(review_text);
            }

            updateValues.push(review_id);

            const updateSql = `UPDATE item_reviews SET ${updateFields.join(', ')} WHERE review_id = ?`;

            connection.execute(updateSql, updateValues, (updateErr, result) => {
                if (updateErr) {
                    return res.status(500).json({ error: 'Error updating review', details: updateErr });
                }

                res.status(200).json({
                    success: true,
                    message: 'Review updated successfully'
                });
            });
        });
    });
};

// Delete a review (only by the review author or admin)
exports.deleteReview = (req, res) => {
    const review_id = req.params.review_id;
    const userId = req.user && req.user.id;
    const userRole = req.user && req.user.role;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (userRole === 'admin') {
        // Admin can delete any review
        const deleteSql = 'DELETE FROM item_reviews WHERE review_id = ?';
        connection.execute(deleteSql, [review_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error deleting review', details: err });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Review not found' });
            }

            res.status(200).json({
                success: true,
                message: 'Review deleted successfully'
            });
        });
    } else {
        // Regular user can only delete their own reviews
        const getCustomerSql = 'SELECT customer_id FROM customer WHERE user_id = ?';
        connection.execute(getCustomerSql, [userId], (err, customerResults) => {
            if (err || !customerResults.length) {
                return res.status(500).json({ error: 'Customer not found', details: err });
            }

            const customer_id = customerResults[0].customer_id;

            const deleteSql = 'DELETE FROM item_reviews WHERE review_id = ? AND customer_id = ?';
            connection.execute(deleteSql, [review_id, customer_id], (deleteErr, result) => {
                if (deleteErr) {
                    return res.status(500).json({ error: 'Error deleting review', details: deleteErr });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Review not found or you do not have permission to delete it' });
                }

                res.status(200).json({
                    success: true,
                    message: 'Review deleted successfully'
                });
            });
        });
    }
};

// Get all reviews by a specific customer (for user profile)
exports.getCustomerReviews = (req, res) => {
    const userId = req.user && req.user.id;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Get customer_id from user_id
    const getCustomerSql = 'SELECT customer_id FROM customer WHERE user_id = ?';
    connection.execute(getCustomerSql, [userId], (err, customerResults) => {
        if (err || !customerResults.length) {
            return res.status(500).json({ error: 'Customer not found', details: err });
        }

        const customer_id = customerResults[0].customer_id;

        const sql = `
            SELECT 
                ir.review_id, ir.item_id, ir.rating, ir.review_text, 
                ir.created_at, ir.updated_at,
                i.name as item_name
            FROM item_reviews ir
            INNER JOIN items i ON ir.item_id = i.item_id
            WHERE ir.customer_id = ?
            ORDER BY ir.created_at DESC
        `;

        connection.execute(sql, [customer_id], (queryErr, rows) => {
            if (queryErr) {
                return res.status(500).json({ error: 'Error fetching customer reviews', details: queryErr });
            }

            res.status(200).json({
                success: true,
                reviews: rows
            });
        });
    });
};

// Admin: Get all reviews with pagination
exports.getAllReviews = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sql = `
        SELECT 
            ir.review_id, ir.item_id, ir.rating, ir.review_text, 
            ir.created_at, ir.updated_at,
            c.customer_id, c.first_name, c.last_name,
            i.name as item_name
        FROM item_reviews ir
        INNER JOIN customer c ON ir.customer_id = c.customer_id
        INNER JOIN items i ON ir.item_id = i.item_id
        ORDER BY ir.created_at DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = 'SELECT COUNT(*) as total FROM item_reviews';

    connection.execute(countSql, [], (countErr, countResults) => {
        if (countErr) {
            return res.status(500).json({ error: 'Error counting reviews', details: countErr });
        }

        const totalReviews = countResults[0].total;
        const totalPages = Math.ceil(totalReviews / limit);

        connection.execute(sql, [limit, offset], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Error fetching reviews', details: err });
            }

            res.status(200).json({
                success: true,
                reviews: rows,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_reviews: totalReviews,
                    per_page: limit
                }
            });
        });
    });
};
