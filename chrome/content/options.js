
var siteReferrerOptions = function() {
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	
	var pref_ = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService)
		.getBranch("extensions.sitereferrer.");
	
	var sitesListBox_;
	var sites_ = pref_.getCharPref("sites");
	
	// サイト情報が同じものか判定
	function isSameSite(site1, site2) {
		return (site1.type == site2.type) && (site1.pattern == site2.pattern);
	}
	
	// 既に同じサイト情報がないか探索する
	function findSite(site) {
		for(var i = 0; i < sites_.length; ++i) {
			if( isSameSite(sites_[i], site) )
				return i;
		}
		
		return -1;
	}
	
	// サイト情報からListに表示する項目を生成する
	function createListItemFromSite(site) {
		
	}
	
	// サイト情報を追加
	function addSite(site) {
		sites_.push(site);
		
		sitesListBox_.appendItem();
	}
	
	return {
		onLoad: function() {
			sitesListBox_ = document.getElementById("sitereferrer-sites-listbox");
		},
	};
}();

window.addEventListener("load", siteReferrerOptions.onLoad, false);
