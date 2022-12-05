const express = require('express');
const Project = require('../models/dbHelper').project;
const ErrorRecord = require('../models/dbHelper').errorRecord;

const router = express.Router();

router.get('/', async (req, res) => {
  const data = {};
  try {
    // get customized error message
    const projectId = req.session.project_id;
    if (projectId) {
      const project = await Project.findByPk(projectId);
      const projectStrings = await project.getProjectStrings();
      if (projectStrings && projectStrings.error_message) {
        data.message = projectStrings.error_message;
      }
    }

    // record if error code exists
    const errCode = req.query.code;
    if (req.user && errCode) {
      await ErrorRecord.create({ patient_mrn: req.user.mrn, error_code: parseInt(errCode, 10) });
    }
    if (parseInt(errCode, 10) === 2) {
      data.message = 'It seems you have difficulties understanding the consent form.\n'
        + 'Please contact research staff to complete the consenting process.\n';
    }
  } finally {
    res.render('error', { data, lang: req.session.language });
  }
});

module.exports = router;
