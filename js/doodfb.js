openFB.init('174723602705982', '/oauthcallback.html', window.localStorage);

var doodFB = {};
doodFB.login = function(callback, fail) {
  openFB.login('email,publish_stream,user_likes,user_friends',
    function() {
      callback(window.localStorage['fbtoken']);
    },
    function(error) {
      fail();
    });
}

doodFB.getInfo = function() {
  openFB.api({
    path: '/me',
    success: function(data) {
      console.log(JSON.stringify(data));
      document.getElementById("userName").innerHTML = data.name;
    },
    error: doodFB.errorHandler});
}

doodFB.sharePhoto = function(message, url, success, error) {
  openFB.api({
    method: 'POST',
    path: '/me/photos',
    params: {
      message: message,
      url: url
    },
    success: success,
    error: error});
}

doodFB.revoke = function() {
  openFB.revokePermissions(
    function() {
    },
    doodFB.errorHandler);
}

doodFB.errorHandler = function(error) {
}
