
		if (api) {
			
			api.stop().load(clip);
			
		} else {
				
			api = flowplayer('#player', {
				key: '$916323217063219',
				clip:  clip,
				tooltip: false,
				keyboard: false,
				autoBuffering: false,
				analytics: 'UA-7906194-16',
				volume: 0.8
			}).on('ready',function(e, api) {
				
				if($rootScope.sg.subtitles) {
					if(api.video.subtitles.length > 0) {
						api.loadSubtitles(0);
					} else {
						api.disableSubtitles();
					}
				} else {
					api.disableSubtitles();
				}
				
				if ($rootScope.sg.videoposition > 0) {
					api.seek($rootScope.sg.videoposition, api.resume);
				} else {
					api.resume();
				}
				/*gtag('event', 'video_started', {
					'event_category': 'video',
					'event_label': dp.data,
					'value': dp.id
				});*/
				$rootScope.logGameEvent( "", "start", "video", dp.data, "");
				
			}).on('progress', function(e, api, pos) {
				$rootScope.sg.videoposition = pos;
				$scope.playing = true;
				$scope.$apply();
			}).on('pause', function(e, api) {
				/*gtag('event', 'video_paused', {
					'event_category': 'video',
					'event_label': dp.data,
					'value': dp.id
				});*/
				if(api.video.duration > api.video.time + 0.5) {
					$rootScope.logGameEvent( "", "pause", "video", dp.data, api.video.time);
				}
			}).on('finish', function(e, api) {
				$scope.skipVideo();
				$rootScope.saveState();
				$rootScope.$apply();
				/*gtag('event', 'video_finished', {
					'event_category': 'video',
					'event_label': dp.data,
					'value': dp.id
				});*/
				$rootScope.logGameEvent( "", "finish", "video", dp.data, "");
			}).on('error', function(e, api, err) {
				console.log(err);
				$rootScope.logGameEvent( "", "error", "video", dp.data, "");
			}).load();
			
		}
		
		$scope.skipVideo = function() {
			
			var api = flowplayer('#player').unload();
			
			$rootScope.sg.videoposition = 0;
			$rootScope.saveState();
			
			if(_.indexOf($rootScope.dataProvider, dp) == $rootScope.dataProvider.length - 1) {
				$rootScope.sg.completed = true;
				$location.path('/summary/');
			} else if (dp.options.length > 0) {
				if(dp.feedback > '') {
					$location.path('/feedback/');
				} else {
					$location.path('/decision/');
				}
			} else if (dp.next) {
				$rootScope.sg.videoposition = 0;
				$location.path('/lo/');
				$rootScope.saveState();
				$rootScope.sg.current++;
			} else {
				$location.path('/transition/');
				$rootScope.sg.current++;
			}
			//$rootScope.logGameEvent( "", "skip", "video", dp.data, api.video.time);
		}
		
