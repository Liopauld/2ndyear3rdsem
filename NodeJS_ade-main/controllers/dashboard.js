const connection = require('../config/database');

// BAR CHART: Monthly Sales Revenue
exports.monthlySalesChart = (req, res) => {
    const sql = `
        SELECT 
            MONTHNAME(o.date_ordered) as month,
            MONTH(o.date_ordered) as month_num,
            SUM(ol.quantity * i.sell_price) as total_revenue
        FROM orders o 
        INNER JOIN orderline ol ON o.order_id = ol.order_id 
        INNER JOIN items i ON i.item_id = ol.item_id 
        WHERE o.status != 'canceled' AND o.date_ordered >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY MONTH(o.date_ordered), MONTHNAME(o.date_ordered)
        ORDER BY month_num
    `;
    
    try {
        connection.query(sql, (err, rows) => {
            if (err) {
                console.log('Monthly Sales Chart Error:', err);
                return res.status(500).json({ error: 'Error fetching monthly sales data', details: err });
            }
            return res.status(200).json({
                success: true,
                type: 'bar',
                title: 'Monthly Sales Revenue',
                data: rows
            });
        });
    } catch (error) {
        console.log('Monthly Sales Chart Exception:', error);
        return res.status(500).json({ error: 'Server error', details: error });
    }
};

// LINE CHART: Orders Over Time (Daily for last 30 days)
exports.ordersOverTimeChart = (req, res) => {
    const sql = `
        SELECT 
            DATE(o.date_ordered) as order_date,
            COUNT(o.order_id) as total_orders,
            SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
            SUM(CASE WHEN o.status = 'processing' THEN 1 ELSE 0 END) as processing_orders
        FROM orders o 
        WHERE o.date_ordered >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(o.date_ordered)
        ORDER BY order_date
    `;
    
    try {
        connection.query(sql, (err, rows) => {
            if (err) {
                console.log('Orders Over Time Chart Error:', err);
                return res.status(500).json({ error: 'Error fetching orders over time data', details: err });
            }
            return res.status(200).json({
                success: true,
                type: 'line',
                title: 'Orders Over Time (Last 30 Days)',
                data: rows
            });
        });
    } catch (error) {
        console.log('Orders Over Time Chart Exception:', error);
        return res.status(500).json({ error: 'Server error', details: error });
    }
};

// PIE CHART: Top Selling Items by Category
exports.topCategoriesChart = (req, res) => {
    const sql = `
        SELECT 
            i.category,
            SUM(ol.quantity) as total_sold,
            SUM(ol.quantity * i.sell_price) as total_revenue,
            COUNT(DISTINCT i.item_id) as items_count
        FROM items i 
        INNER JOIN orderline ol ON i.item_id = ol.item_id 
        INNER JOIN orders o ON ol.order_id = o.order_id
        WHERE o.status != 'canceled'
        GROUP BY i.category
        ORDER BY total_sold DESC
        LIMIT 10
    `;
    
    try {
        connection.query(sql, (err, rows) => {
            if (err) {
                console.log('Top Categories Chart Error:', err);
                return res.status(500).json({ error: 'Error fetching top categories data', details: err });
            }
            return res.status(200).json({
                success: true,
                type: 'pie',
                title: 'Top Selling Categories',
                data: rows
            });
        });
    } catch (error) {
        console.log('Top Categories Chart Exception:', error);
        return res.status(500).json({ error: 'Server error', details: error });
    }
};