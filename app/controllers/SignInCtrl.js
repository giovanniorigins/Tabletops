/**
 * @ngdoc controller
 * @name SignIn
 *
 * @description
 * _Please update the description and dependencies._
 *
 * @requires $scope
 * */
angular.module('tabletops.controllers')
    .controller('SignInCtrl', ['$rootScope', '$scope', '$state', 'AuthenticationService',
        function ($rootScope, $scope, $state, AuthenticationService) {
            'use strict';

            $scope.message = '';

            $scope.user = {
                email: null,
                password: null
            };

            $scope.login = function () {
                return AuthenticationService.login($scope.user).then(function (res) {

                }, function (err) {
                    if (err === 'invalid_credentials') {
                        $scope.errorMessage = 'Invalid Credentials. Please check email and password.'
                    }
                });
            };

            $scope.signInFacebook = function () {
                AuthenticationService.FbLogin();
            };

            $scope.signInGoogle = function () {
                AuthenticationService.GoogleLogin();
            };

            $scope.$on('event:auth-loginRequired', function () {
                console.log('handling login required');
                $state.go('signin');
            });

            $scope.$on('event:auth-login-failed', function (e, status) {
                var error = 'Login failed.';
                if (parseInt(status) === 401) {
                    error = 'Invalid Username or Password.';
                }
                $scope.message = error;
            });

            $scope.$on('event:auth-logout-complete', function () {
                console.log('logout complete');
                $state.go('signin', {}, {reload: true, inherit: false});
            });
        }
    ])
    .controller('SignInModalCtrl', ['$rootScope', '$scope', '$state', 'AuthenticationService',
        function ($rootScope, $scope, $state, AuthenticationService) {
            'use strict';

            $scope.message = '';

            $scope.user = {
                email: null,
                password: null
            };

            $scope.login = function () {
                return AuthenticationService.login($scope.user).then(function (res) {
                    $scope.closeLoginModal(true, true);
                }, function (err) {
                    if (err === 'invalid_credentials') {
                        $scope.errorMessage = 'Invalid Credentials. Please check email and password.'
                    }
                });
            };

            $scope.signInFacebook = function () {
                AuthenticationService.FbLogin();
            };

            $scope.signInGoogle = function () {
                AuthenticationService.GoogleLogin();
            };

            $scope.$on('event:auth-loginRequired', function () {
                console.log('handling login required');
                $state.go('signin');
            });

            $scope.$on('event:auth-login-failed', function (e, status) {
                var error = 'Login failed.';
                if (parseInt(status) === 401) {
                    error = 'Invalid Username or Password.';
                }
                $scope.message = error;
            });

            $scope.$on('event:auth-logout-complete', function () {
                console.log('logout complete');
                $state.go('signin', {}, {reload: true, inherit: false});
            });
        }
    ]);
