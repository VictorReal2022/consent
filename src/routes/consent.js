const path = require('path');
const mkdirp = require('async-mkdirp');
const express = require('express');
const hummus = require('hummus');
const nodemailer = require('nodemailer');
const axios = require('axios');
const qs = require('qs');
const dbHelper = require('../models/dbHelper');
const settings = require('../../config/settings');

const router = express.Router();
const Brain = dbHelper.brain;
const User = dbHelper.user;
const QuizRecord = dbHelper.quizRecord;
const Quiz = dbHelper.quiz;
const Option = dbHelper.option;
const Project = dbHelper.project;
const PatientProject = dbHelper.patientProject;
const Medium = dbHelper.medium;
const Blob = dbHelper.blob;
const ConsentRecord = dbHelper.consentRecord;
const emailConfig = settings.email;
const { erap } = settings;
const { redcap } = settings;

function generateImgObject(iData, pdfW) {
  if (!iData) return null;
  const iBuffer = Buffer.from(iData.split(',')[1], 'base64');
  const iStream = new hummus.PDFRStreamForBuffer(iBuffer);
  return pdfW.createFormXObjectFromPNG(iStream);
}

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  if (!req.session.required.completed) {
    req.flash('error', 'You must complete all required protocols');
    res.redirect('/required');
    return;
  }
  // Update status and send to docusign
  if (req.session.docusign) {
    const patientProject = await PatientProject.findOne({
      where: {
        patient_mrn: req.user.mrn,
        project_id: req.session.project_id,
      },
    });
    await patientProject.update({ status: 'Read and Agreed to Terms and Conditions' });
    res.redirect('/docusignconsent');
    return;
  }
  const projectId = req.session.project_id;

  // fetch patient's name
  const data = {
    first_name: req.user.first_name === 'None' ? null : req.user.first_name,
    last_name: req.user.last_name === 'None' ? null : req.user.last_name,
  };

  // update patient progress
  try {
    const project = await Project.findByPk(projectId);
    data.echo_11 = projectId === 48;
    data.relationship_to_child = project.relationship_to_child;
    data.email = project.email;
    data.download = project.download;
    data.patient = project.patient;
    if (project.ra_modify) {
      const ra = await User.findByPk(req.session.ra.username);
      const raImgBlob = await Blob.findByPk(ra.signature_id);
      // transparent image if not have signature
      const raImgData = raImgBlob ? raImgBlob.content.toString('utf-8') : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      data.ra_modify = {
        full_name: req.session.ra.name,
        signature_data: raImgData,
      };
    }
    data.witness = project.witness;
    data.representative = project.representative;
    data.interpreter = project.interpreter;
    data.parent1 = project.parent1;
    data.parent2 = project.parent2;
    data.parent1_decline = project.parent1_decline;
    data.child = project.child;
    // quiz changes
    if (req.session.signature_change) {
      req.session.signature_change.forEach((changes) => {
        Object.keys(changes).forEach((key) => {
          switch (key.charAt(0)) {
            case '+':
              data[key.substring(1, key.length)] = true;
              break;
            case '-':
              data[key.substring(1, key.length)] = false;
              break;
            default:
              break;
          }
        });
      });
    }

    const patientProject = await PatientProject.findOne({
      where: {
        patient_mrn: req.user.mrn,
        project_id: req.session.project_id,
      },
    });
    await patientProject.update({ status: 'Read and Agreed to Terms and Conditions' });
  } catch (e) {
    next(e);
  }

  res.render('consent', { layout: 'default', data, lang: req.session.language });
});

/* eslint-disable camelcase */
router.post('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'Your session has expired');
    res.redirect('/login');
    return;
  }

  let imgData = req.body.patient_signature_data;
  let raImgData = req.body.ra_signature_data;
  const witnessImgData = req.body.witness_signature_data;
  const representativeImgData = req.body.representative_signature_data;
  const parent1ImgData = req.body.parent1_signature_data;
  const parent2ImgData = req.body.parent2_signature_data;
  const childImgData = req.body.child_signature_data;
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;
  const raFullName = req.body.ra_full_name || req.session.ra.name;
  const witnessFullName = req.body.witness_full_name;
  const representativeFullName = req.body.representative_full_name;
  const relationshipToChild = req.body.relationship_to_child;
  const parent1FullName = req.body.parent1_full_name;
  const parent2FullName = req.body.parent2_full_name;
  const childFullName = req.body.child_full_name;
  const interpreterFullName = req.body.interpreter;
  const { email } = req.body;
  const { mrn } = req.user;
  const raUsername = req.session.ra.username;
  const projectId = req.session.project_id;
  const signatureChange = req.session.signature_change;
  // for echo only
  if (projectId === 47) {
    imgData = imgData || parent1ImgData;
  }

  // record consent in db
  try {
    let tmpBlob = null;
    let tmpRaBlob = null;
    let tmpWitnessBlob = null;
    let tmpRepresentativeBlob = null;
    let tmpParent1Blob = null;
    let tmpParent2Blob = null;
    let tmpChildBlob = null;
    if (imgData) {
      tmpBlob = await Blob.create({ content: Buffer.from(imgData, 'utf8') });
    }
    if (raImgData) {
      tmpRaBlob = await Blob.create({ content: Buffer.from(raImgData, 'utf8') });
    }
    if (witnessImgData) {
      tmpWitnessBlob = await Blob.create({ content: Buffer.from(witnessImgData, 'utf8') });
    }
    if (representativeImgData) {
      tmpRepresentativeBlob = await Blob.create({ content: Buffer.from(representativeImgData, 'utf8') });
    }
    if (parent1ImgData) {
      tmpParent1Blob = await Blob.create({ content: Buffer.from(parent1ImgData, 'utf8') });
    }
    if (parent2ImgData) {
      tmpParent2Blob = await Blob.create({ content: Buffer.from(parent2ImgData, 'utf8') });
    }
    if (childImgData) {
      tmpChildBlob = await Blob.create({ content: Buffer.from(childImgData, 'utf8') });
    }

    const consentRecord = await ConsentRecord.create({
      patient_mrn: mrn,
      user_username: raUsername,
      project_id: projectId,
      full_name: `${firstName} ${lastName}`.trim() || null,
      consent_type: 'Electronic',
      ra_full_name: raFullName || null,
      witness_full_name: witnessFullName || null,
      representative_full_name: representativeFullName || null,
      relationship_to_child: relationshipToChild || null,
      parent1_full_name: parent1FullName || null,
      parent2_full_name: parent2FullName || null,
      child_full_name: childFullName || null,
      interpreter_full_name: interpreterFullName || null,
      blob_id: tmpBlob ? tmpBlob.id : null,
      ra_blob_id: tmpRaBlob ? tmpRaBlob.id : null,
      witness_blob_id: tmpWitnessBlob ? tmpWitnessBlob.id : null,
      representative_blob_id: tmpRepresentativeBlob ? tmpRepresentativeBlob.id : null,
      parent1_blob_id: tmpParent1Blob ? tmpParent1Blob.id : null,
      parent2_blob_id: tmpParent2Blob ? tmpParent2Blob.id : null,
      child_blob_id: tmpChildBlob ? tmpChildBlob.id : null,
      signature_change: signatureChange ? JSON.stringify(signatureChange) : null,
    });

    const patientProject = await PatientProject.findOne({
      where: {
        patient_mrn: mrn,
        project_id: projectId,
      },
    });
    await patientProject.update({
      status: 'Submitted Consent Information',
      consent_status: 'Consented',
      consent_id: consentRecord.id,
    });

    // If project is universal consent, add it to erap
    const universalConsentIds = [5,6,7];
    if (universalConsentIds.includes(projectId)) {
      await patientProject.update({
        erap: 1,
      });
    }

    const project = await Project.findByPk(projectId);
    // For brain study add the consent datetime to table
    if (project.protocol_number === 'brain') {
      const brainPatient = await Brain.findOne({
        where: {
          mrn: mrn,
        },
      });
      await brainPatient.update({
        consentDateTime: consentRecord.created_at,
      });
    }

  } catch (e) {
    next(e);
  }

  // generate pdf
  try {
    // Get all checkbox coordinates
    const checkboxCoordinates = await QuizRecord.findAll({
      where: {
        patient_mrn: req.user.mrn,
        project_id: req.session.project_id,
      },
      include: [{
        model: Option,
        required: true,
      },
      {
        model: Quiz,
        required: true,
        where: {
          required: true,
        },
      }],
    }).then((allQuizRecords) => allQuizRecords.map((quizRecord) => quizRecord.option.dataValues));

    if (!raImgData) {
      const ra = await User.findByPk(raUsername);
      const raImgBlob = await Blob.findByPk(ra.signature_id);
      // transparent image if not have signature
      raImgData = raImgBlob ? raImgBlob.content.toString('utf-8') : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    }
    const project = await Project.findByPk(projectId);
    const medium = await Medium.findByPk(project.consent_form_id);
    const fontPath = path.resolve(__dirname, '../../dist/font/arial.ttf');
    var inputPath = path.resolve(__dirname, `../../dist/project/${medium.path}`);
    var outputPath = path.resolve(__dirname, `../../tmp/project/${project.title.replace(/\W+/g, '_')}/pdf_generated`);
    // For brain study use pre-filled form as input and output into the dashboard tmp folder for future downloads
    if (project.protocol_number === 'brain') {
      inputPath = path.resolve(__dirname, `../../dist/project/brain donation/pdf/in_progress/pdf_generated/${req.user.mrn}.pdf`);
      outputPath = path.resolve(__dirname, `../../../dashboard-back/tmp/project/${project.title.replace(/\W+/g, '_')}/pdf_generated`);
    }
    const outputFile = path.join(outputPath, `${mrn}.pdf`);
    await mkdirp(outputPath);

    // parse pdf file first
    const pdfReader = hummus.createReader(inputPath);
    const pdfWriter = hummus.createWriterToModify(inputPath, { modifiedFilePath: outputFile });

    // generate images
    const imageXObject = generateImgObject(imgData, pdfWriter);
    const raImageXObject = generateImgObject(raImgData, pdfWriter);
    const witnessImageXObject = generateImgObject(witnessImgData, pdfWriter);
    const representativeImageXObject = generateImgObject(representativeImgData, pdfWriter);
    const parent1ImageXObject = generateImgObject(parent1ImgData, pdfWriter);
    const parent2ImageXObject = generateImgObject(parent2ImgData, pdfWriter);
    const childImageXObject = generateImgObject(childImgData, pdfWriter);

    // content and coordinates
    const contentDict = {
      patient: {
        sign: imageXObject,
        name: `${firstName} ${lastName}`,
        signX: project.patient_sign_x,
        signY: project.patient_sign_y,
        nameX: project.patient_print_x,
        nameY: project.patient_print_y,
        dateX: project.patient_date_x,
        dateY: project.patient_date_y,
        timeX: project.patient_time_x,
        timeY: project.patient_time_y,
      },
      ra: {
        sign: raImageXObject,
        name: raFullName,
        signX: project.ra_sign_x,
        signY: project.ra_sign_y,
        nameX: project.ra_print_x,
        nameY: project.ra_print_y,
        dateX: project.ra_date_x,
        dateY: project.ra_date_y,
        timeX: project.ra_time_x,
        timeY: project.ra_time_y,
      },
      witness: {
        sign: witnessImageXObject,
        name: witnessFullName,
        signX: project.witness_sign_x,
        signY: project.witness_sign_y,
        nameX: project.witness_print_x,
        nameY: project.witness_print_y,
        dateX: project.witness_date_x,
        dateY: project.witness_date_y,
        timeX: project.witness_time_x,
        timeY: project.witness_time_y,
      },
      relationship_to_child: {
        name: relationshipToChild,
        nameX: project.relationship_to_child_x,
        nameY: project.relationship_to_child_y,
      },
      representative: {
        sign: representativeImageXObject,
        name: representativeFullName,
        signX: project.representative_sign_x,
        signY: project.representative_sign_y,
        nameX: project.representative_print_x,
        nameY: project.representative_print_y,
        dateX: project.representative_date_x,
        dateY: project.representative_date_y,
        timeX: project.representative_time_x,
        timeY: project.representative_time_y,
      },
      interpreter: {
        sign: null,
        name: interpreterFullName,
        signX: null,
        signY: null,
        nameX: project.interpreter_print_x,
        nameY: project.interpreter_print_y,
        dateX: project.interpreter_date_x,
        dateY: project.interpreter_date_y,
        timeX: project.interpreter_time_x,
        timeY: project.interpreter_time_y,
      },
      parent1: {
        sign: parent1ImageXObject,
        name: parent1FullName,
        signX: project.parent1_sign_x,
        signY: project.parent1_sign_y,
        nameX: project.parent1_print_x,
        nameY: project.parent1_print_y,
        dateX: project.parent1_date_x,
        dateY: project.parent1_date_y,
        timeX: project.parent1_time_x,
        timeY: project.parent1_time_y,
      },
      parent2: {
        sign: parent2ImageXObject,
        name: parent2FullName,
        signX: project.parent2_sign_x,
        signY: project.parent2_sign_y,
        nameX: project.parent2_print_x,
        nameY: project.parent2_print_y,
        dateX: project.parent2_date_x,
        dateY: project.parent2_date_y,
        timeX: project.parent2_time_x,
        timeY: project.parent2_time_y,
      },
      child: {
        sign: childImageXObject,
        name: childFullName,
        signX: project.child_sign_x,
        signY: project.child_sign_y,
        nameX: project.child_print_x,
        nameY: project.child_print_y,
        dateX: project.child_date_x,
        dateY: project.child_date_y,
        timeX: project.child_time_x,
        timeY: project.child_time_y,
      },
    };

    // for echo only
    if (projectId === 47) {
      contentDict.echo_obtaining = {
        sign: raImageXObject,
        signX: 50,
        signY: 710,
        dateX: 335,
        dateY: 710,
        timeX: 446,
        timeY: 710,
      };
    }

    // quiz changes
    if (signatureChange) {
      signatureChange.forEach((changes) => {
        Object.keys(changes).forEach((key) => {
          if (key.charAt(0) === '+') {
            Object.keys(changes[key]).forEach((innerKey) => {
              if (innerKey === 'page') {
                project[`${key.substring(1, key.length)}_page`] = changes[key][innerKey];
              } else {
                contentDict[key.substring(1, key.length)][innerKey] = changes[key][innerKey];
              }
            });
          }
        });
      });
    }

    // organize pages
    const lastPage = pdfReader.getPagesCount() - 1;
    const pageDict = {};
    Object.keys(contentDict).forEach((key) => {
      let curPage = lastPage;
      // for echo only
      if (key === 'echo_obtaining') {
        curPage = 13;
      } else if (project[`${key}_page`] !== null) {
        curPage = project[`${key}_page`];
      }
      if (curPage in pageDict) {
        pageDict[curPage].push(key);
      } else {
        pageDict[curPage] = [key];
      }
    });

    // write to pdf
    Object.keys(pageDict).forEach((page) => {
      // loop through pages
      const pageModifier = new hummus.PDFPageModifier(pdfWriter, parseInt(page, 10));
      pageModifier.startContext();
      // loop through content
      pageDict[page].forEach((key) => {
        const content = contentDict[key];
        // signature
        if (content.sign && content.signX && content.signY) {
          pageModifier.getContext()
            .q()
            .cm(0.3, 0, 0, 0.15, content.signX, content.signY)
            .doXObject(content.sign)
            .Q();
        }
        // print name
        if (content.name && content.nameX && content.nameY) {
          pageModifier.getContext()
            .writeText(
              content.name,
              content.nameX, content.nameY,
              {
                font: pdfWriter.getFontForFile(fontPath),
                size: 16,
                colorspace: 'gray',
                color: 0x00,
              },
            );
        }
        // date
        if (content.sign && content.dateX && content.dateY) {
          pageModifier.getContext()
            .writeText(
              new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' }),
              content.dateX, content.dateY,
              {
                font: pdfWriter.getFontForFile(fontPath),
                size: 16,
                colorspace: 'gray',
                color: 0x00,
              },
            );
        }
        // time
        if (content.sign && content.timeX && content.timeY) {
          pageModifier.getContext()
            .writeText(
              new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }),
              content.timeX, content.timeY,
              {
                font: pdfWriter.getFontForFile(fontPath),
                size: 16,
                colorspace: 'gray',
                color: 0x00,
              },
            );
        }
      });
      pageModifier.endContext().writePage();
    });

    // Write checkboxes to pdf
    if (checkboxCoordinates) {
      let curPage = -1;
      let pageModifier = new hummus.PDFPageModifier(pdfWriter, curPage);
      checkboxCoordinates.forEach((coordinate) => {
        if (coordinate.page && coordinate.x && coordinate.y) {
          if (curPage !== coordinate.page) {
            if (curPage !== -1) {
              pageModifier.endContext().writePage();
            }
            curPage = coordinate.page;
            pageModifier = new hummus.PDFPageModifier(pdfWriter, curPage);
          }
          pageModifier.startContext()
            .getContext()
            .writeText(
              'x',
              coordinate.x,
              coordinate.y,
              {
                font: pdfWriter.getFontForFile(fontPath),
                size: 16,
                colorspace: 'gray',
                color: 0x00,
              },
            );
        }
      });
      pageModifier.endContext().writePage();
    }
    pdfWriter.end();

    //Send confirmation email
    if (project.confirmation && project.contact_email) {
      //Generate the email
      let html = `
        <p>A consent has been completed for the ${project.title} Study:</p>
        <p>Patient MRN: ${mrn}</p>
        `;

      //Send the email
      const transporter = nodemailer.createTransport(emailConfig.transportSetting);
      const mailOptions = {
        from: emailConfig.user,
        to: project.contact_email,
        subject: `E-consent confirmation for ${project.title} Study`,
        attachments: [
          {
            filename: `${mrn}.pdf`,
            path: outputFile,
          },
        ],
        html
      };
      await transporter.sendMail(mailOptions);
    }

    // send email if needed
    if (email) {
      const transporter = nodemailer.createTransport(emailConfig.transportSetting);
      const mailOptions = {
        from: emailConfig.user,
        to: email,
        subject: `Consent Form for ${project.title}`,
        attachments: [
          {
            filename: `${project.title}.pdf`,
            path: outputFile,
          },
        ],
      };
      await transporter.sendMail(mailOptions);
    }
    // enable download if needed
    if (req.body.download_check) {
      req.session.download = true;
      req.session.downloadPath = outputFile;
    }
  } catch (e) {
    next(e);
  }

  // push to erap
  try {
    if (req.session.erap && projectId === 1) {
      const donorId = req.user.donor_id;
      const { data } = await axios({
        method: 'GET',
        headers: { 'X-Authorization': erap.token },
        url: `${erap.url}/patient/${donorId}`,
      });
      data.DonorInfo.CONSENTED = 'Y';
      data.DonorInfo.INITIAL_CONSENT_DATE = new Date().toLocaleString();
      data.DonorInfo.WITHDRAW_CONSENT = 'N';
      data.DonorInfo.WITHDRAW_DATE = null;
      await axios({
        method: 'PUT',
        headers: { 'X-Authorization': erap.token },
        data,
        url: `${erap.url}/patient/${donorId}`,
      });
    }
  } catch (e) {
    next(e);
  }

  // get redcap url
  try {
    if (req.session.erap && projectId === 1) {
      const data = {
        token: redcap.token,
        instrument: redcap.instrument,
        content: redcap.content,
        record: req.user.donor_id,
        format: 'json',
        returnFormat: 'json',
      };
      const result = await axios({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        data: qs.stringify(data),
        url: redcap.url,
      }).catch(() => {
        req.session.erap = false;
      });
      if (result) {
        req.session.redcap_url = result.data;
      }
    }
  } catch (e) {
    next(e);
  }

  res.redirect('/questionnaire');
});

module.exports = router;
