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
    $('.maskphone').mask('(999)999-9999? ext:9999');
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
    
    $('.developer').hide();
    vm.onLoad = function onLoad(source, inputValues) {
        //  This takes place after applyBindings has been called and has added input observables to the
        //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
        //  populating dropdowns, select options and other operations that need to take place every
        //  time the form is loaded.

        //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
        //  to save values to the server.
    };
    vm.setDefaults = function setDefaults(source, inputValues) {
        //  This method is called after values from the server are loaded into the form inputs and before
        //  afterLoad is called.

        //  WARNING: if an integration source is called directly to retrieve values and populate inputs
        //  with default values, setDefaults must return the integration source promise.  If it doesn't,
        //  a form draft may be created every time a user opens the form and more importantly the values
        //  may not be saved to the server.
       vm.invoiceAmount.subscribe(function(invoiceamt){
           vm.invoiceAmt(parseAmount(invoiceamt));
       });
       
       vm.vendorSearch.subscribe(newVal => {
            if (newVal && newVal !== '') {
                if (newVal.length < 7) {
                    vm.vendorSearch(newVal.padStart(7, "0"));
                }
            }
        });
        
      $("#vendorSearchButton").on('click', () => {
            
         if(vm.vendorSearch() && vm.vendorSearch() !== '') {
            // vm.payeeName('')
            // vm.vendorName('');
            vm.vendorPayeeName('')
            vm.address('');
            vm.city('');
            vm.state('');
            vm.zip('');

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
                    console.log('allMyPromisesReturned',allMyPromisesReturned);
                    console.log('Web_Ethos_Get_Organizations_by_ColleagueID',allMyPromisesReturned[0]);
                    console.log('Web_Ethos_Get_Persons_by_Colleague_ID',allMyPromisesReturned[1]);
                    
                    
                    if (allMyPromisesReturned[0]) {
                        notify('success','Organization Found');
                        var data = allMyPromisesReturned[0];
                        vm.vendorPayeeName(data.title);
                        var addresses = data.addresses;
                        var addressID;
                        
                        const targetAddress = addresses.filter(
                          (addr) => addr.type.addressType === "billing"
                        ).sort((a, b) => new Date(b.startOn) - new Date(a.startOn))[0];
                        const primaryAddress = addresses.find((addr) => addr?.preference === "primary");
                        
                        if (targetAddress) vm.organizationAddressId(targetAddress.address.id);
                        else vm.organizationAddressId(primaryAddress.address.id);

                     
                        
                    }
                    else if (allMyPromisesReturned[1]) {
                        notify('success','Institution Found');
                        var payeeData = allMyPromisesReturned[1]
                        vm.vendorPayeeName(allMyPromisesReturned[1].title);
                        var payeeAddressID = payeeData.addresses[0].address.id
                        vm.organizationAddressId(payeeAddressID)
                        // var payeeAddresses = payeeData.addresses;
                        // var payeeAddressID;
                        // for (var a = 0; a < payeeAddresses.length; a++) {
                        //     if (payeeAddresses[a].preference === "primary") {
                        //         payeeAddressID = payeeAddresses[a].address.id;
                        //         console.log('Organization Address ID:',addressID);
                        //         vm.organizationAddressId(payeeAddressID);
                        //         break; // Stop the loop once the primary address is found
                        //     }
                        // }
                    }
                    else if (allMyPromisesReturned[2]) {
                        notify('success','Person Found');
                        var payeeData = allMyPromisesReturned[2];
                        
                        vm.vendorPayeeName(allMyPromisesReturned[2].names[0].fullName);
                        
                        var payeeAddresses = payeeData.addresses;
                        
                        var payeeAddressID;
                        
                        for (var a = 0; a < payeeAddresses.length; a++) {
                            if (payeeAddresses[a].preference === "primary") {
                                payeeAddressID = payeeAddresses[a].address.id;
                                console.log('Organization Address ID:',addressID);
                                vm.organizationAddressId(payeeAddressID);
                                break; // Stop the loop once the primary address is found
                            }
                        }
                    }
                    else {
                        notify('error','Colleague ID not found.');
                    }
                });

           } else {
                // vm.payeeName('');
                // vm.vendorName('');
                vm.vendorPayeeName('');
                vm.address('');
                vm.city('');
                vm.state('');
                vm.zip('');
               
           }
        });
      vm.organizationAddressId.subscribe(function(newValue){
            
            vm.address('');
            vm.city('');
            vm.state('');
            vm.zip('');            
            
            if (newValue) {

                integration.first('Web_Ethos_Get_Address_By_Address_GUId',{
                    addressGUID: newValue
                }).then(function(dataFromSource){
                    console.log(dataFromSource);
                
                if (dataFromSource.addressLines.length > 1) {
                   
                   vm.address(dataFromSource.addressLines[0] + ', ' + dataFromSource.addressLines[1]);
                    
                } else {
                    
                    vm.address(dataFromSource.addressLines[0]);
                }
                
                vm.city(dataFromSource.place.country.locality);
                vm.state(dataFromSource.place.country.region.code.substring(3));
                vm.zip(dataFromSource.place.country.postalCode);
                    
                });                
            }
                
        });
        
        
        //Auto-populating date based on signature
        vm.firstApproverSign.subscribe(function(sig){
            
            if(!sig) return;
            let today = new Date();
            
            const formattedDate =
                String(today.getMonth() + 1).padStart(2, "0") + "/" +
                String(today.getDate()).padStart(2, "0") + "/" +
                today.getFullYear();
  
            vm.firstApproverSignDate(formattedDate)
        });
        
        vm.secondApproverSign.subscribe(function(sig){
            if(!sig) return;
            
            let today = new Date();
            const formattedDate =
                String(today.getMonth() + 1).padStart(2, "0") + "/" +
                String(today.getDate()).padStart(2, "0") + "/" +
                today.getFullYear();
                
            vm.secondApproverSignDate(formattedDate);
        });
        
        if (user.isInLibrary) {
            //  Input Values set here will be saved to the server when the user makes a form
            //  instance creating action: changing an input value or clicking submit.

        } else {
            //  Input Values set here will be saved to the server immediately.
            //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
            //  prior users.  Inputs that already have values saved to the server will be overridden with
            //  values set in this method.

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
        
        //formatting numbers
        ko.computed(function(){
            let invoiceAmt = vm.invoiceAmount();
            let formatted = formatAmountRounded(invoiceAmt);
            vm.invoiceAmount(formatted);
        });
        
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

    };

    vm.onApprove = function onApprove(form) {
        //  This method is called when the Approve button is clicked and before calling beforeRequired.

    };

    vm.onDecline = function onDecline(form) {
        //  This method is called when the Decline button is clicked and before calling beforeRequired.

    };

    vm.beforeRequired = function beforeRequired(form) {
        //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.

    };

    vm.afterRequired = function afterRequired(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.
        if(form.attachmentCount < 1){ 
           notify('error','You must attach 1 document'); 
           return false;
        }else{ 
           return true;
} 
    };

     vm.onOptOut = function onOptOut(form) {
       //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    vm.onESignSubmit = function onESignSubmit(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };

//Utility Functions
function formatAmountRounded(value) {
      if (value == null || value === "") return "0.00";
    
      // remove everything except digits, dot and minus
      const cleaned = String(value).replace(/[^0-9.-]/g, "");
      const number = Number(cleaned);
    
      if (!Number.isFinite(number)) return "0.00";
    
      // ROUND first to avoid floating point drift
      const rounded = Math.round((number + Number.EPSILON) * 100) / 100;
    
      // format with commas and exactly 2 decimals
      const parts = rounded.toFixed(2).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
      return parts.join(".");
    
}

function parseAmount(value) {
    if (value == null || value === "") return 0;

    const cleaned = String(value).replace(/[^0-9.-]/g, "");
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
}

    return vm;
});
