var closestLocation = function (targetLocation, locationData) {
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
};

angular.module('tabletops.controllers', [])
    .controller('MainCtrl', ['$rootScope', '$scope', '$ionicPlatform', '$ionicScrollDelegate', '$cordovaNetwork', '$cordovaGeolocation', '$state', '$localForage', 'Province', 'ListingRepository', '$ionicModal', '$timeout', '_', 'ionicMaterialInk', 'AuthenticationService', '$ionicUser', '$q',
        function ($rootScope, $scope, $ionicPlatform, $ionicScrollDelegate, $cordovaNetwork, $cordovaGeolocation, $state, $localForage, Province, ListingRepository, $ionicModal, $timeout, _, ionicMaterialInk, AuthenticationService, $ionicUser, $q) {
            'use strict';
            $rootScope.settings = {
                geolocation: false,
                lastGeolocation: navigator.geolocation.lastPosition,
                province: {},
                analytics: true
            };

            $rootScope.$watchCollection('settings', function (newValues, oldValues) {
                $ionicUser.set('settings', newValues);
            });

            $rootScope.hasHeaderFabRight = false;

            // Handle Settings
            $localForage.getItem('province').then(function (data) {
                if (angular.isObject(data)) {
                    $rootScope.settings.province = data;
                }
            });

            $rootScope.isIOS = ionic.Platform.isIOS();

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

            $ionicPlatform.ready(function () {
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

                // Handle Geolocation
                var watch = $cordovaGeolocation.watchPosition({
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 14990
                });
                watch.then(
                    null,
                    function (err) {
                        // error
                        console.log(err);
                    },
                    function (position) {
                        console.log(position);
                        $rootScope.settings.geolocation = $rootScope.myLocation = position;
                    });

                // Handle Authentication
                AuthenticationService.authCheck();

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
                        $scope.setProvince({"id":"15","name":"New Providence / Paradise Island","slug":"np-pi","country_id":"1","created_at":"2015-04-10 09:52:53","updated_at":"2015-04-10 09:55:28","lat":25.033965,"lng":-77.35176});
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

            $scope.findClosest = function (targetLocation, locations) {
                var closest = closestLocation(targetLocation, locations);
                console.log(closest);
                return closest;
            };

            $scope.selectClosestProvince = function () {
                var closest = angular.isDefined($rootScope.settings.geolocation)
                    ? $scope.findClosest($rootScope.settings.geolocation.coords, $scope.provinces)
                    : $scope.findClosest($rootScope.settings.lastGeolocation.coords, $scope.provinces);
                $scope.setProvince(closest);
            };

            $scope.shareThis = function (obj) {
                ListingRepository.share(obj);
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

            $scope.$on('event:auth-loginConfirmed', function () {
                $rootScope.isLoggedin = true;
                $state.go('tabs.dashboard');
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
        }])
    .controller('LogoutCtrl', ['$scope', 'AuthenticationService',
        function ($scope, AuthenticationService) {
            'use strict';
            $scope.$on('$ionicView.enter', function () {
                AuthenticationService.logout();
            });
        }])
    .controller('DashboardCtrl', ['$rootScope', '$scope', 'Province', 'Listing', 'Cuisine', '$state', '$interval', '$ionicModal', '$timeout', '$localForage', '_', 'ionicMaterialInk', '$ionicSlideBoxDelegate',
        function ($rootScope, $scope, Province, Listing, Cuisine, $state, $interval, $ionicModal, $timeout, $localForage, _, ionicMaterialInk, $ionicSlideBoxDelegate) {
            'use strict';

            $timeout(function () {
                $scope.getNearby();
                $scope.dashSlider = $ionicSlideBoxDelegate.$getByHandle('DashboardSlider');
            }, 300);

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
                $scope.$on('$ionicView.enter', function () {
                    $scope.getNearby();
                });
            });

            // TODO Make list dynamic
            var cuisines = [
                {img: 'img/cuisines/bahamian.jpg', slug: 'bahamian'},
                {img: 'img/cuisines/italian.jpg', slug: 'italian'},
                {img: 'img/cuisines/steakhouse.jpg', slug: 'steakhouse'},
                {img: 'img/cuisines/chinese.jpg', slug: 'chinese'},
                {img: 'img/cuisines/burgers.jpg', slug: 'burgers'}
            ];
            $scope.cuisines_1 = [];
            $scope.cuisines_2 = [];

            for (var i=0;i<cuisines.length;i++){
                if ((i+2)%2===0) {
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
                $state.go('tabs.results.list', {search: this.search});
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
                document.getElementById('fab-search').classList.toggle('hide');
            });

            $scope.$on('$ionicView.leave', function () {
                $rootScope.hasHeaderFabRight = false;
                document.getElementById('fab-search').classList.toggle('hide');
            });

            // Set Ink
            ionicMaterialInk.displayEffect();

            $scope.selectedProvinceTitle = function () {
                return $scope.selectedProvince != null
                    ? $scope.selectedProvince
                    : 'Select Province';
            };
        }])
    .controller('FavoritesCtrl', ['$scope', '$localForage', 'Listing', '$ionicModal', '$state', '_',
        function ($scope, $localForage, Listing, $ionicModal, $state, _) {
            'use strict';
            //$scope.faves = [];
            $scope.refresh = function () {
                $localForage.getItem('favorites').then(function (data) {
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

            $scope.toFavorite = function (id) {
                var obj = _.findWhere($scope.faves, {slug: id});
                $localForage.setItem('currentListing', obj).then(function () {
                    $scope.$broadcast('loading:show');
                    $state.go('tabs.favorite', {id: id});
                });
            };

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

        }])
    .controller('SearchCtrl', ['$rootScope', '$scope', 'Cuisine', '$state', '$stateParams', '$ionicModal', '$localForage', '$ionicFilterBar', '$ionicSlideBoxDelegate',
        function ($rootScope, $scope, Cuisine, $state, $stateParams, $ionicModal, $localForage, $ionicFilterBar, $ionicSlideBoxDelegate) {
            $scope.refresh = function () {
                $scope.$broadcast('refresh:start');
            };

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
                {icon: 'ion-checkmark ', name:'Reservations Pref/Only', slug:'reservations_preferred', value:undefined},
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
                { name: 'Name', value: 'name'},
                { name: 'Price', value: 'restaurant.price_range' },
                { name: 'Highest Rating', value: '-rating_cache' },
                { name: 'Popularity', value: '-like_count' },
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
        }
    ])
    .controller('MapCtrl', ['$rootScope', '$scope', '$cordovaGeolocation', 'Listing', '$ionicModal', '$localForage', '$state', '_', 'GoogleMaps', '$window',
        function ($rootScope, $scope, $cordovaGeolocation, Listing, $ionicModal, $localForage, $state, _, GoogleMaps, $window) {
            'use strict';

            //$scope.isAndroid = ionic.Platform.isAndroid();
            $scope.gMap = undefined;

            $scope.createMap = function () {
                $localForage.getItem('province').then(function (province) {
                    // Check for province immediately
                    if (!angular.isObject(province)) {
                        if ( angular.isObject($scope.gMap) ) {
                            $scope.gMap.setClickable( false );
                        }
                        $scope.openProvinceModal();
                        return false;
                    }

                    //console.log($scope.gMap);
                    if (angular.isUndefined($scope.gMap)) {
                        console.log('Creating gMap');
                        // Set map div
                        $scope.mapDiv = document.getElementById('map');
                        // force $scope.mapDiv height to avoid tabs
                        //$scope.mapDiv.style.height = ($scope.mapDiv.offsetHeight - 49) + 'px';
                        ///$scope.gMap.setDiv($scope.mapDiv);

                        // Initialize the map plugin
                        if (angular.isDefined($window.plugin)) {
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
                                $scope.loadListings(province.id);
                                $scope.gMap.setClickable( true );
                            });
                        }
                } else {
                        // clear markers from map
                        // Load Listings restricted by province
                        $scope.loadListings(province.id);
                        $scope.gMap.setClickable( true );
                    }
                });
            };

            $scope.loadListings = function (provinceId) {

                var infoClickFunc = function(marker) {
                    console.log(marker);
                    $scope.toRestaurant(marker.get("slug"));
                };

                // TODO: apply filters instead of province only

                    if (angular.isDefined($scope.myLocation) && angular.isObject($scope.myLocation.coords)) {
                        angular.extend($scope.filters, {
                            lat: $scope.myLocation.coords.latitude,
                            lng: $scope.myLocation.coords.longitude
                        });
                    }

                    var filtersCopy = angular.copy($scope.filters);
                    filtersCopy.cuisine = angular.isDefined(filtersCopy.cuisine) ? filtersCopy.cuisine.toString() : undefined;
                    delete filtersCopy.sort;

                    $scope.restaurants = Listing.query(filtersCopy);

                    $scope.restaurants.$promise.finally(function () {
                        for (var a = 0, lena = res.length; a < lena; a++) {
                            var v = res[a];
                            for (var i = 0, len = v.locations.length; i < len; i++) {
                                var loc = v.locations[i];
                                $scope.gMap.addMarker({
                                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAwCAMAAADXYfGSAAACGVBMVEUODg5erw9esQ5fsA5fsQ1gsQ5gswxhtAtiswxitQpitQ1mvgZnvwX///8ODg5ktwxjtg0ODg5gswxmvgZmvgYODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4TFA8nQBNiswwfMBEiNBJjuAtgswxnvQdnvwVitQplvQdnvwUwURNgsQ48ahResQ4/bhNhtg1gswxitwxjuAtfsQ1QkhNnvwVhtAtmvAhmvgZmvgZnvwVnvwVgswxmvgZmvgZmvgZZoRFesQ5nvwVnvQdnvQdluQpitQ1ktwxnvwVhtAtfsQ1mvAhgswxcqBBjtg1dqw5nvwVluQpiswxcrBFluwlluwlgswxjuAtitQpnvwVnvwVlvQdnvwVnvQdkugpgsQ5erw9esQ5luwlnvwVmugpgswxluwlfsQ1itwxhtg1esQ5fsA5fsQ1gsQ5gswxhtAthtg1iswxitQpitQ1itwxjtg1juAtktwxkugpluQpluwllvQdmugpmvAhmvgZnvQdnvQtnvwVovBlvvSZ7xTZ7xTeAxj2CxkSExkWEyEWKyVOLyFWNyVWTzWCf0nGg0nOh03Wm1nqp14Cs14Ou2Yiv2oq13ZG+4J/A4aLB46PC46TD5KTG5arK5q/L57Hd78ve78ze787f78/g8NDg8NHn89vp9d/q9eDt9uPt9uTu9ub2+vL4+/T4/PT6/fj9/vv9/vz+/v3///87qQCJAAAAanRSTlMAAAAAAAAAAAAAAAAAAAICBAUFBwgPEBIVFhcYGRobHBwfICEjJSUmJiYoKDQ1N0FFRlVbXV5gYmNkZGV9iouOj5CTlJWZm52ho6Wls7W4wM/U1dna29/h4uXn6Onq7u/x8fT09fb2+fn7uoJOMwAAAjpJREFUeNpt0vdT02AAxvHXWto6EihaipQAsofs5UCWspGlsocgs1j3rNowFC1LloCIgwoO0Grfv9B3NU3TfH7I+97zvcs1dwUck5Jf3dR9s7upOj/lOMFxrCWWd0x6dZQnytv5zkm5zgtSO1HsUCo+eYy2i45AJbSddag5h1tCj4i9doozX/58nRGdr0SsJwG1S/g28fHfrvgdQvhD/PZ3awJPlzmQ3PUc+QDhthNizm0It/DUlQwKX2IeCF3LpC27IPSQrRDUkdON1p8eiOZf6OEmWx24ZsfWodw62a6DATvxSZY+02kADNspl5R22TIMBl9Qb9wsud+yZRD0PqWmFhZX1t6vrSwuTLGlFzQ/o+b3NleX3i2tbu7Ns6UZVLDbLPSaZUsFyHlMzUltji05IK6N3qY3dvYPfh/s72xM06EtDgRXPVFXFQy47NGHakazOcCFNDxS0xCCGpc5djfQWCb9v1Q+CFR5lLak9vtK7UlHcEMK7igV6PW4YTWKVKP3tZiWe3ItMQaDATcia+i2z1CWDsGNKpK1Ip1/C62XUn2o1Jj4VpZa43W+xuSO3MJGcrWUvGlrSavVqrSgtD6bzdaXFsTIm0ZTZrVayzRe3gYQjSa939qfrtqMpujG8cZok/Ew5Wu8WRCE0vFS9DTz/o2PEJC8G3n4OMX7tTABy7iaQc6wQ4jUIsmWeiWVnJEqLfZMLDktuCneGXU6SvFO9lt8Ini6yr+BMfNAatK3h1sES7jJCABr/wErzoeWTrAkSQAAAABJRU5ErkJggg==',
                                    //icon: '/img/Cafe.png',
                                    title: v.name + '\n' + loc.address_1 + ' ' + loc.address_2,
                                    snippet: 'View More',
                                    position: new GoogleMaps.LatLng(loc.lat, loc.lng),
                                    styles : {
                                        'text-align': 'center',
                                        'font-weight': 'bold'
                                    },
                                    slug: v.slug,
                                    infoClick: infoClickFunc
                                });
                            }
                        }

                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.loaded = true;
                    });

            };

            $scope.toRestaurant = function (slug) {
                console.log('going to: ', slug);
                var obj = _.findWhere($scope.restaurants, {slug: slug});
                $localForage.setItem('currentListing', obj).then(function () {
                    $scope.$broadcast('loading:show');
                    $state.go('tabs.map-restaurant', {id: slug});
                });
            };

            $scope.openMapProvinceModal = function ($event) {
                if ( angular.isObject($scope.gMap) ) {
                    $scope.gMap.setClickable( false );
                }
                $scope.openProvinceModal($event);
            };

            $scope.showFilterBar = function () {
                $scope.filterBarInstance = $ionicFilterBar.show({
                    items: $scope.restaurants,
                    update: function (filteredItems) {
                        $scope.restaurants = filteredItems;
                        // TODO remove markers from map during filter
                    }
                });
                $scope.$broadcast('filters:show');

            };

            $scope.$on('$ionicView.enter', function (event) {
                console.log('entering');
                var MView = document.getElementById('main-view');
                MView.classList.toggle('bg-food');

                $scope.createMap();

                if ($scope.gMap) {
                    //if ($scope.isIOS) $scope.gMap.addEventListener($scope.gMap.MAP_WILL_MOVE, function() { checkBounds(); });
                    //if ($scope.isAndroid) $scope.gMap.addListener($scope.gMap.MAP_WILL_MOVE, function() { checkBounds(); });

                    /*var checkBounds = function () {
                        if(! allowedBounds.contains($scope.gMap.getCenter())) {
                            var C = $scope.gMap.getCenter();
                            var X = C.lng();
                            var Y = C.lat();

                            var AmaxX = 27.293689;
                            var AmaxY  = -79.541016;
                            var AminX = 20.797522;
                            var AminY = -71.015968;

                            if (X < AminX) {X = AminX;}
                            if (X > AmaxX) {X = AmaxX;}
                            if (Y < AminY) {Y = AminY;}
                            if (Y > AmaxY) {Y = AmaxY;}

                            $scope.gMap.setCenter(new GoogleMaps.LatLng(Y,X));
                        }
                    }*/
                }
            });

            $scope.$on('$ionicView.leave', function (event) {
                console.log('leaving');
                //$scope.gMap.removeEventListener($scope.gMap.event.MAP_WILL_MOVE);
                if ( angular.isObject($scope.gMap) ) {
                    $scope.gMap.setClickable( false );
                    $scope.gMap.remove();
                }
                $scope.gMap = undefined;

                var MView = document.getElementById('main-view');
                MView.classList.toggle('bg-food');

                //$scope.mapDiv.style.height = ($scope.mapDiv.offsetHeight + 49) + 'px';
            });

            $scope.$on('province:set', function (event, p) {
                console.log(p);
                if ( angular.isUndefined($scope.gMap) ) {
                    $scope.createMap();
                } else {
                    $scope.gMap.setCenter(new GoogleMaps.LatLng(p.lat, p.lng));
                    $scope.loadListings(p.id);
                    $scope.gMap.setClickable( true );
                }
            });

            $scope.$on('filters:show', function (event) {
                if (angular.isDefined($scope.gMap)) {
                    $scope.gMap.setClickable( false );
                }
            });

            $scope.$on('filters:hide', function (event) {
                if (angular.isDefined($scope.gMap)) {
                    $scope.gMap.setClickable( true );
                }
            });

            $scope.$on('refresh:start', function (event) {
                if (angular.isDefined($scope.gMap)) {
                    $scope.gMap.setClickable( true );
                }
            });

            /*if ($scope.myLocation.coords) {
                $scope.center = {
                    lat: $scope.myLocation.coords.latitude,
                    lng: $scope.myLocation.coords.longitude,
                    zoom: 12
                };

                // Add custom me marker
                $scope.markers.push({
                    lat: $scope.myLocation.coords.latitude,
                    lng: $scope.myLocation.coords.longitude,
                    icon: {
                        prefix: 'ion',
                        type: 'extraMarker',
                        icon: 'ion-person',
                        markerColor: 'black',
                        shape: 'circle'
                    }
                });
            }*/
        }
    ])
    .controller('RestaurantsCtrl', ['$rootScope', '$scope', 'Listing', 'Cuisine', '$stateParams', 'ListingRepository', '$ionicModal', '$localForage', '$timeout', '$state', '_', 'ionicMaterialInk', 'ionicMaterialMotion', '$ionicSlideBoxDelegate', '$ionicFilterBar',
        function ($rootScope, $scope, Listing, Cuisine, $stateParams, ListingRepository, $ionicModal, $localForage, $timeout, $state, _, ionicMaterialInk, ionicMaterialMotion, $ionicSlideBoxDelegate, $ionicFilterBar) {
            'use strict';
            $scope.loaded = false;
            $scope.filterBarInstance = null;

            $scope.showFilterBar = function () {
                $scope.filterBarInstance = $ionicFilterBar.show({
                    items: $scope.restaurants,
                    update: function (filteredItems) {
                        $scope.restaurants = filteredItems;
                    }
                });
            };

            $scope.refresh = _.throttle(function () {
                $scope.loaded = false;
                $localForage.getItem('province').then(function (province) {
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

                    $scope.restaurants = Listing.query(filtersCopy);

                    $scope.restaurants.$promise.finally(function () {
                        $timeout(function () {
                            // Set Ink
                            ionicMaterialMotion.blinds();

                            ionicMaterialInk.displayEffect();
                        }, 300);
                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.loaded = true;
                    });
                });
            }, 3000);

            $scope.refresh();

            $scope.$on('$destroy', function () {
                $rootScope.sorts = [];
                $rootScope.filters = {};
            });

            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.modal.remove();
            });

            //$ionicSlideBoxDelegate.$getByHandle('modalSlider').next();

            $scope.toRestaurant = function (id) {
                var obj = _.findWhere($scope.restaurants, {slug: id});
                $localForage.setItem('currentListing', obj).then(function () {
                    $rootScope.$emit('loading:show');
                    $rootScope.$broadcast('loading:show');
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

        }])
    .controller('RestaurantCtrl', ['$scope', 'Listing', '$ionicPopover', '$ionicTabsDelegate', '$ionicModal', '$state', '$stateParams', '$localForage', 'HoursDays', 'StartHours', 'EndHours', 'UserActions', 'ionicMaterialInk', 'Dialogs', '$q',
        function ($scope, Listing, $ionicPopover, $ionicTabsDelegate, $ionicModal, $state, $stateParams, $localForage, HoursDays, StartHours, EndHours, UserActions, ionicMaterialInk, Dialogs, $q) {
            'use strict';

            $localForage.getItem('currentListing').then(function (data) {
                $scope.listing = data;
                $scope.$broadcast('loading:hide');

                $scope.isExpanded = true;
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
                    id = id||null;
                    $localForage.setItem('currentListing', $scope.listing).then(function () {
                        switch ($state.current.name) {
                            case 'tabs.favorite':
                                $state.go('tabs.favorite-map', {id: $scope.listing.slug, target: id});
                                break;
                            case 'tabs.cuisine-restaurant':
                                $state.go('tabs.cuisine-restaurant-map', {id: $scope.listing.slug, cuisine_id: $stateParams.cuisine_id, target: id});
                                break;
                            default:
                                $state.go('tabs.restaurant-map', {id: $scope.listing.slug, target: id});
                                break;
                        }
                    });
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
                    $scope.checkUser('post a review')
                        .then(function (res) {
                            $scope.reviewModal.show();
                        },function (res) {
                            
                        });
                };

                $scope.beenHereToggle = function () {
                    $scope.checkUser('mark as been here')
                        .then(function (res) {
                            $scope.beenHere($scope.listing);
                        },function (res) {

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
                    $scope.checkUser('submit a report').then(function (res) {
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
            });

            //Review Functions
            // set the rate and max variables
            $scope.myReview = {
                max: 5,
                rate: 3,
                body: '',
                user_id: 0,
                facebook: false,
                google: false
            };

            $scope.checkUser = function (action) {
                var deferred_cu = $q.defer();
                 $localForage.getItem('user').then(function (res) {
                    if (angular.isObject(res)) {
                        $scope.myReview.user_id = $scope.myReport.user_id = res.id;
                        deferred_cu.resolve(true);
                    } else {
                        console.log('No User Object available');
                        Dialogs.promptToLogin(action).then(function (res) {
                            deferred_cu.resolve(true);
                        },function (res) {
                            deferred_cu.reject(false);
                        });
                    }

                });
                return deferred_cu.promise;
            };

            $scope.submitReview = function () {
                var promise = UserActions.review($scope.listing, $scope.myReview);
                promise.$promise.then(function (data) {
                    console.log(data);
                    $scope.closeReviewModal();
                });
            };

            $scope.expandText = function () {
                var element = document.getElementsByTagName('textarea')[0];
                element.style.height = element.scrollHeight + 'px';
            };

            $scope.$on('$ionicView.leave', function () {
                //$localForage.removeItem('currentListing');
            });

            $scope.myReport = {
                spelling: 0,
                number: 0,
                address: 0,
                is_closed: 0,
                services: 0,
                inappropriate: 0,
                other: 0,
                body: '',
                error:0
            };

            $scope.submitReport = function () {
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
                                error:0
                            };
                        }
                    });
                } else {
                    $scope.myReport.error = true;
                    return false;
                }
            };
        }])
    .controller('RestaurantMapCtrl', ['$rootScope', '$scope', '$localForage', '_', 'GoogleMaps', '$cordovaGeolocation',
        function ($rootScope, $scope, $localForage, _, GoogleMaps, $cordovaGeolocation) {
            'use strict';

            $localForage.getItem('currentListing').then(function (listing) {
                $scope.listing = listing;

                //$scope.isAndroid = ionic.Platform.isAndroid();
                $scope.gMap = undefined;

                $scope.createMap = function () {
                    $localForage.getItem('provinces').then(function (provinces) {
                        var province = _.findWhere(provinces, {id:$scope.listing.locations[0].province_id}) || $localForage.getItem('province');

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
                                $scope.gMap.setClickable( true );
                            });
                        } else {
                            $scope.gMap.setClickable( true );
                        }
                    });
                };

                $scope.loadListings = function () {

                    var infoClickFunc = function(marker) {
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
                            styles : {
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

                    if ($scope.gMap) {
                        //if ($scope.isIOS) $scope.gMap.addEventListener($scope.gMap.MAP_WILL_MOVE, function() { checkBounds(); });
                        //if ($scope.isAndroid) $scope.gMap.addListener($scope.gMap.MAP_WILL_MOVE, function() { checkBounds(); });

                        /*var checkBounds = function () {
                         if(! allowedBounds.contains($scope.gMap.getCenter())) {
                         var C = $scope.gMap.getCenter();
                         var X = C.lng();
                         var Y = C.lat();

                         var AmaxX = 27.293689;
                         var AmaxY  = -79.541016;
                         var AminX = 20.797522;
                         var AminY = -71.015968;

                         if (X < AminX) {X = AminX;}
                         if (X > AmaxX) {X = AmaxX;}
                         if (Y < AminY) {Y = AminY;}
                         if (Y > AmaxY) {Y = AmaxY;}

                         $scope.gMap.setCenter(new GoogleMaps.LatLng(Y,X));
                         }
                         }*/
                    }
                });

                $scope.$on('$ionicView.leave', function (event) {
                    console.log('leaving');
                    //$scope.gMap.removeEventListener($scope.gMap.event.MAP_WILL_MOVE);
                    if ( angular.isObject($scope.gMap) ) {
                        $scope.gMap.setClickable( false );
                        $scope.gMap.remove();
                    }
                    $scope.gMap = undefined;

                    //var MView = document.getElementById('main-view');
                    //MView.classList.toggle('bg-food');

                    //$scope.mapDiv.style.height = ($scope.mapDiv.offsetHeight + 49) + 'px';
                });
            });
        }])
    .controller('CuisinesCtrl', ['$rootScope', '$scope', '$localForage', 'Cuisine',
        function ($rootScope, $scope, $localForage, Cuisine) {
            'use strict';
            $scope.refresh = function () {
                console.log('refresh');
                $localForage.getItem('province').then(function (province) {
                    if (!angular.isObject(province)) {
                        $scope.openProvinceModal();
                        return false;
                    }

                    Cuisine.query({restaurants:true, province_id: province.id}, function (res) {
                        $localForage.setItem('cuisines', res);
                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.cuisines = res;
                    });
                });
            };

            $scope.$on('province:set', function (event, p) {
                console.log(p);
                $scope.refresh();
            });
            $scope.refresh();
        }])
    .controller('CuisineCtrl', ['$rootScope', '$scope', '$localForage', 'Cuisine', '$stateParams', 'ListingRepository', '$ionicModal', '$state', '_',
        function ($rootScope, $scope, $localForage, Cuisine, $stateParams, ListingRepository, $ionicModal, $state, _) {
            'use strict';
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
                    angular.extend($scope.cuisine,res);
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

            $scope.toRestaurant = function (id, cid) {
                var obj = _.findWhere($scope.cuisine.listings, {slug: id});
                $localForage.setItem('currentListing', obj).then(function () {
                    $scope.$broadcast('loading:show');
                    $state.go('tabs.cuisine-restaurant', {id: id, cuisine_id: cid});
                });
            };

            $scope.$on('province:set', function (event, p) {
                console.log(p);
                $scope.refresh();
            });

        }])
    .controller('AccountCtrl', ['$scope', '$localForage', '$cordovaFacebook', '$timeout', '_', '$http', 'ionicMaterialMotion', 'UserActions',
        function ($scope, $localForage, $cordovaFacebook, $timeout, _, $http, ionicMaterialMotion, UserActions) {
            'use strict';
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
                                _.each(_.filter($scope.friends, function(a) { return !!a.target.avatar; }), function (a, b) {
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

            // Set Motion
            $timeout(function () {
                ionicMaterialMotion.slideUp({
                    selector: '.slide-up'
                });
            }, 0);

        }])
    .controller('SettingsCtrl', ['$scope', '$localForage', '$cordovaAppRate', '_', 'AuthenticationService', 'UserActions', '$http', '$sce', '$ionicModal', '$ionicSlideBoxDelegate', '$ionicScrollDelegate', '$timeout', 'GoogleMaps', 'Dialogs',
        function ($scope, $localForage, $cordovaAppRate, _, AuthenticationService, UserActions, $http, $sce, $ionicModal, $ionicSlideBoxDelegate, $ionicScrollDelegate, $timeout, GoogleMaps, Dialogs) {
            'use strict';
            $scope.userDataLoaded = $scope.noticeShown = false;
            $localForage.getItem('user').then(function (user) {
                $scope.user = user;
                if (angular.isObject(user)) {
                    $scope.facebookProfile = _.findWhere(user.profiles, {provider: 'Facebook'});
                    $scope.liveProfile = _.findWhere(user.profiles, {provider: 'Live'});
                    $scope.googleProfile = _.findWhere(user.profiles, {provider: 'Google'});
                }

                $timeout(function () {
                    $scope.userDataLoaded = true;
                }, 300);
            });

            $scope.rateApp = function () {
                $cordovaAppRate.promptForRating(true).then(function (result) {
                    console.log(result);
                });
            };

            $scope.signInAccount = function () {
                $ionicModal.fromTemplateUrl('views/sign-in/LoginModalAccount.html', {
                    scope: $scope,
                    //animation: 'am-fade-and-scale'
                }).then(function (modal) {
                    console.log('Opening Modal');
                    $scope.loginModal = modal;

                    //Init Slider to firt slide
                    debugger;

                    $scope.loginModalSlider = $ionicSlideBoxDelegate.$getByHandle('loginModalSlideBox')._instances[$ionicSlideBoxDelegate.$getByHandle('loginModalSlideBox')._instances.length-1];
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
                        $scope.loginModalSlider.slide(1);
                    };

                    $scope.toForgotPassword = function () {
                        $scope.loginModalSlider.slide(1);
                    };

                    $scope.$on('$destroy', function() {
                        $scope.loginModal.remove();
                    });
                });
                //AuthenticationService.login($scope.user);
            };

            $scope.login = function () {
                AuthenticationService.login($scope.user);
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

            $scope.expandText = function () {
                var element = document.getElementsByTagName('textarea')[0];
                element.style.height = element.scrollHeight + 'px';
            };

            $scope.refreshTokens = function () {
                return AuthenticationService.refreshToken();
            };

            $scope.getGoogleLegalNotice = function () {
                plugin.google.maps.Map.getLicenseInfo(function(txt1,txt2){
                    $scope.googleLegalNotice = txt1 || txt2;
                    //show the information
                });
            };
        }]);

