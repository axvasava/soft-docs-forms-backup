define([
    'jquery',
    'knockout',
    "vmBase",
    ], function testing ($, ko, vm) {
        
        vm.testing = function(helloWorld) {
            console.log('hello world')
        }
        
        return vm
    });