const dbHelper = require('./src/models/dbHelper');
const { sequelize } = dbHelper;
const Op = sequelize.Op;
const hummus = require('hummus');
const Erap = dbHelper.erap;
const uuidv4 = require('uuid/v4');

const nodemailer = require('nodemailer');
const settings = require('./config/settings');
const emailConfig = settings.email;

var cron = require('node-cron');

async function main() {
  // Fetch a list of all ERAP records that have returned an error in the last 24 hours
  const errorErap = await Erap.findAll({
    where:  {
      exception_status: 'ERROR',
      processed_timestamp: {
        [Op.gt]: sequelize.literal("DATEADD(day, -1, GETDATE())"),
      }
    }
  })

  // Log if no errors
  if (errorErap.length === 0) {
    console.log('No new errors')
  }

  else { 
    try{
      // Create an email for Dr. Finkelstein with all errors
      let html = `<p><b>Please see the following list for all erap errors within the last 24 hours:</b></p>`
      // For each patient we will create them in iOpen as new patients and add them to the project
      for (const e of errorErap) {
        html += '<p> MRN: ' + e.mrn + '</p>'
        html += '<p> Error Code: ' + e.exception_reason + '</p>'
        html += '<p> Processed Date: ' + e.processed_timestamp + '</p>'
        html += '<p> </p>'
      }
      // send the email
      const transporter = nodemailer.createTransport(emailConfig.transportSetting);
      const mailList = [
        'Joseph.Finkelstein@mssm.edu',
        'Rachel.Brody@mountsinai.org'
      ];
      const mailOptions = {
          from: emailConfig.user,
          to: mailList,
          subject: 'Erap errors',
          html,
      };
      await transporter.sendMail(mailOptions);
      }
      catch (e) {
          console.log(e);
      }
    }
  }

cron.schedule('0 8 * * *', () => {
  console.log('Running a job at 08:00 at America/New York timezone');
  try {
    main().then();
  } catch (e) {
      console.log(e);
  }
}, {
  scheduled: true,
  timezone: "America/New_York"
});


