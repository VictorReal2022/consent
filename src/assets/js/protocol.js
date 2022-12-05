import './default';
import '../css/protocol.css';


$(() => {
  const curPage = $('#cur-page');
  const curPageNum = parseInt(curPage.text(), 10);
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');
  const skipBtn = $('#skip-btn');

  curPage.hide();
  if (curPageNum <= 1) {
    prevBtn.hide();
  }

  prevBtn.on('click', () => {
    window.location.href = `/protocol?${$.param({ page: curPageNum - 1 })}`;
  });

  nextBtn.on('click', () => {
    $.post('protocol', () => {
      window.location.href = '/quiz';
    });
  });

  skipBtn.on('click', () => {
    window.location.href = '/protocol?skip=true';
  });
});
