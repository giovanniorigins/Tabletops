function serializeData(data) {
    'use strict';
    // If this is not an object, defer to native stringification.
    if (!angular.isObject(data)) {
        return ( ( data === null ) ? '' : data.toString() );
    }

    var buffer = [];

    // Serialize each key in the object.
    for (var name in data) {
        if (!data.hasOwnProperty(name)) {
            continue;
        }

        var value = data[name];

        buffer.push(
            encodeURIComponent(name) + '=' + encodeURIComponent(( value === null ) ? '' : value)
        );
    }

    // Serialize the buffer and clean it up for transportation.
    var source = buffer.join('&').replace(/%20/g, '+');
    return ( source );
}

angular.module('underscore', [])
    .factory('_', function () {
        'use strict';
        return window._;
    });

angular.module('tabletops.services', [])
    .constant('ApiEndpoint', {
        api: 'http://flamingo.gorigins.com/api/v1',
        url: 'http://flamingo.gorigins.com/api/v1',
        auth: 'http://flamingo.gorigins.com/api/v1/auth'
    })
    .factory('Listing', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        'use strict';
        return $resource(ApiEndpoint.api + '/listings/:id', {}, {
            query: {url: ApiEndpoint.api + '/listings/:cuisine', method: 'GET', isArray: true, cache: true},
            update: {method: 'PUT'}
        });
    }])
    .factory('Locations', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        'use strict';
        return $resource(ApiEndpoint.api + '/locations/:id', {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }])
    .factory('Cuisine', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        'use strict';
        return $resource(ApiEndpoint.api + '/cuisines/:id', {}, {
            query: {method: 'GET', isArray: true, cache: false}
        });
    }])
    .factory('Medley', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        'use strict';
        return $resource(ApiEndpoint.api + '/medleys/:id', {}, {
            query: {method: 'GET', isArray: true, cache: false}
        });
    }])
    .factory('Province', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        'use strict';
        return $resource(ApiEndpoint.api + '/provinces/:id', {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }])
    .factory('AuthenticationService', ['$rootScope', '$q', '$http', 'authService', '$localForage', 'ApiEndpoint', '$state', '$cordovaInAppBrowser', '$cordovaFacebook', '$cordovaDevice', '$ionicUser', '$ionicPush',
        function ($rootScope, $q, $http, authService, $localForage, ApiEndpoint, $state, $cordovaInAppBrowser, $cordovaFacebook, $cordovaDevice, $ionicUser, $ionicPush) {
            'use strict';
            var service = {
                login: function (user) {
                    $localForage.setItem('userCreds', user);
                    $http.post(ApiEndpoint.api + '/auth/authenticate', {
                        email: user.email,
                        password: user.password
                    }, {ignoreAuthModule: true})
                        .success(function (data, status) {
                            if (angular.isDefined(data.error)) {
                                console.log(data.error);
                                $localForage.removeItem('userCreds', user);
                                return $rootScope.$broadcast('event:auth-login-failed', status);
                            }

                            $localForage.setItem('authorizationToken', data.token);
                            $localForage.setItem('providerToken', data.token);
                            $http.defaults.headers.common.Authorization = 'Bearer ' + data.token;

                            service.authHandler('email');
                            // Step 1

                            // Need to inform the http-auth-interceptor that
                            // the user has logged in successfully.  To do this, we pass in a function that
                            // will configure the request headers with the authorization token so
                            // previously failed requests(aka with status == 401) will be resent with the
                            // authorization token placed in the header
                            /*authService.loginConfirmed(data, function (config) {  // Step 2 & 3
                             config.headers['Authorization'] = data.token;
                             config.headers.Authorization = data.token;
                             return config;
                             });*/
                        })
                        .error(function (data, status) {
                            $localForage.removeItem('userCreds', user);
                            $rootScope.$broadcast('event:auth-login-failed', status);
                        });
                },
                logout: function () {
                    $http.post(ApiEndpoint.api + '/auth/logout', {}, {ignoreAuthModule: true})
                        .finally(function () {
                            $localForage.removeItem('authorizationToken');
                            delete $http.defaults.headers.common.Authorization;
                            $rootScope.$broadcast('event:auth-logout-complete');
                        });
                },
                loginCancelled: function () {
                    authService.loginCancelled();
                },
                authCheck: function () {
                    $localForage.getItem('usedProvider').then(function (provider) {
                        switch (provider) {
                            case 'facebook':
                                return service.FbCheckLogin();
                            case 'google':
                                return service.GoogleCheckLogin();
                            case 'email':
                                $localForage.getItem('userCreds').then(function (user) {
                                    return service.login(user);
                                });
                                break;
                            default:
                                // Set Anon Info
                                $ionicPush.register({
                                    canShowAlert: false, //Should new pushes show an alert on your screen?
                                    canSetBadge: true, //Should new pushes be allowed to update app icon badges?
                                    canPlaySound: true, //Should notifications be allowed to play a sound?
                                    canRunActionsOnWake: true, // Whether to run auto actions outside the app,
                                    onNotification: function(notification) {
                                        // Called for each notification.
                                        console.log(notification);
                                    }
                                }, {
                                    user_id: $cordovaDevice.getUUID()
                                });

                                $state.go('signin');
                        }
                    });
                },
                authHandler: function (provider) {
                    $localForage.getItem('providerToken').then(function (token) {

                        switch (provider) {
                            case 'facebook':
                                return service.FbMe();
                            case 'google':
                                return service.FbMe();
                            case 'email':
                                $http.post(ApiEndpoint.api + '/me', {}, {
                                    ignoreAuthModule: true,
                                    headers: {
                                        Authorization: 'Bearer ' + token
                                    }
                                })
                                    .success(function (data) {
                                        if (!!data && angular.isNumber(parseInt(data.id)) && angular.isUndefined(data.error)) {
                                            $rootScope.user = data.user;
                                            $localForage.setItem('user', data.user).then(function (user) {
                                                // Set User Info


                                                // Check if this is first run
                                                $localForage.getItem('pastInitialStart').then(function (res) {
                                                    if (!!res) {
                                                        return $state.go('tabs.dashboard', null, {location: 'replace'});
                                                    } else {
                                                        return $state.go('tabs.dashboard', null, {location: 'replace'});
                                                        //return $state.go('intro', null, {location: 'replace'});
                                                    }
                                                });
                                                console.log(data);
                                            });
                                        } else {
                                            return $state.go('signin');
                                        }
                                    });
                                break;
                            default:
                                return $state.go('signin');
                        }
                    });
                },
                // Facebook Auth
                FbCheckLogin: function () {
                    $cordovaFacebook.getLoginStatus()
                        .then(function (success) {
                            console.log('GetLoginStatus');
                            console.log(success);
                            if (success.status === 'connected') {
                                var accessToken = success.authResponse.accessToken;
                                $localForage.setItem('usedProvider', 'Facebook').then(function () {
                                    $localForage.setItem('providerToken', accessToken).then(function () {
                                        return service.authHandler('facebook');
                                    });
                                });
                            } else {
                                return service.authHandler();
                            }
                        }, function (error) {
                            // error
                            console.log(error);
                        });
                },
                FbLogin: function () {
                    $cordovaFacebook.login(['public_profile', 'email', 'user_friends'])
                        .then(function (success) {
                            console.log('Login');
                            console.log(success);
                            service.authHandler('facebook');
                        }, function (error) {
                            // error
                            console.log(error);
                        });

                },
                FbMe: function () {
                    $localForage.getItem('providerToken').then(function (token) {
                        $http.post(ApiEndpoint.auth + '/Facebook?token=' + token)
                            .success(function (res) {
                                if (res.error) {
                                    console.log('Auth Error');
                                    console.log(res.error);
                                    return res.error;
                                }
                                console.log('Auth Success');
                                console.log(res);

                                $rootScope.isLoggedin = true;

                                $localForage.setItem('user', res.profile).then(function (user) {
                                    $ionicUser.set('user_id', user.user.id);
                                    $ionicUser.set('name', user.user.full_name);
                                    $ionicUser.set('created_at', user.user.created_at);
                                    $ionicUser.set('language', user.language);
                                    $ionicUser.set('gender', user.gender);
                                    $ionicUser.push('providers', user.provider, true);
                                });
                                $localForage.setItem('authorizationToken', res.token);
                                $http.defaults.headers.common.Authorization = 'Bearer ' + res.token;
                                $rootScope.$broadcast('event:auth-loginConfirmed');
                                $state.go('tabs.dashboard');
                            })
                            .error(function (res) {
                                console.log('Auth Error');
                                console.log(res);
                            });
                    });
                },
                // Google Auth
                GoogleCheckLogin: function () {

                },
                GoogleLogin: function () {
                    var googleapi = {
                        authorize: function (options) {
                            var deferred = $q.defer();

                            //Build the OAuth consent page URL
                            var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + serializeData({
                                    client_id: options.client_id,
                                    redirect_uri: options.redirect_uri,
                                    response_type: 'code',
                                    scope: options.scope
                                });

                            var browserOptions = {
                                location: 'no',
                                clearcache: 'yes',
                                toolbar: 'no'
                            };

                            //Open the OAuth consent page in the InAppBrowser
                            $cordovaInAppBrowser.open(authUrl, '_blank', browserOptions)
                                .then(function (event) {
                                    // success
                                })
                                .catch(function (event) {
                                    // error
                                });

                            //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
                            //which sets the authorization code in the browser's title. However, we can't
                            //access the title of the InAppBrowser.
                            //
                            //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
                            //authorization code will get set in the url. We can access the url in the
                            //loadstart and loadstop events. So if we bind the loadstart event, we can
                            //find the authorization code and close the InAppBrowser after the user
                            //has granted us access to their data.
                            $rootScope.$on('$cordovaInAppBrowser:loadstart', function (e, event) {
                                var url = e.originalEvent.url;
                                var code = /\?code=(.+)$/.exec(url);
                                var error = /\?error=(.+)$/.exec(url);

                                if (code || error) {
                                    //Always close the browser when match is found
                                    $cordovaInAppBrowser.close();
                                }

                                if (code) {
                                    //Exchange the authorization code for an access token
                                    $http('https://accounts.google.com/o/oauth2/token', {
                                        code: code[1],
                                        client_id: options.client_id,
                                        client_secret: options.client_secret,
                                        redirect_uri: options.redirect_uri,
                                        grant_type: 'authorization_code'
                                    })
                                        .success(function (data) {
                                            deferred.resolve(data.data);
                                        })
                                        .error(function (res) {
                                            deferred.reject(res.data);
                                        });
                                } else if (error) {
                                    //The user denied access to the app
                                    deferred.reject({
                                        error: error[1]
                                    });
                                }
                            });

                            return deferred.promise();
                        }
                    };

                    googleapi.authorize({
                        client_id: '861030047808-iemphej4buprgmptu0jehfs4tjdsr73p.apps.googleusercontent.com',
                        client_secret: '_A1F9odJIABM-zFrf45k2_wi',
                        redirect_uri: 'http://localhost',
                        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
                    }).done(function (data) {
                        //$loginStatus.html('Access Token: ' + data.access_token);
                    }).fail(function (data) {
                        //$loginStatus.html(data.error);
                    });
                }
            };
            return service;
        }])
    .factory('timeoutHttpIntercept', function () {
        'use strict';
        return {
            'request': function (config) {
                config.timeout = 10000;
                return config;
            }
        };
    })
    .factory('ListingRepository', ['$rootScope', '$ionicActionSheet', '$localForage', '$cordovaSocialSharing', '$cordovaToast', '$cordovaFacebook', '$sce', 'CIDs', '_',
        function ($rootScope, $ionicActionSheet, $localForage, $cordovaSocialSharing, $cordovaToast, $cordovaFacebook, $sce, CIDs, _) {
            'use strict';
            var repo = {
                // Call Handling
                initCaller: function (obj) {
                    if (obj.locations.length > 1) {
                        repo.callSelectLocation(obj.locations);
                    } else if (obj.locations.length === 1) {
                        repo.callLocation(obj.locations);
                    } else {
                        $cordovaToast.showShortBottom('No address/phone numbers available yet...');
                        return false;
                    }
                },
                callSelectLocation: function (locations) {
                    var btns = [];
                    _.each(locations, function (loc) {
                        btns.push({text: loc.name});
                    });

                    // Show the action sheet
                    $ionicActionSheet.show({
                        buttons: btns,
                        //destructiveText: 'Delete',
                        titleText: 'Tap a location to call',
                        cancelText: 'Cancel',
                        cancel: function () {
                            // add cancel code..
                        },
                        buttonClicked: function (index) {
                            return repo.callLocation(locations, index);
                        }
                    });
                },
                callLocation: function (locations, index) {
                    var location = locations[index || 0],
                        btns = [];

                    if (location.phone_1) {
                        btns.push({text: location.phone_1});
                    }
                    if (location.phone_2) {
                        btns.push({text: location.phone_2});
                    }

                    // Show the action sheet
                    $ionicActionSheet.show({
                        buttons: btns,
                        //destructiveText: 'Delete',
                        titleText: 'Tap a number to call ' + location.name,
                        cancelText: 'Cancel',
                        cancel: function () {
                            // add cancel code..
                        },
                        buttonClicked: function (index) {
                            var number = btns[index].text.replace(/[-() +,]/g, '');
                            window.open('tel:' + number, '_system');
                            return true;
                        }
                    });
                },
                // Social Sharing
                share: function (obj) {
                    window.plugins.socialsharing.iPadPopupCoordinates = function () {
                        var rect = document.getElementById('share_button_' + obj.id).getBoundingClientRect();
                        return rect.left + ',' + rect.top + ',' + rect.width + ',' + rect.height;
                    };

                    /*var btns = [
                     { text: 'Copy Link' },
                     { text: 'Email' },
                     { text: 'Message' },
                     { text: 'Facebook' },
                     { text: 'Facebook Messenger' },
                     { text: 'Twitter' },
                     { text: 'WhatsApp' },
                     ];

                     // Show the action sheet
                     var hideSheet = $ionicActionSheet.show({
                     buttons: btns,
                     //destructiveText: 'Delete',
                     titleText: 'Tap a location to call',
                     cancelText: 'Cancel',
                     cancel: function () {
                     // add cancel code..
                     },
                     buttonClicked: function (index) {
                     return repo.callLocation(locations, index);
                     }
                     });*/

                    var message = '',
                        subject = 'Tabletops App: ' + obj.name,
                        file = angular.isObject(obj.logo) ? obj.logo.path : null,
                        link = 'http://flamingo.gorigins.com/np-pi/' + obj.slug;
                    $cordovaSocialSharing
                        .share(message, subject, file, link) // Share via native share sheet
                        .then(function (result) {
                            // Success!
                            console.log(result);
                        }, function (err) {
                            // An error occured. Show a message to the user
                            console.log(err);
                        });
                },
                favorite: function (obj) {
                    //$localForage.removeItem('favorites');
                    $localForage.getItem('favorites').then(function (data) {
                        if (!data || angular.isUndefined(data)) {
                            // Data doesnt exist
                            data = [];
                            data.push(obj.id);
                            $localForage.setItem('favorites', data);
                            $rootScope.favorites = data;
                        } else {
                            // Data exists
                            var check = _.contains(data, obj.id);
                            if (!!check) { // remove it
                                var newData = _.reject(data, function (id) {
                                    return parseInt(id) === parseInt(obj.id);
                                });
                                $localForage.setItem('favorites', newData);
                                $rootScope.favorites = newData;
                                //$cordovaToast.showShortBottom(' Awww, unfav\'d...');
                            } else { // add it
                                data.push(obj.id);
                                $localForage.setItem('favorites', data);
                                $rootScope.favorites = data;
                                //$cordovaToast.showShortBottom('Added to Favorites!');
                            }
                        }
                    });
                },
                been: function (obj) {
                    //$localForage.removeItem('been');
                    $localForage.getItem('been').then(function (data) {
                        if (angular.isUndefined(data)) {
                            // Data doesnt exist
                            data = [];
                            data.push(obj.id);
                            $localForage.setItem('been', data);
                            $rootScope.beens = data;
                        } else {
                            // Data exists
                            var check = _.contains(data, obj.id);
                            if (!!check) { // remove it
                                var newData = _.reject(data, function (id) {
                                    return parseInt(id) === parseInt(obj.id);
                                });
                                $localForage.setItem('been', newData).then(function (res) {
                                    $rootScope.beens = res;
                                });
                            } else { // add it
                                data.push(obj.id);
                                $localForage.setItem('been', data);
                                $rootScope.been = data;
                            }
                        }
                    });
                },
                showDollars: function (range, noIcon) {
                    noIcon = noIcon || false;
                    var str = '';
                    if (noIcon) {
                        for (var i = 1; i <= 4; i++) {
                            str += i <= range ? '$' : '';
                        }
                    } else {
                        for (var j = 1; j <= 4; j++) {
                            var ending = j <= range ? 'balanced' : '';
                            str += '<i class=\'icon ion-social-usd ' + ending + '\'></i> ';
                        }
                    }
                    return $sce.trustAsHtml(str);
                },
                showStars: function (count, rating) {
                    var str = '';
                    if (count > 0) {
                        for (var i = 1; i <= 5; i++) {
                            var ending = i <= rating ? '' : (i > rating && rating > (i - 1)) ? '-half' : '-outline';
                            str += '<i class=\'icon ion-ios-star' + ending + ' energized\'></i>';
                        }
                    } else {
                        str = '<span class=\'icon ion-minus-round\'></span>';
                    }
                    return $sce.trustAsHtml(str);
                },
                foo2: function () {

                }
            };
            return repo;
        }
    ])
    .factory('UserActions', ['$rootScope', 'Listing', '$http', '$cordovaCamera', '$localForage', '$cordovaFacebook',
        function ($rootScope, Listing, $http, $cordovaCamera, $localForage, $cordovaFacebook) {
            'use strict';
            var repo = {
                takePicture: function (obj) {
                    console.log(obj);
                    var options = {
                        quality: 50,
                        destinationType: Camera.DestinationType.DATA_URL,
                        sourceType: Camera.PictureSourceType.CAMERA,
                        allowEdit: true,
                        encodingType: Camera.EncodingType.JPEG,
                        targetWidth: 300,
                        targetHeight: 300,
                        popoverOptions: CameraPopoverOptions,
                        correctOrientation: true,
                        saveToPhotoAlbum: true
                    };

                    $cordovaCamera.getPicture(options).then(function (imageData) {
                        console.log(imageData);
                        console.log('data:image/jpeg;base64,' + imageData);
                        //var image = document.getElementById('myImage');
                        //image.src = 'data:image/jpeg;base64,' + imageData;
                    }, function (err) {
                        // error
                        console.log('Camera Error');
                        console.log(err);
                    });

                    $cordovaCamera.cleanup().then(function (res) {
                        console.log(res);
                    }, function (err) {
                        console.log(err);
                    });

                },
                review: function (listing, review) {
                    $localForage.get('user').then(function (res) {
                        if (res && res.id) {
                            return Listing.update({id: listing.id}, {
                                action: 'review',
                                comment: review.body,
                                user_id: review.user_id,
                                rating: review.rate
                            }, function (response) {
                                console.log(response);
                                return $localForage.getItem('user').then(function (user) {
                                    if (user.provider === 'Facebook' && review.facebook) {
                                        var message = angular.toJson(review.body);
                                        return $cordovaFacebook.api('/me/bahamastabletops:review?method=post&message=' + message + '&restaurant=http://flamingo.gorigins.com/np-pi/' + listing.slug, ['publish_actions'])
                                            .then(function (success) {
                                                // success
                                                console.log(success);
                                                return success;
                                            }, function (error) {
                                                // error
                                                console.log(error);
                                                return error;
                                            });
                                    }
                                });
                            }, function (err) {
                                console.log(err);

                            });
                        } else {
                            //Dialogs.promptToLogin('write a review.');
                        }
                    });

                }
            };
            return repo;
        }])
    .factory('Dialogs', ['$cordovaDialogs', '$state',
        function ($cordovaDialogs, $state) {
            'use strict';
            var repo = {
                promptToLogin: function (action) {
                    $cordovaDialogs.confirm('You must login, before you can ' + action, 'Must Login', ['Cancel', 'Login'])
                        .then(function (buttonIndex) {
                            // no button = 0, 'Cancel' = 1, 'Login' = 2
                            var btnIndex = buttonIndex;
                            switch (btnIndex) {
                                case 2:
                                    return $state.go('signin');
                            }

                        });
                }
            };
            return repo;
        }]);