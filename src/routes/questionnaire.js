const express = require('express');
const Project = require('../models/dbHelper').project;

const router = express.Router();

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  const data = { download: req.session.download };
  const { erap } = req.session;
  try {
    const projectId = req.session.project_id;
    if (erap && projectId === 1) {
      data.message = 'Note: You must use the first and last names, as they appear on your electronic consent form, in order to access your e-questionnaire next.';
    }
    if (!projectId) {
      Error.sendNoProjectError(req, res);
      return;
    }
    const project = await Project.findByPk(projectId);
    const projectStrings = await project.getProjectStrings();
    if (projectStrings && projectStrings.consent_take_survey) {
      data.message = projectStrings.consent_take_survey;
    }

    // test if have survey
    const url = project.survey;
    const surveys = await project.getSurveys();
    if (erap || url || surveys.length !== 0) {
      data.survey = true;
    }
  } catch (e) {
    next(e);
  }
  res.render('questionnaire', { data, lang: req.session.language });
});

router.get('/download', (req, res) => {
  if (req.session.download && req.session.downloadPath) {
    res.download(req.session.downloadPath);
  } else {
    console.error('Download form not found');
    res.redirect('/error');
  }
});

module.exports = router;
