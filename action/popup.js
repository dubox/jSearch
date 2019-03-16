
    chrome.tabs.getAllInWindow(function(tabs){
        for(let i in tabs){
            if(tabs[i].active){
                new QRCode(document.getElementById("qr"), tabs[i].url);
                return;
            }
        }
    })


    document.getElementById('goJ').onclick = function(){
        window.open(chrome.extension.getURL('/options/search.html'));
    }

    document.getElementById('cz').src=`http://www.jsearch.site/home/?p=popup&id=${chrome.runtime.id}`;