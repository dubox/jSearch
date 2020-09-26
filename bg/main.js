var RunTime = {
    settings: {
        searchInAddress: true
    },
    wxUrls: null, //
    extRootUrl: chrome.extension.getURL('')
};

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        //console.log(chrome.extension.getURL('../options/search.html')+'?#'+GetQueryString(details.url,'wd'))
        //console.log(details);



        if (RunTime.settings.searchInAddress) {

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
        }

        //处理微信搜索屏蔽问题
        if ((details.initiator + '/') == RunTime.extRootUrl) {
            if (!/^(https:\/\/weixin\.sogou\.com\/link.*)(https:\/\/weixin\.sogou\.com\/weixin.*)$/.test(details.url)) return;
            RunTime.wxUrls = details.url.match(/^(https:\/\/weixin\.sogou\.com\/link.*)(https:\/\/weixin\.sogou\.com\/weixin.*)$/);
            if (!RunTime.wxUrls || RunTime.wxUrls.length < 3) return;
            return {
                redirectUrl: RunTime.wxUrls[1]
            };
        }



    }, //
    {
        urls: ["*://www.baidu.com/*", "*://*/search?q=*", "*://chrome.jsearch.site/*", "*://weixin.sogou.com/link?*"]
    }, //
    ["blocking"]);
//https://weixin.sogou.com/weixin?type=2&query=swoole

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {

        if (details.initiator + '/' != RunTime.extRootUrl) return;


        if (RunTime.wxUrls && RunTime.wxUrls.length >= 3) {
            var Referer = 0,
                SecFetchUser = 0,
                SecFetchSite = 0;
            for (var i = 0; i < details.requestHeaders.length; ++i) {

                if (details.requestHeaders[i].name === 'Referer') {
                    Referer = 1;
                    details.requestHeaders[i].value = RunTime.wxUrls[2];
                }
                if (details.requestHeaders[i].name === 'Sec-Fetch-User') {
                    SecFetchUser = 1;
                    details.requestHeaders[i].value = "?1";
                }

                if (details.requestHeaders[i].name === 'Sec-Fetch-Site') {
                    SecFetchSite = 1;
                    details.requestHeaders[i].value = "same-origin";
                }
            }
            if (!Referer)
                details.requestHeaders.push({
                    'name': 'Referer',
                    'value': RunTime.wxUrls[2]
                });
            if (!SecFetchUser)
                details.requestHeaders.push({
                    'name': 'Sec-Fetch-User',
                    'value': '?1'
                });
            if (!SecFetchSite)
                details.requestHeaders.push({
                    'name': 'Sec-Fetch-Site',
                    'value': 'same-origin'
                });

            //console.log(details);
            return {
                requestHeaders: details.requestHeaders
            };
        }
    }, {
        urls: ["*://weixin.sogou.com/link?*"]
    },
    ["blocking", "extraHeaders", "requestHeaders"]);


/** 

    chrome.webRequest.onHeadersReceived.addListener(
            function(details) {
                
                //if(details.initiator+'/' != RunTime.extRootUrl)return ;
                if(details.url.indexOf('https') === 0)return;

                console.log(details);
                for (var i = 0; i < details.responseHeaders.length; ++i) {
                    if (details.responseHeaders[i].name === "Set-Cookie") {
                        details.responseHeaders[i].value = details.responseHeaders[i].value + '; SameSite=Lax; Secure'; //应对chrome的cookie新政策
                    }
                }
                    //console.log(details);  ; SameSite=None; Secure
                    return {responseHeaders: details.responseHeaders};
                
            },
                {urls: ["<all_urls>"]},
                ["blocking","extraHeaders", "responseHeaders"]);
*/




// 监听来自content-script的消息 
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    sendResponse('ok');
    if (request.dataType == 'goSearch') { //实现 jBar 在新标签页或已有标签页打开搜索
        let kw = request.data.kw;
        let inExist = request.data.inExist;
        findJTab(function (tabJ, tabCurr) {
            //console.log(tabJ);
            if (inExist && tabJ) {
                chrome.tabs.update(tabJ.id, {
                    url: chrome.extension.getURL('/options/search.html') + '?#' + kw,
                    active: true
                });
            } else {
                chrome.tabs.create({
                    url: chrome.extension.getURL('/options/search.html') + '?#' + kw,
                    index: tabCurr.index + 1
                });
            }

        });
        return;
    }

    //地址栏搜索 开关
    if (request.dataType == 'searchInAddress') {
        chrome.storage.sync.get('settings', function (items) {
            items.settings.BG.searchInAddress = !items.settings.BG.searchInAddress;
            chrome.storage.sync.set({
                settings: items.settings
            });
        });
        return;
    }

    /**标签搜索
    if(request.dataType == 'tagSearch'){
        chrome.storage.sync.get('settings',function(items){
            var tags = items.settings.tags;
            for(){

            }
            
        });
        return;
    }
    */

});

//监听 storage变化
chrome.storage.onChanged.addListener(function (changes, type) {

    //console.log(type,changes);
    if (type == 'sync') {

        //广播搜索历史到各个页面
        if (changes.searchHistory) {
            broadcast({
                dataType: 'searchHistory',
                data: changes.searchHistory.newValue
            });
        }

        //更新后台 运行时数据
        if (changes.settings) {
            RunTime.settings = changes.settings.newValue.BG;
            //广播新设置到各标签页
            broadcast({
                dataType: 'settings',
                data: changes.settings.newValue
            });
        }
    }
});

/**
 * 向标签页广播消息
 * @param {*} data 
 */
function broadcast(data) {
    chrome.tabs.getAllInWindow(function (tabs) {
        for (let i in tabs) {
            if (tabs[i].url.indexOf('chrome://') === 0) continue;

            chrome.tabs.sendMessage(
                tabs[i].id,
                data
                /** 这个回调会导致连接失败时 runtime.lastError 会报错；
                     * 目前导致连接失败的原因有：1.以chrome://开头的tab 是连不上的；2.在插件刷新之前就打开的tab页
                    , 
                    function(response) {
                            //console.log(response);
                            return true;
                } */
            );

        }

    })
}


function findJTab(cb) {
    let searchUrl = chrome.extension.getURL('');
    chrome.tabs.getAllInWindow(function (tabs) {
        let tabJ = tabCurr = -1;
        for (let i in tabs) {
            if (tabJ == -1 && tabs[i].url.indexOf(searchUrl) > -1) {
                tabJ = i;
            }
            if (tabs[i].active) {
                tabCurr = i;
            }
            if (tabJ != -1 && tabCurr != -1) break;
        }
        cb(tabJ > -1 ? tabs[tabJ] : null, tabs[tabCurr]);
    })
}




function GetQueryString(url, name) {
    let reg = new RegExp(`(\\?|&)${name}=([^&]*)(&|$)`);
    let r = url.match(reg); //search,查询？后面的参数，并匹配正则
    if (r != null) return r[2];
    return '';
}

/**
 * 递归地将from中to没有的元素copy过去
 * @param {} from 
 * @param {*} to 
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




chrome.runtime.onInstalled.addListener(details => {
    var defaultSettings = {
        searchModels: [{
                type: 'baidu',
                symbol: '',
                scope: 'www.baidu.com',
                tag: '',
                show: true,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'google',
                symbol: '',
                scope: 'www.google.com',
                tag: '',
                show: false,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'bing',
                symbol: '',
                scope: 'cn.bing.com',
                tag: '',
                show: true,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'baidu',
                symbol: 'site:',
                scope: 'www.zhihu.com',
                tag: '',
                show: true,
                canEdit: true,
                canDelete: true
            },
            {
                type: 'baidu',
                symbol: 'site:',
                scope: 'www.jianshu.com',
                tag: '',
                show: true,
                canEdit: true,
                canDelete: true
            },
            {
                type: 'baidu',
                symbol: 'site:',
                scope: 'www.myzaker.com',
                tag: '',
                show: true,
                canEdit: true,
                canDelete: true
            },
            {
                type: 'baidu',
                symbol: 'site:',
                scope: 'www.bilibili.com',
                tag: '',
                show: true,
                canEdit: true,
                canDelete: true
            },
            {
                type: 'weixin',
                symbol: '1', //公众号
                scope: 'weixin.sogou.com',
                tag: '',
                show: false,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'weixin',
                symbol: '2', //公众号文章
                scope: 'weixin.sogou.com',
                tag: '',
                show: false,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'bookmarks',
                symbol: '',
                scope: 'bookmarks & history',
                tag: '',
                show: true,
                canEdit: false,
                canDelete: false
            },
            {
                type: 'baidu',
                symbol: 'inurl:',
                scope: 'www.zhihu.com/people',
                tag: '',
                show: true,
                canEdit: true,
                canDelete: true
            }
        ],
        settings: {
            jBar: {
                hotkeys: ['space', 'tab', 'j', 'ctrl+j', 'esc'],
                customHotKey: ['ctrl', 'j'],
                inExist: true, //在已有 jSearch 标签页打开
                onSelection: false,
                history: true
            },
            BG: {
                searchInAddress: true
            },
            pageScroll: ['navKeys', 'mLeftKey+mw', 'alt+mw'],
            resultListWidth: 600,
            showHeadBar: true,
            autoHideHeadBar: true,
            kwColor: 'green',
            orderByTime: true, //按结果加载时间排序，先加载出来的结果排在前面
            tags: {}

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
                //同步数据结构
                for (let i in items.searchModels) {
                    for (let j in defaultSettings.searchModels[0]) {
                        if (typeof items.searchModels[i][j] == 'undefined')
                            items.searchModels[i][j] = defaultSettings.searchModels[0][j];
                    }
                }
                console.log(items.searchModels)

            } else {
                //设置初始配置
                items.searchModels = defaultSettings.searchModels;
            }
            if (typeof items.settings != 'undefined') {

                trans(defaultSettings.settings, items.settings);

                //加载后台配置
                RunTime.settings = items.settings.BG;

            } else {
                //设置初始配置
                items.settings = defaultSettings.settings;
            }

            chrome.storage.sync.set(items);
        });

    }

    chrome.runtime.openOptionsPage();

});