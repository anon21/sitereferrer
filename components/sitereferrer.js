
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function LOG(msg) {
	var consoleServ = Components.classes["@mozilla.org/consoleservice;1"]
		.getService(Components.interfaces.nsIConsoleService);
	
	consoleServ.logStringMessage("sitereferrer: " + msg);
}

function siteReferrerComponent() {
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	
	var pref_ = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService)
		.getBranch("extensions.sitereferrer.");
	
	var observerServ_ = Cc["@mozilla.org/observer-service;1"]
		.getService(Ci.nsIObserverService);
	
	var defaultBehavior_;
	var normalSitePat_;
	var blockSitePat_;
	var forgeSitePat_;
	
	// 正規表現のメタ文字をエスケープする
	function metaCharEscape(str) {
		return str.replace(/[.*+?\\()\[\]{}]/g, function(m) {
				return "\\" + m;
			});
	}
	
	// サイト設定から正規表現に変換する
	function siteToPattern(site) {
		var patStr;
		
		switch( site.type ) {
		case 0: // ホスト名
			patStr = "^.*?://.*?" + metaCharEscape(site.pattern) + "(/|$)";
			break;
		case 1: // ワイルドカード
			patStr = metaCharEscape(site.pattern.replace("*", ".*").replace("?", "."));
			break;
		case 2: // 正規表現
			patStr = site.pattern;
			break;
		default:
			return null;
		}
		
		try {
			var r = new RegExp(patStr);
			return patStr;
		} catch(e) {
			return null;
		}
	}
	
	// 登録されたサイトとマッチするか判定するための正規表現を生成する
	function makePatterns(sites) {
		var normalSitePatStr = "";
		var blockSitePatStr = "";
		var forgeSitePatStr = "";
		var patStr;
		
		for(var i = 0; i < sites.length; ++i) {
			patStr = siteToPattern(sites[i]);
			
			if( patStr ) {
				switch( sites[i].behavior ) {
				case 0: // 通常の動作
					normalSitePatStr += "|(" + patStr + ")";
					break;
				case 1: // ブロック
					blockSitePatStr += "|(" + patStr + ")";
					break;
				case 2: // 偽装
					forgeSitePatStr += "|(" + patStr + ")";
					break;
				}
			}
		}
		
		LOG("normalSitePat_=" + normalSitePatStr.substr(1));
		LOG("blockSitePat_=" + blockSitePatStr.substr(1));
		LOG("forgeSitePat_=" + forgeSitePatStr.substr(1));
		
		try {
			normalSitePat_ = new RegExp(normalSitePatStr.substr(1));
			blockSitePat_ = new RegExp(blockSitePatStr.substr(1));
			forgeSitePat_ = new RegExp(forgeSitePatStr.substr(1));
		} catch(e) {
			
		}
	}
	
	// preference読み込み
	defaultBehavior_ = pref_.getIntPref("defaultBehavior");
	makePatterns(JSON.parse(pref_.getCharPref("sites")));
	
	// preferenceの変更を監視
	var prefObserver_ = {
		observe: function(aSubject, aTopic, aData) {
			if( aTopic == "nsPref:changed" ) {
				switch( aData ) {
				case "defaultBehavior":
					defaultBehavior_ = pref_.getCharPref("defaultBehavior");
					break;
				case "sites":
					makePatterns(JSON.parse(pref_.getCharPref("sites")));
					break;
				}
			}
		},
	};
	
	pref_.QueryInterface(Ci.nsIPrefBranch2);
	pref_.addObserver("", prefObserver_, false);
	pref_.QueryInterface(Ci.nsIPrefBranch);
	
	// HTTPリクエストの生成時にリファラを変更する
	function modifyRequest(httpChannel) {
		// 登録サイトにマッチするかチェック
		var channel = httpChannel;
		channel.QueryInterface(Ci.nsIChannel);
		
		var uriSpec = channel.URI.spec;
		var behavior;
		
		if( uriSpec.match(normalSitePat_) ) {
			behavior = 0; // 通常の動作(何もしない)
		} else if( uriSpec.match(blockSitePat_) ) {
			behavior = 1; // リファラを遮断
		} else if( uriSpec.match(forgePat_) ) {
			behavior = 2; // リファラを偽装
		} else {
			behavior = defaultBehavior_; // デフォルトの動作
		}
		
		switch( behavior ) {
		case 1: // リファラを遮断
			//httpChannel.setRequestHeader("Referrer", , false);
			LOG("Block " + uriSpec);
			break;
		case 2: // リファラを偽装
			//httpChannel.setRequestHeader("Referrer", , false);
			LOG("Forge " + uriSpec);
			break;
		}
	}
	
	// HTTPリクエストを監視
	var requestObserver_ = {
		observe: function(aSubject, aTopic, aData) {
			if( aTopic == "http-on-modify-request" ) {
				aSubject.QueryInterface(Ci.nsIHttpChannel);
				modifyRequest(aSubject);
			}
		},
	};
	
	observerServ_.addObserver(requestObserver_, "http-on-modify-request", false);
}

siteReferrerComponent.prototype = {
	// properties required for XPCOM registration
	classID: Components.ID("{ce4dd6ab-f9fb-4132-8f72-af90bb1be9e6}"),
	
	// QueryInterface implementation
	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsISiteReferrerComponent]),
};

const NSGetFactory = XPCOMUtils.generateNSGetFactory([ siteReferrerComponent ]);
