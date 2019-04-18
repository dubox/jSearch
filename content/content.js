
var jBar = new jBar();
//injectCustomJs('/content/search_bar.js');
//injectCustomJs("/content/search_bar_func.js");


function parseDom(arg) {

    　　 var objE = document.createElement("div");
    
    　　 objE.innerHTML = arg;
    
    　　 return objE.childNodes;
    
}

//console.log(chrome.extension);

// 向页面注入JS
function injectCustomJs(jsPath)
{
    jsPath = jsPath || 'js/inject.js';
    var temp = document.createElement('script');
    temp.setAttribute('type', 'text/javascript');
    // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
    temp.src = chrome.extension.getURL(jsPath);
    temp.onload = function()
    {
        // 放在页面不好看，执行完后移除掉
        this.parentNode.removeChild(this);
    };
    document.head.appendChild(temp);
}

//检查当前是否在插件中
function isInExtension(){
    if(typeof chrome.extension != 'undefined' && location.href.indexOf(chrome.extension.getURL('')) > -1)
      return true;
      return false;
}


/**
 * @param {*} msgObj : {dataType:data}
 * @param {*} cb 
 * 
 */
function sendToBg(msgObj ,cb){
    let type = Object.keys(msgObj)[0];
    try{
        chrome.runtime.sendMessage({dataType:type,data:msgObj[type]}, function(response) {
        if(cb)cb(response);
        });
    }catch(e){
        cb(false);
    }
}

//检查元素是否是可编辑区域
function checkEditable(targetEl){
    let tagName = targetEl.tagName;
    if (targetEl.isContentEditable ||
      tagName == 'INPUT' ||
      tagName == 'SELECT' ||
      tagName == 'TEXTAREA') {
      
      return true;
    }
    return false;
}


