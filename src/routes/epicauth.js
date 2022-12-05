const express = require('express');
const dbHelper = require('../models/dbHelper');
const Passport = require('../middlewares/passport');
const axios = require('axios')
const { v4: uuidv4 } = require('uuid');
var qs = require('qs');
const router = express.Router();
const Project = dbHelper.project;
const Language = dbHelper.language;
const Protocol = dbHelper.protocol;

var uuid = "";
var tokenEndpoint;
//fhir epic clinet ID
//var ClientID = '92600667-f68b-4bcb-9d93-c920c876d6be'
//App ochard client ID 
var ClientID = '7d81efd7-141e-4186-970f-ee070bf570b6'

var fireServerEndpoint = ""

router.get('/launch', (req, res) => {
    //step 1 getting "ISS" and "launch token"
    var launchToken = req.query.launch;
    fireServerEndpoint = req.query.iss;
    //step 2 get authorize and token endpoints
    var authorizeEndpoint;
    const getAuthEndpoint = async () => {
        const promise = await axios.get(fireServerEndpoint + "/metadata", {
            headers: {
                'Accept': 'application/json',
                'Epic-Client-ID': ClientID,
            }, withCredentials: true, crossdomain: true
        }).then(res => {
            return res.data.rest[0].security.extension[0];
        }).catch(error => {
            console.error("Step 2: " + error);
        })
        return promise;
    }

    //step 3 post parameter to the endpoint
    const redirectToURL = async () => {
        const endpointLink = await getAuthEndpoint();
        authorizeEndpoint = endpointLink.extension[0].valueUri;
        tokenEndpoint = endpointLink.extension[1].valueUri;
        var redirectURI = "http://localhost:3002/epicauth/epic";
        uuid = uuidv4();
        var bodyparm = {
            response_type: 'code',
            client_id: ClientID,
            redirect_uri: redirectURI,
            launch: launchToken,
            scope: "launch",
            state: uuid,
        };
        const promise = await axios
            .post(authorizeEndpoint, null, { params: bodyparm })
            .then(response => {
                return response.request.res.responseUrl;
            })
            .catch(error => {
                console.error(error);
            })
        return promise;
    }
    const pleaseRedirect = async () => {
        const callRedirectURL = await redirectToURL();
        res.redirect(callRedirectURL);
    }
    pleaseRedirect()
});

//step 4 
router.get('/epic', (req, res) => {
    //set 4 
    var authorizationCode = req.query.code;
    var returnState = req.query.state;
    var authUrl = fireServerEndpoint + "/Patient/"
    if (uuid == returnState) {
        //set 5 
        const tokenRequest = async () => {
            const tokenRequestParam = qs.stringify({
                grant_type: 'authorization_code',
                code: authorizationCode,
                redirect_uri: "http://localhost:3002/epicauth/epic",
                client_id: ClientID,
            });
            const promise = await axios
                .post(tokenEndpoint, tokenRequestParam, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                .then(response => {
                    return response.data;
                })
                .catch(error => {
                    console.error("Step 5: " + error);
                })
            return promise;
        }

        const GetpatientData = async () => {
            const returnToken = await tokenRequest();
            var accessToken = returnToken.access_token;
            var PatientID = returnToken.patient;
            const promise = await axios
                .get(authUrl + PatientID,
                    {
                        headers: {
                            'Authorization': 'Bearer ' + accessToken
                        }

                    }).then(res => {
                        return res.data
                    }).catch(error => {
                        console.error("this is an error from step 6 " + error)
                    })
            return promise;
        }
        const collectData = async () => {
            const patientData = await GetpatientData();
            var name = 'first last';
            if (patientData.name.some(e => e.use === 'official')) {
              name = patientData.name.find(record => record.use === 'official').text;
            }
            const nameSplit = name.split(" ");
            var firstName = nameSplit[0];
            var lastName = nameSplit[1];
            var email = ''
            var phone = ''
            if (patientData.telecom.some(e => e.use === 'email')) {
              email = patientData.telecom.find(record => record.use === 'email').value;
            }
            if (patientData.telecom.some(e => e.use === 'mobile')) {
              phone = patientData.telecom.find(record => record.use === 'mobile').value;
            }
            var gender = patientData.gender;
            var DOB = patientData.birthDate;
            patientData.name.map(element => {
                if(element.use == "official"){
                    firstName = element.given[0];
                    lastName = element.family;
                }
            })
            var MRN = '';
            patientData.identifier.map(element => {
                if (element.type) {
                    if (element.type.text == 'MRN') {  
                        MRN = element.value;
                    }
                }
            })
            console.log(MRN + ' ' + firstName + ' ' + lastName + ' ' + email + ' ' + phone + ' ' + gender + ' ' + DOB);
            req.session.subject = MRN;
            req.session.gender = gender;
            req.session.dob = DOB;
            req.session.firstName = firstName;
            req.session.lastName = lastName;
            req.session.phone = phone;
            req.session.email = email;

            res.render('epicauth', {
                layout: 'default',
                message: req.flash('error'),
                formData: req.flash('formData')[0],
              });
        }
        collectData();
    }
});

router.post('/epic', async (req, res) => {
    req.body.subject = req.session.subject;
    req.body.gender = req.session.gender;
    req.body.dob = req.session.dob;
    req.body.firstName = req.session.firstName;
    req.body.lastName = req.session.lastName;
    req.body.phone = req.session.phone;
    req.body.email = req.session.email;

    req.body.username = 'admin';
    req.body.password = 'no_password_required';
    req.body.from_direct = true;

    req.session.project_id = parseInt(req.body.inputlanguage, 10);
    const project = await Project.findByPk(req.session.project_id);
    
    // record protocol length
    let protocols = await Protocol.findAll({
        where: {
            project_id: req.session.project_id,
        },
    });
    if (protocols.length === 0) {
        Error.sendProjectError(req, res);
        return;
    }
    req.session.protocol = { max_num: protocols.length };

    // record required length
    protocols = await Protocol.findAll({
        where: {
            project_id: req.session.project_id,
            required: true,
        },
    });
    req.session.required = {
        completed: protocols.length === 0,
        max_num: Math.max(...protocols.map((p) => p.num), 0),
    };

    // Get the language code for the project
    languageCode = project.language;
    // Get array of key/value pairs from database
    let lang = await Language.findAll({
        attributes: ['keyword', languageCode],
        raw: true
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
