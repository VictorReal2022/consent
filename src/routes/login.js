const express = require('express');
const Passport = require('../middlewares/passport');
const Error = require('../middlewares/error');
const dbHelper = require('../models/dbHelper');

const router = express.Router();
const Project = dbHelper.project;
const Language = dbHelper.language;
const Protocol = dbHelper.protocol;
const RemoteSession = dbHelper.remoteSession;


router.get('/', (req, res) => {
  if (req.user) {
    res.redirect('/protocol');
    return;
  }
  res.render('login', {
    layout: 'default',
    message: req.flash('error'),
    formData: req.flash('formData')[0],
  });
});

router.get('/list', async (req, res) => {
  try {
    const projects = await Project.findAll();
    const data = {
      projects: projects.filter((project) => !project.disabled)
        .map((project) => ({
          value: project.id,
          label: project.title,
        })),
    };
    res.send(data);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

async function checkboxHandler(req, res, next) {
  const { rid } = req.query;
  const { pid } = req.query;
  const { name } = req.query;
  const { username } = req.query;
  if (!rid || !pid || !name) {
    req.flash('error', 'Invalid session, please contact support');
    res.redirect('/login');
    return;
  }
  if (req.user) {
    req.session.regenerate(() => {
      res.status(301).redirect(`/login/checkbox-remote?rid=${rid}&pid=${pid}&name=${name}`);
    });
    return;
  }

  try {
    const projectId = parseInt(pid, 10);
    // fill in checkbox response id as mrn
    // for checkbox usage only
    req.body.username = username || 'admin';
    req.body.password = rid.includes('_') ? rid : `${name}_${rid}`;
    // TODO remove the test entry
    const { test } = req.query;
    if (test) {
      req.body.password = `${req.body.password}_test`;
    }
    req.session.checkbox = true;

    // record protocol length
    let protocols = await Protocol.findAll({
      where: {
        project_id: projectId,
      },
    });
    if (protocols.length === 0) {
      Error.sendProjectError(req, res);
      return;
    }
    req.session.project_id = projectId;
    req.session.protocol = { max_num: protocols.length };

    // record required length
    protocols = await Protocol.findAll({
      where: {
        project_id: projectId,
        required: true,
      },
    });
    req.session.required = {
      completed: protocols.length === 0,
      max_num: Math.max(...protocols.map((p) => p.num), 0),
    };
  } catch (e) {
    next(e);
  }

  Passport.authenticate('local', {
    successRedirect: '/protocol',
    failureRedirect: '/',
    failureFlash: true,
  })(req, res);
}

router.get('/checkbox-remote', checkboxHandler);
router.post('/checkbox-remote', checkboxHandler);

router.get(['/remote', '/remote/:sessionId'], async (req, res, next) => {
  if (req.user) {
    res.redirect('/protocol');
    return;
  }
  try {
    const { sessionId } = req.params;
    const session = await RemoteSession.findByPk(sessionId);
    if (!session) {
      req.flash('error', 'Invalid session, please contact support');
      res.redirect('/login');
      return;
    }
    res.render('login', {
      layout: 'default',
      message: req.flash('error'),
      data: { remote: true },
      formData: req.flash('formData')[0],
    });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  let projectId;
  try {
    if (req.body.passcode) {
      const sessionId = req.headers.referer.split('/')[5];
      const remoteSession = await RemoteSession.findByPk(sessionId);
      if (!remoteSession) {
        Error.sendNotFoundError(req, res, 'Session');
        return;
      }
      projectId = remoteSession.project_id;
      
      // fill in sessionID as username, passcode as password
      // for remote usage only
      req.body.username = sessionId;
      req.body.password = req.body.passcode;
      req.session.remote = true;
    } else {
      projectId = parseInt(req.body.project, 10);
      if (!projectId) {
        Error.sendNotFoundError(req, res, 'Project');
        return;
      }
      const project = await Project.findByPk(projectId);
      if (!project) {
        Error.sendNotFoundError(req, res, 'Project');
        return;
      }
      if (project.expiration_date) {
        const parts = project.expiration_date.split('-');
        const a = new Date(parts[0], parts[1] - 1, parts[2]);
        a.setHours(0, 0, 0, 0);
        const b = new Date();
        b.setHours(0, 0, 0, 0);
        if (a < b) {
          req.flash('error', 'The protocol is expired');
          res.redirect('/');
          return;
        }
      }
    }
  } catch (e) {
    next(e);
  }

  // common steps
  try {
    // record protocol length
    let protocols = await Protocol.findAll({
      where: {
        project_id: projectId,
      },
    });
    if (protocols.length === 0) {
      Error.sendProjectError(req, res);
      return;
    }
    req.session.project_id = projectId;
    req.session.protocol = { max_num: protocols.length };

    // record required length
    protocols = await Protocol.findAll({
      where: {
        project_id: projectId,
        required: true,
      },
    });
    req.session.required = {
      completed: protocols.length === 0,
      max_num: Math.max(...protocols.map((p) => p.num), 0),
    };
  } catch (e) {
    next(e);
  }

  //Set variables for docusign
  const project = await Project.findByPk(projectId);
  if (project.docusign) {
    req.session.docusign = true;
    req.session.docusign_template = project.docusign;
  }

  // All universal consent to bypass checkbox but still go to patient page
  const universalConsentIds = [5,6,7];
  if (req.body.epic || req.body.icore || req.body.erap || universalConsentIds.includes(projectId)) {
    req.session.epicOrIcore = true;
  }

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
