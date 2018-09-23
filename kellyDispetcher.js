// only background extensions has access to download API, so we create one

var KellyEventsDispetcher = new Object;
	KellyEventsDispetcher.tabList = {};
	KellyEventsDispetcher.eventsAccepted = false;

	KellyEventsDispetcher.subscribeTab = function (tabId, event) {

		if (typeof this.tabList[event] == 'undefined') this.tabList[event] = [];

		if (this.tabList[event].indexOf(tabId) == -1) this.tabList[event].push(tabId);
		
		return tabId;
	}
    
	KellyEventsDispetcher.init = function() {
	
		if (this.eventsAccepted) return true;
		
		KellyTools.getBrowser().runtime.onMessage.addListener(this.onMessage);
	
		return true;
	}
	
	KellyEventsDispetcher.onMessage = function(request, sender, sendResponse) {
			
		console.log(request);    
		console.log(sender.tab ?
					"from a content script:" + sender.tab.url :
					"from the extension");

		var response = {
			
			senderId : 'dispetcher',
			error : '',
			method : request.method,
			
		}
			
			   if (request.method == 'downloads.cancel') {        
					
			getBrowser().downloads.cancel(request.downloadId);
					
		} else if (request.method == 'downloads.download') {
		
			var operationId = request.operationId;
			subscribeTab(sender.tab.id, 'download');
		
			getBrowser().downloads.download(request.download, function (downloadId) {
				
				if (operationId == -1) return;
				
				for (var i=0; i <= tabList['download'].length-1; ++i) {
					getBrowser().tabs.sendMessage(tabList['download'][i], {method: "setDownloadIdByOperationId", downloadId : downloadId, operationId : operationId}, function(response) {});
				}
				
			});
			
			if (request.blob) {
				URL.revokeObjectURL(request.download.url);
			}
			
			/* for Firefox posibly
			var onStartedDownload = function(id) {
				console.log('Started downloading: ' + id);
			}

			var onFailed = function(error) {
			  console.log('Download failed: ' + error);
			}  
			
			downloading.then(onStartedDownload, onFailed);      
		
			*/
			
		} else if (request.method == "onChanged.addListener") {
		
			subscribeTab(sender.tab.id, 'onChanged');
			
			// unstable in chrome, to do replace by check state in 
			// chrome.downloads.search({id : downloadId}, function(array of DownloadItem results) {...}) 
			
			// диспетчер один - табов много
			// если в табе 1 инициализировать скачивалку, потом в табе 2 инициировать еще одну, то в табе 1 скачивалка потеряет событие getBrowser().downloads.onChanged возможно из за того что перезапишется
			// sender, а событие уже повешено. 
			
			getBrowser().downloads.onChanged.addListener(
				function(downloadDelta) {
					  
					for (var i=0; i <= tabList['onChanged'].length-1; ++i) {
						getBrowser().tabs.sendMessage(tabList['onChanged'][i], {method: "onChanged", downloadDelta : downloadDelta}, function(response) {});
					}
				}
			);
			
		} else if (request.method == "getLocalStorage") {
		
			
		
		}   

		sendResponse(response);
		
	}
	
	