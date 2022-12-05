import './default';
import '../css/consent.css';
import 'holderjs/holder.min';
import SignaturePad from 'signature_pad/dist/signature_pad.min';

(() => {
  window.addEventListener('load', () => {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    Array.prototype.filter.call(forms, (form) => {
      form.addEventListener('submit', (event) => {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();

$(() => {
  const buttonPhraseDict = {
    patient: 'participant',
    ra: 'delegate',
    witness: 'witness',
    representative: 'representative',
    parent1: 'parent or guardian',
    'parent1-decline': 'parent or guardian',
    parent2: 'parent or guardian',
    child: 'child',
  };
  const padConfig = {
    throttle: 0,
    minWidth: 2,
    maxWidth: 4,
  };

  const firstNameInput = $('#first-name-input');
  const lastNameInput = $('#last-name-input');
  const fullNameInput = $('#full-name-input-copy');
  const fullNameInput1 = $('#full-name-input-copy1');

  const patientSignatureImg = $('#patient-signature-img');
  const patientSignatureData = $('#patient-signature-data');
  const addPatientSignatureBtn = $('#add-patient-signature-btn');
  const removePatientSignatureBtn = $('#remove-patient-signature-btn');
  const removeRaSignatureBtn = $('#remove-ra-signature-btn');
  const removeWitnessSignatureBtn = $('#remove-witness-signature-btn');
  const removeRepresentativeSignatureBtn = $('#remove-representative-signature-btn');
  const removeParent1SignatureBtn = $('#remove-parent1-signature-btn');
  const removeParent1DeclineSignatureBtn = $('#remove-parent1-decline-signature-btn');
  const removeParent2SignatureBtn = $('#remove-parent2-signature-btn');
  const removeChildSignatureBtn = $('#remove-child-signature-btn');

  // hide all optional containers
  $('#email-container').hide();
  $('#witness-container').hide();
  $('#representative-container').hide();
  $('#interpreter-container').hide();
  $('#parent1-container').hide();
  $('#parent1-decline-container').hide();
  $('#parent2-container').hide();
  $('#child-container').hide();
  // hide all empty signature
  patientSignatureImg.hide();
  $('#witness-signature-img').hide();
  $('#representative-signature-img').hide();
  $('#parent1-signature-img').hide();
  $('#parent1-decline-signature-img').hide();
  $('#parent2-signature-img').hide();
  $('#child-signature-img').hide();
  // hide all signature data
  patientSignatureData.hide();
  $('#ra-signature-data').hide();
  $('#witness-signature-data').hide();
  $('#representative-signature-data').hide();
  $('#parent1-signature-data').hide();
  $('#parent1-decline-signature-data').hide();
  $('#parent2-signature-data').hide();
  $('#child-signature-data').hide();
  removePatientSignatureBtn.hide();
  removeWitnessSignatureBtn.hide();
  removeRepresentativeSignatureBtn.hide();
  removeParent1SignatureBtn.hide();
  removeParent1DeclineSignatureBtn.hide();
  removeParent2SignatureBtn.hide();
  removeChildSignatureBtn.hide();

  // initialize all pads
  const signaturePad = new SignaturePad(document.querySelector('#patient-signature-modal-canvas'), padConfig);
  const raSignaturePad = new SignaturePad(document.querySelector('#ra-signature-modal-canvas'), padConfig);
  const witnessSignaturePad = new SignaturePad(document.querySelector('#witness-signature-modal-canvas'), padConfig);
  const representativeSignaturePad = new SignaturePad(document.querySelector('#representative-signature-modal-canvas'), padConfig);
  const parent1SignaturePad = new SignaturePad(document.querySelector('#parent1-signature-modal-canvas'), padConfig);
  const parent1DeclineSignaturePad = new SignaturePad(document.querySelector('#parent1-decline-signature-modal-canvas'), padConfig);
  const parent2SignaturePad = new SignaturePad(document.querySelector('#parent2-signature-modal-canvas'), padConfig);
  const childSignaturePad = new SignaturePad(document.querySelector('#child-signature-modal-canvas'), padConfig);

  function onRemoveBtnClick(t) {
    const sData = $(`#${t}-signature-data`);
    const img = $(`#${t}-signature-img`);
    const addBtn = $(`#add-${t}-signature-btn`);
    const removeBtn = $(`#remove-${t}-signature-btn`);
    // remove data
    sData.text('');
    img.attr('src', '');
    img.hide();
    // change text
    removeBtn.hide();
    addBtn.text(`Add new ${buttonPhraseDict[t]} signature`);
  }

  removePatientSignatureBtn.on('click', () => {
    onRemoveBtnClick('patient');
  });
  removeRaSignatureBtn.on('click', () => {
    onRemoveBtnClick('ra');
  });
  removeWitnessSignatureBtn.on('click', () => {
    onRemoveBtnClick('witness');
  });
  removeRepresentativeSignatureBtn.on('click', () => {
    onRemoveBtnClick('representative');
  });
  removeParent1SignatureBtn.on('click', () => {
    onRemoveBtnClick('parent1');
  });
  removeParent1DeclineSignatureBtn.on('click', () => {
    onRemoveBtnClick('parent1-decline');
  });
  removeParent2SignatureBtn.on('click', () => {
    onRemoveBtnClick('parent1');
  });
  removeChildSignatureBtn.on('click', () => {
    onRemoveBtnClick('child');
  });

  function onSaveBtnClick(pad, t) {
    const modal = $(`#${t}-signature-modal`);
    const sData = $(`#${t}-signature-data`);
    const img = $(`#${t}-signature-img`);
    const addBtn = $(`#add-${t}-signature-btn`);
    const removeBtn = $(`#remove-${t}-signature-btn`);
    // close pad
    const data = pad.toDataURL('image/png');
    pad.clear();
    modal.modal('hide');
    // write data
    sData.text(data);
    img.attr('src', data);
    img.show();
    // change text
    removeBtn.show();
    addBtn.text('Change current signature');
  }

  $('#patient-signature-modal-save-btn').on('click', () => {
    onSaveBtnClick(signaturePad, 'patient');
  });
  $('#ra-signature-modal-save-btn').on('click', () => {
    onSaveBtnClick(raSignaturePad, 'ra');
  });
  $('#witness-signature-modal-save-btn').on('click', () => {
    onSaveBtnClick(witnessSignaturePad, 'witness');
  });
  $('#representative-signature-modal-save-btn').on('click', () => {
    onSaveBtnClick(representativeSignaturePad, 'representative');
  });
  $('#parent1-signature-modal-save-btn').on('click', () => {
    onSaveBtnClick(parent1SignaturePad, 'parent1');
  });
  $('#parent1-decline-signature-modal-save-btn').on('click', () => {
    onSaveBtnClick(parent1DeclineSignaturePad, 'parent1-decline');
  });
  $('#parent2-signature-modal-save-btn').on('click', () => {
    onSaveBtnClick(parent2SignaturePad, 'parent2');
  });
  $('#child-signature-modal-save-btn').on('click', () => {
    onSaveBtnClick(childSignaturePad, 'child');
  });

  // onClearBtnClick
  $('#patient-signature-modal-clear-btn').on('click', () => {
    signaturePad.clear();
  });
  $('#ra-signature-modal-clear-btn').on('click', () => {
    raSignaturePad.clear();
  });
  $('#witness-signature-modal-clear-btn').on('click', () => {
    witnessSignaturePad.clear();
  });
  $('#representative-signature-modal-clear-btn').on('click', () => {
    representativeSignaturePad.clear();
  });
  $('#parent1-signature-modal-clear-btn').on('click', () => {
    parent1SignaturePad.clear();
  });
  $('#parent1-decline-signature-modal-clear-btn').on('click', () => {
    parent1DeclineSignaturePad.clear();
  });
  $('#parent2-signature-modal-clear-btn').on('click', () => {
    parent2SignaturePad.clear();
  });
  $('#child-signature-modal-clear-btn').on('click', () => {
    childSignaturePad.clear();
  });

  // on signature check
  function onCheckChange(e, t) {
    const container = $(`#${t}-container`);
    const img = $(`#${t}-signature-img`);
    const sData = $(`#${t}-signature-data`);
    const addBtn = $(`#add-${t}-signature-btn`);
    const removeBtn = $(`#remove-${t}-signature-btn`);
    const nameInput = $(`#${t}-full-name-input`);
    if (e.target.checked) {
      container.show();
      sData.attr('required', 'required');
      nameInput.attr('required', 'required');
    } else {
      container.hide();
      sData.text('');
      sData.removeAttr('required');
      img.attr('src', '');
      img.hide();
      removeBtn.hide();
      addBtn.text(`Add new ${buttonPhraseDict[t]} signature`);
      nameInput.val('');
      nameInput.removeAttr('required');
    }
  }

  function onLinkedCheckChange(e) {
    const container = $('#patient-signature-container');
    if (e.target.checked) {
      container.hide();
      patientSignatureData.text('');
      patientSignatureData.removeAttr('required');
      patientSignatureImg.attr('src', '');
      patientSignatureImg.hide();
      removePatientSignatureBtn.hide();
      addPatientSignatureBtn.text('Add new participant signature');
    } else {
      container.show();
      patientSignatureData.attr('required', 'required');
    }
  }

  $('#witness-check').on('change', (e) => {
    onCheckChange(e, 'witness');
  });
  $('#representative-check').on('change', (e) => {
    onLinkedCheckChange(e);
    onCheckChange(e, 'representative');
  });
  $('#parent1-check').on('change', (e) => {
    const parent2Check = $('#parent2-check');
    const relationshipInput = $('#relationship-to-child-input');
    if (e.target.checked) {
      relationshipInput.attr('required', 'required');
      parent2Check.removeAttr('disabled');
    } else {
      parent2Check.prop('checked', false);
      parent2Check.attr('disabled', 'disabled');
      relationshipInput.removeAttr('required');
      onCheckChange(e, 'parent2');
    }
    onLinkedCheckChange(e);
    onCheckChange(e, 'parent1');
  });
  $('#parent1-decline-check').on('change', (e) => {
    onLinkedCheckChange(e);
    const container = $('#patient-container');
    if (e.target.checked) {
      container.hide();
      firstNameInput.val('');
      lastNameInput.val('');
      firstNameInput.removeAttr('required');
      lastNameInput.removeAttr('required');
    } else {
      container.show();
      firstNameInput.attr('required', 'required');
      lastNameInput.attr('required', 'required');
    }
    onCheckChange(e, 'parent1-decline');
  });
  $('#parent2-check').on('change', (e) => {
    const parent1Hr = $('#parent1-hr');
    if (e.target.checked) {
      parent1Hr.hide();
    } else {
      parent1Hr.show();
    }
    onCheckChange(e, 'parent2');
  });
  $('#child-check').on('change', (e) => {
    onCheckChange(e, 'child');
    onCheckChange(e, 'parent1');
    if (e.target.checked) {
      fullNameInput1.parent().hide();
    } else {
      fullNameInput1.parent().show();
    }
  });

  // on input only check
  function onNameOnlyCheckChange(e, t) {
    const container = $(`#${t}-container`);
    const nameInput = $(`#${t}-input`);
    if (e.target.checked) {
      container.show();
      nameInput.attr('required', 'required');
    } else {
      container.hide();
      nameInput.val('');
      nameInput.removeAttr('required');
    }
  }

  $('#interpreter-check').on('change', (e) => {
    onNameOnlyCheckChange(e, 'interpreter');
  });
  $('#email-download-check').on('change', (e) => {
    onNameOnlyCheckChange(e, 'email');
  });

  function mergeName(firstName, lastName) {
    return `${firstName}${firstName && lastName ? ' ' : ''}${lastName}`;
  }

  function onNameChange() {
    fullNameInput.val(mergeName(firstNameInput.val(), lastNameInput.val()));
    fullNameInput1.val(mergeName(firstNameInput.val(), lastNameInput.val()));
  }

  fullNameInput.val(mergeName(firstNameInput.val(), lastNameInput.val()));
  fullNameInput1.val(mergeName(firstNameInput.val(), lastNameInput.val()));
  firstNameInput.on('input', () => {
    onNameChange();
  });
  lastNameInput.on('input', () => {
    onNameChange();
  });
});
