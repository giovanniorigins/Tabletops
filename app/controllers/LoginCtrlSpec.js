describe('Controller: tabletops.controllers.LoginCtrl', function () {

    // load the controller's module
    beforeEach(module('tabletops.controllers'));

    var ctrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        ctrl = $controller('LoginCtrl', {
            $scope: scope
        });
    }));

    it('should be defined', function () {
        expect(ctrl).toBeDefined();
    });
});
