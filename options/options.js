Vue.use(VueDND);

Vue.directive('real-img', async function (el, binding) { //指令名称为：real-img
    let imgURL = binding.value; //获取图片地址
    if (imgURL) {
        let exist = await imageIsExist(imgURL);
        if (exist) {
            el.setAttribute('src', imgURL);
        }
    }
})

/**
 * 检测图片是否存在
 * @param url
 */
let imageIsExist = function (url) {
    return new Promise((resolve) => {
        var img = new Image();
        img.onload = function () {
            if (this.complete == true) {
                resolve(true);
                img = null;
            }
        }
        img.onerror = function () {
            resolve(false);
            img = null;
        }
        img.src = url;
    })
}

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
            resultsIndex: {}, //搜索结果实际排序对应
            pageNums: [] //搜索结果
        },
        clientHeight: 500,

        settingFormData: {
            type: 'baidu',
            symbol: '',
            scope: '',
            show: true,
            canEdit: true,
            canDelete: true,
            tag: ''
        },

        //右侧边栏样式
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
                customHotKey: ['ctrl', 'j'],
                onSelection: false,
                inExist: true, //在已有 jSearch 标签页打开
                history: true
            },
            BG: {
                searchInAddress: true
            },
            pageScroll: [],
            resultListWidth: 400,
            showHeadBar: true,
            autoHideHeadBar: true,
            kwColor: 'green',
            orderByTime: true, //按结果加载时间排序，先加载出来的结果排在前面
            tags: {},

        },
        searchHistory: [], //搜索历史
        runTime: {
            waitSettingSync: false
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
                        _this.searchData.models[index].symbol + _this.searchData.models[index].scope : '';
                    if (_this.searchData.keyword == '' && search_scope == '') {
                        resolve();
                        return false;
                    }
                    switch (_this.searchData.models[index].type) {
                        case 'baidu': {
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
                            console.log(_this.searchData.pageNums[index]);
                            let pn = _this.searchData.pageNums[index] * 10;
                            console.log(pn);
                            let url_kw = _this.searchData.keyword; //encodeURIComponent(_this.searchData.keyword);
                            //&pn=${_this.searchData.pageNums[index]*10}&rsv_spt=1&rsv_iqid=0x8f79473e0006dc48&issp=1&f=8&rsv_bp=1&rsv_idx=2&ie=utf-8&tn=baiduhome_pg&rsv_enter=1&rsv_dl=tb&rsv_sug3=5&rsv_sug1=2&rsv_sug7=100&rsv_sug2=0&rsv_btype=i&inputT=2626&rsv_sug4=4260
                            let wd = encodeURIComponent(search_scope ? search_scope + ' ' : '') + url_kw;
                            let pn_text = pn > 0 ? `&pn=${pn}&oq=${wd}` : '';
                            axios.get(`https://www.baidu.com/s?wd=${wd}${pn_text}&tn=baiduhome_pg&ie=utf-8&rsv_idx=2${gpc?'&gpc='+gpc:''}`).then(function (response) {
                                //console.log(response);
                                if (response.data.indexOf('<title>百度安全验证</title>') > -1) {
                                    var res = '<a href="https://www.baidu.com/" target="_blank">百度安全验证</a>'; //.find('body'); //[0].outerHTML;
                                    //console.log(res);
                                } else {
                                    let res_obj = $(response.data.replace(/src="\//g, 'src="https://www.baidu.com/').replace(/src="http:\/\//g, 'src="https://')).find('#content_left');
                                    res_obj.children().not('.c-container').remove();
                                    var res = res_obj[0].outerHTML;
                                }
                                let text_for_check = $(res).text(); //将字符串再次转换为对象又转为字符串  会经过一次格式化 这样得到的字符串才是稳定的，才能用于比较


                                //console.log($(_this.searchData.results[index][_this.searchData.results[index].length-1]).text());
                                //检查现在获得的内容和目前列表中最后一条是否一样  一样则表示没有新内容了
                                if ($(_this.searchData.results[index][_this.searchData.results[index].length - 1]).text() == text_for_check) {
                                    _this.searchData.results[index].push('');
                                } else if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {

                                } else {
                                    _this.searchData.results[index].push(res);
                                    _this.searchData.pageNums[index]++;
                                }

                                //_this.resultsIndex(index);
                                resolve();
                            }).catch(function (error) {
                                console.log(error);
                                resolve();
                            });
                            break;
                        }
                        return;
                    case 'google': {
                        if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {
                            resolve();
                            return false;
                        }
                        let tbs = '';
                        if (_this.searchData.keyword == '') {
                            //当搜索词为空时 搜索最近一天的内容，主要针对 site 站点
                            tbs = 'qdr:d';
                            var kw_reg = false;
                        } else {
                            //关键词提取正则
                            var kw_reg = _this.searchData.keyword.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&').replace(/\s+/g, '|');
                        }
                        axios.get(`https://www.google.com/search?q=${search_scope} ${encodeURIComponent(_this.searchData.keyword)}&start=${_this.searchData.pageNums[index]*10}&tbs=${tbs}`)
                            .then(function (response) {
                                let res_obj = $(response.data.replace(/src="\//g, 'src="https://www.google.com/').replace(/href="\//g, 'href="https://www.google.com/').replace(/href="https:\/\/www\.google\.com\/search\?q=/g, 'href="https://www.google.com/search?o0=o&q=').replace('onload="', 'ss="')).find('#rso');
                                //处理部分链接没有加载的问题
                                res_obj.find('a').each(function () {
                                    let src = $(this).attr('data-url');
                                    if (!src) return;
                                    if (src.indexOf('/') === 0)
                                        src = 'https://www.google.com' + src;
                                    $(this).attr('href', src);
                                });
                                //识别标题中的关键词
                                res_obj.find('.g .rc>.r>a>h3').each(function () {
                                    $(this).html($(this).html().replace(new RegExp('(' + kw_reg + ')', 'ig'), '<em>$&</em>'));
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
                                //_this.resultsIndex(index);
                                resolve();
                            }).catch(function (error) {
                                console.log(error);
                                resolve();
                            });
                        break;
                    }
                    case 'bing': {
                        if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {
                            resolve();
                            return false;
                        }
                        let filters = '';
                        if (_this.searchData.keyword == '') {
                            //当搜索词为空时 搜索最近一天的内容，主要针对 site 站点
                            filters = 'ex1:"ez1"';
                            var kw_reg = false;
                        } else {
                            //关键词提取正则
                            var kw_reg = _this.searchData.keyword.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&').replace(/\s+/g, '|');
                        }
                        axios.get(`https://cn.bing.com/search?q=${search_scope} ${encodeURIComponent(_this.searchData.keyword)}&first=${_this.searchData.pageNums[index]*10+1}&filters=${filters}`)
                            .then(function (response) {
                                let res_obj = $(response.data.replace(/src="\//g, 'src="https://cn.bing.com/').replace(/href="\//g, 'href="https://cn.bing.com/')).find('#b_results');
                                res_obj.children(`:gt(${res_obj.children().length-4})`).remove();
                                res_obj.find('img').each(function () {
                                    let src = $(this).attr('data-src-hq');
                                    if (!src) return;
                                    if (src.indexOf('/') === 0)
                                        src = 'https://cn.bing.com' + src;
                                    $(this).attr('src', src);
                                });
                                //识别标题中的关键词
                                res_obj.find('.b_algo>h2>a').each(function () {
                                    $(this).html($(this).html().replace(new RegExp('(' + kw_reg + ')', 'ig'), '<strong>$&</strong>'));
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
                                //_this.resultsIndex(index);
                                resolve();
                            }).catch(function (error) {
                                console.log(error);
                                resolve();
                            });
                        break;
                    }
                    case 'bookmarks': {

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

                            //_this.resultsIndex(index);
                            resolve();
                        });
                        //}
                        break;
                    }
                    case 'weixin': {
                        if (_this.searchData.results[index][_this.searchData.results[index].length - 1] == '') {
                            resolve();
                            return false;
                        }

                        axios.get(`https://weixin.sogou.com/weixin?type=${_this.searchData.models[index].symbol}&query=${encodeURIComponent(_this.searchData.keyword)}&page=${++_this.searchData.pageNums[index]}`, { //&_sug_type_=&s_from=input&_sug_=n&ie=utf8
                                headers: {
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                                    'Cache-Control': 'no-cache',
                                    'Pragma': 'no-cache',
                                    'Upgrade-Insecure-Requests': '1',
                                }
                            }).then(function (response) {
                                //console.log(response);
                                let data = response.data.replace(/onerror/g, 'ss').replace(/src="\/\//g, 'src="https://').replace(/src="http:\/\//g, 'src="https://').replace(/src="\//g, 'src="https://weixin.sogou.com/').replace(/href="\//g, 'href="https://weixin.sogou.com/').replace(/onload="resizeImage\(.*\)"/g, 'height="105"').replace(/<script>document\.write\(timeConvert\('(.*)'\)\)<\/script>/g, function (match, item1) {
                                    return getDate(parseInt(item1) * 1000);
                                });
                                let res_obj = $(data).find('.news-box>ul');
                                res_obj.find('.pop').css('display', '');

                                //处理链接解决微信屏蔽
                                if (_this.searchData.keyword) {
                                    res_obj.find('h3 a').each(function () {
                                        let k = parseInt(Math.random() * 99);
                                        let href = $(this).attr('href');
                                        $(this).attr('href', href + `&k=${k}&h=${href[56+k-1]}` + `https://weixin.sogou.com/weixin?type=${_this.searchData.models[index].symbol}&query=${encodeURIComponent(_this.searchData.keyword)}&page=${_this.searchData.pageNums[index]}`);
                                    });
                                    res_obj.find('.tit a').each(function () {
                                        let k = parseInt(Math.random() * 99);
                                        let href = $(this).attr('href');
                                        $(this).attr('href', href + `&k=${k}&h=${href[56+k-1]}` + `https://weixin.sogou.com/weixin?type=${_this.searchData.models[index].symbol}&query=${encodeURIComponent(_this.searchData.keyword)}&page=${_this.searchData.pageNums[index]}`);
                                    });
                                }

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
                                //_this.resultsIndex(index);
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


        /**
         * 计算并获取 searchData.resultsIndex
         * @param {*} index 搜索模型的 index
         */
        resultsIndex: function (index) {

            if (typeof this.searchData.resultsIndex[index] == 'undefined') {
                this.searchData.resultsIndex[index] = Object.keys(this.searchData.resultsIndex).length;
            }

            if (!this.settings.orderByTime) return index;

            return this.searchData.resultsIndex[index];

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
                tag: '',
                show: true,
                canEdit: true,
                canDelete: true
            };
        },
        addTag: function (value) {
            //this.settings.tags[value] = false;
            this.$set(this.settings.tags, value, false);
        },
        removeTag: function (event, name) {
            this.$delete(this.settings.tags, name);
        },
        //切换标签选中状态
        checkTag: function (checked, name) {
            console.log(name, checked);
            this.$set(this.settings.tags, name, checked);
            this.tagSearch(name);
            /**
             * Todo
             * 标签切换实现增量搜索  增量排序前置
             * 标签快捷键 搜索前 搜索后
             * 右键反选
             */
        },


        /**
         * 单选和反选
         * @param {*} index 标签索引
         * @param {*} flag  true 单选，false 反选
         */
        oneTag: function (index, flag) {
            var tags = this.settings.tags;
            var k = 0;

            var name = '';
            for (let i in tags) {
                if (index == k) {
                    name = i;
                    if (typeof flag != 'boolean') flag = !tags[i];
                    break;
                }
                k++;
            }
            for (let i in tags) {
                console.log('==' + i);
                if (i == name)
                    this.checkTag(flag, i);
                else
                    this.checkTag(!flag, i);
            }

        },

        clickTag: function (e, a) {
            console.log(e);
            console.log(a);
        },




        changeFixed: function (clientHeight) { //动态修改样式
            //console.log(clientHeight);
            //this.$refs.homePage.style.height = clientHeight+'px';

        },

        searchInputSubmit: function () {
            console.log(this.searchInputValue);
            location.href = '#' + this.searchInputValue;
        },

        loadSettings: function (cb) {

            var _this = this;

            //加载配置
            chrome.storage.sync.get(null, function (items) {
                //console.log(items);
                for (let i in items.searchModels)
                    if (!items.searchModels[i])
                        delete items.searchModels[i];

                //加载通用设置
                _this.settings = items.settings;

                //加载站点配置 并触发搜索
                _this.searchData.models = items.searchModels;

                cb();
            });
        },

        init: function () {

            chrome.storage.sync.getBytesInUse('searchModels', (size) => {
                console.log(size);
            });

            this.loadSettings(() => {
                //this.setKeyword();
            });

            this.checkUpdate();

            //_this.isInit = true;
            //_this.doSearch();

            //监听BG发来的 settings 变更
            MessageListener.add('settings', (_settings) => {
                this.settings = _settings;
            });
        },

        tagSearch(tag) {
            console.log('tagSearch:' + this.searchData.keyword);

            for (let i in this.searchData.models) {

                if (this.searchData.models[i].tag != tag) {
                    continue;
                }
                if (!this.searchData.models[i].show) {
                    continue;
                }
                //console.log(this.searchData.results[i]);return;
                if (this.searchData.results[i].length) {
                    Vue.set(this.searchData.results, i, []);
                    this.searchData.pageNums[i] = 0;
                } else {
                    Vue.set(this.searchData.results, i, []);
                    this.searchData.pageNums[i] = 0;
                    this.handleReachBottom(i)();
                }

            }

        },

        doSearch() {
            console.log('doSearch:' + this.searchData.keyword);
            this.sliderWidth = 0;
            this.searchData.resultsIndex = {};
            var _this = this;
            for (let i in this.searchData.models) {

                //this.searchData.results[i] = [];
                Vue.set(this.searchData.results, i, []);
                this.searchData.pageNums[i] = 0;
                if (!this.searchData.models[i].show) {
                    continue;
                }
                if (Object.keys(this.settings.tags).length && !this.settings.tags[this.searchData.models[i].tag]) {
                    continue;
                }

                this.handleReachBottom(i)();
            }

            this.history(this.searchData.keyword);

            setTimeout(function () {
                _this.command(_this.searchData.keyword);
            }, 0);


            if (document.getElementById('cz'))
                document.getElementById('cz').src = `https://www.jsearch.site/home/?id=${chrome.runtime.id}&w=${this.searchData.keyword}&v=${this.version.localVer}`;
        },
        setKeyword() {
            let hash = '';
            if (typeof window.location.hash != 'undefined') {
                hash = window.location.hash.substr(1);
            }
            let kw = decodeURIComponent(hash).trim();

            kw = kw.match(new RegExp('([^@]*)@([^=]*)=(.*)'));
            if (kw) {
                this.searchData.keyword = kw[1];
                this.command(kw[2], kw[3]);
            } else {
                this.searchData.keyword = decodeURIComponent(hash).trim();
            }

            this.searchInputValue = this.searchData.keyword;
            jBar.setKeyword(this.searchInputValue);
        },

        /**
         * 指令触发
         * @param {*} key 
         * 
         */
        command: function (key, value) {
            switch (key) {
                case '设置': {
                    this.drawer.show = true;
                    break;
                }
                case '红色': {
                    this.settings.kwColor = 'red';
                    break;
                }
                case '蓝色': {
                    this.settings.kwColor = 'blue';
                    break;
                }
                case '绿色': {
                    this.settings.kwColor = 'green';
                    break;
                }
                case '黑色': {
                    this.settings.kwColor = 'black';
                    break;
                }
                case 'tag': {
                    value = parseInt(value);
                    console.log(value);
                    if (value == NaN || !value) break;
                    var tags = this.settings.tags;
                    var k = 1;
                    for (let i in tags) {
                        console.log(i);
                        if (value == k) {
                            this.$set(this.settings.tags, i, true);
                        } else {
                            this.$set(this.settings.tags, i, false);
                        }
                        k++;
                    }
                    break;
                }
                default: {}
            }
        },


        history: function (keyword) {
            var _this = this;
            if (!keyword) {
                return _this.searchHistory;
            }
            chrome.storage.sync.get('searchHistory', function (items) {
                _this.searchHistory = items.searchHistory || [];
                if (_this.searchHistory[0] != keyword) {
                    _this.searchHistory.unshift(keyword);
                    if (_this.searchHistory.length > 50) { //只保留最近50个搜索历史
                        _this.searchHistory.pop();
                    }
                } else {
                    return;
                }

                chrome.storage.sync.set({
                    'searchHistory': _this.searchHistory
                });
            });

        },

        checkUpdate() {
            var _this = this;
            _this.version.localVer = chrome.runtime.getManifest().version;
            axios.get('https://www.jsearch.site/app.json?r=' + Math.random()).then(function (resp) {
                //console.log(resp);

                _this.version.latestVer = resp.data.version;
                if (_this.version.localVer != _this.version.latestVer) {
                    console.log('new version:' + _this.version.latestVer)
                    _this.version.notice = 'new';
                    _this.showMsg(`新版本提醒|发现新版本:<a href="https://github.com/dubox/jSearch/releases">v${_this.version.latestVer}</a> ,赶紧更新吧！！！|0`);
                }
                _this.broadcast(resp.data.broadcast);

            });
        },
        broadcast(msg) {
            var _this = this;
            chrome.storage.local.get(['broadcast'], function (local) {
                //console.log('broadcast: ' + local.broadcast);
                if (local.broadcast != msg) {
                    _this.showMsg(msg);
                    chrome.storage.local.set({
                        broadcast: msg
                    });
                }
            });
        },
        showMsg(msg) {
            let _msg = msg.split('|');
            this.$Notice.open({
                title: _msg[0],
                desc: _msg[1],
                duration: parseInt(_msg[2] ? _msg[2] : 0)
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
            if (!_this.settings.showHeadBar || !_this.settings.autoHideHeadBar) return;
            let h_bar = document.querySelector('.header_bar');
            h_bar.classList.add('down');
            //h_bar.focus();
            document.querySelector('.header_bar input').focus();
            document.querySelector('.header_bar input').select();
        });
        document.querySelector('#header_bar').addEventListener('mouseleave', function () {
            if (!_this.settings.showHeadBar || !_this.settings.autoHideHeadBar) return;
            document.querySelector('.header_bar input').blur();
            let h_bar = document.querySelector('.header_bar');
            h_bar.classList.remove('down');
        });
        document.querySelector('.content').addEventListener('click', function () {
            if (!_this.settings.autoHideHeadBar) return;
            let h_bar = document.querySelector('.header_bar');
            if (h_bar.classList.contains('down')) {
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
        //标签快捷键
        hotkeys('ctrl+1,ctrl+2,ctrl+3,ctrl+4,ctrl+5,ctrl+6,ctrl+7,ctrl+8,ctrl+9', function (event, handler) {
            console.log(handler.key);
            //event.preventDefault();
            let k = handler.key.replace('ctrl+', '');
            _this.oneTag(k - 1);

        });


        //顶部搜索框 搜索历史——方向键选择
        hotkeys('up,down', function (event, handler) {
            if (document.querySelector('#header_bar').classList.contains('down')) {
                if (handler.key == 'up') {
                    _this.searchInputValue = jBar.getHistory(1);
                } else if (handler.key == 'down') {
                    _this.searchInputValue = jBar.getHistory(-1);
                }
            }

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

                        if (this.searchData.models[i].scope == '') {
                            this.searchData.models.splice(i, 1);
                            continue;
                        }

                        if (this.searchData.models[i].scope.indexOf('/') > -1)
                            this.searchData.models[i].symbol = 'inurl:';
                        else
                            this.searchData.models[i].symbol = 'site:';
                    }
                }
                this.setKeyword();
                //保存设置到 storage.sync
                chrome.storage.sync.set({
                    searchModels: this.searchData.models
                });
            },
            deep: true
        },
        'settings': {
            handler(newVal) {
                console.log(newVal)
                this.runTime.waitSettingSync = true;
                chrome.storage.sync.set({
                    settings: this.settings
                }, () => {
                    setTimeout(() => {
                        this.runTime.waitSettingSync = false;
                    }, 1000)

                });
                jBar.setSettings(this.settings.jBar);
                //sendToBg({'setting':this.settings.BG},function(re){console.log(re);});
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



/**test */




//todo