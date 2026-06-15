/* jshint maxerr: 10000 */
define([
    'jquery',
    'knockout',
    'vmBase',
    'user',
    'integration',
    'notify',
    'package',
    'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js'

], function viewmodel($, ko, vm, user, integration, notify, pkg) { 
    'use strict';
    	
    vm.onLoad = function onLoad(source, inputValues){
    };
	
    vm.setDefaults = function setDefaults(source, inputValues){
        if(user.isInLibrary) {
            //vm.mileageRate('.56');
        }
    };
	
    vm.afterLoad = function afterLoad(){
        Extenders.autosize($('textarea'));
        $(document).ready(function(){
            $( document ).on( 'focus', 'input', function(){
                $( this ).attr( 'autocomplete', 'off' );
            });
        });
    };
	
    vm.onSubmit = function onSubmit(form){
    };
	
    
    vm.onApprove = function onApprove(form){
    };
	
    
    vm.onDecline = function onDecline(form){
    };
	
    vm.beforeRequired = function beforeRequired(form){
    };
	
    vm.afterRequired = function afterRequired(form){
    };
    
    vm.throwError = function(error) {
        if(user.isOriginator) {
        } else {
            notify('error', error);
        }
        throw new Error(error);
    };

    return vm;
});