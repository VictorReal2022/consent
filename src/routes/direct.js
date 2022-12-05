const express = require('express');
const Passport = require('../middlewares/passport');
const Error = require('../middlewares/error');
const dbHelper = require('../models/dbHelper');

const router = express.Router();
const Project = dbHelper.project;
const Language = dbHelper.language;
const Protocol = dbHelper.protocol;

router.get('/:id', async (req, res, next) => {
    // Default to english language
    languageCode = 'en';
    // Get array of key/value pairs from database
    let lang = await Language.findAll({
      attributes: ['keyword', languageCode],
      raw : true
    });
    // Convert to single object with proper key/value pairs
    var langResult = {};
    for (var i = 0; i < lang.length; i++) {
      langResult[lang[i].keyword] = lang[i][languageCode];
    }
    req.session.language = langResult;
    req.session.project_id = parseInt(req.params.id, 10);
  res.render('direct', {
    layout: 'default',
    message: req.flash('error'),
    formData: req.flash('formData')[0],
    lang: req.session.language
  });
});

router.post('/', async (req, res) => {
    const project = await Project.findByPk(req.session.project_id);
    // Create unique mrn from available data
    req.body.subject = req.body.firstName.substring(0, 1) + req.body.lastName.substring(0, 1) + req.body.phone.substring(0, 5) + req.body.email.substring(0, 3) + req.session.project_id;
    req.body.username = project.direct_ra;
    req.body.password = 'no_password_required';
    req.body.from_direct = true;
      // record protocol length
  let protocols = await Protocol.findAll({
      where: {
        project_id: req.session.project_id,
      },
    });
    if (protocols.length === 0) {
      Error.sendProjectError(req, res);
      return;
    }
    req.session.protocol = { max_num: protocols.length };

    // record required length
    protocols = await Protocol.findAll({
      where: {
        project_id: req.session.project_id,
        required: true,
      },
    });
    req.session.required = {
      completed: protocols.length === 0,
      max_num: Math.max(...protocols.map((p) => p.num), 0),
    };

      // Get the language code for the project
      languageCode = project.language;
      // Get array of key/value pairs from database
      let lang = await Language.findAll({
        attributes: ['keyword', languageCode],
        raw : true
      });
      // Convert to single object with proper key/value pairs
      var langResult = {};
      for (var i = 0; i < lang.length; i++) {
        langResult[lang[i].keyword] = lang[i][languageCode];
      }
      req.session.language = langResult;
  
  Passport.authenticate('local', {
      successRedirect: req.session.epicOrIcore ? '/patient' : '/protocol',
      failureRedirect: '/',
      failureFlash: true,
    })(req, res);
});

module.exports = router;
