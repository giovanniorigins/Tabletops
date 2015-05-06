var valById = function (arr, id) {
    return _.find(arr, function (a) {
        return parseFloat(a.id) == parseFloat(id)
    });
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

// ES5 15.4.4.21 Array.prototype.reduce ( callbackfn [ , initialValue ] )
// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function (fun /*, initialValue */) {
        "use strict";

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== "function") {
            throw new TypeError();
        }

        // no value to return if no initial value and an empty array
        if (len === 0 && arguments.length === 1) {
            throw new TypeError();
        }

        var k = 0;
        var accumulator;
        if (arguments.length >= 2) {
            accumulator = arguments[1];
        } else {
            do {
                if (k in t) {
                    accumulator = t[k++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++k >= len) {
                    throw new TypeError();
                }
            }
            while (true);
        }

        while (k < len) {
            if (k in t) {
                accumulator = fun.call(undefined, accumulator, t[k], k, t);
            }
            k++;
        }

        return accumulator;
    };
}

var closestLocation = function (targetLocation, locationData) {
    function vectorDistance(dx, dy) {
        return Math.sqrt(dx * dx + dy * dy);
    }

    function locationDistance(location1, location2) {
        var dx = (location1.latitude || location1.lat) - (location2.latitude || location2.lat),
            dy = (location1.longitude || location1.lng) - (location2.longitude || location2.lng);

        return vectorDistance(dx, dy);
    }

    return locationData.reduce(function (prev, curr) {
        var prevDistance = locationDistance(targetLocation, prev),
            currDistance = locationDistance(targetLocation, curr);
        return (prevDistance < currDistance) ? prev : curr;
    });
};

angular.module('tabletops.controllers', [])
    .controller('MainCtrl',
    function ($rootScope, $scope, $ionicPlatform, $cordovaNetwork, $cordovaGeolocation, $cordovaToast, $state, $localForage, Province, ListingRepository, $ionicModal, $timeout) {
        $scope.settings = {
            geolocation: false,
            province: {}
        };

        $scope.hasHeaderFabRight = false;

        // Handle Settings
        $localForage.getItem('province').then(function (data) {
            if ( angular.isObject(data) )
                $scope.settings.province = data;
        });

        // Handle Network Status
        $ionicPlatform.ready(function () {

            var type = $cordovaNetwork.getNetwork();

             var isOnline = $cordovaNetwork.isOnline();

             var isOffline = $cordovaNetwork.isOffline();

            // listen for Online event
            $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
                console.log('App Online');
                $rootScope.onlineState = networkState;
            });

            // listen for Offline event
            $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
                console.log('App Offline');
                $rootScope.offlineState = networkState;
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
                console.log(err);
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
            $scope.provinces = angular.isDefined(data) ? data : Province.query({}, function (res) {
                $scope.provinces = res;
                $localForage.setItem('provinces', res);
            });

            $scope.settings.province = _.findWhere($scope.provinces, {slug: "np-pi"});
        });

        $scope.setProvince = function (p) {
            $scope.settings.province = p;
            $localForage.setItem('province', p);
            $scope.closeProvinceModal();
            $cordovaToast.showShortBottom(p.name + ' is now your default province.')
        };

        $scope.findClosest = function (targetLocation, locations) {
            var closest = closestLocation(targetLocation, locations);
            console.log(closest);
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

        $scope.$on('event:auth-loginConfirmed', function () {
            $rootScope.isLoggedin = true;
            $state.go('tabs.dashboard');
        });

        // Province Modal
        $ionicModal.fromTemplateUrl('app/common/ProvinceModal.html', {
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

        $scope.$on('$ionicView.enter', function() {
            $timeout(function () {
                console.log('Set Ink');
                // Set Ink
                ionic.material.ink.displayEffect();
            }, 600);
        });

    })
    .controller('SplashCtrl', function ($scope, AuthenticationService, $state, $localForage, $ionicPlatform) {
        $ionicPlatform.ready(function () {
            AuthenticationService.FbCheckLogin();
        });
    })
    .controller('IntroCtrl', function ($scope, $state, $ionicSlideBoxDelegate) {

        // Called to navigate to the main app
        $scope.startApp = function () {
            $state.go('tabs.dashboard');
        };
        $scope.next = function () {
            $ionicSlideBoxDelegate.next();
        };
        $scope.previous = function () {
            $ionicSlideBoxDelegate.previous();
        };

        // Called each time the slide changes
        $scope.slideChanged = function (index) {
            $scope.slideIndex = index;
        };
    })
    .controller('SignInCtrl', function ($rootScope, $scope, $state, AuthenticationService, $localForage) {
        $localForage.getItem('userCreds').then(function (data) {
            console.log(data);
            if (!angular.isUndefined(data) || data) {
                AuthenticationService.login(data);
            }
        });

        $scope.message = "";

        $scope.user = {
            email: null,
            password: null
        };

        $scope.login = function () {
            AuthenticationService.login($scope.user);
        };

        $scope.signInFacebook = function () {
            AuthenticationService.FbLogin();
        };

        $scope.$on('event:auth-loginRequired', function (e, rejection) {
            console.log('handling login required');
            $state.go('signin');
        });

        $scope.$on('event:auth-login-failed', function (e, status) {
            var error = "Login failed.";
            if (status == 401) {
                error = "Invalid Username or Password.";
            }
            $scope.message = error;
        });

        $scope.$on('event:auth-logout-complete', function () {
            console.log("logout complete");
            $state.go('signin', {}, {reload: true, inherit: false});
        });
    })
    .controller('LogoutCtrl', function ($scope, AuthenticationService) {
        $scope.$on('$ionicView.enter', function () {
            AuthenticationService.logout();
        });
    })
    .controller('DashboardCtrl', function ($rootScope, $scope, Province, Listing, Cuisine, $state, $interval, $ionicModal, $timeout, $localForage) {
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
            { img: 'img/cuisines/bahamian.jpg', slug: 'bahamian' },
            { img: 'img/cuisines/italian.jpg', slug: 'italian' },
            { img: 'img/cuisines/steakhouse.jpg', slug: 'steakhouse' },
            { img: 'img/cuisines/chinese.jpg', slug: 'chinese' },
            { img: 'img/cuisines/burgers.jpg', slug: 'burgers' }
        ];

        $scope.toRestaurant = function (id, array) {
            var obj = _.findWhere(array, {slug: id});
            $localForage.setItem('currentListing', obj).then(function () {
                $scope.$broadcast('loading:show');
                $state.go('tabs.restaurant', {id: id});
            })
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
        $ionicModal.fromTemplateUrl('app/dashboard/SearchModal.html', {
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

        $scope.$on('$ionicView.enter', function() {
            $scope.$parent.hasHeaderFabRight = true;
            document.getElementById('fab-search').classList.toggle('hide');
        });

        $scope.$on('$ionicView.leave', function() {
            $scope.$parent.hasHeaderFabRight = false;
            document.getElementById('fab-search').classList.toggle('hide');
        });

        // Set Ink
        ionic.material.ink.displayEffect();
    })
    .controller('FavoritesCtrl', function ($scope, $localForage, Listing, $ionicModal, $state) {
        $scope.faves = [];
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

        $scope.toFavorite = function (id) {
            var obj = _.findWhere($scope.faves, {slug: id});
            $localForage.setItem('currentListing', obj).then(function () {
                $scope.$broadcast('loading:show');
                $state.go('tabs.favorite', {id: id});
            })
        };

        $scope.refresh();

        // FiltersModal
        $ionicModal.fromTemplateUrl('app/common/filtersModal.html', {
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
                for (var a = 0, len_a = res.length; a < len_a; a++) {
                    var v = res[a];
                    for (var i = 0, len = v.locations.length; i < len; i++) {
                        var loc = v.locations[i];
                        $scope.markers.push({
                            //layer: "listings",
                            lat: loc.lat,
                            lng: loc.lng,
                            getMessageScope: function () {
                                return $scope;
                            },
                            compileMessage: true,
                            message: '<div><h6 class="text-center">' + v.name + '</h6><div class="row"><button class="button button-small button-clear col col-33">' + v.like_count + ' <span class="icon ion-heart calm"></span></button><button class="button button-small button-clear col col-33">' + v.rating_count + ' <span class="icon ion-chatbubbles energized"></span></button><button class="button button-small button-clear balanced col col-33">' + $scope.showDollars(v.restaurant.price_range, true) + '</button></div><div class="row"><div class="col col-50"><a ui-sref="tabs.restaurant({id:\'' + v.slug + '\'})" class="button button-clear button-small button-icon icon ion-eye"></a></div><div class="col col-50"><tt-directions get-directions="startDirections(lat, lng)" lat="' + loc.lat + '" lng="' + loc.lng + '" ></tt-directions></div></div></div>',
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
                maxBounds: maxBounds
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
    .controller('CuisineCtrl', function ($rootScope, $scope, $localForage, Cuisine, $stateParams, ListingRepository, $ionicModal, $state) {
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
            var obj = _.findWhere($scope.faves, {slug: id});
            $localForage.setItem('currentListing', obj).then(function () {
                $scope.$broadcast('loading:show');
                $state.go('tabs.cuisine-restaurant', { id: id, cuisine_id: cid});
            })
        };

    })
    .controller('RestaurantsCtrl', ['$scope', '$rootScope', 'Listing', 'Cuisine', '$stateParams', 'ListingRepository', '$ionicModal', '$localForage', '$timeout', '$state',
        function ($scope, $rootScope, Listing, Cuisine, $stateParams, ListingRepository, $ionicModal, $localForage, $timeout, $state) {
            Cuisine.query({}, function (res) {
                $scope.cuisines = res;
                $scope.cuisineList = angular.copy(res);
                $scope.cuisineList.push({ slug: null, name:'Any'});
            });

            $scope.filters = {
                app_search: true,
                search: $stateParams.search || undefined,
                province: $scope.settings.province.slug,
                province_id: $scope.settings.province.id,
                sort: undefined,
                cuisine: $stateParams.cuisine || undefined,
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

            $scope.toggles = [
                {icon: 'icon ion-wifi', name: 'Wi-fi', slug: 'wifi', value: undefined},
                {icon: 'icon ion-music-note', name: 'Live Music', slug: 'live_music', value: undefined},
                {icon: 'icon ion-ios-telephone', name: 'Takeout', slug: 'takeout', value: undefined},
                {icon: 'icon ion-model-s', name: 'Delivery', slug: 'delivery', value: undefined},
                {icon: 'icon ion-help-buoy', name: 'Handicap Accessible', slug: 'disability', value: undefined},
                {icon: 'icon ion-ios-sunny', name: 'Outdoor Seating', slug: 'outdoor_seating', value: undefined},
                {icon: 'icon ion-checkmark ', name: 'Reservations Pref/Only', slug: 'reservations_preferred', value: undefined}
            ];

            /*$scope.$watchCollection('filters', function (newValue, oldValue) {
                console.log(newValue);
            });*/

            $scope.refresh = function () {
                if (angular.isDefined($scope.myLocation) && angular.isObject($scope.myLocation.coords)) {
                    angular.extend($scope.filters, {
                        lat: $scope.myLocation.coords.latitude,
                        lng: $scope.myLocation.coords.longitude
                    });
                }
                $scope.restaurants = Listing.query($scope.filters);
                $scope.restaurants.$promise.finally(function () {
                    ionic.material.motion.blinds();
                    $timeout(function () {
                        // Set Ink
                        ionic.material.ink.displayEffect();
                    }, 600);
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.$watchCollection('filters', function (newValue, oldValue) {

                    });
                });
            };

            $scope.refresh();

            $scope.sorts = [
                {name: 'Default', value: undefined},
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
                $rootScope.sorts = [];
                $rootScope.filters = {};
            });

            // FiltersModal
            $ionicModal.fromTemplateUrl('app/common/filtersModal.html', {
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
                    $scope.$broadcast('loading:show');
                    $state.go('tabs.restaurant', {id: id});
                })
            };

            //force refresh on province change
            $scope.$on('$ionicView.enter', function() {
                $localForage.getItem('province').then(function (data) {
                    if (data.slug != $scope.filters.province) {
                        $scope.filters.province = data.slug;
                        $scope.refresh();
                    }
                });
            })

            // Set Ink
            ionic.material.ink.displayEffect();

        }])
    .controller('RestaurantCtrl', ['$scope', 'Listing', '$ionicPopover', '$ionicTabsDelegate', '$ionicModal', '$state', '$localForage', 'HoursDays', 'StartHours', 'EndHours',
        function ($scope, Listing, $ionicPopover, $ionicTabsDelegate, $ionicModal, $state, $localForage, HoursDays, StartHours, EndHours) {

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
                        $state.go('tabs.restaurant-map', {id: $scope.listing.id, target: id});
                    })
                };

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
                body: ''
            };

            $scope.expandText = function(){
                var element = document.getElementById("txtnotes");
                element.style.height =  element.scrollHeight + "px";
            };

            $scope.$on('$ionicView.leave', function() {
                //$localForage.removeItem('currentListing');
            })
        }])
    .controller('RestaurantMapCtrl', function ($scope, $localForage, leafletData, leafletBoundsHelpers, HoursDays, StartHours, EndHours) {
        $scope.directionsSet = false;
        $scope.showDirections = false;

        $localForage.getItem('currentListing').then(function (listing) {
            $scope.listing = listing;

            // Leaflet Map Functions
            $scope.markers = [];
            for (var i = 0, len = $scope.listing.locations.length; i < len; i++) {
                var loc = $scope.listing.locations[i];
                $scope.markers.push({
                    //layer: "listings",
                    lat: loc.lat,
                    lng: loc.lng,
                    getMessageScope: function () {
                        return $scope;
                    },
                    compileMessage: true,
                    message: '<div><h6 class="text-center">' + $scope.listing.name + '</h6><div class="row row-no-padding"><div class="col"><tt-directionsa get-directions="startDirections(lat, lng)" lat="' + loc.lat + '" lng="' + loc.lng + '" ></tt-directionsa></div></div></div>',
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
        })
    })
    .controller('AccountCtrl', function ($scope, $localForage, $cordovaFacebook, $timeout) {
        $localForage.getItem('user').then(function (res) {
            $scope.user = res;
        });
        $localForage.getItem('useFacebook').then(function (res) {
            $scope.useFacebook = res;
        });

        $cordovaFacebook.api('me/friends?fields=name,id,picture.width(200)')
            .then(function (res) {
                $scope.friends = res.data;
            })

        // Set Motion
        $timeout(function() {
            ionic.material.motion.slideUp({
                selector: '.slide-up'
            });
        }, 900);

    })
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

