const express = require('express');
const nodemailer = require('nodemailer');
const dbHelper = require('../models/dbHelper');
const settings = require('../../config/settings');
const emailConfig = settings.email;

const router = express.Router();
const Patient = dbHelper.patient;
const Project = dbHelper.project;
const Blob = dbHelper.blob;
const MessageRecord = dbHelper.messageRecord;

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  try {
    // no project
    const projectId = req.session.project_id;
    if (!projectId) {
      Error.sendNoProjectError(req, res);
      return;
    }
    const project = await Project.findByPk(projectId);
    const firstName = req.user.first_name;
    const lastName = req.user.last_name;
    const data = {
      name: `${firstName || ''}${firstName && lastName ? ' ' : ''}${lastName || ''}`,
      email: req.user.email,
      faq: project.faq,
    };
    res.render('contact', { data, lang: req.session.language });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res) => {
  if (!req.user) {
    req.flash('error', 'Your session has expired');
    res.redirect('/login');
    return;
  }
  const { mrn } = req.user;
  const { email } = req.body;
  const { message } = req.body;
  try {
    if (email !== req.user.email && !req.session.checkbox) {
      await Patient.update({ email }, { where: { mrn } });
    }
    const tmpBlob = await Blob.create({ content: Buffer.from(message, 'utf8') });
    await MessageRecord.create({
      patient_mrn: mrn,
      blob_id: tmpBlob.id,
      project_id: req.session.project_id,
    });
    const project = await Project.findByPk(req.session.project_id);
    //Check if email address exists on project
    if (project.contact_email) {
      //Generate the email
      let html = `
        <p>You have recieved a contact email for the ${project.title} Study:</p>
        <p>Patient MRN: ${mrn}</p>
        <p>Email of patient: ${email}</p>
        <p>Message:</p>
        <p>${message}</p>
        `;

      //Send the email
      const transporter = nodemailer.createTransport(emailConfig.transportSetting);
      const mailOptions = {
        from: emailConfig.user,
        to: project.contact_email,
        subject: `E-consent contact for ${project.title} Study`,
        html
      };
      await transporter.sendMail(mailOptions);
    }
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

module.exports = router;
