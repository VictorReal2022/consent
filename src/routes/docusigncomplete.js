const express = require('express'),
docusign = require('docusign-esign'),
fs = require('fs'),
moment = require('moment')
const mkdirp = require('mkdirp');
const path = require('path');

const docusignSettings = require('../../config/settings').docusign;
const router = express.Router();

const dbHelper = require('../models/dbHelper');
const Patient = dbHelper.patient;
const PatientProject = dbHelper.patientProject;
const ConsentRecord = dbHelper.consentRecord;
const Project = dbHelper.project;

router.get('/', async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You need to sign in first');
    res.redirect('/login');
    return;
  }
  if (!req.session.docusign) {
    res.redirect('/login');
    return;
  }
  //If we haven't sent the user to docusign yet redirect them back
  if (!req.session.docusignsent) {
    req.flash('error', 'You did not complete the docusign');
    res.redirect('/docusignconsent');
    return;
  }
  // Check if docusign has had the consent form completed then download it to the server, then update db accordingly
  try {    
    // Establish the docusign connection
    let token = await getToken();
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(docusignSettings.baseURI);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + token.accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    results = await envelopesApi.getEnvelope(docusignSettings.accountId, req.session.envelopeId, null);
    // If the docusign has been completed
    if (results.status === 'completed') {
      // Download the document
      let documents = await envelopesApi.listDocuments(docusignSettings.accountId, req.session.envelopeId, null);
      // let documentIdGuid = documents.envelopeDocuments[0].documentIdGuid;
      let documentId = documents.envelopeDocuments[0].documentId;
      // Get the file path
      const project = await Project.findByPk(req.session.project_id);
      const outputPath = path.resolve(__dirname, `../../../dashboard-back/tmp/project/${project.title.replace(/\W+/g, '_')}/pdf_generated`);
      // Create the directory if it doesn't already exist
      await mkdirp(outputPath);
      const outputFile = path.join(outputPath, `${req.user.mrn}.pdf`);
      // Get the document from docusign 
      const content = await envelopesApi.getDocument(docusignSettings.accountId, req.session.envelopeId, documentId, null);
      //Write file to server
      fs.writeFile(outputFile, content, 'binary', function(err) {
        console.log(err);
      });
      // Create a consent record
      const { mrn } = req.user;
      // Get consent name from previous form
      const patient = await Patient.findByPk(req.user.mrn);
      const firstName = patient.first_name ? patient.first_name : 'NA';
      const lastName = patient.last_name ? patient.last_name : 'NA';
      // Create the consent record and update the patient project
      const consentRecord = await ConsentRecord.create({
        patient_mrn: mrn,
        user_username: req.session.ra.username,
        project_id: req.session.project_id,
        full_name: `${firstName} ${lastName}`.trim() || null,
        consent_type: 'Electronic',
        ra_full_name: req.session.ra.name,
      });
      const patientProject = await PatientProject.findOne({
        where: {
          patient_mrn: mrn,
          project_id: req.session.project_id,
        },
      });
      await patientProject.update({
        status: 'Submitted Consent Information',
        consent_status: 'Consented',
        consent_id: consentRecord.id,
      });
      res.redirect('/questionnaire');
    }
    // If the user did not complete the docusign send them back to consent form
    else {
      req.flash('error', 'You did not complete the docusign');
      res.redirect('/docusignconsent');
      return;
    }
  } catch (e) {
    next(e);
  }
});

async function getToken() {
  //Docusign authentication
  let tokenReplaceMin = 10 
  rsaKey = fs.readFileSync(docusignSettings.privateKeyLocation);
  const jwtLifeSec = 10 * 60, // requested lifetime for the JWT is 10 min
      dsApi = new docusign.ApiClient();
  dsApi.setOAuthBasePath(docusignSettings.dsOauthServer.replace('https://', '')); // it should be domain only.
  const results = await dsApi.requestJWTUserToken(docusignSettings.dsClientId,
    docusignSettings.impersonatedUserGuid, "signature", rsaKey,
      jwtLifeSec);
  const expiresAt = moment().add(results.body.expires_in, 's').subtract(tokenReplaceMin, 'm');
  this.accessToken = results.body.access_token;
  this._tokenExpiration = expiresAt;
  return {
      accessToken: results.body.access_token,
      tokenExpirationTimestamp: expiresAt
  };
}

module.exports = router;
