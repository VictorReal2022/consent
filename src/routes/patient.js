const express = require('express');
const dbHelper = require('../models/dbHelper');

const router = express.Router();
const Patient = dbHelper.patient;


router.get('/', async (req, res, next) => {
  // If not logged in send to login
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  // redirect to protocol if completed
  try {
    const patient = await Patient.findByPk(req.user.mrn);
    if (patient.first_name !== 'None' && patient.last_name !== 'None') {
      req.session.epicOrIcoreComplete = true;
    }
  } catch (e) {
    next(e);
  }
  if (!req.session.epicOrIcore || req.session.epicOrIcoreComplete) {
    req.flash('error', 'You already completed the form');
    res.redirect('/protocol');
    return;
  }

  res.render('patient', {
    layout: 'default',
    message: req.flash('error'),
    formData: req.flash('formData')[0],
    lang: req.session.language
  });
});

router.post('/', async (req, res, next) => {
  const { mrn } = req.user;
  // Try to update the patient
  try {
    await Patient.upsert({
      mrn,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      gender: req.body.gender,
      dob: req.body.dob,
    });
    req.session.epicOrIcoreComplete = true;
  } catch (e) {
    next(e);
  }
  res.redirect('/protocol');
});

router.post('/skip', async (req, res) => {
  req.session.epicOrIcoreComplete = true;
  res.redirect('/protocol');
});

module.exports = router;
