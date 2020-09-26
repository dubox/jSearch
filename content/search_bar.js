function jBar() {

  let jBarHtml = `<div id="jsearch-bar">
<div class="jbar-input">
<input type="text" placeholder="jSearch" />

        
       
       <svg id="jbar-logo" class="jsearch-logo" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs></defs><title>jSearch-logo</title><path class="cls-1" d="M139.1,117.2a53.71,53.71,0,0,1-13.48,1.52c-12.93,0-23.07-5.73-23.07-13,0-5.49,6.26-9.94,14-9.94,7.1,0,13,2.26,17,6.53A21.52,21.52,0,0,1,139.1,117.2Z" transform="translate(0)"/><path class="cls-1" d="M148.69,54.92c0,.72-.23,1.51-.57,1.51-1.05,0-2.57-1.62-2.57-4.19a11.45,11.45,0,0,1,.53-3.53A8.13,8.13,0,0,1,148.69,54.92Z" transform="translate(0)"/><path class="cls-1" d="M100,0A100,100,0,1,0,200,100,100,100,0,0,0,100,0ZM83,93.74c-2,25.62-3.2,35.68-5.68,46.8-4,17.68-13.6,27.81-26.31,27.81-9.44,0-16.3-6.29-16.3-15a14.1,14.1,0,0,1,14-14.16c4.6,0,6.93,1.92,6.93,5.72A5,5,0,0,1,50.33,150c-.46,0-.87,0-1.28-.07a8.91,8.91,0,0,0-1-.06c-.67,0-2.31,1.35-2.31,3.38,0,2.28,1.7,4.59,5.52,4.59,6.85,0,12.44-7.07,15.37-19.38C69,128.82,70.31,115.12,72,93.18l.81-10.58a5.47,5.47,0,0,1,5.44-5.14,5.4,5.4,0,0,1,5.46,5.46C83.66,86,83.29,90.47,83,93.74ZM84.88,67.5c-1.21,3.58-2.14,6.41-6.15,6.41a4.4,4.4,0,0,1-1.87-.32,5.67,5.67,0,0,1-3.72-5.14,4.58,4.58,0,0,1,.3-1.86c1.26-3.73,2.2-6.41,6.1-6.41a5.53,5.53,0,0,1,5.59,5.46A5.59,5.59,0,0,1,84.88,67.5Zm63.91,57.28C145.19,138.16,134.8,145,131,145a5.28,5.28,0,0,1-5.59-5.19,5.53,5.53,0,0,1,3.36-5.1,15.93,15.93,0,0,0,6.93-6.32c-.68.1-1.35.19-2,.25a70,70,0,0,1-8,.42c-19.69,0-34-9.89-34-23.54,0-11.47,10.93-20.46,24.88-20.46,17.31,0,30.54,11.07,32.94,26.87a13.87,13.87,0,0,0,4.87-10.56c0-10.55-7.72-15.09-22.94-20.26-12-4.16-25.69-8.85-25.69-23.68,0-11.24,10.07-22.61,29.31-22.61a35,35,0,0,1,8.13,1A24.84,24.84,0,0,1,158,31.11a5.4,5.4,0,0,1,5.59,5.46c0,2.81-2.46,4.92-5.73,4.92a12.73,12.73,0,0,0-3.6.51,17.39,17.39,0,0,1,5.31,12.92c0,5.78-4.39,12-11.49,12-7.56,0-13.49-6.47-13.49-14.71a20.64,20.64,0,0,1,1.27-7c-.38,0-.74,0-1,0-11.89,0-18.12,6.15-18.12,12.23s5.36,9,18.17,13.58,30.33,10.73,30.33,30.36C165.24,111.59,159.26,120,148.79,124.78Z" transform="translate(0)"/></svg>

</div>
</div>`;

  document.querySelector('body').appendChild(parseDom(jBarHtml)[0]);


  //******** 加载设置 *************
  var settings = {};
  chrome.storage.sync.get('settings', function (items) {
    settings = items.settings.jBar;
  });
  //更新设置
  MessageListener.add('settings', function (_settings) {
    settings = _settings.jBar;
  });

  //************* runtime **************
  var runtime = {
    command: '' //搜索命令
  };
  runtime.isInExtension = isInExtension();

  chrome.storage.sync.get('searchHistory', function (items) { //加载搜索历史
    runtime.history = items.searchHistory;
  });
  runtime.historyIndex = -1;
  MessageListener.add('searchHistory', function (searchHistory) { //更新搜索历史
    runtime.history = searchHistory;
  });




  jBarEffects();
  var jBar = document.querySelector('#jsearch-bar');
  var jBar_input = document.querySelector('#jsearch-bar input');

  hotkeys('j,space,ctrl+j,esc,tab', function (event, handler) {

    if (!checkKey(handler.key)) return;

    //ecs 和 tab 只做退出操作
    if (handler.key == 'esc' || handler.key == 'tab') {
      if (jBar.classList.contains('jBar-show')) {
        event.preventDefault();
        jBarToggle(0);
        return false;
      } else {
        return;
      }
    }

    if (handler.key == 'space') {
      //当前焦点在搜索框 且搜索框无任何内容时 按空格可退出搜索
      if (jBar.classList.contains('jBar-show')) {
        if (jBar_input.value == '') {
          event.preventDefault();
          jBarToggle(0);
          return false;
        } else {
          return;
        }
      }
    }

    //识别当前是否在可编辑区域，在可编辑区域 只能由 ctrl+j 唤醒编辑框
    if (checkEditable(event.target || event.srcElement)) {
      if (handler.key == 'ctrl+j') {
        event.preventDefault();
        jBarToggle();
      }
      return;
    }
    event.preventDefault();
    jBarToggle();
    return false;
  });

  //标签搜索
  hotkeys('ctrl+1,ctrl+2,ctrl+3,ctrl+4,ctrl+5,ctrl+6,ctrl+7,ctrl+8,ctrl+9', function (event, handler) {

    jBarToggle();
    let k = handler.key.replace('ctrl+', '');
    runtime.command = '@tag=' + k;
    return false;

  });

  hotkeys('*', function (event, handler) {

    if ((hotkeys.shift && settings.customHotKey[0] == 'shift') ||
      (hotkeys.alt && settings.customHotKey[0] == 'alt') ||
      (hotkeys.ctrl && settings.customHotKey[0] == 'ctrl')
    ) {
      if (settings.customHotKey[1] && hotkeys.isPressed(settings.customHotKey[1])) {
        event.preventDefault();
        jBarToggle();
      }
    }
  });


  function jBarToggle(show) {
    show = show || 2;

    if ((jBar.classList.contains('jBar-show') && show == 2) || show == 0) {
      jBar_input.blur();
    } else {

      let sel_text = window.getSelection().toString();
      if (!/\n/.test(sel_text) && sel_text.length > 0 && sel_text.length < 30) {
        jBar_input.value = sel_text;
      } else {
        jBar_input.value = getHistory();
      }
      jBar_input.focus();

    }
  }


  /**
   * 不过滤可编辑元素
   */
  hotkeys.filter = function (event) {
    return true;
  }

  //document.addEventListener('keydown',function(e){console.log(e);})



  jBar_input.addEventListener('blur', function () {
    window.getSelection().empty();
    jBar.classList.remove('jBar-show');
  });

  jBar_input.addEventListener('focus', function () {
    this.select();
    jBar.classList.add('jBar-show');
  });

  hotkeys('enter', function () {
    if (jBar.classList.contains('jBar-show'))
      goSearch();
  });

  document.querySelector('#jsearch-bar #jbar-logo').addEventListener('mousedown', function () {
    if (runtime.isInExtension)
      app.drawer.show = true;
    else
      goSearch();
  });

  /** 划词搜索*/
  document.addEventListener('mouseup', function (event) {
    if (!settings.onSelection) return;
    //console.log(event)
    if (checkEditable(event.target || event.srcElement)) {
      return;
    }
    let sel_text = window.getSelection().toString();
    if (!/\n/.test(sel_text) && sel_text.length > 0 && sel_text.length < 30) {
      //jBar_input.value = sel_text;
      jBarToggle(1);
    }
  });


  //搜索历史——方向键选择
  hotkeys('up,down', function (event, handler) {
    if (jBar.classList.contains('jBar-show')) {
      if (handler.key == 'up') {
        jBar_input.value = getHistory(1);
      } else if (handler.key == 'down') {
        jBar_input.value = getHistory(-1);
      }
    }

  });

  //搜索历史——鼠标滚轮选择
  window.addEventListener('mousewheel', function (e) {
    if (!jBar.classList.contains('jBar-show')) return;
    if (e.deltaY < 0) {
      jBar_input.value = getHistory(-1);
    } else {
      jBar_input.value = getHistory(1);
    }
    e.preventDefault();
  }, {
    passive: false
  });


  function getHistory(num) {
    if (!settings.history) return '';
    let index = 0;
    if (num) {
      index = runtime.historyIndex + num;
      if (index < 0) index = 0; //runtime.history.length-1;
      if (index >= runtime.history.length) index = 0;
    }
    runtime.historyIndex = index;
    return runtime.history[index] || '';
  }



  function goSearch() {
    //
    let kw = encodeURIComponent(jBar_input.value) + runtime.command;
    if (runtime.isInExtension) {
      location.href = chrome.extension.getURL('/options/search.html') + '?#' + kw;
      jBarToggle(0);
    } else {
      jBar_input.blur();
      sendToBg({
        goSearch: {
          inExist: settings.inExist,
          kw: kw
        }
      }, function (res) {
        if (!res)
          window.open(`https://chrome.jsearch.site/?q=${kw}`);
      });
      //
    }

  }


  this.setKeyword = function (kw) {
    jBar_input.value = kw;
  }
  this.setSettings = function (obj) {
    settings = obj;
  }

  this.getHistory = function (num) {
    return getHistory(num);
  };

  function checkKey(keyItem) {
    return settings.hotkeys.includes(keyItem);
  }


}