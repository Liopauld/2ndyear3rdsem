const connection = require('../config/database');

// Get all items with their image (if any)
exports.getAllItems = (req, res) => {
    // For admin users, show all items; for regular users, only show visible items
    let sql = `SELECT i.item_id, i.name, i.description, i.category, i.cost_price, i.sell_price, i.show_item, s.quantity, img.image_path
                 FROM items i
                 LEFT JOIN stock s ON i.item_id = s.item_id
                 LEFT JOIN items_images img ON i.item_id = img.item_id`;
    // Only show visible items for non-admin users
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
        sql += ` WHERE i.show_item = 'yes'`;
    }
    try {
        connection.query(sql, (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error fetching items', details: err });
            }
            // Group images by item_id, but keep all other fields as in the original code
            const itemsMap = {};
            rows.forEach(row => {
                if (!itemsMap[row.item_id]) {
                    itemsMap[row.item_id] = {
                        item_id: row.item_id,
                        name: row.name,
                        description: row.description,
                        category: row.category,
                        cost_price: row.cost_price,
                        sell_price: row.sell_price,
                        show_item: row.show_item,
                        quantity: row.quantity,
                        images: []
                    };
                }
                if (row.image_path) {
                    itemsMap[row.item_id].images.push(row.image_path);
                }
            });
            const items = Object.values(itemsMap);
            return res.status(200).json({ success: true, items });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Server error', details: error });
    }
};

// Get a single item by id with its stock quantity
exports.getSingleItem = (req, res) => {
    const sql = `SELECT i.item_id, i.name, i.description, i.category, i.cost_price, i.sell_price, i.show_item, s.quantity
                 FROM items i
                 LEFT JOIN stock s ON i.item_id = s.item_id
                 WHERE i.item_id = ?`;
    const values = [parseInt(req.params.id)];
    try {
        connection.execute(sql, values, (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error fetching item', details: err });
            }
            if (!rows.length) {
                return res.status(404).json({ error: 'Item not found' });
            }
            return res.status(200).json({ success: true, item: rows[0] });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Server error', details: error });
    }
};

// Create a new item and its stock
exports.createItem = (req, res) => {
    // Accept both JSON and multipart form data
    let image_paths = req.body.image_paths;
    // If files are uploaded, use their paths
    if (req.files && req.files.length > 0) {
        image_paths = req.files.map(file => {
            // Only keep the filename, then prepend /storage/images/
            const filename = file.filename;
            return `storage/images/${filename}`;
        });
    } else if (typeof image_paths === 'string') {
        // If sent as a single string in form-data
        image_paths = [image_paths];
    }
    // If no images, set default
    if (!Array.isArray(image_paths) || image_paths.length === 0 || !image_paths[0]) {
        image_paths = ['storage/images/logo1.png'];
    }
    const { name, description, category, cost_price, sell_price, show_item, quantity } = req.body;
    if (!name || !description || !category) {
        return res.status(400).json({ error: 'Missing required fields: name, description, category' });
    }
    const itemSql = `INSERT INTO items (name, description, category, cost_price, sell_price, show_item) VALUES (?, ?, ?, ?, ?, ?)`;
    const itemValues = [
      name,
      description,
      category,
      cost_price || null,
      sell_price || null,
      show_item || 'yes'
    ];
    connection.execute(itemSql, itemValues, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error creating item', details: err });
        }
        const itemId = result.insertId;
        const stockSql = `INSERT INTO stock (item_id, quantity) VALUES (?, ?)`;
        connection.execute(stockSql, [itemId, quantity || 0], (err2) => {
            if (err2) {
                console.log(err2);
                return res.status(500).json({ error: 'Error creating stock', details: err2 });
            }
            // Insert images (guaranteed to have at least one)
            const imageSql = `INSERT INTO items_images (item_id, image_path) VALUES (?, ?)`;
            image_paths.forEach((imgPath) => {
                connection.execute(imageSql, [itemId, imgPath], (err3) => {
                    if (err3) console.log(err3);
                });
            });
            return res.status(201).json({ success: true, item_id: itemId, message: 'Item and images created successfully' });
        });
    });
};

// Update an item and its stock
exports.updateItem = (req, res) => {
    const id = req.params.id;
    // Debug: log the received body
    console.log('updateItem req.body:', req.body);
    let image_paths = (req.body && req.body.image_paths) ? req.body.image_paths : undefined;
    if (req.files && req.files.length > 0) {
        image_paths = req.files.map(file => {
            const filename = file.filename;
            return `storage/images/${filename}`;
        });
    } else if (typeof image_paths === 'string') {
        image_paths = [image_paths];
    } else if (!image_paths) {
        image_paths = [];
    }
    const { name, description, category, cost_price, sell_price, show_item, quantity } = req.body || {};
    // More robust required field check
    if (!name || !description || !category) {
        console.log('Missing fields:', { name, description, category });
        return res.status(400).json({ error: 'Missing required fields: name, description, category', received: req.body });
    }
    const itemSql = `UPDATE items SET name = ?, description = ?, category = ?, cost_price = ?, sell_price = ?, show_item = ? WHERE item_id = ?`;
    const itemValues = [name, description, category, cost_price || null, sell_price || null, show_item || 'yes', id];
    connection.execute(itemSql, itemValues, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error updating item', details: err });
        }
        const stockSql = `UPDATE stock SET quantity = ? WHERE item_id = ?`;
        connection.execute(stockSql, [quantity || 0, id], (err2) => {
            if (err2) {
                console.log(err2);
                return res.status(500).json({ error: 'Error updating stock', details: err2 });
            }
            // Only replace images if new images are attached
            if (Array.isArray(image_paths) && image_paths.length > 0 && image_paths[0]) {
                // Delete old images
                const deleteImagesSql = `DELETE FROM items_images WHERE item_id = ?`;
                connection.execute(deleteImagesSql, [id], (err3) => {
                    if (err3) {
                        console.log(err3);
                        return res.status(500).json({ error: 'Error deleting old images', details: err3 });
                    }
                    // Insert new images
                    const imageSql = `INSERT INTO items_images (item_id, image_path) VALUES (?, ?)`;
                    image_paths.forEach((imgPath) => {
                        connection.execute(imageSql, [id, imgPath], (err4) => {
                            if (err4) console.log(err4);
                        });
                    });
                    return res.status(200).json({ success: true, message: 'Item and images updated successfully' });
                });
            } else {
                // No new images attached, leave images untouched
                return res.status(200).json({ success: true, message: 'Item updated successfully' });
            }
        });
    });
};

// Delete an item and its stock and images
exports.deleteItem = (req, res) => {
    const id = req.params.id;
    // Delete images first
    const deleteImagesSql = `DELETE FROM items_images WHERE item_id = ?`;
    connection.execute(deleteImagesSql, [id], (errImg) => {
        if (errImg) {
            console.log(errImg);
            return res.status(500).json({ error: 'Error deleting images', details: errImg });
        }
        // Delete stock next due to FK constraint
        const stockSql = `DELETE FROM stock WHERE item_id = ?`;
        connection.execute(stockSql, [id], (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Error deleting stock', details: err });
            }
            const itemSql = `DELETE FROM items WHERE item_id = ?`;
            connection.execute(itemSql, [id], (err2) => {
                if (err2) {
                    console.log(err2);
                    return res.status(500).json({ error: 'Error deleting item', details: err2 });
                }
                return res.status(200).json({ success: true, message: 'Item and images deleted successfully' });
            });
        });
    });
};
