var updateById = function (arr, attr1, value1, newRecord, addAnyway) {
    'use strict';
    if (!arr) {
        return false;
    }
    var i = arr.length,
        added = false;
    while (i--) {
        if (arr[i] && arr[i][attr1] && (arguments.length > 2 && parseInt(arr[i][attr1]) === parseInt(value1) )) {
            arr[i] = newRecord;
            added = true;
        }
    }
    if (addAnyway && !added) {
        arr.push(newRecord);
    }

    return arr;
};

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
    .controller('MainCtrl', ['$rootScope', '$scope', '$ionicPlatform', '$ionicScrollDelegate', '$cordovaNetwork', '$cordovaGeolocation', '$cordovaToast', '$state', '$localForage', 'Province', 'ListingRepository', '$ionicModal', '$timeout', '$log', '_',
        function ($rootScope, $scope, $ionicPlatform, $ionicScrollDelegate, $cordovaNetwork, $cordovaGeolocation, $cordovaToast, $state, $localForage, Province, ListingRepository, $ionicModal, $timeout, $log, _) {
            'use strict';
            $scope.settings = {
                geolocation: false,
                province: {}
            };

            $scope.hasHeaderFabRight = false;

            // Handle Settings
            $localForage.getItem('province').then(function (data) {
                if (angular.isObject(data)) {
                    $scope.settings.province = data;
                }
            });

            var isOnline = function () {
                var isConnected = false;

                if (angular.isDefined(navigator.connection)) {
                    var networkConnection = navigator.connection;
                    if (!networkConnection || !networkConnection.type) {
                        $log.error('networkConnection.type is not defined');
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

                $log.log('isOnline? ' + isConnected);
                return isConnected;
            };

            // Handle Network Status
            $ionicPlatform.ready(function () {

                $rootScope.connectionState = isOnline();

                // listen for Online event
                $rootScope.$on('$cordovaNetwork:online', function () {
                    $log.log('App Online');
                    $rootScope.connectionState = true;
                });

                // listen for Offline event
                $rootScope.$on('$cordovaNetwork:offline', function () {
                    $log.log('App Offline');
                    $rootScope.connectionState = false;
                });
            });

            // Handle Geolocation
            var geoOptions = {
                enableHighAccuracy: true,
                timeout: 600000,
                maximumAge: 599000
            };

            /*$scope.myLocation = $cordovaGeolocation.watchPosition($scope.geoOptions);*/

            var watch = $cordovaGeolocation.watchPosition(geoOptions);
            watch.then(
                null,
                function (err) {
                    // error
                    $log.log(err);
                },
                function (position) {
                    //console.log(position);
                    $scope.myLocation = position;
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

            $localForage.getItem('provinces').then(function (data) {
                if (angular.isDefined(data) && !!data.length) {
                    $scope.provinces = data;
                    $scope.settings.province = _.findWhere($scope.provinces, {slug: 'np-pi'});
                } else {
                    $scope.provinces = $scope.getProvinces().then(function () {
                        $scope.settings.province = _.findWhere($scope.provinces, {slug: 'np-pi'});
                    });
                }
            });

            $scope.getProvinces = function () {
                return Province.query({}, function (res) {
                    $scope.provinces = res;
                    $localForage.setItem('provinces', res);
                    return res;
                });
            };

            $scope.setProvince = function (p) {
                $scope.settings.province = p;
                $localForage.setItem('province', p);
                $scope.closeProvinceModal();
                $cordovaToast.showShortBottom(p.name + ' is now your default province.');
            };

            $scope.findClosest = function (targetLocation, locations) {
                var closest = closestLocation(targetLocation, locations);
                $log.log(closest);
                return closest;
            };

            $scope.selectClosestProvince = function () {
                var closest = $scope.findClosest($scope.myLocation.coords, $scope.provinces);
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

            $scope.showStars = function (count, rating) {
                return ListingRepository.showStars(count, rating);
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
                        // Set Ink
                        ionic.material.ink.displayEffect();
                    });
            };
            $scope.closeProvinceModal = function () {
                $scope.provModal.hide();
            };
            //Cleanup the popover when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.provModal.remove();
            });

            $scope.$on('$ionicView.enter', function () {
                $timeout(function () {
                    $log.log('Set Ink');
                    // Set Ink
                    ionic.material.ink.displayEffect();
                }, 600);
            });

        }])
    .controller('LogoutCtrl', ['$scope', 'AuthenticationService',
        function ($scope, AuthenticationService) {
            'use strict';
            $scope.$on('$ionicView.enter', function () {
                AuthenticationService.logout();
            });
        }])
    .controller('DashboardCtrl', ['$rootScope', '$scope', 'Province', 'Listing', 'Cuisine', '$state', '$interval', '$ionicModal', '$timeout', '$localForage', '_',
        function ($rootScope, $scope, Province, Listing, Cuisine, $state, $interval, $ionicModal, $timeout, $localForage, _) {
            'use strict';
            $scope.getNearby = function () {
                $scope.qData = {app_search: true, range: 5, limit: 5};
                if (angular.isDefined($scope.myLocation) && angular.isObject($scope.myLocation.coords)) {
                    angular.extend($scope.qData, {
                        lat: $scope.myLocation.coords.latitude,
                        lng: $scope.myLocation.coords.longitude
                    });
                }
                $scope.restaurants = Listing.query($scope.qData);
                $scope.restaurants.$promise.finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
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

            $scope.getNearby();

            $scope.cuisines = [
                {img: 'img/cuisines/bahamian.jpg', slug: 'bahamian'},
                {img: 'img/cuisines/italian.jpg', slug: 'italian'},
                {img: 'img/cuisines/steakhouse.jpg', slug: 'steakhouse'},
                {img: 'img/cuisines/chinese.jpg', slug: 'chinese'},
                {img: 'img/cuisines/burgers.jpg', slug: 'burgers'}
            ];

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
                focusFirstInput: true
            }).then(function (modal) {
                $scope.SearchModal = modal;
            });

            $scope.openSearchModal = function ($event) {
                $scope.SearchModal.show($event)
                    .then(function () {
                        // Set Ink
                        ionic.material.ink.displayEffect();
                    });
            };
            $scope.closeSearchModal = function () {
                $scope.SearchModal.hide();
            };
            //Cleanup the popover when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.SearchModal.remove();
                $scope.$parent.hasHeaderFabRight = false;
            });

            $scope.$on('$ionicView.enter', function () {
                $scope.$parent.hasHeaderFabRight = true;
                document.getElementById('fab-search').classList.toggle('hide');
            });

            $scope.$on('$ionicView.leave', function () {
                $scope.$parent.hasHeaderFabRight = false;
                document.getElementById('fab-search').classList.toggle('hide');
            });

            // Set Ink
            ionic.material.ink.displayEffect();
        }])
    .controller('FavoritesCtrl', ['$scope', '$localForage', 'Listing', '$ionicModal', '$state', '_',
        function ($scope, $localForage, Listing, $ionicModal, $state, _) {
            'use strict';
            $scope.faves = [];
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
                animation: 'slide-in-up'
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
    .controller('MapCtrl', ['$scope', 'leafletData', 'leafletBoundsHelpers', '$cordovaGeolocation', 'Listing', '$ionicModal', '$localForage',
        function ($scope, leafletData, leafletBoundsHelpers, $cordovaGeolocation, Listing, $ionicModal, $localForage) {
            'use strict';
            $scope.directionsSet = false;
            $scope.showDirections = false;

            Listing.query({}, function (res) {
                if ($scope.myLocation.coords) {
                    $scope.center = {
                        lat: $scope.myLocation.coords.latitude,
                        lng: $scope.myLocation.coords.longitude,
                        zoom: 12
                    };
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
                }

                $scope.listings = res;
                var returnScope = function () {
                    return $scope;
                };
                for (var a = 0, lena = res.length; a < lena; a++) {
                    var v = res[a];
                    for (var i = 0, len = v.locations.length; i < len; i++) {
                        var loc = v.locations[i];
                        $scope.markers.push({
                            //layer: 'listings',
                            lat: loc.lat,
                            lng: loc.lng,
                            getMessageScope: returnScope,
                            compileMessage: true,
                            message: '<div><h1 class=\'text-center assertive-900\'>' + v.name + '</h1><h3 class="outline padding energized img-rounded">' + v.rating_cache + ' rating <span class="pull-right">' + $scope.showDollars(v.restaurant.price_range, false) + '</span></h3><div class=\'button-bar\'><a ui-sref=\'tabs.map-restaurant({id:"' + v.slug + '"})\' class=\'button button-light button-small button-icon icon ion-eye ink-dark\'></a><tt-directions get-directions=\'startDirections(lat, lng)\' lat=\'' + loc.lat + '\' lng=\'' + loc.lng + '\' ></tt-directions></div></div>',
                            icon: {
                                prefix: 'ion',
                                type: 'extraMarker',
                                icon: 'ion-pizza',
                                markerColor: 'red',
                                /*v.rating_count != 0
                                 ? v.rating_cache > 2
                                 ? v.rating_cache > 4
                                 ? 'green'
                                 :'orange'
                                 :'red'
                                 : 'white'*/
                                shape: 'penta'
                            }
                        });
                    }
                }

            });
            // Default Center
            $scope.center = {
                lat: 25.033965,
                lng: -77.35176,
                zoom: 11
            };

            var maxBounds = leafletBoundsHelpers.createBoundsFromArray([
                [27.293689, -79.541016],
                [20.797522, -71.015968]
            ]);

            $scope.height = window.screen.height;
            angular.extend($scope, {
                defaults: {
                    tileLayer: 'http://api.tiles.mapbox.com/v4/jgiovanni.lonlneon/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ',
                    //maxZoom: 16,
                    minZoom: 8,
                    attributionControl: false,
                    zoomControlPosition: 'topright',
                    path: {
                        weight: 10,
                        color: '#800000',
                        opacity: 1
                    },
                    tileLayerOptions: {
                        detectRetina: true,
                        reuseTiles: true,
                        unloadInvisibleTiles: false
                    }
                    //scrollWheelZoom: false
                },
                maxBounds: maxBounds
            });
            $scope.markers = [];

            leafletData.getMap().then(function (map) {
                $localForage.getItem('province').then(function (res) {
                    map.panTo(new L.LatLng(res.lat, res.lng));
                });

                /*var provWatch = */
                $scope.$watch('settings.province', function (newValue) {
                    map.panTo(new L.LatLng(newValue.lat, newValue.lng));
                });

                L.mapbox.accessToken = 'pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ';
                $scope.directions = L.mapbox.directions();
                $scope.directions.setOrigin(L.latLng($scope.myLocation.coords.latitude, $scope.myLocation.coords.longitude));

                /*var directionsLayer = */
                L.mapbox.directions.layer($scope.directions, {readonly: true})
                    .addTo(map);

                /*var directionsErrorsControl = */
                L.mapbox.directions.errorsControl('errors', $scope.directions)
                    .addTo(map);

                /*var directionsRoutesControl = */
                L.mapbox.directions.routesControl('routes', $scope.directions)
                    .addTo(map);

                /*var directionsInstructionsControl = */
                L.mapbox.directions.instructionsControl('instructions', $scope.directions)
                    .addTo(map);
            });


            $scope.startDirections = function (lat, lng) {
                $scope.directions.setDestination(L.latLng(lat, lng));
                $scope.directions.query();
                $scope.directionsSet = true;
                $scope.showDirections = false;
                leafletData.getMap().then(function (map) {
                    map.closePopup();
                    map.fitBounds([
                        [$scope.directions.origin.geometry.coordinates[1], $scope.directions.origin.geometry.coordinates[0]],
                        [$scope.directions.destination.geometry.coordinates[1], $scope.directions.destination.geometry.coordinates[0]]
                    ]);
                });
                console.log($scope.directions);
            };

            $scope.toggleDirections = function () {
                $scope.showDirections = !$scope.showDirections;
            };

            //Handling Route Steps
            //$scope.currentStep = $scope.directions.routes[0].steps[0].manever.instruction;
        }
    ])
    .controller('CuisinesCtrl', ['$rootScope', '$scope', '$localForage', 'Cuisine',
        function ($rootScope, $scope, $localForage, Cuisine) {
            'use strict';
            $scope.refresh = function () {
                $localForage.getItem('cuisines').then(function (data) {
                    if (!!data && data.length) {
                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.cuisines = data;
                    } else {
                        Cuisine.query({}, function (res) {
                            $localForage.setItem('cuisines', res);
                            $scope.$broadcast('scroll.refreshComplete');
                            $scope.cuisines = res;
                        });
                    }
                });
            };
            $scope.refresh();
        }])
    .controller('CuisineCtrl', ['$rootScope', '$scope', '$localForage', 'Cuisine', '$stateParams', 'ListingRepository', '$ionicModal', '$state', '_',
        function ($rootScope, $scope, $localForage, Cuisine, $stateParams, ListingRepository, $ionicModal, $state, _) {
            'use strict';
            $scope.refresh = _.throttle(function () {
                Cuisine.get({id: $stateParams.id, restaurants: true}, function (res) {
                    $scope.cuisine = res;
                    $scope.$broadcast('scroll.refreshComplete');
                });
            }, 5000);
            $scope.refresh();

            // FiltersModal
            $ionicModal.fromTemplateUrl('views/common/filtersModal.html', {
                scope: $scope,
                animation: 'slide-in-up'
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

        }])
    .controller('RestaurantsCtrl', ['$scope', '$rootScope', 'Listing', 'Cuisine', '$stateParams', 'ListingRepository', '$ionicModal', '$localForage', '$timeout', '$state', '_',
        function ($scope, $rootScope, Listing, Cuisine, $stateParams, ListingRepository, $ionicModal, $localForage, $timeout, $state, _) {
            'use strict';
            Cuisine.query({}, function (res) {
                $scope.cuisines = res;
                $scope.cuisineList = angular.copy(res);
                $scope.cuisineList.push({slug: null, name: 'Any'});
            });

            $scope.filters = {
                app_search: true,
                search: $stateParams.search || undefined,
                province: $scope.settings.province.slug,
                province_id: $scope.settings.province.id,
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
                reservations_preferred: undefined
            };

            $scope.toggles = [
                {icon: 'icon ion-wifi', name: 'Wi-fi', slug: 'wifi', value: undefined},
                {icon: 'icon ion-music-note', name: 'Live Music', slug: 'live_music', value: undefined},
                {icon: 'icon ion-ios-telephone', name: 'Takeout', slug: 'takeout', value: undefined},
                {icon: 'icon ion-model-s', name: 'Delivery', slug: 'delivery', value: undefined},
                {icon: 'icon ion-help-buoy', name: 'Handicap Accessible', slug: 'disability', value: undefined},
                {icon: 'icon ion-ios-sunny', name: 'Outdoor Seating', slug: 'outdoor_seating', value: undefined},
                {
                    icon: 'icon ion-checkmark ',
                    name: 'Reservations Pref/Only',
                    slug: 'reservations_preferred',
                    value: undefined
                }
            ];

            /*$scope.$watchCollection('filters', function (newValue, oldValue) {
             console.log(newValue);
             });*/

            $scope.refresh = _.throttle(function () {
                if (angular.isDefined($scope.myLocation) && angular.isObject($scope.myLocation.coords)) {
                    angular.extend($scope.filters, {
                        lat: $scope.myLocation.coords.latitude,
                        lng: $scope.myLocation.coords.longitude
                    });
                }

                $scope.restaurants = Listing.query($scope.filters);

                $scope.restaurants.$promise.finally(function () {
                    $timeout(function () {
                        // Set Ink
                        ionic.material.motion.blinds();

                        ionic.material.ink.displayEffect();
                    }, 300);
                    $scope.$broadcast('scroll.refreshComplete');
                    /*$scope.$watchCollection('filters', function (newValue, oldValue) {

                     });*/
                });
            }, 5000);

            $scope.refresh();

            $scope.sorts = [
                {name: 'Name', value: 'name'},
                {name: 'Price', value: 'restaurant.price_range'},
                {name: 'Highest Rating', value: '-rating_cache'},
                {name: 'Popularity', value: '-like_count'},
                //{ name: 'Most Reviewed', value:'-like_count'},
            ];

            $scope.$on('$destroy', function () {
                $rootScope.sorts = [];
                $rootScope.filters = {};
            });

            // FiltersModal
            $ionicModal.fromTemplateUrl('views/common/filtersModal.html', {
                scope: $scope,
                animation: 'slide-in-up'
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

            $scope.toRestaurant = function (id) {
                var obj = _.findWhere($scope.restaurants, {slug: id});
                $localForage.setItem('currentListing', obj).then(function () {
                    $rootScope.$emit('loading:show');
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

            // Set Ink
            ionic.material.ink.displayEffect();

        }])
    .controller('RestaurantCtrl', ['$scope', 'Listing', '$ionicPopover', '$ionicTabsDelegate', '$ionicModal', '$state', '$stateParams', '$localForage', 'HoursDays', 'StartHours', 'EndHours', 'UserActions',
        function ($scope, Listing, $ionicPopover, $ionicTabsDelegate, $ionicModal, $state, $stateParams, $localForage, HoursDays, StartHours, EndHours, UserActions) {
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
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.reviewModal = modal;
                });

                $scope.openReviewModal = function () {
                    $scope.reviewModal.show();
                };
                $scope.closeReviewModal = function () {
                    $scope.reviewModal.hide();
                };

                // Image View Modal
                $ionicModal.fromTemplateUrl('views/restaurants/image-modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.imageModal = modal;
                });

                $scope.openModal = function () {
                    $scope.imageModal.show();
                };
                $scope.closeModal = function () {
                    $scope.imageModal.hide();
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

            $localForage.getItem('user').then(function (res) {
                $scope.myReview.user_id = res.user_id;
            });

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
        }])
    .controller('RestaurantMapCtrl', ['$scope', '$localForage', 'leafletData', 'leafletBoundsHelpers',
        function ($scope, $localForage, leafletData, leafletBoundsHelpers) {
            'use strict';
            $scope.directionsSet = false;
            $scope.showDirections = false;

            $localForage.getItem('currentListing').then(function (listing) {
                $scope.listing = listing;

                // Leaflet Map Functions
                $scope.markers = [];
                var returnScope = function () {
                    return $scope;
                };
                for (var i = 0, len = $scope.listing.locations.length; i < len; i++) {
                    var loc = $scope.listing.locations[i];
                    $scope.markers.push({
                        //layer: 'listings',
                        lat: loc.lat,
                        lng: loc.lng,
                        getMessageScope: returnScope,
                        compileMessage: true,
                        message: '<div><h6 class=\'text-center\'>' + $scope.listing.name + '</h6><div class=\'button-bar\'><tt-directionsa get-directions=\'startDirections(lat, lng)\' lat=\'' + loc.lat + '\' lng=\'' + loc.lng + '\' ></tt-directionsa></div></div>',
                        icon: {
                            prefix: 'ion',
                            type: 'extraMarker',
                            icon: 'ion-pizza',
                            markerColor: 'aqua',
                            /*v.rating_count != 0
                             ? v.rating_cache > 2
                             ? v.rating_cache > 4
                             ? 'green'
                             :'orange'
                             :'red'
                             : 'white'*/
                            shape: 'penta'
                        }
                    });
                }
                //console.log($scope.markers);
                if ($scope.myLocation.coords) {
                    $scope.center = {
                        lat: $scope.myLocation.coords.latitude,
                        lng: $scope.myLocation.coords.longitude,
                        zoom: 12
                    };
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
                }
                // Default Center
                $scope.center = {
                    lat: 25.033965,
                    lng: -77.35176,
                    zoom: 11
                };

                $scope.height = window.screen.height;
                var maxBounds = leafletBoundsHelpers.createBoundsFromArray([
                    [27.293689, -79.541016],
                    [20.797522, -71.015968]
                ]);

                angular.extend($scope, {
                    defaults: {
                        tileLayer: 'http://api.tiles.mapbox.com/v4/jgiovanni.lonlneon/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ',
                        //maxZoom: 16,
                        minZoom: 8,
                        attributionControl: false,
                        zoomControlPosition: 'topright',
                        path: {
                            weight: 10,
                            color: '#800000',
                            opacity: 1
                        },
                        tileLayerOptions: {
                            detectRetina: true,
                            reuseTiles: true,
                            unloadInvisibleTiles: false
                        }
                        //scrollWheelZoom: false
                    },
                    maxBounds: maxBounds
                    /*layers: {
                     baselayers: {
                     mb: {
                     name: 'Bahamas',
                     type: 'xyz',
                     url: 'http://api.tiles.mapbox.com/v4/jgiovanni.lonlneon/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ',
                     layerOptions: {
                     subdomains: [
                     'a',
                     'b',
                     'c'
                     ],
                     //attribution: '© OpenStreetMap contributors',
                     continuousWorld: true
                     },
                     layerParams: {}
                     }
                     },
                     overlays: {
                     listings: {
                     name: 'Listings',
                     type: 'markercluster',
                     visible: true,
                     layerOptions: {
                     chunkedLoading: true,
                     showCoverageOnHover: false,
                     removeOutsideVisibleBounds: true
                     },
                     layerParams: {}
                     }
                     }
                     }*/
                });

                leafletData.getMap().then(function (map) {
                    L.mapbox.accessToken = 'pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ';
                    $scope.directions = L.mapbox.directions();
                    $scope.directions.setOrigin(L.latLng($scope.myLocation.coords.latitude, $scope.myLocation.coords.longitude));

                    var directionsLayer = L.mapbox.directions.layer($scope.directions, {readonly: true})
                        .addTo(map);

                    var directionsErrorsControl = L.mapbox.directions.errorsControl('errors', $scope.directions)
                        .addTo(map);

                    var directionsRoutesControl = L.mapbox.directions.routesControl('routes', $scope.directions)
                        .addTo(map);

                    var directionsInstructionsControl = L.mapbox.directions.instructionsControl('instructions', $scope.directions)
                        .addTo(map);
                });

                $scope.startDirections = function (lat, lng) {
                    $scope.directions.setDestination(L.latLng(lat, lng));
                    $scope.directions.query();
                    $scope.directionsSet = true;
                    $scope.showDirections = false;
                    leafletData.getMap().then(function (map) {
                        map.closePopup();
                        map.fitBounds([
                            [$scope.directions.origin.geometry.coordinates[1], $scope.directions.origin.geometry.coordinates[0]],
                            [$scope.directions.destination.geometry.coordinates[1], $scope.directions.destination.geometry.coordinates[0]]
                        ]);
                    });
                    console.log($scope.directions);
                };

                $scope.toggleDirections = function () {
                    $scope.showDirections = !$scope.showDirections;
                };

                //Handling Route Steps
                //$scope.currentStep = $scope.directions.routes[0].steps[0].manever.instruction;
            });
        }])
    .controller('AccountCtrl', ['$scope', '$localForage', '$cordovaFacebook', '$timeout', '_', '$http',
        function ($scope, $localForage, $cordovaFacebook, $timeout, _, $http) {
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
                    $scope.coverPhoto = 'img/bgs/cs21.jpg';
                }
            });

            // Set Motion
            $timeout(function () {
                ionic.material.motion.slideUp({
                    selector: '.slide-up'
                });
            }, 0);

        }])
    .controller('SettingsCtrl', ['$scope', '$localForage', '$cordovaAppRate', '$log', '_', 'AuthenticationService',
        function ($scope, $localForage, $cordovaAppRate, $log, _, AuthenticationService) {
            'use strict';
            $scope.settings = {
                enableFriends: true
            };

            $localForage.getItem('user').then(function (user) {
                console.log(user);
                $scope.user = user;
                $scope.facebookProfile = _.findWhere(user.profiles, {provider: 'Facebook'});
                $scope.liveProfile = _.findWhere(user.profiles, {provider: 'Live'});
                $scope.googleProfile = _.findWhere(user.profiles, {provider: 'Google'});

            });

            $scope.rateApp = function () {
                $cordovaAppRate.promptForRating(true).then(function (result) {
                    $log.log(result);
                });
            };

            $scope.signInFacebook = function () {
                AuthenticationService.FbLogin();
            };

            $scope.signInGoogle = function () {
                AuthenticationService.GoogleLogin();
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

        }]);

