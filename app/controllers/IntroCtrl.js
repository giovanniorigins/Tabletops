/**
 * @ngdoc controller
 * @name Intro
 *
 * @description
 * _Please update the description and dependencies._
 *
 * @requires $scope
 * */
angular.module('tabletops.controllers')
    .controller('IntroCtrl', ['$scope', '$state', '$ionicSlideBoxDelegate',
        function ($scope, $state, $ionicSlideBoxDelegate) {
            'use strict';

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
        }
    ]);