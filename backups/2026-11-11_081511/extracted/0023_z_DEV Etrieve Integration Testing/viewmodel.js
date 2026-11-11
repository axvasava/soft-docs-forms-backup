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

    vm.addObservableArray('AcademicPeriodsAutocomplete')
    vm.AcademicPeriodsAutocomplete([])
    
    vm.addObservableArray('CurrentNextPeriods')
    
    integration.all('Web_Ethos_Academic_Catalogs').then(data => console.log("Year", data))
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
        // OIE_Get_Deans
        //OIE_Get_Programs
        
        // integration.all('OIE_Get_Deans',{
            
        // }).then(function (deanobj) {
        //  	console.log("OIE_Get_Deans:::", deanobj);
        // });

        // integration.all('OIE_Get_Programs',{
            
        //  }).then(function (programs) {
        //  	console.log("OIE_Get_Programs:::", programs);
        //  });
        
        // integration.all('OIE_Get_Action_Strategy_Data',{
            
        // }).then(function (actionStrategyData) {
        // 	console.log("OIE_Get_Action_Strategy_Data:::", actionStrategyData);
        // });
        
        // integration.all('EthosColleagueSubjects',{
            
        // }).then(function (Subjects) {
        // 	console.log("Subjects", Subjects);
        // });
        
        // integration.all('OIE_Get_Distinct_Programs',{
            
        // }).then(function (DistinctPrograms) {
        // 	console.log("DistinctPrograms", DistinctPrograms);
        // });
        
        // integration.all('OIE_Get_Programs',{
            
        // }).then(function (Programs) {
        // 	console.log("Programs", Programs);
        // });

        // integration.all('Conditional_Actor_Student',{
        //     studentEmail: 'bdlarmor@oaklandcc.edu'
        // }).then(function (person) {
        // 	console.log("Person", person);
        // });  
        
            const studentID = '1405385';
          integration.first('Web_Ethos_Get_Persons_by_Colleague_ID',{ personID: studentID}).then(function(personResults){
              console.log('Person Results', personResults);
              if (personResults) {
                let personGUID = personResults.id;
                console.log('personGUID:', personGUID);
                
              // var selectedTerm = $('#selectedTerm').val();
                integration.all('Web_Ethos_Section_Registration_by_Registrant',{personGUID: personGUID}).then(function(sectionReg){
                    console.log('Registration:', sectionReg);
                    
                    sectionReg.forEach(section => {
                        integration.all('Web_Ethos_Get_Sections_by_Section_ID',{sectionsGUID: section.section.id}).then(function(courseSection){
                            
                                console.log('Section:', courseSection);
                            
                        });
                 
                    });   
                });
              } else {
                 notify('error','Person not found');
                 $('.loading').hide();
              }
          });      
        
        // integration.all('OIE_Get_Employee_Email',{
            
        // }).then(function (EmployeeEmail) {
        // 	console.log("EmployeeEmail", EmployeeEmail);
        // });
        
        
        // integration.all('Web_Ethos_Get_Grade_Definitions_by_ID',{
            
        // }).then(function (Grades) {
        // 	console.log("Grades", Grades);
        // });
        
        
        
        // integration.all('Web_Ethos_Get_Persons_by_Colleague_ID',{
        //         personID: user.ErpId
        //      }).then(function (personResults) {
    	   //     console.log('Person Results');
    	        
        //     });
        
        
        // integration.all('EthosColleagueEmploymentDepartments',{
           
        // }).then(function (employmentDepts) {
    	   //     console.log('employmentDepts', employmentDepts);
    	        
        // });
    //     integration.all('Etrieve_Integration_Get_HR_Departments',{
           
    //     }).then(function (HRDepartments) {
    // 	        console.log('HRDepartments', HRDepartments);
    //     });
        

    //         integration.all('Web_Ethos_Get_Academic_Periods_by_endOn_Date',{
    //             logic: '$gte',
    //             endOnDate: dateManipulation(0)
    //         }).then(function (academicPeriodEndOnData) {
    //                 var todayPlus365 = dateAddition(720);
    //             console.log('All Period Data: ', academicPeriodEndOnData);
    //             console.log(getCurrentAndNextPeriods(academicPeriodEndOnData));
    //             academicPeriodEndOnData.forEach(function (results) {
    //               if(results.endOn <= todayPlus365){                              
    //                 vm.AcademicPeriodsAutocomplete.push({
    //                         termCode: results.code,
    //                         termTitle: results.title
    //                     });
    //               }
    //             }); 
    //           console.log('Academic Periods', vm.AcademicPeriodsAutocomplete());    
    //         });
 
    //  function dateManipulation(days) {
    //       var date = new Date();
    //       date.setDate(date.getDate() + days);
    //       var year = date.getFullYear();
    //       var month = (date.getMonth() + 1).toString().padStart(2, "0");
    //       var day = date.getDate().toString().padStart(2, "0");
    //       return `${year}-${month}-${day}`;
    // }

    //     function dateAddition(days) {
    //       var date = new Date();
    //       date.setDate(date.getDate() + days);
    //       var year = date.getFullYear();
    //       var month = (date.getMonth() + 1).toString().padStart(2, "0");
    //       var day = date.getDate().toString().padStart(2, "0");
    //       return `${year}-${month}-${day}T00:00:00Z`;
    // }

    // function getCurrentAndNextPeriods(data) {
    //     const currentDate = new Date();
        
    //     // Filter out terms that contain "AY" in their code
    //     const filteredData = data.filter(term => !term.code.includes("AY"));
    
    //     // Sort terms by start date
    //     filteredData.sort((a, b) => new Date(a.startOn) - new Date(b.startOn));
    
    //     // Find the current period
    //     let currentPeriodIndex = filteredData.findIndex(term => 
    //         new Date(term.startOn) <= currentDate && new Date(term.endOn) >= currentDate
    //     );
    
    //     // If no exact match, find the next upcoming period
    //     if (currentPeriodIndex === -1) {
    //         currentPeriodIndex = filteredData.findIndex(term => new Date(term.startOn) > currentDate);
    //     }
    
    //     // Get the current and next period
    //     let selectedPeriods = [];
    //     if (currentPeriodIndex !== -1) {
    //         selectedPeriods.push(filteredData[currentPeriodIndex]);
    //         if (currentPeriodIndex + 1 < filteredData.length) {
    //             selectedPeriods.push(filteredData[currentPeriodIndex + 1]);
    //         }
    //     }
    
    //     return selectedPeriods;
    // }

// integration.all('Web_Ethos_Get_Academic_Periods_by_endOn_Date', {
//     logic: '$gte',
//     endOnDate: dateManipulation(0)
// }).then(function (academicPeriodEndOnData) {
//     console.log('All Period Data: ', academicPeriodEndOnData);
    
//     const selectedPeriods = getCurrentAndNextPeriods(academicPeriodEndOnData);

//     vm.AcademicPeriodsAutocomplete(selectedPeriods.map(period => ({
//         termCode: period.code,
//         termTitle: period.title
//     })));

//     console.log('Academic Periods', vm.AcademicPeriodsAutocomplete());
// });

function dateManipulation(days) {
    let date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

function getCurrentAndNextPeriods(data) {
    const currentDate = new Date();

    // Filter out terms that contain "AY" in their code
    const filteredData = data.filter(term => !term.code.includes("AY"));

    // Sort terms by start date
    filteredData.sort((a, b) => new Date(a.startOn) - new Date(b.startOn));

    // Find the current period or the next available one
    let currentPeriodIndex = filteredData.findIndex(term =>
        new Date(term.startOn) <= currentDate && new Date(term.endOn) >= currentDate
    );

    if (currentPeriodIndex === -1) {
        currentPeriodIndex = filteredData.findIndex(term => new Date(term.startOn) > currentDate);
    }

    // Return current and next period (if available)
    return currentPeriodIndex !== -1
        ? filteredData.slice(currentPeriodIndex, currentPeriodIndex + 2)
        : [];
}
        
        // integration.all('EthosColleaguePayClasses',{
           
        // }).then(function (paydata) {
    	   //     console.log('PAY CLASSES =>', paydata);
        // });
        
        // integration.all('Web_Ethos_Get_Pay_Cycles').then(function (paydata) {
    	   //     console.log('PAY CYCLES =>', paydata);
    	        
        // });
        
        // integration.all('Web_Ethos_Get_Pay_Periods_by_Pay_Cycle_GUID',
        // // {
        // //   id: "6918c252-dfee-4ebf-8f02-e1e0a4080f87"
        // // }
        // ).then(function (paydata) {
    	   // console.log('PAY PERIODS =>', paydata);
        // })
        // .catch(error => console.error("Error retrieving pay periods", error));
        



       
        
        
        
  
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
