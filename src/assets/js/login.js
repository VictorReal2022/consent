import './default';
import 'jquery-ui-dist/jquery-ui.min';
import '../css/login.css';
import 'jquery-ui-dist/jquery-ui.min.css';

$(() => {
  const mrnDiv = $('#mrn-input-div');
  const subjectDiv = $('#subject-input-div');
  const erapCheckbox = $('#erap-checkbox');
  $('.alert-danger').hide();

  function showMrn() {
    subjectDiv.hide();
    mrnDiv.show();
    $('#subject-input-div :input').removeAttr('required');
    $('#mrn-input-div :input').attr('required', 'required');
  }

  function showSubject() {
    mrnDiv.hide();
    subjectDiv.show();
    $('#mrn-input-div :input').removeAttr('required');
    $('#subject-input-div :input').attr('required', 'required');
  }

  if (erapCheckbox.is(':checked')) {
    showMrn();
  } else {
    showSubject();
  }

  erapCheckbox.on('change', (e) => {
    if (e.target.checked) {
      showMrn();
    } else {
      showSubject();
    }
  });

  $.ajax({
    type: 'get',
    url: '/login/list',
    success: (data) => {
      const { projects } = data;
      const inputProject = $('#inputProject');
      const inputProjectHidden = $('#inputProjectHidden');
      inputProject.autocomplete({
        delay: 0,
        minLength: 0,
        source: projects,
        select: (event, ui) => {
          event.preventDefault();
          inputProject.val(ui.item.label);
        },
        focus: (event, ui) => {
          event.preventDefault();
          inputProject.val(ui.item.label);
        },
        change: (event, ui) => {
          if (!ui.item) {
            inputProject.val('');
            inputProject.addClass('is-invalid');
            inputProjectHidden.val('');
          } else {
            inputProject.removeClass('is-invalid');
            inputProjectHidden.val(ui.item.value);
          }
        },
      }).focus(() => {
        inputProject.autocomplete('search');
      });
    },
    error: () => {
      $('.alert-danger').show();
    },
  });
});
