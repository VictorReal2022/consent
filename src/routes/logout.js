const express = require('express');
const { url } = require('../../config/settings').iopen;

const router = express.Router();

router.get('/', (req, res) => {
  const data = { url };
  req.session.regenerate(() => {
    res.render('logout', { data });
  });
});

module.exports = router;
