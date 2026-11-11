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

$('.dev').hide()

const gridRows = document.getElementsByClassName('grid-row')

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
  
  ////////////////////___________ USED IN MAIN TIMESHEET_________________
      vm.addObservable('WEEKDAYS', [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ]);
    
function updateTwoWeeksDates(startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 13); // Add 13 days to include the start date in the range
    
    const endDateStr = `${end.getMonth() + 1}/${end.getDate()}/${end.getFullYear().toString().slice(2, 4)}`
    vm.endDate(endDateStr)

    if (Object.prototype.toString.call(start) === "[object Date]") {
        if (isNaN(start.getTime())) {
            console.log("Invalid start date from datepicker");
        } else {
            // Clear the existing week list
            vm.weekList().forEach(function(row) {
                row.day(undefined);
                row.date(undefined);
                row.weekHeaderText(undefined);
            });
            vm.weekList.removeAll();

            let week = 1;

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Add a new row to the week list
                vm.weekListAdd();
                const lastDayAddedIndex = vm.weekList().length - 1;
                const row = vm.weekList()[lastDayAddedIndex];

                // Set the day name and date
                row.day(vm.WEEKDAYS()[d.getDay()]);
                row.date((d.getMonth() + 1) + '/' + d.getDate());

                // Insert a header text for the first day of the week
                if (d.getDay() === 0 || lastDayAddedIndex === 0) { // First day of the week or first day overall
                    row.weekHeaderText("Week " + week);
                } else {
                    row.weekHeaderText(undefined);
                }

                // Increment the week number on Sundays
                if (d.getDay() === 6) { // Saturday is the last day of the week
                    week++;
                }
            }
        }
    } else {
        console.log("Invalid start date input");
    }
}

//used to calculate time
function calculateTimeDiff(startTime, endTime) {
    if (!startTime || !endTime) return 0;

    const start = new Date(`01/01/2022 ${startTime}`);
    const end = new Date(`01/01/2022 ${endTime}`);

    const hourDiff = end.getHours() - start.getHours();
    const minuteDiff = end.getMinutes() - start.getMinutes();

    return hourDiff + minuteDiff / 60; // Convert minutes to hours

}
  ////////////////////___________ USED IN MAIN TIMESHEET END_________________
    $('.maskphone').mask('(999)999-9999? ext:9999');
    $('.maskzip').mask('99999?-9999');
    $('.maskssn').mask('999-99-9999');


    vm.onLoad = function onLoad(source, inputValues) {
       
        
        //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
        //  to save values to the server.
    };
    
    vm.setDefaults = function setDefaults(source, inputValues) {
        $("#datepicker").datepicker({
            beforeShowDay: function(date) {
                // Check if the day is Sunday (0)
                if (date.getDay() === 0) {
                    // Define a reference Sunday (e.g., January 1, 2023, which is a Sunday)
                    const referenceSunday = new Date(2024, 3, 7); // Jan 1, 2023
                    const timeDiff = date.getTime() - referenceSunday.getTime();
                    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
                    const weeksDiff = Math.floor(daysDiff / 7);
        
                    // Check if the number of weeks is even (every other Sunday)
                    if (weeksDiff % 2 === 0) {
                        return [true, ""]; // Allow this Sunday
                    }
                }
                return [false, ""]; // Disable all other days
            }
        });
        
        //datepicker to create timesheet
        vm.datepicker.subscribe(function(newDate) {
            console.log("newdate sub triggered", newDate)
            if (newDate) {
                updateTwoWeeksDates(newDate); // Call your function with the new date
            } else {
                console.log("Datepicker value is empty or invalid");
            }
        });
         
         //needed for hide/show 
        vm.primaryStatus.subscribe(newVal => {
        //For Grand Totals
            if (newVal !== 'PT-Hourly' && vm.primaryStatus() !== 'Student' && vm.primaryStatus() !== 'Work Study') {
                vm.otherOTCalculation('No');
            } else {
                vm.otherOTCalculation('Yes');
            }
            //For dropdown options 
            if (newVal !== 'Student' && newVal !== 'PT-Hourly' && newVal !== 'Faculty' && newVal !== 'Work Study'){
                vm.needOptions(true);
                if (newVal == 'Public Safety') {
                    vm.publicSafety(true);
                    vm.notPublicSafety(false);
                } else {
                    vm.notPublicSafety(true);
                    vm.publicSafety(false);
                }
            }
            else{
                vm.needOptions(false);
                vm.notPublicSafety(false);
                vm.publicSafety(false);
            }
        });


        
        vm.determineOT.subscribe(newVal => {
            if (newVal !=0 && newVal<= 40){
                vm.totalRegHoursOther(newVal);
                vm.overTimeHoursOther(0)
            }
            else{
             vm.totalRegHoursOther(40); 
             const otherOTHours = vm.totalRegHours() - 40
             vm.overTimeHoursOther(otherOTHours)
            }
        });
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
       //doing Timesheet Calculations
        ko.computed(function () {
            vm.weekList().forEach((dynamicListRow) => {
                const hasTimeInOut = dynamicListRow.timeIn() && dynamicListRow.timeOut();
                const hasTimeInOut2 = dynamicListRow.timeIn2() && dynamicListRow.timeOut2();
                const hasRemarks = dynamicListRow.hasRemarks();
        
                // Clear fields if no remarks and secondary times are provided
                if (!hasRemarks && (dynamicListRow.timeIn2() || dynamicListRow.timeOut2())) {
                    dynamicListRow.timeIn2(undefined);
                    dynamicListRow.timeOut2(undefined);
                    dynamicListRow.regHours(0);
                    dynamicListRow.OThours(0);
                }
        
                // Calculate regular hours
                let totalHours = 0;
                if (hasTimeInOut) {
                    totalHours += calculateTimeDiff(dynamicListRow.timeIn(), dynamicListRow.timeOut());
                }
                if (hasTimeInOut2) {
                    totalHours += calculateTimeDiff(dynamicListRow.timeIn2(), dynamicListRow.timeOut2());
                }
                dynamicListRow.regHours(totalHours);

                // Handle overtime hours
                if (totalHours > 8 && !['PT-Hourly', 'Student', 'Work Study'].includes(vm.primaryStatus())) {
                    const OTDiff = totalHours - 8;
                    dynamicListRow.regHours(8);
                    dynamicListRow.OThours(OTDiff);
                } else {
                    dynamicListRow.OThours(0); // Clear overtime hours
                }
            });
        });


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

        // })
        
    