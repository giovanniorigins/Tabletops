// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('tabletops', ['ionic', 'ionic.service.core'/*, 'ionic.service.analytics'*/, 'ionic.service.deploy', 'ngHello', 'ngResource', 'ngCordova', 'LocalForageModule', 'leaflet-directive', 'http-auth-interceptor', 'tabletops.config', 'tabletops.controllers', 'tabletops.directives', 'tabletops.services'])

    .run(function ($rootScope, $ionicPlatform, $ionicLoading, $ionicDeploy, $localForage) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }

            /*var info = {
                deviceInformation: ionic.Platform.device(),

            isWebView: ionic.Platform.isWebView(),
            isIPad: ionic.Platform.isIPad(),
            isIOS: ionic.Platform.isIOS(),
            isAndroid: ionic.Platform.isAndroid(),
            isWindowsPhone: ionic.Platform.isWindowsPhone()
            };
            console.log(info);*/
        });

        $rootScope.$on('loading:show', function () {
            $ionicLoading.show({template: '<ion-spinner icon="ripple" class="spinner-assertive"></ion-spinner>'});
        });

        $rootScope.$on('loading:hide', function () {
            $ionicLoading.hide();
        });

        $ionicDeploy.watch().then(function () {
            }, function () {
            },
            function (hasUpdate) {
                // Handle response
            });

        $rootScope.$on('$stateChangeSuccess', function (e, toState/*, toParams, fromState, fromParams, a*/) {
            console.log('To: ', toState);
            //console.log('Params: ', fromParams);
            $rootScope.filtersMenu = toState.name === "restaurants";
            /*if (toState.data.checkAuth && !User.isAuthorized) {
             e.preventDefault();
             AuthService.doAsyncThing().then(function (res) {
             $state.go(toState, toParams, {notify: false}).then(function () {
             $rootScope.$broadcast('$stateChangeSuccess', toState, toParams, fromState);
             }).catch(function (err) {
             // do something here, redirect, or let your $stateChangeError handler catch
             console.log('Error: ', err);
             })
             });
             }*/
        });

        $rootScope.valById = function (arr, id) {
            return valById(arr, id);
        };

        //FilterMenu Settings
        $rootScope.filters = {
            toggles: {}
        };
        $rootScope.filtersMenu = false;

        $rootScope.directionsSet = false;
        $rootScope.provincesMenu = false;

        $rootScope.cuisines = $rootScope.sorts = $rootScope.favorites = $rootScope.been = [];
        $rootScope.myLocation = {};

        //Load Favorites
        $localForage.getItem('favorites').then(function (data) {
            $rootScope.favorites = data;
        });

        //Load Been
        $localForage.getItem('been').then(function (data) {
            $rootScope.been = data;
        });
    })

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            // Tabs
            .state('tabs', {
                url: "/tab",
                abstract: true,
                templateUrl: "app/common/tabs.html"
            })

            .state('tabs.dashboard', {
                url: "/dashboard",
                views: {
                    'dashboard-tab': {
                        templateUrl: "app/dashboard/dashboard.html",
                        controller: 'DashboardCtrl'
                    }
                }
            })
            .state('tabs.results', {
                url: "/dashboard/search?search",
                views: {
                    'dashboard-tab': {
                        templateUrl: "app/listings/restaurants.html",
                        controller: 'RestaurantsCtrl'
                    }
                }
            })
            .state('tabs.medleys', {
                url: "/dashboard/medleys/:slug",
                views: {
                    'dashboard-tab': {
                        templateUrl: "app/listings/restaurants.html",
                        controller: 'RestaurantsCtrl'
                    }
                }
            })
            .state('tabs.cuisines', {
                url: "/dashboard/cuisines?search",
                views: {
                    'dashboard-tab': {
                        templateUrl: "app/dashboard/cuisines.html",
                        controller: 'CuisinesCtrl'
                    }
                }
            })
            .state('tabs.cuisine', {
                url: "/dashboard/cuisines/:id?search",
                views: {
                    'dashboard-tab': {
                        templateUrl: "app/listings/cuisine.html",
                        controller: 'CuisineCtrl'
                    }
                }
            })
            .state('tabs.cuisine-restaurant', {
                url: '/dashboard/cuisines/:cuisine_id/restaurants/:id',
                views: {
                    'dashboard-tab': {
                        templateUrl: 'app/common/restaurant.html',
                        controller: 'RestaurantCtrl',
                        resolve: {
                            listing: function (Listing, $stateParams, $http) {
                                return $http.get('http://flamingo.gorigins.com/api/v1/listings/' + $stateParams.id)
                            }
                        }
                    }
                }
            })
            .state('tabs.restaurant', {
                url: '/dashboard/restaurants/:id',
                views: {
                    'dashboard-tab': {
                        templateUrl: 'app/common/restaurant.html',
                        controller: 'RestaurantCtrl',
                        resolve: {
                            listing: function (Listing, $stateParams, $http) {
                                return $http.get('http://flamingo.gorigins.com/api/v1/listings/' + $stateParams.id)
                            }
                        }
                    }
                }
            })
            .state('tabs.favorites', {
                url: "/favorites",
                views: {
                    'favorites-tab': {
                        templateUrl: "app/listings/favorites.html",
                        controller: 'FavoritesCtrl'
                    }
                }
            })
            .state('tabs.favorite', {
                url: '/favorites/:id',
                views: {
                    'favorites-tab': {
                        templateUrl: 'app/common/restaurant.html',
                        controller: 'RestaurantCtrl',
                        resolve: {
                            listing: function (Listing, $stateParams, $http) {
                                return $http.get('http://flamingo.gorigins.com/api/v1/listings/' + $stateParams.id)
                            }
                        }
                    }
                }
            })
            .state('tabs.map', {
                url: "/map",
                views: {
                    'map-tab': {
                        templateUrl: "app/map/map.html",
                        controller: 'MapCtrl'
                    }
                }
            })
            /*.state('tabs.restaurants', {
                url: "/restaurants",
                views: {
                    'restaurants-tab': {
                        templateUrl: "app/restaurants/index.html",
                        controller: 'RestaurantsCtrl'
                    }
                }
            })*/
            /*.state('tabs.restaurant', {
                url: '/restaurants/:id',
                views: {
                    'restaurants-tab': {
                        templateUrl: 'app/restaurants/restaurant.html',
                        controller: 'RestaurantCtrl',
                        resolve: {
                            listing: function (Listing, $stateParams, $http) {
                                return $http.get('http://flamingo.gorigins.com/api/v1/listings/' + $stateParams.id)
                            }
                        }
                    }
                }
            })*/
            .state('tabs.settings', {
                url: "/settings",
                views: {
                    'settings-tab': {
                        templateUrl: "app/settings/settings.html",
                        controller: 'SettingsCtrl'
                    }
                }
            })
            .state('tabs.usage', {
                url:'/settings/usage',
                views: {
                    'settings-tab': {
                        templateUrl: 'app/settings/usage.html',
                        controller: 'SettingsCtrl'
                    }
                }
            })
            .state('tabs.faq', {
                url:'/settings/faq',
                views: {
                    'settings-tab': {
                        templateUrl: 'app/settings/faq.html',
                        controller: 'SettingsCtrl'
                    }
                }
            })
            .state('tabs.terms', {
                url:'/settings/terms',
                views: {
                    'settings-tab': {
                        templateUrl: 'app/settings/terms.html',
                        controller: 'SettingsCtrl'
                    }
                }
            })
            .state('tabs.privacy', {
                url:'/settings/privacy',
                views: {
                    'settings-tab': {
                        templateUrl: 'app/settings/privacy.html',
                        controller: 'SettingsCtrl'
                    }
                }
            })

            // Sign In
            .state('splash', {
                url: '/splash',
                templateUrl: 'app/splash/splash.html',
                controller: 'SplashCtrl'
            })
            .state('intro', {
                url: '/intro',
                templateUrl: 'app/splash/intro.html',
                controller: 'IntroCtrl'
            })
            .state('signin', {
                url: '/sign-in',
                templateUrl: 'app/sign-in/sign-in.html',
                controller: 'SignInCtrl'
            })
            .state('getStarted', {
                url: '/get-started',
                templateUrl: 'app/sign-in/sign-in.html',
                controller: 'SignInCtrl'
            })
            .state('forgotpassword', {
                url: '/forgot-password',
                templateUrl: 'app/sign-in/forgot-password.html'
            });

        // if none of the above states are matched, use this as the fallback
        //$urlRouterProvider.otherwise('/tab/dashboard');
        $urlRouterProvider.otherwise('/sign-in');

    });
