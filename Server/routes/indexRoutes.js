const express = require('express');
const indexController = require('../controllers/indexController');

const router = express.Router();

router.get(['/', 'index.html'], indexController.renderHomePage);

module.exports = router;
