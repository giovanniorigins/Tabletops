/**
 * @ngdoc controller
 * @name Forgot
 *
 * @description
 * _Please update the description and dependencies._
 *
 * @requires $scope
 * */
angular.module('tabletops.controllers')
    .controller('ForgotCtrl', ['$rootScope', '$scope', '$state', 'AuthenticationService', '$localForage',
        function($rootScope, $scope, $state, AuthenticationService, $localForage){
            'use strict';
            $scope.passwordReset = function (email) {
                //AuthenticationService.passwordReset(email);
            };
        }
    ]);
