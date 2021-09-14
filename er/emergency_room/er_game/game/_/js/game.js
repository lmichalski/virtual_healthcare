var utils = angular.module('utils', ['ngCookies']),
	app = angular.module('prenatal', ['ngRoute', 'ngSanitize', 'utils']),
	api;

app.config(['$routeProvider', '$locationProvider', 
	
	function($routeProvider, $locationProvider) {
		$routeProvider.when('/', {
			templateUrl : '_/tpl/menu.tpl.html',
			controller  : 'mainCtrl'
		}).when('/settings/', {
			templateUrl : '../../_/ui/game/tpl/settings.tpl.html',
			controller  : 'settingsCtrl'
		}).when('/objectives/', {
			templateUrl : '_/tpl/objectives.tpl.html',
			controller  : 'objectivesCtrl'
		}).when('/instructions/', {
			templateUrl : '../../_/ui/game/tpl/instructions.tpl.html',
			controller  : 'instructionsCtrl'
		}).when('/credits/', {
			templateUrl : '_/tpl/credits.tpl.html',
			controller  : 'creditsCtrl'
		}).when('/intro/', {
			templateUrl : '../../_/ui/game/tpl/intro.tpl.html',
			controller  : 'introCtrl'
		}).when('/chart/', {
			templateUrl : '../../_/ui/game/tpl/chart.tpl.html',
			controller  : 'chartCtrl'
		}).when('/video/', {
			templateUrl : '../../_/ui/game/tpl/video.tpl.html',
			controller  : 'videoCtrl'
		}).when('/decision/', {
			templateUrl : '../../_/ui/game/tpl/decision.tpl.html',
			controller  : 'decisionCtrl'
		}).when('/feedback/', {
			templateUrl : '../../_/ui/game/tpl/feedback.tpl.html',
			controller  : 'feedbackCtrl'
		}).when('/transition/', {
			templateUrl : '../../_/ui/game/tpl/transition.tpl.html',
			controller  : 'transitionCtrl'
		}).when('/summary/', {
			templateUrl : '../../_/ui/game/tpl/summary.tpl.html',
			controller  : 'summaryCtrl'
		}).when('/lo/', {
			templateUrl : '_/tpl/lo.tpl.html',
			controller  : 'loCtrl'
		});
	}
	
]).run(['$rootScope', '$http', '$location', '$storage',
		
	function($rootScope, $http, $location, $storage) {
		
		$rootScope.dataProvider = {};
		$rootScope.eventLog = [];
		$rootScope.sg = $storage.getObject('prenatal') || {
			'uuid': generateUUID(),
			'gamesaved': false,
			'subtitles': false,
			'fullscreen': false,
			'current': 0,
			'completed': false,
			'videoposition': 0,
			'progress': []
		};
		
		$http.get('_/js/game_data.json')
			.success(function(data, status, headers, config) {
				$rootScope.dataProvider = data.decisionpoints;
				$rootScope.correctOptions = _.filter($rootScope.dataProvider, function(dp) {
					return dp.correct == true;
				});
			})
			.error(function(data, status, headers, config) {
				console.log('error: ' + status);
				$rootScope.dataProvider = {};
			});
		
		$rootScope.saveState = function() {
			$storage.setObject('prenatal', $rootScope.sg);
		}
		
		$rootScope.toggleFullScreen = function() {
			var elem, fullscreen;
			elem = $('.fullscreen')[0];
			fullscreen = $rootScope.sg.fullscreen;
			
			if(fullscreen) {
				if (elem.requestFullscreen) {
					elem.requestFullscreen();
				} else if (elem.msRequestFullscreen) {
					elem.msRequestFullscreen();
				} else if (elem.mozRequestFullScreen) {
					elem.mozRequestFullScreen();
				} else if (elem.webkitRequestFullscreen) {
					elem.webkitRequestFullscreen();
				}
			} else {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.msExitFullscreen) {
					document.msExitFullscreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				}
			}
		};
		
		$rootScope.keydownHandler = function(e) {
			var api = flowplayer('#player');
			if(api) {
				switch(e.which) {
					case 27:
						e.preventDefault();
						if ($location.url() != '/') {
							if (api && typeof api.video.time != 'undefined') {
								$rootScope.sg.videoposition = api.video.time;
								api.stop();
								$rootScope.saveState();
							}
							$location.path('/');
							$rootScope.$apply();
						} else {
							window.history.back(-1);
						}
						break;
					case 32:
						e.preventDefault();
						if (api) {
							if(api.paused) {
								api.resume();
							} else {
								api.pause();
							}
						}
						break;
					case 33:
						if (api) {
							api.seek(api.video.time - 10, api.resume);
						}
						break;
					case 34:
						if (api) {
							api.seek(api.video.time + 10, api.resume);
						}
						break;
					default:
						
						break;
				}
			}
		};
		
		$rootScope.resumeURL = "";
		
		$rootScope.gotoMenu = function() {
			$rootScope.resumeURL = $location.path();
			$rootScope.logGameEvent( "", "open", "menu", "", "");
			$location.path("/");
		}
		
		$rootScope.resumeGame = function() {
			
			var dp = _.findWhere($rootScope.dataProvider, {"id": $rootScope.sg.current});
			
			$rootScope.resumeURL = "";
			
			if (_.indexOf($rootScope.dataProvider, dp) == $rootScope.dataProvider.length - 1) {
				$location.path('/summary/');
			} else if ($rootScope.sg.videoposition > 0.1) {
				$location.path('/video/');
			} else {
				$location.path('/decision/');
			}
			
			$rootScope.logGameEvent( "", "resume", "game", "", "");
			
		};
				
		$(document).on('keydown', $rootScope.keydownHandler);
		
		$('.fullscreen').on('fullscreenchange webkitfullscreenchange mozfullscreenchange msfullscreenchange', function(e) {
			if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
				$rootScope.sg.fullscreen = true;
				$(this).addClass('is-fullscreen');
			} else {
				$rootScope.sg.fullscreen = false;
				$(this).removeClass('is-fullscreen');
			}
			$rootScope.$apply();
			$rootScope.saveState();
		});
		
		
		$rootScope.logGameEvent = function(level, type, target, label, data) {
			
			$rootScope.eventLog.push({
				"game": app.name,
				"level": level,
				"type": type,
				"target": target,
				"label": label,
				"data": data,
				"user": $rootScope.sg.uuid,
				"datetime": new Date()
			});
			
			console.log($rootScope.eventLog);
			
			if($rootScope.eventLog.length == 5) {
				$rootScope.saveGameEventData();
			}
		};
		
		$rootScope.saveGameEventData = function() {
			if (typeof ik !== "undefined" && ik.gamedata) {
				ik.gamedata.save($rootScope.eventLog);
				$rootScope.eventLog = [];
			} else {
				console.error("ik.gamedata is not defined");
			}
		};
		
	}
	
]);

app.controller('mainCtrl', ['$rootScope', '$scope', '$location', 
	function($rootScope, $scope, $location) { 
		
		$scope.startNewGame = function() {
			
			$.extend($rootScope.sg, {
				'gamesaved': false,
				'current': 0,
				'completed': false,
				'videoposition': 0,
				'progress': []
				
			});
			$location.path('/intro/');
			$rootScope.saveState();
			
			$rootScope.logGameEvent( "", "start", "game", getBrowser(), "");
		}
	
	}
]);

app.controller('introCtrl', ['$rootScope', '$scope', '$location',
	function($rootScope, $scope, $location) { 
		
		var current = 0,
			intro = [
				"You are a nurse in the ambulatory care setting of the ER. You will assess an ankle injury sustained while playing soccer."
			];
		
		$scope.label = 'Next';
		$scope.text = intro[current];
		
		$scope.skipToNext = function() {
			
			if (current < intro.length - 1) {
				current++;
				$scope.text = intro[current];
			} else {
				$location.path('/video/');
			}
			
		}
		
		$rootScope.sg.gamesaved = true;
		$rootScope.sg.videoposition = 0;
		$rootScope.saveState();
	}
]);

app.controller('videoCtrl', ['$rootScope', '$scope', '$location',
	function($rootScope, $scope, $location) {

		
		var dp, api, clip;
		
		dp = _.findWhere($rootScope.dataProvider, {"id": $rootScope.sg.current});
		
		api = flowplayer('#player');
		clip = getClip(dp.data);
		
		$scope.playing = false;
		

	}
]);

app.controller('decisionCtrl', ['$rootScope', '$scope', '$location', '$storage',
	function($rootScope, $scope, $location, $storage) { 
		
		
		var ind = 1, dp, correct;
		
		$scope.dp = _.findWhere($rootScope.dataProvider, {"id": $rootScope.sg.current});
		
		for (i = 0; i < $rootScope.sg.progress.length; i++) {
			
			dp = $rootScope.sg.progress[i];
			correct = _.findWhere($rootScope.dataProvider, {"id": dp.option}).correct;
			if (correct) {
				ind++;
			}	
		}
		$rootScope.logGameEvent( "", "show", "question", $scope.dp.message, "");
					
		$scope.randomizedOptions = _.shuffle($scope.dp.options);
		$scope.chooseOption = function(i) {
			var opt = _.findWhere($scope.dp.options, {"next": i}),
				next = _.findWhere($rootScope.dataProvider, {"id": i});
			$rootScope.sg.progress.push({
				'id': $rootScope.sg.current,
				'label': opt.label,
				'option': opt.next
			});
			$rootScope.sg.current = opt.next;
			$rootScope.saveState();
			
			$rootScope.logGameEvent( "", "select", "answer", opt.label, next.correct ? "correct" : "incorrect");
			
			switch(next.type) {
				case 'video':
					$location.path('/video/');
					break;
				case 'lo':
					if(next.feedback > '') {
						$location.path('/feedback/');
					} else {
						$location.path('/lo/');
					}
					break;
			}
			
			// google analytics ???
		};
		$scope.replayVideo = function() {
			/*gtag('event', 'video_replayed', {
				'event_category': 'video',
				'event_label': $scope.dp.data,
				'value': $scope.dp.id
			});*/
			$rootScope.logGameEvent( "", "replay", "video", $scope.dp.data, $scope.dp.id);
			$location.path('/video/');
		};
	}
]);

app.controller('feedbackCtrl', ['$rootScope', '$scope', '$location',
	function($rootScope, $scope, $location) { 
				
		$scope.dp = _.findWhere($rootScope.dataProvider, {"id": $rootScope.sg.current});
		
		$scope.goNext = function() {
			
			switch($scope.dp.type) {
				case 'video':
					$location.path('/decision/');
					break;
				case 'lo':
					$location.path('/lo/');
					break;
			}
			
		}
		
	}
]);

app.controller('transitionCtrl', ['$rootScope', '$scope', '$location', 
	function($rootScope, $scope, $location) { 
				
		$scope.dp = _.findWhere($rootScope.dataProvider, {"id": $rootScope.sg.current}); 
		
		$scope.playNextVideo = function() {
			
			$location.path('/video/');
			
		};
		
	}
]);

app.controller('summaryCtrl', ['$rootScope', '$scope', 
	function($rootScope, $scope) { 
		
		var i, l, dp, current, next;
		
		$scope.progress = [];
		
		for (i = 0; i < $rootScope.sg.progress.length; i++) {
			
			dp = $rootScope.sg.progress[i];
			current = _.findWhere($rootScope.dataProvider, {"id": dp.id});
			next = _.findWhere($rootScope.dataProvider, {"id": dp.option});
						
			$scope.progress.push({
				"question": current.message,
				"answer": dp.label,
				"correct": next.correct
			});
			
		}
		
		if ($rootScope.sg.completed) {
			$scope.correct_ratio = (_.where($scope.progress, {correct: true}).length / $scope.progress.length).toFixed(2);
			/*gtag('event', 'report_downloaded', {
				'event_category': 'gameplay',
				'event_label': 'download',
				'value': $scope.correct_ratio
			});*/
			$rootScope.logGameEvent( "", "complete", "game", "", $scope.correct_ratio);
			
			$scope.message = "<p>You have completed the game by answering <span class=\"score\">" + $scope.progress.length + " questions</span>.</p>";
				
			$scope.message += $scope.progress.length == $rootScope.correctOptions.length ? 
				"<p>You've demonstrated the best possible result! Now play it one more time to make sure it wasn't mere luck :)</p>" :
				"<p>However, if you give only correct answers it should only take 12 to 13 questions to complete the scenario. See if you can improve your results next time!</p>";
				
			$scope.message += "<p>If not attending an organized debrief, make sure you download and complete the <a href=\"https://games.de.ryerson.ca/maternity/_/downloads/Prenatal_Debriefing_Questions.docx\" target=\"maternity\">self-debriefing questions</a> to optimise your learning experience.</p>";
			
			//$scope.message += "<p>Please <a href=\"https://survey.ryerson.ca/s?s=9905&pre_q1_intxt=Maternity Prenatal\" target=\"_blank\">take this survey</a> to help us to improve the game.</p>";
			
		} else {
			$scope.message = "<p>You have answered <span class=\"score\">" + $scope.progress.length + " questions</span>. To finish the game go to menu and resume the gameplay.</p>";

		}
		
		$scope.downloadPDF = function() {
			
			let responses = '';
			$scope.progress.forEach( dp => {
				responses += `<div class="decision">
						<div>
							<strong>Q: </strong>
							${dp.question}
						</div>
						<div>
							<strong>A: </strong>
							<span class="${dp.correct ? 'correct' : 'wrong'}">
								${dp.answer} (${dp.correct ? 'Correct' : 'Incorrect'})</span>
						</div>
					</div>`;
			});
			const html = `<html lang="en">
					<head>
						<title>Prenatal Game Report</title>
						<style>
							html, body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; line-height: 130%; background-color: #ffffff; color: #000;}
							h1, h2, p, ol { font-weight: normal; margin-top: 0.3em; margin-bottom: 0.3em; padding-top: 0; padding-bottom: 0; line-height: 130%; color: #000; }
							h1 { font-size: 32px; padding-bottom: 0.3em; border-bottom: 2px solid #000000; }
							h2 { font-size: 24px; }
							.score { font-weight: bold; }
							.correct { color: #009933; }
							.wrong { color: #cc0000; }
						</style>
					</head>
					<body>
						<div class="summary">
							<h1>Prenatal Game Report</h1>
							<h2>Summary</h2>
							<div class="message">
								${$scope.message}
							</div>
							<h2>Your Responses</h2>
							<div class="responses">
								${responses}
							</div>
						</div>
					</body>
				</html>`;
			
			const frm = document.createElement('form');
			frm.method = 'POST';
			frm.action = 'https://de.ryerson.ca/games/html2pdf.cfm';
			
			const f1 = document.createElement('input');
			f1.type = 'hidden';
			f1.name = 'filename';
			f1.value = 'prenatal_game_report.pdf';
			frm.appendChild(f1);
			
			const f2 = document.createElement('input');
			f2.type = 'hidden';
			f2.name = 'html';
			f2.value = html;
			frm.appendChild(f2);
			
			document.body.appendChild(frm);
			frm.submit();
			frm.remove();
			
		};
		
	}
]);

app.controller('instructionsCtrl', ['$rootScope', '$scope', 
	function($rootScope, $scope) { 
		
		$scope.total = $rootScope.correctOptions.length;
		
	}
]);

app.controller('loCtrl', ['$rootScope', '$scope', 
	function($rootScope, $scope) { 
		
		var canvas, ctx, center, radius, $snd;
				
		createjs.Sound.addEventListener('fileload', onLoadComplete);
		createjs.Sound.registerSound('_/lo/heart01.mp3', 'snd', 1);
		
		function onLoadComplete(event) {
			createjs.Sound.play('snd', {loop: -1});
		}
		
		$scope.stopAudioAndResume = function() {
			createjs.Sound.removeAllSounds();
			$rootScope.resumeGame();
		}
		
		canvas = document.getElementById("watch");
		ctx = canvas.getContext("2d");
		center = canvas.height / 2;
		ctx.translate(center, center);
		ctx.rotate(-0.41);
		radius = center * 0.9;
		
		drawClock();
		setInterval(drawClock, 1000);
		
		function drawClock() {			

			var now = new Date(),
				hour = now.getHours(),
				minute = now.getMinutes(),
				second = now.getSeconds();
				
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.restore();
			
			ctx.beginPath();
			ctx.arc(0, 0, radius * 0.075, 0, 2 * Math.PI);
			ctx.fillStyle = '#345';
			ctx.fill();
			
			hour = hour % 12;
			hour = (hour * Math.PI / 6)+(minute * Math.PI / (6 * 60)) + (second * Math.PI / (360 * 60));
			drawHand(ctx, hour, radius * 0.6, radius * 0.07, '#345');
			
			minute=(minute * Math.PI / 30) + (second * Math.PI / (30 * 60));
			drawHand(ctx, minute, radius * 0.9, radius * 0.05, '#345');
			
			second=(second * Math.PI / 30);
			drawHand(ctx, second, radius * 0.9, radius * 0.02, '#f00');
			
			ctx.beginPath();
			ctx.arc(0, 0, radius * 0.035, 0, 2 * Math.PI);
			ctx.fillStyle = '#f33';
			ctx.fill();
		}
		
		function drawHand(ctx, pos, length, width, color) {
			ctx.beginPath();
			ctx.lineWidth = width;
			ctx.lineCap = "round";
			ctx.moveTo(0, 0);
			ctx.rotate(pos);
			ctx.lineTo(0, -length);
			ctx.strokeStyle = color;
			ctx.stroke();
			ctx.rotate(-pos);
		}
		
	}
]);


app.controller('settingsCtrl', ['$rootScope', '$scope', function($rootScope, $scope) { 
		
		$scope.onFullscreenKeydown = function($event) {
			if($event.keyCode === 13 || $event.keyCode === 32) {
				$rootScope.toggleFullScreen();
			}
		};
		$scope.onSubtitlesKeydown = function($event) {
			if($event.keyCode === 13 || $event.keyCode === 32) {
				$rootScope.sg.subtitles = !$rootScope.sg.subtitles;
				$rootScope.saveState();
			}
		};		
	}
]);
app.controller('objectivesCtrl', ['$rootScope', '$scope', function($rootScope, $scope) {  }]);
app.controller('creditsCtrl', ['$rootScope', '$scope', function($rootScope, $scope) {  }]);
app.controller('chartCtrl', ['$rootScope', '$scope', function($rootScope, $scope) {  }]);


///*  UTILS  *///


utils.factory('$storage', ['$window', '$cookies', function($window, $cookies) {
	var expiry_days = 10;
	
	function isLocalStorageAvailable() {
		var str = 'test';
		try {
			localStorage.setItem(str, str);
			localStorage.removeItem(str);
			return true;
		} catch(e) {
			return false;
		}
	}

	return {
		set: function(key, value) {
			var d = new Date();
			if (isLocalStorageAvailable()) {
				$window.localStorage[key] = value;
			} else {
				$cookies(key, value, {expires: d.setDate(expiry_days)});
			}
		},
		get: function(key) {
			var r = (isLocalStorageAvailable()) ? $window.localStorage[key] : $cookies.get(key);
			return r;
		},
		setObject: function(key, value) {
			var d = new Date(),
				o = JSON.stringify(value);
			if (isLocalStorageAvailable()) {
				$window.localStorage[key] = o;
			} else {
				$cookies.putObject(key, o, {expires: d.setDate(expiry_days)});
			}
		},
		getObject: function(key) {
			var r = (isLocalStorageAvailable()) ? $window.localStorage[key] : $cookies.getObject(key);
			return r ? JSON.parse(r) : false;
		},
		remove: function(key) {
			if (isLocalStorageAvailable()) {
				$window.localStorage.removeItem(key);
			} else {
				$cookies.remove[key];
			}
		}
	}
}]);

///* MISC *///

function getClip(video) {
	var clip = {};
	
	clip.bufferLength = 0;
	clip.sources = [];
	clip.sources.push({ 
		'type': 'video/mp4', 
		'src': '_/vid/mp4/' + video + '.mp4'
	});
	clip.subtitles = [];
	clip.subtitles.push({ 
		'kind': 'subtitles', 
		'srclang': 'en', 
		'label': 'English',
		'src': '_/vid/vtt/en/' + video + '.vtt'
	});
	
	return clip;
}

function toggleDetails(me) {
	var $me = $(me),
		$div = $('.responses');
	if ($div.hasClass('expanded')) {
		$div.removeClass('expanded');
		$me.text('Show all your responses');
	} else {
		$div.addClass('expanded');
		$me.text('Hide all your responses');
	}
	return false;
};

function generateUUID() {
	var r, d;
	d = new Date().getTime();
	if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
		d += performance.now(); //use high-precision timer if available
	}
	r = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return r;
};

function getBrowser() {
	var browser, isIE;
	
	isIE = /*@cc_on!@*/false || !!document.documentMode;
	
	if ( (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0 ) {
		browser = "Opera";
	} else if ( typeof InstallTrigger !== 'undefined' ) {
		browser = "Firefox";
	} else if ( /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification)) ) {
		browser = "Safari";
	} else if ( isIE ) {
		browser = "Internet Explorer";
	} else if ( !isIE && !!window.StyleMedia ) {
		browser = "Edge";
	} else if ( !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime) ) {
		browser = "Chrome";
	} else {
		browser = "Unknown browser";
	}
	return browser;
};

