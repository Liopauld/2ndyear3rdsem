const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')

const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth')

const { getAllItems,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem, } = require('../controllers/item')

router.get('/items', isAuthenticatedUser, getAllItems);
router.get('/items/:id', isAuthenticatedUser, getSingleItem);
router.post('/items', isAuthenticatedUser, isAdmin, upload.array('images', 10), createItem);
router.put('/items/:id', isAuthenticatedUser, isAdmin, upload.array('images', 10), updateItem);
router.post('/items/:id', isAuthenticatedUser, isAdmin, upload.array('images', 10), updateItem); // for method-override (PUT as POST)
router.delete('/items/:id', isAuthenticatedUser, isAdmin, deleteItem);

module.exports = router;