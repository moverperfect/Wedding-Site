const express = require('express');
const submitController = require('../controllers/submitController');

const urlencodedParser = express.urlencoded({ extended: false });

const router = express.Router();

router.post('/submit', urlencodedParser, submitController.handleFormSubmission);

module.exports = router;
