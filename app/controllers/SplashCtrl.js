/**
 * @ngdoc controller
 * @name Splash
 *
 * @description
 * _Please update the description and dependencies._
 *
 * @requires $scope
 * */
angular.module('tabletops.controllers')
    .controller('SplashCtrl', ['$scope', 'AuthenticationService', '$state', '$localForage', '$ionicPlatform',
        function ($scope, AuthenticationService, $state, $localForage, $ionicPlatform) {
            'use strict';
            $ionicPlatform.ready(function () {
                console.log('Beginning AuthCheck');
                AuthenticationService.authCheck();
            });
        }
    ]);
