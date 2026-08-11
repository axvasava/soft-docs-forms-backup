define(['jquery',
    'knockout',
    'vmBase',
    'integration',
    'notify',
    'user',
    'template/autosize.min',
    'template/jquery.maskedinput',
    './liveViewModel.js',
    'package',
    /*-- WARNING: Uncommenting the line of code below will allow you to use Etrieve Extenders on this form.
    Currently, Etrieve Extenders are only compatible with cloud based instances of Etrieve.
    If you are unsure if you can utilize Extenders, please contact your institution's Etrieve Administrator.*/
    'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js'
], function viewmodel($, ko, vm, integration, notify, user, autosize, maskedinput, liveVM, pkg) {


    //This function is used to set the autosize function on textareas with a class of autosizeareas.
    //Uncomment to use.
    //autosize($('.autosizeareas'));


    /*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
    $('.maskphone').mask('999-999-9999');
    $('.maskzip').mask('99999?-9999');
    $('.maskssn').mask('999-99-9999');
    /*End masking functions*/

    //Parameters:
    //  $: jQuery object. Additional documentation found at api.jquery.com

    //  ko: knockoutjs object. Additional documentation found at knockoutjs.com

    //  vm: is a base viewmodel object that enables you to interact with observable inputs on the
    //  view.html.  Observables for all inputs, selects, and textareas will be added when the
    //  viewmodel is bound to the view.  vmBase has functions to aid in adding additional observable
    //  properties to itself such as addObservables, addObservableArrays which both take a comma-
    //  separated string of names.

    //  user: The user parameter includes data associated with the current user including isInLibrary,
    //  isInDrafts, isInActivity, isOriginator, DisplayName, UserName, hasGroupOrRole, Email.

    //  integration: has functions for directly calling integration sources configured on the server
    //  integration.first: takes Source Code and an optional Parameter Object, returning a single object
    //  integration.all: takes Source Code and an optional Parameter Object, returning an array of objects
    //  integration.add: takes Source Code and a Parameter Object, returning an array of objects
    //  integration.update: takes Source Code and a Parameter Object, returning an array of objects
    //  integration.delete: takes Source Code and a Parameter Object, returning an array of objects

    //  notify: method that display a toast notification, it requires the next parameters
    //      - toastrType: string indicating the type of toast notification, could have the next values:
    //          - success
    //          - warning
    //          - error
    //      - message: string indicating the message to display on notification
    //      - title: string indicating the title for the notification
    
    //  pkg: The pkg viewmodel object includes parameters which return properties 
    //  around the package and the package state throughout the workflow.
    //  stepCode, stepName, isAtStep, isExporting.
	
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
    
    function getTodayDate() {
      const today = new Date();
        
      // Pad month/day with leading zero if needed
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const year = today.getFullYear();
        
      return `${month}/${day}/${year}`;
    }
    
    function makeAutoCompleteReadOnly(elementID) {
       $(`#${elementID}`)
        .prop('disabled', true)
        .attr({
            tabindex: '-1',
            'aria-disabled': 'true'
        })
        .css({
            'pointer-events': 'none',
            'background-color': '#f5f5f5',
            'color': '#555'
        });
    }
    
    function makeAllFieldsReadOnly(){
        $("#legalBusinessName").prop("readonly", true);
        $("#dbaName").prop("readonly", true);
        $("#purchaseOrderEmail").prop("readonly", true);
        $("#businessAddress").prop("readonly", true);
        $("#businessCity").prop("readonly", true);
        makeAutoCompleteReadOnly('businessState');
        $("#businessZip").prop("readonly", true);
        $("#differentAddress").prop("disabled", true);
        
        $("#differentAddressField").prop("readonly", true);
        $("#differentCity").prop("readonly", true);
        makeAutoCompleteReadOnly('differentState');
        $("#differentZip").prop("readonly", true);
        $("#businessContactName").prop("readonly", true);
        $("#companyContactTitle").prop("readonly", true);
        $("#companyContactEmail").prop("readonly", true);
        $("#companyContactPhone").prop("readonly", true);
        $("#companyContactFax").prop("readonly", true);
        
        $("#individualFirstName").prop("readonly", true);
        $("#individualLastName").prop("readonly", true);
        $("#individualDbaName").prop("readonly", true);
        $("#individualEmail").prop("readonly", true);
        $("#individualAddress").prop("readonly", true);
        $("#individualCity").prop("readonly", true);
        makeAutoCompleteReadOnly('individualState');
        $("#individualZip").prop("readonly", true);
        $("#differentAddress2").prop("disabled", true);
        $("#addressType1").prop("disabled", true);
        $("#differentAddressField1").prop("readonly", true);
        $("#differentCity1").prop("readonly", true);
        makeAutoCompleteReadOnly('differentState1');
        $("#differentZip1").prop("readonly", true);
        
        $("#ddIDType").prop("disabled", true);
        $("#EIN").prop("readonly", true);
        $("#SSN").prop("readonly", true);
        
        $("#paymentTerms").prop("disabled", true);
        $("#discount").prop("readonly", true);
        $("#achAcctNum").prop("readonly", true);
        $("#achRoutingNum").prop("readonly", true);
        $("#ddAchAcctType").prop("disabled", true);
        $("#achBankName").prop("readonly", true);
        $("#achEmailAddress").prop("readonly", true);
        
        $("#notes").prop("readonly", true);
       
        $("#ddTakePurchaseOrders").prop("disabled", true);
        $("#ddVendorType").prop("disabled", true);
        $("#addressType").prop("disabled", true);

    }
    
    $("#vendorSearchButton").on('click', () => {
        if(vm.vendorSearch() && vm.vendorSearch() !== '') {
            vm.vendorPayeeName(undefined);
               let promiseArrays = [];
                
                promiseArrays.push(
                    integration.first('Web_Ethos_Get_Organizations_by_ColleagueID',{
                        ColleagueID: vm.vendorSearch()
                    })
                );
                
                promiseArrays.push(
                    integration.first('Web_Ethos_Get_Educational_Institutions_by_ColleagueID',{
                        ColleagueID: vm.vendorSearch()
                    })
                );
                
                promiseArrays.push(
                    integration.first('Web_Ethos_Get_Persons_by_Colleague_ID',{
                        personID: vm.vendorSearch()
                    })
                );
                
                Promise.all(promiseArrays).then(function (allMyPromisesReturned) {
                  if (allMyPromisesReturned[0]) {
                        notify('success','Organization Found');
                        var data = allMyPromisesReturned[0];
                        vm.vendorPayeeName(data.title);
                    } else if (allMyPromisesReturned[1]) {
                        notify('success','Institution Found');
                        var payeeData = allMyPromisesReturned[1];
                        vm.vendorPayeeName(allMyPromisesReturned[1].title);
                    } else if (allMyPromisesReturned[2]) {
                        notify('success','Person Found');
                        var personData = allMyPromisesReturned[2];
                        vm.vendorPayeeName(getPreferredName(personData.names));
                    } else {
                        notify('error','Colleague ID not found.');
                    }
                });

           } else {
                vm.vendorPayeeName(undefined);
           }
        });
   
    //function to sort through all names and return the preferred name
    function getPreferredName(myArray) {
      // Loop through the array
      for (let i = 0; i < myArray.length; i++) {
        // Check if the current object's preference is "preferred"
        if (myArray[i].preference === "preferred") {
          // Return the fullName attribute value from the matching object
          return myArray[i].firstName + " " + myArray[i].lastName;
        }
      }
      // Return null if no match is found
      return null;
    }
    

    vm.onLoad = function onLoad(source, inputValues) {
        //  This takes place after applyBindings has been called and has added input observables to the
        //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
        //  populating dropdowns, select options and other operations that need to take place every
        //  time the form is loaded.

        //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
        //  to save values to the server.
        
        $('.developer').hide();
        $('.differentAddress').hide();
        $('.differentAddress2').hide();
        
        if (pkg.isAtStep('APManager')){
           //AP Manager only needs to see the Vendor Information and 
           //ACH payment information
            $('.apManager').hide();
            makeAllFieldsReadOnly();
            
            $("#vendorSignature").prop("readonly", true);
        }
    };
    
    vm.setDefaults = function setDefaults(source, inputValues) {
        //  This method is called after values from the server are loaded into the form inputs and before
        //  afterLoad is called.

        //  WARNING: if an integration source is called directly to retrieve values and populate inputs
        //  with default values, setDefaults must return the integration source promise.  If it doesn't,
        //  a form draft may be created every time a user opens the form and more importantly the values
        //  may not be saved to the server.

        if (user.isInLibrary) {
            //  Input Values set here will be saved to the server when the user makes a form
            //  instance creating action: changing an input value or clicking submit.

            vm.formName('New Vendor Application');

        } else {
            //  Input Values set here will be saved to the server immediately.
            //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
            //  prior users.  Inputs that already have values saved to the server will be overridden with
            //  values set in this method.

        }

        vm.paymentTerms.subscribe(function(paymentTerm){
           if (paymentTerm == 'ACH Terms: Net 30') {
              vm.selectedPaymentTerm('ACH');
           } else if (paymentTerm == 'Check Terms: Net 45') {
               vm.selectedPaymentTerm('Check');
           }
        });
         
        vm.differentAddress.subscribe(function(vendorType){
            if ($('#differentAddress').is(':checked')){
                $('.differentAddress').show();
            } else {
                $('.differentAddress').hide();
            }
        });
        
        vm.differentAddress2.subscribe(function(vendorType){
            if ($('#differentAddress2').is(':checked')){
                $('.differentAddress2').show();
            } else {
                $('.differentAddress2').hide();
            }
        });
        
        vm.vendorSignature.subscribe(function(sig){
            vm.vendorSignDate(getTodayDate());
        });

        if (pkg.isAtStep('Start')){
           $('.venSearch').hide();
           
           makeAllFieldsReadOnly();
           $("#vendorSignature").prop("readonly", true);
        }
        
        if (pkg.isAtStep('ESign')){
            $('.OfficialUseOnly').hide();
            $('.venSearch').hide();
        }

        if (pkg.isAtStep('WFPurchasing')){
            $('.venSearch').show();
            
            makeAllFieldsReadOnly();
            
            $("#vendorSignature").prop("readonly", true);
            $("#vendorEsignEmail").prop("readonly", true);
            $("#additionalInformation").prop("readonly", true);
        }
        
        if (pkg.isAtStep('APManager')){
           //AP Manager only needs to see the Vendor Information and 
           //ACH payment information
            $('.apManager').hide();
            makeAllFieldsReadOnly();
            
            $("#vendorSignature").prop("readonly", true);
        }
    };

    vm.afterLoad = function afterLoad() {
        //  This method is called after setDefaults has been called.

        //  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
        //  to save values to the server.

        //Initialize FormBuilder created form specific code
        liveVM.afterLoadEditsForVM();

        /*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
        autosize($('textarea'));
    };

    //Submitting Lifecycle Callbacks:
    //Parameters:
    //  form.attachmentCount: integer

    //In order to stop the Submitting Lifecycle and prevent this form from moving to the next step in the workflow
    //process, add the following to any of the functions below:
    //    throw new Error('reason placed here will be displayed to the user');

    vm.onSubmit = function onSubmit(form) {
        //  This method is called when the Submit button is clicked and before calling beforeRequired.
        //  This normally occurs in the Forms Library, but may occur in the Inbox when a package is
        //  returned to Originator.
        
        if (pkg.isAtStep('Start')){
            makeAllFieldsReadOnly();
            
            let vendorEsignEmail = vm.vendorEsignEmail();
            if (vendorEsignEmail == ''){
                notify('error', 'Vendor email address is requred');
                return false;
            }
            
        }
         
    };

    vm.onApprove = function onApprove(form) {
        //  This method is called when the Approve button is clicked and before calling beforeRequired.
           

    };

    vm.onDecline = function onDecline(form) {
        //  This method is called when the Decline button is clicked and before calling beforeRequired.

    };

    vm.beforeRequired = function beforeRequired(form) {
        //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
        vm.formName('New Direct Deposit');
    };

    vm.afterRequired = function afterRequired(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };

     vm.onOptOut = function onOptOut(form) {
       //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    vm.onESignSubmit = function onESignSubmit(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

            let vendorSignature = vm.vendorSignature();
            if (vendorSignature == ''){
                notify('error', 'Vendor Signature is requred');
                return false;
            }
             
            let takePurchaseOrders = vm.ddTakePurchaseOrders();
            // const takePurchaseOrders = $('#ddTakePurchaseOrders').val();
            if (takePurchaseOrders == ''){
                notify('error', 'Do you take purchase orders is required');
                return false;
            } else if (takePurchaseOrders == 'No'){
                notify('error', 'Form cannot be submitted. Please contact the Purchasing Office via the email located on the form');
                return false;
            } else if (takePurchaseOrders == 'Yes'){
                if (form.attachmentCount < 1) { 
                    notify('error','Please attach the completed W-9 form.'); 
                    return false;
                }
            } 

            let vendorType = vm.ddVendorType();
            // const vendorType = $('#ddVendorType').val();
            if (vendorType == '') {
              notify('error', 'Vendor Type is required');
              return false;
            } else 
                if (vendorType == 'Business' && (!vm.legalBusinessName() || !vm.purchaseOrderEmail() || !vm.businessAddress() ||
                    !vm.businessCity() || !vm.businessState() || !vm.businessZip() || !vm.businessContactName() || !vm.companyContactTitle() ||
                    !vm.companyContactEmail() || !vm.companyContactPhone() || !vm.legalBusinessName() || !vm.legalBusinessName() || !vm.legalBusinessName())){
                    notify('error', 'Please fill out all required fields for Vendor Type: Business');
                    return false;
                
            } else
                if ((vendorType == 'Individual' || vendorType == 'Individual (DBA or LLC)') && (!vm.individualFirstName() || !vm.individualLastName() || !vm.individualEmail() ||
                     !vm.individualAddress() || !vm.individualCity() || !vm.individualState() || !vm.individualZip())) {
                     notify('error', 'Please fill out all required fields for Vendor Type: Individual or Individual (DBA or LLC)');
                     return false;
            }
            
            if ($('#differentAddress').is(':checked')){
                if (!vm.addressType() || !vm.differentAddressField() || !vm.differentCity() || !vm.differentState() || !vm.differentZip()) {
                  notify('error','Please fill out all fields for the additional Business address');
                  return false;
                }
            }
            
            if ($('#differentAddress2').is(':checked')){
                if (!vm.addressType1() || !vm.differentAddressField1() || !vm.differentCity1() || !vm.differentState1() || !vm.differentZip1()) {
                  notify('error','Please fill out all fields for the additional Individual or Individual (DBA or LLC) address');
                  return false;
                }
            }
            
            const idType = $("#ddIDType").val();
            if (idType === 'Employer Tax Identification #' && !vm.EIN()){
                notify('error', 'Employer Tax Identification # is required');
                return false;
            } else if (idType === 'Social Security #' && !vm.SSN()){
                notify('error', 'Social Security # is required');
                return false;
            }
        
            const paymentTerms = $("#paymentTerms").val();
            if (paymentTerms == ''){
                notify('error', 'Please select a payment term is required');
                return false;
            } else if (paymentTerms === 'ACH Terms: Net 30' && (!vm.achAcctNum() || !vm.achRoutingNum() || !vm.ddAchAcctType() || !vm.achBankName() || !vm.achEmailAddress())){
                    notify('error', 'Please fill out all ACH required fields');
                    return false;
            }
           
    };

    return vm;
});
