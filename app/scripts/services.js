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
    .factory('_', ['$window',function ($window) {
        'use strict';
        return $window._;
    }]);

angular.module('GoogleMaps', [])
    .factory('GoogleMaps', ['$window', function ($window) {
        'use strict';
        if (angular.isUndefined($window.plugin)) {
            return {};
        }
        return $window.plugin.google.maps;
    }]);

angular.module('tabletops.services', [])
    .constant('ApiEndpoint', {
        api: 'http://tabletops.io/api/v1/mobile',
        auth: 'http://tabletops.io/api/v1/auth',
        feed: 'http://tabletops.io/api/v1/feed',
        base: 'http://tabletops.io'
    })
    .factory('Listing', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        'use strict';
        return $resource(ApiEndpoint.api + '/listings/:id', {}, {
            query: { method: 'GET', isArray: true, cache: false},
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
    .factory('AuthenticationService', ['$rootScope', '$q', '$http', 'authService', '$localForage', 'ApiEndpoint', '$state', '$cordovaInAppBrowser', '$cordovaFacebook', '$cordovaGooglePlus', '$cordovaOauth', '$cordovaDevice', '$ionicUser', '$ionicPush', '$window', '_', '$cordovaAppAvailability',
        function ($rootScope, $q, $http, authService, $localForage, ApiEndpoint, $state, $cordovaInAppBrowser, $cordovaFacebook, $cordovaGooglePlus, $cordovaOauth, $cordovaDevice, $ionicUser, $ionicPush, $window, _, $cordovaAppAvailability) {
            'use strict';
            var service = {
                login: function (user) {
                    $localForage.setItem('userCreds', user);
                    $http.post(ApiEndpoint.auth + '/authenticate', {
                        email: user.email,
                        password: user.password
                    }, {ignoreAuthModule: true})
                        .success(function (data, status) {
                            if (angular.isDefined(data.error)) {
                                console.log(data.error);
                                $localForage.removeItem('userCreds', user);
                                return $rootScope.$broadcast('event:auth-login-failed', status);
                            }

                            $localForage.setItem('usedProvider', 'Email');
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
                    $http.post(ApiEndpoint.auth + '/logout', {}, {ignoreAuthModule: true})
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
                    console.log('Auth Checking');
                    var IoUser = $ionicUser.get();
                    if(!IoUser.user_id) {
                        // Set your user_id here, or generate a random one.
                        IoUser.user_id = angular.isDefined($window.device) ? $cordovaDevice.getUUID() : $ionicUser.generateGUID();
                        console.log('New IoUser');
                    }

                    // Identify your user with the Ionic User Service
                    $ionicUser.identify(IoUser).then(function(){
                        $localForage.setItem('IoIdentified', true);
                        console.log('Identified user: ', IoUser);
                    });

                    if ($window.plugins && $window.plugins.pushNotification) {
                        $ionicPush.register({
                            canShowAlert: true, //Can pushes show an alert on your screen?
                            canSetBadge: true, //Can pushes update app icon badges?
                            canPlaySound: true, //Can notifications play a sound?
                            canRunActionsOnWake: true, //Can run actions outside the app,
                            onNotification: function (notification) {
                                // Handle new push notifications here
                                console.log('Notification: ', notification);
                                return true;
                            }
                        });
                    }

                    $localForage.getItem('usedProvider').then(function (provider) {
                        /*$localForage.getItem('user').then(function (user) {
                            return service.refreshToken(provider, user.id);
                        });*/
                                console.log('UsedProvider: ', provider);
                        switch (provider) {
                            case 'Facebook':
                                return service.FbCheckLogin();
                            case 'Google':
                                return service.GoogleCheckLogin();
                            case 'Email':
                                $localForage.getItem('userCreds').then(function (user) {
                                    return service.login(user);
                                });
                                break;
                            default:
                                return false; //$state.go('tabs.dashboard');
                        }
                    });
                },
                authHandler: function (provider) {
                    $localForage.getItem('providerToken').then(function (token) {
                        switch (provider) {
                            case 'facebook':
                                return service.FbMe();
                            case 'google':
                                return service.GoogleMe();
                            case 'email':
                                return service.Me();
                            default:
                                return false; //$state.go('tabs.dashboard');
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
                    $cordovaAppAvailability.check('fb://')
                        .then(function() {
                            //FB App is available
                            $cordovaFacebook
                                .login(['public_profile', 'email', 'user_friends'])
                                .then(function (success) {
                                    console.log('Login');
                                    console.log(success);
                                    if (success.status === 'connected') {
                                        var accessToken = success.authResponse.accessToken;
                                        $localForage.setItem('usedProvider', 'Facebook').then(function () {
                                            $localForage.setItem('providerToken', accessToken).then(function () {
                                                return service.authHandler('facebook');
                                            });
                                        });
                                    }
                                }, function (error) {
                                    // error
                                    console.log(error);
                                });
                        }, function () {
                            //FB App not available
                            $cordovaOauth.facebook("646933472119700", ['public_profile', 'email', 'user_friends']).then(function(success) {
                                // results
                                console.log('Login');
                                console.log(success);
                                if (success.status === 'connected') {
                                    var accessToken = success.authResponse.accessToken;
                                    $localForage.setItem('usedProvider', 'Facebook').then(function () {
                                        $localForage.setItem('providerToken', accessToken).then(function () {
                                            return service.authHandler('facebook');
                                        });
                                    });
                                }
                            }, function(error) {
                                // error
                                console.log(error);
                            });
                        });

                },
                FbLogout: function () {
                    $localForage.getItem('user').then(function (user) {
                        $cordovaFacebook.logout()
                            .then(function(success) {
                                // success
                                console.log(success);
                                return success;
                            }, function (error) {
                                // error
                                console.log(error);
                                return error;
                            });
                    });
                },
                FbMe: function () {
                    $localForage.getItem('providerToken').then(function (token) {
                        $http.post(ApiEndpoint.auth + '/Facebook?token=' + token, {
                            withCredentials: true
                        })
                            .success(function (res) {
                                if ( angular.isDefined(res) && res !== null ) {
                                    if (angular.isDefined(res.error)) {
                                        console.log('Auth Error');
                                        console.log(res.error);
                                        return false; //$state.go('tabs.dashboard');
                                    }
                                    console.log('Auth Success');
                                    console.log(res);

                                    $rootScope.isLoggedin = true;

                                    $localForage.setItem('user', res.profile).then(function (user) {
                                        //$ionicUser.set('user_id', user.user.id);
                                        $ionicUser.set('name', user.user.full_name);
                                        $ionicUser.set('created_at', user.user.created_at);
                                        $ionicUser.set('language', user.language);
                                        $ionicUser.set('gender', user.gender);
                                        $ionicUser.push('providers', user.provider, true);
                                    });
                                    $localForage.setItem('authorizationToken', res.token);
                                    $localForage.setItem('providerLongToken', res.tokens.access_token);
                                    $http.defaults.headers.common.Authorization = 'Bearer ' + res.token;
                                    $rootScope.$broadcast('event:auth-loginConfirmed');
                                    return service.Me();
                                } else {
                                    return false; //$state.go('tabs.dashboard');
                                }
                            })
                            .error(function (res) {
                                console.log('Auth Error');
                                console.log(res);
                                return false; //$state.go('tabs.dashboard');
                            });
                    });
                },
                // Google Auth
                GoogleCheckLogin: function () {
                    $cordovaGooglePlus.silentLogin('861030047808-1q78j4ajr4ikg772bu82fdlpnrn7ai2p.apps.googleusercontent.com')
                        .then(function (obj) {
                            console.log(obj); // do something useful instead of alerting
                            $localForage.setItem('usedProvider', 'Google').then(function () {
                                $localForage.setItem('providerToken', obj.oauthToken).then(function () {
                                    return service.authHandler('google');
                                });
                            });
                        }, function (msg) {
                            console.log('error: ',  msg);
                            return service.authHandler();
                        });
                },
                GoogleLogin: function () {
                    window.plugins.googleplus.isAvailable(
                        function (available) {
                            // info.plist CFBundleURLTypes issue not resolved
                            //available = false;
                            if (available && !1) {
                                // show the Google+ sign-in button
                                $cordovaGooglePlus.login('861030047808-1q78j4ajr4ikg772bu82fdlpnrn7ai2p.apps.googleusercontent.com')
                                    .then(function (obj) {
                                        console.log(obj); // do something useful instead of alerting
                                        $localForage.setItem('usedProvider', 'Google').then(function () {
                                            $localForage.setItem('providerToken', obj.oauthToken).then(function () {
                                                return service.authHandler('google');
                                            });
                                        });
                                    }, function (msg) {
                                        console.log('error: ',  msg);
                                        return service.authHandler();
                                    });
                            } else {
                                $cordovaOauth.google('861030047808-iemphej4buprgmptu0jehfs4tjdsr73p.apps.googleusercontent.com', ['https://www.googleapis.com/auth/plus.login', 'email']).then(function(result) {
                                    // results
                                    console.log(result);
                                    $localForage.setItem('usedProvider', 'Google').then(function () {
                                        $localForage.setItem('providerToken', result.access_token).then(function () {
                                            return service.authHandler('google');
                                        });
                                    });
                                }, function(error) {
                                    // error
                                    console.log(error);
                                });
                            }
                        }
                    );
                },
                GoogleLogout: function () {
                    $localForage.getItem('user').then(function (user) {
                        $cordovaGooglePlus.logout()
                            .then(function (msg) {
                                console.log(msg);
                                $localForage.removeItem('usedProvider').then(function () {
                                    return false; //$state.go('tabs.dashboard');
                                });
                            });
                    });
                },
                GoogleMe: function () {
                    $localForage.getItem('providerToken').then(function (token) {
                        $http.post(ApiEndpoint.auth + '/Google?token=' + token)
                            .success(function (res) {
                                if (res.error) {
                                    console.log('Auth Error');
                                    console.log(res.error);
                                    return false; //$state.go('tabs.dashboard');
                                }
                                console.log('Auth Success');
                                console.log(res);

                                $rootScope.isLoggedin = true;
                                $localForage.setItem('authorizationToken', res.token);
                                $localForage.setItem('refreshToken', res.refresh_token);
                                $http.defaults.headers.common.Authorization = 'Bearer ' + res.token;
                                $rootScope.$broadcast('event:auth-loginConfirmed');
                                return service.Me();
                            })
                            .error(function (res) {
                                console.log('Auth Error');
                                console.log(res);
                                return false; //$state.go('tabs.dashboard');
                            });
                    });
                },
                // API Auth
                Me: function () {
                    $localForage.getItem('authorizationToken').then(function (token) {
                        $http.post(ApiEndpoint.api + '/me', {}, {
                            ignoreAuthModule: true,
                            headers: {
                                Authorization: 'Bearer ' + token
                            },
                            withCredentials: true
                        })
                        .success(function (data) {
                            if (!!data && angular.isNumber(parseInt(data.id)) && angular.isUndefined(data.error)) {
                                $rootScope.user = data.user;
                                $localForage.setItem('user', data.user).then(function (user) {
                                    // Set User Info
                                    $ionicUser.set('tt_id', user.id);
                                    $ionicUser.set('name', user.full_name);
                                    $ionicUser.set('created_at', user.created_at);
                                    $ionicUser.set('language', user.language);
                                    $ionicUser.set('gender', user.gender);

                                    var provs = _.pluck(user.profiles, 'provider');
                                    _.each(provs, function (a) {
                                        $ionicUser.push('providers', a, true);
                                    });

                                    $localForage.setItem('been', user.visited);
                                    $localForage.setItem('favorites', user.likedPlaces);

                                    // Check if this is first run
                                    $localForage.getItem('pastInitialStart').then(function (res) {
                                        if (!!res) {
                                            return true; //$state.go('tabs.dashboard', null, {location: 'replace'});
                                        } else {
                                            return false; //$state.go('tabs.dashboard', null, {location: 'replace'});
                                            //return $state.go('intro', null, {location: 'replace'});
                                        }
                                    });
                                });
                            } else {
                                return false; //$state.go('tabs.dashboard');
                            }
                        });
                    });
                },
                refreshToken: function (provider, id) {
                    $localForage.getItem('authorizationToken').then(function (token) {

                        $localForage.getItem('providerLongToken').then(function (longToken) {

                            $http.post(ApiEndpoint.auth + '/refreshToken', {provider: provider, user_id: id, providerToken: longToken}, {
                                ignoreAuthModule: true,
                                headers: {
                                    Authorization: 'Bearer ' + token
                                },
                                withCredentials: true
                            })
                                .success(function (res) {
                                    console.log('Refresh Success');
                                    console.log(res);
                                    //debugger;
                                })
                                .error(function (res) {
                                    console.log('Refresh Error');
                                    console.log(res);
                                    //debugger;
                                });
                        });
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
    .factory('ListingRepository', ['$rootScope', '$ionicActionSheet', '$localForage', '$cordovaSocialSharing', '$cordovaToast', '$cordovaFacebook', '$sce', 'CIDs', '_', 'ApiEndpoint',
        function ($rootScope, $ionicActionSheet, $localForage, $cordovaSocialSharing, $cordovaToast, $cordovaFacebook, $sce, CIDs, _, ApiEndpoint) {
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
                        link = ApiEndpoint.base + '/' + obj.slug;
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
                            } else { // add it
                                data.push(obj.id);
                                $localForage.setItem('favorites', data);
                                $rootScope.favorites = data;
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
                showStars: function (count, rating, text) {
                    var str = '';
                    if (count > 0) {
                        for (var i = 1; i <= 5; i++) {
                            var ending = i <= rating ? '' : (i > rating && rating > (i - 1)) ? '-half' : '-outline';
                            str += '<i class=\'icon ion-ios-star' + ending + ' energized\'></i>';
                        }
                    } else {
                        if (text) {
                            str = 'No Ratings';
                        } else {
                            str = '<span class=\'icon ion-minus-round\'></span>';
                        }
                    }
                    return $sce.trustAsHtml(str);
                },
                foo2: function () {

                }
            };
            return repo;
        }
    ])
    .factory('UserActions', ['$rootScope', 'Listing', '$http', '$cordovaCamera', '$localForage', '$cordovaFacebook', 'ApiEndpoint', '$q', 'AuthenticationService',
        function ($rootScope, Listing, $http, $cordovaCamera, $localForage, $cordovaFacebook, ApiEndpoint, $q, AuthenticationService) {
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
                    $localForage.getItem('authorizationToken').then(function (token) {
                        $localForage.getItem('user').then(function (res) {
                            if (res && res.id) {
                                return Listing.update({id: listing.id, token: token}, {
                                    action: 'review',
                                    comment: review.body,
                                    user_id: review.user_id,
                                    rating: review.rate
                                }, function (response) {
                                    console.log(response);
                                    return $localForage.getItem('user').then(function (user) {
                                        if (user.provider === 'Facebook' && review.facebook) {
                                            var message = angular.toJson(review.body);
                                            return $cordovaFacebook.api('/me/bahamastabletops:review?method=post&message=' + message + '&restaurant=' + ApiEndpoint.base + '/' + listing.slug, ['publish_actions'])
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
                    });
                },
                report: function (listing, report) {
                    var deferred = $q.defer();
                    $localForage.getItem('authorizationToken').then(function (token) {
                        $localForage.getItem('user').then(function (user) {
                            if (user && user.id) {
                                return Listing.update({id: listing.id, token: token}, {
                                    action: 'report',
                                    report: report,
                                    user_id: user.id
                                }, function (response) {
                                    console.log(response);
                                    deferred.resolve(response);
                                }, function (err) {
                                    console.log(err);
                                    deferred.reject(err);
                                });
                            } else {
                                return false;
                                //Dialogs.promptToLogin('write a review.');
                            }
                        });
                    });

                    return deferred.promise;
                },
                feed: function () {
                    var deferred = $q.defer();
                    $localForage.getItem('authorizationToken').then(function (token) {
                        if (token) {
                            $http.get(ApiEndpoint.feed + '?token=' + token)
                                .success(function (data, status) {
                                    console.log('My Feed');
                                    if (status === 401) {
                                        AuthenticationService.refreshToken();
                                    }
                                    console.log(data);
                                    deferred.resolve(data);
                                })
                                .error(function (err, status) {
                                    console.log(err);
                                    console.log(status);
                                    deferred.reject(err);
                                });
                        } else {
                            return false;
                        }
                    });

                    return deferred.promise;
                },
                inviteFb: function () {
                    var options = {
                        method: "apprequests",
                        message: "Check out this app that makes it easy to find great food in The Bahamas!"
                    };
                    console.log('Inviting via FB');
                    $cordovaFacebook.showDialog(options)
                        .then(function(success) {
                            // success
                            console.log(success);
                        }, function (error) {
                            // error
                            console.log(error);
                        });
                }
            };
            return repo;
        }])
    .factory('Dialogs', ['$cordovaDialogs', '$state', '$ionicModal', '$q', '$rootScope', '$ionicSlideBoxDelegate', '$ionicScrollDelegate',
        function ($cordovaDialogs, $state, $ionicModal, $q, $rootScope, $ionicSlideBoxDelegate, $ionicScrollDelegate) {
            'use strict';
            var $scope = $rootScope.$new();
            return {
                promptToLogin: function (action) {
                    var deferred = $q.defer();
                    $cordovaDialogs.confirm('You must login, before you can ' + action, 'Must Login', ['Cancel', 'Login'])
                        .then(function (buttonIndex) {
                            // no button = 0, 'Cancel' = 1, 'Login' = 2
                            var btnIndex = buttonIndex;
                            switch (btnIndex) {
                                case 0:
                                case 1:
                                    deferred.reject(false);
                                    break;
                                case 2:
                                    $ionicModal.fromTemplateUrl('views/sign-in/LoginModal.html', {
                                        scope: $scope,
                                        //animation: 'am-fade-and-scale'
                                    }).then(function (modal) {
                                        console.log('Opening Modal');
                                        $scope.loginModal = modal;

                                        //Init Slider to firt slide
                                        $scope.loginModalSlider = $ionicSlideBoxDelegate.$getByHandle('loginModalSlideBox')._instances[$ionicSlideBoxDelegate.$getByHandle('loginModalSlideBox')._instances.length-1];
                                        $scope.loginModalSlider.enableSlide(false);

                                        $scope.loginModal.show();

                                        console.log(modal);
                                        $scope.closeLoginModal = function (canceled) {
                                            canceled = canceled || false;
                                            if ($scope.loginModalSlider.currentIndex() === 0) {
                                                $scope.loginModal.hide();
                                                if (canceled) {
                                                    deferred.reject('Canceled');
                                                    $scope.loginModal.remove();
                                                }
                                            } else {
                                                $scope.loginModalSlider.slide(0);
                                                $ionicScrollDelegate.$getByHandle('loginModal').scrollTop();
                                            }
                                        };

                                        $scope.toForgotPassword = function () {
                                            $scope.filerModalSlider.slide(1);
                                        };

                                        $scope.$on('$destroy', function() {
                                            $scope.loginModal.remove();
                                        });
                                    });
                            }

                        });

                    return deferred.promise;
                },
                confirmAction: function (action) {
                    var deferred = $q.defer();
                    $cordovaDialogs.confirm('Are you sure you want to ' + action, ['Cancel', 'Yes'])
                        .then(function (buttonIndex) {
                            // no button = 0, 'Cancel' = 1, 'Login' = 2
                            var btnIndex = buttonIndex;
                            switch (btnIndex) {
                                case 0:
                                case 1:
                                    deferred.reject(false);
                                    break;
                                case 2:
                                    deferred.resolve(true);
                            }
                        });

                    return deferred.promise;

                }
            };
        }]);