var valById = function (arr, id) {
    'use strict';
    return window._.find(arr, function (a) {
        return parseFloat(a.id) === parseFloat(id);
    });
};

angular.module('tabletops', [
    'ionic-material',
    'ionic.service.core',
    'ionic.service.analytics',
    'ionic.service.deploy',
    'ionic.service.push',
    'underscore',
    'GoogleMaps',
    'angularMoment',
    'ion-affix',
    'ionic.rating',
    'ionic.resetfield',
    'ngResource',
    'ngCordova',
    'ngCordova.plugins.googleplus',
    'LocalForageModule',
    'http-auth-interceptor',
    'ionicLazyLoad',
    'tabletops.config',
    'tabletops.controllers',
    'tabletops.directives',
    'tabletops.services'
])

    .run(['$rootScope', '$ionicPlatform', '$ionicLoading', '$ionicDeploy', '$ionicPopup', '$localForage', 'ionicMaterialInk', '$ionicAnalytics',
        function ($rootScope, $ionicPlatform, $ionicLoading, $ionicDeploy, $ionicPopup, $localForage, ionicMaterialInk, $ionicAnalytics) {
            'use strict';
            $ionicPlatform.ready(function () {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                    //Lets hide the accessory bar fo the keyboard (ios)
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                    // also, lets disable the native overflow scroll
                    cordova.plugins.Keyboard.disableScroll(true);
                }

                if (window.StatusBar) {
                    if (ionic.Platform.isAndroid()) {
                        StatusBar.backgroundColorByHexString("#608628");
                    } else {
                        // org.apache.cordova.statusbar required
                        StatusBar.styleLightContent();
                    }
                }

                $ionicAnalytics.register();
            });

            $rootScope.navbarColor = function (color) {
                return color || 'bar-assertive';
            };

            $rootScope.$on('loading:show', function () {
                $ionicLoading.show({template: '<div class=\'loader\'><svg class=\'circular\'><circle class=\'path\' cx=\'50\' cy=\'50\' r=\'20\' fill=\'none\' stroke-width=\'2\' stroke-miterlimit=\'10\'/></svg></div>'});
            });

            $rootScope.$on('loading:hide', function () {
                $ionicLoading.hide();
            });

            $rootScope.updateCheck = function () {
                $ionicDeploy.check().then(function (hasUpdate) {
                    // A confirm dialog
                    if (hasUpdate) {
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'Update Available',
                            template: 'Would you like to update the app now?'
                        });
                        confirmPopup.then(function (res) {
                            if (res) {
                                $ionicDeploy.update();
                            } else {
                                console.log('Fine, we will ask later...');
                            }
                        });
                    }
                }, function (err) {
                    console.error('Unable to check for updates:', err);
                });
            };

            $rootScope.$on('$stateChangeSuccess', function (e, toState/*, toParams, fromState, fromParams, a*/) {
                //console.log('To: ', toState);
                //console.log('Params: ', fromParams);
                $rootScope.filtersMenu = toState.name === 'restaurants';
                ionicMaterialInk.displayEffect();
            });

            $rootScope.valById = function (arr, id) {
                return valById(arr, id);
            };

            //FilterMenu Settings
            $rootScope.filters = {
                toggles: {}
            };

            $rootScope.directionsSet = false;
            $rootScope.currentListingActive = false;

            $rootScope.cuisines = $rootScope.sorts = $rootScope.favorites = $rootScope.been = [];
            $rootScope.myLocation = {};

            //Load Favorites
            $localForage.getItem('favorites').then(function (data) {
                $rootScope.favorites = data;
            });

            //Load Been
            $localForage.getItem('been').then(function (data) {
                $rootScope.beens = data;
            });

            $rootScope.$on('$cordovaPush:tokenReceived', function (event, data) {
                console.log('Got token', data.token, data.platform);
                // Do something with the token
            });
        }
    ])

    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            'use strict';
            $stateProvider
                // Tabs
                .state('tabs', {
                    url: '/tab',
                    abstract: true,
                    templateUrl: 'views/common/tabs.html'
                })

                .state('tabs.dashboard', {
                    url: '/dashboard',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/dashboard/dashboard.html',
                            controller: 'DashboardCtrl'
                        }
                    }
                })
                .state('tabs.results', {
                    url: '/dashboard/search/:cuisine?search&takeout&delivery',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/listings/restaurants.html',
                            controller: 'RestaurantsCtrl'
                        }
                    }
                })
                .state('tabs.medleys', {
                    url: '/dashboard/medleys/:slug',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/listings/restaurants.html',
                            controller: 'RestaurantsCtrl'
                        }
                    }
                })
                .state('tabs.cuisines', {
                    url: '/dashboard/cuisines?search',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/dashboard/cuisines.html',
                            controller: 'CuisinesCtrl'
                        }
                    }
                })
                .state('tabs.cuisine', {
                    url: '/dashboard/cuisines/:id?search',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/listings/cuisine.html',
                            controller: 'CuisineCtrl'
                        }
                    }
                })
                // Cuisine Restaurant Pages
                .state('tabs.cuisine-restaurant', {
                    url: '/dashboard/cuisines/:cuisine_id/restaurants/:id',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/common/restaurant.html',
                            controller: 'RestaurantCtrl'
                        }
                    }
                })
                .state('tabs.cuisine-restaurant-map', {
                    url: '/dashboard/cuisines/:cuisine_id/restaurants/:id/map',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/common/restaurant-map.html',
                            params: [
                                'target'
                            ],
                            controller: 'RestaurantMapCtrl'
                        }
                    }
                })
                // Common Restaurant Pages
                .state('tabs.restaurant', {
                    url: '/dashboard/restaurants/:id',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/common/restaurant.html',
                            controller: 'RestaurantCtrl'
                        }
                    }
                })
                .state('tabs.restaurant-map', {
                    url: '/dashboard/restaurants/:id/map',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/common/restaurant-map.html',
                            params: [
                                'target'
                            ],
                            controller: 'RestaurantMapCtrl'
                        }
                    }
                })
                .state('tabs.restaurant-reviews', {
                    url: '/dashboard/restaurants/:id/reviews',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/common/restaurant-reviews.html',
                            controller: 'RestaurantReviewsCtrl'
                        }
                    }
                })
                .state('tabs.restaurant-gallery', {
                    url: '/dashboard/restaurants/:id/gallery',
                    views: {
                        'dashboard-tab': {
                            templateUrl: 'views/common/restaurant-gallery.html',
                            controller: 'RestaurantGalleryCtrl'
                        }
                    }
                })
                .state('tabs.favorites', {
                    url: '/favorites',
                    views: {
                        'favorites-tab': {
                            templateUrl: 'views/listings/favorites.html',
                            controller: 'FavoritesCtrl'
                        }
                    }
                })
                .state('tabs.favorite', {
                    url: '/favorites/:id',
                    views: {
                        'favorites-tab': {
                            templateUrl: 'views/common/restaurant.html',
                            controller: 'RestaurantCtrl'
                        }
                    }
                })
                .state('tabs.favorite-map', {
                    url: '/favorites/:id/map',
                    views: {
                        'favorites-tab': {
                            templateUrl: 'views/common/restaurant-map.html',
                            params: [
                                'target'
                            ],
                            controller: 'RestaurantMapCtrl'
                        }
                    }
                })

                .state('tabs.map', {
                    url: '/map',
                    views: {
                        'map-tab': {
                            templateUrl: 'views/map/map.html',
                            controller: 'MapCtrl'
                        }
                    }
                })
                .state('tabs.map-restaurant', {
                    url: '/map/:id',
                    views: {
                        'map-tab': {
                            templateUrl: 'views/common/restaurant.html',
                            controller: 'RestaurantCtrl'
                        }
                    }
                })

                // Account Tab
                .state('tabs.activity', {
                    url: '/activity',
                    views: {
                        'activity-tab': {
                            templateUrl: 'views/activity/feed.html',
                            controller: 'ActivityCtrl'
                        }
                    }
                })
                .state('tabs.account', {
                    url: '/activity/account',
                    views: {
                        'activity-tab': {
                            templateUrl: 'views/activity/account.html',
                            controller: 'AccountCtrl'
                        }
                    }
                })
                /*.state('tabs.restaurants', {
                 url: '/restaurants',
                 views: {
                 'restaurants-tab': {
                 templateUrl: 'restaurants/index.html',
                 controller: 'RestaurantsCtrl'
                 }
                 }
                 })*/
                /*.state('tabs.restaurant', {
                 url: '/restaurants/:id',
                 views: {
                 'restaurants-tab': {
                 templateUrl: 'restaurants/restaurant.html',
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
                    url: '/settings',
                    views: {
                        'settings-tab': {
                            templateUrl: 'views/settings/settings.html',
                            controller: 'SettingsCtrl'
                        }
                    }
                })
                .state('tabs.settings-account', {
                    url: '/settings/account',
                    views: {
                        'settings-tab': {
                            templateUrl: 'views/activity/account.html',
                            controller: 'AccountCtrl'
                        }
                    }
                })
                .state('tabs.usage', {
                    url: '/settings/usage',
                    views: {
                        'settings-tab': {
                            templateUrl: 'views/settings/usage.html',
                            controller: 'SettingsCtrl'
                        }
                    }
                })
                .state('tabs.faq', {
                    url: '/settings/faq',
                    views: {
                        'settings-tab': {
                            templateUrl: 'views/settings/faq.html',
                            controller: 'SettingsCtrl'
                        }
                    }
                })
                .state('tabs.terms', {
                    url: '/settings/terms',
                    views: {
                        'settings-tab': {
                            templateUrl: 'views/settings/terms.html',
                            controller: 'SettingsCtrl'
                        }
                    }
                })
                .state('tabs.privacy', {
                    url: '/settings/privacy',
                    views: {
                        'settings-tab': {
                            templateUrl: 'views/settings/privacy.html',
                            controller: 'SettingsCtrl'
                        }
                    }
                })

                // Splash
                .state('splash', {
                    url: '/splash',
                    templateUrl: 'views/splash/splash.html',
                    controller: 'SplashCtrl'
                })
                .state('intro', {
                    url: '/intro',
                    templateUrl: 'views/splash/intro.html',
                    controller: 'IntroCtrl'
                })

                // Sign In
                .state('signin', {
                    url: '/sign-in',
                    templateUrl: 'views/sign-in/sign-in.html',
                    controller: 'SignInCtrl'
                })
                .state('login', {
                    url: '/log-in',
                    templateUrl: 'views/sign-in/log-in.html',
                    controller: 'LoginCtrl'
                })
                .state('getStarted', {
                    url: '/get-started',
                    templateUrl: 'views/sign-in/sign-in.html',
                    controller: 'SignInCtrl'
                })
                .state('createaccount', {
                    url: '/forgot-password',
                    templateUrl: 'views/sign-in/create-account.html',
                    controller: 'CreateAccountCtrl'
                })
                .state('forgotpassword', {
                    url: '/forgot-password',
                    templateUrl: 'views/sign-in/forgot-password.html',
                    controller: 'ForgotCtrl'
                });

            // if none of the above states are matched, use this as the fallback
            //$urlRouterProvider.otherwise('/sign-in');
            $urlRouterProvider.otherwise('/dashboard');

        }
    ]);
