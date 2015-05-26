/**
 * @ngdoc controller
 * @name CreateAccount
 *
 * @description
 * _Please update the description and dependencies._
 *
 * @requires $scope
 * */
angular.module('tabletops.controllers')
    .controller('CreateAccountCtrl', ['$rootScope', '$scope', '$state', 'AuthenticationService', '$localForage',
        function($rootScope, $scope, $state, AuthenticationService, $localForage){
            'use strict';
            $scope.message = '';

            $scope.user = {
                email: null,
                password: null,
                fname: null,
                lname: null
            };

            $scope.submitAccount = function (user) {
                AuthenticationService.createAccount(user);
            };

        }
    ]);
