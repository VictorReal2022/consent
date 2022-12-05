const express = require('express');
const dbHelper = require('../models/dbHelper');

const router = express.Router();
const Project = dbHelper.project;
const PatientProject = dbHelper.patientProject;
const SurveyRecord = dbHelper.surveyRecord;


router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  const { mrn } = req.user;
  try {
    // update patient progress
    const patientProject = await PatientProject.findOne({
      where: {
        patient_mrn: mrn,
        project_id: req.session.project_id,
      },
    });
    await patientProject.update({ status: 'Entered E-Questionnaire' });
  } catch (e) {
    next(e);
  }

  const { erap } = req.session;
  if (erap) {
    req.session.regenerate(() => {
      res.status(301).redirect(req.session.redcap_url);
    });
    return;
  }

  const projectId = req.session.project_id;
  try {
    const project = await Project.findByPk(projectId);
    let url = project.survey;
    // redirect to own surveys page if exists
    if (url) {
      // attach hidden fields if checkbox
      if (url.includes('mountsinai.checkbox.com')) {
        url = `${url}?rid=${mrn}`;
      }
      req.session.regenerate(() => {
        res.status(301).redirect(url);
      });
      return;
    }

    // use built-in surveys
    const surveys = await project.getSurveys();
    const data = {
      surveys: surveys.map((t) => ({
        survey_id: t.survey.id,
        survey_content: t.content,
      })),
    };
    if (data.surveys.length === 0) {
      res.redirect('/logout');
      return;
    }
    res.render('survey', { data, lang: req.session.language });
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
  const { data } = req.body;

  try {
    await SurveyRecord.bulkCreate(data.map((d) => (
      {
        patient_mrn: mrn,
        survey_id: d.key,
        answer: d.value,
      })));
    const patientProject = await PatientProject.findOne({
      where: {
        patient_mrn: mrn,
        project_id: req.session.project_id,
      },
    });
    await patientProject.update({ status: 'Entered E-Questionnaire' });
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

module.exports = router;
