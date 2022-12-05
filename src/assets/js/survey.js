import './default';
import '../vendor/bootstrap-slider/bootstrap-slider';
import '../vendor/bootstrap-slider/bootstrap-slider.min.css';
import '../css/survey.css';


$(() => {
  $('.range-slider').each((i, obj) => {
    $(obj).slider({
      min: 1,
      max: 5,
      value: 3,
      ticks: [1, 2, 3, 4, 5],
      ticks_labels: ['Strongly disagree', null, null, null, 'Strongly agree'],
      tooltip: 'always',
      // labelledby: ['ex18-label-2a', 'ex18-label-2b'],
    });
  });

  $('#submit-btn').on('click', () => {
    const data = [];
    $('.range-slider').each((i, obj) => {
      data.push({
        key: $(obj).attr('name').substr($(obj).attr('name').indexOf('-') + 1),
        value: $(obj).val(),
      });
    });
    $.post('survey', { data })
      .done(() => {
        window.location.href = '/logout';
      })
      .fail(() => {
        window.location.href = '/error';
      });
  });
});
