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

const gridRows = document.getElementsByClassName('grid-row')

$('.codeOption').hide()


    $("#payPeriod").datepicker({
        beforeShowDay: function (date) {
            // Define a reference date that is a known Sunday
            const referenceDate = new Date(2024, 3, 7);
            
            // Calculate the difference in weeks between the reference date and the current date
            const timeDiff = date - referenceDate;
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)); // Difference in days
            const weeksDiff = Math.floor(daysDiff / 7); // Difference in weeks
    
            // Allow only Sundays and ensure they are every other Sunday
            return [date.getDay() === 0 && weeksDiff % 2 === 0, "", "Only every other Sunday is allowed"];
        }
    });



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
  
    function generateTimesheetDates(selectedDate) {
        // Convert the selected date to a Date object if it isn't already
        let startDate = new Date(selectedDate);

        
        // Array to store the dates
        let dates = [];
    
        // Loop through and generate 14 dates (2 weeks)
        for (let i = 0; i < 14; i++) {
            // Create a new date object for each day and add to the array
            let newDate = new Date(startDate);
            newDate.setDate(startDate.getDate() + i); // Increment the date by i days
            
            // Format the date as MM/DD
            let formattedDate = (newDate.getMonth() + 1) + '/' + newDate.getDate();
            
            // Push the formatted date into the array
            dates.push(formattedDate);
            
            if (i === 13) {
                let formattedEndDate = (newDate.getMonth() + 1) + '/' + newDate.getDate() + '/' + newDate.getFullYear();
                vm.endDate(formattedEndDate)
            }
        }

        
        for (let i = 0; i < gridRows.length; i++) {
            // loop through dates
            let dateSpan = `<span class='gridDate'>${dates[i]}</span>`
            gridRows[i].innerHTML += dateSpan
        }
        
    
        return dates;
    }
    
    function removeDateSpans() {
        const spansList = document.getElementsByClassName('gridDate')
        const spansArray = Array.from(spansList)
        spansArray.forEach(span => span.remove())
    }
    
    function calcHoursDiff(startTime, endTime) {
    // Helper function to convert "hh:mm AM/PM" to total minutes since midnight
        function timeToMinutes(time) {
            const [timePart, meridian] = time.split(" ");
            const [hours, minutes] = timePart.split(":").map(Number);
    
            let totalMinutes = hours * 60 + minutes;
            // Adjust for PM (but not for 12 PM)
            if (meridian === "PM" && hours !== 12) {
                totalMinutes += 12 * 60;
            }
            // Adjust for 12 AM
            if (meridian === "AM" && hours === 12) {
                totalMinutes -= 12 * 60;
            }
            return totalMinutes;
        }

        // Convert start and end times to total minutes
        const startTotalMinutes = timeToMinutes(startTime);
        const endTotalMinutes = timeToMinutes(endTime);
    
        // Calculate the difference in minutes
        const diffInMinutes = endTotalMinutes - startTotalMinutes;
    
        // Convert the difference to hours
        return diffInMinutes / 60;
    }


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
        

        
        vm.payPeriod.subscribe((newVal) => {
            removeDateSpans()
            const dates = generateTimesheetDates(newVal)
            
        })
        
        // ================== ALL SUBSCRIBES FOR THE TIME IN/OUT FIELDS ============================================
        
        vm.sun1out.subscribe((newVal) => {
            const diff = calcHoursDiff(vm.sun1in(), newVal)
            if (vm.primaryStatus() !== 'PT-Hourly' || vm.primaryStatus() !== 'Student' || vm.primaryStatus() !== 'Work Study' && diff > 8) {
                const otDiff = diff - 8
                vm.sun1ot(otDiff)
                vm.sun1reg(diff - otDiff)
            } else {
                vm.sun1reg(diff)
            }
        })
        
        vm.mon1out.subscribe((newVal) => {
            vm.mon1reg(calcHoursDiff(vm.mon1in(), newVal))
        })
        
        vm.tues1out.subscribe((newVal) => {
            vm.tues1reg(calcHoursDiff(vm.tues1in(), newVal))
        })
        
        vm.wed1out.subscribe((newVal) => {
            vm.wed1reg(calcHoursDiff(vm.wed1in(), newVal))
        })
        
        vm.thurs1out.subscribe((newVal) => {
            vm.thurs1reg(calcHoursDiff(vm.thurs1in(), newVal))
        })
        
        vm.fri1out.subscribe((newVal) => {
            vm.fri1reg(calcHoursDiff(vm.fri1in(), newVal))
        })
        
        vm.sat1out.subscribe((newVal) => {
            vm.sat1reg(calcHoursDiff(vm.sat1in(), newVal))
        })
        
        vm.sun2out.subscribe((newVal) => {
            vm.sun2reg(calcHoursDiff(vm.sun2in(), newVal))
        })
        
        vm.mon2out.subscribe((newVal) => {
            vm.mon2reg(calcHoursDiff(vm.mon2in(), newVal))
        })
        
        vm.tues2out.subscribe((newVal) => {
            vm.tues2reg(calcHoursDiff(vm.tues2in(), newVal))
        })
        
        vm.wed2out.subscribe((newVal) => {
            vm.wed2reg(calcHoursDiff(vm.wed2in(), newVal))
        })
        
        vm.thurs2out.subscribe((newVal) => {
            vm.thurs2reg(calcHoursDiff(vm.thurs2in(), newVal))
        })
        
        vm.fri2out.subscribe((newVal) => {
            vm.fri2reg(calcHoursDiff(vm.fri2in(), newVal))
        })
        
        vm.sat2out.subscribe((newVal) => {
            vm.sat2reg(calcHoursDiff(vm.sat2in(), newVal))
        })
        
        // ================== ALL SUBSCRIBES FOR THE TIME IN/OUT FIELDS ============================================
        
        
        integration.first('Web_Ethos_Get_Persons_by_Colleague_ID', {
            personID: user.ErpId
        }).then(function(personResults) {
                // GET JOBS
                vm.employeeName(getPreferredName(personResults.names));
                console.log('personResults', personResults)
                integration.first('Web_Ethos_Get_institution_jobs_by_Person_GUID', {
                    personGUID: personResults.id
                }).then(function(instJob) {
                console.log('instJob', instJob);
                    
                    // Get department from the Job
                    integration.first('Web_Ethos_Get_Employment_Department_by_GUID', {
                        deptGUID: instJob.department.id
                    }).then(function(deptResults) {
                        console.log('deptResults', deptResults);
                        // vm.department(deptResults.title);
            
                        // GET POSITIONS FROM JOB
                        integration.all('Web_Ethos_Get_institution_positions_by_Position_GUID', {
                            positionGUID: instJob.position.id
                        }).then(function(instPos) {
                            console.log('instPos',instPos);
                            vm.position(instPos.title);
            
                            // GET SUPERVISOR Information from the Job
                            integration.all('Web_Ethos_Get_Person_by_GUID', {
                                personGUID: getPrimarySupervisor(instJob.supervisors)
                            }).then(function(supervisorData) {
                                console.log('supervisorData', supervisorData);
                                vm.supervisorName(getPreferredName(supervisorData.names));
                                console.log('primaryEmail',getPrimaryEmail(supervisorData.emails));
                                vm.supervisorEmail(getPrimaryEmail(supervisorData.emails));
                            });
                        });
                    });
                });
            });
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
