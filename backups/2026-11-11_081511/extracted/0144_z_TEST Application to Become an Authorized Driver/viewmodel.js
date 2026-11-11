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


    $('.loading').hide();

    //This function is used to set the autosize function on textareas with a class of autosizeareas.
    //Uncomment to use.
    //autosize($('.autosizeareas'));

    $('.supervisor').hide();    
    $('.humanResources').hide();
    $('.developer').hide();
    
        //function to sort through all names and return the preferred name
        function getPreferredName(myArray) {
          // Loop through the array
          for (let i = 0; i < myArray.length; i++) {
            // Check if the current object's preference is "preferred"
            if (myArray[i].preference === "preferred") {
              // Return the fullName attribute value from the matching object
              return myArray[i].fullName;
            }
          }
          // Return null if no match is found
          return null;
        }
        
         //function to sort through all supervisors and return the primary supervisor ID (GUID)
        function getPrimarySupervisor(supervisorArray) {
          // Loop through the array
          for (let i = 0; i < supervisorArray.length; i++) {
            // Check if the current object's type is "primary"
            if (supervisorArray[i].type === "primary") {
              // Return the id attribute value from the matching object
              return supervisorArray[i].supervisor.id;
            }
          }
          // Return null if no match is found
          return null;
        }
            
        
        // Function to sort through all emails and return the primary name
        function getPrimaryEmail(emailArray) {
          // Loop through the array
          for (let i = 0; i < emailArray.length; i++) {
            // Check if the current object's preference is "primary"
            if (emailArray[i].preference === "primary") {
              // Return the address attribute value from the matching object
              return emailArray[i].address;
            }
          }
          // Return null if no match is found
          return null;
        }

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

        //  WARNING: if an integration source is called directly to retrieve values and populate inputs
        //  with default values, setDefaults must return the integration source promise.  If it doesn't,
        //  a form draft may be created every time a user opens the form and more importantly the values
        //  may not be saved to the server.

        if (pkg.isAtStep('WFHRManualEntry')  || pkg.isAtStep('End')) {
            $('.humanResources').show();
        }

        if (pkg.isAtStep('ConditionalActorRouteSupervisorEmail') || pkg.isAtStep('WFHRPublicSafety') || pkg.isAtStep('WFHRManualEntry')  || pkg.isAtStep('End')) {
            $('.supervisor').show();
        }

        vm.employeeSignature.subscribe(function(newValue) {
            if (newValue) {
                vm.employeeSignatureDate(Extenders.utils.formatDate(new Date()));                
            } else {
                vm.employeeSignatureDate('');
            }
        });

        vm.supervisorSignature.subscribe(function(newValue) {
            if (newValue) {
                vm.supervisorSignatureDate(Extenders.utils.formatDate(new Date()));                
            } else {
                vm.supervisorSignatureDate('');
            }
        });

        vm.hrStaffSignature.subscribe(function(newValue) {
            if (newValue) {
                vm.hrStaffSignatureDate(Extenders.utils.formatDate(new Date()));                
            } else {
                vm.hrStaffSignatureDate('');
            }
        });

        if (user.isInLibrary) {
            //  Input Values set here will be saved to the server when the user makes a form
            //  instance creating action: changing an input value or clicking submit.

        vm.formID(generateFormID());
        vm.hrDocType('Appliction to Become Authorized Driver');

        //initiate ethos data calls to populate employee information
        integration.first('EthosColleagueEmployeeByErpId', {
        }).then(function(employeeData){
            $('.loading').show();
            console.log(employeeData);
            vm.employeeLastName(employeeData.names[0].lastName);
            vm.employeeFirstName(employeeData.names[0].firstName);
            if (employeeData.names[0].middleName){
             vm.employeeMiddleInitial(employeeData.names[0].middleName.substring(0, 1) + '.');
            } else {
                vm.employeeMiddleInitial('N/A');
            }
            let dob = employeeData.dateOfBirth.split('-');
            vm.employeeDOB(dob[1] + '/' + dob[2] + '/' + dob[0]);
            integration.first('Web_Ethos_Get_institution_jobs_by_Person_GUID',{
                personGUID: employeeData.id
            }).then((institutionJobs) => {
                console.log('institutionJobs: ', institutionJobs);

                integration.first('Web_Ethos_Get_institution_positions_by_Position_GUID', {
                    positionGUID: institutionJobs.position.id
                }).then((position) => {
                    console.log('Position: ', position);
                    vm.jobTitle(position.title);
                    $('.loading').hide(); 
                    integration.first('Web_Ethos_Get_Campus_Sites_by_GUID', {
                        campusGUID: position.campus.id
                    }).then((campus) => {
                        console.log('Campus: ', campus);
                        vm.employeeCampus(campus.title);
                        $('.loading').hide();
                    });
                });
                
                 // // GET SUPERVISOR Information from the Job
                integration.all('Web_Ethos_Get_Person_by_GUID', {
                    personGUID: getPrimarySupervisor(institutionJobs.supervisors)
                }).then(function(supervisorData) {
                    console.log('supervisorData', supervisorData);
                    vm.supervisorSearch(getPreferredName(supervisorData.names));
                    //console.log('primaryEmail',getPrimaryEmail(supervisorData.emails));
                    vm.supervisorEmail(getPrimaryEmail(supervisorData.emails));
                    $('.loading').hide();
                  });
            });
           
        });

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

        ko.computed(function() {
            if (vm.employeeLastName() && vm.employeeFirstName()) {
                vm.employeeName(vm.employeeFirstName() + ' ' + vm.employeeLastName());                
            } else {
                vm.employeeName('');
            }           
        });

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

// ============================= HELPER FUNCTIONS =============================================
// ============================= GENERATE FORM ID =============================================

        function generateFormID() {
          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$^&*-_+=[]{}|;:,.';
          let id = '';
        
          for (let i = 0; i < 10; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            id += characters[randomIndex];
          }
        
          return id;
        }

// ============================= END GENERATE FORM ID =========================================

    return vm;
});
