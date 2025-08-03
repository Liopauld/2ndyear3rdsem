// PDFKit-based order receipt PDF generator
// Usage: const generateOrderReceiptPdfKit = require('./order_receipt');
//        const pdfBuffer = await generateOrderReceiptPdfKit(order);

const PDFDocument = require('pdfkit');
const axios = require('axios');

/**
 * Generates a PDF buffer for an order receipt using PDFKit.
 * @param {Object} order - The order object (must include items, customer info, etc.)
 * @returns {Promise<Buffer>} - The generated PDF buffer
 */
async function generateOrderReceiptPdfKit(order) {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // --- GADGETESSENCE STYLED HEADER BAR ---
        doc.save();
        // Create gradient-like effect with multiple rectangles (PDFKit doesn't support true gradients)
        doc.rect(0, 0, doc.page.width, 60).fill('#667eea');
        doc.rect(0, 0, doc.page.width, 60).fillOpacity(0.8).fill('#764ba2');
        doc.fillOpacity(1);
        
        // GadgetEssence branding
        doc.fillColor('#00d4ff').font('Helvetica-Bold').fontSize(24).text('GadgetEssence', 20, 15);
        doc.fillColor('#e0e7ff').font('Helvetica').fontSize(10).text('Your Ultimate Tech Destination', 22, 38);
        
        // Order info on the right
        doc.fillColor('white').font('Helvetica-Bold').fontSize(16).text(`Order #${order.order_id || ''}`, 350, 15);
        doc.fillColor('#f0f8ff').font('Helvetica').fontSize(12).text(`Date: ${formatDate(order.date_ordered)}`, 350, 35);
        doc.restore();

        // --- GADGETESSENCE CUSTOMER & ORDER DETAILS ---
        doc.moveDown(3);
        
        // Customer Info Section with gradient-style background
        const detailsY = 80;
        doc.rect(30, detailsY, 250, 85).fill('#f5f7fa').stroke('#667eea');
        doc.fontSize(14).fillColor('#2c3e50').font('Helvetica-Bold').text('Customer Information', 40, detailsY + 10);
        
        doc.font('Helvetica').fontSize(11).fillColor('#34495e');
        doc.text(`Name: `, 40, detailsY + 30, { continued: true, font: 'Helvetica-Bold' });
        doc.font('Helvetica').fillColor('#2c3e50').text(`${order.last_name || ''}, ${order.first_name || ''}`);
        doc.font('Helvetica-Bold').fillColor('#34495e').text('Address: ', 40, detailsY + 50, { continued: true });
        doc.font('Helvetica').fillColor('#2c3e50').text(`${order.address || ''}${order.city ? ', ' + order.city : ''}`);
        doc.font('Helvetica-Bold').fillColor('#34495e').text('Phone: ', 40, detailsY + 65, { continued: true });
        doc.font('Helvetica').fillColor('#2c3e50').text(`${order.phone || ''}`);

        // Order Details Section
        doc.rect(320, detailsY, 220, 85).fill('#f8f9fa').stroke('#764ba2');
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#2c3e50').text('Order Details', 330, detailsY + 10);
        doc.font('Helvetica').fontSize(11).fillColor('#34495e');
        doc.font('Helvetica-Bold').text('Status: ', 330, detailsY + 35, { continued: true });
        
        // Status with color coding
        const statusColor = order.status === 'delivered' ? '#27ae60' : 
                          order.status === 'processing' ? '#3498db' : 
                          order.status === 'canceled' ? '#e74c3c' : '#95a5a6';
        doc.font('Helvetica').fillColor(statusColor).text(`${order.status || ''}`);
        
        doc.font('Helvetica-Bold').fillColor('#34495e').text('Order ID: ', 330, detailsY + 50, { continued: true });
        doc.font('Helvetica').fillColor('#667eea').text(`#${order.order_id || ''}`);
        doc.font('Helvetica-Bold').fillColor('#34495e').text('Date: ', 330, detailsY + 65, { continued: true });
        doc.font('Helvetica').fillColor('#2c3e50').text(`${formatDate(order.date_ordered) || ''}`);

        // --- GADGETESSENCE ITEMS TABLE ---
        doc.moveDown(4);
        const tableTop = 180;
        const col = {
            img: 30,
            name: 100,
            price: 300,
            qty: 370,
            subtotal: 420
        };
        const rowHeight = 48;
        
        // GadgetEssence Table Header with gradient-style
        doc.font('Helvetica-Bold').fontSize(12);
        doc.rect(col.img, tableTop, 450, 35).fill('#667eea').stroke('#764ba2');
        doc.fillColor('#ffffff').text('Images', col.img + 5, tableTop + 12, { width: 60, align: 'center' });
        doc.text('Product Name', col.name, tableTop + 12, { width: 180, align: 'left' });
        doc.text('Price', col.price, tableTop + 12, { width: 50, align: 'right' });
        doc.text('Qty', col.qty, tableTop + 12, { width: 30, align: 'right' });
        doc.text('Subtotal', col.subtotal, tableTop + 12, { width: 60, align: 'right' });

        // GadgetEssence Table Rows with modern styling
        let total = 0;
        let y = tableTop + 35;
        let rowIndex = 0;
        for (const item of order.items || []) {
            let price = Number(item.sell_price !== undefined ? item.sell_price : item.price) || 0;
            let subtotal = price * (item.quantity || 1);
            total += subtotal;
            
            // Alternating row colors for better readability
            const rowColor = rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(col.img, y, 450, rowHeight).fill(rowColor).stroke('#e9ecef');
            // Images (up to 3 per item)
            let imgX = col.img + 5;
            let imgCount = 0;
            if (item.images && item.images.length) {
                let imageDrawn = false;
                // Only use the first image to reduce PDF size
                const imgUrlRaw = item.images[0];
                if (imgUrlRaw) {
                    // Ensure absolute URL for local images
                    let imgUrl = imgUrlRaw;
                    if (imgUrl && !/^https?:\/\//i.test(imgUrl)) {
                        // Prepend server URL if not already absolute
                        const serverUrl = process.env.SERVER_URL || 'http://localhost:4000';
                        imgUrl = imgUrl.replace(/^\/+/, '');
                        imgUrl = `${serverUrl}/${imgUrl}`;
                    }
                    try {
                        const response = await axios.get(imgUrl, { 
                            responseType: 'arraybuffer',
                            timeout: 5000, // 5 second timeout
                            maxContentLength: 500 * 1024 // 500KB max image size
                        });
                        // Use rounded image with border for GadgetEssence style
                        doc.save();
                        doc.circle(imgX + 16, y + 20, 15).clip();
                        doc.image(response.data, imgX + 1, y + 5, { width: 30, height: 30, fit: [30, 30] });
                        doc.restore();
                        doc.circle(imgX + 16, y + 20, 15).stroke('#667eea');
                        imageDrawn = true;
                    } catch (e) {
                        // Ignore image errors
                    }
                }
                if (!imageDrawn) {
                    doc.font('Helvetica').fontSize(8).fillColor('#95a5a6').text('No image', col.img + 5, y + 18, { width: 60, align: 'center' });
                }
            } else {
                doc.font('Helvetica').fontSize(8).fillColor('#95a5a6').text('No image', col.img + 5, y + 18, { width: 60, align: 'center' });
            }
            
            // Product name with GadgetEssence styling
            doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(11).text(item.name || '', col.name, y + 12, { width: 180, align: 'left' });
            
            // Price with currency styling
            doc.fillColor('#e74c3c').font('Helvetica-Bold').fontSize(11).text(`P${price.toFixed(2)}`, col.price, y + 16, { width: 50, align: 'right' });
            
            // Quantity
            doc.fillColor('#34495e').font('Helvetica').fontSize(11).text(item.quantity || 1, col.qty, y + 16, { width: 30, align: 'right' });
            
            // Subtotal with emphasis
            doc.fillColor('#27ae60').font('Helvetica-Bold').fontSize(11).text(`P${subtotal.toFixed(2)}`, col.subtotal, y + 16, { width: 60, align: 'right' });
            
            y += rowHeight;
            rowIndex++;
        }

        // --- GADGETESSENCE TOTALS SECTION ---
        const shippingFee = typeof order.shipping_fee !== 'undefined' ? Number(order.shipping_fee) : 50.0;
        
        // Totals background box
        doc.rect(280, y + 15, 220, 80).fill('#f5f7fa').stroke('#667eea');
        
        // Gradient-style line separator
        doc.moveTo(col.img, y + 8).lineTo(col.img + 450, y + 8).strokeColor('#667eea').lineWidth(2).stroke();
        
        // Items total
        doc.font('Helvetica').fontSize(11).fillColor('#34495e');
        doc.text(`Items Total:`, 290, y + 25, { width: 130, align: 'left' });
        doc.fillColor('#2c3e50').font('Helvetica-Bold').text(`P${total.toFixed(2)}`, 420, y + 25, { width: 70, align: 'right' });
        
        // Shipping fee
        doc.font('Helvetica').fontSize(11).fillColor('#34495e');
        doc.text(`Shipping Fee:`, 290, y + 45, { width: 130, align: 'left' });
        doc.fillColor('#e67e22').font('Helvetica-Bold').text(`P${shippingFee.toFixed(2)}`, 420, y + 45, { width: 70, align: 'right' });
        
        // Grand total with emphasis
        doc.rect(285, y + 60, 210, 25).fill('#667eea').stroke('#764ba2');
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff');
        doc.text(`GRAND TOTAL:`, 290, y + 68, { width: 140, align: 'left' });
        doc.fontSize(14).text(`P${(total + shippingFee).toFixed(2)}`, 430, y + 67, { width: 60, align: 'right' });
        
        // Footer with GadgetEssence branding
        doc.font('Helvetica').fontSize(9).fillColor('#95a5a6');
        doc.text('Thank you for choosing GadgetEssence! Your Ultimate Tech Destination', 30, y + 120, { width: 450, align: 'center' });
        doc.text('Visit us at www.gadgetessence.com for more amazing tech products!', 30, y + 135, { width: 450, align: 'center' });

        doc.end();

        // Helper for date formatting
        function formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
        }
    });
}

/**
 * Generates a lightweight PDF buffer for email attachments (no images, simplified layout).
 * @param {Object} order - The order object
 * @returns {Promise<Buffer>} - The generated PDF buffer (much smaller)
 */
async function generateOrderReceiptPdfKitLightweight(order) {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // --- GADGETESSENCE LIGHTWEIGHT HEADER ---
        doc.save();
        // Create gradient-like effect with multiple rectangles
        doc.rect(0, 0, doc.page.width, 50).fill('#667eea');
        doc.rect(0, 0, doc.page.width, 50).fillOpacity(0.8).fill('#764ba2');
        doc.fillOpacity(1);
        
        // GadgetEssence branding (compact)
        doc.fillColor('#00d4ff').font('Helvetica-Bold').fontSize(20).text('GadgetEssence', 20, 12);
        doc.fillColor('#f0f8ff').font('Helvetica').fontSize(8).text('Email Receipt', 22, 32);
        
        // Order info on the right
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text(`Order #${order.order_id || ''}`, 350, 12);
        doc.fillColor('#f0f8ff').font('Helvetica').fontSize(10).text(`${formatDate(order.date_ordered)}`, 350, 30);
        doc.restore();

        // --- LIGHTWEIGHT CUSTOMER & ORDER DETAILS ---
        doc.moveDown(2);
        
        // Compact customer info
        doc.fontSize(12).fillColor('#2c3e50').font('Helvetica-Bold').text('Customer:', 30, 70);
        doc.font('Helvetica').fontSize(10).fillColor('#34495e');
        doc.text(`${order.last_name || ''}, ${order.first_name || ''}`, 100, 70);
        doc.text(`Address: ${order.address || ''}${order.city ? ', ' + order.city : ''}`, 30, 85);
        doc.text(`Phone: ${order.phone || ''}`, 30, 100);

        // Compact order details
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50').text('Status:', 350, 70);
        const statusColor = order.status === 'delivered' ? '#27ae60' : 
                          order.status === 'processing' ? '#3498db' : 
                          order.status === 'canceled' ? '#e74c3c' : '#95a5a6';
        doc.font('Helvetica').fontSize(10).fillColor(statusColor).text(`${order.status || ''}`, 400, 70);

        // --- LIGHTWEIGHT ITEMS TABLE (NO IMAGES) ---
        doc.moveDown(3);
        const tableTop = 130;
        const col = {
            name: 50,
            price: 300,
            qty: 370,
            subtotal: 420
        };
        const rowHeight = 22;
        
        // Lightweight Table Header with GadgetEssence styling
        doc.font('Helvetica-Bold').fontSize(11);
        doc.rect(col.name, tableTop, 430, 25).fill('#667eea').stroke('#764ba2');
        doc.fillColor('#ffffff').text('Product Name', col.name + 5, tableTop + 7, { width: 240, align: 'left' });
        doc.text('Price', col.price, tableTop + 7, { width: 50, align: 'right' });
        doc.text('Qty', col.qty, tableTop + 7, { width: 30, align: 'right' });
        doc.text('Total', col.subtotal, tableTop + 7, { width: 60, align: 'right' });

        // Lightweight Table Rows
        let total = 0;
        let y = tableTop + 25;
        let rowIndex = 0;
        for (const item of order.items || []) {
            let price = Number(item.sell_price !== undefined ? item.sell_price : item.price) || 0;
            let subtotal = price * (item.quantity || 1);
            total += subtotal;
            
            // Alternating row colors
            const rowColor = rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(col.name, y, 430, rowHeight).fill(rowColor).stroke('#e9ecef');
            
            // Item details with GadgetEssence colors
            doc.fillColor('#2c3e50').font('Helvetica').fontSize(9);
            doc.text(item.name || '', col.name + 5, y + 6, { width: 240, align: 'left' });
            doc.fillColor('#e74c3c').font('Helvetica-Bold').text(`P${price.toFixed(2)}`, col.price, y + 6, { width: 50, align: 'right' });
            doc.fillColor('#34495e').font('Helvetica').text(item.quantity || 1, col.qty, y + 6, { width: 30, align: 'right' });
            doc.fillColor('#27ae60').font('Helvetica-Bold').text(`P${subtotal.toFixed(2)}`, col.subtotal, y + 6, { width: 60, align: 'right' });
            y += rowHeight;
            rowIndex++;
        }

        // --- LIGHTWEIGHT TOTALS ---
        const shippingFee = typeof order.shipping_fee !== 'undefined' ? Number(order.shipping_fee) : 50.0;
        // Compact totals with GadgetEssence styling
        doc.moveTo(col.name, y + 5).lineTo(col.name + 430, y + 5).strokeColor('#667eea').lineWidth(1).stroke();
        
        doc.font('Helvetica').fontSize(10).fillColor('#34495e');
        doc.text(`Items:`, col.subtotal - 100, y + 15, { width: 100, align: 'right' });
        doc.fillColor('#2c3e50').font('Helvetica-Bold').text(`P${total.toFixed(2)}`, col.subtotal, y + 15, { width: 60, align: 'right' });
        
        doc.font('Helvetica').fontSize(10).fillColor('#34495e');
        doc.text(`Shipping:`, col.subtotal - 100, y + 30, { width: 100, align: 'right' });
        doc.fillColor('#e67e22').font('Helvetica-Bold').text(`P${shippingFee.toFixed(2)}`, col.subtotal, y + 30, { width: 60, align: 'right' });
        
        // Grand total
        doc.rect(col.subtotal - 105, y + 45, 165, 20).fill('#667eea').stroke('#764ba2');
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
        doc.text(`TOTAL:`, col.subtotal - 100, y + 50, { width: 100, align: 'right' });
        doc.fontSize(12).text(`P${(total + shippingFee).toFixed(2)}`, col.subtotal, y + 50, { width: 60, align: 'right' });
        
        // Compact footer
        doc.font('Helvetica').fontSize(8).fillColor('#95a5a6');
        doc.text('Thanks for choosing GadgetEssence!', 30, y + 80, { width: 450, align: 'center' });

        doc.end();

        // Helper for date formatting
        function formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
        }
    });
}

module.exports = {
    generateOrderReceiptPdfKit,
    generateOrderReceiptPdfKitLightweight
};
