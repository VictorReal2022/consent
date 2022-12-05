const express = require('express');
const Error = require('../middlewares/error');
const dbHelper = require('../models/dbHelper');

const router = express.Router();
const Project = dbHelper.project;
const Protocol = dbHelper.protocol;
const Text = dbHelper.text;
const Medium = dbHelper.medium;
const ConsentProgressRecord = dbHelper.consentProgressRecord;

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  const projectId = req.session.project_id;
  // get page from query/session/init
  let page = 1;
  if (req.query.page) {
    page = parseInt(req.query.page, 10);
  } else if (req.session.protocol.cur_num) {
    page = req.session.protocol.cur_num;
  }
  if (page > req.session.protocol.max_num
    || (req.query.skip && req.session.required.completed)) {
    req.session.protocol.cur_num = req.session.protocol.max_num;
    res.redirect('/decision');
    return;
  }

  try {
    // find nearest required page
    if (req.query.skip) {
      const protocols = await Protocol.findAll({
        where: {
          project_id: projectId,
          required: true,
        },
      });
      for (let i = 0; i < protocols.length; i += 1) {
        if (page <= protocols[i].num) {
          page = protocols[i].num;
          break;
        }
      }
    }

    const project = await Project.findByPk(projectId);
    const protocol = await Protocol.findOne({
      where: {
        project_id: projectId,
        num: page,
      },
    });
    // no protocol
    if (!project || !protocol) {
      Error.sendNotFoundError(req, res, 'Protocol');
      return;
    }

    // record quiz length
    const quizzes = await protocol.getQuizzes();
    req.session.protocol.cur_num = page;
    req.session.quiz = {
      max_num: quizzes.length,
      required: protocol.required,
    };

    const shortText = await Text.findByPk(protocol.short_text_id);
    const longText = await Text.findByPk(protocol.long_text_id);
    // no content, jump to quiz directly
    if (!shortText && !longText) {
      res.redirect('/quiz');
      return;
    }

    const data = {
      protocol_title: protocol.title,
      protocol_short_content: shortText.content,
      protocol_long_content: longText ? longText.content : null,
      protocol_num: page,
      allow_skip: project.allow_skip,
    };

    // find medium
    const mediumId = protocol.medium_id;
    if (mediumId) {
      const medium = await Medium.findByPk(mediumId);
      data.medium = { medium_path: medium.path };
      switch (medium.type) {
        case 'video':
          data.medium.video = true;
          break;
        default:
          data.medium.img = true;
          break;
      }
    }

    res.render('protocol', { 
      data, 
      lang: req.session.language,
      layout: 'navbar',
    });
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
  const projectId = req.session.project_id;
  try {
    const protocol = await Protocol.findOne({
      where: {
        project_id: projectId,
        num: req.session.protocol.cur_num,
      },
    });
    await ConsentProgressRecord.create({
      patient_mrn: mrn,
      project_id: projectId,
      protocol_id: protocol.id,
    });
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }

  res.sendStatus(200);
});

module.exports = router;
