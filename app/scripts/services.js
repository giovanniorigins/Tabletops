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
(function () {
    'use strict';
    angular.module('underscore', [])
        .factory('_', ['$window', function ($window) {
            return $window._;
        }]);

    angular.module('tabletops.services', [])
        .constant('ApiEndpoint', {
            api: 'http://tabletops.io/api/v1/mobile',
            auth: 'http://tabletops.io/api/v1/auth',
            feed: 'http://tabletops.io/api/v1/feed',
            base: 'http://tabletops.io'
        })
        // Api Factories
        .factory('Listing', ['$resource', 'ApiEndpoint', Listing])
        .factory('Locations', ['$resource', 'ApiEndpoint', Locations])
        .factory('Cuisine', ['$resource', 'ApiEndpoint', Cuisine])
        .factory('Medley', ['$resource', 'ApiEndpoint', Medley])
        .factory('Province', ['$resource', 'ApiEndpoint', Province])
        // Other Factories
        .factory('AuthenticationService', ['$rootScope', '$q', '$http', 'authService', '$localForage', 'ApiEndpoint', '$cordovaFacebook', '$cordovaOauth', '$cordovaDevice', '$ionicUser', '$window', '_', '$cordovaAppAvailability', AuthenticationService])
        .factory('timeoutHttpIntercept', timeoutHttpIntercept)
        .factory('ListingRepository', ['$rootScope', '$ionicActionSheet', '$localForage', '$cordovaSocialSharing', '$cordovaToast', '$sce', '_', 'ApiEndpoint', '$timeout', ListingRepository])
        .factory('UserActions', ['$rootScope', 'Listing', '$http', '$cordovaCamera', '$localForage', '$cordovaFacebook', 'ApiEndpoint', '$q', 'AuthenticationService', UserActions])
        .factory('Dialogs', ['$cordovaDialogs', '$ionicModal', '$q', '$rootScope', '$ionicSlideBoxDelegate', '$ionicScrollDelegate', Dialogs]);

    // Api Factories
    function Listing($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + '/listings/:id', {}, {
            query: {method: 'GET', isArray: true, cache: false},
            update: {method: 'PUT'}
        });
    }
    function Locations($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + '/locations/:id', {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }
    function Cuisine($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + '/cuisines/:id', {}, {
            query: {method: 'GET', isArray: true, cache: false}
        });
    }
    function Medley($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + '/medleys/:id', {}, {
            query: {method: 'GET', isArray: true, cache: false}
        });
    }
    function Province($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + '/provinces/:id', {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }
    // Other Factories
    function AuthenticationService($rootScope, $q, $http, authService, $localForage, ApiEndpoint, $cordovaFacebook, $cordovaOauth, $cordovaDevice, $ionicUser, $window, _, $cordovaAppAvailability) {
        var service = {
            login: function (user) {
                var deferred = $q.defer();
                $localForage.setItem('userCreds', user);
                $http.post(ApiEndpoint.auth + '/authenticate', {
                    email: user.email,
                    password: user.password
                }, {ignoreAuthModule: true})
                    .success(function (data, status) {
                        if (angular.isDefined(data.error)) {
                            console.log(data.error);
                            $localForage.removeItem('userCreds', user);
                            $rootScope.$broadcast('event:auth-login-failed', status);
                            deferred.reject(data.error);
                        } else {

                            $localForage.setItem('usedProvider', 'Email');
                            $localForage.setItem('authorizationToken', data.token);
                            $localForage.setItem('providerToken', data.token);
                            $http.defaults.headers.common.Authorization = 'Bearer ' + data.token;

                            deferred.resolve(true);
                            service.authHandler('email');
                        }
                    })
                    .error(function (data, status) {
                        $localForage.removeItem('userCreds', user);
                        $rootScope.$broadcast('event:auth-login-failed', status);
                        deferred.reject(false);
                    });
                return deferred.promise;
            },
            logout: function () {
                var deferred = $q.defer();
                $http.post(ApiEndpoint.auth + '/logout', {}, {ignoreAuthModule: true})
                    .finally(function () {
                        $localForage.removeItem('authorizationToken');
                        $localForage.removeItem('user');
                        $localForage.removeItem('usedProvider');
                        $localForage.removeItem('providerToken');
                        delete $http.defaults.headers.common.Authorization;
                        $rootScope.$broadcast('event:auth-logout-complete');
                        deferred.resolve(true);
                    });
                return deferred.promise;
            },
            loginCancelled: function () {
                authService.loginCancelled();
            },
            authCheck: function () {
                console.log('Auth Checking');
                var IoUser = $ionicUser.get();
                if (!IoUser.user_id) {
                    // Set your user_id here, or generate a random one.
                    IoUser.user_id = angular.isDefined($window.device) ? $cordovaDevice.getUUID() : $ionicUser.generateGUID();
                    console.log('New IoUser');
                }

                // Identify your user with the Ionic User Service
                $ionicUser.identify(IoUser).then(function () {
                    $localForage.setItem('IoIdentified', true);
                    console.log('Identified user: ', IoUser);
                });

                /*if ($window.plugins && $window.plugins.pushNotification) {
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
                 }*/

                $localForage.getItem('usedProvider').then(function (provider) {
                    console.log('UsedProvider: ', provider);
                    switch (provider) {
                        case 'Facebook':
                        case 'Google':
                            return service.Me();
                        case 'Email':
                            $localForage.getItem('userCreds').then(function (user) {
                                return service.login(user);
                            });
                            break;
                        default:
                            return false;
                    }
                    /*switch (provider) {
                     case 'Facebook':
                     return service.FbMe();
                     case 'Google':
                     return service.GoogleMe();
                     case 'Email':
                     $localForage.getItem('userCreds').then(function (user) {
                     return service.login(user);
                     });
                     break;
                     default:
                     return false;
                     }*/
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
                            return false;
                    }
                });
            },
            // Facebook Auth
            FbAppAvailable: function () {
                if ($window.appAvailability && $window.facebookConnectPlugin) {
                    return $cordovaAppAvailability.check('fb://');
                } else {
                    var d = $q.defer();
                    d.reject(false);
                    return d.promise;
                }
            },
            FbCheckLogin: function () {
                $cordovaFacebook.getLoginStatus()
                    .then(function (success) {
                        if (success.status === 'connected') {
                            var accessToken = success.authResponse.accessToken;
                            $localForage.setItem('usedProvider', 'Facebook').then(function () {
                                $localForage.setItem('providerToken', accessToken).then(function () {
                                    $rootScope.$broadcast('event:auth-loginConfirmed');
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
                $cordovaOauth.facebook("646933472119700", ['public_profile', 'email', 'user_friends']).then(function (success) {
                    // results
                    var accessToken = success.access_token;
                    $localForage.setItem('usedProvider', 'Facebook').then(function () {
                        $localForage.setItem('providerToken', accessToken).then(function () {
                            return service.authHandler('facebook');
                        });
                    });
                }, function (error) {
                    // error
                    console.log(error);
                });
                /*service.FbAppAvailable(false)
                 .then(function () {
                 //FB App is available
                 $cordovaFacebook
                 .login(['public_profile', 'email', 'user_friends'])
                 .then(function (success) {
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
                 $cordovaOauth.facebook("646933472119700", ['public_profile', 'email', 'user_friends']).then(function (success) {
                 // results
                 var accessToken = success.access_token;
                 $localForage.setItem('usedProvider', 'Facebook').then(function () {
                 $localForage.setItem('providerToken', accessToken).then(function () {
                 return service.authHandler('facebook');
                 });
                 });
                 }, function (error) {
                 // error
                 console.log(error);
                 });
                 });*/
            },
            FbLogout: function () {
                $localForage.getItem('user').then(function (user) {
                    $cordovaFacebook.logout()
                        .then(function (success) {
                            // success
                            console.log(success);
                            $localForage.removeItem('usedProvider');
                            $localForage.removeItem('providerToken');
                            return $localForage.removeItem('user');
                        }, function (error) {
                            // error
                            console.log(error);
                            return error;
                        });
                });
            },
            FbMe: function () {
                $localForage.getItem('providerToken').then(function (token) {
                    $http.post(ApiEndpoint.auth + '/Facebook?token=' + token, {withCredentials: false})
                        .success(function (res) {
                            if (angular.isDefined(res) && res !== null) {
                                if (angular.isDefined(res.error)) {
                                    console.log('Auth Error');
                                    console.log(res.error);
                                    return false;
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
                                return false;
                            }
                        })
                        .error(function (res) {
                            console.log('Auth Error');
                            console.log(res);
                            return false;
                        });
                });
            },
            // Google Auth
            GoogleCheckLogin: function () {
                $cordovaOauth.google('861030047808-iemphej4buprgmptu0jehfs4tjdsr73p.apps.googleusercontent.com', ['https://www.googleapis.com/auth/plus.login', 'email']).then(function (result) {
                    // results
                    console.log(result);
                    $localForage.setItem('usedProvider', 'Google').then(function () {
                        $localForage.setItem('providerToken', result.access_token).then(function () {
                            $rootScope.$broadcast('event:auth-loginConfirmed');
                            return service.authHandler('google');
                        });
                    });
                }, function (error) {
                    // error
                    console.log(error);
                    return service.authHandler();
                });
            },
            GoogleLogin: function () {
                $cordovaOauth.google('861030047808-iemphej4buprgmptu0jehfs4tjdsr73p.apps.googleusercontent.com', ['https://www.googleapis.com/auth/plus.login', 'email']).then(function (result) {
                    // results
                    console.log(result);
                    $localForage.setItem('usedProvider', 'Google').then(function () {
                        $localForage.setItem('providerToken', result.access_token).then(function () {
                            return service.authHandler('google');
                        });
                    });
                }, function (error) {
                    // error
                    console.log(error);
                });
            },
            GoogleLogout: function () {
                service.logout();
                /*$localForage.getItem('user').then(function (user) {
                 $cordovaGooglePlus.logout()
                 .then(function (msg) {
                 console.log(msg);
                 $localForage.removeItem('usedProvider');
                 $localForage.removeItem('providerToken');
                 return $localForage.removeItem('user');
                 });
                 });*/
            },
            GoogleMe: function () {
                $localForage.getItem('providerToken').then(function (token) {
                    $http.post(ApiEndpoint.auth + '/Google?token=' + token)
                        .success(function (res) {
                            if (res.error) {
                                console.log('Auth Error');
                                console.log(res.error);
                                return false;
                            }
                            console.log('Auth Success');
                            console.log(res);

                            $rootScope.isLoggedin = true;
                            $localForage.setItem('authorizationToken', res.token).then(function (authToken) {
                                $localForage.setItem('refreshToken', res.refresh_token);
                                $http.defaults.headers.common.Authorization = 'Bearer ' + res.token;
                                $rootScope.$broadcast('event:auth-loginConfirmed');
                                return service.Me();
                            });
                        })
                        .error(function (res) {
                            console.log('Auth Error');
                            console.log(res);
                            return false;
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
                        withCredentials: false
                    })
                        .success(function (data) {
                            if (!!data && angular.isNumber(parseInt(data.id)) && angular.isUndefined(data.error)) {
                                $rootScope.user = data.user;
                                $localForage.setItem('user', data.user).then(function (user) {
                                    var IoUser = $ionicUser.get();
                                    if (!IoUser.user_id) {
                                        // Set your user_id here, or generate a random one.
                                        IoUser.user_id = angular.isDefined($window.device) ? $cordovaDevice.getUUID() : $ionicUser.generateGUID();
                                        console.log('New IoUser');
                                    }

                                    // Identify your user with the Ionic User Service
                                    $ionicUser.identify(IoUser).then(function () {
                                        $localForage.setItem('IoIdentified', true);

                                        // Set User Info
                                        $ionicUser.set('tt_id', user.id);
                                        $ionicUser.set('name', user.full_name);
                                        $ionicUser.set('created_at', user.created_at);
                                        $ionicUser.set('language', user.language);
                                        $ionicUser.set('gender', user.gender);
                                        console.log('Identified user: ', IoUser);
                                    });


                                    var provs = _.pluck(user.profiles, 'provider');
                                    _.each(provs, function (a) {
                                        $ionicUser.push('providers', a, true);
                                    });

                                    $localForage.setItem('been', user.visited);
                                    //$localForage.setItem('favorites', user.likedPlaces);
                                    $rootScope.$broadcast('event:auth-loginConfirmed');

                                    // Check if this is first run
                                    $localForage.getItem('pastInitialStart').then(function (res) {
                                        return !!res;
                                    });
                                });
                            } else {
                                return false;
                            }
                        });
                });
            },
            refreshToken: function (provider, id) {
                $localForage.getItem('authorizationToken').then(function (token) {

                    $localForage.getItem('providerLongToken').then(function (longToken) {

                        $http.post(ApiEndpoint.auth + '/refreshToken', {
                            provider: provider,
                            user_id: id,
                            providerToken: longToken
                        }, {
                            ignoreAuthModule: true,
                            headers: {
                                Authorization: 'Bearer ' + token
                            },
                            withCredentials: false
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
    }
    function timeoutHttpIntercept() {
        return {
            'request': function (config) {
                config.timeout = 10000;
                return config;
            }
        };
    }
    function ListingRepository($rootScope, $ionicActionSheet, $localForage, $cordovaSocialSharing, $cordovaToast, $sce, _, ApiEndpoint, $timeout) {

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
                        if ($rootScope.isIOS) {
                            var ref = cordova.InAppBrowser.open('tel:' + number, '_blank', 'hidden=yes');
                            $timeout(ref.close, 3000);

                        } else {
                            window.open('tel:' + number, '_system');
                        }
                        //$rootScope.isIOS ? window.open('tel:' + number, '_blank') : window.open('tel:' + number, '_system');
                        return true;
                    }
                });
            },
            // Social Sharing
            share: function (obj, event) {
                //document.getElementById('share_button_' + obj.id)

                var targetRect = event.toElement.getBoundingClientRect(),
                    targetBounds = targetRect.left + ',' + targetRect.top + ',' + targetRect.width + ',' + targetRect.height;
                var message = '',
                    subject = 'Tabletops App: ' + obj.name,
                    file = angular.isObject(obj.logo) ? obj.logo.path : null,
                    link = ApiEndpoint.base + '/' + obj.slug;

                window.plugins.socialsharing.setIPadPopupCoordinates(targetBounds);
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
                        $localForage.setItem('favorites', data).then(function (a) {
                            $rootScope.favorites = data;
                        });
                    } else {
                        // Data exists
                        var check = _.contains(data, obj.id);
                        if (!!check) { // remove it
                            var newData = _.reject(data, function (id) {
                                return parseInt(id) === parseInt(obj.id);
                            });
                            $localForage.setItem('favorites', newData).then(function (a) {
                                $rootScope.favorites = newData;
                            });
                        } else { // add it
                            data.push(obj.id);
                            $localForage.setItem('favorites', data).then(function (a) {
                                $rootScope.favorites = data;
                            });
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
                //text = true;
                var str = '';
                if (count > 0) {
                    if (text) {
                        str = rating;
                    } else {
                        for (var i = 1; i <= 5; i++) {
                            var ending = i <= rating ? '' : (i > rating && rating > (i - 1)) ? '-half' : '-outline';
                            str += '<i class=\'icon ion-ios-star' + ending + ' energized\'></i>';
                        }
                    }
                } else {
                    if (text) {
                        str = 'No Ratings';
                    } else {
                        str = '<span class=\'icon ion-minus-round\'></span>';
                    }
                }
                return $sce.trustAsHtml(str);
            }
        };
        return repo;
    }
    function UserActions($rootScope, Listing, $http, $cordovaCamera, $localForage, $cordovaFacebook, ApiEndpoint, $q, AuthenticationService) {

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
            feedback: function (obj) {

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
                    url: "http://tabletops.io/np-pi",
                    picture: "http://tabletops.io/invite.jpg"
                };
                console.log('Inviting via FB');
                $cordovaFacebook.appInvite(options)
                    .then(function (obj) {
                        if (obj) {
                            if (obj.completionGesture === "cancel") {
                                // user canceled, bad guy
                            } else {
                                // user really invited someone :)
                            }
                        } else {
                            // user just pressed done, bad guy
                        }
                    }, function (obj) {
                        // error
                        console.log(obj);
                    });
            }
        };
        return repo;
    }
    function Dialogs($cordovaDialogs, $ionicModal, $q, $rootScope, $ionicSlideBoxDelegate, $ionicScrollDelegate) {

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
                                    $scope.loginModalSlider = $ionicSlideBoxDelegate.$getByHandle('loginModalSlideBox')._instances[$ionicSlideBoxDelegate.$getByHandle('loginModalSlideBox')._instances.length - 1];
                                    $scope.loginModalSlider.enableSlide(false);

                                    $scope.loginModal.show();

                                    console.log(modal);
                                    $scope.closeLoginModal = function (canceled, completed) {
                                        canceled = canceled || false;
                                        if ($scope.loginModalSlider.currentIndex() === 0) {
                                            $scope.loginModal.hide();
                                            if (canceled) {
                                                if (completed) {
                                                    deferred.resolve(true);
                                                } else {
                                                    deferred.reject('Canceled');
                                                }
                                                $scope.loginModal.remove();
                                            }
                                        } else {
                                            $scope.loginModalSlider.slide(0);
                                            $ionicScrollDelegate.$getByHandle('loginModal').scrollTop();
                                        }
                                    };

                                    $scope.toForgotPassword = function () {
                                        $scope.loginModalSlider.slide(1);
                                    };

                                    $scope.$on('$destroy', function () {
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
    }
})();