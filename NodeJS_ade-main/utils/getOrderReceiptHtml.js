const connection = require('../config/database');
const sendEmail = require('../utils/sendEmail');
const generatePdfFromHtml = require('../utils/generatePdfFromHtml');

// Returns HTML string for a single order receipt (for PDF/email)
async function getOrderReceiptHtml(orderId) {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:4000'; // <-- Add this line
    return new Promise((resolve, reject) => {
        // Query order, customer, and items
        const sql = `
            SELECT o.order_id, o.date_ordered, o.date_delivery, o.status,
                   c.last_name, c.first_name, c.address, c.city, c.phone, u.email,
                   oi.item_id, oi.quantity, i.name, i.sell_price,
                   img.image_path
            FROM orders o
            INNER JOIN customer c ON o.customer_id = c.customer_id
            INNER JOIN users u ON c.user_id = u.id
            INNER JOIN orderline oi ON o.order_id = oi.order_id
            INNER JOIN items i ON oi.item_id = i.item_id
            LEFT JOIN items_images img ON i.item_id = img.item_id
            WHERE o.order_id = ?
            ORDER BY oi.item_id
        `;
        connection.execute(sql, [orderId], (err, rows) => {
            if (err || !rows.length) return reject('Order not found');
            const order = rows[0];
            // Group items and images
            const itemsMap = {};
            rows.forEach(row => {
                if (!itemsMap[row.item_id]) {
                    itemsMap[row.item_id] = {
                        name: row.name,
                        quantity: row.quantity,
                        price: row.sell_price,
                        images: []
                    };
                }
                if (row.image_path && !itemsMap[row.item_id].images.includes(row.image_path)) {
                    // Prepend server URL if not already absolute
                    const imgUrl = row.image_path.startsWith('http') ? row.image_path : `${serverUrl}/${row.image_path.replace(/^\/+/, '')}`;
                    itemsMap[row.item_id].images.push(imgUrl);
                }
            });
            const items = Object.values(itemsMap);
            // Build HTML
            let html = `
            <html><head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GadgetEssence - Order Receipt #${order.order_id}</title>
            <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                padding: 20px;
                color: #2c3e50;
            }
            
            .receipt-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .receipt-header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff; 
                padding: 30px;
                position: relative;
                overflow: hidden;
            }
            
            .receipt-header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: shimmer 3s ease-in-out infinite;
            }
            
            @keyframes shimmer {
                0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            
            .header-content {
                position: relative;
                z-index: 2;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .company-info h1 {
                font-size: 2.2em;
                font-weight: bold;
                margin-bottom: 5px;
                color: #00d4ff;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .company-tagline {
                font-size: 0.9em;
                color: #e0e7ff;
                font-style: italic;
            }
            
            .order-meta {
                text-align: right;
                color: #f0f8ff;
            }
            
            .order-number {
                font-size: 1.4em;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .order-date {
                font-size: 0.9em;
                opacity: 0.9;
            }
            
            .receipt-content {
                padding: 30px;
            }
            
            .receipt-section { 
                margin-bottom: 30px; 
                padding: 20px;
                border-radius: 8px;
                background: #f8f9fa;
                border-left: 4px solid #667eea;
            }
            
            .section-title {
                font-size: 1.2em;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .section-title::before {
                content: '●';
                color: #667eea;
                font-size: 1.5em;
            }
            
            .customer-details, .order-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
                margin-bottom: 12px;
            }
            
            .detail-label {
                font-weight: bold;
                color: #34495e;
                font-size: 0.9em;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .detail-value {
                color: #2c3e50;
                font-size: 1.1em;
                font-weight: 500;
                line-height: 1.4;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8em;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .status-processing { background: #3498db; color: white; }
            .status-delivered { background: #27ae60; color: white; }
            .status-canceled { background: #e74c3c; color: white; }
            
            .items-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .items-table th { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 10px;
                text-align: left;
                font-weight: bold;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .items-table td { 
                border: none;
                padding: 15px 10px;
                border-bottom: 1px solid #e9ecef;
                background: white;
            }
            
            .items-table tr:nth-child(even) td {
                background: #f8f9fa;
            }
            
            .items-table tr:hover td {
                background: #e3f2fd;
                transition: background-color 0.3s ease;
            }
            
            .img-thumb { 
                width: 50px; 
                height: 50px; 
                object-fit: cover; 
                border-radius: 8px; 
                margin-right: 5px;
                border: 2px solid #667eea;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .no-image {
                display: inline-block;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #f1f3f4 0%, #e8eaf6 100%);
                border-radius: 8px;
                border: 2px dashed #95a5a6;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7em;
                color: #95a5a6;
                text-align: center;
            }
            
            .price-cell {
                font-weight: bold;
                color: #e74c3c;
            }
            
            .qty-cell {
                text-align: center;
                font-weight: bold;
                color: #34495e;
            }
            
            .subtotal-cell {
                font-weight: bold;
                color: #27ae60;
                text-align: right;
            }
            
            .totals-section {
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border-radius: 8px;
                padding: 20px;
                margin-top: 20px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .total-row:last-child {
                border-bottom: none;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                margin: 10px -20px -20px -20px;
                padding: 15px 20px;
                border-radius: 0 0 8px 8px;
                font-size: 1.1em;
                font-weight: bold;
            }
            
            .total-label {
                font-weight: 600;
                color: #34495e;
            }
            
            .total-value {
                font-weight: bold;
                font-size: 1.1em;
            }
            
            .items-total { color: #2c3e50; }
            .shipping-total { color: #e67e22; }
            .grand-total { color: white; }
            
            .footer-message {
                text-align: center;
                margin-top: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                font-size: 0.9em;
                line-height: 1.6;
            }
            
            .footer-message h3 {
                margin-bottom: 10px;
                color: #00d4ff;
            }
            
            @media print {
                body { background: white; padding: 0; }
                .receipt-container { box-shadow: none; border-radius: 0; }
                .receipt-header::before { display: none; }
            }
            
            @media (max-width: 768px) {
                .header-content { flex-direction: column; text-align: center; gap: 15px; }
                .order-meta { text-align: center; }
                .customer-details, .order-details { grid-template-columns: 1fr; }
                .items-table th, .items-table td { padding: 10px 5px; font-size: 0.8em; }
                .img-thumb { width: 40px; height: 40px; }
                .receipt-content { padding: 20px 15px; }
            }
            </style>
            </head><body>
            <div class="receipt-container">
                <div class="receipt-header">
                    <div class="header-content">
                        <div class="company-info">
                            <h1>GadgetEssence</h1>
                            <div class="company-tagline">Your Ultimate Tech Destination</div>
                        </div>
                        <div class="order-meta">
                            <div class="order-number">Order #${order.order_id}</div>
                            <div class="order-date">${order.date_ordered ? new Date(order.date_ordered).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            }) : ''}</div>
                        </div>
                    </div>
                </div>
                
                <div class="receipt-content">
                    <div class="receipt-section">
                        <div class="section-title">Customer Information</div>
                        <div class="customer-details">
                            <div class="detail-item">
                                <div class="detail-label">Full Name</div>
                                <div class="detail-value">${order.last_name}, ${order.first_name}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Delivery Address</div>
                                <div class="detail-value">${order.address}${order.city ? ', ' + order.city : ''}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Phone Number</div>
                                <div class="detail-value">${order.phone}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Email Address</div>
                                <div class="detail-value">${order.email}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="receipt-section">
                        <div class="section-title">Order Information</div>
                        <div class="order-details">
                            <div class="detail-item">
                                <div class="detail-label">Order Status</div>
                                <div class="detail-value">
                                    <span class="status-badge status-${order.status}">${order.status}</span>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Date Delivered</div>
                                <div class="detail-value">${order.date_delivery ? new Date(order.date_delivery).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                }) : 'Not yet delivered'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="receipt-section">
                        <div class="section-title">Order Items</div>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th style="width: 80px;">Images</th>
                                    <th>Product Name</th>
                                    <th style="width: 100px;">Unit Price</th>
                                    <th style="width: 80px;">Quantity</th>
                                    <th style="width: 120px;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            let total = 0;
            items.forEach(item => {
                const price = Number(item.price) || 0;
                const subtotal = price * (item.quantity || 1);
                total += subtotal;
                let imagesHtml = '';
                if (Array.isArray(item.images) && item.images.length > 0) {
                    imagesHtml = item.images.slice(0, 2).map(imgPath => 
                        `<img src='${imgPath}' class='img-thumb' alt='Product Image' />`
                    ).join('');
                } else {
                    imagesHtml = `<div class="no-image">No Image</div>`;
                }
                
                html += `<tr>
                    <td>${imagesHtml}</td>
                    <td style="font-weight: 600; color: #2c3e50;">${item.name}</td>
                    <td class="price-cell">₱${price.toFixed(2)}</td>
                    <td class="qty-cell">${item.quantity}</td>
                    <td class="subtotal-cell">₱${subtotal.toFixed(2)}</td>
                </tr>`;
            });
            const shipping = 50.00;
            html += `
                            </tbody>
                        </table>
                        
                        <div class="totals-section">
                            <div class="total-row">
                                <span class="total-label">Items Total:</span>
                                <span class="total-value items-total">₱${total.toFixed(2)}</span>
                            </div>
                            <div class="total-row">
                                <span class="total-label">Shipping Fee:</span>
                                <span class="total-value shipping-total">₱${shipping.toFixed(2)}</span>
                            </div>
                            <div class="total-row">
                                <span class="total-label">GRAND TOTAL:</span>
                                <span class="total-value grand-total">₱${(total + shipping).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer-message">
                        <h3>Thank you for choosing GadgetEssence!</h3>
                        <p>Your Ultimate Tech Destination - We appreciate your business and trust in our products.</p>
                        <p>Visit us at <strong>www.gadgetessence.com</strong> for more amazing tech products!</p>
                        <p style="margin-top: 10px; font-size: 0.8em; opacity: 0.9;">
                            For any questions or support, please contact our customer service team.
                        </p>
                    </div>
                </div>
            </div>
            </body></html>
            `;
            resolve(html);
        });
    });
}

module.exports = getOrderReceiptHtml;
