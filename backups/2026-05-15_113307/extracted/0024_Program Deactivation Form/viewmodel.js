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
	"https://softdocscdn.etrieve.cloud/extenders/extenders.min.js"
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
	formUtils
) {
	//This function is used to set the autosize function on textareas with a class of autosizeareas.
	//Uncomment to use.
	autosize($(".autosizeareas"));

	// Form-scoped required indicators manager.
	// Safe to call before init. Calls to setRequired(…) queue until afterLoad runs init(vm).
	var requiredIndicators = formUtils.createRequiredIndicators();

	// Form-scoped autocomplete utility manager.
	// Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
	var autoCompleteUtils = formUtils.createAutoCompleteUtils();

	vm.addObservable("uniqueDeanList");

	/*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
	$(".maskphone").mask("(999)999-9999? ext:9999");
	$(".maskzip").mask("99999?-9999");
	$(".maskssn").mask("999-99-9999");
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

		// // Function to show the loading indicator with a cute animation
		// function showLoading() {
		//     let loadingElement = document.createElement('div');
		//     loadingElement.id = 'loadingIndicator';
		//     loadingElement.innerHTML = `
		//         <div class="loading-animation">
		//             <div class="dot"></div>
		//             <div class="dot"></div>
		//             <div class="dot"></div>
		//         </div>
		//         <p>Loading your data with Ethos, please wait...</p>`;
		//     loadingElement.style.position = 'fixed';
		//     loadingElement.style.top = '50%';
		//     loadingElement.style.left = '50%';
		//     loadingElement.style.transform = 'translate(-50%, -50%)';
		//     loadingElement.style.textAlign = 'center';
		//     loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
		//     loadingElement.style.color = '#fff';
		//     loadingElement.style.padding = '20px';
		//     loadingElement.style.borderRadius = '5px';
		//     loadingElement.style.zIndex = '9999';
		//     document.body.appendChild(loadingElement);
		// }

		// // Function to hide the loading indicator
		// function hideLoading() {
		//     let loadingElement = document.getElementById('loadingIndicator');
		//     if (loadingElement) {
		//         document.body.removeChild(loadingElement);
		//     }
		// }

		// // Function to show an error message and reload the form
		// function showErrorAndReload(error) {
		//     hideLoading(); // Hide the loading indicator first

		//     let errorElement = document.createElement('div');
		//     errorElement.id = 'errorIndicator';
		//     errorElement.innerHTML = `<p>Error loading data: ${error.message || "Unknown error"}. The form will reload automatically in a moment.</p>`;
		//     errorElement.style.position = 'fixed';
		//     errorElement.style.top = '50%';
		//     errorElement.style.left = '50%';
		//     errorElement.style.transform = 'translate(-50%, -50%)';
		//     errorElement.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
		//     errorElement.style.color = '#fff';
		//     errorElement.style.padding = '20px';
		//     errorElement.style.borderRadius = '5px';
		//     errorElement.style.zIndex = '9999';
		//     document.body.appendChild(errorElement);

		//     // Reload the form after a short delay to give the user time to read the error message
		//     setTimeout(() => {
		//         location.reload();
		//     }, 5000); // Reload after 5 seconds
		// }

		// // Set a timeout to show an error if loading takes too long
		// let loadingTimeout = setTimeout(() => {
		//     showErrorAndReload({ message: "The request is taking longer than expected." });
		// }, 15000); // 15 seconds timeout

		// // Call the functions where necessary
		// showLoading();

		// integration.first('EthosColleagueEmployeeByErpId', {}).then((employeeInfo) => {
		//     const preferredName = employeeInfo.names.find(name => name.preference === "preferred");
		//     const fullName = preferredName.fullName;
		//     // Assuming `vm.fullName` is no longer needed, if it is, uncomment and use it.
		//     vm.personalPhone(employeeInfo.phones[0].number);
		//     vm.originatorEmail(employeeInfo.emails[0].address);

		//     // Parallelize the two independent requests
		//     return Promise.all([
		//         integration.first('Web_Ethos_Get_Persons_by_Colleague_ID', { personID: user.ErpId }),
		//         integration.first('Web_Ethos_Get_institution_jobs_by_Person_GUID', { personGUID: personResults.id })
		//     ]);
		// }).then(([personResults, instJob]) => {
		//     // These two can run in parallel as well
		//     return Promise.all([
		//         integration.first('Web_Ethos_Get_Employment_Department_by_GUID', { deptGUID: instJob.department.id }),
		//         integration.first('Web_Ethos_Get_institution_positions_by_Position_GUID', { positionGUID: instJob.position.id })
		//     ]);
		// }).then(([deptResults, instPos]) => {
		//     vm.department(deptResults.title);
		//     vm.position(instPos.title);
		// }).catch((error) => {
		//     console.error('Error during integration calls:', error);
		//     // showErrorAndReload(error); // Handle the error as needed
		// });

		integration
			.first("EthosColleagueEmployeeByErpId", {})
			.then((employeeInfo) => {
				const preferredName = employeeInfo.names.find(
					(name) => name.preference === "preferred"
				);
				const fullName = preferredName.fullName;
				// vm.fullName(fullName);
				vm.personalPhone(employeeInfo.phones[0].number);
				vm.originatorEmail(employeeInfo.emails[0].address);
			});

		integration
			.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
				personID: user.ErpId
			})
			.then(function (personResults) {
				// GET JOBS
				integration
					.first("Web_Ethos_Get_institution_jobs_by_Person_GUID", {
						personGUID: personResults.id
					})
					.then(function (instJob) {
						// Get department from the Job
						integration
							.first(
								"Web_Ethos_Get_Employment_Department_by_GUID",
								{
									deptGUID: instJob.department.id
								}
							)
							.then(function (deptResults) {
								vm.department(deptResults.title);

								// GET POSITIONS FROM JOB
								integration
									.first(
										"Web_Ethos_Get_institution_positions_by_Position_GUID",
										{
											positionGUID: instJob.position.id
										}
									)
									.then(function (instPos) {
										vm.position(instPos.title);

										// // GET SUPERVISOR Information from the Job
										// integration.all('Web_Ethos_Get_Person_by_GUID', {
										//     personGUID: getPrimarySupervisor(instJob.supervisors)
										// }).then(function(supervisorData) {
										//     vm.supervisorName(getPreferredName(supervisorData.names));
										//     vm.supervisorEmail(getPrimaryEmail(supervisorData.emails));
										// });
									});
							});
					});
			});

		integration.all("OIE_Get_Deans").then(function (deanobj) {
			// Create a Map to remove duplicates based on 'Dean' and 'Dean_Email'
			const uniqueDeansMap = new Map();

			deanobj.forEach((dean) => {
				uniqueDeansMap.set(dean.Dean + dean.Dean_Email, dean);
			});

			// Convert the Map values to an array and sort it alphabetically by last name
			const uniqueDeans = Array.from(uniqueDeansMap.values()).sort(
				(a, b) => {
					const lastNameA = a.Dean.split(",")[0].trim().toLowerCase();
					const lastNameB = b.Dean.split(",")[0].trim().toLowerCase();
					return lastNameA.localeCompare(lastNameB);
				}
			);

			// Push results into the observable
			vm.uniqueDeanList(uniqueDeans);
		});

		integration.all("OIE_Get_Distinct_Programs").then(function (distProg) {
			console.log("OIE_Get_Distinct_Programs");
		});

		integration.all("OIE_Program_List").then(function (OIE_Program_List) {
			console.log("OIE_Program_List");
		});

		ko.computed(function () {
			var academicDeanSignature = vm.academicDeanSignature();
			if (academicDeanSignature) {
				vm.academicDeanSignatureDate(
					new Date().toLocaleDateString("en-US")
				);
			}

			var provostAssociateSignature =
				vm.provostAssociateProvostSignature();
			if (provostAssociateSignature) {
				vm.provostAssociateProvostSignatureDate(
					new Date().toLocaleDateString("en-US")
				);
			}

			var accreditationLiaisonSignature =
				vm.accreditationLiaisonOfficerSignature();
			if (accreditationLiaisonSignature) {
				vm.accreditationLiaisonOfficerSignatureDate(
					new Date().toLocaleDateString("en-US")
				);
			}
		});

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

		// Initialize required indicators after VM bindings and form DOM are ready.
		// This replays any queued setRequired(…) calls made earlier in setDefaults.
		requiredIndicators.init(vm);

		// Initialize autocomplete utilities after VM bindings are ready.
		// Replays any queued makeReadOnly/makeEditable calls made earlier.
		autoCompleteUtils.init(vm);

		// Toggle export mode styling and behavior.
		// Hides required indicators/notes and normalizes readonly presentation for export.
		autoCompleteUtils.setExportMode(pkg.isExporting);

		/*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
		autosize($("textarea"));
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
		// Enable native DOM `required` attributes at validation time.
		// This prevents fields from appearing invalid on initial load,
		// while still allowing browser validation during submit.
		requiredIndicators.applyNativeRequiredForValidation();
	};

	vm.afterRequired = function afterRequired(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
		requiredIndicators.clearNativeRequired();
	};

	vm.onOptOut = function onOptOut(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	vm.onESignSubmit = function onESignSubmit(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	return vm;
});
