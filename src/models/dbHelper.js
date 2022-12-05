const Sequelize = require('sequelize');
const dbConfig = require('../../config/settings').db;
const moment = require('moment');


/**
 * Database Connection
 */
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  dialectOptions: dbConfig.dialectOptions,
});

/**
 * Dictionaries
 */
const Text = sequelize.define('text', {
  content: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
}, { underscored: true });

const Blob = sequelize.define('blob', {
  content: {
    type: Sequelize.BLOB,
    allowNull: false,
  },
}, { underscored: true });

const Medium = sequelize.define('medium', {
  path: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  type: Sequelize.STRING(10),
}, { underscored: true });

/**
 * Unit Models
 */
const Patient = sequelize.define('patient', {
  mrn: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  donor_id: Sequelize.STRING,
  is_demo: Sequelize.BOOLEAN,
  first_name: {
    type: Sequelize.STRING,
    defaultValue: 'None',
  },
  last_name: {
    type: Sequelize.STRING,
    defaultValue: 'None',
  },
  gender: {
    type: Sequelize.STRING,
    defaultValue: 'Male',
  },
  dob: {
    type: Sequelize.DATEONLY,
    defaultValue: '1800-01-01',
  },
  phone: Sequelize.STRING,
  email: Sequelize.STRING,
}, {
  indexes: [
    {
      unique: true,
      fields: ['donor_id'],
      where: {
        donor_id: {
          [Sequelize.Op.ne]: null,
        },
      },
    },
  ],
  underscored: true,
});

const User = sequelize.define('user', {
  username: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  hashed_password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  name: Sequelize.STRING,
  role: Sequelize.STRING,
  avatar: Sequelize.STRING,
  session_id: Sequelize.STRING,
}, { underscored: true });

const Brain = sequelize.define('brain', {
  mrn: Sequelize.STRING,
  decedentFirstName: Sequelize.STRING,
  decedentLastName: Sequelize.STRING,
  consentDateTime: Sequelize.DATE,
  nokFirstName: Sequelize.STRING,
  nokLastName: Sequelize.STRING,
  relationship: Sequelize.STRING,
  address1: Sequelize.STRING,
  address2: Sequelize.STRING,
  cityStateZip: Sequelize.STRING,
  nokHomePhone: Sequelize.STRING,
  nokMobilePhone: Sequelize.STRING,
  nokEmail: Sequelize.STRING,
  dob: {
    type: Sequelize.DATEONLY,
    get: function() {
        return moment.utc(this.getDataValue('dob')).format('YYYY-MM-DD');
      }
    },
  ssn: Sequelize.STRING,
  deliveryMethod: Sequelize.INTEGER,
  processed: Sequelize.DATE,
}, {
  timestamps: false
});

const Language = sequelize.define('language', {
  keyword: {
    type: Sequelize.STRING(3000),
    allowNull: false,
  },
  en: Sequelize.STRING(3000),
  es: Sequelize.STRING(3000),
  zh: Sequelize.STRING(3000),
}, {
  timestamps: false
});

const Project = sequelize.define('project', {
  protocol_number: Sequelize.STRING,
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  expiration_date: Sequelize.DATEONLY,
  disabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  faq: Sequelize.STRING,
  contact_email: Sequelize.STRING,
  language:  {
    type: Sequelize.STRING,
    defaultValue: 'en',
  },
  direct_ra:  {
    type: Sequelize.STRING,
    defaultValue: 'admin',
  },
  confirmation: Sequelize.BOOLEAN,
  docusign: Sequelize.STRING,
  survey: Sequelize.STRING,
  email: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  download: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  patient: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  allow_skip: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  patient_page: Sequelize.INTEGER,
  patient_print_x: Sequelize.INTEGER,
  patient_print_y: Sequelize.INTEGER,
  patient_sign_x: Sequelize.INTEGER,
  patient_sign_y: Sequelize.INTEGER,
  patient_date_x: Sequelize.INTEGER,
  patient_date_y: Sequelize.INTEGER,
  patient_time_x: Sequelize.INTEGER,
  patient_time_y: Sequelize.INTEGER,
  ra_modify: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  ra_page: Sequelize.INTEGER,
  ra_print_x: Sequelize.INTEGER,
  ra_print_y: Sequelize.INTEGER,
  ra_sign_x: Sequelize.INTEGER,
  ra_sign_y: Sequelize.INTEGER,
  ra_date_x: Sequelize.INTEGER,
  ra_date_y: Sequelize.INTEGER,
  ra_time_x: Sequelize.INTEGER,
  ra_time_y: Sequelize.INTEGER,
  witness: Sequelize.BOOLEAN,
  witness_page: Sequelize.INTEGER,
  witness_print_x: Sequelize.INTEGER,
  witness_print_y: Sequelize.INTEGER,
  witness_sign_x: Sequelize.INTEGER,
  witness_sign_y: Sequelize.INTEGER,
  witness_date_x: Sequelize.INTEGER,
  witness_date_y: Sequelize.INTEGER,
  witness_time_x: Sequelize.INTEGER,
  witness_time_y: Sequelize.INTEGER,
  relationship_to_child: Sequelize.BOOLEAN,
  relationship_to_child_page: Sequelize.INTEGER,
  relationship_to_child_x: Sequelize.INTEGER,
  relationship_to_child_y: Sequelize.INTEGER,
  representative: Sequelize.BOOLEAN,
  representative_page: Sequelize.INTEGER,
  representative_print_x: Sequelize.INTEGER,
  representative_print_y: Sequelize.INTEGER,
  representative_sign_x: Sequelize.INTEGER,
  representative_sign_y: Sequelize.INTEGER,
  representative_date_x: Sequelize.INTEGER,
  representative_date_y: Sequelize.INTEGER,
  representative_time_x: Sequelize.INTEGER,
  representative_time_y: Sequelize.INTEGER,
  interpreter: Sequelize.BOOLEAN,
  interpreter_page: Sequelize.INTEGER,
  interpreter_print_x: Sequelize.INTEGER,
  interpreter_print_y: Sequelize.INTEGER,
  interpreter_sign_x: Sequelize.INTEGER,
  interpreter_sign_y: Sequelize.INTEGER,
  interpreter_date_x: Sequelize.INTEGER,
  interpreter_date_y: Sequelize.INTEGER,
  interpreter_time_x: Sequelize.INTEGER,
  interpreter_time_y: Sequelize.INTEGER,
  parent1: Sequelize.BOOLEAN,
  parent1_page: Sequelize.INTEGER,
  parent1_print_x: Sequelize.INTEGER,
  parent1_print_y: Sequelize.INTEGER,
  parent1_sign_x: Sequelize.INTEGER,
  parent1_sign_y: Sequelize.INTEGER,
  parent1_date_x: Sequelize.INTEGER,
  parent1_date_y: Sequelize.INTEGER,
  parent1_time_x: Sequelize.INTEGER,
  parent1_time_y: Sequelize.INTEGER,
  parent1_decline: Sequelize.BOOLEAN,
  parent2: Sequelize.BOOLEAN,
  parent2_page: Sequelize.INTEGER,
  parent2_print_x: Sequelize.INTEGER,
  parent2_print_y: Sequelize.INTEGER,
  parent2_sign_x: Sequelize.INTEGER,
  parent2_sign_y: Sequelize.INTEGER,
  parent2_date_x: Sequelize.INTEGER,
  parent2_date_y: Sequelize.INTEGER,
  parent2_time_x: Sequelize.INTEGER,
  parent2_time_y: Sequelize.INTEGER,
  child: Sequelize.BOOLEAN,
  child_page: Sequelize.INTEGER,
  child_print_x: Sequelize.INTEGER,
  child_print_y: Sequelize.INTEGER,
  child_sign_x: Sequelize.INTEGER,
  child_sign_y: Sequelize.INTEGER,
  child_date_x: Sequelize.INTEGER,
  child_date_y: Sequelize.INTEGER,
  child_time_x: Sequelize.INTEGER,
  child_time_y: Sequelize.INTEGER,
}, { underscored: true });

const ProjectStrings = sequelize.define('project_strings', {
  invite_template: Sequelize.BLOB,
  section_complete: Sequelize.TEXT,
  education_decision: Sequelize.TEXT,
  consent_decision_top: Sequelize.TEXT,
  consent_decision_bottom: Sequelize.TEXT,
  consent_take_survey: Sequelize.TEXT,
  error_message: Sequelize.TEXT,
}, { underscored: true });

const Protocol = sequelize.define('protocol', {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  num: Sequelize.INTEGER,
  required: Sequelize.BOOLEAN,
}, { underscored: true });

const Section = sequelize.define('section', {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  num: Sequelize.INTEGER,
}, { underscored: true });

const Tip = sequelize.define('tip', {
  num: Sequelize.INTEGER,
}, { underscored: true });

const Quiz = sequelize.define('quiz', {
  num: Sequelize.INTEGER,
  required: Sequelize.BOOLEAN,
}, { underscored: true });

const Option = sequelize.define('option', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  correctness: Sequelize.BOOLEAN,
  signature_change: Sequelize.STRING,
  page: Sequelize.INTEGER,
  x: Sequelize.INTEGER,
  y: Sequelize.INTEGER,
}, { underscored: true });

const Survey = sequelize.define('survey', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
}, { underscored: true });

/**
 * Compound Models
 */
const EmailAttachment = sequelize.define('email_attachment', {
  cid: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  filename: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, { underscored: true });

const Erap = sequelize.define('erap', {
  consent_date: Sequelize.DATE,
  consented_by: Sequelize.STRING,
  consent_id: Sequelize.INTEGER,
  withdraw: Sequelize.BOOLEAN,
  withdrawal_date: Sequelize.DATE,
  mrn: Sequelize.STRING,
  first_name: Sequelize.STRING,
  last_name: Sequelize.STRING,
  gender: Sequelize.STRING,
  dob: Sequelize.STRING,
  exception_status: Sequelize.STRING,
  exception_reason: Sequelize.STRING,
  insert_timestamp: Sequelize.DATE,
  processed_timestamp: Sequelize.DATE,
}, { underscored: true, timestamps: false, freezeTableName: true });

const PatientProject = sequelize.define('patient_project', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  status: Sequelize.STRING,
  erap: Sequelize.BOOLEAN,
  epic: Sequelize.BOOLEAN,
  icore: Sequelize.BOOLEAN,
  withdraw: Sequelize.BOOLEAN,
  withdraw_date: Sequelize.DATE,
  consent_status: {
    type: Sequelize.STRING,
    defaultValue: 'Pending',
  },
}, { underscored: true });

const RemoteSession = sequelize.define('remote_patient_session', {
  session_id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  hashed_password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  patient_mrn: {
    type: Sequelize.STRING,
    references: {
      model: Patient,
      key: 'mrn',
    },
  },
  project_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Project,
      key: 'id',
    },
  },
  user_username: {
    type: Sequelize.STRING,
    references: {
      model: User,
      key: 'username',
    },
  },
}, { underscored: true });

/**
 * Associations
 */
Text.hasOne(Protocol, { as: 'ShortText', foreignKey: 'short_text_id' });
Text.hasOne(Protocol, { as: 'LongText', foreignKey: 'long_text_id' });
Text.hasOne(Tip);
Text.hasOne(Quiz);

Medium.hasOne(Project, { as: 'ConsentForm', foreignKey: 'consent_form_id' });
Medium.hasOne(Section);
Medium.hasOne(Protocol);
Medium.hasOne(Tip);
Medium.hasOne(Quiz);

Blob.hasOne(User, { as: 'Signature' });

Project.hasOne(ProjectStrings, { as: 'ProjectStrings' });
ProjectStrings.belongsTo(Project, { as: 'StringsSource' });
Project.hasMany(Protocol);
Project.hasMany(Section);
Patient.belongsToMany(Project, { through: PatientProject });
Project.belongsToMany(Patient, { through: PatientProject });
User.belongsToMany(Project, { through: 'user_project' });
Project.belongsToMany(User, { through: 'user_project' });
Medium.belongsToMany(Project, { as: 'AttachmentSources', through: EmailAttachment });
Project.belongsToMany(Medium, { as: 'EmailAttachments', through: EmailAttachment });

Protocol.hasMany(Quiz);
Section.hasMany(Tip);
Tip.hasMany(Quiz);

Quiz.belongsToMany(Text, { as: 'Options', through: Option });
Text.belongsToMany(Quiz, { as: 'OptionSources', through: Option });

Project.belongsToMany(Text, { as: 'Surveys', through: Survey });
Text.belongsToMany(Project, { as: 'SurveySources', through: Survey });

/**
 * Patient Records
 */
const MessageRecord = sequelize.define('message_record', {
  patient_mrn: {
    type: Sequelize.STRING,
    references: {
      model: Patient,
      key: 'mrn',
    },
  },
  blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  project_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Project,
      key: 'id',
    },
  },
  status: Sequelize.STRING,
}, { underscored: true });

const MessageReplyRecord = sequelize.define('message_reply_record', {
  message_record_id: {
    type: Sequelize.INTEGER,
    references: {
      model: MessageRecord,
      key: 'id',
    },
  },
  user_username: {
    type: Sequelize.STRING,
    references: {
      model: User,
      key: 'username',
    },
  },
  blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  status: Sequelize.STRING,
}, { underscored: true });

const EducationProgressRecord = sequelize.define('education_progress_record', {
  patient_mrn: {
    type: Sequelize.STRING,
    references: {
      model: Patient,
      key: 'mrn',
    },
  },
  project_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Project,
      key: 'id',
    },
  },
  tip_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Tip,
      key: 'id',
    },
  },
}, { underscored: true });

const ConsentProgressRecord = sequelize.define('consent_progress_record', {
  patient_mrn: {
    type: Sequelize.STRING,
    references: {
      model: Patient,
      key: 'mrn',
    },
  },
  project_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Project,
      key: 'id',
    },
  },
  protocol_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Protocol,
      key: 'id',
    },
  },
}, { underscored: true });

const ConsentRecord = sequelize.define('consent_record', {
  patient_mrn: {
    type: Sequelize.STRING,
    references: {
      model: Patient,
      key: 'mrn',
    },
  },
  user_username: {
    type: Sequelize.STRING,
    references: {
      model: User,
      key: 'username',
    },
  },
  project_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Project,
      key: 'id',
    },
  },
  full_name: Sequelize.STRING,
  consent_type: Sequelize.STRING,
  ra_full_name: Sequelize.STRING,
  witness_full_name: Sequelize.STRING,
  representative_full_name: Sequelize.STRING,
  relationship_to_child: Sequelize.STRING,
  parent1_full_name: Sequelize.STRING,
  parent2_full_name: Sequelize.STRING,
  child_full_name: Sequelize.STRING,
  interpreter_full_name: Sequelize.STRING,
  blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  ra_blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  witness_blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  parent1_blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  parent2_blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  representative_blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  child_blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  interpreter_blob_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Blob,
      key: 'id',
    },
  },
  signature_change: Sequelize.STRING,
}, { underscored: true });

const QuizRecord = sequelize.define('quiz_record', {}, { underscored: true });

QuizRecord.belongsTo(Option, {
  foreignKey: 'option_id',
});
QuizRecord.belongsTo(Quiz, {
  foreignKey: 'quiz_id',
});
QuizRecord.belongsTo(Project, {
  foreignKey: 'project_id',
});
QuizRecord.belongsTo(Patient, {
  foreignKey: 'patient_mrn',
});

const SurveyRecord = sequelize.define('survey_record', {
  patient_mrn: {
    type: Sequelize.STRING,
    references: {
      model: Patient,
      key: 'mrn',
    },
  },
  survey_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Survey,
      key: 'id',
    },
  },
  answer: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
}, { underscored: true });

const ErrorRecord = sequelize.define('error_record', {
  patient_mrn: {
    type: Sequelize.STRING,
    references: {
      model: Patient,
      key: 'mrn',
    },
  },
  error_code: {
    type: Sequelize.INTEGER,
  },
}, { underscored: true });

PatientProject.belongsTo(ConsentRecord, {
  foreignKey: 'consent_id',
});

module.exports = {
  sequelize,
  text: Text,
  blob: Blob,
  medium: Medium,
  patient: Patient,
  brain: Brain,
  user: User,
  project: Project,
  language: Language,
  projectStrings: ProjectStrings,
  patientProject: PatientProject,
  emailAttachment: EmailAttachment,
  remoteSession: RemoteSession,
  protocol: Protocol,
  section: Section,
  tip: Tip,
  quiz: Quiz,
  option: Option,
  survey: Survey,
  messageRecord: MessageRecord,
  messageReplyRecord: MessageReplyRecord,
  educationProgressRecord: EducationProgressRecord,
  consentProgressRecord: ConsentProgressRecord,
  consentRecord: ConsentRecord,
  quizRecord: QuizRecord,
  surveyRecord: SurveyRecord,
  errorRecord: ErrorRecord,
  erap: Erap,
};
