KellyTools = new Object();

// Get screen width \ height

KellyTools.getViewport = function() {

    var elem = (document.compatMode === "CSS1Compat") ? 
        document.documentElement :
        document.body;

    var height = elem.clientHeight;
    var width = elem.clientWidth;	

    return {
        scrollBottom: KellyTools.getScrollTop() + height, // scroll + viewport height
        screenHeight: height,
        screenWidth: width,
    };
}

KellyTools.replaceAll = function(str, search, replacement) {
    return str.split(search).join(replacement);
}

KellyTools.getScrollTop = function() {

    var scrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
    return scrollTop;
}

KellyTools.getScrollLeft = function() {

    var scrollLeft = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
    return scrollLeft;
}

// validate input string

KellyTools.val = function(value, type) {
    
    value = value.trim();
    
    if (!type) type = 'string';
    
    if (type == 'string') {
        if (!value) return '';
        return value.substring(0, 255);
    } else if (type == 'int') {
        if (!value) return 0;
        return parseInt(value);
    } else if (type == 'float') {
        if (!value) return 0.0;
        return parseFloat(value);
    } else if (type == 'bool') {
        return value ? true : false;
    } else if (type == 'longtext') {
        if (!value) return '';
        return value.substring(0, 65400);
    }
}

KellyTools.inputVal = function(el, type, parent) {
    
    var value = ''; 
    
    if (typeof el == 'string') {
        if (!parent) parent = document;
        el = KellyTools.getElementByClass(parent, el);
    }
    
    if (el) value = el.value;    
    return KellyTools.val(value, type);
}

KellyTools.fitText = function(parent, textEl, noExtHeight) {
    
    var bounds = textEl.getBoundingClientRect();
    var parentBounds = parent.getBoundingClientRect();

    if (parentBounds.width >= bounds.width && parentBounds.height >= bounds.height) {
        return;
    }    
      
    var textStyle = window.getComputedStyle(textEl);
    var defaultFontSize = parseInt(textStyle.fontSize);
    var fontSize = defaultFontSize;
    
    if (!fontSize) return;
    
    while (fontSize > 10 && (parentBounds.width < bounds.width || parentBounds.height < bounds.height)) {
        fontSize--;        
        textEl.style.fontSize = fontSize + 'px'; 
        bounds = textEl.getBoundingClientRect();        
    }   
    
    if (!noExtHeight && parentBounds.height < bounds.height) {
        
        var defaultLineHeight = parseInt(textStyle.lineHeight);
        var redusedLineHeight = Math.round((defaultLineHeight / 100) * 66);
        
        parent.style.height = Math.round(bounds.height) + 'px';
        parent.style.lineHeight = redusedLineHeight + 'px';
    }
}

KellyTools.getChildByTag = function(el, tag) {
    if (!el) return false;
    
    var childNodes = el.getElementsByTagName(tag);
    
    if (!childNodes || !childNodes.length) return false;
    
    return childNodes[0];
}

KellyTools.getElementByTag = function (el, tag) {
    return KellyTools.getChildByTag(el, tag);
}

KellyTools.getParentByTag = function(el, tagName) {
    var parent = el;
    if (!tagName) return false;
    
    tagName = tagName.toLowerCase();
    
    while (parent && parent.tagName.toLowerCase() != tagName) {
        parent = parent.parentElement;
    }  
    
    return parent;
}

KellyTools.getUrlFileName = function(url, excludeExt) {
    if (!url) return '';
    
    url = url.split("?");
    url = url[0];
    
    if (!url) return '';
    
    url = url.substring(url.lastIndexOf('/')+1);    
    
    if (url.indexOf('%') != -1) {
        url = decodeURIComponent(url);
    } 
    
    if (excludeExt && url.indexOf('.') != -1) {       
        url = url.substr(0, url.indexOf('.'));
    }
    
    return url;
}

KellyTools.getUrlExtension = function(url) {
             
    url = url.split("?");
    url = url[0];

    var ext = url.substr(url.length - 5).split(".");
    if (ext.length < 2) return '';

    ext = ext[1];
    return ext;        
}
    
// unused end

KellyTools.getUrlParam = function(param, url) {
    if (!url) url = location.search;
    
    var paramIndex = url.indexOf(param + "=");
    var paramValue = '';
    if (paramIndex != -1) {
        paramValue = url.substr(paramIndex).split('=');
        if (paramValue.length >= 2) {
            paramValue = paramValue[1].split('&')[0];
        }
    }
    
    return paramValue.trim();
}

// turn this - '2, 4, 66-99, 44, 78, 8-9, 29-77' to an array of all values [2, 4, 66, 67, 68 ... etc] in range

KellyTools.getPrintValues = function(print, reverse, limitFrom, limitTo) {

    var itemsToSelect = [];
    var options = print.split(',');
    
    for (var i = 0; i < options.length; i++) {

        var option = options[i].trim().split('-');
        if (!option.length || !option[0]) continue;
        if (option.length <= 1) option[1] = -1;
        

        option[0] = parseInt(option[0]);
        if (!option[0]) option[0] = 0;
        
        if (option[1]) {
            option[1] = parseInt(option[1]);
            if (!option[1]) option[1] = option[0];
        }

        if (option[0] == option[1]) option[1] = -1;

        if (option[1] !== -1) {

            if (option[1] < option[0]) {
                var switchOp = option[0];
                option[0] = option[1];
                option[1] = switchOp;
            }

            for (var b = option[0]; b <= option[1]; b++) {
                if (typeof limitTo != 'undefined' && b > limitTo) continue;
                if (typeof limitFrom != 'undefined' && b < limitFrom) continue;
                if (itemsToSelect.indexOf(b) == -1) itemsToSelect[itemsToSelect.length] = b;
            }

        } else {
            if (typeof limitTo != 'undefined' && option[0] > limitTo) continue; 
            if (typeof limitFrom != 'undefined' && option[0] < limitFrom) continue;            
            if (itemsToSelect.indexOf(option[0]) == -1) itemsToSelect[itemsToSelect.length] = option[0];
        }

    }
    
    if (!reverse) {
        itemsToSelect.sort(function(a, b) {
          return a - b;
        });
    } else {
        itemsToSelect.sort(function(a, b) {
          return b - a;
        });
    }
    
    return itemsToSelect;
}


KellyTools.getVarList = function(str) {
    str = str.trim();
    
    if (!str) return [];
    
    str = str.split(",");
    
    for (var i=0; i <= str.length-1; i++) {
        var tmp = str[i].trim();
        if (tmp) str[i] = tmp;
    }
    
    return str;
}
    
KellyTools.varListToStr = function(varlist) {
    if (!varlist || !varlist.length) return '';
    var str = '';        
    for (var i=0; i <= varlist.length-1; i++) {
    
        if (!varlist[i]) continue;
    
        if (str) str += ',' + varlist[i];
        else str = varlist[i];
    }
    
    return str;
}
    
KellyTools.parseTagsList = function(text) {
    var text = text.split(','); 
    
    var tagList = {
        exclude : [],
        include : [],
    }
        
    for (var i = 0; i < text.length; i++) {
        var tagName = text[i].trim();        
        
        var exclude = false;
        if (tagName.charAt(0) == '-') {
            exclude = true;
        }
        
        if (tagName.charAt(0) == '-' || tagName.charAt(0) == '+') {
            tagName = tagName.substr(1);
        } 
        
        if (!tagName) {
            continue;
        }
        
        if (exclude) {
            tagList.exclude[tagList.exclude.length] = tagName;
        } else {
            tagList.include[tagList.include.length] = tagName;
        }
    }
    
    var getUniq = function(arr) {
            
        var uniq = [];

        for (var i=0; i < arr.length; i++) {
            if (uniq.indexOf(arr[i]) == -1) {
                uniq.push(arr[i]);
            }
        }
        
        return uniq;
    }
    
    if (tagList.exclude.length > 1) {
        tagList.exclude = getUniq(tagList.exclude);
    }
    
    if (tagList.include.length > 1) {
        tagList.include = getUniq(tagList.include);
    }
    
    if (!tagList.exclude.length && !tagList.include.length) return false;
    
    return tagList;
}

KellyTools.validateFloatSting = function(val) {

    if (!val) return 0.0;
    
    val = val.trim();
    val = val.replace(',', '.');
    val = parseFloat(val);
    
    if (!val) return 0.0;
    
    return val;    
}

// bring string to regular expression match template like /sdfsdf/sf/sd/fs/f/test.ttt 

KellyTools.folderPatchToRegularExpression = function(folder) {
    
    if (!folder) return '';
    folder = folder.trim();
    
    if (!folder) return '';
    // [\\(] [\\)]

    folder = KellyTools.replaceAll(folder, '\\(', '__CCCC__');    
    folder = KellyTools.replaceAll(folder, '\\)', '__DDDD__');
    folder = KellyTools.replaceAll(folder, '\\\\', '/');
    folder = KellyTools.replaceAll(folder, '\\\\', '(\\\\\\\\|/)');
    folder = KellyTools.replaceAll(folder, '/', '(\\\\\\\\|/)');
    folder = KellyTools.replaceAll(folder, '__CCCC__', '[\(]');    
    folder = KellyTools.replaceAll(folder, '__DDDD__', '[\)]');
    
    // todo check special characters 
    
    return folder;
}

// input - any string that suppose to be file path or directory -> output - dir/dir2/dir3/file.ext, dir/dir2, dir/dir2/dir3 ...

KellyTools.validateFolderPath = function(folder) {

    if (!folder) return '';
    folder = folder.trim();
    
    if (!folder) return '';
    folder = KellyTools.replaceAll(folder, '\\\\', '/');
    
    var tmpFolder = '';
    for (var i=0; i <= folder.length-1; ++i) {
        if (i == 0 && folder[i] == '/') {
             continue;
        }
        
        if (i == folder.length-1 && folder[i] == '/') {
            continue;
        }
        
        if (folder[i] == '/' && tmpFolder[tmpFolder.length-1] == '/') {
            continue;
        }
        
        if (folder[i] == '/' && tmpFolder.length == 0) continue;
        

        tmpFolder += folder[i];
        
    }
    
    if (tmpFolder[tmpFolder.length-1] == '/') {
        tmpFolder = tmpFolder.slice(0, -1); 
    }

    return tmpFolder;
}

KellyTools.getBrowser = function() {
    
    // chrome - Opera \ Chrome, browser - Firefox
    
    if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') { // Edge has this object, but runtime is undefined
        return chrome;
    } else if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
        return browser;
    } else {
        console.log('browser not suppot runtime API method');
        return false;
    }
}

KellyTools.getExt = function(str, limit) {
    
    var dot = str.lastIndexOf('.');
    
    if (dot === -1) return false;
    
    var ext =  str.substr(dot).split(".");
    if (ext.length < 2) return false;
    
    ext = ext[1];
    
    if (!limit) limit = 5;
    if (ext.length > limit) return false;
    if (ext.indexOf('/') !== -1) return false;
    
    return ext;
}

KellyTools.log = function(info, module) {
    
    if (!module) module = 'Kelly';
    
    if (typeof info == 'object' || typeof info == 'function') {
        console.log('[' + KellyTools.getTime() + '] ' + module + ' :  var output :');
        console.log(info);
    } else {
        console.log('[' + KellyTools.getTime() + '] ' + module + ' : '+ info);
    }
}

// 01:12

KellyTools.getTime = function() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    
    if (minutes < 10){
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
}

// 2018_09_09__085827

KellyTools.getTimeStamp = function() {
    date = new Date();
    date = date.getUTCFullYear() + '_' +
        ('00' + (date.getUTCMonth()+1)).slice(-2) + '_' +
        ('00' + date.getUTCDate()).slice(-2) + '__' + 
        ('00' + date.getUTCHours()).slice(-2) + '' + 
        ('00' + date.getUTCMinutes()).slice(-2) + '' + 
        ('00' + date.getUTCSeconds()).slice(-2);
    
    return date;
}

// 2018-09-09 08:58:27

KellyTools.getGMTDate = function() {
    return new Date().toJSON().slice(0, 19).replace('T', ' ');
}

KellyTools.createAndDownloadFile = function(data, filename, mimetype) {

    if (!data) return false;
    if (!KellyTools.getBrowser()) return false;
    
    var ext = KellyTools.getExt(filename);
    if (!ext) ext = 'txt';
    
    if (!mimetype) {
        mimetype = 'application/x-' + ext;
        
        // MIME type list http://webdesign.about.com/od/multimedia/a/mime-types-by-content-type.htm
        
             if (ext == 'jpg' || ext == 'jpeg') mimetype = 'image/jpeg';
        else if (ext == 'png' ) mimetype = 'image/png';
        else if (ext == 'gif' ) mimetype = 'image/gif';
        else if (ext == 'zip' ) mimetype = 'application/zip';
        else if (ext == 'txt' ) mimetype = 'text/plain';
        else if (ext == 'json' ) mimetype = 'application/json';
    }
    
    if (filename.indexOf('.') == -1) filename += '.' + ext;
    

    var blobData = new Blob([data], {type : mimetype});
    
    var downloadOptions = {
        filename : filename, 
        conflictAction : 'uniquify',
        method : 'GET',
    }

    downloadOptions.url = URL.createObjectURL(blobData);  
    
    KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", blob : true, download : downloadOptions}, function(response){});             

    return true;
}

KellyTools.getParentByClass = function(el, className) {
    var parent = el;
 
    while (parent && parent.className != className) {
        parent = parent.parentElement;
    }  
    
    return parent;
}

// read local file
// untested in dataurl mode - suppose get binary data - such as png image
// try - btoa(unescape(encodeURIComponent(rawData))) to store local as base64:image

KellyTools.readFile = function(input, onRead, readAs) {
    
    if (!input) return false;
    
     var file = input.files[0];
 
    if (file) {
    
      var fileReader = new FileReader();
          fileReader.onloadend = function (e) {
                if (onRead) onRead(input, e.target.result);
          };
          
        if (readAs == 'dataurl') {
            
            fileReader.readAsDataURL(file);
        } else {
            fileReader.readAsText(file)
        }
        return true;
    } else return false;
}	

// return onLoad only on succesful load data, onFail - any problems during load, or bad response status (only 200 - OK accepted)

KellyTools.readUrl = function(url, onLoad, onFail, method, async) {

    if (!method) method = 'GET';
    if (typeof async == 'undefined') async = true;

    var request = new XMLHttpRequest();
        request.open(method, url, async);

        request.onload = function() {
          if (this.status == 200) {
             onLoad(this.response, url);
          } else {
             onFail(url, this.status, this.statusText);
          }
        };

        request.onerror = function() {
           onFail(url, -1);
        };

        request.send();
}

KellyTools.getRelativeUrl = function(str) {
    
    if ( typeof str !== 'string') return '/';

    str = str.trim();
    
    if (!str.length) return '/';
    
    if (str[str.length-1] != '/') str += '/';
    
    if (str.indexOf('http') != -1 || str.substring(0, 2) == '//') {
        str = str.replace(/^(?:\/\/|[^\/]+)*\//, "");
    }

    if (!str.length) str = '/';

    if (str[0] != '/') {
        str = '/' + str;
    }
    
    return str;
}
    
KellyTools.getElementByClass = function(parent, className) {
        
    if (parent === false) parent = document.body;
    
    if (typeof parent !== 'object') {
     
        
        console.log('unexpected type - ' + typeof parent);
        console.log(parent);
        return false;
    }
    
    if (!parent) return false;
    
    var childNodes = parent.getElementsByClassName(className);
    
    if (!childNodes || !childNodes.length) return false;
    
    return childNodes[0];
}

KellyTools.parseJSON = function(json) {
    
    var data = false;
    
    if (json) {
        try {
            data = window.JSON && window.JSON.parse ? JSON.parse(json) : eval('(' + json + ')');
        } catch (E) {
            KellyTools.log('fail to load json data : ' + json, 'KellyTools');            
        }
    } else {
        KellyTools.log('empty json', 'KellyTools');
    } 

    return data;
}

// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript

KellyTools.replaceAll = function(text, search, replace) {
    return text.replace(new RegExp(search, 'g'), replace);
}

KellyTools.dispatchEvent = function(target, name) {
    
    if (!target) return;
    if (!name) name = 'click';
    if(typeof(Event) === 'function') {
        
        var event = false;
        
        try {
            
            event = new Event(name, {bubbles: true, cancelable: true});
          
        } catch(e){

            event = document.createEvent('Event');
            event.initEvent(name, true, false);
        }
                
    } else {
        
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
    }

    var bn = target.getBoundingClientRect();

    event.clientX = Math.round(bn.left + KellyTools.getScrollLeft() + bn.width / 2);
    event.clientY = Math.round(bn.top + KellyTools.getScrollTop() + bn.height / 2);

    target.dispatchEvent(event);
}

// params - paginationContainer, curPage, onGoTo, classPrefix, pageItemsNum, itemsNum, perPage

KellyTools.showPagination = function(params) {
    
    if (!params) {
        return false;	
    }
        
    if (!params.container) return false;
    if (!params.classPrefix) {
        params.classPrefix = 'KellyTools';
    }
    
    if (!params.itemsNum) params.itemsNum = 0;
    if (!params.perPage) params.perPage = 50;
    
    params.container.innerHTML = '';
    
    if (!params.itemsNum) return;
    
    var totalPages = Math.ceil(params.itemsNum / params.perPage);

    if (totalPages <= 1) return;
    
    var page = params.curPage ? params.curPage : 1;
    var pageListItemsNum = params.pageItemsNum ? params.pageItemsNum : 4; // maximum number of page buttons
    var pageStart = 1; // rendered button start

    pageStart = page - Math.ceil(pageListItemsNum / 2);       
    if (pageStart < 1) pageStart = 1; 
    
    var pageEnd = pageStart + pageListItemsNum - 1; // rendered button end
    if (pageListItemsNum > totalPages) pageEnd = totalPages;
    
    if (pageEnd <= 1) pageEnd = totalPages;
    if (pageEnd > totalPages) pageEnd = totalPages;
    
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    
    var goToFunction = function() {
        if (params.onGoTo) params.onGoTo(this.getAttribute('pageNum'));
        return false;
    }
    
    var goToPreviuse = document.createElement('a');
        goToPreviuse.href = '#';
        goToPreviuse.setAttribute('pageNum', 'previuse');
        goToPreviuse.innerHTML = '<';
        goToPreviuse.className = params.classPrefix + '-item';
        goToPreviuse.onclick = goToFunction;
             
    if (pageStart > 1) {
        var goToBegin = goToPreviuse.cloneNode(true);
        goToBegin.setAttribute('pageNum', '1');
        goToBegin.onclick = goToFunction;
        goToBegin.innerHTML = '<<';
        
        params.container.appendChild(goToBegin); 
    }
    
    if (pageStart > 1) { 
        params.container.appendChild(goToPreviuse); 
    }
          
    for (var pageNum = pageStart; pageNum <= pageEnd; pageNum++) {
         var pageEl = document.createElement('a');
             pageEl.href = '#';
             pageEl.innerHTML = pageNum;
             pageEl.className = params.classPrefix + '-item';
             if (pageNum >= 100) pageEl.className += ' ' + params.classPrefix + '-item-100';
             
             pageEl.setAttribute('pageNum', pageNum);
             
        if (page == pageNum) pageEl.className += ' active';
            
            pageEl.onclick = goToFunction;                
            params.container.appendChild(pageEl);
    }

    var goToNext = document.createElement('a');
        goToNext.href = '#';
        goToNext.setAttribute('pageNum', 'next');
        goToNext.className = params.classPrefix + '-item';
        goToNext.innerHTML = '>';
        goToNext.onclick = goToFunction;
        
    if (pageEnd < totalPages) { 
        params.container.appendChild(goToNext);
    }
    
    if (pageEnd < totalPages) {
        var goToEnd = goToPreviuse.cloneNode(true);
        goToEnd.setAttribute('pageNum', totalPages);            
        goToEnd.onclick = goToFunction;
        goToEnd.innerHTML = '>>';
        
        params.container.appendChild(goToEnd); 
    }
    
    if (totalPages > pageListItemsNum) {
    
        if (page < totalPages - 1) {
            // go to end
        }
        
        if (page > 1) {
            // go to begin
        }
    }
    
    return params.container;
}
    