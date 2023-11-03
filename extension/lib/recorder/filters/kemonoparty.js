KellyRecorderFilterKemono = new Object();
KellyRecorderFilterKemono.manifest = {host : ['kemono.su', 'coomer.su'], detectionLvl : ['imagePreview', 'imageOriginal', 'imageByDocument']};

KellyRecorderFilterKemono.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('kemono.su') == -1 && handler.url.indexOf('coomer.su') == -1 && data.thread.response) return;
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(data.thread.response, 'text/html');
    
    var images = doc.querySelectorAll('.fileThumb');
    for (var i = 0; i < images.length; i++) {
        var href = KellyTools.getLocationFromUrl(images[i].href).pathname;
        if (href && href.indexOf('/data/') === 0) handler.imagesPool.push({relatedSrc : ['https://' + handler.hostname + href]});
    }

    data.thread.response = ''; 
    return true;
}    
 
KellyRecorderFilterKemono.onStartRecord = function(handler, data) {
     if (handler.url.indexOf('kemono.su') == -1) return;
     handler.allowDuplicates = true;
}

KellyPageWatchdog.validators.push({
    url : 'kemono.su', 
    host : 'kemono.su', 
    patterns : [['/thumbnail/', 'imagePreview']]
});

KellyPageWatchdog.validators.push({
    url : 'coomer.su', 
    host : 'coomer.su', 
    patterns : [['/thumbnail/', 'imagePreview']]
});

KellyPageWatchdog.filters.push(KellyRecorderFilterKemono);
