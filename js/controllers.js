var valById = function (arr, id) {
    return _.find(arr, function (a) {return parseFloat(a.id) == parseFloat(id)});
};

var updateById = function (arr, attr1, value1, newRecord, addAnyway) {
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

angular.module('tabletops.controllers', [])
    .controller('MainCtrl',
    function ($rootScope, $scope, $ionicPlatform, $cordovaNetwork, $cordovaGeolocation, $ionicSideMenuDelegate, $ionicNavBarDelegate, $localForage, Province, ListingRepository, $ionicModal) {
        $scope.navTitle = '<img class="title-image" src="img/logo2.png" style="margin-top: 8px" />';

        $scope.settings = {
            geolocation: false,
            province: {}
        };

        // Handle Settings
        $localForage.getItem('province').then(function(data) {
            $scope.settings.province = data;
        });

        // Handle Network Status
        $ionicPlatform.ready(function() {

            var type = $cordovaNetwork.getNetwork();

            var isOnline = $cordovaNetwork.isOnline();

            var isOffline = $cordovaNetwork.isOffline();


            // listen for Online event
            $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
                $rootScope.onlineState = networkState;
            });

            // listen for Offline event
            $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
                $rootScope.offlineState = networkState;
            });

        });

        // Handle Geolocation
        $scope.geoOptions = {
            enableHighAccuracy: true,
            timeout: 600000,
            maximumAge: 599000
        };

        /*$scope.myLocation = $cordovaGeolocation.watchPosition($scope.geoOptions);*/

        var watch = $cordovaGeolocation.watchPosition($scope.geoOptions);

        watch.then(
            null,
            function (err) {
                // error
                console.log(err);
            },
            function (position) {
                $scope.myLocation = position;
            });

        $scope.toggleLeft = function () {
            $ionicSideMenuDelegate.toggleLeft();
        };

        $scope.toggleRight = function () {
            $ionicSideMenuDelegate.toggleRight();
        };

        $scope.selectProvinces = function () {
            if($rootScope.provincesMenu == true) {
                $scope.toggleRight();
                return $rootScope.provincesMenu = !1;
            }
            $localForage.getItem('provinces').then(function(data) {
                $scope.provinces = angular.isDefined(data) ? data : Province.query({}, function (res) {
                    $scope.provinces = res;
                    $localForage.getItem('provinces', res);
                    return $scope.toggleRight();
                });
                $rootScope.provincesMenu = true;
                $scope.toggleRight();
            });
        };

        $localForage.getItem('provinces').then(function(data) {
            $scope.provinces = angular.isDefined(data) ? data : Province.query({}, function (res) {
                $scope.provinces = res;
                $localForage.getItem('provinces', res);
            });
        });

        $scope.setProvince = function (p) {
            $scope.settings.province = p;
            $localForage.setItem('province', p);
        };

        $scope.setNavTitle = function (title) {
            $ionicNavBarDelegate.title(title);
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

        $scope.been = function (id) {
            return _.contains($rootScope.been, id);
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

    })
    .controller('SplashCtrl', function ($scope, AuthenticationService, $state, $localForage) {
        AuthenticationService.me();
    })
    .controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate) {

        // Called to navigate to the main app
        $scope.startApp = function() {
            $state.go('tabs.dashboard');
        };
        $scope.next = function() {
            $ionicSlideBoxDelegate.next();
        };
        $scope.previous = function() {
            $ionicSlideBoxDelegate.previous();
        };

        // Called each time the slide changes
        $scope.slideChanged = function(index) {
            $scope.slideIndex = index;
        };
    })
    .controller('SignInCtrl', function ($rootScope, $scope, $state, AuthenticationService, $localForage) {
        $localForage.getItem('userCreds').then(function (data) {
            console.log(data);
            if(!angular.isUndefined(data) || data)
                AuthenticationService.login(data);
        });

        $scope.message = "";

        $scope.user = {
            email: null,
            password: null
        };

        $scope.login = function() {
            AuthenticationService.login($scope.user);
        };

        $scope.signInFacebook = function () {
            AuthenticationService.FBlogin();
        };

        $scope.$on('event:auth-loginRequired', function(e, rejection) {
            console.log('handling login required');
            $state.go('signin');
        });

        $scope.$on('event:auth-loginConfirmed', function() {
            $scope.username = null;
            $scope.password = null;
            $rootScope.isLoggedin = true;
            $state.go('tabs.dashboard');
        });

        $scope.$on('event:auth-login-failed', function(e, status) {
            var error = "Login failed.";
            if (status == 401) {
                error = "Invalid Username or Password.";
            }
            $scope.message = error;
        });

        $scope.$on('event:auth-logout-complete', function() {
            console.log("logout complete");
            $state.go('signin', {}, {reload: true, inherit: false});
        });
    })
    .controller('LogoutCtrl', function ($scope, AuthenticationService) {
        $scope.$on('$ionicView.enter', function () {
            AuthenticationService.logout();
        });
    })
    .controller('DashboardCtrl', function ($rootScope, $scope, Province, Listing, Cuisine, $state, $interval) {
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

        $scope.$on('LocationUpdate', function () {
            if (angular.isUndefined(oldValue) && angular.isDefined(newValue)) {
                var stopNearby = $interval($scope.getNearby(), 600000);

                $scope.$on('$destroy', function () {
                    $interval.cancel(stopNearby);
                });

            }
        });

        $scope.getNearby();

        $scope.cuisines = [
            {
                img: 'img/cuisines/bahamian.jpg',
                slug: 'bahamian'
            },
            {
                img: 'img/cuisines/italian.jpg',
                slug: 'italian'
            },
            {
                img: 'img/cuisines/steakhouse.jpg',
                slug: 'steakhouse'
            },
            {
                img: 'img/cuisines/chinese.jpg',
                slug: 'chinese'
            },
            {
                img: 'img/cuisines/burgers.jpg',
                slug: 'burgers'
            },
        ];

        $scope.startSearch = function () {
            $state.go('tabs.results', { search: this.search });
        };

        $scope.getWidth = function () {
            return document.getElementById('dashboard').offsetWidth - 21;
        };
    })
    .controller('FavoritesCtrl', function ($scope, $localForage, Listing, $ionicModal) {
        $scope.refresh = function () {
            $localForage.getItem('favorites').then(function (data) {
                if (data && data.length > 0) {
                    Listing.query({ids: angular.toJson(data)}, function (res) {
                        $scope.faves = res;
                        $scope.$broadcast('scroll.refreshComplete');
                    });
                }
            });
        };

        $scope.refresh();

        // FiltersModal
        $ionicModal.fromTemplateUrl('app/common/filtersModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openFiltersModal = function() {
            $scope.modal.show();
        };
        $scope.closeFiltersModal = function() {
            $scope.modal.hide();
        };
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

    })
    .controller('MapCtrl', ['$scope', 'leafletData', 'leafletBoundsHelpers', '$cordovaGeolocation', 'Listing', '$ionicModal', '$localForage',
        function ($scope, leafletData, leafletBoundsHelpers, $cordovaGeolocation, Listing, $ionicModal, $localForage) {
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
                    })
                }

                $scope.listings = res;
                for(var a = 0, len_a = res.length; a < len_a; a++) {
                    var v = res[a];
                    for (var i = 0, len = v.locations.length; i < len; i++) {
                        var loc = v.locations[i];
                        $scope.markers.push({
                            //layer: "listings",
                            lat: loc.lat,
                            lng: loc.lng,
                            getMessageScope: function () { return $scope; },
                            compileMessage: true,
                            message: '<div><h6 class="text-center">' + v.name + '</h6><div class="row"><button class="button button-small button-clear col col-33">' + v.like_count + ' <span class="icon ion-heart calm"></span></button><button class="button button-small button-clear col col-33">' + v.rating_count + ' <span class="icon ion-chatbubbles energized"></span></button><button class="button button-small button-clear balanced col col-33">' + $scope.showDollars(v.restaurant.price_range, true) + '</button></div><div class="row"><div class="col col-50"><a ui-sref="tabs.restaurant({id:\'' + v.slug + '\'})" class="button button-small button-icon icon ion-eye"></a></div><div class="col col-50"><tt-directions get-directions="startDirections(lat, lng)" lat="'+loc.lat+'" lng="'+loc.lng+'" ></tt-directions></div></div></div>',
                            icon: {
                                prefix: 'ion',
                                type: 'extraMarker',
                                icon: 'ion-pizza',
                                markerColor: 'red'/*v.rating_count != 0
                                 ? v.rating_cache > 2
                                 ? v.rating_cache > 4
                                 ? 'green'
                                 :'orange'
                                 :'red'
                                 : 'white'*/,
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
                    tileLayer: "http://api.tiles.mapbox.com/v4/jgiovanni.lonlneon/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ",
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
                maxBounds: maxBounds,
                /*layers: {
                 baselayers: {
                 mb: {
                 name: "Bahamas",
                 type: "xyz",
                 url: "http://api.tiles.mapbox.com/v4/jgiovanni.lonlneon/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ",
                 layerOptions: {
                 subdomains: [
                 "a",
                 "b",
                 "c"
                 ],
                 //attribution: "© OpenStreetMap contributors",
                 continuousWorld: true
                 },
                 layerParams: {}
                 }
                 },
                 overlays: {
                 listings: {
                 name: "Listings",
                 type: "markercluster",
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
            $scope.markers = [];

            leafletData.getMap().then(function (map) {
                $localForage.getItem('province').then(function (res) {
                    map.panTo(new L.LatLng(res.lat, res.lng));
                });
                var provWatch = $scope.$watch('settings.province', function (newValue, oldValue) {
                    map.panTo(new L.LatLng(newValue.lat, newValue.lng));
                });


                L.mapbox.accessToken = 'pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ';
                $scope.directions = L.mapbox.directions();
                $scope.directions.setOrigin(L.latLng($scope.myLocation.coords.latitude,$scope.myLocation.coords.longitude));

                var directionsLayer = L.mapbox.directions.layer($scope.directions, {readonly:true})
                    .addTo(map);

                var directionsErrorsControl = L.mapbox.directions.errorsControl('errors', $scope.directions)
                    .addTo(map);

                var directionsRoutesControl = L.mapbox.directions.routesControl('routes', $scope.directions)
                    .addTo(map);

                var directionsInstructionsControl = L.mapbox.directions.instructionsControl('instructions', $scope.directions)
                    .addTo(map);
            });


            $scope.startDirections = function (lat, lng) {
                $scope.directions.setDestination(L.latLng(lat,lng));
                $scope.directions.query();
                $scope.directionsSet = true;
                $scope.showDirections = false;
                leafletData.getMap().then(function(map) {
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
    .controller('CuisinesCtrl', function ($rootScope, $scope, $localForage, Cuisine, Listing, $stateParams) {
        $scope.refresh = function () {
            $localForage.getItem('cuisines').then(function (data) {
                if (!!data && data.length) {
                    $scope.$broadcast('scroll.refreshComplete');
                    return $scope.cuisines = data;
                } else {
                    Cuisine.query({}, function (res) {
                        $localForage.setItem('cuisines', res);
                        $scope.$broadcast('scroll.refreshComplete');
                        return $scope.cuisines = res;
                    });
                }
            });
        };
        $scope.refresh();
    })
    .controller('CuisineCtrl', function ($rootScope, $scope, $localForage, Cuisine, $stateParams, ListingRepository, $ionicModal) {
        $scope.refresh = function () {
            Cuisine.get({id: $stateParams.id, restaurants: true}, function (res) {
                $scope.cuisine = res;
                $scope.$broadcast('scroll.refreshComplete');
            });
        };
        $scope.refresh();

        // FiltersModal
        $ionicModal.fromTemplateUrl('app/common/filtersModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openFiltersModal = function() {
            $scope.modal.show();
        };
        $scope.closeFiltersModal = function() {
            $scope.modal.hide();
        };
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
    })
    .controller('RestaurantsCtrl', ['$scope', '$rootScope', 'Listing', 'Cuisine', '$stateParams', 'ListingRepository', '$ionicModal',
        function ($scope, $rootScope, Listing, Cuisine, $stateParams, ListingRepository, $ionicModal) {
            console.log($stateParams);
            $rootScope.cuisines = Cuisine.query();

            $rootScope.filters = {
                search: $stateParams.search || undefined,
                province: '',
                province_id: 0,
                sort: '',
                cuisine: $stateParams.cuisine || undefined,
                price_range: undefined,
                type: undefined,
                selected: [],
                toggles: [
                    {icon: 'icon ion-wifi', name: 'Wi-fi', slug: 'wifi', value: undefined},
                    {icon: 'icon ion-music-note', name: 'Live Music', slug: 'live_music', value: undefined},
                    {icon: 'icon ion-ios-telephone', name: 'Takeout', slug: 'takeout', value: undefined},
                    {icon: 'icon ion-model-s', name: 'Delivery', slug: 'delivery', value: undefined},
                    {icon: 'icon ion-help-buoy', name: 'Handicap Accessible', slug: 'disability', value: undefined},
                    {icon: 'icon ion-ios-sunny', name: 'Outdoor Seating', slug: 'outdoor_seating', value: undefined},
                    {icon: 'icon ion-checkmark ', name: 'Reservations Pref/Only', slug: 'reservations_preferred', value: undefined },
                ]
            };

            $scope.qData = {app_search: true, search: $scope.filters.search, cuisine: $scope.filters.cuisine};
            $scope.refresh = function () {
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

            $scope.refresh();

            $rootScope.sorts = [
                {name: 'Default', value: ''},
                {name: 'Name', value: 'name'},
                {name: 'Price', value: 'restaurant.price_range'},
                {name: 'Highest Rating', value: '-rating_cache'},
                {name: 'Popularity', value: '-like_count'},
                //{ name: 'Most Reviewed', value:'-like_count'},
            ];

            $scope.adZone = function () {
                return broadstreet.zone(42647);
            };

            $scope.$on('$destroy', function () {
                $rootScope.filtersMenu = false;
                $rootScope.cuisines = $rootScope.sorts = [];
                $rootScope.filters = {
                    toggles: {}
                };
            });

            // FiltersModal
            $ionicModal.fromTemplateUrl('app/common/filtersModal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.modal = modal;
            });
            $scope.openFiltersModal = function() {
                $scope.modal.show();
            };
            $scope.closeFiltersModal = function() {
                $scope.modal.hide();
            };
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
    }])
    .controller('RestaurantCtrl', ['$scope', 'Listing', 'listing', '$ionicPopover', '$ionicTabsDelegate', '$ionicModal', 'leafletData', 'leafletBoundsHelpers', 'HoursDays', 'StartHours', 'EndHours', 'ListingRepository',
        function ($scope, Listing, listing, $ionicPopover, $ionicTabsDelegate, $ionicModal, leafletData, leafletBoundsHelpers, HoursDays, StartHours, EndHours, ListingRepository) {
            $scope.listing = listing.data;

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

            // Leaflet Map Functions
            $scope.markers = [];
            for (var i = 0, len = $scope.listing.locations.length; i < len; i++) {
                var loc = $scope.listing.locations[i];
                $scope.markers.push({
                    //layer: "listings",
                    lat: loc.lat,
                    lng: loc.lng,
                    getMessageScope: function () { return $scope; },
                    compileMessage: true,
                    message: '<div><h6 class="text-center">' + $scope.listing.name + '</h6><div class="row row-no-padding"><div class="col"><tt-directionsa get-directions="startDirections(lat, lng)" lat="'+loc.lat+'" lng="'+loc.lng+'" ></tt-directionsa></div></div></div>',
                    icon: {
                        prefix: 'ion',
                        type: 'extraMarker',
                        icon: 'ion-pizza',
                        markerColor: 'aqua'/*v.rating_count != 0
                         ? v.rating_cache > 2
                         ? v.rating_cache > 4
                         ? 'green'
                         :'orange'
                         :'red'
                         : 'white'*/,
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
                })
            }
            // Default Center
            // TODO: Map center based on default province
            $scope.center = {
                lat: 25.033965,
                lng: -77.35176,
                zoom: 11
            };

            $scope.height = window.screen.height;
            var bounds = leafletBoundsHelpers.createBoundsFromArray([
                [27.293689, -79.541016],
                [20.797522, -71.015968]
            ]);

            angular.extend($scope, {
                defaults: {
                    tileLayer: "http://api.tiles.mapbox.com/v4/jgiovanni.lonlneon/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ",
                    //maxZoom: 16,
                    minZoom: 8,
                    zoomControlPosition: 'topright',
                    attributionControl: false,
                    path: {
                        weight: 0,
                        color: '#800000',
                        opacity: 0
                    },
                    tileLayerOptions: {
                        detectRetina: true,
                        reuseTiles: true
                    }
                    //scrollWheelZoom: false
                },
                bounds: bounds,
                geojson: {
                    data: {
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "id": "BHS",
                            "properties": {"name": "Bahamas", "name_long": "Bahamas"},
                            "geometry": {
                                "type": "MultiPolygon",
                                "coordinates": [[[[-73.02685546874994, 21.19238281250003], [-73.05874023437497, 21.119042968750023], [-73.16455078125003, 20.979150390625023], [-73.40078125000002, 20.943896484375045], [-73.66103515625, 20.93740234375005], [-73.68115234375003, 20.9755859375], [-73.68681640625002, 21.009130859375006], [-73.66782226562498, 21.061572265625017], [-73.66958007812497, 21.082226562499983], [-73.68037109374995, 21.103320312500017], [-73.58505859374998, 21.125927734374983], [-73.52309570312497, 21.190820312499966], [-73.42451171874995, 21.201757812499977], [-73.3015625, 21.156152343750023], [-73.23535156249997, 21.15449218750004], [-73.13730468749998, 21.204785156249983], [-73.05849609375, 21.313378906249994], [-73.01166992187495, 21.29951171875001], [-73.02685546874994, 21.19238281250003]]], [[[-72.91611328125003, 21.506689453125034], [-73.04931640625, 21.457617187499977], [-73.06269531249995, 21.51533203125001], [-72.994775390625, 21.561621093750034], [-72.91611328125003, 21.506689453125034]]], [[[-73.041015625, 22.429052734375006], [-72.97895507812495, 22.414599609375074], [-72.94521484375002, 22.415625], [-72.83076171874995, 22.385595703125034], [-72.76259765625002, 22.344384765624966], [-72.74726562500001, 22.32739257812497], [-72.78388671875001, 22.290625], [-72.88916015624997, 22.360253906250023], [-72.98105468750003, 22.369238281249977], [-73.11020507812498, 22.367578125], [-73.16191406250002, 22.380712890625006], [-73.12739257812501, 22.45532226562503], [-73.041015625, 22.429052734375006]]], [[[-74.20673828124998, 22.213769531250023], [-74.27690429687499, 22.183691406250006], [-74.261328125, 22.23554687500001], [-74.12675781249993, 22.323388671874966], [-74.05234374999998, 22.40063476562497], [-74.01005859374996, 22.427978515625057], [-73.994970703125, 22.44921875000003], [-73.93598632812498, 22.477734374999955], [-73.906396484375, 22.527441406250063], [-73.91455078124997, 22.568017578124966], [-73.97636718749993, 22.635058593750045], [-73.97548828124994, 22.682275390624994], [-73.95419921874995, 22.71552734375001], [-73.84995117187503, 22.731054687500063], [-73.87749023437496, 22.680761718750034], [-73.83652343749998, 22.538427734374977], [-73.97460937500003, 22.361181640625034], [-74.09291992187497, 22.30625], [-74.20673828124998, 22.213769531250023]]], [[[-74.05751953124997, 22.723486328125034], [-74.03476562500003, 22.70556640625003], [-74.09858398437498, 22.665429687500023], [-74.24223632812502, 22.715087890625], [-74.27460937499995, 22.71166992187503], [-74.303125, 22.764453125000017], [-74.31396484374997, 22.803564453125006], [-74.30703125, 22.83959960937497], [-74.22148437499996, 22.811572265625045], [-74.17539062499998, 22.759912109374994], [-74.05751953124997, 22.723486328125034]]], [[[-74.84047851562494, 22.894335937500017], [-74.846875, 22.868701171875045], [-74.97333984374993, 23.068554687499983], [-75.13212890624996, 23.117089843750023], [-75.22333984374995, 23.165332031250074], [-75.20439453125002, 23.192724609375063], [-75.14111328125, 23.20463867187499], [-75.13056640624998, 23.267919921875006], [-75.15756835937498, 23.33637695312501], [-75.24125976562499, 23.47460937500003], [-75.28823242187497, 23.568261718749994], [-75.309814453125, 23.589843750000057], [-75.31596679687502, 23.668359374999966], [-75.21660156250002, 23.546777343749966], [-75.17529296874994, 23.438671874999983], [-75.1087890625, 23.33281249999999], [-75.06420898437497, 23.150195312500017], [-74.937109375, 23.08813476562497], [-74.84560546875002, 22.999902343750023], [-74.84047851562494, 22.894335937500017]]], [[[-75.66455078124997, 23.45014648437501], [-75.70634765624996, 23.44423828125005], [-75.78100585937497, 23.47065429687501], [-75.95595703125, 23.59228515625], [-76.03710937500003, 23.60278320312503], [-76.01044921875001, 23.671386718750057], [-75.94863281250002, 23.647412109374955], [-75.80751953124997, 23.54252929687499], [-75.75424804687503, 23.489990234375057], [-75.66455078124997, 23.45014648437501]]], [[[-74.42944335937497, 24.068066406249955], [-74.50869140624994, 23.959716796875], [-74.55092773437502, 23.96894531250001], [-74.52690429687502, 24.105078125000034], [-74.47202148437503, 24.126660156249983], [-74.45048828124999, 24.12548828125003], [-74.42944335937497, 24.068066406249955]]], [[[-77.65771484374994, 24.249462890624955], [-77.65615234375, 24.2265625], [-77.75527343750002, 24.163476562500023], [-77.683251953125, 24.118457031250017], [-77.61538085937494, 24.216357421875045], [-77.5615234375, 24.136816406250006], [-77.53203125000002, 23.987646484375006], [-77.53681640624993, 23.96166992187503], [-77.531884765625, 23.93940429687504], [-77.52133789062498, 23.910839843749983], [-77.51875, 23.86943359374999], [-77.57373046875, 23.739160156249994], [-77.77128906249999, 23.752539062499977], [-77.77578124999994, 23.862353515625045], [-77.80629882812494, 23.88354492187503], [-77.85224609374998, 24.040380859375006], [-77.91406249999994, 24.090917968749977], [-77.99990234374994, 24.219824218750063], [-77.950048828125, 24.253076171874994], [-77.88359375, 24.241992187500045], [-77.84956054687495, 24.25751953125001], [-77.757421875, 24.26992187500005], [-77.70146484374999, 24.287548828124983], [-77.65771484374994, 24.249462890624955]]], [[[-75.30839843749999, 24.2], [-75.30175781249994, 24.149169921875057], [-75.36875, 24.159472656250017], [-75.467626953125, 24.139599609374955], [-75.50322265624996, 24.139062500000023], [-75.48105468749998, 24.173876953125017], [-75.41240234374993, 24.220947265625], [-75.40893554687503, 24.265771484374994], [-75.49389648437503, 24.330419921875034], [-75.5927734375, 24.491259765625017], [-75.63906250000002, 24.529394531250063], [-75.66103515624997, 24.58984375000003], [-75.74399414062498, 24.6546875], [-75.72666015625, 24.68935546875005], [-75.709619140625, 24.69750976562503], [-75.65351562499995, 24.68085937500001], [-75.52646484375, 24.449511718750045], [-75.51816406249998, 24.427343750000063], [-75.30839843749999, 24.2]]], [[[-77.34755859375, 25.013867187499983], [-77.46049804687502, 24.99311523437504], [-77.54121093749993, 25.013574218750023], [-77.56191406249997, 25.030029296875], [-77.52734374999994, 25.057666015625045], [-77.45126953125, 25.080712890625023], [-77.32910156249997, 25.083007812500057], [-77.27558593750001, 25.055761718750006], [-77.269140625, 25.043847656249966], [-77.34755859375, 25.013867187499983]]], [[[-77.74384765625001, 24.707421875], [-77.74604492187501, 24.586328125000023], [-77.735107421875, 24.49575195312505], [-77.74521484375, 24.463476562500034], [-77.85341796874994, 24.402929687500063], [-77.881201171875, 24.369091796874983], [-77.98320312500002, 24.33496093749997], [-78.04492187499997, 24.287451171875063], [-78.07583007812497, 24.364648437499966], [-78.1357421875, 24.41235351562503], [-78.14580078125002, 24.493457031250017], [-78.19160156250001, 24.46606445312503], [-78.25761718749996, 24.482763671875063], [-78.36650390624993, 24.544189453125057], [-78.435302734375, 24.627587890624994], [-78.33891601562499, 24.64204101562501], [-78.31899414062494, 24.590234375000023], [-78.24272460937493, 24.65380859375], [-78.26005859375002, 24.68730468749999], [-78.27382812499997, 24.691601562499983], [-78.298828125, 24.753906250000057], [-78.18408203125, 24.917089843750006], [-78.159326171875, 25.022363281250023], [-78.21137695312495, 25.191259765624977], [-78.16279296875001, 25.20234375000001], [-78.03330078125, 25.143115234375045], [-77.97529296874998, 25.084814453125063], [-77.97338867187497, 25.004785156249994], [-77.91894531249997, 24.942822265624983], [-77.84013671874999, 24.794384765624955], [-77.74384765625001, 24.707421875]]], [[[-76.64882812499994, 25.487402343750006], [-76.48422851562498, 25.374609375000034], [-76.34379882812496, 25.33203124999997], [-76.19199218749995, 25.190820312499994], [-76.12661132812497, 25.14052734375005], [-76.11494140624998, 25.09472656250003], [-76.14052734374994, 24.885644531249994], [-76.17465820312498, 24.759765625], [-76.16953125, 24.6494140625], [-76.20517578124998, 24.682080078124983], [-76.24121093749994, 24.754345703124955], [-76.30029296875, 24.7958984375], [-76.319970703125, 24.81767578124999], [-76.21376953124994, 24.822460937499983], [-76.20434570312497, 24.936230468749983], [-76.15253906250001, 25.025976562500063], [-76.160400390625, 25.119335937499983], [-76.28432617187502, 25.222119140624955], [-76.36928710937502, 25.312597656250006], [-76.49990234374997, 25.341552734375057], [-76.62070312499998, 25.43164062500003], [-76.69277343750002, 25.442724609375063], [-76.78066406249997, 25.426855468750006], [-76.74892578125, 25.480566406250034], [-76.72695312499997, 25.551611328125034], [-76.71083984374997, 25.564892578124983], [-76.64882812499994, 25.487402343750006]]], [[[-78.49287109375001, 26.729052734375017], [-78.37172851562502, 26.697949218749983], [-78.30683593749995, 26.70219726562496], [-78.267919921875, 26.72265625000003], [-78.08867187499999, 26.71430664062504], [-77.9439453125, 26.744238281250006], [-77.92246093749998, 26.69111328125001], [-77.926123046875, 26.663378906250045], [-78.23388671875, 26.637353515624994], [-78.51621093749998, 26.55937], [-78.67094726562496, 26.506542968749983], [-78.74365234374994, 26.50068359375004], [-78.79921875, 26.528466796874994], [-78.98564453124996, 26.689501953125045], [-78.935791015625, 26.673437500000063], [-78.79804687500001, 26.582421875], [-78.7125, 26.599023437499994], [-78.63325195312501, 26.6591796875], [-78.62114257812493, 26.704638671875017], [-78.63295898437497, 26.726171875000034], [-78.59711914062493, 26.797949218750006], [-78.49287109375001, 26.729052734375017]]], [[[-77.22563476562496, 25.904199218750023], [-77.246435546875, 25.89545898437501], [-77.33325195312503, 25.99560546874997], [-77.40317382812498, 26.02470703124996], [-77.2939453125, 26.09550781249999], [-77.24677734374998, 26.156347656250034], [-77.24775390625001, 26.2890625], [-77.22109375, 26.361767578124983], [-77.23012695312497, 26.424707031249994], [-77.20605468749994, 26.48896484375004], [-77.238623046875, 26.561132812500006], [-77.32993164062498, 26.61835937500001], [-77.510595703125, 26.845996093750045], [-77.79599609374998, 26.901269531250023], [-77.94375, 26.90356445312503], [-77.86254882812503, 26.940087890625023], [-77.78754882812493, 26.935644531250006], [-77.67211914062497, 26.913916015625006], [-77.53388671874995, 26.903417968750006], [-77.44941406249998, 26.83642578125003], [-77.36875, 26.74760742187496], [-77.29589843749997, 26.71166992187503], [-77.26591796874999, 26.688818359374977], [-77.26928710937497, 26.663037109374983], [-77.25717773437498, 26.638818359375023], [-77.16210937499997, 26.597265624999977], [-77.06635742187501, 26.530175781249994], [-77.03828124999998, 26.333447265624983], [-77.16728515624996, 26.240332031250006], [-77.191015625, 25.955468749999966], [-77.22563476562496, 25.904199218750023]]]]
                            }
                        }]
                    },
                    style: {
                        fillColor: "green",
                        weight: 0,
                        opacity: 0,
                        color: 'white',
                        dashArray: '0',
                        fillOpacity: 0
                    }
                }
                /*layers: {
                 baselayers: {
                 mb: {
                 name: "Bahamas",
                 type: "xyz",
                 url: "http://api.tiles.mapbox.com/v4/jgiovanni.lonlneon/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoiamdpb3Zhbm5pIiwiYSI6Ilc3RUJiVlEifQ.Xlx3a_O01kmy5InBXq3BaQ",
                 layerOptions: {
                 subdomains: [
                 "a",
                 "b",
                 "c"
                 ],
                 //attribution: "© OpenStreetMap contributors",
                 continuousWorld: true
                 },
                 layerParams: {}
                 }
                 },
                 overlays: {
                 listings: {
                 name: "Listings",
                 type: "markercluster",
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
                $scope.directions.setOrigin(L.latLng($scope.myLocation.coords.latitude,$scope.myLocation.coords.longitude));

                var directionsLayer = L.mapbox.directions.layer($scope.directions, {readonly:true})
                    .addTo(map);

                var directionsErrorsControl = L.mapbox.directions.errorsControl('errors', $scope.directions)
                    .addTo(map);

                var directionsRoutesControl = L.mapbox.directions.routesControl('routes', $scope.directions)
                    .addTo(map);

                var directionsInstructionsControl = L.mapbox.directions.instructionsControl('instructions', $scope.directions)
                    .addTo(map);
            });

            $scope.startDirections = function (lat, lng) {
                $scope.directions.setDestination(L.latLng(lat,lng));
                $scope.directions.query();
                $scope.directionsSet = true;
                $scope.showDirections = false;
                leafletData.getMap().then(function(map) {
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

            // Image View Modal
            $ionicModal.fromTemplateUrl('app/restaurants/image-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
            });
            $scope.openModal = function () {
                $scope.modal.show();
            };
            $scope.closeModal = function () {
                $scope.modal.hide();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.modal.remove();
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
        }])

    .controller('SettingsCtrl', function ($scope, $localForage, $cordovaAppRate) {
        $scope.settings = {
            enableFriends: true
        };

        $scope.rateApp = function () {
            $cordovaAppRate.promptForRating(true).then(function (result) {
                console.log(result);
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

    })

    .controller('AccountCtrl', function ($scope) {
        $scope.settings = {
            enableFriends: true
        };
    });
