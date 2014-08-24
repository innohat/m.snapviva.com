angular.module('starter.services', ['ngResource'])

/**
 * A simple example service that returns some data.
 */
.factory('Friends', function(Session, $resource) {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [];

  return {
    refresh: function(startCallback, finishCallback, error) {
			startCallback();
      Session.ensure(function() {
        friends = $resource('http://api.doodhere.com/users/me/friends').query({"session_uuid": Session.get()}, finishCallback, error);
      }, error);
    },
		all: function() {
			return friends;
		},
    get: function(index) {
      // Simple index lookup
      return friends[index];
    }
  }
})

.value('sessionInstance', {})

.value('currentUser', { user: null })

.factory('Session', function(sessionInstance, $http) {

  return {
    ensure: function(done, fail) {
      if(sessionInstance.uuid == undefined || sessionInstance.uuid == null) {
        $http.post('http://api.doodhere.com/session').
          success(function(data, status, headers, config) {
            sessionInstance.uuid = data.uuid
            if(done) done();
          }).
          error(function(data, status, headers, config) {
            if(fail) fail();
          });
      } else {
        if(done) done();
      }
    },
    get: function() {
      return sessionInstance.uuid;
    }
  }
})

.factory('Places', function(Session, $resource) {
  var places = [];

  return {
    refresh: function(startCallback, finishCallback, error) {
      startCallback();
      Session.ensure(function() {
        places = $resource('http://api.doodhere.com/places').query({"session_uuid": Session.get()}, finishCallback, error);
      })
    },
    all: function() {
      return places;
    },
    get: function(index) {
      return places[index];
    },
    getByUuid: function(uuid) {
      for(var i in places) {
        if(places[i].uuid == uuid) {
          return places[i];
        }
      }
      return null;
    }
  }
})

.factory('Photos', function(Session, $http, $resource) {
  var photos = [];

  return {
    refreshWithFilters: function(filters, startCallback, finishCallback, error) {
      startCallback();
      Session.ensure(function() {
        var parameters = filters || {};
        parameters["session_uuid"] = Session.get();
        photos = $resource('http://api.doodhere.com/photos').query(parameters, finishCallback, error);
      });
    },
    refresh: function(startCallback, finishCallback, error) {
      this.refreshWithFilters(null, startCallback, finishCallback, error);
    },
    pushWithFilters: function(filters, startCallback, finishCallback, error) {
      startCallback();
      Session.ensure(function() {
        var parameters = filters || {};
        parameters["session_uuid"] = Session.get();
				var new_photos = [];
        var new_photos = $resource('http://api.doodhere.com/photos').query(parameters, function() {
					Array.prototype.push.apply(photos, new_photos)
					finishCallback();
				}, error);
      });
    },
    redeem: function(photo, success, fail) {
      Session.ensure(function() {
        $http.post('http://api.doodhere.com/photos/' + photo.uuid + '/redeem', {
          "session_uuid": Session.get() }).
          success(function() {
            success();
          }).
          error(function() {
            fail();
          })
      })
    },
		clear: function() {
			photos = [];
		},
    all: function() {
      return photos;
    },
    get: function(index) {
      return photos[index];
    },
    create: function(url, message, place, sharedOnFacebook, success, error) {
      Session.ensure(function() {
        $http.post('http://api.doodhere.com/photos', {
          "session_uuid": Session.get(),
          "place_uuid": place.uuid,
          "message": message,
          "photo_url": url,
          "shared_on_facebook": sharedOnFacebook }).
          success(function() {
            success();
          }).
          error(function() {
            error();
          })
        });
    }
  }
})

.factory('Auth', function(Session, currentUser, $http) {
  return {
    login: function(fbtoken, success, fail) {
      Session.ensure(function() {
        $http.post('http://api.doodhere.com/users/auth/facebook',
          {"session_uuid": Session.get(), "access_token": fbtoken}).
            success(function(data, status, headers, config) {
              $http.get('http://api.doodhere.com/users/me?session_uuid=' + Session.get()).
                success(function(userdata, userstatus, userheaders, userconfig) {
                  success();
                  currentUser.user = userdata;
                }).
                error(function() {
                  fail();
                });
            }).
            error(function(data, status, headers, config) {
              fail();
            });
      });
    }
  }
})

.factory('Utils', function($http) {
  return {
    cloudinarySign: function(fileID, frameID, done, fail) {
      $http.post('http://api.doodhere.com/utils/cloudinarysign',{
        tags: 'gift',
        public_id: fileID,
        transformation: 'c_fill,h_750,w_750'+ (frameID ? '/l_' + frameID : ''),
        eager: 'c_fill,h_200,w_200',
        eager_async: 'true'
      }).success(function(data, status, headers, config) {
        done(data);
      }).error(function(data, status, headers, config) {
        fail();
      })
    },
    makeID: function(l)
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < l; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
  }
})
