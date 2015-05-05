angular.module('tabletops.services', [])
    .constant('ApiEndpoint', {
        api: 'http://flamingo.gorigins.com/api/v1',
        url: 'http://flamingo.gorigins.com/api/v1',
        auth: 'http://flamingo.gorigins.com/api/v1/auth',
    })
    .factory('Listing', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + "/listings/:id", {}, {
            query: {url: ApiEndpoint.api + "/listings/:cuisine", method: 'GET', isArray: true, cache: true}
        });
    }])
    .factory('Cuisine', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + "/cuisines/:id", {}, {
            query: {method: 'GET', isArray: true, cache: false}
        });
    }])
    .factory('Medley', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + "/medleys/:id", {}, {
            query: {method: 'GET', isArray: true, cache: false}
        });
    }])
    .factory('Province', ['$resource', 'ApiEndpoint', function ($resource, ApiEndpoint) {
        return $resource(ApiEndpoint.api + "/provinces/:id", {}, {
            query: {method: 'GET', isArray: true, cache: true}
        });
    }])
    .factory('AuthenticationService', function ($rootScope, $http, authService, $localForage, ApiEndpoint, $state/*, hello*/, $cordovaInAppBrowser, $cordovaFacebook) {
        var service = {
            login: function (user) {
                $localForage.setItem('userCreds', user);
                $http.post(ApiEndpoint.api + '/auth/authenticate', {
                    email: user.email,
                    password: user.password
                }, {ignoreAuthModule: true})
                    .success(function (data, status, headers, config) {
                        if (angular.isDefined(data.error)) {
                            console.log(data.error);
                            $localForage.removeItem('userCreds', user);
                            return $rootScope.$broadcast('event:auth-login-failed', status);
                        }
                        $localForage.setItem('authorizationToken', data.token);
                        $http.defaults.headers.common.Authorization = data.token;  // Step 1

                        // Need to inform the http-auth-interceptor that
                        // the user has logged in successfully.  To do this, we pass in a function that
                        // will configure the request headers with the authorization token so
                        // previously failed requests(aka with status == 401) will be resent with the
                        // authorization token placed in the header
                        authService.loginConfirmed(data, function (config) {  // Step 2 & 3
                            config.headers["Authorization"] = data.token;
                            config.headers.Authorization = data.token;
                            return config;
                        });
                    })
                    .error(function (data, status, headers, config) {
                        $localForage.removeItem('userCreds', user);
                        $rootScope.$broadcast('event:auth-login-failed', status);
                    });
            },
            logout: function (user) {
                $http.post(ApiEndpoint.api + '/auth/logout', {}, {ignoreAuthModule: true})
                    .finally(function (data) {
                        $localForage.removeItem('authorizationToken');
                        delete $http.defaults.headers.common.Authorization;
                        $rootScope.$broadcast('event:auth-logout-complete');
                    });
            },
            loginCancelled: function () {
                authService.loginCancelled();
            },
            me: function () {
                $localForage.getItem('authorizationToken').then(function (token) {

                    $localForage.getItem('useFacebook').then(function (facebook) {
                        if (facebook) {
                            return service.FbMe();
                        } else if (token && !facebook) {
                            $http.post(ApiEndpoint.api + '/me', {}, {
                                ignoreAuthModule: true,
                                headers: {
                                    Authorization: 'Bearer ' + token
                                }
                            })
                                .success(function (data) {
                                    if (!!data && angular.isNumber(parseInt(data.id)) && angular.isUndefined(data.error)) {
                                        $rootScope.user = data.user;
                                        $localForage.setItem('user', data.user).then(function () {
                                            $localForage.getItem('pastInitialStart').then(function (res) {
                                                if (!!res)
                                                    return $state.go('dashboard', null, {location: "replace"});
                                                else
                                                    return $state.go('intro', null, {location: "replace"});
                                            });
                                            console.log(data);
                                        });
                                    } else {
                                        return $state.go('signin');
                                    }
                                });
                        } else {
                            return $state.go('signin');
                        }
                    });

                });

            },
            FbCheckLogin: function () {
                $cordovaFacebook.getLoginStatus()
                    .then(function(success) {
                        console.log('GetLoginStatus');
                        console.log(success);
                        if (success.status === 'connected') {
                            var accessToken = success.authResponse.access_token;
                            $localForage.setItem('useFacebook', true);
                            $localForage.setItem('authorizationToken', accessToken).then(function () {
                                $http.post(ApiEndpoint.auth + '/Facebook?token=' + accessToken)
                                    .success(function (res) {
                                        console.log('Auth Success');
                                        console.log(res);
                                    })
                                    .error(function (res) {
                                        console.log('Auth Error');
                                        console.log(res);
                                    })
                                return service.FbMe();
                            });
                        } else {
                            return service.me();
                        }
                    }, function (error) {
                        // error
                    });
                /*var online = hello.getAuthResponse('facebook');
                $rootScope.$watch('online', function (newValue, oldValue) {
                    if (online.access_token) {
                        var accessToken = online.access_token;
                        $localForage.setItem('useFacebook', true).then(function () {
                            $localForage.setItem('authorizationToken', accessToken).then(function (data) {
                                return service.FbMe();
                            });
                        });
                    } else {
                        return service.me();
                    }
                });*/
            },
            FbLogin: function () {
                $cordovaFacebook.login(["public_profile", "email", "user_friends"])
                    .then(function(success) {
                        console.log('Login');
                        console.log(success);
                        service.FbMe();
                    }, function (error) {
                        // error
                    });

                /*hello('facebook').login({scope: 'email,friends,publish'}).then(function () {
                    console.log('You are signed in to Facebook');
                    // Call user information, for the given network
                    return service.FbMe();
                }, function (e) {
                    alert('Signin error: ' + e.error.message);
                    return $state.go('signin');
                });*/
            },
            FbMe: function () {
                $localForage.getItem('authorizationToken').then(function (token) {


                });

                $cordovaFacebook.api("me", [/*"public_profile", "email", "user_friends"*/])
                    .then(function(response) {
                        // success
                        console.log('Facebook login succeeded');
                        console.log(response);
                        $localForage.setItem('useFacebook', true);


                        $cordovaFacebook.api(response.id + '/picture?redirect=false&width=200&height=200')
                            .then(function (picture) {



                                var user = {
                                    id: response.id,
                                    fname: response.first_name,
                                    lname: response.last_name,
                                    full_name: response.name,
                                    avatar: picture.data.url,
                                    email: response.email,
                                    profiles: [response]
                                };
                                $rootScope.isLoggedin = true;

                                $localForage.setItem('user', user);
                                $rootScope.$broadcast('event:auth-loginConfirmed');
                                $state.go('tabs.dashboard');
                            })

                    }, function (error) {
                        // error
                    });
                /*hello('facebook').api('/me').then(function(response) {
                    console.log('Facebook login succeeded');
                    $localForage.setItem('useFacebook', true).then(function () {
                        var user = {
                            id: response.id,
                            fname: response.first_name,
                            lname: response.last_name,
                            full_name: response.name,
                            avatar: response.picture,
                            email: response.email,
                            profiles: response
                        };
                        //console.log(user);
                        $rootScope.isLoggedin = true;

                        $localForage.setItem('user', user).then(function () {
                            $rootScope.$broadcast('event:auth-loginConfirmed');
                        });
                        $state.go('tabs.dashboard');
                    });
                });*/
            }
        };
        return service;
    })
    .factory('timeoutHttpIntercept', function ($rootScope, $q) {
        return {
            'request': function (config) {
                config.timeout = 10000;
                return config;
            }
        };
    })
    .factory('ListingRepository', ['$rootScope', '$ionicActionSheet', '$localForage', '$cordovaSocialSharing', '$cordovaToast', '$cordovaFacebook', '$sce', 'CIDs',
        function ($rootScope, $ionicActionSheet, $localForage, $cordovaSocialSharing, $cordovaToast, $cordovaFacebook, $sce, CIDs) {
            var repo = {
                // Call Handling
                initCaller: function (obj) {
                    if (obj.locations.length > 1) {
                        repo.callSelectLocation(obj.locations);
                    } else if (obj.locations.length == 1) {
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
                    });
                },
                callLocation: function (locations, index) {
                    var location = locations[index || 0],
                        btns = [];

                    if (location.phone_1)
                        btns.push({text: location.phone_1});
                    if (location.phone_2)
                        btns.push({text: location.phone_2});

                    // Show the action sheet
                    var hideSheet = $ionicActionSheet.show({
                        buttons: btns,
                        //destructiveText: 'Delete',
                        titleText: 'Tap a number to call ' + location.name,
                        cancelText: 'Cancel',
                        cancel: function () {
                            // add cancel code..
                        },
                        buttonClicked: function (index) {
                            var number = btns[index].text.replace(/[-() +,]/g, "");
                            window.open('tel:' + number, '_system');
                            return true;
                        }
                    });
                },
                // Social Sharing
                share: function (obj) {
                    window.plugins.socialsharing.iPadPopupCoordinates = function() {
                        var rect = document.getElementById('share_button_'+obj.id).getBoundingClientRect();
                        return rect.left + "," + rect.top + "," + rect.width + "," + rect.height;
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
                                    return id == obj.id;
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
                                    return id == obj.id;
                                });
                                $localForage.setItem('been', newData).then(function (res) {
                                    $rootScope.beens = newData;
                                });
                            } else { // add it
                                data.push(obj.id);
                                $localForage.setItem('been', data);
                                $rootScope.been = data;
                               //$cordovaToast.showShortBottom('\f122 Been Here!');
                                /*var options = {
                                    method: "share_open_graph",
                                    action_type: 'restaurant.visited',
                                    action_properties: JSON.stringify({
                                        restaurant: {
                                            "og:type": "restaurant.restaurant",
                                            "og:url": "http:\/\/flamingo.gorigins.com/np-pi/" + obj.slug,
                                            "og:title": obj.name,
                                            "og:image": obj.logo ? obj.logo.path: 'http://flamingo.gorigins.com/public_assets/img/logo_red.png',
                                            "place:location:latitude": obj.locations.length ? obj.locations[0].lat: '',
                                            "place:location:longitude": obj.locations.length ? obj.locations[0].lng: ''
                                        }
                                    })
                                };
                                $cordovaFacebook.showDialog(options)
                                    .then(function(success) {
                                        // success
                                        console.log('success');
                                        console.log(success);
                                    }, function (error) {
                                        // error
                                        console.log('error');
                                        console.log(error);
                                    });*/
                            }
                        }
                    });
                },
                showDollars: function (range, noIcon) {
                    noIcon = noIcon || false;
                    var str = '';
                    if (noIcon) {
                        for (i = 1; i <= 4; i++) {
                            str += i <= range ? '$' : '';
                        }
                    } else {
                        for (i = 1; i <= 4; i++) {
                            var ending = i <= range ? 'balanced' : '';
                            str += '<i class="icon ion-social-usd ' + ending + '"></i>';
                        }
                    }
                    return $sce.trustAsHtml(str);
                },
                showStars: function (count, rating) {
                    var str = '';
                    if (count > 0) {
                        for (i = 1; i <= 5; i++) {
                            var ending = i <= rating ? '' : (i > rating && rating > (i - 1)) ? '-half' : '-outline';
                            str += '<i class="icon ion-ios-star' + ending + ' energized"></i>';
                        }
                    } else str = '<span class="icon ion-minus-round"></span>';
                    return $sce.trustAsHtml(str);
                },
                foo2: function () {

                },
                foo: function () {
                    alert("I'm foo!");
                }
            };
            return repo;
        }
    ])
/*.factory('', ['$scope', '$ionicModal', function ($scope, $ionicModal) {
 $ionicModal.fromTemplateUrl('app/common/filtersModal.html', {
 scope: $scope,
 animation: 'slide-in-up'
 }).then(function(modal) {
 $scope.modal = modal;
 });
 //Cleanup the modal when we're done with it!
 $scope.$on('$destroy', function() {
 $scope.modal.remove();
 });
 // Execute action on hide modal
 $scope.$on('modal.hidden', function() {
 // Execute action
 });
 // Execute action on remove modal
 $scope.$on('modal.removed', function() {
 // Execute action
 });
 return {
 openFiltersModal: function () {
 $scope.modal.show();
 },
 closeFiltersModal: function () {
 $scope.modal.hide();
 }
 }
 }])*/