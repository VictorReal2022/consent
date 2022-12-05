import './default';
import 'animate.css/animate.min.css';
import '../css/contact.css';

$(() => {
  const faqLink = $('#faq-link');
  const faq = faqLink.text();
  const helpItemContainer = $('#help-item-container');
  const contactFormContainer = $('#contact-form-container');
  $('#howto-btn').hide();
  $('#contact-btn').hide();
  $('.alert-success').hide();
  $('.alert-danger').hide();
  $('#protocol-btn').show();
  contactFormContainer.hide();
  faqLink.hide();

  $('#faq').on('click', () => {
    const w = window.open(faq || '/faq');
    w.focus();
  });

  $('#contact').on('click', () => {
    helpItemContainer.hide();
    contactFormContainer.show();
    contactFormContainer.addClass('animated fadeIn');
  });

  $('form').on('submit', () => {
    $.ajax({
      type: 'post',
      url: '/contact',
      data: $('#contact-form').serialize(),
      success: () => {
        $('.alert-success').show();
        $('form')[0].reset();
      },
      error: () => {
        $('.alert-danger').show();
      },
    });
    return false;
  });
});
