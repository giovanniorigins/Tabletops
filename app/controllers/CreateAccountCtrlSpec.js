describe('Controller: tabletops.controllers.CreateAccountCtrl', function () {

    // load the controller's module
    beforeEach(module('tabletops.controllers'));

    var ctrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        ctrl = $controller('CreateAccountCtrl', {
            $scope: scope
        });
    }));

    it('should be defined', function () {
        expect(ctrl).toBeDefined();
    });
});
