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
    }])
    // https://github.com/andrewmcgivery/ionic-ion-autoListDivider
    .directive('autoListDivider', ['$timeout', function($timeout) {
        'use strict';
        var lastDivideKey = "";

        return {
            link: function(scope, element, attrs) {
                var key = attrs.autoListDividerValue;

                var defaultDivideFunction = function(k){
                    return k.slice( 0, 1 ).toUpperCase();
                };

                var doDivide = function(){
                    var divideFunction = scope.$apply(attrs.autoListDividerFunction) || defaultDivideFunction;
                    var divideKey = divideFunction(key);

                    if(divideKey !== lastDivideKey) {
                        var contentTr = angular.element("<div class='item item-divider'>"+divideKey+"</div>");
                        element[0].parentNode.insertBefore(contentTr[0], element[0]);
                    }

                    lastDivideKey = divideKey;
                };

                $timeout(doDivide,0);
            }
        };
    }])
    .directive('dynamicHeightSlideBox', function() {
        'use strict';
        return {
            require: ['^ionSlideBox'],
            link: function(scope, elem, attrs, slider) {
                scope.$watch(function() {
                    return slider[0].__slider.selected();
                }, function(val) {
                    //getting the heigh of the container that has the height of the viewport
                    var newHeight = window.getComputedStyle(elem.parent()[0], null).getPropertyValue("height");
                    if (newHeight) {
                        elem.find('ion-scroll')[0].style.height = newHeight;
                    }
                });
            }
        };
    })
    .directive('checklistModel', ['$parse', '$compile', function($parse, $compile) {
        'use strict';
        // contains
        function contains(arr, item, comparator) {
            if (angular.isArray(arr)) {
                for (var i = arr.length; i--;) {
                    if (comparator(arr[i], item)) {
                        return true;
                    }
                }
            }
            return false;
        }

        // add
        function add(arr, item, comparator) {
            arr = angular.isArray(arr) ? arr : [];
            if(!contains(arr, item, comparator)) {
                arr.push(item);
            }
            return arr;
        }

        // remove
        function remove(arr, item, comparator) {
            if (angular.isArray(arr)) {
                for (var i = arr.length; i--;) {
                    if (comparator(arr[i], item)) {
                        arr.splice(i, 1);
                        break;
                    }
                }
            }
            return arr;
        }

        // http://stackoverflow.com/a/19228302/1458162
        function postLinkFn(scope, elem, attrs) {
            // compile with `ng-model` pointing to `checked`
            $compile(elem)(scope);

            // getter / setter for original model
            var getter = $parse(attrs.checklistModel);
            var setter = getter.assign;
            var checklistChange = $parse(attrs.checklistChange);

            // value added to list
            var value = $parse(attrs.checklistValue)(scope.$parent);


            var comparator = angular.equals;

            if (attrs.hasOwnProperty('checklistComparator')){
                comparator = $parse(attrs.checklistComparator)(scope.$parent);
            }

            // watch UI checked change
            scope.$watch('checked', function(newValue, oldValue) {
                if (newValue === oldValue) {
                    return;
                }
                var current = getter(scope.$parent);
                if (newValue === true) {
                    setter(scope.$parent, add(current, value, comparator));
                } else {
                    setter(scope.$parent, remove(current, value, comparator));
                }

                if (checklistChange) {
                    checklistChange(scope);
                }
            });

            // declare one function to be used for both $watch functions
            function setChecked(newArr, oldArr) {
                scope.checked = contains(newArr, value, comparator);
            }

            // watch original model change
            // use the faster $watchCollection method if it's available
            if (angular.isFunction(scope.$parent.$watchCollection)) {
                scope.$parent.$watchCollection(attrs.checklistModel, setChecked);
            } else {
                scope.$parent.$watch(attrs.checklistModel, setChecked, true);
            }
        }

        return {
            restrict: 'A',
            priority: 1000,
            terminal: true,
            scope: true,
            compile: function(tElement, tAttrs) {
                if (tElement[0].tagName !== 'INPUT' || tAttrs.type !== 'checkbox') {
                    throw 'checklist-model should be applied to `input[type="checkbox"]`.';
                }

                if (!tAttrs.checklistValue) {
                    throw 'You should provide `checklist-value`.';
                }

                // exclude recursion
                tElement.removeAttr('checklist-model');

                // local scope var storing individual checkbox model
                tElement.attr('ng-model', 'checked');

                return postLinkFn;
            }
        };
    }]);