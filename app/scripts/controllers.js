function closestLocation(targetLocation, locationData) {
    'use strict';
    function vectorDistance(dx, dy) {
        return Math.sqrt(dx * dx + dy * dy);
    }

    function locationDistance(location1, location2) {
        var dx = (location1.latitude || location1.lat) - (location2.latitude || location2.lat),
            dy = (location1.longitude || location1.lng) - (location2.longitude || location2.lng);

        return vectorDistance(dx, dy);
    }

    return window._.reduce(locationData, function (prev, curr) {
        var prevDistance = locationDistance(targetLocation, prev),
            currDistance = locationDistance(targetLocation, curr);
        return (prevDistance < currDistance) ? prev : curr;
    });
}

(function () {
    'use strict';
    angular.module('tabletops.controllers', [])
        // Shared Controllers
        .controller('MainCtrl', MainController)
        .controller('LogoutCtrl', LogoutController)
        .controller('RestaurantCtrl', RestaurantController)
        .controller('RestaurantMapCtrl', RestaurantMapController)
        .controller('MapBoxMapCtrl', MapBoxMapController)
        // Search Tab Controllers
        .controller('DashboardCtrl', DashboardController)
        .controller('SearchCtrl', SearchController)
        .controller('RestaurantsCtrl', RestaurantsController)
        // Favorites Tab Controllers
        .controller('FavoritesCtrl', FavoritesController)
        // Settings Tab Controllers
        .controller('AccountCtrl', AccountController)
        .controller('SettingsCtrl', SettingsController)
        // Other Controllers
        .controller('CuisinesCtrl', CuisinesController)
        .controller('CuisineCtrl', CuisineController);

    MainController.$inject = ['$rootScope', '$scope', '$ionicPlatform', '$ionicScrollDelegate', '$cordovaNetwork', '$cordovaGeolocation', '$state', '$localForage', 'Province', 'ListingRepository', '$ionicModal', '$timeout', '_', 'ionicMaterialInk', 'AuthenticationService', '$ionicUser', '$q', '$window', '$ionicAnalytics'];
    function MainController($rootScope, $scope, $ionicPlatform, $ionicScrollDelegate, $cordovaNetwork, $cordovaGeolocation, $state, $localForage, Province, ListingRepository, $ionicModal, $timeout, _, ionicMaterialInk, AuthenticationService, $ionicUser, $q, $window, $ionicAnalytics) {
        $rootScope.isIOS = ionic.Platform.isIOS();
        $rootScope.isIPad = ionic.Platform.isIPad();
        $rootScope.isAndroid = ionic.Platform.isAndroid();

        $rootScope.hasHeaderFabRight = false;
        $rootScope.hasHeaderFabLeft = false;
        $rootScope.isExpanded = true;

        // Handle Settings
        $rootScope.settings = {
            geolocation: false,
            lastGeolocation: navigator.geolocation.lastPosition,
            province: {},
            analytics: true
        };

        $rootScope.$watchCollection('settings', function (newValues, oldValues) {
            $ionicUser.set('settings', newValues);
        });

        $localForage.getItem('analytics').then(function (a) {
            if (angular.isUndefined(a) || !!a) {
                $localForage.setItem('analytics', true);
                $ionicAnalytics.register();
                $rootScope.settings.analytics = true;
            } else {
                $localForage.setItem('analytics', false);
                $rootScope.settings.analytics = false;
            }
        });

        $localForage.getItem('province').then(function (data) {
            if (angular.isObject(data)) {
                $rootScope.settings.province = data;
            } else {
                $rootScope.settings.province =  {
                    country_id: 1,
                    created_at: "2015-04-10 01:52:53",
                    id: 15,
                    lat: 25.033965,
                    lng: -77.35176,
                    name: "New Providence / Paradise Island",
                    slug: "np-pi",
                    updated_at: "2015-04-10 01:55:28"
                };
            }
        });

        $rootScope.isOnline = function () {
            var isConnected = false;

            if (angular.isDefined(navigator.connection)) {
                var networkConnection = navigator.connection;
                if (!networkConnection || !networkConnection.type) {
                    console.error('networkConnection.type is not defined');
                    return false;
                }

                switch (networkConnection.type.toLowerCase()) {
                    case 'ethernet':
                    case 'wifi':
                    case 'cell_2g':
                    case 'cell_3g':
                    case 'cell_4g':
                    case '2g':
                    case '3g':
                    case '4g':
                    case 'cell':
                    case 'cellular':
                        isConnected = true;
                        break;
                }
            } else {
                isConnected = true;
            }

            console.log('isOnline? ' + isConnected);
            return isConnected;
        };

        $scope.appReadyInit = function () {
            console.log('We Ready Now!');

            // Handle Network Status
            $rootScope.connectionState = $rootScope.isOnline();

            // listen for Online event
            $rootScope.$on('$cordovaNetwork:online', function () {
                console.log('App Online');
                $rootScope.connectionState = true;
            });

            // listen for Offline event
            $rootScope.$on('$cordovaNetwork:offline', function () {
                console.log('App Offline');
                $rootScope.connectionState = false;
            });

            $rootScope.directionsExist = angular.isDefined($window.directions);
            $rootScope.canInviteFacebook = $window.facebookConnectPlugin && angular.isFunction($window.facebookConnectPlugin.appInvite);

            // Check that app user is within The Bahamas
            var myPosition = angular.isDefined(navigator.geolocation.lastPosition) ? [navigator.geolocation.lastPosition.coords.latitude, navigator.geolocation.lastPosition.coords.longitude] : false;
            if(myPosition) {
                $rootScope.withinRegion = turf.inside({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": myPosition
                    },
                }, {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [[[[-77.53466, 23.75975], [-77.78, 23.71], [-78.03405, 24.28615], [-78.40848, 24.57564], [-78.19087, 25.2103], [-77.89, 25.17], [-77.54, 24.34], [-77.53466, 23.75975]]], [[[-77.82, 26.58], [-78.91, 26.42], [-78.98, 26.79], [-78.51, 26.87], [-77.85, 26.84], [-77.82, 26.58]]], [[[-77, 26.59], [-77.17255, 25.87918], [-77.35641, 26.00735], [-77.34, 26.53], [-77.78802, 26.92516], [-77.79, 27.04], [-77, 26.59]]]]
                    }
                });
            } else {
                $rootScope.withinRegion = false;
            }


            if ($rootScope.withinRegion) {
                // Handle Geolocation
                var watch = $cordovaGeolocation.watchPosition({
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 29999
                });
                watch.then(
                    null,
                    function (err) {
                        // error
                        //console.log(err);
                    },
                    function (position) {
                        //console.log(position);
                        $rootScope.settings.geolocation = $rootScope.myLocation = position;
                    });
            } else {
                console.log('You\'re not in The Bahamas');
            }

            // Handle Authentication
            AuthenticationService.authCheck();

            //Check for Facebook App
            AuthenticationService.FbAppAvailable()
                .then(function () {
                    $scope.hasFacebook = true;
                }, function () {
                    $scope.hasFacebook = false;
                });

        };

        $ionicPlatform.ready(function () {
            $scope.appReadyInit();
        });

        $scope.selectProvinces = function () {
            $localForage.getItem('provinces').then(function (data) {
                $scope.provinces = angular.isDefined(data) ? data : Province.query({}, function (res) {
                    $scope.provinces = res;
                    $localForage.setItem('provinces', res);
                    return $scope.toggleRight();
                });
            });
        };

        $scope.presetProvince = function () {
            $localForage.getItem('province').then(function (province) {
                console.log('Province: ', province);
                $scope.selectedProvince = $rootScope.settings.province = province;
            });
        };

        $scope.getProvinces = function () {
            var deferred = $q.defer();
            Province.query({}, function (res) {
                $scope.provinces = res;
                $localForage.setItem('provinces', res);
                deferred.resolve(res);
            });

            return deferred.promise;
        };

        $localForage.getItem('provinces').then(function (data) {
            if (angular.isArray(data) && !!data.length) {
                $scope.provinces = data;
                $scope.presetProvince();
            } else {
                $scope.provinces = $scope.getProvinces().then(function () {
                    $scope.setProvince({
                        "id": "15",
                        "name": "New Providence / Paradise Island",
                        "slug": "np-pi",
                        "country_id": "1",
                        "created_at": "2015-04-10 09:52:53",
                        "updated_at": "2015-04-10 09:55:28",
                        "lat": 25.033965,
                        "lng": -77.35176
                    });
                });
            }
        });

        $scope.setProvince = function (p) {
            $rootScope.settings.province = p;
            $scope.selectedProvince = p;
            $localForage.setItem('province', p);
            $scope.closeProvinceModal();
            $scope.$broadcast('province:set', p);
        };

        $scope.setProvinceSilent = function (p) {
            $rootScope.settings.province = p;
            $scope.selectedProvince = p;
            $localForage.setItem('province', p);
            $scope.$broadcast('province:set:silent', p);
        };

        $scope.findClosest = function (targetLocation, locations) {
            var closest = closestLocation(targetLocation, locations);
            console.log(closest);
            return closest;
        };

        $scope.selectClosestProvince = function () {
            var closest = angular.isDefined($rootScope.settings.geolocation) ? $scope.findClosest($rootScope.settings.geolocation.coords, $scope.provinces) : $scope.findClosest($rootScope.settings.lastGeolocation.coords, $scope.provinces);
            $scope.setProvince(closest);
        };

        $scope.shareThis = function (obj, e) {
            ListingRepository.share(obj, e);
        };

        $scope.favoriteThis = function (obj) {
            ListingRepository.favorite(obj);
        };

        $scope.faved = function (id) {
            return _.contains($rootScope.favorites, id);
        };

        $scope.visited = function (id) {
            return _.contains($rootScope.beens, id);
        };

        $scope.beenHere = function (obj) {
            ListingRepository.been(obj);
        };

        $scope.showDollars = function (range, noIcon) {
            return ListingRepository.showDollars(range, noIcon);
        };

        $scope.showStars = function (count, rating, text) {
            return ListingRepository.showStars(count, rating, text);
        };

        $scope.initCaller = function (obj) {
            ListingRepository.initCaller(obj);
        };

        $scope.callLocation = function (locations, index) {
            ListingRepository.callLocation(locations, index);
        };

        $scope.scrollTop = function () {
            $ionicScrollDelegate.scrollTop();
        };

        $scope.scrollHandleTop = function (handle) {
            $ionicScrollDelegate.$getByHandle(handle).scrollTop();
        };

        $scope.toState = function (state, args) {
            $state.go(state, args||null);
        };

        $scope.isState = function (state) {
            return $state.is(state);
        };

        $scope.$on('event:auth-loginConfirmed', function () {
            $rootScope.isLoggedin = true;
        });

        // Province Modal
        $ionicModal.fromTemplateUrl('views/common/ProvinceModal.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.provModal = modal;
        });

        $scope.openProvinceModal = function ($event) {
            $scope.provModal.show($event)
                .then(function () {
                    $scope.presetProvince();
                    // Set Ink
                    ionicMaterialInk.displayEffect();
                });
        };
        $scope.closeProvinceModal = function () {
            $scope.provModal.hide();
        };

        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.provModal.remove();
            $scope.reportModal.remove();
        });

        $scope.$on('$ionicView.enter', function () {
            $timeout(function () {
                console.log('Set Ink');
                // Set Ink
                ionicMaterialInk.displayEffect();
            }, 300);
        });
    }
    LogoutController.$inject = ['$scope', 'AuthenticationService'];
    function LogoutController($scope, AuthenticationService) {
        var self = this;

        $scope.$on('$ionicView.enter', function () {
            AuthenticationService.logout();
        });
    }
    DashboardController.$inject = ['$rootScope', '$scope', 'Province', 'Listing', '$state', '$interval', '$ionicModal', '$timeout', '$localForage', '_', 'ionicMaterialInk', '$ionicSlideBoxDelegate'];
    function DashboardController($rootScope, $scope, Province, Listing, $state, $interval, $ionicModal, $timeout, $localForage, _, ionicMaterialInk, $ionicSlideBoxDelegate) {
        $scope.init = function () {
            $timeout(function () {
                if(angular.isObject($rootScope.settings.province)) {
                    $scope.getNearby();
                    $scope.dashSlider = $ionicSlideBoxDelegate.$getByHandle('DashboardSlider');
                } else {
                    $scope.init();
                }
            }, 300);
        };

        $scope.init();

        $scope.getNearby = function () {
            $scope.qData = {app_search: true, range: 5, limit: 5};
            if (angular.isDefined($rootScope.settings.geolocation) && angular.isObject($rootScope.settings.geolocation.coords)) {
                angular.extend($scope.qData, {
                    lat: $rootScope.settings.geolocation.coords.latitude,
                    lng: $rootScope.settings.geolocation.coords.longitude
                });
            } else {
                angular.extend($scope.qData, {
                    lat: $rootScope.settings.province.lat,
                    lng: $rootScope.settings.province.lng
                });
            }
            $scope.restaurants = Listing.query($scope.qData);
            $scope.restaurants.$promise.finally(function () {
                $scope.$broadcast('scroll.refreshComplete');
                $scope.dashSlider.update();
                $scope.dashSlider.loop(true);
                //console.log($scope.slider);
                $timeout(function () {
                    $scope.dashSlider.update();
                }, 300);
            });
        };

        $scope.$watch('myLocation', function (newValue, oldValue) {
            if (angular.isUndefined(oldValue) && angular.isDefined(newValue)) {
                var stopNearby = $interval($scope.getNearby(), 600000);

                $scope.$on('$destroy', function () {
                    $interval.cancel(stopNearby);
                });
            }
        });

        $scope.$on('province:set', function (event, p) {
            console.log(p);
            $scope.getNearby();
        });

        // TODO Make list dynamic
        var cuisines = [
            {img: 'img/cuisines/bahamian.jpg', slug: 'bahamian'},
            {img: 'img/cuisines/italian.jpg', slug: 'italian'},
            {img: 'img/cuisines/steakhouse.jpg', slug: 'steakhouse'},
            {img: 'img/cuisines/chinese.jpg', slug: 'chinese'},
            {img: 'img/cuisines/burgers.jpg', slug: 'burgers'},
            {img: 'img/cuisines/all.jpg', slug: ''}
        ];
        $scope.cuisines_1 = [];
        $scope.cuisines_2 = [];

        for (var i = 0; i < cuisines.length; i++) {
            if ((i + 2) % 2 === 0) {
                $scope.cuisines_1.push(cuisines[i]);
            } else {
                $scope.cuisines_2.push(cuisines[i]);
            }
        }

        $scope.toRestaurant = function (id, array) {
            var obj = _.findWhere(array, {slug: id});
            $localForage.setItem('currentListing', obj).then(function () {
                $scope.$broadcast('loading:show');
                $state.go('tabs.restaurant', {id: id});
            });
        };

        $scope.startSearch = function () {
            $state.go('tabs.results', {search: this.search});
        };

        $scope.getWidth = function () {
            return document.getElementById('dashboard').offsetWidth - 21;
        };

        $timeout(function () {
            document.getElementById('fab-search').classList.toggle('on');
        }, 1100);

        // Search Modal
        $ionicModal.fromTemplateUrl('views/dashboard/SearchModal.html', {
            scope: $scope,
            focusFirstInput: true,
            //animation: 'am-fade-and-scale'
        }).then(function (modal) {
            $scope.SearchModal = modal;
        });

        $scope.openSearchModal = function ($event) {
            $scope.SearchModal.show($event)
                .then(function () {
                    // Set Ink
                    ionicMaterialInk.displayEffect();
                });
        };
        $scope.closeSearchModal = function () {
            $scope.SearchModal.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.SearchModal.remove();
            $rootScope.hasHeaderFabRight = false;
        });

        $scope.$on('$ionicView.enter', function () {
            $rootScope.hasHeaderFabRight = true;
        });

        $scope.$on('$ionicView.leave', function () {
            $rootScope.hasHeaderFabRight = false;
        });

        // Set Ink
        ionicMaterialInk.displayEffect();

        $scope.selectedProvinceTitle = function () {
            return $scope.selectedProvince !== null ? $scope.selectedProvince : 'Select Province';
        };
    }
    FavoritesController.$inject = ['$scope', '$localForage', 'Listing', '$ionicModal', '$state', '_', '$ionicFilterBar', '$filter'];
    function FavoritesController($scope, $localForage, Listing, $ionicModal, $state, _, $ionicFilterBar, $filter) {

        $scope.refresh = function () {
            $localForage.getItem('favorites').then(function (data) {
                console.log("Favorites: ", data);
                if (data && data.length > 0) {
                    Listing.query({ids: angular.toJson(data)}, function (res) {
                        $scope.faves = res;
                        $scope.$broadcast('scroll.refreshComplete');
                    }, function (res) {
                        console.log(res);
                        $scope.$broadcast('scroll.refreshComplete');
                    });
                } else {
                    $scope.$broadcast('scroll.refreshComplete');
                }
            });
        };

        $scope.showFilterBar = function () {
            $scope.filterBarInstance = $ionicFilterBar.show({
                items: $scope.faves,
                update: function (filteredItems) {
                    $scope.faves = filteredItems;
                }
            });
        };

        $scope.toFavorite = function (id) {
            var obj = _.findWhere($scope.faves, {slug: id});
            $localForage.setItem('currentListing', obj).then(function () {
                $scope.$broadcast('loading:show');
                $state.go('tabs.favorite', {id: id});
            });
        };

        $scope.$on('$ionicView.enter', function (event) {
            $scope.refresh();
        });

        // FiltersModal
        $ionicModal.fromTemplateUrl('views/common/filtersModal.html', {
            scope: $scope,
            //animation: 'am-fade-and-scale'
        }).then(function (modal) {
            $scope.modal = modal;
        });
        $scope.openFiltersModal = function () {
            $scope.modal.show();
        };
        $scope.closeFiltersModal = function () {
            $scope.modal.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.modal.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hidden', function () {
            // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function () {
            // Execute action
        });

    }
    SearchController.$inject = ['$rootScope', '$scope', 'Listing', 'Cuisine', '$stateParams', '$ionicModal', '$localForage', 'ionicMaterialInk', 'ionicMaterialMotion', '$ionicSlideBoxDelegate', '$timeout', '_', '$filter'];
    function SearchController($rootScope, $scope, Listing, Cuisine, $stateParams, $ionicModal, $localForage, ionicMaterialInk, ionicMaterialMotion, $ionicSlideBoxDelegate, $timeout, _, $filter) {

        /*$scope.refresh = function () {
         $scope.$broadcast('refresh:start');
         };*/
        $scope.currentView = $stateParams.view === 'map' ? 'map' : 'list';
        $scope.toggleView = function () {
            $scope.currentView = $scope.currentView === 'list' ? 'map' : 'list';
            $timeout(function () {
                $scope.$broadcast('searchView:changed', $scope.currentView);
            }, 300);

        };

        $scope.model = {
            restaurants: [],
            loaded: false,
            timeout: false
        };

        $scope.refresh = _.throttle(function () {
            $scope.model.loaded = false;
            $scope.model.timeout = false;
            $localForage.getItem('province').then(function (province) {
                $scope.$broadcast('province:set:silent', province);
                if (!angular.isObject(province)) {
                    $scope.openProvinceModal();
                    return false;
                }

                if (angular.isDefined($scope.myLocation) && angular.isObject($scope.myLocation.coords)) {
                    angular.extend($scope.filters, {
                        lat: $scope.myLocation.coords.latitude,
                        lng: $scope.myLocation.coords.longitude
                    });
                }

                var filtersCopy = angular.copy($scope.filters);
                filtersCopy.cuisine = angular.isDefined(filtersCopy.cuisine) ? filtersCopy.cuisine.toString() : undefined;
                delete filtersCopy.sort;

                var results = Listing.query(filtersCopy);
                results.$promise.then(function () {
                    $scope.model.loaded = true;
                    var filtered = $filter('filter')(results, $scope.filters.search);
                    filtered = $filter('orderBy')(filtered, $scope.filters.sort);
                    $scope.model.restaurants = filtered;
                    $timeout(function () {
                        // Set Ink
                        ionicMaterialMotion.blinds();

                        ionicMaterialInk.displayEffect();
                    }, 300);
                    $scope.$broadcast('scroll.refreshComplete');
                }).then(function () {
                    $timeout(function () {
                        $scope.model.timeout = true;
                    }, 3000);
                });
            });
        }, 3000);

        $scope.refresh();

        $scope.resetFilters = function () {
            $scope.filters = {
                app_search: true,
                search: undefined,
                province: $rootScope.settings.province ? $rootScope.settings.province.slug : undefined,
                province_id: $rootScope.settings.province ? $rootScope.settings.province.id : undefined,
                sort: 'name',
                cuisine: undefined,
                price_range: undefined,
                type: undefined,
                wifi: undefined,
                live_music: undefined,
                takeout: undefined,
                delivery: undefined,
                disability: undefined,
                outdoor_seating: undefined,
                reservations_preferred: undefined
            };
            $scope.refresh();
        };

        $scope.filters = {
            app_search: true,
            search: $stateParams.search || undefined,
            province: $rootScope.settings.province ? $rootScope.settings.province.slug : undefined,
            province_id: $rootScope.settings.province ? $rootScope.settings.province.id : undefined,
            sort: 'name',
            cuisine: $stateParams.cuisine || undefined,
            price_range: undefined,
            type: undefined,
            wifi: undefined,
            live_music: undefined,
            takeout: $stateParams.takeout || undefined,
            delivery: $stateParams.delivery || undefined,
            disability: undefined,
            outdoor_seating: undefined,
            reservations_preferred: undefined,
            open_now: undefined
        };

        $scope.toggles = [
            {icon: 'ion-clock ', name: 'Open Now', slug: 'open_now', value: undefined},
            {icon: 'ion-wifi', name: 'Wi-fi', slug: 'wifi', value: undefined},
            {icon: 'ion-music-note', name: 'Live Music', slug: 'live_music', value: undefined},
            {icon: 'ion-ios-telephone', name: 'Takeout', slug: 'takeout', value: undefined},
            {icon: 'ion-model-s', name: 'Delivery', slug: 'delivery', value: undefined},
            {icon: 'ion-help-buoy', name: 'Handicap Accessible', slug: 'disability', value: undefined},
            {icon: 'ion-ios-sunny', name: 'Outdoor Seating', slug: 'outdoor_seating', value: undefined},
            {
                icon: 'ion-checkmark ',
                name: 'Reservations Pref/Only',
                slug: 'reservations_preferred',
                value: undefined
            },
        ];

        $scope.togglePriceRange = function (newValue) {
            if (parseInt($scope.filters.price_range) !== parseInt(newValue)) {
                $scope.filters.price_range = newValue;
            } else {
                $scope.filters.price_range = undefined;
            }
        };

        Cuisine.query({}, function (res) {
            $scope.cuisines = res;
            $scope.cuisineList = angular.copy(res);
        });

        $scope.sorts = [
            {name: 'Name', value: 'name'},
            {name: 'Price', value: 'restaurant.price_range'},
            {name: 'Highest Rating', value: '-rating_cache'},
            {name: 'Popularity', value: '-like_count'},
            //{ name: 'Most Reviewed', value:'-like_count'},
        ];

        // FiltersModal
        $ionicModal.fromTemplateUrl('views/common/filtersModal.html', {
            scope: $scope,
            //animation: 'am-fade-and-scale'
        }).then(function (modal) {
            $scope.modal = modal;
            $scope.filerModalSlider = $ionicSlideBoxDelegate.$getByHandle('modalSlider');
            $scope.filerModalSlider.enableSlide(false);
        });

        $scope.openFiltersModal = function () {
            $scope.filerModalSlider.slide(0);
            $scope.modal.show();
            $scope.$broadcast('filters:show');
        };

        $scope.closeFiltersModal = function (canceled) {
            canceled = canceled || false;
            console.log($scope.filters);
            if ($scope.filerModalSlider.currentIndex() === 0) {
                $scope.modal.hide();
                if (!canceled) {
                    $scope.refresh();
                }
                $scope.$broadcast('filters:hide');
            } else {
                $scope.filerModalSlider.slide(0);
                $scope.scrollHandleTop('modalSlider');
            }
        };

        $scope.toProvinceSelect = function () {
            $scope.filerModalSlider.slide(1);
        };

        $scope.toCuisineSelect = function () {
            $scope.filerModalSlider.slide(2);
        };

        $scope.$on('province:set', function (event, p) {
            console.log(p);
            $scope.filters.province = p.slug;
            $scope.filters.province_id = p.id;
            $scope.refresh();
        });

        $scope.$on('province:set:silent', function (event, p) {
            console.log(p);
            $scope.filters.province = p.slug;
            $scope.filters.province_id = p.id;
        });

        $scope.showFilterBar = function () {
            $scope.$broadcast('filterBar:show');
        };

        $scope.locateMe = function () {
            $scope.$broadcast('locateUser');
        };

    }
    RestaurantsController.$inject = ['$rootScope', '$scope', '$localForage', '$state', '_', 'ionicMaterialInk', '$ionicFilterBar'];
    function RestaurantsController($rootScope, $scope, $localForage, $state, _, ionicMaterialInk, $ionicFilterBar) {

        $scope.loaded = false;
        $scope.filterBarInstance = null;

        $scope.showFilterBar = function () {
            $scope.filterBarInstance = $ionicFilterBar.show({
                items: $scope.model.restaurants,
                update: function (filteredItems) {
                    $scope.model.restaurants = filteredItems;
                }
            });
        };

        $scope.$on('filterBar:show', function (event) {
            if ($scope.currentView === 'list') {
                $scope.showFilterBar();
            }
        });

        $scope.$on('$destroy', function () {
            $rootScope.sorts = [];
            $rootScope.filters = {};
        });

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function () {
            if (angular.isUndefined($scope.model)) {
                $scope.modal.remove();
            }
        });

        //$ionicSlideBoxDelegate.$getByHandle('modalSlider').next();

        $scope.toRestaurant = function (id) {
            var obj = _.findWhere($scope.model.restaurants, {slug: id});
            $localForage.setItem('currentListing', obj).then(function () {
                $rootScope.$emit('loading:show');
                //$rootScope.$broadcast('loading:show');
                $state.go('tabs.restaurant', {id: id});
            });
        };

        //force refresh on province change
        $scope.$on('$ionicView.enter', function () {
            $localForage.getItem('province').then(function (data) {
                if (data.slug !== $scope.filters.province) {
                    $scope.filters.province = data.slug;
                    $scope.refresh();
                }
            });
        });

        $scope.$on('filters:show', function (event) {

        });

        $scope.$on('filters:hide', function (event) {

        });

        $scope.$on('refresh:start', function (event) {
            $scope.refresh();
        });

        // Set Ink
        ionicMaterialInk.displayEffect();

    }
    RestaurantController.$inject = ['Restaurant', '$scope', 'Listing', '$ionicModal', '$state', '$stateParams', '$localForage', 'HoursDays', 'StartHours', 'EndHours', 'UserActions', 'ionicMaterialInk', 'Dialogs', '$q'];
    function RestaurantController(Restaurant, $scope, Listing, $ionicModal, $state, $stateParams, $localForage, HoursDays, StartHours, EndHours, UserActions, ionicMaterialInk, Dialogs, $q) {
        
        var self = this;
        /*$localForage.getItem('currentListing').then(function (data) {
            if (data && data.slug === $stateParams.id){
                init(data);
            } else {
                Listing.get({id: $stateParams.id}, function (data) {
                    init(data);
                });
            }
        });*/

        self.init = init;
        self.checkUser = checkUser;
        $scope.expandText = expandText;
        $scope.submitReview = submitReview;
        $scope.submitReport = submitReport;
        $scope.myReview = {
            max: 5,
            rate: 3,
            body: '',
            user_id: 0,
            facebook: false,
            google: false
        };
        $scope.myReport = {
            spelling: 0,
            number: 0,
            address: 0,
            is_closed: 0,
            services: 0,
            inappropriate: 0,
            other: 0,
            body: '',
            error: 0
        };

        function init (data) {
            $scope.listing = data;
            $scope.$broadcast('loading:hide');

            $scope.hoursDays = HoursDays;
            $scope.startHours = StartHours;
            $scope.endHours = EndHours;

            $scope.toggleThisGroup = function (group) {
                if ($scope.isGroupShown(group)) {
                    $scope.shownGroup = null;
                } else {
                    $scope.shownGroup = group;
                }
            };

            $scope.isGroupShown = function (group) {
                return $scope.shownGroup === group;
            };

            $scope.toMap = function (id) {
                id = id || null;
                $localForage.setItem('currentListing', $scope.listing).then(function () {
                    switch ($state.current.name) {
                        case 'tabs.favorite':
                            $state.go('tabs.favorite-map', {id: $scope.listing.slug, target: id});
                            break;
                        case 'tabs.cuisine-restaurant':
                            $state.go('tabs.cuisine-restaurant-map', {
                                id: $scope.listing.slug,
                                cuisine_id: $stateParams.cuisine_id,
                                target: id
                            });
                            break;
                        default:
                            $state.go('tabs.restaurant-map', {id: $scope.listing.slug, target: id});
                            break;
                    }
                });
            };

            $scope.toMapDirections = function (loc) {
                loc = loc || null;
                directions.navigateTo(loc.lat, loc.lng); // latitude, longitude
            };
            $scope.addPhotos = function () {
                var picture = UserActions.takePicture(data);
                console.log(picture);
            };

            // Review Modal
            $ionicModal.fromTemplateUrl('views/restaurants/review-modal.html', {
                scope: $scope,
                //animation: 'am-fade-and-scale'
            }).then(function (modal) {
                $scope.reviewModal = modal;
            });

            $scope.openReviewModal = function () {
                checkUser('post a review')
                    .then(function (res) {
                        $scope.reviewModal.show();
                    }, function (res) {

                    });
            };

            $scope.beenHereToggle = function () {
                checkUser('mark as been here')
                    .then(function (res) {
                        $scope.beenHere($scope.listing);
                    }, function (res) {

                    });
            };

            $scope.closeReviewModal = function () {
                $scope.reviewModal.hide();
            };

            // Image View Modal
            $ionicModal.fromTemplateUrl('views/restaurants/image-modal.html', {
                scope: $scope,
                //animation: 'am-fade-and-scale'
            }).then(function (modal) {
                $scope.imageModal = modal;
            });


            $scope.openModal = function () {
                $scope.imageModal.show();
            };
            $scope.closeModal = function () {
                $scope.imageModal.hide();
            };

            // Report Modal
            $ionicModal.fromTemplateUrl('views/common/ReportModal.html', {
                scope: $scope,
                //animation: 'am-fade-and-scale'
            }).then(function (modal) {
                $scope.reportModal = modal;
            });

            $scope.openReportModal = function ($event) {
                checkUser('submit a report').then(function (res) {
                    $scope.reportModal.show($event)
                        .then(function () {
                            // Set Ink
                            ionicMaterialInk.displayEffect();
                        });
                }, function (res) {

                });

            };
            $scope.closeReportModal = function () {
                $scope.reportModal.hide();
            };


            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.reviewModal.remove();
                $scope.imageModal.remove();
                $scope.isExpanded = false;
            });
            // Execute action on hide modal
            $scope.$on('modal.hidden', function () {
                // Execute action
                $scope.imageSrc = undefined;
            });
            // Execute action on remove modal
            $scope.$on('modal.removed', function () {
                // Execute action
            });

            $scope.showImage = function (photo) {
                $scope.imageSrc = photo;
                $scope.openModal();
            };
        }

        function checkUser (action) {
            var deferred_cu = $q.defer();
            $localForage.getItem('user').then(function (res) {
                if (angular.isObject(res)) {
                    $scope.myReview.user_id = $scope.myReport.user_id = res.id;
                    deferred_cu.resolve(true);
                } else {
                    console.log('No User Object available');
                    Dialogs.promptToLogin(action).then(function (res) {
                        deferred_cu.resolve(true);
                    }, function (res) {
                        deferred_cu.reject(false);
                    });
                }

            });
            return deferred_cu.promise;
        }

        function expandText() {
            var element = document.getElementsByTagName('textarea')[0];
            element.style.height = element.scrollHeight + 'px';
        }

        function submitReview() {
            var promise = UserActions.review($scope.listing, $scope.myReview);
            promise.$promise.then(function (data) {
                console.log(data);
                $scope.closeReviewModal();
            });
        }

        function submitReport() {
            console.log('submiting');
            // Minor Validation
            if (!!$scope.myReport.spelling || !!$scope.myReport.number || !!$scope.myReport.address || !!$scope.myReport.is_closed || !!$scope.myReport.services || !!$scope.myReport.inappropriate) {
                delete $scope.myReport.error;

                var promise = UserActions.report($scope.listing, $scope.myReport);
                promise.then(function (data) {
                    console.log(data);
                    if (data.status === 'success') {
                        $scope.closeReportModal();
                        $scope.myReport = {
                            spelling: 0,
                            number: 0,
                            address: 0,
                            is_closed: 0,
                            services: 0,
                            inappropriate: 0,
                            other: 0,
                            body: '',
                            error: 0
                        };
                    }
                });
            } else {
                $scope.myReport.error = true;
                return false;
            }
        }

        $scope.$on('$ionicView.leave', function () {
            $localForage.removeItem('currentListing');
        });

        init(Restaurant);

    }
    RestaurantMapController.$inject = ['$rootScope', '$scope', '$localForage', '_', 'GoogleMaps'];
    function RestaurantMapController($rootScope, $scope, $localForage, _, GoogleMaps) {


        $localForage.getItem('currentListing').then(function (listing) {
            $scope.listing = listing;

            //$scope.isAndroid = ionic.Platform.isAndroid();
            $scope.gMap = undefined;

            $scope.createMap = function () {
                $localForage.getItem('provinces').then(function (provinces) {
                    var province = _.findWhere(provinces, {id: $scope.listing.locations[0].province_id}) || $localForage.getItem('province');

                    //console.log($scope.gMap);
                    if (angular.isUndefined($scope.gMap)) {
                        console.log('Creating gMap');
                        // Set map div
                        $scope.mapDiv = document.getElementById('map');
                        // force $scope.mapDiv height to avoid tabs
                        //$scope.mapDiv.style.height = ($scope.mapDiv.offsetHeight - 49) + 'px';
                        ///$scope.gMap.setDiv($scope.mapDiv);

                        // Initialize the map plugin
                        $scope.gMap = GoogleMaps.Map.getMap($scope.mapDiv, {
                            'mapType': GoogleMaps.MapTypeId.ROADMAP,
                            'controls': {
                                'compass': false,
                                'myLocationButton': true,
                                'indoorPicker': true,
                                'zoom': false
                            },
                            'camera': {
                                'latLng': new GoogleMaps.LatLng(province.lat || 25.033965, province.lng || -77.35176),
                                'zoom': 11,
                            }
                        });


                        // You have to wait the MAP_READY event.
                        $scope.gMap.on(GoogleMaps.event.MAP_READY, function () {
                            // Load Listings restricted by province
                            $scope.loadListings();
                            $scope.gMap.setClickable(true);
                        });
                    } else {
                        $scope.gMap.setClickable(true);
                    }
                });
            };

            $scope.loadListings = function () {

                var infoClickFunc = function (marker) {
                    console.log(marker);
                    //scope.toRestaurant(marker.get("slug"));
                };

                for (var i = 0, len = $scope.listing.locations.length; i < len; i++) {
                    var loc = $scope.listing.locations[i];
                    $scope.gMap.addMarker({
                        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAwCAMAAADXYfGSAAACGVBMVEUODg5erw9esQ5fsA5fsQ1gsQ5gswxhtAtiswxitQpitQ1mvgZnvwX///8ODg5ktwxjtg0ODg5gswxmvgZmvgYODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4TFA8nQBNiswwfMBEiNBJjuAtgswxnvQdnvwVitQplvQdnvwUwURNgsQ48ahResQ4/bhNhtg1gswxitwxjuAtfsQ1QkhNnvwVhtAtmvAhmvgZmvgZnvwVnvwVgswxmvgZmvgZmvgZZoRFesQ5nvwVnvQdnvQdluQpitQ1ktwxnvwVhtAtfsQ1mvAhgswxcqBBjtg1dqw5nvwVluQpiswxcrBFluwlluwlgswxjuAtitQpnvwVnvwVlvQdnvwVnvQdkugpgsQ5erw9esQ5luwlnvwVmugpgswxluwlfsQ1itwxhtg1esQ5fsA5fsQ1gsQ5gswxhtAthtg1iswxitQpitQ1itwxjtg1juAtktwxkugpluQpluwllvQdmugpmvAhmvgZnvQdnvQtnvwVovBlvvSZ7xTZ7xTeAxj2CxkSExkWEyEWKyVOLyFWNyVWTzWCf0nGg0nOh03Wm1nqp14Cs14Ou2Yiv2oq13ZG+4J/A4aLB46PC46TD5KTG5arK5q/L57Hd78ve78ze787f78/g8NDg8NHn89vp9d/q9eDt9uPt9uTu9ub2+vL4+/T4/PT6/fj9/vv9/vz+/v3///87qQCJAAAAanRSTlMAAAAAAAAAAAAAAAAAAAICBAUFBwgPEBIVFhcYGRobHBwfICEjJSUmJiYoKDQ1N0FFRlVbXV5gYmNkZGV9iouOj5CTlJWZm52ho6Wls7W4wM/U1dna29/h4uXn6Onq7u/x8fT09fb2+fn7uoJOMwAAAjpJREFUeNpt0vdT02AAxvHXWto6EihaipQAsofs5UCWspGlsocgs1j3rNowFC1LloCIgwoO0Grfv9B3NU3TfH7I+97zvcs1dwUck5Jf3dR9s7upOj/lOMFxrCWWd0x6dZQnytv5zkm5zgtSO1HsUCo+eYy2i45AJbSddag5h1tCj4i9doozX/58nRGdr0SsJwG1S/g28fHfrvgdQvhD/PZ3awJPlzmQ3PUc+QDhthNizm0It/DUlQwKX2IeCF3LpC27IPSQrRDUkdON1p8eiOZf6OEmWx24ZsfWodw62a6DATvxSZY+02kADNspl5R22TIMBl9Qb9wsud+yZRD0PqWmFhZX1t6vrSwuTLGlFzQ/o+b3NleX3i2tbu7Ns6UZVLDbLPSaZUsFyHlMzUltji05IK6N3qY3dvYPfh/s72xM06EtDgRXPVFXFQy47NGHakazOcCFNDxS0xCCGpc5djfQWCb9v1Q+CFR5lLak9vtK7UlHcEMK7igV6PW4YTWKVKP3tZiWe3ItMQaDATcia+i2z1CWDsGNKpK1Ip1/C62XUn2o1Jj4VpZa43W+xuSO3MJGcrWUvGlrSavVqrSgtD6bzdaXFsTIm0ZTZrVayzRe3gYQjSa939qfrtqMpujG8cZok/Ew5Wu8WRCE0vFS9DTz/o2PEJC8G3n4OMX7tTABy7iaQc6wQ4jUIsmWeiWVnJEqLfZMLDktuCneGXU6SvFO9lt8Ini6yr+BMfNAatK3h1sES7jJCABr/wErzoeWTrAkSQAAAABJRU5ErkJggg==',
                        //icon: '/img/Cafe.png',
                        title: $scope.listing.name,
                        snippet: loc.address_1 + ' ' + loc.address_2,
                        position: new GoogleMaps.LatLng(loc.lat, loc.lng),
                        styles: {
                            'text-align': 'center',
                            'font-weight': 'bold'
                        },
                        //slug: $scope.listing.slug,
                        infoClick: infoClickFunc
                    });
                }
            };

            $scope.$on('$ionicView.enter', function (event) {
                console.log('entering');
                //var MView = document.getElementById('main-view');
                //MView.classList.toggle('bg-food');

                $scope.createMap();
            });

            $scope.$on('$ionicView.leave', function (event) {
                console.log('leaving');
                //$scope.gMap.removeEventListener($scope.gMap.event.MAP_WILL_MOVE);
                if (angular.isObject($scope.gMap)) {
                    $scope.gMap.setClickable(false);
                    $scope.gMap.remove();
                }
                $scope.gMap = undefined;

                //var MView = document.getElementById('main-view');
                //MView.classList.toggle('bg-food');

                //$scope.mapDiv.style.height = ($scope.mapDiv.offsetHeight + 49) + 'px';
            });
        });
    }
    MapBoxMapController.$inject = ['$rootScope', '$scope', '$localForage', '$state', '_' , '$window', '$ionicFilterBar', '$timeout'];
    function MapBoxMapController($rootScope, $scope, $localForage, $state, _, $window, $ionicFilterBar, $timeout) {
        var eventHandler = {};

        $scope.map = undefined;

        $scope.createMap = function () {
            $localForage.getItem('province').then(function (province) {
                $scope.province = province;
                // Provide your access token
                L.mapbox.accessToken = 'pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ';

                // Set map dimensions
                $scope.mapDiv = document.getElementById('map');
                $scope.mapDiv.style.width = ($window.screen.width) + 'px';
                $scope.mapDiv.style.height = document.getElementById('search-container').offsetHeight + 'px';

                // Create a map in the div #map
                $scope.map = L.mapbox.map('map', 'jgiovanni.lonlneon')
                    .setView([province.lat || 25.033965, province.lng || -77.35176], 11);
                $scope.map.attributionControl.removeFrom($scope.map);
                $scope.map.zoomControl.removeFrom($scope.map);

                $scope.myLayer = L.mapbox.featureLayer().addTo($scope.map);

                // Once we've got a position, zoom and center the map
                // on it, and add a single marker.
                $scope.map.on('locationfound', function (e) {
                    $scope.map.fitBounds(e.bounds);

                    $scope.myLayer.setGeoJSON({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [e.latlng.lng, e.latlng.lat]
                        },
                        properties: {
                            //'title': 'Here I am!',
                            'marker-color': '#ff8888',
                            'marker-symbol': 'star'
                        }
                    });
                });

                $scope.map.invalidateSize();
                $scope.loadListings();
            });
        };

        $scope.loadListings = function () {
            if (!$scope.map) {
                $timeout(function () {
                    $scope.createMap();
                }, 300);
                return false;
            }
            var restaurantGeoJSON = {
                type: 'FeatureCollection',
                features: []
            };

            if (!$scope.rLayer) {
                $scope.rLayer = L.mapbox.featureLayer().addTo($scope.map);

                // Add the iframe in a marker tooltip using the custom feature properties
                $scope.rLayer.on('layeradd', function(e) {
                    var marker = e.layer,
                        feature = marker.feature;

                    // Create custom popup content from the GeoJSON property 'video'
                    var popupContent =  feature.properties.tip;

                    // bind the popup to the marker http://leafletjs.com/reference.html#popup
                    marker.bindPopup(popupContent,{
                        closeButton: true,
                        minWidth: $window.screen.width - 10
                    });
                });
            }
            if ($scope.model.restaurants.length) {
                _.each($scope.model.restaurants, function (res) {
                    _.each(res.locations, function (loc) {
                        if (parseInt($scope.province.id) === parseInt(loc.province_id)) {
                            var cuisineString = '', distanceStr = '', locationsStr = '';
                            _.each(res.restaurant.cuisines, function (c) {
                                cuisineString += '<a href="#" class="subdued">' + c.name + '</a>';
                            });

                            if (res.locations.length === 1) {
                                locationsStr = '<span>' + res.quickParts.locations + '</span>';
                            } else if (res.locations.length > 1) {
                                locationsStr = '<span>' + res.quickParts.locations + '<br/>' +
                                    '<span style="font-size: 80%" class="subdued">' + res.quickParts.locationsMore + '</span>' +
                                    '</span>';
                            }

                            if (res.distance) {
                                distanceStr = '<span style="font-size: 80%" class="distance-badge badge badge-calm">' + res.quickParts.distance + '</span>';
                            }

                            restaurantGeoJSON.features.push({
                                type: 'Feature',
                                properties: {
                                    title: res.name,
                                    description: loc.address_1 + ', ' + loc.address_2,
                                    'marker-color': '#B71C1C',
                                    'marker-size': 'large',
                                    'marker-symbol': 'restaurant',
                                    tip: '<li class="item" data-ink-color="#B71C1C">' +
                                    '<h2 class="assertive-900">' + res.name + '</h2>' +
                                    '<p class="row row-no-padding">' +
                                    '<span class="col col-75 item-text-wrap">' +
                                    locationsStr +
                                    '<br/>' + distanceStr + '</span>' +
                                    '<span class="col col-25 text-right">' +
                                    '<span>' + $scope.showStars(res.rating_count, res.rating_cache) + '</span><br/>' +
                                    '<span>' + $scope.showDollars(res.restaurant.price_range) + '</span>' +
                                    '</span>' +
                                    '</p>' +
                                    '<p>' + cuisineString + '</p>' +
                                    '<a href="#/tab/dashboard/search/' + res.slug + '" class="button button-small button-flat button-positive">View</a>' +
                                        //'<a href="#/tab/dashboard/search/'+res.slug+'" class="button button-small flat icon-left ion-navigate ">Directions</a>' +
                                    '</li>'
                                },
                                geometry: {
                                    type: 'Point',
                                    coordinates: [loc.lng, loc.lat]
                                }
                            });
                        }
                    });
                });

                console.log(restaurantGeoJSON);
                $scope.rLayer.setGeoJSON(restaurantGeoJSON);

                $scope.map.fitBounds($scope.rLayer.getBounds());
            }
        };

        $scope.toRestaurant = function (slug) {
            console.log('going to: ', slug);
            var obj = _.findWhere($scope.model.restaurants, {slug: slug});
            $localForage.setItem('currentListing', obj).then(function () {
                $scope.$broadcast('loading:show');
                $state.go('tabs.restaurant', {id: slug});
            });
        };

        $scope.openMapProvinceModal = function ($event) {
            $scope.openProvinceModal($event);
        };

        $scope.showFilterBar = function () {
            $scope.filterBarInstance = $ionicFilterBar.show({
                items: $scope.model.restaurants,
                update: function (filteredItems) {
                    $scope.model.restaurants = filteredItems;
                    // TODO remove markers from map during filter
                    $scope.loadListings();
                }
            });
            $scope.$broadcast('filters:show');
        };

        eventHandler.locateUser = $scope.$on('locateUser', function (event) {
            $scope.map.locate();
        });

        eventHandler.filterBarShow = $scope.$on('filterBar:show', function (event) {
            if ($scope.currentView === 'map') {
                $scope.showFilterBar();
            }
        });

        eventHandler.refreshComplete = $scope.$on('scroll.refreshComplete', function (event) {
            $scope.loadListings();
        });

        eventHandler.searchView = $scope.$on('searchView:changed', function (event, view) {
            console.log('entering');
            if (view === 'map') {
                $scope.createMap();
            }
        });

        $scope.$on('$ionicView.leave', function (event) {
            console.log('leaving');
            $scope.map.remove();
        });

        eventHandler.provinceSet = $scope.$on('province:set', function (event, p) {
            console.log(p);
        });

        eventHandler.provinceSetSilent = $scope.$on('province:set:silent', function (event, p) {
            $scope.province = p;
        });

        eventHandler.filtersShow = $scope.$on('filters:show', function (event) {
            console.log('filters shown');
        });

        eventHandler.filtersHide = $scope.$on('filters:hide', function (event) {
            console.log('filters hiddem');
        });

        eventHandler.refreshStart = $scope.$on('refresh:start', function (event) {
            console.log('refresh started');

            /*if (angular.isDefined($scope.gMap)) {
             $scope.gMap.setClickable(true);
             }*/
        });

        $scope.$on('$destroy', function (event) {
            eventHandler.locateUser();
            eventHandler.filterBarShow();
            eventHandler.refreshComplete();
            eventHandler.provinceSet();
            eventHandler.provinceSetSilent();
            eventHandler.filtersShow();
            eventHandler.filtersHide();
            eventHandler.refreshStart();
        });
    }
    AccountController.$inject = ['$scope', '$localForage', '$cordovaFacebook', '$timeout', '_', '$http', 'ionicMaterialMotion', 'UserActions', 'AuthenticationService'];
    function AccountController($scope, $localForage, $cordovaFacebook, $timeout, _, $http, ionicMaterialMotion, UserActions, AuthenticationService) {
        var eventHandler = {};

        $localForage.getItem('user').then(function (res) {
            $scope.user = res;
            $scope.facebookProfile = _.findWhere(res.profiles, {provider: 'Facebook'});
            $scope.liveProfile = _.findWhere(res.profiles, {provider: 'Live'});
            $scope.GoogleProfile = _.findWhere(res.profiles, {provider: 'Google'});

            $scope.friends = _.union(res.followers, res.following);
            console.log($scope.friends);


            // Has Facebook capabilities
            if (angular.isObject($scope.facebookProfile)) {
                $scope.useFacebook = true;

                $localForage.getItem('providerToken').then(function (token) {
                    // Get Friends Using App
                    //$cordovaFacebook.api('me/friends?fields=name,id,picture.width(200)&access_token=' + token)
                    $cordovaFacebook.api('me/friends?fields=name,id&access_token=' + token)
                        .then(function (res) {
                            $scope.FBfriends = res.data;
                            $scope.FBfriendIds = _.pluck($scope.FBfriends, 'id');
                            _.each(_.filter($scope.friends, function (a) {
                                return !!a.target.avatar;
                            }), function (a, b) {
                                if (_.contains($scope.FBfriendIds, a.target.avatar.split('/')[3])) {
                                    a.facebook = true;
                                }
                            });
                        });

                    // Get Cover Photo
                    $http.get($scope.facebookProfile.coverInfoURL.split('access_token=')[0] + 'access_token=' + token)
                        .success(function (res) {
                            $scope.coverPhoto = res.cover.source;
                            console.log(res);
                        });
                });
            } else {
                $scope.coverPhoto = 'img/bgs/pro.jpg';
            }
        });

        $scope.inviteFbFriends = function () {
            return UserActions.inviteFb();
        };

        $scope.logout = function () {
            AuthenticationService.logout().then(function (res) {
                $scope.toState('tabs.settings');
            });
        };


        // Set Motion
        $timeout(function () {
            ionicMaterialMotion.slideUp({
                selector: '.slide-up'
            });
        }, 0);

    }
    SettingsController.$inject = ['$rootScope', '$scope', '$localForage', '$cordovaAppRate', '_', 'AuthenticationService', 'UserActions', '$http', '$sce', '$ionicModal', '$ionicSlideBoxDelegate', '$ionicScrollDelegate', '$timeout', 'Dialogs'];
    function SettingsController($rootScope, $scope, $localForage, $cordovaAppRate, _, AuthenticationService, UserActions, $http, $sce, $ionicModal, $ionicSlideBoxDelegate, $ionicScrollDelegate, $timeout, Dialogs) {
        var eventHandler = {};

        $scope.userDataLoaded = $scope.noticeShown = false;
        $scope.errorMessage = false;

        $scope.init = function () {
            $localForage.getItem('user').then(function (user) {
                $scope.user = user;
                console.log('User: ', user);
                if (angular.isObject(user)) {
                    $scope.facebookProfile = _.findWhere(user.profiles, {provider: 'Facebook'});
                    $scope.liveProfile = _.findWhere(user.profiles, {provider: 'Live'});
                    $scope.googleProfile = _.findWhere(user.profiles, {provider: 'Google'});
                } else {
                    $scope.login = {
                        email: null,
                        password: null
                    };
                    $scope.facebookProfile = null;
                    $scope.liveProfile = null;
                    $scope.googleProfile = null;
                }

                $timeout(function () {
                    $scope.userDataLoaded = true;
                }, 300);
            });
        };

        $scope.rateApp = function () {
            $cordovaAppRate.promptForRating(true).then(function (result) {
                console.log(result);
            });
        };

        $scope.signInAccount = function () {
            $scope.errorMessage = false;
            $ionicModal.fromTemplateUrl('views/sign-in/LoginModalAccount.html', {
                scope: $scope,
                //animation: 'am-fade-and-scale'
            }).then(function (modal) {
                console.log('Opening Modal');
                $scope.loginModal = modal;

                $scope.loginModalSlider = $ionicSlideBoxDelegate.$getByHandle('loginModalSlideBox')._instances[$ionicSlideBoxDelegate.$getByHandle('loginModalSlideBox')._instances.length - 1];
                $scope.loginModalSlider.enableSlide(false);

                $scope.loginModal.show();


                console.log(modal);
                $scope.closeLoginModal = function (canceled) {
                    canceled = canceled || false;
                    if ($scope.loginModalSlider.currentIndex() === 0) {
                        $scope.loginModal.hide();
                        if (canceled) {
                            //deferred.reject('Canceled');
                            $scope.loginModal.remove();
                        }
                    } else {
                        $scope.loginModalSlider.slide(0);
                        $ionicScrollDelegate.$getByHandle('loginModal').scrollTop();
                    }
                };

                $scope.toDoLogin = function () {
                    AuthenticationService.login(this.login).then(function (res) {
                        console.log(res);
                        $scope.closeLoginModal(true);
                    }, function (err) {
                        if (err === 'invalid_credentials') {
                            $scope.errorMessage = 'Invalid Credentials. Please check email and password.';
                        }
                    });
                };

                $scope.toForgotPassword = function () {
                    $scope.loginModalSlider.slide(1);
                };

                $scope.$on('$destroy', function () {
                    $scope.loginModal.remove();
                });
            });
            //AuthenticationService.login($scope.user);
        };

        $scope.login = function () {
            $scope.errorMessage = false;
            AuthenticationService.login($scope.login)
                .then(function (res) {
                    console.log(res);
                }, function (err) {
                    if (err === 'invalid_credentials') {
                        $scope.errorMessage = 'Invalid Credentials. Please check email and password.';
                    }
                });
        };

        $scope.inviteFbFriends = function () {
            return UserActions.inviteFb();
        };

        $scope.signInFacebook = function () {
            AuthenticationService.FbLogin();
        };

        $scope.signInGoogle = function () {
            AuthenticationService.GoogleLogin();
        };

        $scope.signOutFacebook = function () {
            var promise = Dialogs.confirmAction('logout of Tabletops via Facebook');
            promise.then(function (data) {
                AuthenticationService.FbLogout();
            });
        };

        $scope.signOutGoogle = function () {
            var promise = Dialogs.confirmAction('logout of Tabletops via Google');
            promise.then(function (data) {
                AuthenticationService.GoogleLogout();
            });
        };

        $scope.toggleThisGroup = function (group) {
            if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                $scope.shownGroup = group;
            }
        };

        $scope.isGroupShown = function (group) {
            return $scope.shownGroup === group;
        };

        $localForage.getItem('PrivacyPolicy').then(function (pp) {
            if (!pp) {
                $http.get('http://www.iubenda.com/api/privacy-policy/977997')
                    .success(function (res) {
                        $localForage.setItem('pp', res.content);
                        $scope.pp = $sce.trustAsHtml(res.content);
                    });
            } else {
                $scope.pp = $sce.trustAsHtml(pp);
            }
        });

        $ionicModal.fromTemplateUrl('views/common/FeedbackModal.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.feedbackModal = modal;
        });

        $scope.openFeedbackModal = function ($event) {
            $scope.feedbackModal.show($event);
        };
        $scope.closeFeedbackModal = function () {
            $scope.feedbackModal.hide();
        };

        $scope.sendFeedback = function () {
            var promise = UserActions.review($scope.myReview);
            promise.$promise.then(function (data) {
                console.log(data);
                $scope.closeReviewModal();
            });
        };

        $scope.expandText = function () {
            var element = document.getElementsByTagName('textarea')[0];
            element.style.height = element.scrollHeight + 'px';
        };

        $scope.refreshTokens = function () {
            return AuthenticationService.refreshToken();
        };

        $scope.getGoogleLegalNotice = function () {
            var plugin = plugin || false;
            if (!angular.isObject(plugin)) {
                return false;
            }
        };

        eventHandler.authLogin = $scope.$on('event:auth-loginConfirmed', function (event) {
            $scope.init();
        });

        eventHandler.authLogout = $scope.$on('event:auth-logout-complete', function (event) {
            $scope.init();
        });

        $scope.$on('$ionicView.enter', function (event) {
            console.log('init');
            $scope.init();
        });

        $scope.$on('$destroy', function (event) {
            eventHandler.authLogin();
            eventHandler.authLogout();
            $scope.feedbackModal.remove();
        });
    }
    CuisinesController.$inject = ['$rootScope', '$scope', '$localForage', 'Cuisine'];
    function CuisinesController($rootScope, $scope, $localForage, Cuisine) {
        var eventHandler = {};

        $scope.refresh = function () {
            console.log('refresh');
            $localForage.getItem('province').then(function (province) {
                if (!angular.isObject(province)) {
                    $scope.openProvinceModal();
                    return false;
                }

                Cuisine.query({restaurants: true, province_id: province.id}, function (res) {
                    $localForage.setItem('cuisines', res);
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.cuisines = res;
                });
            });
        };

        eventHandler.provinceSet = $scope.$on('province:set', function (event, p) {
            console.log(p);
            $scope.refresh();
        });
        $scope.refresh();

        $scope.$on('$destroy', function (event) {
            eventHandler.provinceSet();
        });
    }
    CuisineController.$inject = ['$rootScope', '$scope', '$localForage', 'Cuisine', '$stateParams', '$ionicModal', '$state', '_'];
    function CuisineController($rootScope, $scope, $localForage, Cuisine, $stateParams, $ionicModal, $state, _) {

        var eventHandler = {};

        $scope.loaded = false;

        $scope.cuisine = {
            name: ''
        };
        $scope.qData = {
            id: $stateParams.id,
            restaurants: true,
            province: $rootScope.settings.province ? $rootScope.settings.province.slug : undefined,
            province_id: $rootScope.settings.province ? $rootScope.settings.province.id : undefined
        };

        $scope.refresh = _.throttle(function () {
            $scope.loaded = false;
            Cuisine.get($scope.qData, function (res) {
                angular.extend($scope.cuisine, res);
                $scope.$broadcast('scroll.refreshComplete');
                $scope.loaded = true;
            });
        }, 3000);
        $scope.refresh();

        // FiltersModal
        $ionicModal.fromTemplateUrl('views/common/filtersModal.html', {
            scope: $scope,
            //animation: 'am-fade-and-scale'
        }).then(function (modal) {
            $scope.modal = modal;
        });
        $scope.openFiltersModal = function () {
            $scope.modal.show();
        };
        $scope.closeFiltersModal = function () {
            $scope.modal.hide();
        };
        // Execute action on hide modal
        eventHandler.modalHidden = $scope.$on('modal.hidden', function () {
            // Execute action
        });
        // Execute action on remove modal
        eventHandler.modalRemove = $scope.$on('modal.removed', function () {
            // Execute action
        });

        $scope.toRestaurant = function (id, cid) {
            var obj = _.findWhere($scope.cuisine.listings, {slug: id});
            $localForage.setItem('currentListing', obj).then(function () {
                $scope.$broadcast('loading:show');
                $state.go('tabs.cuisine-restaurant', {id: id, cuisine_id: cid});
            });
        };

        eventHandler.provinceSet = $scope.$on('province:set', function (event, p) {
            console.log(p);
            $scope.refresh();
        });

        $scope.$on('$destroy', function () {
            $scope.modal.remove();
            eventHandler.modalHidden();
            eventHandler.modalRemove();
            eventHandler.provinceSet();
        });

    }
})();
