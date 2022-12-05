import './default';
import 'bootstrap-table/dist/bootstrap-table.min';
import 'bootstrap-table/dist/bootstrap-table.min.css';
import '../css/reply.css';

$(() => {
  $('.toast').hide();

  $('#read-btn').on('click', () => {
    const idList = $('table').bootstrapTable('getSelections').map((item) => item[1]);
    if (idList.length) {
      $.ajax({
        type: 'post',
        url: '/reply',
        data: { idList },
        success: () => {
          window.location.reload();
        },
        error: () => {
          window.location.href = '/error';
        },
      });
    }
  });
});
