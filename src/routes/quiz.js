const express = require('express');
const Error = require('../middlewares/error');
const dbHelper = require('../models/dbHelper');

const router = express.Router();
const Protocol = dbHelper.protocol;
const Quiz = dbHelper.quiz;
const Option = dbHelper.option;
const Text = dbHelper.text;
const Medium = dbHelper.medium;
const QuizRecord = dbHelper.quizRecord;

function shuffle(array) {
  const newArray = array;
  let currentIndex = newArray.length;
  let temporaryValue;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = newArray[currentIndex];
    newArray[currentIndex] = newArray[randomIndex];
    newArray[randomIndex] = temporaryValue;
  }

  return newArray;
}

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign-in first');
    res.redirect('/login');
    return;
  }
  const projectId = req.session.project_id;
  // get page from query/session/init
  let page = 1;
  if (req.query.page) {
    page = parseInt(req.query.page, 10);
  } else if (req.session.quiz.cur_num) {
    page = req.session.quiz.cur_num;
  }
  if (page > req.session.quiz.max_num) {
    req.session.quiz.cur_num -= 1;
    if (req.session.quiz.required && req.session.protocol.cur_num >= req.session.required.max_num) {
      req.session.required.completed = true;
    }
    res.redirect(`/protocol?page=${req.session.protocol.cur_num + 1}`);
    return;
  }

  try {
    const protocol = await Protocol.findOne({
      where: {
        project_id: projectId,
        num: req.session.protocol.cur_num,
      },
    });
    const quiz = await Quiz.findOne({
      where: {
        protocol_id: protocol.id,
        num: page,
      },
    });
    // no quiz
    if (!quiz) {
      Error.sendNotFoundError(req, res, 'Quiz');
      return;
    }

    req.session.quiz.cur_num = quiz.num;
    const text = await Text.findByPk(quiz.text_id);
    const options = await quiz.getOptions();
    const data = {
      quiz_num: quiz.num,
      quiz_content: text.content,
    };

    // render required quiz
    if (quiz.required) {
      //If required quiz and docusign, skip it
      if (req.session.docusign) {
        req.session.required.completed = true;
        res.redirect(`/protocol?page=${req.session.protocol.cur_num + 1}`);
        return;
      }
      else {
        data.options = options.map((t) => ({
          option_id: t.option.id,
          option_content: t.content,
          is_correct: t.option.correctness,
        }));
        res.render('required', { data, lang: req.session.language  });
        return;
      }
    }

    // shuffle options for non-required quiz
    data.options = shuffle(options.map((t) => ({
      option_id: t.option.id,
      option_content: t.content,
      is_correct: t.option.correctness,
    })));
    // add medium to res
    // find medium
    const mediumId = quiz.medium_id;
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

    // add interactions to res
    const tVideo = await Medium.findAll({
      where: {
        type: 't_video',
      },
    }).then((li) => shuffle(li)[0]);
    const tAudio = await Medium.findAll({
      where: {
        type: 't_audio',
      },
    }).then((li) => shuffle(li)[0]);
    const fVideo = await Medium.findAll({
      where: {
        type: 'f_video',
      },
    }).then((li) => shuffle(li)[0]);
    const fAudio = await Medium.findAll({
      where: {
        type: 'f_audio',
      },
    }).then((li) => shuffle(li)[0]);
    data.interactions = {
      t_video: tVideo ? tVideo.path : '',
      t_audio: tAudio ? tAudio.path : '',
      f_video: fVideo ? fVideo.path : '',
      f_audio: fAudio ? fAudio.path : '',
    };

    res.render('quiz', { data, lang: req.session.language });
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
  const { optionId } = req.body;
  const projectId = req.session.project_id;
  try {
    const protocol = await Protocol.findOne({
      where: {
        project_id: projectId,
        num: req.session.protocol.cur_num,
      },
    });
    const quiz = await Quiz.findOne({
      where: {
        protocol_id: protocol.id,
        num: req.session.quiz.cur_num,
      },
    });

    await QuizRecord.create({
      patient_mrn: mrn,
      quiz_id: quiz.id,
      option_id: optionId,
      project_id: projectId,
    });
    // record required quiz answer
    const option = await Option.findByPk(optionId);
    if (quiz.required && option.signature_change) {
      if (!req.session.signature_change) {
        req.session.signature_change = [];
      }
      req.session.signature_change.push(JSON.parse(option.signature_change));
    }
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

module.exports = router;
