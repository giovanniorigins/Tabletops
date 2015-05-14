/**
 * @ngdoc controller
 * @name Login
 *
 * @description
 * _Please update the description and dependencies._
 *
 * @requires $scope
 * */
angular.module('tabletops.controllers')
    .controller('LoginCtrl', ['$rootScope', '$scope', '$state', 'AuthenticationService', '$localForage',
        function($rootScope, $scope, $state, AuthenticationService, $localForage){
            'use strict';
            $scope.message = '';

            $scope.user = {
                email: null,
                password: null
            };

            $scope.login = function () {
                AuthenticationService.login($scope.user);
            };
        }
    ]);
