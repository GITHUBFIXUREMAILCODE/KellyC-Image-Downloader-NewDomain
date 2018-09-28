// важно создавать объект KellyGrabber в рамках процесса-вкладки с которой будут сохраняться картинки \ данные.
// т.к. при скачивании из фона хром не позволяет установить заголовки "гостевой" вкладки из фонового процесса. Любой сервер потенциально может принять скачивание без должных заголовков за атаку \ бота

// сохранять последний выбор
// скорректировать вывод состояниф для публикаций с несколькими медиа элементами

function KellyGrabber(cfg) {
    
    var handler = this;   
    
    var downloadingIds = []; // ids from chrome API that returned for each download process
    
    // operationId - id of an KellyGrabber.addFile item, that store in downloads[]
    
    downloads = []; 
    
    var DOWNLOADID_GET_PROCESS = -1;
    var DOWNLOADID_INACTIVE = false;
    
    // array of current selected download items
    // 
    // Download item object params :
    //     
    // .downloadId > 0     - accepted by API, downloading 
    // .downloadId = DOWNLOADID_GET_PROCESS    - request to API sended, waiting 
    // .downloadId = DOWNLOADID_INACTIVE - inactive 
    //
    // .workedout          - true if element already processed (check .error \ .downloadDelta for result)
    // 
    // .item               - reference to fav.item object
    // .subItem            - index of fav.item.pImage if object has more then one image
    //
    
    var ids = 0; // counter for downloads
    
    var acceptItems = false;
    
    var events = { 
        onDownloadAllEnd : false, 
        onDownloadFile : false,
        onUpdateState : false,
    };
    
    this.nameTemplate = false;
    
    var style = false;
    var className = 'kellyGrabber-';
    
    var buttons = {};
    
    var options = {	
        nameTemplate : '#category_1#/#filename#', 
        baseFolder : '',
        maxDownloadsAtTime : 2,
        interval : 1,
        cancelTimer : 3 * 60, // not added currently
        quality : 'hd',
        itemsList : '',
        from : 0,
        // to : 0,
    }
    
    var mode = 'wait';
    var eventsEnabled = false;
    
    var extendedOptionsShown = false;
    
    // dom elements
    
    // assigned
      
    this.container = false;
    
    // generated on showGrabManager
    
    this.btnsSection = false;
    var logSection = false;
    var downloadProgress = false;
    
    var fav;
    var log = '';
    var lng = KellyLoc;
    
    var availableItemsIndexes = [];
    
    function constructor(cfg) { 
        handler.updateCfg(cfg);
    }
    
    this.getState = function() {    
        return mode;
    }
    
    this.updateCfg = function(cfg) {
    
        if (cfg) {
            if (cfg.container) handler.container = cfg.container;
        
            if (cfg.events) {
            
                for (var k in events){
                    if (typeof cfg.events[k] == 'function') {
                         events[k] = cfg.events[k];
                    }
                }
            }
            
            for (var k in options) {
                if (typeof cfg[k] != 'undefined') {
                    
                    if (k == 'baseFolder') {
                        handler.setBaseFolder(cfg.baseFolder);
                    } else {
                        options[k] = cfg[k];
                    }
                }
            }
            
            if (cfg.className) {
                className = cfg.className;
            }
            
            
            if (cfg.fav) {
                fav = cfg.fav;
            }
            
            if (cfg.availableItemsIndexes) {
                availableItemsIndexes = cfg.availableItemsIndexes;
            }
            
            if (cfg.shownItems) {
                
                shownItems = cfg.shownItems;
            }
            
            if (cfg.imageClassName) {
                imageClassName = cfg.imageClassName;
            }
        }
    }
    
    this.showGrabManager = function() {
    
        if (!handler.container) return false;
        
        var extendedClass = className + '-controll-extended ' + (extendedOptionsShown ? 'active' : 'hidden'); 
        var extendedShowTitle = {
            show : lng.s('Показать расширенные настройки', 'grabber_show_extended'),
            hide : lng.s('Скрыть расширенные настройки', 'grabber_hide_extended'),
        };
       
        if (!options.baseFolder) {
            handler.setBaseFolder(fav.getGlobal('env').profile + '/Downloads');
        }
       
        handler.container.innerHTML = '\
            <div class="' + className + '-controll">\
                <table>\
                    <tr><td>\
                        <label>' + lng.s('Основная директория', 'grabber_common_folder') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="' + lng.s('Директория', 'folder') + '" class="' + className + '-controll-baseFolder" value="' + options.baseFolder + '">\
                    </td></tr>\
                    <tr><td>\
                        <label>' + lng.s('Элементы', 'grabber_selected_items') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="1-2, 44-823, 1-999..." class="' + className + '-itemsList" value="' + options.itemsList + '">\
                    </td></tr>\
                    <!--tr class="' + className + '-range-tr"><td>\
                        <label>' + lng.s('Диапазон', 'grabber_range') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="С" class="' + className + '-from" value="' + (options.from + 1) + '">\
                        <input type="text" placeholder="По" class="' + className + '-to" value="' + (options.to-1) + '">\
                    </td></tr-->\
                    <tr class="' + className + '-quality-tr"><td colspan="2">\
                        <label><input type="radio" name="' + className + '_image_size[]" value="hd" class="' + className + '-quality" checked>' + lng.s('Оригинал', 'grabber_source') + '</label>\
                        <label><input type="radio" name="' + className + '_image_size[]" value="preview" class="' + className + '-quality">' + lng.s('Превью', 'grabber_preview') + '</label>\
                    </td></tr>\
                    <tr class="' + className + '-extended-show-row"><td colspan="2">\
                        <label><a href="#" class="' + className + '-extended-show">' + extendedShowTitle[extendedOptionsShown ? 'hide' : 'show'] + '</a></label>\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>' + lng.s('Шаблон названия', 'grabber_name_template') + ' (<a href="#" class="' + className + '-nameTemplate-help">' + lng.s('Подсказка', 'tip') + '</a>)</label>\
                    </td><td>\
                        <input type="text" placeholder="" class="' + className + '-nameTemplate" value="' + options.nameTemplate + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>' + lng.s('Количество потоков', 'grabber_threads_num') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-threads" value="' + options.maxDownloadsAtTime + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>' + lng.s('Интервал загрузки (сек)', 'grabber_interval') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-interval" value="' + options.interval + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>' + lng.s('Таймаут при долгом выполнении запроса (сек)', 'grabber_timeout') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-timeout" value="' + options.cancelTimer + '">\
                    </td></tr>\
                    <!--tr><td colspan="2">\
                        <label>' + lng.s('Исключать изображения с низким разрешением', 'grabber_exclude_lowres') + '</label><label><input type="checkbox" class="' + className + '-exclude-low-res" value="1"></label>\
                    </td></tr-->\
                    <tr><td colspan="2"><div class="' + className + '-controll-buttons"></div></td></tr>\
                    <tr><td colspan="2">\
                        <div class="' + className + '-progressbar"><span class="' + className + '-progressbar-line"></span><span class="' + className + '-progressbar-state"></span></div>\
                    </td></tr>\
                    <tr><td colspan="2"><div class="' + className + '-controll-log" style="display : none;"></div></td></tr>\
                </table>\
            </div>\
        ';
            
        var baseFolderInput = KellyTools.getElementByClass(handler.container, className + '-controll-baseFolder');
            baseFolderInput.onchange = function() {
                
                handler.setBaseFolder(this.value);
                
                this.value = options.baseFolder;
                return;
            }        
            
        var itemsList = KellyTools.getElementByClass(handler.container, className + '-itemsList');
            itemsList.onchange = function() {
                
                updateContinue(true);
                return;
            }                    
            
        var nameTemplateHelp = KellyTools.getElementByClass(handler.container, className + '-nameTemplate-help');
            nameTemplateHelp.onclick = function() {
                                
                var envVars = fav.getGlobal('env');
                var tooltip = new KellyTooltip({
                    target : 'screen', 
                    offset : {left : 20, top : -20}, 
                    positionY : 'bottom',
                    positionX : 'left',				
                    ptypeX : 'inside',
                    ptypeY : 'inside',
                   // closeByBody : true,
                    closeButton : true,
                    removeOnClose : true,                    
                    selfClass : envVars.hostClass + ' ' + envVars.className + '-tooltipster-help',
                    classGroup : envVars.className + '-tooltipster',
                });
                   
                var html = lng.s('', 'grabber_name_template_help');
                for (var i = 1; i <= 4; i++) {
                    html += lng.s('', 'grabber_name_template_help_' + i);
                }
                   
                var tcontainer = tooltip.getContent();
                    tcontainer.innerHTML = html;
                
                setTimeout(function() {
                    
                    tooltip.show(true);                    
                    tooltip.updatePosition();
                    tooltip.updateCfg({closeByBody : true});
                    
                }, 100);
                return false;
            }
        
        var nameTemplate = KellyTools.getElementByClass(handler.container, className + '-nameTemplate');
            nameTemplate.onchange = function() {
                
                options.nameTemplate = KellyTools.validateFolderPath(this.value);                
                this.value = options.nameTemplate;
                
                handler.setDownloadTasks();
                return;
            }       
            
            
        var quality = KellyTools.getElementByClass(handler.container, className + '-quality');
            quality.onclick = function() {
                options.quality = this.value == 'hd' ? 'hd' : 'preview';
                handler.setDownloadTasks();
            }
            
        var showExtend = KellyTools.getElementByClass(handler.container, className + '-extended-show');
            showExtend.onclick = function() {
                
                extendedOptionsShown = !extendedOptionsShown;
                
                var extOptions = document.getElementsByClassName(className + '-controll-extended');
                if (extOptions) {
                    for (var i=0; i < extOptions.length; i++) {						
                        if (!extendedOptionsShown) {
                            extOptions[i].className = extOptions[i].className.replace('active', 'hidden');
                        } else {
                            extOptions[i].className = extOptions[i].className.replace('hidden', 'active');
                        }
                    }
                }
                
                this.innerHTML = extendedShowTitle[extendedOptionsShown ? 'hide' : 'show'];
                return false;
            }
        
        var threadsInput = KellyTools.getElementByClass(handler.container, className + '-threads');
            threadsInput.onchange = function() {
                                
                options.maxDownloadsAtTime = parseInt(this.value);
                if (!options.maxDownloadsAtTime || options.maxDownloadsAtTime < 0) options.maxDownloadsAtTime = 1;
                
                this.value = options.maxDownloadsAtTime;
                
                console.log(options.maxDownloadsAtTime);
            }
   
        var intervalInput = KellyTools.getElementByClass(handler.container, className + '-interval');
            intervalInput.onchange = function() {
                                
                options.interval = KellyTools.validateFloatSting(this.value)                
                if (!options.interval || options.interval < 0.1) options.interval = 0.1;
               
                this.value = options.interval;
                 
                console.log(options.interval);
            }
            
        var cancelInput = KellyTools.getElementByClass(handler.container, className + '-timeout');
            cancelInput.onchange = function() {
                                
                options.cancelTimer = KellyTools.validateFloatSting(this.value)                
                if (!options.cancelTimer || options.cancelTimer < 2) options.cancelTimer = 5 * 60;                
                
                this.value = options.cancelTimer;
                
                console.log(options.cancelTimer);
            } 
            
        downloadProgress = {
            line : KellyTools.getElementByClass(handler.container, className + '-progressbar-line'),
            state : KellyTools.getElementByClass(handler.container, className + '-progressbar-state'),
        }
            
        logSection = KellyTools.getElementByClass(handler.container, className + '-controll-log');
    
        handler.btnsSection = KellyTools.getElementByClass(handler.container, className + '-controll-buttons');
        
        // add controll buttons
        
        buttons = {};
        handler.addControllEl('init', ''); 
        
        var continueBtn = handler.addControllEl('continue', lng.s('Продолжить', 'grabber_continue'), function() {
            
            if (mode != 'wait') return false;
            
            options.from = parseInt(this.getAttribute('data-start-from'));            
            handler.download();  
            
            updateContinue(true);            
            return false;
        });  
        
        continueBtn.style.display = 'none';        
        
        handler.addControllEl('save_as_json', lng.s('Скачать файл данных', 'grabber_save_as_json'), function() {
        
            fav.downloadFilteredData();            
            return false;
        }); 

        var logBtn = handler.addControllEl('save_log', lng.s('Скачать лог', 'grabber_save_log'), function() {
        
            downloadLog();            
            return false;
        });   

        logBtn.style.display = 'none';
        
        handler.updateStartButtonState('start');
        updateProgressBar();        
    }
    
    function updateProgressBar() {
        if (!downloadProgress || !downloadProgress.line) return false;
        
        var total = downloads.length;
        if (acceptItems) {
            total = acceptItems.length;
        }
        
        var current = handler.countCurrent('complete');
        if (current > total) {
            toTxtLog('CHECK COUNTER ' + current + ' / ' + total);
            current = total;
        }
        
        downloadProgress.state.innerHTML = current + ' / ' + total;        
        downloadProgress.line.style.width = Math.round(current / (total / 100)) + '%';
    }
    
    function downloadLog() {
    
        var fname = fav.getGlobal('env').profile + '/Storage/Logs/';
            fname += 'download_log_' + KellyTools.getTimeStamp() + '.log';
            fname = KellyTools.validateFolderPath(fname);
            
        KellyTools.createAndDownloadFile(log, fname);
        
    }
    
    function optionsFormDisable(disable) {
        
        var inputs = handler.container.getElementsByTagName('input');
        
        if (!inputs || !inputs.length) return;
        
        for (var i = 0; i < inputs.length; i++) {
            
            inputs[i].disabled = disable;
        }
    }
    
    function showState(state) {
        
        if (!state) state = 'undefined';
        
        var html = '';
        
        if (state == "complete") {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-ok" data-notice="' + lng.s('Загрузка завершена', 'grabber_state_ready') + '"></div>';
        } else if (state == "in_progress") {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-loading" data-notice="' + lng.s('Загрузка...', 'grabber_state_loading') + '" ></div>';
        } else if (state == 'wait') {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-wait" data-notice="' + lng.s('Ожидает в очереди', 'grabber_state_wait') + '"></div>';
        } else if (state == 'error') {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-err" data-notice="' + lng.s('Ошибка загрузки', 'grabber_state_error') + '"></div>'; // todo вывод деталей ошибки, сохраняется в lastError?
        } else if (state == 'skip') {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-skip" data-notice=""></div>'; 
        }  else {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-undefined" data-notice=""></div>';
        }
         
        return html;
    }
    
    function showDownloadItemInfoTooltip(downloadIndex, target) {
    
        if (KellyTools.getElementByClass(document, fav.getGlobal('env').className + '-tooltipster-help')) {
            return;
        }
        
        if (!downloads[downloadIndex]) return;
        
        var item = downloads[downloadIndex].item;
        var tooltipEl = fav.getTooltip();
            tooltipEl.updateCfg({
                target : target, 
                offset : {left : 0, top : 0}, 
                positionY : 'top',
                positionX : 'right',				
                ptypeX : 'outside',
                ptypeY : 'inside',
            });
            
        var baseClass = fav.getGlobal('env').className + '-tooltipster-ItemInfo';
        
        var itemInfo = document.createElement('div');
            itemInfo.className = baseClass;
            itemInfo.id = baseClass + '-' + downloadIndex;
            itemInfo.innerHTML = lng.s('Сохранить как', 'grabber_save_as') + ' : <br>' + downloads[downloadIndex].filename + '<br><br>' + fav.showItemInfo(item); 		
    
        var tcontainer = tooltipEl.getContent();
            tcontainer.innerHTML = '';
            tcontainer.appendChild(itemInfo);
            
        tooltipEl.show(true);
    }
        
    this.updateStateForImageGrid = function() {
        
        if (events.onUpdateState && events.onUpdateState(handler)) return;
        
        var subItems = {};
        
        for (var i = 0; i <= downloads.length-1; i++) {
                
            //    console.log(handler.isItemShown(downloads[i].item));
            if (!downloads[i].item) continue;
            
            var downloadItemId = imageClassName + '-' + downloads[i].item.id;
            var N = i+1;
           
            if (downloads[i].subItem !== false) {                
                if (!subItems[downloads[i].item.id]) subItems[downloads[i].item.id] = [];
                subItems[downloads[i].item.id].push(i);                
            }
            
            var itemContainer = document.getElementById(downloadItemId);
            if (!itemContainer) {
                continue;
            }       
            
            // console.log(imageClassName + '-' + downloads[i].item.id);
        
            var holder = KellyTools.getElementByClass(itemContainer, imageClassName + '-download-state-holder');
            
            if (!holder) {
                
                holder = document.createElement('DIV');
                holder.className = imageClassName + '-download-state-holder';
                holder.setAttribute('downloadIndex', i);
                
                var title = '#' + N;
                if (downloads[i].subItem !== false) {
                    title += '-#' + (N + downloads[i].item.pImage.length-1);
                }
                
                holder.innerHTML = '\
                    <div class="' + imageClassName + '-download-number" data-start="' + N + '"><span>' + title + '</span></div>\
                    <div class="' + imageClassName + '-download-status"></div>\
               ';
                
                itemContainer.appendChild(holder);
                                
                /* не проработаны исключения
                var envVars = fav.getGlobal('env');
                
                var tooltipOptions = {
                    offset : {left : 0, top : 0}, 
                    positionY : 'top',
                    positionX : 'right',				
                    ptypeX : 'outside',
                    ptypeY : 'inside',
                    closeButton : false,

                    selfClass : envVars.hostClass + ' ' + envVars.className + '-ItemTip-tooltipster',
                    classGroup : envVars.className + '-tooltipster',
                    removeOnClose : true,
                };
                
                KellyTooltip.addTipToEl(holder, function(el, e){
                
                    return showDownloadItemInfoTooltip(el.getAttribute('downloadIndex'));
                
                }, tooltipOptions, 100);       
                */
                holder.onmouseover = function(e) {                
                    
                    var itemIndex = this.getAttribute('downloadIndex');
                    showDownloadItemInfoTooltip(this.getAttribute('downloadIndex'), this);
                }  
                    
                holder.onmouseout = function(e) {    
                    
                    var related = e.toElement || e.relatedTarget;
                    if (fav.getTooltip().isChild(related)) return;
                        
                    fav.getTooltip().show(false);
                }  
                                
            } 
            
            var statusPlaceholder = KellyTools.getElementByClass(holder, imageClassName + '-download-status');
            
            // update state by last item in collection

            if (downloads[i].subItem === false || downloads[i].subItem == downloads[i].item.pImage.length-1) {
                
                var html = '';
                
                if (downloads[i].subItem === false) {
                    
                    html = showState(getItemState(downloads[i]));
                } else {
                    
                    // console.log(subItems[downloads[i].item.id]);
                    var subItemsStat = {
                        wait : 0,
                        complete : 0,
                        in_progress : 0,
                        error : 0,
                        skip : 0,
                    }
                    
                    for (var b = 0; b < subItems[downloads[i].item.id].length; b++) {    
                        var subItemState = getItemState(downloads[subItems[downloads[i].item.id][b]]);
                        subItemsStat[subItemState]++;                        
                        
                        if ( subItemsStat[subItemState] == subItems[downloads[i].item.id].length ) {
                             html = showState(subItemState);
                        }
                    }
                    
                    if (!html) html = showState('in_progress');
                }
            
                statusPlaceholder.innerHTML = html;
            }
        }
        
        setTimeout(function() {
            
            var textNodes = document.getElementsByClassName(imageClassName + '-download-number');
            for (var i = 0; i < textNodes.length; i++) {
                var textNode = KellyTools.getElementByTag(textNodes[i], 'span');                
                KellyTools.fitText(textNodes[i], textNode);
            }
            
        }, 100);
    }  
    
    function getItemState(ditem) {
        
        if (!ditem.item) return 'skip';
        
        var itemIndex = downloads.indexOf(ditem);        
        if (itemIndex == -1) return 'skip';
        
        if (acceptItems && acceptItems.indexOf(itemIndex+1) == -1) return 'skip';
        
        if (ditem.downloadDelta) {
            
            return 'complete';
            
        } else if (ditem.error) {
                             
            return 'error';
            
        } else if (ditem.canceling) {
            
            return 'cenceling';
            
        } else if ((ditem.blobRequest) || (ditem.downloadId && ditem.downloadId > 0)) {
            
           return 'in_progress';
            
        } else {
            
           return 'wait'; // inlist \ wait 
        }
    }
    
    function assignEvents() {
    
        if (eventsEnabled) return;
        
        // sometimes runtime may be undefined after debug breakpoints
        // https://stackoverflow.com/questions/44234623/why-is-chrome-runtime-undefined-in-the-content-script
        
        KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.keepAliveListener"}, function(response) {});
                
        KellyTools.getBrowser().runtime.onMessage.addListener(
            function(request, sender, sendResponse) {

            if (request.method == "onChanged") {       
                
                handler.onDownloadProcessChanged(request.downloadDelta);                
            }
        });  
        
        eventsEnabled = true;
    
    }
    
    this.onDownloadProcessChanged = function(downloadDelta) {
        
        if (mode != 'download') return;
        
        // console.log('incoming ' + downloadDelta.id);
        // its not our item, exit
        if (downloadingIds.indexOf(downloadDelta.id) === -1) {
            console.log('download id not found, skip ' + downloadDelta.id);
            return false;
        }
        
        var waitingNum = handler.countCurrent('wait');
            
        if (downloadDelta.state) {
        
            if (downloadDelta.state.current != "in_progress") {
                
                // console.log(downloadDelta);
                downloadingIds.splice(downloadingIds.indexOf(downloadDelta.id), 1);
            
                var downloadIndex = handler.getDownloadById(downloadDelta.id);
                if (downloadIndex === false) {
                
                    console.log('item by download id not found in common stack');
                    console.log(downloadDelta);
                    
                    return false;
                }
                
                var downloadItem = downloads[downloadIndex];
                   
                if (downloadItem.cancelTimer) {
                    clearTimeout(downloadItem.cancelTimer);
                    downloadItem.cancelTimer = false;
                }
                 
                downloadItem.downloadDelta = downloadDelta;
                downloadItem.workedout = true;
                
                if (events.onDownloadFile) {
                    // downloadDelta.id, filename, totalBytes
                    events.onDownloadFile(handler, downloadItem);                    
                }

                if (waitingNum) {
                
                    setTimeout(function() {                        
                        handler.addDownloadWork();
                    }, options.interval * 1000);
                }
               
                updateProgressBar();
               
            } else {
                
                // console.log(downloadDelta);
                // console.log(downloadDelta.url + 'download process ' + downloadDelta.fileSize);
            } 
            
            // check if that was last current active work, bring back start button
            if (!waitingNum && !handler.countCurrent('in_progress')) {
                                
                if (events.onDownloadAllEnd) {
                    events.onDownloadAllEnd(handler);
                }
                                    
                handler.updateStartButtonState('start');
                updateContinue(true);
            }
        }
        
        console.log('current in progress ' + handler.countCurrent('in_progress') + ' | wait ' + waitingNum)
        
        handler.updateStateForImageGrid();
    }
    
    this.getControllEl = function(key) {
        return buttons[key] ? buttons[key] : false;
    }
    
    this.addControllEl = function(key, name, onClick, type) {
        
        if (buttons[key]) return false;
        
        if (!handler.btnsSection) return false;
        
        var btn =  document.createElement(type ? type : 'A');        
            btn.className = className + '-button ' + className + '-button-' + key;
            btn.href = "#";
            btn.innerHTML = name;
            
        if (onClick) btn.onclick = onClick;
            
        handler.btnsSection.appendChild(btn);
        
        buttons[key] = btn;
        return btn;
    }
    
    this.closeGrabManager = function() {
 
        if (!handler.container) return false;
        
        handler.cancelDownloads(function() {               
            buttons = {};
            handler.container.innerHTML = ''; 
            downloads = [];
        });
                 
    }
    
    function getNameTemplate() {
        if (!options.nameTemplate) {
            options.nameTemplate = '#category_1#/#id#_#category_1#_#category_2#_#category_3#';
        }
        
        return options.nameTemplate;
    }
    
    this.itemGenerateFileName = function(item, b) {
        
        // todo #filename# 
        // return validatePath
        // todo take fav.items[index].link - postId as name, to get unique index always constant      
        
        var fileName = getNameTemplate();       
        if (item.categoryId) {            
            var categories = fav.getGlobal('fav').categories;
            var sm = fav.getStorageManager();
                sm.sortCategories(categories);
               
                var itemCatN = 0;
              
            for (var i = 0; i < categories.length; i++) {            
                if (item.categoryId.indexOf(categories[i].id) != -1) {
                    itemCatN++;
                    // console.log('#category_' + itemCatN + '#' + ' - replace - ' + favItems.categories[i].name);
                    fileName = KellyTools.replaceAll(fileName, '#category_' + itemCatN + '#', categories[i].name);
                }                
            }            
        }        
        
        if (item.name) {
            fileName = KellyTools.replaceAll(fileName, '#name#', item.name);
        } else {
            fileName = KellyTools.replaceAll(fileName, '#name#', '');
        }
        
        if (item.id) {
            fileName = KellyTools.replaceAll(fileName, '#id#', item.id);
        } else {
            fileName = KellyTools.replaceAll(fileName, '#id#', '');
        }    
        
        if (typeof item.pImage !== 'string') {
                
            b = parseInt(b);
            if (!b) b = 0;            
            pImageName = item.pImage[b];
            
        } else {
        
            pImageName = item.pImage;
        }
        
        var fileUrlName = KellyTools.getUrlFileName(pImageName, true);
        
        if (!fileUrlName) {
            console.log('cant find filename for ' + item.id);
            console.log(item);
            console.log(getNameTemplate());
            return '';
        }
        
        fileName = KellyTools.replaceAll(fileName, '#filename#', fileUrlName); 
        fileName = KellyTools.replaceAll(fileName, /#category_[1-9]+#/, '');
        
        return KellyTools.validateFolderPath(fileName);
    }
    
    // переинициализировать список задач
    
    this.setDownloadTasks = function(indexes) {
        
        if (handler.getState() == 'download') {
            return;            
        }
        
        handler.clearDownloads();
        
        if (indexes) {
            availableItemsIndexes = indexes;
        }
        
        var fullSize = false;
       
        for (var i = 0; i < availableItemsIndexes.length; i++) {
        
            var item = fav.getGlobal('fav').items[availableItemsIndexes[i]];
            
            if (!item.pImage) continue;    
            var fname = handler.itemGenerateFileName(item);   

            if (!fname) continue; // bad template
            
            var separateTemplate = getNameTemplate().indexOf('#filename#') != -1 ? true : false;
            
            if (typeof item.pImage !== 'string') {
            
                for (var b = 0; b <= item.pImage.length-1; b++) {

                    var bfname = fname;
                    if (separateTemplate && b > 0) {
                        bfname = handler.itemGenerateFileName(item, b);
                    } else {
                        bfname += '_' + b;
                    }               
                    
                    handler.addFile(bfname, fav.getGlobal('env').getImageDownloadLink(item.pImage[b], fullSize), item, b);
                }
                
            } else {
            
                handler.addFile(fname,  fav.getGlobal('env').getImageDownloadLink(item.pImage, fullSize), item);
            }
        }  
                
        updateProgressBar(); 
        //KellyTools.createAndDownloadFile('test', 'test.txt');
    }
    
    this.setBaseFolder = function(folder) {
    
        var tmpFolder = KellyTools.validateFolderPath(folder);
        if (tmpFolder) {
            options.baseFolder = tmpFolder;
        }
        
        return options.baseFolder;
    }
    
   
    this.getDownloads = function() {
    
        return downloads;
    }
    
    this.clearDownloads = function() {
        downloads = [];
        downloadingIds = [];
        acceptItems = false;
    }
    
    this.updateStartButtonState = function(state) {

        if (state == 'start') {
            
            optionsFormDisable(false);
            mode = 'wait';
            buttons['init'].innerHTML = lng.s('Начать выгрузку', 'grabber_start');
            buttons['init'].onclick = function() { 
                options.from = 0;
                handler.resetStates(false);
                handler.download();                
                return false;
            }
        
        } else {
            
            
            optionsFormDisable(true);
            mode = 'download';
            buttons['init'].innerHTML = lng.s('Остановить загрузку', 'grabber_stop');
            buttons['init'].onclick = function() {
                handler.cancelDownloads();
                return false;
            }       
        }
      
        if (log &&  buttons['save_log']) {
             buttons['save_log'].style.display = 'block';
        }       
    }
    
    function updateContinue(hide) {
        
        if (!buttons['continue']) return;
        
        if (hide) {
            buttons['continue'].style.display = 'none';
            return;
        }
        
        var lastReadyIndex = 0;
        for (var i = options.from; i <= downloads.length-1; i++) {
            var state = getItemState(downloads[i]);            
            if (state != 'complete' && state != 'skip') {
                break;
            } else {               
               lastReadyIndex = i;
            }
        }
        
        if (lastReadyIndex) {
            buttons['continue'].setAttribute('data-start-from', lastReadyIndex);            
            buttons['continue'].style.display = 'block';
        } else {
            buttons['continue'].style.display = 'none';
        }
    }
    
    this.cancelDownloads = function(onCancel) {    
        
        if (!downloads.length) return;
        
        if ( buttons['init'] ) {
             buttons['init'].innerHTML = lng.s('Остановка...', 'grabber_canceling');        
        }
        
        mode = 'cancel';
        
        // that shold call from event OnStateChanged
                
        var untilStop = 0;      
 
        var checkAllCanceled = function() {            
            
            if (untilStop <= 0) {
                updateContinue();

                handler.resetStates(true);
                handler.updateStartButtonState('start');
                
                if (onCancel) onCancel();
            }
        }
        
        var cancelDownloadItem = function(downloadItem) {
            
            downloadItem.canceling = true;
            
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloadItem.downloadId}, function(response) {
                
                untilStop--;
                
                resetItem(downloadItem);                
                checkAllCanceled();
            });    
        }
        
        for (var i=0; i < downloads.length; i++) {
            
            if (getItemState(downloads[i]) == 'in_progress') {
                                
                if (downloads[i].blobRequest) {                
                    downloads[i].blobRequest.abort();  
                    downloads[i].blobRequest = false;
                }
            
                if (downloads[i].cancelTimer) {
                    clearTimeout(downloads[i].cancelTimer);
                    downloads[i].cancelTimer = false;
                }
                
                if (downloads[i].downloadId && downloads[i].downloadId > 0) {
                    untilStop++;
                    cancelDownloadItem(downloads[i]);         
                }
            } 
        }
                      
        checkAllCanceled();    
    }
    
    
    this.addFile = function(filename, url, item, subItem) {
        
        if (!filename) return false;
        if (!url) return false;
        
        if (url.length < 6) return false;
                
        var ext = KellyTools.getExt(url);
        if (!ext) return false;
        
        filename = filename.trim();   
        if (filename.indexOf('.') == -1) {
            filename += '.' + ext;
        }
        
        ids++;

        if (item && typeof item.pImage !== 'string') {
            subItem = subItem <= item.pImage.length-1 ? subItem : 0;
        } else subItem = false;
            
        
        downloads.push({
            
            id : ids, 
            filename : filename, 
            url : url, 
            conflictAction : 'overwrite', 
            ext : ext,
            
            downloadId : false,
            
            item : item,
            subItem : subItem, 
        });    
    }
    
    this.getDownloadById = function(id) {
                
        for (var i=0; i <= downloads.length-1; ++i) {
            if (downloads[i].downloadId === id) {
                return i;
            }
        }
        
        return false;
    }
        
    this.downloadUrl = function(isBlobData, downloadOptions, onDownload) {
        
        if (!downloadOptions) return false;
        if (!downloadOptions.url) return false;
        if (!downloadOptions.filename) return false;
        
        if (!onDownload) {
            // some browser require default response function for API
            onDownload = function(response) {};
        }
        
        downloadOptions.url = isBlobData ? URL.createObjectURL(downloadOptions.url) : url;         
        KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", blob : isBlobData, download : downloadOptions}, onDownload);             
        
        return true;
    }
    
    function toTxtLog(str) {
    
        log += '[' + KellyTools.getTime() + '] ' + str + "\r\n";
    }
    
    // download file by request as blob data. GET | ASYNC
    // callback(url, data (false on fail), errorCode, errorNotice);
    
    this.createBlobFromUrl = function(urlOrig, callback) {
    
        var xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';

            xhr.onload = function(e) {
                if (this.status == 200) {
                    callback(urlOrig, this.response);
                } else {
                    callback(urlOrig, false, this.status, this.statusText);
                }
            };

            xhr.onerror = function(e) {
                callback(urlOrig, false, -1, 'domain mismatch ? check Access-Control-Allow-Origin header');
            };

            xhr.open('get', urlOrig, true);
            xhr.send();  
        
        return xhr;
    }
    
    this.downloadByXMLHTTPRequest = function(download) {
    
        // design from https://stackoverflow.com/questions/20579112/send-referrer-header-with-chrome-downloads-api
        // key is to save original headers
    
        var baseFileFolder = options.baseFolder;        
        if (!baseFileFolder) baseFileFolder = '';
        
        baseFileFolder += '/';
    
        var urlOrig = download.url;
        
        var downloadOptions = {
            filename : baseFileFolder + download.filename, 
            conflictAction : download.conflictAction,
            method : 'GET',
        }
        
        toTxtLog('download : ' + downloadOptions.filename);
        
        var onDownloadApiStart = function(response){
                
            if (!response.downloadId || response.downloadId < 0) {
                
                toTxtLog('download REJECTED by browser API : ' + downloadOptions.filename);
                toTxtLog('error : ' + response.error + "\n\r");
                
                download.workedout = true;
                download.downloadId = DOWNLOADID_INACTIVE;
                download.error = response.error;
                
            } else {            
                                
                toTxtLog('download ACCEPTED by browser API : ' + downloadOptions.filename);
                
                if (mode != 'download') { // perhapse promise was sended after cancel ?
                
                    // download not needed
                    toTxtLog('downloading start, but user CANCEL downloading process. SEND REJECT TO API for file : ' + downloadOptions.filename);
                     
                    KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : response.downloadId}, function(response) {
                    
                    });
                    return false;
                }
                    
                downloadingIds.push(response.downloadId);                
                console.log('new downloading process ' + response.downloadId + ' for file ' + download.id);
                
                download.downloadId = response.downloadId;                    
                handler.updateStateForImageGrid();
            }			
        }
                
        var onLoadFileAsBlob = function(url, blobData, errorCode, errorNotice) {
            
            if (mode != 'download') return false;
            
            download.blobRequest = false;
            
            if (!blobData) {
            
                // try again, but use default Browser API shitty method (headers from original domain will be fucked up)
                // newer catch this scenario throw, so may be this dont needed
                
                toTxtLog('file NOT LOADED as BLOB ' + urlOrig + ', attempt to download by download api without blob - BAD HEADERS : ' + downloadOptions.filename);
                toTxtLog('LOAD FAIL NOTICE error code ' + errorCode + ', message : ' + errorNotice);
                
                downloadOptions.url = urlOrig;
                handler.downloadUrl(false, downloadOptions, onDownloadApiStart);
                
            } else {
                
                toTxtLog('file LOADED as BLOB ' + urlOrig + ', send to browser API for save to folder : ' + downloadOptions.filename);
                downloadOptions.url = blobData;     

                handler.downloadUrl(true, downloadOptions, onDownloadApiStart);
            }
        }
        
        download.blobRequest = handler.createBlobFromUrl(urlOrig, onLoadFileAsBlob);
    }
       
    // count elements
    // type = 'complete' - count ready downloaded items
    // type = 'wait'  - count in order to download items (elements at work not included)
    
    this.countCurrent = function(type) {
        
        if (!type) {
            type = 'wait';
        } 
        
        var count = 0;
        
        for (var i = 0; i <= downloads.length-1; ++i) { 
        
            if (getItemState(downloads[i]) != type) continue;
            count++;            
        }
        
        return count;
    }
    
    this.addDownloadWork = function() {
        
        if (mode != 'download') return false;
        
        var currentWork = handler.countCurrent('in_progress');        
        if (currentWork >= options.maxDownloadsAtTime) return false;
        
        var newWorkNum = options.maxDownloadsAtTime - currentWork;
        
        var addCancelTimer = function(downloadItem) {
            
            downloadItem.cancelTimer = setTimeout(function() {
                
                if (!downloadItem) return;
                
                resetItem(downloadItem);
                
                downloadItem.cancelTimer = false;            
                downloadItem.error = 'Canceled by timeout';	
                downloadItem.canceling = true;
                
                if (downloadItem.downloadId > 0) {                    
                    KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloadItem.downloadId}, function(response) {   
                        downloadItem.canceling = false;	
                        downloadItem.workedout = true;                        
                    });                
                }
                
                toTxtLog('CANCELED BY TIMEOUT ' + downloadItem.url + ', ' + downloadItem.filename);
                
            }, options.cancelTimer * 1000);
        }
        
        for (var i = options.from; i <= downloads.length - 1; i++) {
            
            if (getItemState(downloads[i]) != 'wait') continue;
            
            var downloadItem = downloads[i];
            
            downloadItem.downloadId = DOWNLOADID_GET_PROCESS;
            downloadItem.workedout = false;
            
            if (options.cancelTimer) {
                addCancelTimer(downloadItem);
            }
           
            newWorkNum--;
            
            handler.downloadByXMLHTTPRequest(downloads[i]);
            
            /*
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", download : {
            
                filename : baseFileFolder + downloads[i].filename, 
                url : downloads[i].url, 
                conflictAction : downloads[i].conflictAction,
                method : 'GET',
                //// 
                
                wasted :(
                 - > Unchecked runtime.lastError while running downloads.download Unsafe request header name
                 
                headers : [
                    {name : 'referer', value : 'http://URL'},
                ],
                /////
            }}, function(response) {});
            */
            
            if (newWorkNum <= 0) break;
        }               
    }
    
    function resetItem(downloadItem) {
        
        downloadItem.workedout = false;
        downloadItem.canceling = false;
        
        if (downloadItem.error) downloadItem.error = false;			
        if (downloadItem.downloadDelta) downloadItem.downloadDelta = false;
        
        downloadItem.downloadId = DOWNLOADID_INACTIVE;        
    }
    
    this.resetStates = function(keepReady) {
        
        if (!downloads.length) return false;
        
        for (var i=0; i <= downloads.length-1; ++i) {
            
            if (keepReady && getItemState(downloads[i]) == 'complete') {
                continue;
            } 
            
            resetItem(downloads[i]);
        }
        
    }
    
    this.download = function() {
        
        log = '';
        
        if (mode != 'wait') return false;
        
        if (!downloads.length) {
            console.log('work empty');
            return false;
        }
        
        acceptItems = false;
        var itemsListInput = KellyTools.getElementByClass(handler.container, className + '-itemsList');
        
        if (itemsListInput && itemsListInput.value) {
           acceptItems = KellyTools.getPrintValues(itemsListInput.value, false, 1, downloads.length);
           if (!acceptItems.length) {
                acceptItems = false;
           }
           
           console.log(acceptItems);
        }
        
        if (options.from <= 0) {
            options.from = 0;   
        } else if (options.from > downloads.length-1) {
            options.from = downloads.length-1;            
        }
                
        if (!options.interval) options.interval = 0.1;
               
        /*
        options.from = KellyTools.inputVal(className + '-from', 'int', handler.container) - 1;
        options.to = KellyTools.inputVal(className + '-to', 'int', handler.container) - 1;
       
        
        
        if (options.to <= 0 || options.to > downloads.length-1) {
            options.to = downloads.length-1;            
        }
        
        if (options.from > options.to) {
            options.from = 0;            
        }
        */
        
        assignEvents();
        
        handler.updateStartButtonState('stop');  
        
        handler.resetStates(true);
        handler.updateStateForImageGrid();
        
        handler.addDownloadWork();
        
        if (!handler.countCurrent('in_progress')) {
            
            mode = 'wait';
            handler.updateStartButtonState('start');            
            KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.keepAliveListener"}, function(response) {});                
        }
        
        updateProgressBar();
        log = 'Start download process...' + "\r\n";
        console.log(options);
        
        return true;
    }
    
 
    constructor(cfg);
}