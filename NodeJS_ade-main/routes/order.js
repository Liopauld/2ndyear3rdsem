const express = require('express');

const router = express.Router();

const { createOrder, getUserOrdersWithItems, getAllOrders, updateOrderStatus, deleteOrder, getOrderReceiptPdfEndpoint } = require('../controllers/order')
const { getCustomerByUserId } = require('../controllers/user')
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth')

router.post('/create-order', isAuthenticatedUser, createOrder)
router.get('/customer/profile/:user_id', isAuthenticatedUser, getCustomerByUserId);
router.get('/orders/user/:userId', isAuthenticatedUser, getUserOrdersWithItems);
router.get('/orders', isAuthenticatedUser, isAdmin, getAllOrders);
router.put('/orders/:orderId', isAuthenticatedUser, isAdmin, updateOrderStatus);
router.delete('/orders/:orderId', isAuthenticatedUser, isAdmin, deleteOrder);

const { getOrderReceiptHtmlEndpoint } = require('../controllers/order');
router.get('/orders/:orderId/receipt-html', isAuthenticatedUser, getOrderReceiptHtmlEndpoint);
router.get('/orders/:orderId/receipt-pdf', isAuthenticatedUser, getOrderReceiptPdfEndpoint);


module.exports = router;