angular.module('tabletops.config', [])
    // App Identifier
    .config(['$ionicAppProvider', function ($ionicAppProvider) {
        'use strict';
        $ionicAppProvider.identify({
            app_id: 'b6dadb11',
            api_key: '01a8f4b712103d1b9c6186b4795e2a298a1ed1afe28dc027',
            api_write_key: '75b5d94940459ffdb9931c83d5def7ee78cd7f6686ce5782a7f963e3b1a7d1bbb9508ba5aec7d80883b320958fcd2149966ac93cfff7edc9937dbd864f632e0b865cc74823cbb40716f85d32f45b6dfa54abfa4440c1fb649bda66443085201d0179f6732b9579fd5d15dc1ea670474bc27e4e06fb3fed65ef4f54b45a991eb19a3a1c436595815329593c3267953852',
            gcm_id: 'bahama-foodie',
            // Set the app to use development pushes
            dev_push: false
        });
    }])

    .config(['$ionicConfigProvider', function($ionicConfigProvider) {
        'use strict';
        // Tabs
        $ionicConfigProvider.tabs.position('bottom');
        // Native Scrolling: false, JS Scrolling: true
        if( ionic.Platform.isAndroid() ) {
            $ionicConfigProvider.scrolling.jsScrolling(false);
        }
    }])

    .config(['$provide', function ($provide) {
        'use strict';
        $provide.decorator('$exceptionHandler', ['$delegate', function ($delegate) {
            return function (exception, cause) {
                //exception.message = '';

                $delegate(exception, cause);
                console.log('Exception: ', exception);
                console.log('Cause: ', cause);
            };
        }]);
    }])

    // HTTP Defaults
    .config(['$httpProvider', function ($httpProvider) {
        'use strict';
        //$httpProvider.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8';
        //$httpProvider.defaults.headers['Access-Control-Allow-Origin'] = 'http://localhost:8100';
        //$httpProvider.defaults.withCredentials = true;
        $httpProvider.interceptors.push('timeoutHttpIntercept');
        $httpProvider.interceptors.push(['$rootScope', function ($rootScope) {
            return {
                request: function (config) {
                    if (config.url.indexOf('analytics.ionic.io') === -1 && config.url.indexOf('apps.ionic.io') === -1 && config.url.indexOf('push.ionic.io') === -1) {
                        $rootScope.$broadcast('loading:show');
                    }
                    return config;
                },
                requestError: function (rejection) {
                    console.log(rejection);
                    $rootScope.$broadcast('loading:hide');
                },

                response: function (response) {
                    //if (angular.isDefined(config) && config.url.indexOf('https://analytics.ionic.io') == -1 )
                    $rootScope.$broadcast('loading:hide');
                    return response;
                },
                responseError: function (rejection) {
                    console.log(rejection);
                    $rootScope.$broadcast('loading:hide');
                    return rejection;
                }
            };
        }]);
    }])

    /*.config(['$cordovaAppRateProvider', function ($cordovaAppRateProvider) {
        var prefs = {
            language: 'en',
            appName: 'Tabletops',
            openStoreInApp: true,
            usesUntilPrompt: 500,
            iosURL: '<my_app_id>',
            androidURL: 'market://details?id=<package_name>',
            //windowsURL: 'ms-windows-store:Review?name=<...>'
        };
        $cordovaAppRateProvider.setPreferences(prefs)
    }])*/
    .constant('CIDs', {
        facebook: '646933472119700'
    })
    .constant('HoursDays', [{id: '0', name: 'Sun'}, {id: '1', name: 'Mon'}, {id: '2', name: 'Tue'}, {
        id: '3',
        name: 'Wed'
    }, {id: '4', name: 'Thu'}, {id: '5', name: 'Fri'}, {id: '6', name: 'Sat'}])
    .constant('StartHours', [{id: '0.0', name: '12:00 AM'}, {id: '0.5', name: '12:30 AM'}, {
        id: '1.0',
        name: '1:00 AM'
    }, {id: '1.5', name: '1:30 AM'}, {id: '2.0', name: '2:00 AM'}, {id: '2.5', name: '2:30 AM'}, {
        id: '3.0',
        name: '3:00 AM'
    }, {id: '3.5', name: '3:30 AM'}, {id: '4.0', name: '4:00 AM'}, {id: '4.5', name: '4:30 AM'}, {
        id: '5.0',
        name: '5:00 AM'
    }, {id: '5.5', name: '5:30 AM'}, {id: '6.0', name: '6:00 AM'}, {id: '6.5', name: '6:30 AM'}, {
        id: '7.0',
        name: '7:00 AM'
    }, {id: '7.5', name: '7:30 AM'}, {id: '8.0', name: '8:00 AM'}, {id: '8.5', name: '8:30 AM'}, {
        id: '9.0',
        name: '9:00 AM'
    }, {id: '9.5', name: '9:30 AM'}, {id: '10.0', name: '10:00 AM'}, {
        id: '10.5',
        name: '10:30 AM'
    }, {id: '11.0', name: '11:00 AM'}, {id: '11.5', name: '11:30 AM'}, {
        id: '12.0',
        name: '12:00 PM'
    }, {id: '12.5', name: '12:30 PM'}, {id: '13.0', name: '1:00 PM'}, {
        id: '13.5',
        name: '1:30 PM'
    }, {id: '14.0', name: '2:00 PM'}, {id: '14.5', name: '2:30 PM'}, {id: '15.0', name: '3:00 PM'}, {
        id: '15.5',
        name: '3:30 PM'
    }, {id: '16.0', name: '4:00 PM'}, {id: '16.5', name: '4:30 PM'}, {id: '17.0', name: '5:00 PM'}, {
        id: '17.5',
        name: '5:30 PM'
    }, {id: '18.0', name: '6:00 PM'}, {id: '18.5', name: '6:30 PM'}, {id: '19.0', name: '7:00 PM'}, {
        id: '19.5',
        name: '7:30 PM'
    }, {id: '20.0', name: '8:00 PM'}, {id: '20.5', name: '8:30 PM'}, {id: '21.0', name: '9:00 PM'}, {
        id: '21.5',
        name: '9:30 PM'
    }, {id: '22.0', name: '10:00 PM'}, {id: '22.5', name: '10:30 PM'}, {
        id: '23.0',
        name: '11:00 PM'
    }, {id: '23.5', name: '11:30 PM'}])
    .constant('EndHours', [{id: '0.5', name: '12:30 AM'}, {id: '1.0', name: '1:00 AM'}, {
        id: '1.5',
        name: '1:30 AM'
    }, {id: '2.0', name: '2:00 AM'}, {id: '2.5', name: '2:30 AM'}, {id: '3.0', name: '3:00 AM'}, {
        id: '3.5',
        name: '3:30 AM'
    }, {id: '4.0', name: '4:00 AM'}, {id: '4.5', name: '4:30 AM'}, {id: '5.0', name: '5:00 AM'}, {
        id: '5.5',
        name: '5:30 AM'
    }, {id: '6.0', name: '6:00 AM'}, {id: '6.5', name: '6:30 AM'}, {id: '7.0', name: '7:00 AM'}, {
        id: '7.5',
        name: '7:30 AM'
    }, {id: '8.0', name: '8:00 AM'}, {id: '8.5', name: '8:30 AM'}, {id: '9.0', name: '9:00 AM'}, {
        id: '9.5',
        name: '9:30 AM'
    }, {id: '10.0', name: '10:00 AM'}, {id: '10.5', name: '10:30 AM'}, {
        id: '11.0',
        name: '11:00 AM'
    }, {id: '11.5', name: '11:30 AM'}, {id: '12.0', name: '12:00 PM'}, {
        id: '12.5',
        name: '12:30 PM'
    }, {id: '13.0', name: '1:00 PM'}, {id: '13.5', name: '1:30 PM'}, {id: '14.0', name: '2:00 PM'}, {
        id: '14.5',
        name: '2:30 PM'
    }, {id: '15.0', name: '3:00 PM'}, {id: '15.5', name: '3:30 PM'}, {id: '16.0', name: '4:00 PM'}, {
        id: '16.5',
        name: '4:30 PM'
    }, {id: '17.0', name: '5:00 PM'}, {id: '17.5', name: '5:30 PM'}, {id: '18.0', name: '6:00 PM'}, {
        id: '18.5',
        name: '6:30 PM'
    }, {id: '19.0', name: '7:00 PM'}, {id: '19.5', name: '7:30 PM'}, {id: '20.0', name: '8:00 PM'}, {
        id: '20.5',
        name: '8:30 PM'
    }, {id: '21.0', name: '9:00 PM'}, {id: '21.5', name: '9:30 PM'}, {
        id: '22.0',
        name: '10:00 PM'
    }, {id: '22.5', name: '10:30 PM'}, {id: '23.0', name: '11:00 PM'}, {
        id: '23.5',
        name: '11:30 PM'
    }, {id: '24.0', name: '12:00 AM 2MOR'}, {id: '24.5', name: '12:30 AM 2MOR'}, {
        id: '25.0',
        name: '1:00 AM 2MOR'
    }, {id: '25.5', name: '1:30 AM 2MOR'}, {id: '26.0', name: '2:00 AM 2MOR'}, {
        id: '26.5',
        name: '2:30 AM 2MOR'
    }, {id: '27.0', name: '3:00 AM 2MOR'}, {id: '27.5', name: '3:30 AM 2MOR'}, {
        id: '28.0',
        name: '4:00 AM 2MOR'
    }, {id: '28.5', name: '4:30 AM 2MOR'}, {id: '29.0', name: '5:00 AM 2MOR'}, {
        id: '29.5',
        name: '5:30 AM 2MOR'
    }, {id: '30.0', name: '6:00 AM 2MOR'}])

    .filter('groupBy', ['_', function (_) {
        'use strict';
        return function (items, group) {
            return _.groupBy(items, group);
        };
    }]);

if (ionic.Platform.platform() === 'win32') {
    /*angular.module('tabletops.config')
        .config(['$cordovaFacebookProvider', 'CIDs', function ($cordovaFacebookProvider, CIDs) {
            'use strict';
            var appID = CIDs.facebook;
            var version = 'v2.0'; // or leave blank and default is v2.0
            ionic.Platform.ready(function () {
                $cordovaFacebookProvider.browserInit(appID, version);
            });
        }]);*/
}