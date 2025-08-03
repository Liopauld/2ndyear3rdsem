const getOrderReceiptHtml = require('../utils/getOrderReceiptHtml');
// Endpoint: GET /orders/:orderId/receipt-html (returns HTML for receipt, user must own order)
exports.getOrderReceiptHtmlEndpoint = async (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).send('Unauthorized');
    // Check that the order belongs to the logged-in user
    const sql = `SELECT o.order_id FROM orders o INNER JOIN customer c ON o.customer_id = c.customer_id WHERE o.order_id = ? AND c.user_id = ?`;
    connection.execute(sql, [orderId, userId], async (err, rows) => {
        if (err || !rows.length) return res.status(403).send('Forbidden: You do not have access to this order.');
        try {
            const html = await getOrderReceiptHtml(orderId);
            res.set('Content-Type', 'text/html');
            res.send(html);
        } catch (e) {
            res.status(404).send('Receipt not found');
        }
    });
};
const connection = require('../config/database');
const sendEmail = require('../utils/sendEmail');
const { generateOrderReceiptPdfKit, generateOrderReceiptPdfKitLightweight } = require('../utils/order_receipt');

exports.createOrder = (req, res, next) => {
    const { cart, user } = req.body;
    console.log('createOrder called. user:', user, 'cart:', cart);
    if (!user || !user.id || !Array.isArray(cart) || cart.length === 0) {
        console.log('Missing user or cart is empty:', req.body);
        return res.status(400).json({ error: 'Missing user or cart is empty.' });
    }

    const dateOrdered = new Date();
    // No dateShipped at order creation, set to NULL
    const dateShipped = null;
    const shippingFee = 50.00; // Default, but now stored in DB

    connection.beginTransaction(err => {
        if (err) {
            console.log('Transaction error:', err);
            return res.status(500).json({ error: 'Transaction error', details: err });
        }

        // Get customer_id from userId
        const sql = 'SELECT customer_id, email FROM customer c INNER JOIN users u ON u.id = c.user_id WHERE u.id = ?';
        connection.execute(sql, [parseInt(user.id)], (err, results) => {
            if (err || results.length === 0) {
                console.log('Customer not found or SQL error:', err, results);
                return connection.rollback(() => {
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Customer not found', details: err });
                    }
                });
            }

            const { customer_id, email } = results[0];

            // Insert into orders table (now with shipping_fee)
            const orderSql = 'INSERT INTO orders (customer_id, date_ordered, status, shipping_fee) VALUES (?, ?, ?, ?)';
            connection.execute(orderSql, [customer_id, dateOrdered, 'processing', shippingFee], (err, result) => {
                if (err) {
                    console.log('Error inserting order:', err);
                    return connection.rollback(() => {
                        if (!res.headersSent) {
                            res.status(500).json({ error: 'Error inserting order', details: err });
                        }
                    });
                }

                const order_id = result.insertId;

                // Insert each cart item into orderline and update stock
                const orderLineSql = 'INSERT INTO orderline (order_id, item_id, quantity) VALUES (?, ?, ?)';
                const stockSql = 'UPDATE stock SET quantity = quantity - ? WHERE item_id = ? AND quantity >= ?';
                let errorOccurred = false;
                let completed = 0;

                console.log('Cart received for order:', cart);
                cart.forEach((item, idx) => {
                    console.log('Cart item:', item);
                    // Validate item_id and quantity
                    if (typeof item.item_id === 'undefined' || typeof item.quantity === 'undefined') {
                        errorOccurred = true;
                        console.log('Cart item missing item_id or quantity:', item);
                        return connection.rollback(() => {
                            if (!res.headersSent) {
                                res.status(400).json({ error: 'Cart item missing item_id or quantity', item });
                            }
                        });
                    }
                    // Insert into orderline
                    connection.execute(orderLineSql, [order_id, item.item_id, item.quantity], (err) => {
                        if (err && !errorOccurred) {
                            errorOccurred = true;
                            console.log('Error inserting orderline:', err);
                            return connection.rollback(() => {
                                if (!res.headersSent) {
                                    res.status(500).json({ error: 'Error inserting orderline', details: err });
                                }
                            });
                        }
                    });
                    // Deduct from stock
                    connection.execute(stockSql, [item.quantity, item.item_id, item.quantity], (err, stockResult) => {
                        if ((err || stockResult.affectedRows === 0) && !errorOccurred) {
                            errorOccurred = true;
                            console.log('Stock error: insufficient stock or update failed:', err, stockResult);
                            return connection.rollback(() => {
                                if (!res.headersSent) {
                                    res.status(500).json({ error: 'Stock error: insufficient stock or update failed', details: err });
                                }
                            });
                        }
                        completed++;
                        if (completed === cart.length && !errorOccurred) {
                            connection.commit(err => {
                                if (err) {
                                    console.log('Commit error:', err);
                                    return connection.rollback(() => {
                                        if (!res.headersSent) {
                                            res.status(500).json({ error: 'Commit error', details: err });
                                        }
                                    });
                                }
                                if (!res.headersSent) {
                                res.status(201).json({
                                    success: true,
                                    order_id,
                                    dateOrdered,
                                    message: 'Order placed successfully!',
                                    cart,
                                    shipping: shippingFee
                                });
                                }
                            });
                        }
                    });
                });
            });
        });
    });
};

exports.getUserOrdersWithItems = (req, res) => {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Get all orders for this user's customer_id, with customer info and ALL item images
    const sql = `
        SELECT 
            o.order_id, o.date_ordered, o.status,
            c.last_name, c.first_name, c.address, c.city, c.phone,
            oi.item_id, oi.quantity, i.name, i.sell_price,
            img.image_path
        FROM orders o
        INNER JOIN customer c ON o.customer_id = c.customer_id
        INNER JOIN users u ON c.user_id = u.id
        INNER JOIN orderline oi ON o.order_id = oi.order_id
        INNER JOIN items i ON oi.item_id = i.item_id
        LEFT JOIN items_images img ON i.item_id = img.item_id
        WHERE u.id = ?
        ORDER BY o.date_ordered DESC, o.order_id DESC, oi.item_id
    `;
    connection.execute(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error fetching orders', details: err });
        if (!rows.length) return res.status(200).json({ success: true, orders: [] });

        // Group by order_id, then by item_id, and aggregate images
        const ordersMap = {};
        rows.forEach(row => {
            if (!ordersMap[row.order_id]) {
                ordersMap[row.order_id] = {
                    order_id: row.order_id,
                    date_ordered: row.date_ordered,
                    status: row.status,
                    last_name: row.last_name,
                    first_name: row.first_name,
                    address: row.address,
                    city: row.city,
                    phone: row.phone,
                    shipping: row.shipping_fee !== undefined ? Number(row.shipping_fee) : 50.00,
                    items: {},
                };
            }
            // Group items by item_id
            if (!ordersMap[row.order_id].items[row.item_id]) {
                ordersMap[row.order_id].items[row.item_id] = {
                    item_id: row.item_id,
                    name: row.name,
                    quantity: row.quantity,
                    price: row.sell_price,
                    subtotal: row.sell_price * row.quantity,
                    images: [],
                };
            }
            // Add image if exists and not already in array
            if (row.image_path && !ordersMap[row.order_id].items[row.item_id].images.includes(row.image_path)) {
                ordersMap[row.order_id].items[row.item_id].images.push(row.image_path);
            }
        });
        // Convert items object to array for each order
        const orders = Object.values(ordersMap).map(order => {
            order.items = Object.values(order.items);
            return order;
        });
        res.status(200).json({ success: true, orders });
    });
};

// Admin: Get all orders with customer info
exports.getAllOrders = (req, res) => {
    const sql = `
        SELECT o.order_id, o.date_ordered, o.date_delivery, o.status, o.updated_at,
               c.customer_id, c.last_name, c.first_name, c.address, c.city, c.phone, u.email
        FROM orders o
        INNER JOIN customer c ON o.customer_id = c.customer_id
        INNER JOIN users u ON c.user_id = u.id
        ORDER BY o.date_ordered DESC, o.order_id DESC
    `;
    connection.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error fetching orders', details: err });
        res.status(200).json({ success: true, orders: rows });
    });
};

// Admin: Update order status
exports.updateOrderStatus = (req, res) => {
    const orderId = req.params.orderId;
    const { status } = req.body;
    if (!['processing', 'delivered', 'canceled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value.' });
    }
    let sql, params;
    if (status === 'delivered') {
        sql = `UPDATE orders SET status = ?, updated_at = NOW(), date_delivery = CURDATE() WHERE order_id = ?`;
        params = [status, orderId];
    } else {
        sql = `UPDATE orders SET status = ?, updated_at = NOW(), date_delivery = NULL WHERE order_id = ?`;
        params = [status, orderId];
    }

    // Helper to wrap connection.execute in a Promise
    function executeAsync(sql, params) {
        return new Promise((resolve, reject) => {
            connection.execute(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    // Helper to fetch order and items for PDF/email
    async function fetchOrderWithItems(orderId) {
        const orderSql = `
            SELECT o.order_id, o.date_ordered, o.status, o.shipping_fee,
                c.last_name, c.first_name, c.address, c.city, c.phone, u.email
            FROM orders o
            INNER JOIN customer c ON o.customer_id = c.customer_id
            INNER JOIN users u ON c.user_id = u.id
            WHERE o.order_id = ?
        `;
        const [orderRows] = await new Promise((resolve, reject) => {
            connection.execute(orderSql, [orderId], (err, rows) => {
                if (err) reject(err);
                else resolve([rows]);
            });
        });
        if (!orderRows.length) throw new Error('Order not found');
        const order = orderRows[0];
        const itemsSql = `
            SELECT oi.item_id, oi.quantity, i.name, i.sell_price, img.image_path
            FROM orderline oi
            INNER JOIN items i ON oi.item_id = i.item_id
            LEFT JOIN items_images img ON i.item_id = img.item_id
            WHERE oi.order_id = ?
            ORDER BY oi.item_id
        `;
        const [itemRows] = await new Promise((resolve, reject) => {
            connection.execute(itemsSql, [orderId], (err, rows) => {
                if (err) reject(err);
                else resolve([rows]);
            });
        });
        const itemsMap = {};
        itemRows.forEach(row => {
            if (!itemsMap[row.item_id]) {
                itemsMap[row.item_id] = {
                    item_id: row.item_id,
                    name: row.name,
                    quantity: row.quantity,
                    sell_price: row.sell_price,
                    images: [],
                };
            }
            if (row.image_path && !itemsMap[row.item_id].images.includes(row.image_path)) {
                itemsMap[row.item_id].images.push(row.image_path);
            }
        });
        order.items = Object.values(itemsMap);
        return order;
    }

    // Main logic with timeout
    (async () => {
        let timeoutHandle;
        let responded = false;
        // Set up a 10s timeout
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                if (!responded) {
                    responded = true;
                    reject(new Error('Timeout: Operation took longer than 10 seconds.'));
                }
            }, 10000);
        });

        // Main update and email logic
        const mainPromise = (async () => {
            try {
                // 1. Update order status in DB
                await executeAsync(sql, params);
                // 2. Fetch order and items
                const order = await fetchOrderWithItems(orderId);
                // 3. Generate PDF (try full version first, then lightweight for email)
                let pdfBuffer = await generateOrderReceiptPdfKit(order);
                console.log(`Full PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
                // 4. Send email
                const maxAttachmentSize = 5 * 1024 * 1024; // 5MB (reduced from 20MB for better email compatibility)
                let attachments = [];
                if (pdfBuffer.length < maxAttachmentSize) {
                    attachments = [{
                        filename: `OrderReceipt_${orderId}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }];
                } else {
                    // Try lightweight version for email
                    try {
                        const lightweightPdfBuffer = await generateOrderReceiptPdfKitLightweight(order);
                        console.log(`Lightweight PDF size: ${(lightweightPdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
                        if (lightweightPdfBuffer.length < maxAttachmentSize) {
                            attachments = [{
                                filename: `OrderReceipt_${orderId}.pdf`,
                                content: lightweightPdfBuffer,
                                contentType: 'application/pdf'
                            }];
                        }
                    } catch (e) {
                        console.log('Lightweight PDF generation failed:', e.message);
                    }
                }
                await sendEmail({
                    email: order.email,
                    subject: 'Order Status Updated',
                    message: `Your order #${orderId} status has been updated to: ${status}.` + (attachments.length ? ' Please see attached receipt.' : ' (Receipt PDF was too large to send by email.)'),
                    attachments
                });
                if (!responded) {
                    responded = true;
                    clearTimeout(timeoutHandle);
                    res.status(200).json({ success: true, message: 'Order status updated and email sent successfully.' });
                }
            } catch (err) {
                if (!responded) {
                    responded = true;
                    clearTimeout(timeoutHandle);
                    res.status(500).json({ error: err.message || 'Error updating order or sending email.' });
                }
            }
        })();

        // Race main logic and timeout
        try {
            await Promise.race([mainPromise, timeoutPromise]);
        } catch (err) {
            if (!responded) {
                responded = true;
                res.status(500).json({ error: err.message || 'Timeout or unknown error.' });
            }
        }
    })();
};

// Admin: Delete order and its orderlines
exports.deleteOrder = (req, res) => {
    const orderId = req.params.orderId;
    // Delete orderlines first due to FK constraint
    const deleteOrderlinesSql = 'DELETE FROM orderline WHERE order_id = ?';
    connection.execute(deleteOrderlinesSql, [orderId], (err) => {
        if (err) return res.status(500).json({ error: 'Error deleting orderlines', details: err });
        // Delete order
        const deleteOrderSql = 'DELETE FROM orders WHERE order_id = ?';
        connection.execute(deleteOrderSql, [orderId], (err2) => {
            if (err2) return res.status(500).json({ error: 'Error deleting order', details: err2 });
            res.status(200).json({ success: true, message: 'Order and orderlines deleted.' });
        });
    });
};

// Endpoint: GET /orders/:orderId/receipt-pdf (returns PDF for receipt using PDFKit)
exports.getOrderReceiptPdfEndpoint = async (req, res) => {
    const orderId = req.params.orderId;
    try {
        // Fetch order and items (same as in email logic)
        const orderSql = `
            SELECT o.order_id, o.date_ordered, o.status, o.shipping_fee,
                c.last_name, c.first_name, c.address, c.city, c.phone, u.email
            FROM orders o
            INNER JOIN customer c ON o.customer_id = c.customer_id
            INNER JOIN users u ON c.user_id = u.id
            WHERE o.order_id = ?
        `;
        connection.execute(orderSql, [orderId], async (orderErr, orderRows) => {
            if (orderErr || !orderRows.length) {
                return res.status(404).send('Receipt not found');
            }
            const order = orderRows[0];
            const itemsSql = `
                SELECT oi.item_id, oi.quantity, i.name, i.sell_price, img.image_path
                FROM orderline oi
                INNER JOIN items i ON oi.item_id = i.item_id
                LEFT JOIN items_images img ON i.item_id = img.item_id
                WHERE oi.order_id = ?
                ORDER BY oi.item_id
            `;
            connection.execute(itemsSql, [orderId], async (itemsErr, itemRows) => {
                if (itemsErr) {
                    return res.status(404).send('Receipt not found');
                }
                const itemsMap = {};
                itemRows.forEach(row => {
                    if (!itemsMap[row.item_id]) {
                        itemsMap[row.item_id] = {
                            item_id: row.item_id,
                            name: row.name,
                            quantity: row.quantity,
                            sell_price: row.sell_price,
                            images: [],
                        };
                    }
                    if (row.image_path && !itemsMap[row.item_id].images.includes(row.image_path)) {
                        itemsMap[row.item_id].images.push(row.image_path);
                    }
                });
                order.items = Object.values(itemsMap);
                try {
                    const pdfBuffer = await generateOrderReceiptPdfKit(order);
                    res.set({
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=OrderReceipt_${orderId}.pdf`
                    });
                    res.send(pdfBuffer);
                } catch (err) {
                    res.status(404).send('Receipt not found');
                }
            });
        });
    } catch (err) {
        res.status(404).send('Receipt not found');
    }
};

