const express = require('express');
const dbHelper = require('../models/dbHelper');
const router = express.Router();
const Project = dbHelper.project;
const Medium = dbHelper.medium;

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  const projectId = req.session.project_id;
  try {
    // if entered by error, reset progress
    if (!req.session.required.completed) {
      req.session.protocol.cur_num = 1;
      res.redirect('/protocol');
      return;
    }

    const project = await Project.findByPk(projectId);
    const data = {
      project_title: project.title,
    };
    // add customized message to res
    const projectStrings = await project.getProjectStrings();
    if (projectStrings && projectStrings.consent_decision_top) {
      data.message_top = projectStrings.consent_decision_top;
    }
    if (projectStrings && projectStrings.consent_decision_bottom) {
      data.message_bottom = projectStrings.consent_decision_bottom;
    }
    // add full consent form to res
    const consentFormId = project.consent_form_id;
    if (consentFormId) {
      const medium = await Medium.findByPk(consentFormId);
      // For brain project show prefilled form
      if (project.protocol_number === 'brain') {
        data.pdf_path = `/project/brain donation/pdf/in_progress/pdf_generated/${req.user.mrn}.pdf`
      }
      // Otherwise show blank form
      else {
        data.pdf_path = `/project/${medium.path}`;
      }
    }
    res.render('decision', { data, lang: req.session.language  });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
