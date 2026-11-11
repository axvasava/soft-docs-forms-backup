define([
	"jquery",
	"knockout",
	"vmBase",
	"integration",
	"notify",
	"user",
	"template/autosize.min",
	"template/jquery.maskedinput",
	"./liveViewModel.js",
	"package",
	"https://webapps.oaklandcc.edu/cdn/utils/formUtils.js",
	/*-- WARNING: Uncommenting the line of code below will allow you to use Etrieve Extenders on this form.
    Currently, Etrieve Extenders are only compatible with cloud based instances of Etrieve.
    If you are unsure if you can utilize Extenders, please contact your institution's Etrieve Administrator.*/
	"https://softdocscdn.etrieve.cloud/extenders/extenders.min.js",
], function viewmodel(
	$,
	ko,
	vm,
	integration,
	notify,
	user,
	autosize,
	maskedinput,
	liveVM,
	pkg,
	formUtils,
) {
	var formLifecycle = formUtils.createFormLifecycleUtils({
		vm: vm,
		pkg: pkg,
		user: user,
		formUtils: formUtils,
	});

    var requiredIndicators = formLifecycle.requiredIndicators;
	var fieldStateUtils = formLifecycle.fieldStateUtils;
	var fieldValidation = formLifecycle.fieldValidation;

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

    vm.addObservableArray("personsPositionsList");
	vm.personsPositionsList([]);
	
	function lockContainers() {
	  	fieldStateUtils.lockContainers([
			"empInfo",
			"funds",
        ]);   
	}

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
        
        vm.employeeSignature.subscribe(function (newValue) {
			if (newValue) {
				vm.employeeSignDate(Extenders.utils.formatDate(new Date()));
			} else {
				vm.employeeSignDate("");
			}
        });


        if (user.isInLibrary) {
            //  Input Values set here will be saved to the server when the user makes a form
            //  instance creating action: changing an input value or clicking submit.
           
            let idSearch = vm.originatorErpId;
            
		integration.first("Web_Ethos_Get_Persons_by_Colleague_ID", {personID: idSearch	}).then(function (personResults) {
			if (personResults) {
			    console.log("personResults", personResults)
				integration.all("Web_Ethos_Get_active_institution_jobs_by_Person_GUID",	{personGUID: personResults.id}).then(function (allInstJob) {
				    console.log("allInstJob", allInstJob)
					const promises = [];
					vm.personsPositionsList([]); 

				 	allInstJob.forEach(function (job) {
				 	   console.log("job", job)
				 	   promises.push(
				 	       integration.first("Web_Ethos_Get_institution_positions_by_Position_GUID", {positionGUID: job.position.id})
				       );
				 	});
				 	
					// Wait for all promises to resolve
					Promise.all(promises).then(function (results) {
					    console.log("results", results)
						results.forEach(function (resultData) {
						    console.log("resultData", resultData)
							vm.personsPositionsList.push({
									positionDepartmentGUID: resultData.departments[0].id,
							});
						});

						if (!vm.personsPositionsList().length) {
							notify("warning", "No active positions found for this employee.");
							vm.department("");
				
							return;
						}

						integration.first("Web_Ethos_Get_Employment_Department_by_GUID", {deptGUID: vm.personsPositionsList()[0].positionDepartmentGUID}).then((deptResults) => {
						    console.log("deptResults", deptResults)
							vm.department(deptResults.title);
						});
					}).catch(function (error) {
						console.error("Error occurred:", error);
					});
				});
			} else {
				notify("error", "Person not found");
					
				vm.department("");
				
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
        
        formLifecycle.afterLoad();
        
        if (vm.addCheckRow().length === 0){
		   vm.addCheckRow.push({});
        }

        /*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
        autosize($('textarea'));
        
        if (pkg.isAtStep("Start")) {
            $(".ap").hide();
            
        }  
        
        if (pkg.isAtStep("FinancialServicesAP")) {
            $(".ap").show();
            
            lockContainers();
        }
        
        //This will take the GL number and verify that it is valid and populate the 
        //GL description
        ko.computed(function () {
			let total = 0;
			// loop through dynamic list
			vm.addCheckRow().forEach(function (rowData) {
				validateAccountNumberInDynamicList(
					rowData,
					"glNumber",
					"glNumDesc",
				);

				if (rowData.amount()) {
					let formatted = formUtils.formatAmountRounded(
						rowData.amount(),
					);
				
					const rawNumber = parseFloat(formatted.replace(/,/g, ""));
					total += rawNumber;
					rowData.amount(formatted);
				}
			});
            
            let formattedTotal = formUtils.formatAmountRounded(total);
			vm.fundsTotal(formattedTotal);
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
        formLifecycle.beforeRequired();
    };

    vm.afterRequired = function afterRequired(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.
        formLifecycle.afterRequired();
    };

     vm.onOptOut = function onOptOut(form) {
       //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    vm.onESignSubmit = function onESignSubmit(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };
    
   
    function validateAccountNumberInDynamicList(
		dynamicListRow,
		accountNumber,
		accountNumberDesc,
	) {
		// if a value exists in the account field ...
		if (dynamicListRow[accountNumber]()) {
			var currentGlNumber = dynamicListRow[accountNumber]();

			if (dynamicListRow._lastValidatedGlNumber !== currentGlNumber) {
				dynamicListRow[accountNumberDesc]("");
				dynamicListRow._lastValidatedGlNumber = currentGlNumber;
			}
			// ... AND the description is empty ...
			if (!dynamicListRow[accountNumberDesc]()) {
				// ... then check the integration for validating the account number AND populate the account number desc
				integration
					.all(
						"Web_Ethos_Validate_Accounting_Strings_by_GLAccountNumber",
						{
							GLAccountNumber: dynamicListRow[accountNumber](),
						},
					)
					.then(function (validateAcctString) {
						dynamicListRow[accountNumberDesc](
							validateAcctString["description"],
						);
						notify("success", "Account number valid");
					})
					.catch(function (error) {
						//console.error('An error occurred:', error.message);
						dynamicListRow[accountNumber](undefined);
						dynamicListRow[accountNumberDesc](undefined);
						notify("error", "Account number not valid");
					});
			} else {
			}
		} else {
			// if account number was removed...
			// ... then clear out the desc
			dynamicListRow[accountNumberDesc](undefined);
		}
	}
	
	

    return vm;
});
