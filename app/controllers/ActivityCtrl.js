/**
 * @ngdoc controller
 * @name Activity
 *
 * @description
 * _Please update the description and dependencies._
 *
 * @requires $scope
 * */
angular.module('tabletops.controllers')
    .controller('ActivityCtrl', ['$scope', 'UserActions', '$timeout', 'ionicMaterialMotion', 'ionicMaterialInk',
        function ($scope, UserActions, $timeout, ionicMaterialMotion, ionicMaterialInk) {
        $scope.refresh = function () {
            var promise = UserActions.feed();
            promise.then(function (data) {
                $scope.feed = data;
                console.log(data);
                $timeout(function () {
                    // Set Ink
                    ionicMaterialMotion.blinds();

                    ionicMaterialInk.displayEffect();
                }, 300);
                $scope.$broadcast('scroll.refreshComplete');
            });
        };

        $scope.refresh();
    }]);
