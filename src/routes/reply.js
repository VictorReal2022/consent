const express = require('express');
const dbHelper = require('../models/dbHelper');

const router = express.Router();
const MessageReplyRecord = dbHelper.messageReplyRecord;
const Sequelize = dbHelper.sequelize;

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  try {
    const msgList = await Sequelize.query(`select r.id, b.content, r.status, r.user_username, r.updated_at from message_reply_records r left join message_records m on r.message_record_id = m.id left join blobs b on r.blob_id = b.id where m.patient_mrn = '${req.user.mrn}';`);
    const data = msgList[0].map((msg) => ({
      id: msg.id,
      content: msg.content.toString('utf-8'),
      status: msg.status,
      username: msg.user_username,
      updated_at: msg.updated_at.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    }));
    res.render('reply', { data, lang: req.session.language });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  const { idList } = req.body;
  if (idList) {
    try {
      const awaitList = idList.map((id) => MessageReplyRecord.findByPk(id).then((item) => {
        item.update({ status: 'read' });
      }));
      await Promise.all(awaitList);
      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  }
});

module.exports = router;
