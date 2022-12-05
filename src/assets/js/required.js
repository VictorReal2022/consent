import './default';
import '../css/quiz.css';

$(() => {
  const curPage = $('#cur-page');
  const quizConfirm1 = $('#quiz-confirm-1');
  const quizConfirm2 = $('#quiz-confirm-2');
  const curPageNum = parseInt(curPage.text(), 10);
  const modal = $('#modal');
  let optionId;
  let isCorrect;
  curPage.hide();

  function nextPage() {
    window.location.href = `/quiz?${$.param({ page: curPageNum + 1 })}`;
  }

  $('label.btn').on('click', (event) => {
    optionId = $(event.target).find('input:radio').val();
    isCorrect = $(event.target).find('input:hidden').val();
    const optionText = $(event.target).text();
    const quizConfirmText1 = $(quizConfirm1).text();
    const quizConfirmText2 = $(quizConfirm2).text();
    modal.find('.modal-body').html(`<span>${quizConfirmText1.trim()} <strong>"${optionText.trim()}"</strong>. ${quizConfirmText2.trim()}</span>`);
    modal.modal('show');
  });

  $('#modal-next-btn').on('click', () => {
    $.post('quiz', { optionId })
      .done(() => {
        modal.modal('hide');
        if (isCorrect === 'true') {
          nextPage();
        } else {
          window.location.href = '/contact';
        }
      })
      .fail(() => {
        window.location.href = '/error';
      });
  });

  $('#modal-cancel-btn').on('click', () => {
    modal.modal('hide');
  });

  if ($('.quiz').length === 0) {
    nextPage();
  }
});
