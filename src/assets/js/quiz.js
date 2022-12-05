import './default';
import '../css/quiz.css';

$(() => {
  let incorrectNum = 0;
  const curPage = $('#cur-page');
  const curPageNum = parseInt(curPage.text(), 10);
  const modal = $('#modal');
  const modalCorrectText = $('#modal-correct-text');
  const modalIncorrectText = $('#modal-incorrect-text');
  const modalCorrectBtn = $('#modal-correct-btn');
  const modalIncorrectBtn = $('#modal-incorrect-btn');
  const modalCorrectVideo = $('#modal-correct-video');
  const modalIncorrectVideo = $('#modal-incorrect-video');
  const modalCorrectAudio = $('#modal-correct-audio');
  const modalIncorrectAudio = $('#modal-incorrect-audio');

  curPage.hide();

  function displayCorrect() {
    modalIncorrectText.hide();
    modalIncorrectBtn.hide();
    modalIncorrectVideo.removeClass('d-block');
    modalCorrectText.show();
    modalCorrectBtn.show();
    modalCorrectVideo.addClass('d-block');
    modalCorrectAudio[0].play();
  }

  function displayIncorrect() {
    modalCorrectText.hide();
    modalCorrectBtn.hide();
    modalCorrectVideo.removeClass('d-block');
    modalIncorrectText.show();
    modalIncorrectBtn.show();
    modalIncorrectVideo.addClass('d-block');
    modalIncorrectAudio[0].play();
  }

  function nextPage() {
    window.location.href = `/quiz?${$.param({ page: curPageNum + 1 })}`;
  }

  $('label.btn').on('click', (event) => {
    const optionId = $(event.target).find('input:radio').val();
    const isCorrect = $(event.target).find('input:hidden').val();
    $.post('quiz', { optionId })
      .fail(() => {
        window.location.href = '/error?code=1';
      });
    if (isCorrect === 'true') {
      displayCorrect();
      incorrectNum = 0;
    } else {
      incorrectNum += 1;
      if (incorrectNum >= 5) {
        window.location.href = '/error?code=2';
      }
      displayIncorrect();
    }
    modal.modal('show');
  });

  modalIncorrectBtn.on('click', () => {
    modal.modal('hide');
  });

  modalCorrectBtn.on('click', () => {
    modal.modal('hide');
    nextPage();
  });

  modal.on('hidden.bs.modal', () => {
    modalCorrectAudio[0].pause();
    modalCorrectAudio[0].currentTime = 0;
    modalIncorrectAudio[0].pause();
    modalIncorrectAudio[0].currentTime = 0;
  });

  if ($('.quiz').length === 0) {
    nextPage();
  }
});
