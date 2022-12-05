const bcrypt = require('bcryptjs');
const passport = require('passport');
const { Strategy } = require('passport-local');
const dbHelper = require('../models/dbHelper');

const Sequelize = dbHelper.sequelize;
const Project = dbHelper.project;
const Protocol = dbHelper.protocol;
const User = dbHelper.user;
const Patient = dbHelper.patient;
const PatientProject = dbHelper.patientProject;
const RemoteSession = dbHelper.remoteSession;
const ConsentRecord = dbHelper.consentRecord;
const ConsentProgressRecord = dbHelper.consentProgressRecord;

passport.use(new Strategy(
  {
    passReqToCallback: true,
  },
  async (req, username, password, done) => {
    const projectId = req.session.project_id;
    let user;
    let ra;
    let isErap;
    let patientProject;

    try {
      if (req.session.remote) {
        // if remote
        // session and passcode was assigned by ra
        // just need to confirm the passcode and relations
        const remoteSession = await RemoteSession.findByPk(username);
        const isMatch = await bcrypt.compare(password.replace(/\s/g, ''), remoteSession.hashed_password);
        if (!isMatch) {
          // don't send input back when remote
          return done(null, false, { message: 'Incorrect passcode.' });
        }

        user = await Patient.findByPk(remoteSession.patient_mrn);
        ra = await User.findByPk(remoteSession.user_username);
        patientProject = await PatientProject.findOne({
          where: {
            patient_mrn: remoteSession.patient_mrn,
            project_id: projectId,
          },
        });
        isErap = patientProject.erap;
      } else if (req.session.checkbox) {
        // for checkbox login only
        // use password for subject id
        // no ra authentication needed
        ra = await User.findByPk(req.body.username);
        user = await Patient.findByPk(password);
        if (!user) {
          user = await Patient.create({
            mrn: password,
          });
        }
        patientProject = await PatientProject.findOne({
          where: {
            patient_mrn: password,
            project_id: projectId,
          },
        });
        if (!patientProject) {
          patientProject = await PatientProject.create({
            patient_mrn: password,
            project_id: projectId,
          });
        }
        isErap = false;
      } else {
        // else if not remote
        // first validate ra login information
        // then use mrn for erap and subject id for non-erap
        ra = await User.findByPk(username, {
          include: [Project],
        });
        if (!ra || !ra.projects.map((p) => p.id).includes(projectId)) {
          req.flash('formData', req.body);
          return done(null, false, { message: 'Incorrect user information.' });
        }

        // consenting page only
        // for continuous purpose, we save and pass salted password of ra
        // compare slated password instead of displaying raw password
        let isMatch;
        if (req.body.from_education) {
          isMatch = req.body.hashed_password === ra.hashed_password;
        } else {
          isMatch = await bcrypt.compare(password, ra.hashed_password);
        }
        if (req.body.from_direct) {
          isMatch = true;
        }
        if (!isMatch) {
          req.flash('formData', req.body);
          return done(null, false, { message: 'Incorrect password.' });
        }

        let patient;
        if (req.body.erap) { patient = req.body.mrn }
        else { patient = req.body.subject }

        user = await Patient.findByPk(patient);
        if (!user) {
          user = await Patient.create({
            mrn: patient,
            first_name: req.body.firstName ? req.body.firstName : 'None',
            last_name: req.body.lastName ? req.body.lastName : 'None',
            email: req.body.email ? req.body.email : null,
            gender: req.body.gender ? req.body.gender : 'Male',
            dob: req.body.dob ? req.body.dob : '1800-01-01',
            phone: req.body.phone ? req.body.phone : null,
          });
        }
        patientProject = await PatientProject.findOne({
          where: {
            patient_mrn: patient,
            project_id: projectId,
          },
        });
        if (!patientProject) {
          patientProject = await PatientProject.create({
            patient_mrn: patient,
            project_id: projectId,
            erap: !!req.body.erap,
            epic: !!req.body.epic,
            icore: !!req.body.icore,
          });
        }
        isErap = false;
      }
    } catch (e) {
      console.error(e);
      req.flash('formData', req.body);
      return done(null, false, { message: e.message });
    }

    try {
      // progress related
      if (!user) {
        req.flash('formData', req.body);
        return done(null, false, { message: 'Incorrect mrn' });
      }
      if (!patientProject) {
        req.flash('formData', req.body);
        return done(null, false, { message: 'You are not allowed to view this protocol' });
      }
      if (!user.is_demo) {
        // kick out if consented
        if (!patientProject.withdraw) {
          const consentRecord = await ConsentRecord.findOne({
            where: {
              patient_mrn: patientProject.patient_mrn,
              project_id: patientProject.project_id,
            },
          });
          if (consentRecord) {
            req.flash('formData', req.body);
            return done(null, false, { message: 'You have already consented to this project' });
          }
        }

        // restore protocol num progress
        const consentProgressRecord = await ConsentProgressRecord.findOne({
          order: Sequelize.literal('updated_at DESC'),
          where: {
            patient_mrn: patientProject.patient_mrn,
            project_id: projectId,
          },
        });
        if (consentProgressRecord) {
          const protocol = await Protocol.findByPk(consentProgressRecord.protocol_id);
          req.session.protocol.cur_num = protocol.num;
        }
      }

      await patientProject.update({ status: 'Selected Consent Now' });
      req.session.erap = isErap;
      req.session.ra = {
        username: ra.username,
        name: ra.name,
      };
      return done(null, user);
    } catch (e) {
      console.error(e);
      req.flash('formData', req.body);
      return done(null, false, { message: e.message });
    }
  },
));

passport.serializeUser((user, done) => {
  done(null, user.mrn);
});

passport.deserializeUser(async (mrn, done) => {
  const user = await Patient.findByPk(mrn);
  try {
    return done(null, user);
  } catch (e) {
    console.error(e);
    return done(e);
  }
});

module.exports = passport;
