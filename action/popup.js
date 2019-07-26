
var pageInfo = {};

    chrome.tabs.getAllInWindow(function(tabs){
        for(let i in tabs){
            if(tabs[i].active){
                new QRCode(document.getElementById("qr"), tabs[i].url);
                pageInfo.url = tabs[i].url;
                pageInfo.title = tabs[i].title;
                //console.log(tabs[i]);
                return;
            }
        }
    })


    document.getElementById('share').onclick = function(){
        document.getElementById('share_con').value = pageInfo.title+"\n"+pageInfo.url+"\n____________________\n  from「 jSearch 」"; //®©㊣
        document.getElementById('share_con').select();
        document.execCommand('copy');
        this.innerHTML='分享到PC(复制成功)';
    }
    document.getElementById('goJ').onclick = function(){
        window.open(chrome.extension.getURL('/options/search.html'));
    }

    //document.getElementById('cz').src=`http://www.jsearch.site/home/?p=popup&id=${chrome.runtime.id}`;