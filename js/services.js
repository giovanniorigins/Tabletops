angular.module('tabletops.services', [])
    .constant('ApiEndpoint', {
        api: 'http://flamingo.gorigins.com/api/v1',
        url: 'http://flamingo.gorigins.com/api/v1'
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
    .factory('AuthenticationService', function($rootScope, $http, authService, $localForage ,ApiEndpoint, $state, $cordovaFacebook) {
        var service = {
            login: function (user) {
                $localForage.setItem('userCreds', user);
                $http.post(ApiEndpoint.api + '/auth/authenticate', {email: user.email, password: user.password}, {ignoreAuthModule: true})
                    .success(function (data, status, headers, config) {
                        if(angular.isDefined(data.error)) {
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
                        } else if (token) {
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
                                                return $state.go('dashboard', null, { location: "replace" });
                                            else
                                                 return $state.go('intro', null, { location: "replace" });
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
            FbLogin: function () {
                $cordovaFacebook.login(["public_profile", "email", "user_friends", "offline_access", "read_friendlists", "user_friends"])
                    .then(function(response) {
                        // success
                        if (response.status === 'connected') {
                            console.log('Facebook login succeeded');
                            $localForage.setItem('useFacebook', true);
                            $localForage.setItem('authorizationToken', accessToken).then(function (data) {
                                return service.FbMe();
                            });
                        } else {
                            alert('Facebook login failed');
                            alert(error);
                        }
                    }, function (error) {
                        // error
                        console.log('Error');
                        console.log(error);

                    });
            },
            FbMe: function () {
                $cordovaFacebook.api("me", ["public_profile, email"])
                    .then(function(success) {
                        // success
                        console.log('API Me Data');
                        console.log(success);

                        var user = {
                            id: success.userID,
                            fname: success.firstName,
                            lname: success.lastName,
                            full_name: success.firstName+' '+success.lastName,
                            avatar: success.photoURL,
                            email: email,
                            profiles: success
                        };

                        $localForage.setItem('user', user).then(function (data) {
                            $rootScope.user = data;
                            $state.go('dashboard', null, { location: "replace" });
                        })
                    }, function (error) {
                        // error
                        alert('Facebook API Error');
                        alert(error);
                    });
            }
        };
        return service;
    })
    .factory('timeoutHttpIntercept', function ($rootScope, $q) {
        return {
            'request': function(config) {
                config.timeout = 10000;
                return config;
            }
        };
    })
    .factory('ListingRepository', ['$rootScope', '$ionicActionSheet', '$localForage', '$cordovaSocialSharing', '$cordovaToast', '$sce', function($rootScope, $ionicActionSheet, $localForage, $cordovaSocialSharing, $cordovaToast, $sce) {
        var repo = {
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
            callSelectLocation: function(locations) {
                var btns = [];
                _.each(locations, function (loc) {
                   btns.push({ text: loc.name });
                });

                // Show the action sheet
                var hideSheet = $ionicActionSheet.show({
                    buttons: btns,
                    //destructiveText: 'Delete',
                    titleText: 'Select a location to call',
                    cancelText: 'Cancel',
                    cancel: function() {
                        // add cancel code..
                    },
                    buttonClicked: function(index) {
                        return repo.callLocation(locations, index);
                    }
                });
            },
            callLocation: function(locations, index) {
                var location = locations[index || 0],
                    btns = [];

                if (location.phone_1)
                    btns.push({ text: location.phone_1});
                if (location.phone_2)
                    btns.push({ text: location.phone_2});

                // Show the action sheet
                var hideSheet = $ionicActionSheet.show({
                    buttons: btns,
                    //destructiveText: 'Delete',
                    titleText: 'Call ' + location.name,
                    cancelText: 'Cancel',
                    cancel: function() {
                        // add cancel code..
                    },
                    buttonClicked: function(index) {
                        var number = btns[index].text.replace(/[-() +,]/g, "");
                        window.open('tel:' + number, '_system');
                        return true;
                    }
                });
            },
            share: function(obj) {
                var message = 'Check it out!',
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
            favorite: function(obj) {
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
                        var check = _.findWhere(data, {id: obj.id});
                        if (!!check) { // remove it
                            var newData = _.reject(data, function(a) { return a.id == obj.id});
                            $localForage.setItem('favorites', newData);
                            $rootScope.favorites = newData;
                            $cordovaToast.showShortBottom('\f31d Awww, unfav\'d...');
                        } else { // add it
                            data.push(obj.id);
                            $localForage.setItem('favorites', data);
                            $rootScope.favorites = data;
                            $cordovaToast.showShortBottom('\f141 Fav\'d!');
                        }
                    }

                });
            },
            been: function(obj) {
                //$localForage.removeItem('been');
                $localForage.getItem('been').then(function (data) {
                    if (!data || angular.isUndefined(data)) {
                        // Data doesnt exist
                        data = [];
                        data.push(obj.id);
                        $localForage.setItem('been', data);
                        $rootScope.been = data;
                    } else {
                        // Data exists
                        var check = _.findWhere(data, {id: obj.id});
                        if (!!check) { // remove it
                            var newData = _.reject(data, function(a) { return a.id == obj.id});
                            $localForage.setItem('been', newData);
                            $rootScope.been = newData;
                            $cordovaToast.showShortBottom('\f12a Guess you haven\'t been here...');
                        } else { // add it
                            data.push(obj.id);
                            $localForage.setItem('been', data);
                            $rootScope.been = data;
                            $cordovaToast.showShortBottom('\f122 Been Here!');
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
                } else str = '<span class="icon ion-ios-minus-empty "></span> No ratings';
                return $sce.trustAsHtml(str);
            },
            foo2: function () {

            },
            foo: function() {
                alert("I'm foo!");
            }
        };
        return repo;
    }])
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