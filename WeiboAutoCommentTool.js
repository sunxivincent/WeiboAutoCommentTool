var weiboAutoCommentTool = (function(){
	var running = false;
	var runningInterval = false;
	var commentNumber = 0;
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

  var isThisItemCommented = function(id){
    return commentedIdList.indexOf(id) !== -1;
  };

  var getAllFeedIds = function(){
    return [...document.querySelectorAll('#pl_feedlist_index .card-wrap')]
      .map(c => c.getAttribute('mid'))
      .filter(id => id !== null && !isThisItemCommented(id));
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
      if(!runningInterval) {
        logger("forcefully stopped commentThread due to stop task");
        return;
      }
      if(!running) {
        logger("stopped commentThread due to reaching quota");
        return;
      }
			var id = needCommentIdList.shift();

      // avoid being throttled
			if(id && commentNumber < 14) {
				comment(id);
				commentNumber ++;
			} else if (!id) {
				logger("WARNING: No feed to process...");
			} else {
			  running = false;
      }
			setTimeout(function(){
				innerAction();
			}, defaultOption.delay);
		};
		innerAction();
	};
	var commentAction = function(){
		if(!running) {
      logger("stopped commentAction due to reaching quota");
			return;
		}
    if(!runningInterval) {
      logger("forcefully stopped commentAction due to stop task");
      return;
    }
		var allFeeds = getAllFeedIds();
    logger("allFeeds: ");
    console.log(allFeeds);

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

	var runTask = function (op) {
    needCommentIdList = [];
    commentNumber = 0;
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

	// pause posting every 10 min (a little bit over 10 min)
	this.start = function(op){
    runningInterval = true;
    logger('run task ' + new Date());
    runTask(op);
    logger("needCommentIdList: ");
    console.log(needCommentIdList);
    logger("Commented list: ");
    console.log(commentedIdList);

		setTimeout(function () {
      if (!runningInterval) {
        logger('task has been cancelled');
        return;
      }
		  start();
    }, 10*61*1000)
	};

	this.stop = function(){
	  runningInterval = false;
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