const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  res.render('faq', { lang: req.session.language });
});

module.exports = router;
