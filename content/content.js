
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
        if(cb)cb(false);
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


/**
 * 监听BG来的消息
 */
function MessageListener(){

    this.cbs = {};
    var _this = this;
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
        sendResponse('ok');
        if(typeof _this.cbs[request.dataType] == 'function')
            _this.cbs[request.dataType](request.data);

    });
}
MessageListener.prototype.add = function(dataType,cb){
    this.cbs[dataType] = cb;
}


var MessageListener = new MessageListener();
var jBar = new jBar();


//快捷键开启或关闭地址栏搜索
hotkeys('shift+d', function (event, handler) {
    sendToBg({searchInAddress:1});
      return false;
  console.log(handler);
  });




/*

var port = chrome.runtime.connect({name: "default"});//通道名称
port.postMessage({joke: "Knock knock"});//发送消息
port.onMessage.addListener(function(msg) {//监听消息
  
});


chrome.runtime.onConnect.addListener(function(port) {
    console.assert(port.name == "yisheng");
    port.onMessage.addListener(function(msg) {
      if (msg.joke == "Knock knock")
        port.postMessage({question: "Who's there?"});
      else if (msg.answer == "Madame")
        port.postMessage({question: "Madame who?"});
      else if (msg.answer == "Madame... Bovary")
        port.postMessage({question: "I don't get it."});
    });
  });

*/