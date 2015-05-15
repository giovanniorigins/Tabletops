angular.module('tabletops.directives', [])
    .directive('ttDirections', [function () {
        'use strict';
        return {
            restrict: 'E',
            scope: {
                getDirections: '&',
                lat: '=',
                lng: '='
            },
            replace: true,
            template: '<a ng-click=\'getDirections({lat:lat, lng:lng})\' class=\'button button-raised button-small ink-dark\'>Directions</a>',
            controller: ['$scope', function ($scope) {
                console.log($scope);
                //this.shared = 'ok'; // add data to the controller instance
            }]
        };
    }])
    .directive('ttDirectionsa', [function () {
        'use strict';
        return {
            restrict: 'E',
            scope: {
                getDirections: '&',
                lat: '=',
                lng: '='
            },
            template: '<a ng-click=\'getDirections({lat:lat, lng:lng})\' class=\'button button-raised button-small ink-dark\'>Directions</a>',
            controller: ['$scope', function ($scope) {
                console.log($scope);
                //this.shared = 'ok'; // add data to the controller instance
            }]
        };
    }])
    .directive('ngEnter', ['$cordovaKeyboard', function($cordovaKeyboard) {
        'use strict';
        return function(scope, element) {
            element.bind('keydown keypress', function(event) {
                if(event.which === 13) {
                    event.preventDefault();
                    $cordovaKeyboard.close();
                }
            });
        };
    }]);