

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        //console.log(chrome.extension.getURL('../options/search.html')+'?#'+GetQueryString(details.url,'wd'))
        //console.log(details);
        if(1 && details.type == "main_frame" && typeof details.initiator == 'undefined'){
            if(/^http[s]?:\/\/([^.]+\.)?google\..+/.test(details.url))
            return {redirectUrl: chrome.extension.getURL('../options/search.html')+'?#'+GetQueryString(details.url,'q').replace(/\+/g,' ')};
            else if(GetQueryString(details.url,'wd') != '')
            return {redirectUrl: chrome.extension.getURL('../options/search.html')+'?#'+GetQueryString(details.url,'wd')}; 
        }
        
        if(details.type == "main_frame" && details.url.indexOf('://chrome.jsearch.site')>-1)
            return {redirectUrl: chrome.extension.getURL('../options/search.html')+'?#'+GetQueryString(details.url,'q')}; 
        //console.log('aaa');
    },  //
    {urls: ["*://www.baidu.com/*","*://*/search?q=*","*://chrome.jsearch.site/*"]}, //
    ["blocking"]);




function GetQueryString(url,name)
{
     let reg = new RegExp(`(\\?|&)${name}=([^&]*)(&|$)`);
     let r = url.match(reg);//search,查询？后面的参数，并匹配正则
     if(r!=null)return  r[2]; return '';
}


chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        // install
        //alert('install');
        //设置初始配置
        chrome.storage.sync.set({searchModels:[
            {
                type:'baidu',
                symbol:'',
                scope:'www.baidu.com',
                show:true,
                canEdit:false,
                canDelete:false
            },
            {
                type:'baidu',
                symbol:'site:',
                scope:'www.zhihu.com',
                show:true,
                canEdit:true,
                canDelete:true
            },
            {
                type:'baidu',
                symbol:'site:',
                scope:'www.jianshu.com',
                show:true,
                canEdit:true,
                canDelete:true
            },
            {
                type:'baidu',
                symbol:'site:',
                scope:'mp.weixin.qq.com',
                show:true,
                canEdit:true,
                canDelete:true
            },
            {
                type:'bookmarks',
                symbol:'',
                scope:'bookmarks & history',
                show:true,
                canEdit:false,
                canDelete:false
            },
            {
                type:'baidu',
                symbol:'inurl:',
                scope:'www.zhihu.com/people',
                show:true,
                canEdit:true,
                canDelete:true
            }
        ]});
    }
    if (details.reason === 'update') {
        // 更新事件
    }

});