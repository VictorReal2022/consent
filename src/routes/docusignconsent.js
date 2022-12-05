const express = require('express');
const dbHelper = require('../models/dbHelper');

const router = express.Router();

const Patient = dbHelper.patient;

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  if (!req.session.docusign) {
    res.redirect('/login');
    return;
  }
  try {
    // fetch patient's name
    const data = {
      first_name: req.user.first_name === 'None' ? null : req.user.first_name,
      last_name: req.user.last_name === 'None' ? null : req.user.last_name,
    };
    //Render the form
    res.render('docusignconsent', { data, lang: req.session.language  });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Your session has expired');
    res.redirect('/login');
    return;
  }
  // Update patient's info
  try {
    await Patient.upsert({
      mrn: req.user.mrn,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
    });
  } catch (e) {
    next(e);
  }
  res.redirect('/docusign');
});

module.exports = router;
