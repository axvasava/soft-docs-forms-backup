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
    
    
    $('#clearExternalIDBtn').click(function () {
        
        let userSecurityExternalID = vm.userSecurityExternalID();
        let userSecuritySystemID = vm.userSecuritySystemID();
        
        if (userSecurityExternalID && userSecuritySystemID) {
            integration.delete('Security_Utility_Clear_External_ID_by_UserID',{
                UserID: userSecuritySystemID
            }).then((returnData) => {
                notify('success','External ID removed');
                vm.userSecurityExternalID(undefined);
            }).catch((error) => {
                console.log('error',error);
                notify('error','Error: Check console for detals\n\n' + error.message);
            });
        }
        else {
            notify('error','No User or External ID found');
        }
        
    });
    
    	
    vm.onLoad = function onLoad(source, inputValues){
    };
	
    vm.setDefaults = function setDefaults(source, inputValues){
        if(user.isInLibrary) {
            // integration.all('Security_Utility_Get_all_Users').then((securityUsers) => {
            //     console.log('securityUsers',securityUsers)
            // })
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