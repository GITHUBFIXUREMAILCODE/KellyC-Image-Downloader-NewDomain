KellyRecorderFilterDA = new Object();
KellyRecorderFilterDA.manifest = {host : 'deviantart.com', detectionLvl : ['imageAny', 'imageByDocument']};
KellyRecorderFilterDA.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('deviantart') != -1) {
        
        try {
                
            var begin = 'window.__INITIAL_STATE__ = JSON.parse("', end = '")';
            var da = JSON.parse(JSON.parse('"' + data.thread.response.substring( data.thread.response.lastIndexOf(begin) + begin.length, data.thread.response.lastIndexOf(end)) + '"')); 
            
            for (var daName in da['@@entities']['deviation'])  {
                var deviation =  da['@@entities']['deviation'][daName], mediaQuality = false;                   
                if (data.thread.job.url.indexOf(deviation.url) == -1) continue;
                
                deviation['media']['types'].forEach(function(type) {
                    if ((!mediaQuality || type.h > mediaQuality.h) && (type.c || type.t == 'gif')) mediaQuality = type;
                });
                
                var url = '', baseUrl = deviation['media']['baseUri'];
                if (baseUrl[baseUrl.length-1] == '/') baseUrl = baseUrl.substr(0, baseUrl.length-1); // double delimiter simbol / is not allowed
                
                if (mediaQuality && mediaQuality.c) {
                         
                         url = mediaQuality.c.replace('<prettyName>', deviation['media']['prettyName'] ? deviation['media']['prettyName'] : '');
                         
                         if (url[0] != '/') url = '/' + url;
                         url = baseUrl + url;
                         
                } else if (mediaQuality && mediaQuality.t == 'gif') url = mediaQuality.b;
                
                if (url) handler.imagesPool.push({relatedSrc : [url + '?token=' + deviation['media']['token'][0]]});
            }
            
       } catch (e) {
            console.log(e);
       }
           
       data.thread.response = ''; 
       return true;
    }
}

KellyPageWatchdog.validators.push({url : 'deviantart', patterns : [['images-wixmp', 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterDA);