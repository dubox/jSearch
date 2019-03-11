
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