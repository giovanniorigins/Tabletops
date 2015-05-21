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
    .controller('SplashCtrl', ['$scope', 'AuthenticationService', '$ionicPlatform',
        function ($scope, AuthenticationService, $ionicPlatform) {
            'use strict';
            console.log('Beginning AuthCheck');
            $ionicPlatform.ready(function () {
                return AuthenticationService.authCheck();
            });
        }
    ]);
