angular.module('starter.controllers', ['starter.services', 'ngResource'])

    .controller('DashCtrl', function(Auth, Photos, currentUser, $scope, $stateParams, $resource, $ionicLoading, $compile) {
	if ($stateParams.friendUUID) {
	    $scope.showSegmented = false;
	    $scope.filters = {user: $stateParams.friendUUID};
	} else {
	    $scope.showSegmented = false;
	    $scope.filters = {};
	}

	Photos.clear();

	$scope.photos = Photos.all();
	$scope.data = {};
	$scope.data.noPhoto = true;
	$scope.current_max_default = 2;

	$scope.filters.from = 0;
	$scope.filters.to = $scope.current_max_default;

	function refreshPhotos(error) {
	    var newObj = {};

	    for( var key in $scope.filters )
		newObj[ key ] = $scope.filters[ key ];

	    function doRefreshing() {
		Photos.pushWithFilters(newObj, function() {
		}, function() {
		    $scope.$apply();
		    if($scope.photos.length > 0) {
			$scope.data.noPhoto = false;
		    } else {
			$scope.data.noPhoto = true;
		    }
		}, doRefreshing);
	    }

	    doRefreshing();

	    $scope.$broadcast('scroll.infiniteScrollComplete');
	}

	$scope.$on('stateChangeSuccess', function() {
	    $scope.loadMore();
	});

	$scope.loadMore = function() {
	    refreshPhotos(refreshPhotos);
	    $scope.filters.from += 3;
	    $scope.filters.to += 3;
	}

	$scope.filterPhotosMe = function() {
	    $scope.photos = [];
	    $scope.show();
	    doodFB.login(function(fbtoken) {
		Auth.login(fbtoken, function() {
		    $scope.filters.user = 'me';
		    $scope.filters.to = $scope.current_max_default;
		});
	    });
	}

	$scope.filterPhotosAll = function() {
	    $scope.photos = [];
	    $scope.filters.user = null;
	}

	$scope.show = function() {
	    $scope.loading = $ionicLoading.show({
		content: '<i class="icon ion-looping"></i> Loading',
		animation: 'fade-in',
		showBackdrop: true,
		maxWidth: 200
	    });
	};

	$scope.hide = function(){
	    $ionicLoading.hide();
	    $scope.photos = Photos.all();
	};
    })

    .controller('RedeemDetailCtrl', function(Photos, Auth, Places, currentUser, $state, $scope, $stateParams, $ionicLoading) {
	$scope.places = [];

	$scope.show = function() {
	    $scope.loading = $ionicLoading.show({
		content: '<i class="icon ion-looping"></i> Loading',
		animation: 'fade-in',
		showBackdrop: true,
		maxWidth: 200
	    });
	};

	$scope.hide = function(){
	    $ionicLoading.hide();
	    $scope.photo = Photos.get($stateParams.photoId)
	    $scope.place = Places.getByUuid($scope.photo.place.uuid)
	    if($scope.place.deals.length == 0) {
		$scope.scan($scope.photo);
		return;
	    }
	    console.log($scope.place);
	    $scope.deal = $scope.place.deals[0];
	};

	$scope.scan = function(photo){
	    function errorAndBackToDashboard() {
		alert('Really sorry we are sufferring from some app failures, please go back and try again.');
		$scope.show();
		$state.go('tab.dash');
		$scope.hide();
	    }

	    var compare = photo.place.uuid;
	    cordova.plugins.barcodeScanner.scan(
		function (result) {
		    $scope.show();
		    var flag = setInterval(function() {
			doodFB.login(function(fbtoken) {
			    Auth.login(fbtoken, function() {
				Photos.redeem(photo, function() {
				    if(result.text == compare) {
					if(currentUser.user && currentUser.user.uuid == photo.user.uuid) {
					    alert('Congrats! You got a reward for snap and share. Please show it to the staff. ');
					} else {
					    alert('Congrats! You have redeemed a photo coupon. Please show it to the staff. ');
					}
					photo.redeemed = true;
				    } else {
					alert('You have got a wrong code. Please try again.');
				    }
				    $scope.hide();
				    $state.go('tab.dash');
				}, function() {
				    photo.redeemed = true;
				    $scope.hide();
				    alert('The redeem is not successful. It may be because the photo has already be redeemed once. Please try again. If you think this is an error, please contact the staff. ');
				    $state.go('tab.dash');
				});
			    }, errorAndBackToDashboard);
			}, errorAndBackToDashboard);

			clearInterval(flag);
		    }, 1000)
		},
		function (error) {
		    $scope.show();
		    var flag = setInterval(function() {
			alert('You have got a wrong code. Please try again.');
			$scope.hide();
			$scope.go('tab.dash');
			clearInterval(flag);
		    }, 1000)
		}
	    );
	}

	function refreshPlaces(error) {
	    Places.refresh($scope.show, $scope.hide, error)
	}
	refreshPlaces(refreshPlaces);
    })

    .controller('PlacesCtrl', function(Places, $scope, $ionicLoading) {
	$scope.places = [];

	$scope.show = function() {
	    $scope.loading = $ionicLoading.show({
		content: '<i class="icon ion-looping"></i> Loading',
		animation: 'fade-in',
		showBackdrop: true,
		maxWidth: 200
	    });
	};

	$scope.hide = function(){
	    $ionicLoading.hide();
	    $scope.places = Places.all();
	};

	function refreshPlaces(error) {
	    Places.refresh($scope.show, $scope.hide, error)
	}
	refreshPlaces(refreshPlaces);
    })

    .controller('FriendsCtrl', function($scope, $ionicLoading, Auth, Friends) {
	function errorAndBackToDashboard() {
	    alert('Really sorry we are sufferring from some app failures, please go back and try again.');
	    $scope.show();
	    $state.go('tab.dash');
	    $scope.hide();
	}

	$scope.show = function() {
	    $scope.loading = $ionicLoading.show({
		content: '<i class="icon ion-looping"></i> Loading',
		animation: 'fade-in',
		showBackdrop: true,
		maxWidth: 200
	    });
	};

	$scope.hide = function(){
	    $ionicLoading.hide();
	    $scope.photos = Photos.all();
	};

	$scope.show();
	doodFB.login(function(fbtoken) {
	    Auth.login(fbtoken, function() {
		Friends.refresh(function() {}, function() {
		    $scope.friends = Friends.all();
		    $scope.hide();
		}, errorAndBackToDashboard);
	    }, errorAndBackToDashboard);
	}, errorAndBackToDashboard);
    })

    .controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
	$scope.friend = Friends.get($stateParams.friendId);
    })

    .controller('AccountCtrl', function($scope) {
    })

    .controller('PlaceDetailCtrl', function($scope, $stateParams, Places) {
	$scope.place = Places.get($stateParams.placeId);
	$scope.placeId = $stateParams.placeId;
    })

    .controller('PhotoCtrl', function(Auth, Utils, Places, Photos, $http, $state, $ionicScrollDelegate, $scope, $stateParams, $ionicLoading) {
	var cam = document.getElementById("camera-photo");
	var intervalId = setInterval(function() {
	    var files = cam.files;
	    if (files && files.length > 0) {
		var file = files[0];
		var fr = new FileReader(); // to read file contents
		fr.readAsBinaryString(file); // read the file
		blobToBase64(file, function(base64) {
		    imageBase64 = "data:image/jpeg;base64," + base64;
		})
		$scope.imagebase = decodeURI(URL.createObjectURL(file));
		clearInterval(intervalId);
	    }
	}, 1000)

	function errorAndBackToDashboard() {
	    alert('Really sorry we are sufferring from some app failures, please go back and try again.');
	    $scope.show();
	    $state.go('tab.places');
	    $scope.hide();
	}

	function capture(callback) {
	    angular.element('#camera-photo').trigger('click');
	    callback();
	}

	function blobToBase64(blob, cb) {
	    var reader = new FileReader();
	    reader.onload = function() {
		var dataUrl = reader.result;
		var base64 = dataUrl.split(',')[1];
		cb(base64);
	    };
	    reader.readAsDataURL(blob);
	};

	function upload(callback) {
	    var uri = encodeURI('https://api.cloudinary.com/v1_1/dood/image/upload');
	    var transfer = new FileTransfer();
	    var fileID = Utils.makeID(10);

	    Utils.cloudinarySign(fileID, $scope.frameID, function(params) {
		$.ajax({ type: 'POST',
			 url: 'https://api.cloudinary.com/v1_1/dood/image/upload',
			 crossDomain: true,
			 data: {
			     file: $scope.imagebase,
			     api_key: params.api_key,
			     timestamp: params.timestamp,
			     signature: params.signature,
			     tags: params.tags,
			     eager_async: params.eager_async,
			     eager: params.eager,
			     transformation: params.transformation,
			     public_id: params.public_id
			 },
			 dataType: 'json',
			 success: function(responseData, textStatus, jqXHR) {
			     callback(JSON.parse(res.response).url);
			 },
			 error: function(responseData, textStatus, errorThrown) {
			     upload(callback);
			 }
		       });
	    }, function() {
		upload(callback);
	    })
	}

	function post(url, callback) {
	    Photos.create(url, $scope.message, $scope.place, $scope.data.shareOnFacebook, function() {
		callback();
	    }, function() {
		post(url, callback);
	    });
	}

	$scope.place = Places.get($stateParams.placeId || 0);
	$scope.frame = $scope.place.frames[$stateParams.frameId || 0];
	$scope.imageURL = "http://res.cloudinary.com/dood/image/upload/v1395929028/-JJ2qcdF6D9dP7vM0xKh.jpg";
	$scope.frameURL = $scope.frame.url
	$scope.frameID = $scope.frame.public_id
	$scope.message = $scope.place.message;
	$scope.data = {};
	$scope.data.shareOnFacebook = true;

	$scope.$watch("data.shareOnFacebook", function() {
	    $ionicScrollDelegate.scrollBottom(true);
	})
	$scope.create = function() {
	    var files = cam.files;
	    if(!files || files.length == 0) {
		alert('You must take or choose a photo before uploading. ');
		return;
	    }

	    $scope.show();
	    doodFB.login(function(fbtoken) {
		Auth.login(fbtoken, function() {
		    upload(function(url) {
			post(url, function() {
			    if($scope.data.shareOnFacebook == true) {
				doodFB.sharePhoto($scope.message + $scope.place.promotion, url, function() {
				    alert('You have successfully uploaded your photo. Please enjoy the redeem! ')
				    $state.go('tab.places');
				    $scope.hide();
				}, function() {
				    alert('You have successfully uploaded your photo. Please enjoy the redeem! ')
				    $state.go('tab.places');
				    $scope.hide();
				});
			    } else {
				alert('You have successfully uploaded your photo. Please enjoy the redeem! ')
				$state.go('tab.places');
				$scope.hide();
			    }
			})
		    });
		}, errorAndBackToDashboard);
	    }, errorAndBackToDashboard);

	}

	$scope.show = function() {
	    $scope.loading = $ionicLoading.show({
		content: '<i class="icon ion-looping"></i> Loading',
		animation: 'fade-in',
		showBackdrop: true,
		maxWidth: 200
	    });
	};

	$scope.hide = function(){
	    $ionicLoading.hide();
	    $scope.places = Places.all();
	};

	$scope.show();

	capture(function(imageURL) {
	    $scope.$apply(function() { $scope.imageURL = imageURL });
	    $scope.hide();
	}, errorAndBackToDashboard);
    })
