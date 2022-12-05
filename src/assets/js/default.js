import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

$(() => {
  $('#protocol-btn').hide();
  const popup = $('.popup');

  function getSelectedText() {
    if (window.getSelection) {
      return window.getSelection().toString();
    }
    if (document.selection) {
      return document.selection.createRange().text;
    }
    return '';
  }

  $(document).on(('mouseup'), (e) => {
    const text = getSelectedText();
    if (text.trim() !== '') {
      $('#search-frame').attr('src', `https://www.bing.com/search?q=${text}`);
      popup.css({ left: e.pageX + 10 });
      popup.css({ top: e.pageY + 10 });
      popup.show();
    } else {
      popup.hide();
    }
  });

  $('.toast').toast('show');
});
