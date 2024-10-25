const express = require('express');
const { getInvitation } = require('../controllers/invitationController');

const router = express.Router();

router.get('/invitation/:imageName', async (req, res) => {
  getInvitation(req, res);
});

module.exports = router;
