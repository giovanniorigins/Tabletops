angular.module('tabletops.directives', [])
    .directive('ttDirections', [function () {
        return {
            restrict: 'E',
            scope: {
                getDirections: '&',
                lat: '=',
                lng: '='
            },
            template: '<a ng-click="getDirections({lat:lat, lng:lng})" class="button button-small button-icon icon ion-ios-navigate-outline"></a>',
            controller: function ($scope) {
                console.log($scope);
                //this.shared = 'ok'; // add data to the controller instance
            }
        }
    }])
    .directive('ttDirectionsa', [function () {
        return {
            restrict: 'E',
            scope: {
                getDirections: '&',
                lat: '=',
                lng: '='
            },
            template: '<a ng-click="getDirections({lat:lat, lng:lng})" class="button button-small button-block button-outline">Get Directions</a>',
            controller: function ($scope) {
                console.log($scope);
                //this.shared = 'ok'; // add data to the controller instance
            }
        }
    }]);