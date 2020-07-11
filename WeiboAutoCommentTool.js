var weiboAutoCommentTool = (function(){
	var running = false;
	var defaultOption = {
		//评论间隔时间
		delay: 10000,
		//评论内容
		content: (function(){
			return "是这样的"
		})()
	};
	var needCommentIdList = [];
	var commentedIdList = [];
	var dateFormat = function (fmt,date){ 
		var o = {   
			"M+" : date.getMonth()+1,                 //月份   
			"d+" : date.getDate(),                    //日   
			"h+" : date.getHours(),                   //小时   
			"m+" : date.getMinutes(),                 //分   
			"s+" : date.getSeconds(),                 //秒   
			"q+" : Math.floor((date.getMonth()+3)/3), //季度   
			"S"  : date.getMilliseconds()             //毫秒   
		};   
		if(/(y+)/.test(fmt))   
			fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));   
		for(var k in o)   
			if(new RegExp("("+ k +")").test(fmt))   
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
		return fmt;   
	} 
	var logger = function(msg){
		console.log(dateFormat('yyyy-MM-dd hh:mm:ss', new Date()) + ": " + msg);
	};

	var commentButtonClicked = function (commentButton) {
    return commentButton.getAttribute('suda-data')
      .match(/key=(.*)&value=/)[1].indexOf("off") !== -1
  };

	var comment = function(id){
		console.log("----------------------------------------->");
		logger("Commenting " + id);
		var feedItem = document.querySelector('div[mid="' + id + '"]');
		var commentButton = feedItem.querySelector('a[action-type="feed_list_comment"]');
		//没有打开的话，模拟点击打开
		if(!commentButtonClicked(commentButton)) {
			commentButton.click();
			logger("Comment list is not loaded, start loading...");
		}
		logger("Waiting comment list loading...");
		//等待评论框出现
		setTimeout(function(){
			var textArea = feedItem.querySelector('textarea[action-type="check"]');
			textArea.value = defaultOption.content;
			
			var sendButton = feedItem.querySelector('.s-btn-a');
			sendButton.click();
			logger("Sending comment content completed.");
			
			//折叠起来
			commentButton.click();
			commentedIdList.push(id);
			console.log("<-----------------------------------------");
		}, 3000);
	};
	var commentThread = function(){
		logger("Comment thread started.");
		
		var innerAction = function(){
			var id = needCommentIdList.shift();
			if(id) {
				comment(id);
			} else {
				logger("WARNING: No feed to process...");
			}
			setTimeout(function(){
				if(!running) {
					logger("Comment thread action stoped, exit.");
					return;
				}
				innerAction();
			}, defaultOption.delay);
		};
		innerAction();
	};
	var isThisItemCommented = function(id){
		return needCommentIdList.indexOf(id) >= 0;
	};
	var getAllFeedIds = function(){
		return [...document.querySelectorAll('#pl_feedlist_index .card-wrap')]
      .map(c => c.getAttribute('mid'))
      .filter(id => id !== null && !isThisItemCommented(id));
	};
	var commentAction = function(){
		if(!running) {
			logger("Comment action stoped, exit.");
			return;
		}
		var allFeeds = getAllFeedIds();
		//如果没有记录了，则需要滚动屏幕
		if(!allFeeds.length) {
			document.body.scrollTop = document.body.scrollTop + 500;
			//然后再获取一次
			allFeeds = getAllFeedIds();
		}
		for(var item in allFeeds) {
			var id = allFeeds[item];
			if(id){
				needCommentIdList.push(id);
			}
		}
		setTimeout(function(){
			commentAction();
		}, 20 * 1000);
	};
	this.start = function(op){
		needCommentIdList = [];
		commentedIdList = [];
		logger("WeiboAutoCommentTool start running...");
		if(typeof(op) !== "undefined") {
			defaultOption.delay = op.delay || defaultOption.delay;
			defaultOption.content = op.content || defaultOption.content;
			
			logger("Use option: " + JSON.stringify(defaultOption));
		} else {
			logger("Use default option: " + JSON.stringify(defaultOption));
		}
		
		logger("WeiboAutoCommentTool running now.");
		running = true;
		commentAction();
		commentThread();
	};	
	this.stop = function(){
		running = false;
		needCommentIdList = [];
		logger("User stoped");
	};	
	this.stat = function(){
		logger("Comment queue: ");
		console.log(needCommentIdList);
		logger("Commented list: ");
		console.log(commentedIdList);
		logger("STAT: Pending comment " + needCommentIdList.length + ", Total commented " + commentedIdList.length);
	};	
	return this;
})();