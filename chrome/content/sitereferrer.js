
var siteReferrer = function() {
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	
	var pref_ = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService)
		.getBranch("extensions.sitereferrer.");
	
	var observerServ_ = Cc["@mozilla.org/observer-service;1"]
		.getService(Ci.nsIObserverService);
	
	var app_ = Cc["@mozilla.org/fuel/application;1"]
		.getService(Ci.fuelIApplication);
	
	function onModifyRequest() {
		
	}
	
	// HTTPリクエストの生成時にリファラを変更する
	function modifyRequest(httpChannel) {
		app_.console.log("referrer=" + httpChannel.referrer ? httpChannel.referrer.path : "none");
	}
	
	var observer_ = {
		observe: function(aSubject, aTopic, aData) {
			switch( aTopic ) {
			case "http-on-modify-request":
				aSubject.QueryInterface(Ci.nsIHttpChannel);
				modifyRequest(aSubject);
				break;
			case "nsPref:changed":
				break;
			}
		},
	};
	
	return {
		onLoad: function() {
			observerServ_.addObserver(observer_, "http-on-modify-request", false);
		},
		
		onUnload: function() {
			observerServ_.removeObserver(observer_, "http-on-modify-request");
		},
	};
}();

window.addEventListener("load", siteReferrer.onLoad, false);
window.addEventListener("unload", siteReferrer.onUnload, false);
