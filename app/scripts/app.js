var valById = function (arr, id) {
    'use strict';
    return _.find(arr, function (a) {
        return parseFloat(a.id) === parseFloat(id);
    });
};

angular.module('tabletops', ['ionic', 'ionic.service.core'/*, 'ionic.service.analytics'*/, 'ionic.service.deploy', 'ionic.service.push', 'underscore', 'ionic.rating', 'ionic.resetfield', 'ngResource', 'ngCordova', 'LocalForageModule', 'leaflet-directive', 'http-auth-interceptor', 'tabletops.config', 'tabletops.controllers', 'tabletops.directives', 'tabletops.services'])

    .run(['$rootScope', '$ionicPlatform', '$ionicLoading', '$ionicDeploy', '$localForage', function ($rootScope, $ionicPlatform, $ionicLoading, $ionicDeploy, $localForage) {
        'use strict';
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

        /*$ionicDeploy.watch().then(function () {
         }, function () {

         },
         function (hasUpdate) {
         // Handle response
         });*/

        $rootScope.$on('$stateChangeSuccess', function (e, toState/*, toParams, fromState, fromParams, a*/) {
            //console.log('To: ', toState);
            //console.log('Params: ', fromParams);
            $rootScope.filtersMenu = toState.name === 'restaurants';
            ionic.material.ink.displayEffect();
        });

        $rootScope.valById = function (arr, id) {
            return valById(arr, id);
        };

        //FilterMenu Settings
        $rootScope.filters = {
            toggles: {}
        };
        $rootScope.directionsSet = false;

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

        $rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
            console.log('Got token', data.token, data.platform);
            // Do something with the token
        });
    }])

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
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
                url: '/dashboard/search?search',
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
            .state('tabs.cuisine-restaurant', {
                url: '/dashboard/cuisines/:cuisine_id/restaurants/:id',
                views: {
                    'dashboard-tab': {
                        templateUrl: 'views/common/restaurant.html',
                        controller: 'RestaurantCtrl'
                    }
                }
            })
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
                        controller: 'RestaurantCtrl'/*,
                         resolve: {
                         listing: function (Listing, $stateParams, $http) {
                         return $http.get('http://flamingo.gorigins.com/api/v1/listings/' + $stateParams.id)
                         }
                         }*/
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

            // Account Tab
            .state('tabs.account', {
                url: '/account',
                views: {
                    'account-tab': {
                        templateUrl: 'views/account/account.html',
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

            // Sign In
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
            .state('signin', {
                url: '/sign-in',
                templateUrl: 'views/sign-in/sign-in.html',
                controller: 'SignInCtrl'
            })
            .state('getStarted', {
                url: '/get-started',
                templateUrl: 'views/sign-in/sign-in.html',
                controller: 'SignInCtrl'
            })
            .state('forgotpassword', {
                url: '/forgot-password',
                templateUrl: 'views/sign-in/forgot-password.html'
            });

        // if none of the above states are matched, use this as the fallback
        //$urlRouterProvider.otherwise('/tab/dashboard');
        //$urlRouterProvider.otherwise('/sign-in');
        $urlRouterProvider.otherwise('/splash');

    }]);
