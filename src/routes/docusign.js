const express = require('express'),
docusign = require('docusign-esign'),
fs = require('fs'),
moment = require('moment')

const docusignSettings = require('../../config/settings').docusign;
const router = express.Router();

const dbHelper = require('../models/dbHelper');
const Patient = dbHelper.patient;

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
  try {    
    // Create unique identifier for docusign (projectid-mrn)
    mrn_project_id = `${req.session.project_id}-${req.user.mrn}`;
    //Get patient data
    const patient = await Patient.findByPk(req.user.mrn);
    const firstName = patient.first_name ? patient.first_name : 'NA';
    const lastName = patient.last_name ? patient.last_name : 'NA';
    const email = patient.email ? patient.email : `${mrn_project_id}@no_reply.noemailprovided.com`;
    // Get the access token
    let token = await getToken();
    // Establish the docusign connection
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(docusignSettings.baseURI);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + token.accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    // Create the envelope with our template and unique identifier
    let envelope = makeEnvelope(mrn_project_id, req.session.docusign_template, firstName, lastName, email);
    // Send envelope to docusign
    let results = await envelopesApi.createEnvelope(docusignSettings.accountId, {envelopeDefinition: envelope});
    // Store envelope id in session
    req.session.envelopeId = results.envelopeId;
    // Now send the user into the docusign view to complete
    let viewRequest = makeRecipientViewRequest(mrn_project_id, firstName, lastName, email);
    results = await envelopesApi.createRecipientView(docusignSettings.accountId, req.session.envelopeId,
      {recipientViewRequest: viewRequest});
    req.session.docusignsent = true;
    res.redirect(results.url);
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

function makeEnvelope(mrn_project_id, template, firstName, lastName, email){
  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.templateId = template;
  // Create template role elements to connect the signer and cc recipients
  // to the template
  // We're setting the parameters via the object creation
  let signer1 = docusign.TemplateRole.constructFromObject({
      email: email,
      name: `${firstName} ${lastName}`.trim(),
      clientUserId: mrn_project_id,
      roleName: 'signer'});

  // Add the TemplateRole objects to the envelope object
  env.templateRoles = [signer1];
  env.status = "sent"; // We want the envelope to be sent
  return env;
}

function makeRecipientViewRequest(mrn_project_id, firstName, lastName, email) {
  let viewRequest = new docusign.RecipientViewRequest();
  // Set the url where you want the recipient to go once they are done signing
  // should typically be a callback route somewhere in your app.
  // The query parameter is included as an example of how
  // to save/recover state information during the redirect to
  // the DocuSign signing. It's usually better to use
  // the session mechanism of your web framework. Query parameters
  // can be changed/spoofed very easily.
  viewRequest.returnUrl = docusignSettings.dsReturnUrl;

  // How has your app authenticated the user? In addition to your app's
  // authentication, you can include authenticate steps from DocuSign.
  // Eg, SMS authentication
  viewRequest.authenticationMethod = 'none';

  // Recipient information must match embedded recipient info
  // we used to create the envelope.
  viewRequest.email = email;
  viewRequest.userName = `${firstName} ${lastName}`.trim();
  viewRequest.clientUserId = mrn_project_id;

  // DocuSign recommends that you redirect to DocuSign for the
  // embedded signing. There are multiple ways to save state.
  // To maintain your application's session, use the pingUrl
  // parameter. It causes the DocuSign signing web page
  // (not the DocuSign server) to send pings via AJAX to your
  // app,
  //viewRequest.pingFrequency = 600; // seconds
  // NOTE: The pings will only be sent if the pingUrl is an https address
  //viewRequest.pingUrl = args.dsPingUrl; // optional setting
  return viewRequest
}

module.exports = router;
