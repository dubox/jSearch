var app = new Vue({
    el: '#app',
    data: {
        sliderWidth:0,
        searchInputValue:'',
        searchData:{
            keyword : null,
            models:[],  //搜索域配置
            results:[],  //搜索结果
            pageNums:[]  //搜索结果
        },

        clientHeight:500,

        settingFormData: {
                    type:'baidu',
                    symbol:'',
                    scope:'',
                    show:true,
                    canEdit:true,
                    canDelete:true
        },

        drawer:{
                show: false,
                styles: {
                    height: 'calc(100% - 55px)',
                    overflow: 'auto',
                    paddingBottom: '70px',
                    position: 'static'
                },
                
            },
    },
    methods: {
        
        handleReachBottom:function(index){
            var _this = this;
            return function(){
                
                return new Promise(resolve => {
                    var search_scope = _this.searchData.models[index].symbol != ''
                                            ? _this.searchData.models[index].symbol+_this.searchData.models[index].scope
                                            : '';
                    if(_this.searchData.models[index].type == 'baidu'){
                        if(_this.searchData.results[index][_this.searchData.results[index].length-1] == ''){
                            resolve();
                            return false;
                        }
                        $.get(`https://www.baidu.com/s?wd=${search_scope} ${_this.searchData.keyword}&pn=${_this.searchData.pageNums[index]*10}`,function(data){
                            //console.log(data);
                            let res_obj = $(data).find('#content_left');
                            res_obj.children().not('.c-container').remove();
                            let res = res_obj.html();
                            let text_for_check = $(res).text();
                            //console.log(res);
                            //console.log($(_this.searchData.results[index][_this.searchData.results[index].length-1]).text());
                            if($(_this.searchData.results[index][_this.searchData.results[index].length-1]).text() == text_for_check){
                                _this.searchData.results[index].push('');
                            }else if(_this.searchData.results[index][_this.searchData.results[index].length-1] == ''){

                            }else{
                                _this.searchData.results[index].push(res);
                                _this.searchData.pageNums[index]++;
                            }
                            resolve();
                        });
                    }else if(_this.searchData.models[index].type == 'bookmarks'){

                        //_this.searchData.results[index] = [];

                        if(_this.searchData.results[index].length>0){
                            resolve();
                            return false;
                        }
                        
                        var kw_reg = _this.searchData.keyword.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&').replace(/\s+/g ,'|');
                        //for (let i in kw){

                            chrome.bookmarks.search(_this.searchData.keyword, function(res){
                                //console.log(res)
                                //res.splice(0,1);
                                for(let i in res){
                                    res[i].dateAdded = getDate(res[i].dateAdded);
                                    res[i].title = res[i].title.replace(new RegExp('('+kw_reg+')','ig') ,function(match){return '<em>'+match+'</em>'});
                                    res[i].tag = 'bookmark'
                                }//console.log(res)
                                _this.searchData.results[index] = _this.searchData.results[index].concat(res);
                                
                            });
                            chrome.history.search({'text':_this.searchData.keyword ,'startTime':0,'maxResults':120}, function (res){
                                
                                for(let i = res.length-1 ; i>=0 ;i--){
                                    //屏蔽本扩展的历史记录
                                    if(res[i].url.indexOf(chrome.extension.getURL('')) > -1){
                                        res.splice(i,1)
                                        continue;
                                    }
                                    res[i].dateAdded = getDate(res[i].lastVisitTime);
                                    res[i].title = res[i].title.replace(new RegExp('('+kw_reg+')','ig') ,function(match){return '<em>'+match+'</em>'});
                                    res[i].tag = 'history'
                                }//console.log(res)
                                _this.searchData.results[index] = _this.searchData.results[index].concat(res);
                                    resolve();
                            });
                        //}
                    }
                });
            }
        },
        settingAddSearchScope:function(){
            this.settingFormData.scope = this.settingFormData.scope.trim().replace(/^(http[s]?:\/\/)|(\/)$/,function(match){return '';});
            if(this.settingFormData.scope.indexOf('/')>-1)
            this.settingFormData.symbol = 'inurl:';
            else
            this.settingFormData.symbol = 'site:';

            this.searchData.models = this.searchData.models.concat(JSON.parse(JSON.stringify(this.settingFormData)));
            this.settingFormData = {
                        type:'baidu',
                        symbol:'',
                        scope:'',
                        show:true,
                        canEdit:true,
                        canDelete:true
            };
        },

        
        changeFixed:function(clientHeight){                        //动态修改样式
            //console.log(clientHeight);
            //this.$refs.homePage.style.height = clientHeight+'px';
    
          },

          searchInputSubmit:function(){
            console.log(this.searchInputValue);
            location.href = '#'+this.searchInputValue;
        },
    
        init:function(){
            var _this = this;
            //chrome.storage.sync.set({a:[{aa:'aa'}]});
            //chrome.storage.sync.get('a',function(items){console.log(items);});
            //chrome.storage.sync.clear();
            chrome.storage.sync.get('searchModels',function(items){
                //console.log(items);
                _this.searchData.models = items.searchModels;
                /*
                for(let i in _this.searchData.models){
                    _this.$watch('searchData.models.'+i+'.scope', (newVal, oldVal) => {
                        console.log(`${newVal} : ${oldVal}`);
                    })
                }
                */
            });
            chrome.storage.sync.getBytesInUse('searchModels',function(size){
                console.log(size);
            });
            //console.log(chrome.extension.getURL(''));
            _this.setKeyword();
            //this.sliderWidth = 700 * this.searchData.models.length;
          },
          doSearch(){
            console.log(this.searchData.keyword);
            this.sliderWidth = 0;
            for(let i in this.searchData.models){

                //this.searchData.results[i] = [];
                Vue.set(this.searchData.results,i,[]);
                this.searchData.pageNums[i] = 0;
                if(!this.searchData.models[i].show){
                    continue;
                }
                var _this = this;
                this.handleReachBottom(i)().then(function(){
                    if(!(_this.searchData.results[i].length==1 && _this.searchData.results[i][0]=='') && _this.searchData.results[i].length>0)
                    _this.sliderWidth += 600;
                });
                
            }
          },
          setKeyword(){
            let hash = '';
            if(typeof window.location.hash != 'undefined'){
                hash = window.location.hash.substr(1);
            }
            this.searchData.keyword = decodeURIComponent(hash).trim();
            this.searchInputValue = this.searchData.keyword;
            jBar.setKeyword(this.searchInputValue);
          }
    },
    beforeMounted(){
        
          
    },
    mounted(){
        // 获取浏览器可视区域高度
        this.clientHeight =   document.documentElement.clientHeight;          //document.body.clientWidth;
        //console.log(self.clientHeight);
        var _this = this;
        window.onresize = function () {
            _this.clientHeight = document.documentElement.clientHeight;
        };
        window.addEventListener('popstate', () => {
            this.setKeyword();
        })

        //顶部感应区，触发显示 header-bar
        document.querySelector('.top_area').addEventListener('mouseenter',function(){
            let h_bar = document.querySelector('.header_bar');
            h_bar.classList.add('down');
            //h_bar.focus();
            document.querySelector('.header_bar input').select();
        });
        document.querySelector('.header_bar').addEventListener('mouseleave',function(){
            document.querySelector('.header_bar input').blur();
            let h_bar = document.querySelector('.header_bar');
            h_bar.classList.remove('down');
            
        });

        this.init();
      },
      watch: {
        // 如果 `clientHeight` 发生改变，这个函数就会运行
        clientHeight: function () {
          this.changeFixed(this.clientHeight)
        },
        'searchData.keyword':function(){
            this.doSearch();
        },
        'searchData.models':
        {
            handler(newVal){
                for(let i in newVal){
                    if(this.searchData.models[i].canEdit){
                        this.searchData.models[i].scope = newVal[i].scope.trim().replace(/^(http[s]?:\/\/)|(\/)$/,function(match){return '';});
                        if(this.searchData.models[i].scope.indexOf('/')>-1)
                        this.searchData.models[i].symbol = 'inurl:';
                        else
                        this.searchData.models[i].symbol = 'site:';
                    }
                }
                //console.log(this.searchData.models);
                this.doSearch();
                //保存设置到 storage.sync
                chrome.storage.sync.set({searchModels:this.searchData.models});
            },
           deep: true
        }
        
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
    return y + "年" + m + "月" + d +'日';
}



//todo
//windows 滚动条丑陋问题
//搜索历史
//支持谷歌
//支持删除自定义站点
//支持站点排序
//支持当前网页地址生成二维码
//快捷键唤醒搜索框