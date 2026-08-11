/* jshint maxerr: 10000*/
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


    //This Function provides a unique ID for the form
    vm.makeid = function (length) {
        console.log('Function Running')
        let result           = '';
        let characters       = 'ABCDEFG0123456789'; // characters & numbers used to create the random string
        let charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        let newResult =(new Date().getFullYear()) + '-' + result; // use this to include year in the result: YYYY-xxxxxx
        console.log('Result with Year:',newResult)
        return newResult;
    };


    vm.addObservableArray('countryList');

            integration.all('getCountries', {}).then(function(countryData) {
                console.log('Country Data:', countryData);
            
                // Extracting official names from countryData
                const officialNames = countryData.map(country => country.name.common);
            
                // Filtering out undefined values
                const validOfficialNames = officialNames.filter(name => name !== undefined);
            
                // Sorting the valid official names alphabetically
                const sortedNames = validOfficialNames.sort();
            
                // Creating the countryDropdown array of objects
                const countryDropdown = sortedNames.map(name => ({ country: name }));
            
                console.log('Country Dropdown', countryDropdown);
            
                // Updating the existing countryDropdown observable array
                // Assuming countryDropdown is an observable array declared earlier
                //vm.countryList([]);
                //vm.countryList().push(...countryDropdown);
                vm.countryList(countryDropdown)
                //console.log('Country List Array:', vm.countryList());
                 console.log('Country List Array:', vm.countryList());            
            });


    //Hide the lookup check section -- will be revealed later at proper workflow steps 
    $('.lookupCheck').hide(); 

    //Hide the parent info -- it will be shown later if the birthdate indicates the the applicant is under 18
    $('.under18').hide(); 

    //Hide the lookup check section -- will be revealed later at proper workflow step
    $('.enrollmentCounselor').hide();
    
    //Hide graduate student question about having a us address unless a non US country of citizen ship is selected.
    $('.usAddress').hide()
    
    $('.gradSSNRow').hide();
    
    //hide the developer section of the form
    //$('.developer').hide();
    
    //hide enrollment review comments
    $('.enrollmentComments').hide()

    //This function is used to set the autosize function on textareas with a class of autosizeareas.
    //Uncomment to use.
    //autosize($('.autosizeareas'));

    //clears all inputs on the form. -- Will be called whenever someone selects a new application type
    // function clearAllInputs() {
    //     var allInputs = document.querySelectorAll('input, textarea, select');
    
    //     allInputs.forEach(function (element) {
    //         // Check if the element's name is not "applicationType" or "lookupCheck"
    //         if (element.name !== "applicationType" && element.name !== "lookupCheck") {
    //             // Clear the value of the element
    //             element.value = "";
    //         }
    //     });
    // }

    function clearAllInputs() {
        var allInputs = document.querySelectorAll('input, textarea, select');
    
        allInputs.forEach(function (element) {
            // Check if the element's name is not "applicationType" or "lookupCheck" or 'countryInt'
            if (element.name !== "applicationType" && element.name !== "lookupCheck" && element.name !== "countryInt" && element.name !== "formID") {
                // Clear the value of the element
                if (element.type === "checkbox" || element.type === "radio") {
                    // For checkboxes and radio buttons, uncheck them
                    element.checked = false;
                } else {
                    // For other input fields, textareas, and selects, clear the value
                    element.value = "";
                }
            }
        });
    }

    //Check for a student lookup 
    function lookupCheck() {
        
            integration.first('studentLookupCheck', {
                studentID: vm.studentIDLookupCheck(),
        
            }).then(function(vals) {
                console.log(vals);
                    if (!vals) {
                        vm.lookupCheck('NO');
                        notify('error', 'No Lookup found for this student. There will need to be a Student Lookup before you can approve this application.');                       
                    } else {
                        
                        vm.lookupCheck('YES');
                        notify('success', 'Student Lookup found! You may now approve this application.');
                        
                    }       

            });        
        
    }

    //call the lookup check function when the button is clicked
    $('#lookupCheckButton').click(function() {
        lookupCheck();
    });

    //Click to trigger modal
    $('#reasonForSSN').click(function () { //Button Triggering SSN Information
    
        showCustomConfirm();
    });

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


        //disable all inputs if form is not with originator   
        if (!user.isInLibrary && !user.isOriginator) {
            // $('input, select, textarea, checkbox').each(function() {
            //     $(this).attr('readonly', true);
            //     if ($(this).is('select') || $(this).is(':checkbox')) {
            //         $(this).attr('disabled', true);
            //     }
            // }); 

            // $('input, button').prop('disabled', true);

            // For inputs, selects, textareas, and checkboxes
            $('input:not(#studentIDLookupCheck), select, textarea, :checkbox').each(function() {
                $(this).attr('readonly', true);
                if ($(this).is('select') || $(this).is(':checkbox')) {
                    $(this).attr('disabled', true);
                }
            });
            
            // For disabling inputs and buttons, excluding specific elements
            $('input:not(#studentIDLookupCheck), button:not(#lookupCheckButton)').prop('disabled', true);


            if (vm.applicationType() == 'Graduate Admissions Application' && vm.usAddressGraduate() == 'No') {
                $('.gradNoUSAddress').hide();                               
            }            

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#citizenshipCountryGrad').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#citizenshipCountryGrad').css('cursor', 'not-allowed');
     
                }, 1000); // Adjust the timeout as necessary
            });

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#state').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#state').css('cursor', 'not-allowed');
     
                }, 2000); // Adjust the timeout as necessary
            });

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#birthCountryGraduate').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#birthCountryGraduate').css('cursor', 'not-allowed');
     
                }, 2000); // Adjust the timeout as necessary
            });

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#countryGraduate').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#countryGraduate').css('cursor', 'not-allowed');
     
                }, 2000); // Adjust the timeout as necessary
            });

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#howDidYouLearn').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#howDidYouLearn').css('cursor', 'not-allowed');
     
                }, 2000); // Adjust the timeout as necessary
            });

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#sport').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#sport').css('cursor', 'not-allowed');
     
                }, 2000); // Adjust the timeout as necessary
            });

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#intendedMajor').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#intendedMajor').css('cursor', 'not-allowed');
     
                }, 2000); // Adjust the timeout as necessary
            });

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#graduateProgram').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#graduateProgram').css('cursor', 'not-allowed');
     
                }, 2000); // Adjust the timeout as necessary
            });

            $(document).ready(function() {
                setTimeout(function() {
                    // Disable the autoCompleteTest input fields
                    $('#highSchoolState').prop('disabled', true);

                    // Change cursor to 'not-allowed' or 'default' on mouse-over
                    $('#highSchoolState').css('cursor', 'not-allowed');
     
                }, 2000); // Adjust the timeout as necessary
            });
            
        }


        //show enrollment counselor selector at the appropriate workflow step
        if(pkg.isAtStep('FlowEnrollmentCounselorDirector1')) {
          $('.enrollmentCounselor').show();
        } else {
          $('enrollmentCounselor').hide(); 
        }

        //show enrollment review comments at appropriate workflow steps
        
        if(pkg.isAtStep('FlowFinancialAid')  || pkg.isAtStep('FlowUndergradEnrollmentLookupCheck')) {
            $('.enrollmentComments').show();
        } else if ((vm.applicationType() == 'Undergraduate Admission Application' || vm.applicationType() == 'International Undergraduate Admission Application') && pkg.isAtStep('End')) {
            $('.enrollmentComments').show();
        } else {
            $('.enrollmentComments').hide();
        }

        //show the lookup check at the end of the each workflow path
        if(pkg.isAtStep('FlowUndergradEnrollmentLookupCheck') || pkg.isAtStep('ConditionalGraduateAdvisorLookupCheck')) {
            $('.lookupCheck').show();         
        } else {
            $('.lookupCheck').hide(); 
        }

        //hide all rows except top 3 until an application type is selected
        vm.applicationType.subscribe(function (newValue) {
            clearAllInputs();
            //$('.gradNoUSAddress').hide();
            var rows = document.querySelectorAll('.row');
            
            if (newValue !== '') {
              // Show all rows when an application type is selected
              rows.forEach(function(row) {
                row.classList.remove('hidden');
              });
            } else {
              // Hide all rows except for the first three when the application type is blank
              rows.forEach(function(row, index) {
                if (!row.classList.contains('neverHide') && index > 3) {
                  row.classList.add('hidden');
                  //clearAllInputs();
                } else {
                  row.classList.remove('hidden');
                }
              });
            }
        });

    
        vm.citizenshipCountryGrad.subscribe(function(newValue){
            $('.gradSSNRow').hide();
            vm.usAddressGraduate('');
            if (newValue){
                
                if (newValue == 'United States' || newValue == 'United States Minor Outlying Islands' || newValue == 'United States Virgin Islands') {
                    $('.gradSSNRow').show();                
                } else {
                    $('.gradSSNRow').hide();
                    vm.citizenshipCountryGraduate(newValue);
                }
                
            } else {
                $('.gradSSNRow').hide();
                vm.citizenshipCountryGraduate('');
            } 
            
        });

        vm.usAddressGraduate.subscribe(function(newValue){
            if (newValue && newValue == 'No'){
                $('.gradNoUSAddress').hide();
            } else {
                $('.gradNoUSAddress').show();
            }
        });
        
       //set the gpaGroup in hidden section at bottom of form        
       vm.applicationType.subscribe(function(newValue) {

            vm.gpaGroup(''); 
                
                if (newValue) {
                   if (newValue == 'International Undergraduate Admission Application') {
                       vm.financialAid('No');
                       vm.vaBenefits('No');
                   }   
                   if (newValue == 'Undergraduate Admission Application' || newValue == 'International Undergraduate Admission Application') {
                       vm.gpaGroup('UG');
                   } else if (newValue == 'Graduate Admissions Application') {
                        vm.gpaGroup('GR');   
                   }
                } else {
                    vm.gpaGroup('');
                }
       });


        //Show the Parent/Guardian Form section if applicant is under 18
        vm.dateOfBirth.subscribe(function(newValue){
            
            if (newValue) {
                
                  var dobArray = newValue.split('/');
                  var userDate = new Date(dobArray[2], dobArray[1] - 1, dobArray[0]);
            
                  var today = new Date();
                  var eighteenYearsAgo = new Date(today.setFullYear(today.getFullYear() - 18));
            
                  if (userDate > eighteenYearsAgo) {
                    $('.under18').show();
                  } else {
                    $('.under18').hide();
                  }  
                
            } else {
               $('.under18').hide(); 
            }
            
        });

        //get the grad advisor info based on the grad program selected and populate email address in hidden field
        vm.graduateProgram.subscribe(function(newValue) {
        
            integration.first('getGradAdvisorByProgram', {
                program: newValue,
        
            }).then(function(datafromsource) {
                console.log(datafromsource);
        
                vm.graduateAdvisorEmail (datafromsource.advisor_email);
        
            });
        });

        vm.citizenshipCountryGrad.subscribe(function(newValue){
            
            
        });
    
        
        //Convert Intended Start Year to Academic Year
        vm.intendedStartYear.subscribe(function(newValue) {
        
            if (newValue) {
                
                vm.academicYear('');
                var academicYearStart = parseInt(newValue, 10);
                var academicYearEnd = academicYearStart + 1;
                const academicYear = `${academicYearStart}-${String(academicYearEnd).slice(2)}`;
                vm.academicYear(academicYear);
            } else {
                
                vm.academicYear('');
            }
        });

        vm.preferredEmail.subscribe(function(newValue) {
        
            vm.contactEmail(newValue);
        });

        vm.preferredEmailInt.subscribe(function(newValue) {
        
            vm.contactEmail(newValue);
        });


        if (user.isInLibrary) {
            //  Input Values set here will be saved to the server when the user makes a form
            //  instance creating action: changing an input value or clicking submit.
            
            //console.log(source.getMajors);
            //console.log(source.getGraduatePrograms);

            //make lookupCheck field default to NO. This won't change to YES until the appropriate person runs the lookup check later  in the workflow
            vm.lookupCheck('NO');

            //run the function to generate the form code in the hidden developer section of the form
            vm.formID(vm.makeid(6)); // update the number to set the length of the desired random string.

            //hide all rows besides header and application type on origination -- Subscribe function above will show all appropriate rows once applicationType has value
            var rows = document.querySelectorAll('.row');
        
              rows.forEach(function(row, index) {
                if (!row.classList.contains('neverHide') && index > 3) {
                  row.classList.add('hidden');
                } else {
                  row.classList.remove('hidden');
                }
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

        //Initialize FormBuilder created form specific code
        liveVM.afterLoadEditsForVM();



        //reset form if applying as an undergraduate and user indicates that they are not a us citizen
        ko.computed (function() {
            if (vm.applicationType() == 'Undergraduate Admission Application' && vm.usCitizen() === "No") {

                // Clear all form elements except the one with ID "lookupCheck"
                $(".row input, .row select").not("#lookupCheck").val("");
                vm.usCitizen('');
                //vm.lookupCheck('NO');
        
                // Display notification
                alert("Since you are applying as an Undergraduate and you indicated that you are not a U.S. citizen, please select International Undergraduate Admission Application at the top of the form! :)");
        
                // Set applicationType dropdown to "International Undergraduate Admission Application"
                vm.applicationType('International Undergraduate Admission Application') ;
        
                // Scroll to the top of the page
                $("html, body").animate({ scrollTop: 0 }, "slow");                
            } 
        });

        //Social Security Number Validation
        ko.computed (function() {
            
            if (pkg.isAtStep('Start') && vm.ssn() && vm.ssnConfirm()) {
                if (vm.ssn() !== vm.ssnConfirm()) {
                    notify('error', 'Social Security Numbers must match. Please re-enter your SSN Confirmation.');
                    vm.ssnConfirm('');
                } else {
                   notify('success', 'Social Security Numbers match!'); 
                }
            }
        });
        
        
        //Grad US Citizen Social Security Number Validation
        ko.computed (function() {
            
            if (pkg.isAtStep('Start') && vm.gradSSN() && vm.gradSSNValidate()) {
                if (vm.gradSSN() !== vm.gradSSNValidate()) {
                    notify('error', 'Social Security Numbers must match. Please re-enter your SSN Confirmation.');
                    vm.gradSSNValidate('');
                } else {
                   notify('success', 'Social Security Numbers match!'); 
                }
            }
        });

        //Email Validation
        ko.computed (function() {
            
            if (pkg.isAtStep('Start') && vm.preferredEmail() && vm.emailConfirm()) {
                
                if (vm.preferredEmail() !== vm.emailConfirm()) {
                    notify('error', 'Email addresses must match. Please re-enter your Email Confirmation.');
                    vm.emailConfirm('');
                } else {
                   notify('success', 'Email Addresses match!'); 
                }
            }
        });

        //Email Validation International
        ko.computed (function() {
            
            if (pkg.isAtStep('Start') && vm.preferredEmailInt() && vm.confirmEmailInt()) {
                
                if (vm.preferredEmailInt() !== vm.confirmEmailInt()) {
                    notify('error', 'Email addresses must match. Please re-enter your Email Confirmation.');
                    vm.confirmEmailInt('');
                } else {
                   notify('success', 'Email Addresses match!'); 
                }
            }
        });


        ko.computed(function(){
            if (vm.firstName() && vm.lastName()) {
                vm.studentFullName(vm.firstName() + ' ' + vm.lastName())
            } else {
                vm.studentFullName('');
            }
        })
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

        // if (vm.applicationType() == 'Undergraduate Admission Application' || vm.applicationType == 'International Undergraduate Admission Application') {
        //     //window.open('https://www.usw.edu/admissions/apply-now/undergraduate-application/ug-app-confirmation');
        //     window.open('https://www.usw.edu/admissions/apply-now/undergraduate-application/ug-app-confirmation');
        // }
        
        // if (vm.applicationType() == 'Graduate Admissions Application') {
        //     // window.open('https://www.usw.edu/admissions/apply-now/graduate-application/gr-app-confirmation');
        //     window.open('https://www.usw.edu/admissions/apply-now/graduate-application/gr-app-confirmation'); 
        // }

    };

    vm.onApprove = function onApprove(form) {
        //  This method is called when the Approve button is clicked and before calling beforeRequired.

        if((pkg.isAtStep('FlowUndergradEnrollmentLookupCheck') || pkg.isAtStep('ConditionalGraduateAdvisorLookupCheck'))) {

            if (vm.lookupCheck() == 'NO') {
              
              throw new Error('Form cannot be submitted until a Lookup has been created for this student. Please try again later.');
                
            } else {
              
              return true; 
            }
         
        }
    };

    vm.onDecline = function onDecline(form) {
        //  This method is called when the Decline button is clicked and before calling beforeRequired.

    };

    vm.beforeRequired = function beforeRequired(form) {
        //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
        if (!vm.americanIndianAlaska() && !vm.asian() && !vm.blackOrAfricanAmerican() && !vm.hawaiianPacificIslander() && !vm.white() && !vm.preferNotToSay) {
            throw new Error('Please select the racial category or categories with which you most closely identify. You\'ll need to select as many as apply before form can be submitted (even if you prefer not to say).');            
        } else {
            return true;
        }
    };

    vm.afterRequired = function afterRequired(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.
        // if (pkg.isAtStep('Start')) {   
        //     if (vm.applicationType() == 'Undergraduate Admission Application' || vm.applicationType == 'International Undergraduate Admission Application') {
        //         //window.open('https://www.usw.edu/admissions/apply-now/undergraduate-application/ug-app-confirmation');
        //         window.open('https://www.usw.edu/admissions/apply-now/undergraduate-application/ug-app-confirmation');
        //     }
            
        //     if (vm.applicationType() == 'Graduate Admissions Application') {
        //         // window.open('https://www.usw.edu/admissions/apply-now/graduate-application/gr-app-confirmation');
        //         window.open('https://www.usw.edu/admissions/apply-now/graduate-application/gr-app-confirmation'); 
        //     }
        // }
    };

     vm.onOptOut = function onOptOut(form) {
       //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    vm.onESignSubmit = function onESignSubmit(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };


    /* MODAL CODE ************************************************ */
    $("#confirm-yes").click(function () {
        customConfirm(true);
    });
    
    $("#confirm-no").click(function () {
        customConfirm(false);
    });
    function showCustomConfirm() {
        return new Promise(resolve => {
            $("#custom-confirm-modal").fadeIn(() => {
                // Resolve the promise when the modal is fully visible
                resolve(customConfirm());
            });
        });
    }
    function customConfirm() {
        return new Promise(resolve => {
            $("#confirm-yes").one("click", function () {
                // Code to execute if confirmed
                $("#custom-confirm-modal").fadeOut(() => resolve(true));
            });
    
            $("#confirm-no").one("click", function () {
                // Code to execute if not confirmed
                $("#custom-confirm-modal").fadeOut(() => resolve(false));
            });
        });
    }
    /* MODAL CODE END ******************************************** */

    return vm;
});
