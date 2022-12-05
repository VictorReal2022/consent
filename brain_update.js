const dbHelper = require('./src/models/dbHelper');
const { sequelize } = dbHelper;
const hummus = require('hummus');
const Project = dbHelper.project;
const User = dbHelper.user;
const Patient = dbHelper.patient;
const Brain = dbHelper.brain;
const Medium = dbHelper.medium;
const RemoteSession = dbHelper.remoteSession;
const uuidv4 = require('uuid/v4');
const bcrypt = require('bcryptjs');

const nodemailer = require('nodemailer');
const settings = require('./config/settings');
const emailConfig = settings.email;
const path = require('path');
const mkdirp = require('async-mkdirp');

var cron = require('node-cron');

async function main() {
    // fetch list of patients who do not have processed_timestamp
    const patientList = await Brain.findAll({
        where: {
            processed: null
        }
    });
    if (patientList.length === 0) {
      console.log('No new patients')
    }

    // For each patient we will create them in iOpen as new patients and add them to the project
    for (const p of patientList) {
        try {
            // Project id for Brain
            const projectId = 52;

            // Insert the patient
            await Patient.upsert({
                mrn: p.mrn,
                first_name: p.nokFirstName,
                last_name: p.nokLastName,
                email: p.nokEmail,
            });

            // Add patient to the brain project
            const patient = await Patient.findByPk(p.mrn);
            await patient.addProject(projectId, {
                through: {
                    consent_status: 'Pending',
                    erap: false,
                },
            });
        }
        catch (e) {
            console.log(e);
        }

        // Begin creation of remote session
        // generate random string
        const saltRounds = 4;
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        let r = '';
        for (let i = 0; i < 4; i += 1) {
            r += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        try {
            // find previous record first
            // Values for patient mrn from brain table, projectid for brain project, and user id for brain user account
            const mrn = p.mrn;
            const projectId = 52;
            const user = await User.findOne({
                where: {
                    username: 'admin',
                },
            });
            let remoteSession = await RemoteSession.findOne({
                where: {
                    patient_mrn: mrn,
                    project_id: projectId,
                    user_username: user.username,
                },
            });
            // If the session already exists update it
            if (remoteSession) {
                await remoteSession.update({
                    hashed_password: await bcrypt.hash(r, saltRounds),
                });
            } else {
                // create and save a new record
                remoteSession = await RemoteSession.create({
                    session_id: await uuidv4(),
                    hashed_password: await bcrypt.hash(r, saltRounds),
                    patient_mrn: mrn,
                    project_id: projectId,
                    user_username: user.username,
                });
            }
            // deliver the email
            // drawing the invite template first
            let html = `
            <p>Thank you for agreeing to donate your loved one’s tissue. It will help us generate knowledge that may improve the health and well-being of countless others. We must complete the consent process to proceed with the donation. Please click the following link to complete the donation consent process:</p>
            <a href="\${ahref}">iOPEN</a>
            <p>After you click the link above, please enter the following PIN:</p>
            <h2>\${rcode}</h2>
            `;

            const tag = (strings, exp) => exp.replace('${ahref}', `https://e-consent.mssm.edu/login/remote/${remoteSession.session_id}`).replace('${rcode}', r);
            html = tag`${html}`;

            // send the email
            const transporter = nodemailer.createTransport(emailConfig.transportSetting);
            const mailOptions = {
                from: emailConfig.user,
                to: p.nokEmail,
                subject: 'Anatomical Gift Consent to the Mount Sinai NIH Brain and Tissue Repository',
                html,
            };
            await transporter.sendMail(mailOptions);
        }
        catch (e) {
            console.log(e);
        }

        //Generate the pdf with all data and add it to tmp folder in consent module
        const project = await Project.findByPk(52);
        const medium = await Medium.findByPk(project.consent_form_id);
        const fontPath = path.resolve(__dirname, './dist/font/arial.ttf');
        const inputPath = path.resolve(__dirname, `./dist/project/${medium.path}`);
        const outputPath = path.resolve( __dirname, `./dist/project/brain donation/pdf/in_progress/pdf_generated`);
        const outputFile = path.join(outputPath, `${p.mrn}.pdf`);
        await mkdirp(outputPath);
        const pdfWriter = hummus.createWriterToModify(inputPath, { modifiedFilePath: outputFile });
        
        const pageModifier = new hummus.PDFPageModifier(pdfWriter, 0);
        pageModifier.startContext();
        // print relationship
        if (p.relationship) {
            pageModifier.getContext()
              .writeText(
                p.relationship,
                50, 579,
                {
                  font: pdfWriter.getFontForFile(fontPath),
                  size: 16,
                  colorspace: 'gray',
                  color: 0x00,
                },
              );
          }
        // print decedent name
        if (p.decedentFirstName && p.decedentLastName) {
            pageModifier.getContext()
              .writeText(
                p.decedentFirstName + ' ' + p.decedentLastName,
                389, 579,
                {
                  font: pdfWriter.getFontForFile(fontPath),
                  size: 16,
                  colorspace: 'gray',
                  color: 0x00,
                },
              );
          }

        // print address 1
        if (p.address1) {
            pageModifier.getContext()
              .writeText(
                p.address1,
                50, 122,
                {
                  font: pdfWriter.getFontForFile(fontPath),
                  size: 16,
                  colorspace: 'gray',
                  color: 0x00,
                },
              );
          }

        // print address 2
        if (p.address2) {
            pageModifier.getContext()
              .writeText(
                p.address2,
                50, 105,
                {
                  font: pdfWriter.getFontForFile(fontPath),
                  size: 16,
                  colorspace: 'gray',
                  color: 0x00,
                },
              );
          }

        // print city/state/zip
        if (p.cityStateZip) {
            pageModifier.getContext()
              .writeText(
                p.cityStateZip,
                50, 84,
                {
                  font: pdfWriter.getFontForFile(fontPath),
                  size: 16,
                  colorspace: 'gray',
                  color: 0x00,
                },
              );
          }

        // print phone
        if (p.nokMobilePhone) {
            pageModifier.getContext()
              .writeText(
                p.nokMobilePhone,
                411, 122,
                {
                  font: pdfWriter.getFontForFile(fontPath),
                  size: 16,
                  colorspace: 'gray',
                  color: 0x00,
                },
              );
          }

        // print dob
        if (p.dob) {
            pageModifier.getContext()
              .writeText(
                p.dob,
                421, 105,
                {
                  font: pdfWriter.getFontForFile(fontPath),
                  size: 16,
                  colorspace: 'gray',
                  color: 0x00,
                },
              );
          }

        // print ssn
        if (p.ssn) {
            pageModifier.getContext()
              .writeText(
                p.ssn,
                431, 84,
                {
                  font: pdfWriter.getFontForFile(fontPath),
                  size: 16,
                  colorspace: 'gray',
                  color: 0x00,
                },
              );
          }
          pageModifier.endContext().writePage();
          pdfWriter.end();

        //Now that the patient is created and email is sent, update Brain table to add processed datetime
        try {
            await Brain.upsert({
              mrn: p.mrn,
              id: p.id,
              processed: new Date().toLocaleString(),
              decedentFirstName: p.decedentFirstName,
              decedentLastName: p.decedentLastName,
              nokFirstName: p.nokFirstName,
              nokLastName: p.nokLastName,
              relationship: p.relationship,
              nokEmail: p.nokEmail, 
              deliveryMethod: p.deliveryMethod,
            })
        }
        catch (e) {
            console.log(e);
        }
    }
}

cron.schedule('*/5 * * * *', () => {
  try {
    main().then();
  } catch (e) {
      console.log(e);
  }
});


