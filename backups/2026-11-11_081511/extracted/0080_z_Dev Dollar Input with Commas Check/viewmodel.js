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
    // 'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js'
], function viewmodel($, ko, vm, integration, notify, user, autosize, maskedinput, liveVM, pkg) {


        //money format with no cents and commas 
        const toMoney = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

        // function formatAsDollar(value) {
        //     // Remove all non-digit and non-decimal characters
        //     value = value.replace(/[^0-9.]/g, "");
        //     // Split the value into whole number and decimal parts
        //     let parts = value.split(".");
        //     // Format the whole number part with commas
        //     parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        //     // Limit the decimal part to two digits
        //     if (parts[1]) {
        //         parts[1] = parts[1].substring(0, 2);
        //     }
        //     // Combine whole and decimal parts
        //     return `$${parts.join(".")}`;
        // }

        // // Event listener for the input field
        // const dollarInput = document.getElementById("dollarInput");

        // dollarInput.addEventListener("input", (event) => {
        //     const input = event.target;
        //     const cursorPosition = input.selectionStart; // Save cursor position
        //     const originalLength = input.value.length;

        //     // Format value as dollar amount
        //     input.value = formatAsDollar(input.value);

        //     // Adjust cursor position
        //     const newLength = input.value.length;
        //     input.selectionStart = input.selectionEnd =
        //         cursorPosition + (newLength - originalLength);
        // });

        // // Function to format value as a dollar amount without the dollar sign
        // function formatAsDollar(value) {
        //     // Remove all non-digit and non-decimal characters
        //     value = value.replace(/[^0-9.]/g, "");
        //     // Split the value into whole number and decimal parts
        //     let parts = value.split(".");
        //     // Format the whole number part with commas
        //     parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        //     // Limit the decimal part to two digits
        //     if (parts[1]) {
        //         parts[1] = parts[1].substring(0, 2);
        //     }
        //     // Combine whole and decimal parts
        //     return parts.join(".");
        // }

        // // Function to add the input event listener to all .dollarInput elements
        // function addInputListener(input) {
        //     input.addEventListener("input", (event) => {
        //         const input = event.target;
        //         const cursorPosition = input.selectionStart; // Save cursor position
        //         const originalLength = input.value.length;

        //         // Format value as a dollar amount
        //         input.value = formatAsDollar(input.value);

        //         // Adjust cursor position
        //         const newLength = input.value.length;
        //         input.selectionStart = input.selectionEnd =
        //             cursorPosition + (newLength - originalLength);
        //     });
        // }


    function formatAsDollar(value) {
        // Remove all non-digit and non-decimal characters    
        value = value.replace(/[^0-9.]/g, "");
        // Split the value into whole number and decimal parts    
        let parts = value.split(".");
        // Format the whole number part with commas    
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        // Limit the decimal part to two digits    
        if (parts[1]) {
            parts[1] = parts[1].substring(0, 2);
        }
        // Combine whole and decimal parts    
        return `$${parts.join(".")}`;
    }
    $(document).ready(function() {
        // Add listeners dynamically to fields in the CourseInformation list    
        vm.moneyRow().forEach(function(moneyRow, index) {
            // Attach event listener to dynamically identified dollar input fields        
            const fieldId = moneyRow.dollarInput();
            // Replace with your actual field ID        
            $(document).on("input", fieldId, function() {
                const $input = $(this);
                const cursorPosition = this.selectionStart;
                // Save cursor position            
                const originalLength = $input.val().length;
                // Format value as dollar amount            
                const formattedValue = formatAsDollar($input.val());
                $input.val(formattedValue);
                // Adjust cursor position            
                const newLength = formattedValue.length;
                this.selectionStart = this.selectionEnd = cursorPosition + (newLength - originalLength);
            });
        });
    });

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
       
    //   vm.dollarInput.subscribe(function(amount) {vm.dollarInput(toMoney.format(amount))}); 
        
        //  WARNING: if an integration source is called directly to retrieve values and populate inputs
        //  with default values, setDefaults must return the integration source promise.  If it doesn't,
        //  a form draft may be created every time a user opens the form and more importantly the values
        //  may not be saved to the server.

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

    };

     vm.onOptOut = function onOptOut(form) {
       //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    vm.onESignSubmit = function onESignSubmit(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    return vm;
});
