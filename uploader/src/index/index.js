/**
 * @file picture compress && upload && watermark
 * @author wxp201013@gmail.com
 */

define(function(require, exports, module) {
  require('./index.less');

  var Instagram = require('util/instagram.js');
  var util = require('util/util.js')

  // doms
  var publish = document.querySelector('#j-publish');
  var picupload = publish.querySelector('.picupload');
  var preview = document.querySelector('#j-preview');
  var picAddBtn = preview.querySelector('.add-pic');
  var uploadList = preview.querySelectorAll('[data-role="uploadList"]');
  var submit = document.querySelector('#j-submit');

  function init() {
    var previewW = parseInt((preview.clientWidth - 30) / 3);

    picAddBtn.style.width = previewW + 'px';
    picAddBtn.style.height = previewW + 'px';

    var instagram = Instagram({
      cid: (uploadList && uploadList.length) || 0,
      wrapper: preview,
      referNode: picAddBtn,
      previewW: previewW,
      previewH: previewW,
      max: 6,
    });

    instagram.on('picChange', function(cid) {
      var lists = preview.querySelectorAll('[data-role="uploadList"]');

      if (!lists || !lists.length) {
        preview.classList.remove('active');

        return;
      }

      util.forEach.call(lists, function(list, index) {
        if (index >= cid) {
          list.setAttribute('class', list.getAttribute('class').replace(/uploadList_(\d+)/, 'uploadList_' + index));
          list.querySelector('[data-role="del-icon"]').setAttribute('data-cid', index);
        }
      });
    });
    instagram.on('picPost', function(source) {
      var formData = new FormData();

      formData.append('fileselect', source);

      var t = +new Date();

      util.post({
        url: '/camera.php',
        data: formData,
        success: function(res) {
          util.$('.ret').innerHTML += '<br/>post: ' + (+new Date() - t) + 'ms';
        },
        error: function(e) {

        }
      })
    });

    picupload.addEventListener('change', function(e) {
      instagram.select(e.target.files);
    });

    picAddBtn.addEventListener('change', function(e) {
      instagram.select(e.target.files);
    });
  }

  init();

});
