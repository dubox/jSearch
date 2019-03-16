chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        //console.log(chrome.extension.getURL('../options/search.html')+'?#'+GetQueryString(details.url,'wd'))
        //console.log(details);
        if (1 && details.type == "main_frame" && typeof details.initiator == 'undefined') {
            if (/^http[s]?:\/\/([^.]+\.)?google\..+/.test(details.url))
                return {
                    redirectUrl: chrome.extension.getURL('../options/search.html') + '?#' + GetQueryString(details.url, 'q').replace(/\+/g, ' ')
                };
            else if (GetQueryString(details.url, 'wd') != '')
                return {
                    redirectUrl: chrome.extension.getURL('../options/search.html') + '?#' + GetQueryString(details.url, 'wd')
                };
        }

        if (details.type == "main_frame" && details.url.indexOf('://chrome.jsearch.site') > -1)
            return {
                redirectUrl: chrome.extension.getURL('../options/search.html') + '?#' + GetQueryString(details.url, 'q')
            };
        //console.log('aaa');
    }, //
    {
        urls: ["*://www.baidu.com/*", "*://*/search?q=*", "*://chrome.jsearch.site/*"]
    }, //
    ["blocking"]);



// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    sendResponse('ok');
	console.log('收到来自content-script的消息：');
    console.log(request);
    if(request.dataType == 'goSearch'){
        let kw = request.data.kw;
        let inExist = request.data.inExist;
        findJTab(function(tabJ ,tabCurr){
            console.log(tabJ);
            if(inExist && tabJ){
                chrome.tabs.update(tabJ.id, {url:chrome.extension.getURL('/options/search.html') + '?#' + kw,active:true});
            }else{
                chrome.tabs.create({
                    url:chrome.extension.getURL('/options/search.html') + '?#' + kw,
                    index:tabCurr.index+1
                });
            }
            
        });
    }
    
});


function findJTab(cb){
    let searchUrl = chrome.extension.getURL('../options/search.html');
    chrome.tabs.getAllInWindow(function(tabs){
        let tabJ = tabCurr = -1;
        for(let i in tabs){
            if(tabJ == -1 && tabs[i].url.indexOf(searchUrl) > -1){
                tabJ = i;
            }
            if(tabs[i].active){
                tabCurr = i;
            }
            if(tabJ != -1 && tabCurr != -1)break;
        }
        cb(tabJ>-1?tabs[tabJ]:null ,tabs[tabCurr]);
    })
}


function GetQueryString(url, name) {
    let reg = new RegExp(`(\\?|&)${name}=([^&]*)(&|$)`);
    let r = url.match(reg); //search,查询？后面的参数，并匹配正则
    if (r != null) return r[2];
    return '';
}


chrome.runtime.onInstalled.addListener(details => {
    var defaultSettings = {
        searchModels: [{
                type: 'baidu',
                symbol: '',
                scope: 'www.baidu.com',
                show: true,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'google',
                symbol: '',
                scope: 'www.google.com',
                show: false,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'bing',
                symbol: '',
                scope: 'cn.bing.com',
                show: true,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'baidu',
                symbol: 'site:',
                scope: 'www.zhihu.com',
                show: true,
                canEdit: true,
                canDelete: true
            },
            {
                type: 'baidu',
                symbol: 'site:',
                scope: 'www.jianshu.com',
                show: true,
                canEdit: true,
                canDelete: true
            },
            {
                type: 'weixin',
                symbol: '1', //公众号
                scope: 'weixin.sogou.com',
                show: true,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'weixin',
                symbol: '2', //公众号文章
                scope: 'weixin.sogou.com',
                show: true,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'bookmarks',
                symbol: '',
                scope: 'bookmarks & history',
                show: true,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'baidu',
                symbol: 'inurl:',
                scope: 'www.zhihu.com/people',
                show: true,
                canEdit: true,
                canDelete: true
            }
        ],
        settings: {
            jBar: {
                hotkeys: ['space', 'tab', 'j', 'ctrl+j', 'esc'],
                inExist:true,   //在已有 jSearch 标签页打开
                onSelection: false
            },
            pageScroll: ['navKeys', 'mLeftKey+mw', 'alt+mw'],
            resultListWidth: 600,
            showHeadBar:true,
            kwColor:'green',
        }
    };
    if (details.reason === 'install') {
        // install
        //设置初始配置
        chrome.storage.sync.set(defaultSettings);
    }
    if (details.reason === 'update') {
        // 更新事件
        //alert('update');
        chrome.storage.sync.get(null, function (items) {
            if (typeof items.searchModels != 'undefined') {
                //合并配置
                for (let i in defaultSettings.searchModels) {
                    let hasThis = 0;
                    for (let j in items.searchModels) {
                        if (defaultSettings.searchModels[i].type == items.searchModels[j].type && defaultSettings.searchModels[i].symbol == items.searchModels[j].symbol && defaultSettings.searchModels[i].scope == items.searchModels[j].scope) {
                            hasThis = 1;
                            break;
                        }
                    }
                    if (!hasThis) {
                        items.searchModels.push(defaultSettings.searchModels[i]);
                    }
                }
                //

            } else {
                //设置初始配置
                items.searchModels = defaultSettings.searchModels;
            }
            if (typeof items.settings != 'undefined') {
                /*
                for(let i in defaultSettings.settings){
                    if(typeof items.settings[i] == 'undefined'){
                        items.settings[i] = defaultSettings.settings[i];
                        continue;
                    }
                    
                }
                */

                function trans(from, to) {
                    for (let i in from) {
                        if (typeof to[i] == 'undefined') {
                            to[i] = from[i];
                            continue;
                        }
                        if (typeof from[i] == typeof {}) {
                            trans(from[i], to[i]);
                        }
                    }
                }
                trans(defaultSettings.settings, items.settings);
                
            } else {
                //设置初始配置
                items.settings = defaultSettings.settings;
            }

            chrome.storage.sync.set(items);
        });

    }

});