const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path')
const methodOverride = require('method-override');

const items = require('./routes/item');
const users = require('./routes/user')
const dashboard = require('./routes/dashboard')
const order = require('./routes/order')
const itemReviews = require('./routes/item_review')
app.use(cors())
app.use(express.json())
app.use('/storage/images', express.static(path.join(__dirname, 'images')))
app.use(methodOverride('_method'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve frontend files dynamically
app.use('/frontend', express.static(path.join(__dirname, '../JQuery_ade-main')));
app.use('/', express.static(path.join(__dirname, '../JQuery_ade-main')));

app.use('/api/v1', items);
app.use('/api/v1/users', users);
app.use('/api/v1/dashboard', dashboard);
app.use('/api/v1', order);
app.use('/api/v1', itemReviews);

module.exports = app


