const dbHelper = require('../models/dbHelper');

const Sequelize = dbHelper.sequelize;

module.exports = () => async (req, res, next) => {
  if (req.user) {
    try {
      const msgList = await Sequelize.query(`select r.updated_at from message_reply_records r left join message_records m on r.message_record_id = m.id where m.patient_mrn = '${req.user.mrn}' and (not r.status = 'read' or r.status is null);`);
      if (msgList[0].length > 0) {
        const diff = new Date() - msgList[0][msgList[0].length - 1].updated_at;
        const diffDays = Math.floor(diff / 86400000); // days
        const diffHrs = Math.floor((diff % 86400000) / 3600000); // hours
        const diffMins = Math.round(((diff % 86400000) % 3600000) / 60000); // minutes
        let diffStr = '';
        if (diffDays > 0) {
          diffStr += `${diffDays}d`;
        }
        if (diffHrs > 0) {
          diffStr += `${diffHrs}h`;
        }
        if (diffMins > 0) {
          diffStr += `${diffMins}m`;
        }
        if (diffStr.length === 0) {
          diffStr = 'just now';
        } else {
          diffStr += ' ago';
        }

        res.locals.newMsg = diffStr;
      }
    } catch (e) {
      next(e);
    }
  }
  next();
};
