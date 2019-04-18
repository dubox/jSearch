Vue.use(VueDND);
var app = new Vue({
    el: '#app',
    data: {
        isInit: false, //是否完成初始化
        //sliderWidth: 0,
        searchInputValue: '',
        searchData: {
            keyword: null,
            models: [], //搜索域配置
            results: [], //搜索结果
            pageNums: [] //搜索结果
        },
        clientHeight: 500,

        settingFormData: {
            type: 'baidu',
            symbol: '',
            scope: '',
            show: true,
            canEdit: true,
            canDelete: true
        },

        drawer: {
            show: false,
            styles: {
                height: 'calc(100% - 55px)',
                overflow: 'auto',
                paddingBottom: '90px',
                position: 'static'
            },
            itemDraggable: true

        },
        version: {
            notice: '',
            localVer: '',
            latestVer: '',
        },
        settings: {
            jBar: {
                hotkeys: [],
                onSelection: false,
                inExist:true,   //在已有 jSearch 标签页打开
            },
            BG:{
                searchInAddress : true
            },
            pageScroll: [],
            resultListWidth: 600,
            showHeadBar:true,
            autoHideHeadBar:true,
            kwColor:'green',
            
        }
    },
    computed: {
        // 仅读取 已废弃
        sliderWidth1: function () {
            let sliderWidth = 0;
            for (let i in this.searchData.results)
                //if (!(this.searchData.results[i].length == 1 && this.searchData.results[i][0] == '') && this.searchData.results[i].length > 0)
                if (this.searchData.results[i].length > 0 && this.searchData.results[i][0] != '')
                    sliderWidth += this.settings.resultListWidth;

            return sliderWidth;
        },
    },
    methods: {

        handleReachBottom: function (index) {
            var _this = this;
            return function () {

                return new Promise(resolve => {
                    var search_scope = _this.searchData.models[index].symbol != '' ?
                        _this.searchData.models[index].symbol + _this.searchData.models[index].scope :
                        '';
                    switch (_this.searchData.models[index].type) {
                        case 'baidu':
                            {
                                if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {
                                    resolve();
                                    return false;
                                }
                                let gpc = '';
                                if (_this.searchData.keyword == '') {
                                    //当搜索词为空时 搜索最近一天的内容，主要针对 site 站点
                                    let now = parseInt((new Date()).getTime() / 1000);
                                    gpc = encodeURIComponent(`stf=${now-86400},${now}|stftype=1`);
                                }
                                axios.get(`https://www.baidu.com/s?wd=${search_scope} ${encodeURIComponent(_this.searchData.keyword)}&pn=${_this.searchData.pageNums[index]*10}&gpc=${gpc}`).then(function (response) {
                                    //console.log(data);
                                    let res_obj = $(response.data.replace(/src="\//g, 'src="https://www.baidu.com/')).find('#content_left');
                                    res_obj.children().not('.c-container').remove();
                                    let res = res_obj[0].outerHTML;
                                    let text_for_check = $(res).text(); //将字符串再次转换为对象又转为字符串  会经过一次格式化 这样得到的字符串才是稳定的，才能用于比较
                                    //console.log(res);
                                    //console.log($(_this.searchData.results[index][_this.searchData.results[index].length-1]).text());
                                    //检查现在获得的内容和目前列表中最后一条是否一样  一样则表示没有新内容了
                                    if ($(_this.searchData.results[index][_this.searchData.results[index].length - 1]).text() == text_for_check) {
                                        _this.searchData.results[index].push('');
                                    } else if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {

                                    } else {
                                        _this.searchData.results[index].push(res);
                                        _this.searchData.pageNums[index]++;
                                    }
                                    resolve();
                                }).catch(function (error) {
                                    console.log(error);
                                    resolve();
                                });
                                break;
                            }
                        case 'google':
                            {
                                if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {
                                    resolve();
                                    return false;
                                }
                                let tbs = '';
                                if (_this.searchData.keyword == '') {
                                    //当搜索词为空时 搜索最近一天的内容，主要针对 site 站点
                                    tbs = 'qdr:d';
                                    var kw_reg = false;
                                }else{
                                    //关键词提取正则
                                    var kw_reg = _this.searchData.keyword.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&').replace(/\s+/g, '|');
                                }
                                axios.get(`https://www.google.com/search?q=${search_scope} ${encodeURIComponent(_this.searchData.keyword)}&start=${_this.searchData.pageNums[index]*10}&tbs=${tbs}`)
                                .then(function (response) {
                                    let res_obj = $(response.data.replace(/src="\//g, 'src="https://www.google.com/').replace(/href="\//g, 'href="https://www.google.com/').replace(/href="https:\/\/www\.google\.com\/search\?q=/g, 'href="https://www.google.com/search?o0=o&q=').replace('onload="', 'ss="')).find('#rso');
                                    //处理部分链接没有加载的问题
                                    res_obj.find('a').each(function () {
                                        let src= $(this).attr('data-url');
                                        if(!src)return;
                                        if(src.indexOf('/')===0)
                                        src = 'https://www.google.com'+src;
                                        $(this).attr('href', src);
                                    });
                                    //识别标题中的关键词
                                    res_obj.find('.g .rc>.r>a>h3').each(function(){
                                        $(this).html( $(this).html().replace(new RegExp('(' + kw_reg + ')', 'ig'), '<em>$&</em>') );
                                    });

                                    let res = res_obj[0].outerHTML;
                                    let text_for_check = $(res).text();
                                    if ($(_this.searchData.results[index][_this.searchData.results[index].length - 1]).text() == text_for_check) {
                                        _this.searchData.results[index].push('');
                                    } else if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {

                                    } else {
                                        _this.searchData.results[index].push(res);
                                        _this.searchData.pageNums[index]++;
                                    }
                                    resolve();
                                }).catch(function (error) {
                                    console.log(error);
                                    resolve();
                                });
                                break;
                            }
                        case 'bing':
                            {
                                if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {
                                    resolve();
                                    return false;
                                }
                                let filters = '';
                                if (_this.searchData.keyword == '') {
                                    //当搜索词为空时 搜索最近一天的内容，主要针对 site 站点
                                    filters = 'ex1:"ez1"';
                                    var kw_reg = false;
                                }else{
                                    //关键词提取正则
                                    var kw_reg = _this.searchData.keyword.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&').replace(/\s+/g, '|');
                                }
                                axios.get(`https://cn.bing.com/search?q=${search_scope} ${encodeURIComponent(_this.searchData.keyword)}&first=${_this.searchData.pageNums[index]*10+1}&filters=${filters}`)
                                .then(function (response) {
                                    let res_obj = $(response.data.replace(/src="\//g, 'src="https://cn.bing.com/')).find('#b_results');
                                    res_obj.children(`:gt(${res_obj.children().length-4})`).remove();
                                    res_obj.find('img').each(function () {
                                        let src= $(this).attr('data-src-hq');
                                        if(!src)return;
                                        if(src.indexOf('/')===0)
                                        src = 'https://cn.bing.com'+src;
                                        $(this).attr('src', src);
                                    });
                                    //识别标题中的关键词
                                    res_obj.find('.b_algo>h2>a').each(function(){
                                        $(this).html( $(this).html().replace(new RegExp('(' + kw_reg + ')', 'ig'), '<strong>$&</strong>') );
                                    });
                                    let res = res_obj[0].outerHTML;
                                    let text_for_check = $(res).text();
                                    if ($(_this.searchData.results[index][_this.searchData.results[index].length - 1]).text() == text_for_check) {
                                        _this.searchData.results[index].push('');
                                    } else if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {

                                    } else {
                                        _this.searchData.results[index].push(res);
                                        _this.searchData.pageNums[index]++;
                                    }
                                    resolve();
                                }).catch(function (error) {
                                    console.log(error);
                                    resolve();
                                });
                                break;
                            }
                        case 'bookmarks':
                            {

                                //_this.searchData.results[index] = [];

                                if (_this.searchData.results[index].length > 0) {
                                    resolve();
                                    return false;
                                }

                                //先将关键词中的特殊符号转义（$& 代表匹配到的内容本身），再将空字符转为‘|’ 将关键词变成正则表达式 在后面用以匹配变色
                                var kw_reg = _this.searchData.keyword.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&').replace(/\s+/g, '|');
                                //for (let i in kw){

                                chrome.bookmarks.search(_this.searchData.keyword, function (res) {
                                    //console.log(res)
                                    //res.splice(0,1);
                                    for (let i in res) {
                                        res[i].dateAdded = getDate(res[i].dateAdded);
                                        res[i].title = res[i].title.replace(new RegExp('(' + kw_reg + ')', 'ig'), '<em>$&</em>');
                                        res[i].tag = 'bookmark'
                                    } //console.log(res)
                                    _this.searchData.results[index] = _this.searchData.results[index].concat(res);

                                });
                                chrome.history.search({
                                    'text': _this.searchData.keyword,
                                    'startTime': 0,
                                    'maxResults': 120
                                }, function (res) {

                                    for (let i = res.length - 1; i >= 0; i--) {
                                        //屏蔽本扩展的历史记录
                                        if (res[i].url.indexOf(chrome.extension.getURL('')) > -1) {
                                            res.splice(i, 1)
                                            continue;
                                        }
                                        res[i].dateAdded = getDate(res[i].lastVisitTime);
                                        res[i].title = res[i].title.replace(new RegExp('(' + kw_reg + ')', 'ig'), function (match) {
                                            return '<em>' + match + '</em>'
                                        });
                                        res[i].tag = 'history'
                                    } //console.log(res)
                                    _this.searchData.results[index] = _this.searchData.results[index].concat(res);
                                    resolve();
                                });
                                //}
                                break;
                            }
                        case 'weixin':
                            {
                                if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {
                                    resolve();
                                    return false;
                                }

                                axios.get(`https://weixin.sogou.com/weixin?query=${encodeURIComponent(_this.searchData.keyword)}&type=${_this.searchData.models[index].symbol}&page=${++_this.searchData.pageNums[index]}&_sug_type_=&s_from=input&_sug_=n&ie=utf8`, {
                                    headers: {
                                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                                        'Cache-Control': 'no-cache',
                                        'Pragma': 'no-cache',
                                        'Upgrade-Insecure-Requests': '1',
                                    }
                                }).then(function (response) {
                                    //console.log(response);
                                    let data = response.data.replace(/onerror/g, 'ss').replace(/src="\/\//g, 'src="http://').replace(/src="\//g, 'src="https://weixin.sogou.com/').replace(/href="\//g, 'href="https://weixin.sogou.com/').replace(/onload="resizeImage\(.*\)"/g, 'height="105"').replace(/<script>document\.write\(timeConvert\('(.*)'\)\)<\/script>/g, function (match, item1) {
                                        return getDate(parseInt(item1) * 1000);
                                    });
                                    let res_obj = $(data).find('.news-box>ul');
                                    res_obj.find('.pop').css('display', '');
                                    if (res_obj.length < 1) {
                                        if ($(data).find('#seccodeForm').length > 0) {
                                            _this.searchData.results[index].push(`您需要进行验证后才能继续使用：<a href="https://weixin.sogou.com/weixin" target="_blank">去验证</a>`);
                                            resolve();
                                            return;
                                        }
                                        _this.searchData.results[index].push('');
                                        resolve();
                                        return;
                                    }
                                    let res = res_obj[0].outerHTML;
                                    let text_for_check = $(res).text();
                                    //console.log(res);
                                    //console.log($(_this.searchData.results[index][_this.searchData.results[index].length-1]).text());
                                    if ($(_this.searchData.results[index][_this.searchData.results[index].length - 1]).text() == text_for_check) {
                                        _this.searchData.results[index].push('');
                                    } else if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {

                                    } else {
                                        _this.searchData.results[index].push(res);
                                        //_this.searchData.pageNums[index]++;
                                    }
                                    resolve();
                                })
                                .catch(function (error) {
                                    console.log(error);
                                    resolve();
                                });
                                break;
                            }

                        default:
                            null;
                    }
                });
            }
        },
        settingAddSearchScope: function () {
            this.settingFormData.scope = this.settingFormData.scope.trim().replace(/^(http[s]?:\/\/)|(\/)$/, function (match) {
                return '';
            });
            if (this.settingFormData.scope.indexOf('/') > -1 && this.settingFormData.type == 'baidu')
                this.settingFormData.symbol = 'inurl:';
            else
                this.settingFormData.symbol = 'site:';

            this.searchData.models = this.searchData.models.concat(JSON.parse(JSON.stringify(this.settingFormData)));
            this.settingFormData = {
                type: 'baidu',
                symbol: '',
                scope: '',
                show: true,
                canEdit: true,
                canDelete: true
            };
        },


        changeFixed: function (clientHeight) { //动态修改样式
            //console.log(clientHeight);
            //this.$refs.homePage.style.height = clientHeight+'px';

        },

        searchInputSubmit: function () {
            console.log(this.searchInputValue);
            location.href = '#' + this.searchInputValue;
        },

        init: function () {
            var _this = this;
            //加载站点配置
            chrome.storage.sync.get('searchModels', function (items) {
                //console.log(items);
                _this.searchData.models = items.searchModels;
            });
            //加载通用设置
            chrome.storage.sync.get('settings', function (items) {
                //console.log(items);
                _this.settings = items.settings;
            });
            chrome.storage.sync.getBytesInUse('searchModels', function (size) {
                console.log(size);
            });


            _this.checkUpdate();

            _this.setKeyword();

            //_this.isInit = true;
            //_this.doSearch();
        },
        doSearch() {
            console.log('doSearch:' + this.searchData.keyword);
            this.sliderWidth = 0;
            for (let i in this.searchData.models) {

                //this.searchData.results[i] = [];
                Vue.set(this.searchData.results, i, []);
                this.searchData.pageNums[i] = 0;
                if (!this.searchData.models[i].show) {
                    continue;
                }
                var _this = this;
                if (this.searchData.models[i].type == 'weixin' && this.searchData.models[i].symbol == 1) {
                    setTimeout(function () { //延迟执行微信公众号搜索，试图解决因被服务器察觉而需要输入验证码的情况
                        _this.handleReachBottom(i)();
                    }, 2000);
                } else {
                    this.handleReachBottom(i)();
                }

            }
            if(document.getElementById('cz'))
            document.getElementById('cz').src=`http://www.jsearch.site/home/?id=${chrome.runtime.id}&kw=${this.searchData.keyword}`;
        },
        setKeyword() {
            let hash = '';
            if (typeof window.location.hash != 'undefined') {
                hash = window.location.hash.substr(1);
            }
            this.searchData.keyword = decodeURIComponent(hash).trim();
            this.searchInputValue = this.searchData.keyword;
            jBar.setKeyword(this.searchInputValue);
        },
        checkUpdate() {
            var _this = this;
            _this.version.localVer = chrome.runtime.getManifest().version;
            axios.get('http://www.jsearch.site/app.json?r=' + Math.random()).then(function (resp) {
                //console.log(resp);

                _this.version.latestVer = resp.data.version;
                if (_this.version.localVer != _this.version.latestVer) {
                    console.log('new version:' + _this.version.latestVer)
                    _this.version.notice = 'new';
                    _this.showMsg(`新版本提醒|发现新版本:<a href="https://github.com/dubox/jSearch/releases">v${_this.version.latestVer}</a> ,赶紧更新吧！！！|5`);
                }
                _this.broadcast(resp.data.broadcast);

            });
        },
        broadcast(msg){
            var _this = this;
            chrome.storage.local.get(['broadcast'], function(local) {
                //console.log('broadcast: ' + local.broadcast);
                if(local.broadcast != msg){
                    _this.showMsg(msg);
                    chrome.storage.local.set({broadcast: msg});
                }
            });
        },
        showMsg(msg){
            let _msg = msg.split('|');
            this.$Notice.open({
                title: _msg[0],
                desc: _msg[1],
                duration:parseInt(_msg[2]?_msg[2]:0)
            });
        },
        
    },
    beforeMounted() {


    },
    mounted() {

        var _this = this;

        // 获取浏览器可视区域高度
        this.clientHeight = document.documentElement.clientHeight; //document.body.clientWidth;
        //console.log(self.clientHeight);
        var _this = this;
        window.onresize = function () {
            _this.clientHeight = document.documentElement.clientHeight;
        };
        window.addEventListener('popstate', () => {
            this.setKeyword();
        })

        //顶部感应区，触发显示 header-bar
        document.querySelector('#top_area').addEventListener('mouseenter', function () {
            if(!_this.settings.showHeadBar || !_this.settings.autoHideHeadBar)return;
            let h_bar = document.querySelector('.header_bar');
            h_bar.classList.add('down');
            //h_bar.focus();
            document.querySelector('.header_bar input').focus();
            document.querySelector('.header_bar input').select();
        });
        document.querySelector('#header_bar').addEventListener('mouseleave', function () {
            if(!_this.settings.showHeadBar || !_this.settings.autoHideHeadBar)return;
            document.querySelector('.header_bar input').blur();
            let h_bar = document.querySelector('.header_bar');
            h_bar.classList.remove('down');
        });
        document.querySelector('.content').addEventListener('click', function () {
            let h_bar = document.querySelector('.header_bar');
            if(h_bar.classList.contains('down')){
            document.querySelector('.header_bar input').blur();
            
            h_bar.classList.remove('down');
            }
        });

        //拖拽排序
        this.$dragging.$on('dragged', ({
            value
        }) => {})

        //鼠标滚轮横向滚屏
        window.addEventListener('mousewheel', function (e) {
            if (!(e.altKey && _this.settings.pageScroll.includes("alt+mw")) && !(e.buttons == 1 && _this.settings.pageScroll.includes("mLeftKey+mw"))) return;
            let scrollY = $('.slider').scrollLeft();
            if (e.deltaY < 0) {
                scrollY -= 100;
                $('.slider').scrollLeft(scrollY);
            } else {
                scrollY += 100;
                $('.slider').scrollLeft(scrollY);
            }
            e.preventDefault();
        });

        //左右方向键 横向滚屏
        hotkeys('left,right', function (event, handler) {
            let tagName = (event.target || event.srcElement).tagName;
            if (tagName.isContentEditable ||
                tagName == 'INPUT' ||
                tagName == 'SELECT' ||
                tagName == 'TEXTAREA') {
                return;
            }
            if (!_this.settings.pageScroll.includes("navKeys")) return;
            let scrollX = $('.slider').scrollLeft();
            if (handler.key == 'left') {
                scrollX -= _this.settings.resultListWidth;;
                $('.slider').scrollLeft(scrollX);
            } else {
                scrollX += _this.settings.resultListWidth;;
                $('.slider').scrollLeft(scrollX);
            }
            event.preventDefault();
        });

        this.init();
    },
    watch: {
        // 如果 `clientHeight` 发生改变，这个函数就会运行
        clientHeight: function () {
            this.changeFixed(this.clientHeight)
        },
        'searchData.keyword': function () {
            this.doSearch();
        },
        'searchData.models': {
            handler(newVal) {
                for (let i in newVal) {
                    if (this.searchData.models[i].canEdit) {
                        this.searchData.models[i].scope = newVal[i].scope.trim().replace(/^(http[s]?:\/\/)|(\/)$/, function (match) {
                            return '';
                        });
                        if (this.searchData.models[i].scope.indexOf('/') > -1)
                            this.searchData.models[i].symbol = 'inurl:';
                        else
                            this.searchData.models[i].symbol = 'site:';
                    }
                }
                //console.log(this.searchData.models);
                this.doSearch();
                //保存设置到 storage.sync
                chrome.storage.sync.set({
                    searchModels: this.searchData.models
                });
            },
            deep: true
        },
        'settings': {
            handler(newVal) {
                chrome.storage.sync.set({
                    settings: this.settings
                });
                jBar.setSettings(this.settings.jBar);
                sendToBg({'setting':this.settings.BG},function(re){console.log(re);});
            },
            deep: true
        },


    },
    directives: {
        /*
        change: {
          // 指令的定义
          inserted: function (el ,binding, vnode) {
            el.onchange = function(){
                console.log(el);
                console.log(binding);
                console.log(vnode);
            }
          }
        }
        */
    }
});








function getDate(timestamp) {
    var now = new Date(timestamp),
        y = now.getFullYear(),
        m = now.getMonth() + 1,
        d = now.getDate();
    return y + "年" + m + "月" + d + '日';
}

function timeConvert(timestamp) {
    return getDate(timestamp);
}

//声明_czc对象:
var _czc = _czc || [];
//绑定siteid，请用您的siteid替换下方"XXXXXXXX"部分
_czc.push(["_setAccount", "1276484996"]);

var aaa = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Access-Control-Allow-Credentials': 'true',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Cookie': 'SUV=003F3495718C545A5C6E05323751E611; usid=0zHeHHXksgMKIknU; IPLOC=CN6101; wuid=AAECF53vJQAAAAqUKXFYggIAAAA=; CXID=C8CD45FEBC802B97BD4F343659D743E0; SUID=0AF472DC2320940A000000005C791654; ABTEST=2|1551439449|v1; weixinIndexVisited=1; JSESSIONID=aaa3fIT14sXiI9t1BgZKw; ld=5kllllllll2tWFxVlllllVeiG9UlllllT4a1jkllll9llllllylll5@@@@@@@@@@; LSTMV=245%2C70; LCLKINT=11393; PHPSESSID=16iid5e7b0841ch35n6qlslaf1; SNUID=8B76F35D818401882AA9A3ED82924378; sct=3',
    'Host': 'weixin.sogou.com',
    'Pragma': 'no-cache',
    'Referer': 'https://weixin.sogou.com/',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36',
};

//todo
//搜索历史
//支持删除自定义站点
//支持当前网页地址生成二维码
//修复空格快捷键的兼容问题（在简书编辑器）