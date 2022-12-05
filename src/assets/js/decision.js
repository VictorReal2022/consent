import './default';
import '../css/decision.css';
import { data } from 'jquery';

$(() => {
  const agreeBtn = $('#agree-btn');

  $('#agree-checkbox').on('change', (e) => {
    if (e.target.checked) {
      agreeBtn.removeAttr('disabled');
      agreeBtn.removeClass('btn-secondary');
      agreeBtn.addClass('btn-primary');
    } else {
      agreeBtn.attr('disabled', 'disabled');
      agreeBtn.removeClass('btn-primary');
      agreeBtn.addClass('btn-secondary');
    }

    agreeBtn.on('click', (event) => {
      event.preventDefault();
      window.location.href = '/consent';
    });
  });
});
