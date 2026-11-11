
define([
    'jquery',
    'knockout',
    'vmBase',
    'user',
    'integration',
    'notify',
    'package',
    'https://softdocscdn.etrieve.cloud/extenders/extenders.js'
], function viewmodel($, ko, vm, user, integration, notify) { 
    //Parameters:
    //  $: jQuery object. Additional documentation found at api.jquery.com
    
    //  ko: knockoutjs object. Additional documentation found at knockoutjs.com
    
    //  vm: is a base viewmodel object that enables you to interact with observable inputs on the
    //  view.html.  Observables for all inputs, selects, and textareas will be added when the 
    //  viewmodel is bound to the view.  vmBase has functions to aid in adding additional observable
    //  properties to itself such as addObservables, addObservableArrays which both take a comma-
    //  separated string of names.
    
    //  user: The user parameter includes data associated with the current user, including isInLibrary, 
    //  isInDrafts, isOriginator, DisplayName, UserName, hasGroupOrRole.
    
    //  integration: has functions for directly calling integration sources configured on the server
    //  integration.first: takes Source Code and an optional Parameter Object, returning a single object
    //  integration.all: takes Source Code and an optional Parameter Object, returning an array of objects
    //  integration.add: takes Source Code and a Parameter Object, returning an array of objects
    //  integration.update: takes Source Code and a Parameter Object, returning an array of objects
    //  integration.delete: takes Source Code and a Parameter Object, returning an array of objects
    
	
    //The following methods are lifecycle callbacks that will be called as described
    //if they are returned on the viewmodel object, but they are not required.
	
    //NOTE: if a JavaScript Promise is returned from any Lifecycle Callback, the process will wait until 
    //the Promise is resolved before continuing.  Additionally, if an Integration source or any other 
    //asynchronous method is called directly within one of these functions, it is required that a Promise 
    //be returned in order to guarantee these methods are called in a predictable, sequential manner.
	
    //Loading Lifecycle Callbacks:
    //Parameters:
    //  source:
    //  If the form is configured to receive integration sources onLoad or onOrigination,
    //  they will be passed on the source parameter. onLoad sources will be available 
    //  every time the form is loaded while onOrigination sources will only be available 
    //  when user.isInLibrary is true.
	
    //  inputValues:
    //  inputValues.first(id) takes an input id & returns a single value if one exists.
    //  inputValues.all(id) takes an input id & returns an array of values if any exist.
    //  inputValues.audit(id) takes an input id & returns an array of audit history values if any exist.
    //  inputValues.list is an array of all values sent from the server that will be loaded 
    //      into this form after setDefaults and prior to afterLoad.  This should only be needed if 
    //      it is necessary to filter on something other than input id.
    
    /*********************************************
      Observables
    *********************************************/
    
    /*********************************************
      Global Variables
    *********************************************/
    var ein1 = "00";
    var ein2 = "0000001";
    var fullein = ein1+" "+ ein2;
	
    var emp_address = "Oakland County Community College\n807 Bluff Rd Columbia, SC 29201";
    var validSig = false;
    /*********************************************
     Custom Functions
    *********************************************/
    function validateSignature(sig){
        var fullName = vm.FirstName() +" "+vm.LastName();
        if(sig.toUpperCase() !== fullName.toUpperCase()){
            toastr.error('Signature must match the name in Line 1 above.\n Hint: '+fullName);
            return false;
        }
        else{
            toastr.success('Signature validated.');
            return true;
        }
    }
     
     
    /*********************************************
     Call Back Functions
    *********************************************/
	
    vm.onLoad = function onLoad(source, inputValues){
        //  This takes place after applyBindings has been called and has added input observables to the
        //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for 
        //  populating dropdowns, select options and other operations that need to take place every 
        //  time the form is loaded.
        
        // if(pkg.stepName == 'ESign'){
        //     $('#esign_readonly').attr('readonly', true);
        // }
		
        //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
        //  to save values to the server.
    };
	
    vm.setDefaults = function setDefaults(source, inputValues){
        //  This method is called after values from the server are loaded into the form inputs and before
        //  afterLoad is called.
        vm.form_name('W-4'); //Populate the form name. Adjust input ID as appropriate
        vm.emp_address('Oakland Community College\n2900 Featherstone Road\nAuburn Hills, MI, 48326 ');
        vm.ein('38-1751526');
        $('#homeaddr, #originatorSSN, #citystatezip, #empSig, #smpSigDate').prop('required', 'true');

        
        
         //pre-pop the signing date, needs to run each time the form is opened if it hasn't been initially submitted
        if(user.isInDrafts || user.isInLibrary){
             $('#sign_date').mask("99/99/9999");
             $('#emp_start_date').mask("99/99/9999");
             $('#originatorSSN').mask("999-99-9999");
            // var d = new Date();
            // var mm, dd, yyyy;
            // mm = d.getMonth()+1;
            // if(mm < 10){ //If the month is less than 10, prefix with a '0'
            //     mm = '0'+mm; 
            // }
            // dd = d.getDate();
            // if(dd){ // if the day is less than 10, prefix with a '0'
            //     dd = '0'+dd;
            // }
            // yyyy = d.getFullYear();
            // vm.sign_date(new Date().toLocaleDateString());
        }
        
        //Subscribe for employee signature (validates emp sig)
        vm.emp_sig.subscribe(function(newVal){
            validateSignature(newVal);
        });    

        //removed as of 2021        
            // $('#exempt').focus(function(){
            //     toastr.warning('Typing Exempt in this box will claim exemption from withholding');
            // });
        
        //Subscribe for exemptions
        //removed as of 2021
            // vm.exempt.subscribe(function (newVal) {
            //     if (newVal.toLowerCase() == 'exempt') {
            //         vm.FedExempt(99);
            //     }
            // });
        
        
        //disable all fields for anyone who is not the originator
        if(!user.isOriginator){
            $(function () {
                $('input, textarea, select').prop("disabled",true);
            });                
        }        
    
       
    };
	
    vm.afterLoad = function afterLoad(){
        //  This method is called after setDefaults has been called.
		ko.computed(function dependantTotal(){
            //Accouting maths.
            var total = 0;
            total += (Number(vm.Under17DeductionAmtNewW4() || 0));
            total += (Number(vm.OtherDependentDeductionAmtNewW4() || 0));
            
            vm.total_dependents(total.toFixed(2));
        });
        //  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
        //  to save values to the server.
        
        $('.loading').hide();
    };
	
	
    //Submitting Lifecycle Callbacks:
    //Parameters:
    //  form.attachmentCount: integer
    
    
    //In order to stop the Submitting Lifecycle and prevent this form from moving to the next step in the workflow
    //process, add the following to any of the functions below:
    //    throw new Error('reason placed here will be displayed to the user');
    
    
    vm.onSubmit = function onSubmit(form){
        //  This method is called when the Submit button is clicked and before calling beforeRequired.  
        //  This normally occurs in the Forms Library, but may occur in the Inbox when a package is 
        //  returned to Originator.
        if (!vm.maritalStatus()){
        throw new Error('You can not leave Marital Status blank. Please choose the correct martial status.');
        }
        
        if (!vm.emp_sig()){
        throw new Error('This field can not be blank. Please input a signature.');
        }
        
    };
	
    
    vm.onApprove = function onApprove(form){
        //  This method is called when the Approve button is clicked and before calling beforeRequired.
        
    };
	
    
    vm.onDecline = function onDecline(form){
        //  This method is called when the Decline button is clicked and before calling beforeRequired.
        
    };
	
    
    vm.beforeRequired = function beforeRequired(form){
        //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
         if (!vm.Under17DeductionAmtNewW4()){
            $('#Under17DeductionAmtNewW4').prop('required', true);
            throw new Error('On Step 3, you left the number of Children under 17, blank. Please add a "0" if it does not apply to you.');
        }
        
        if (!vm.OtherDependentDeductionAmtNewW4()){
            $('#OtherDependentDeductionAmtNewW4').prop('required', true);
            throw new Error('On Step 3, you left other dependents, blank. Please add a "0" if it does not apply to you.');
        }
    };
	
    vm.afterRequired = function afterRequired(form){
        //  This method is called after the required inputs on the form have been confirmed to have values.
        
    };
    
    return vm;
});
