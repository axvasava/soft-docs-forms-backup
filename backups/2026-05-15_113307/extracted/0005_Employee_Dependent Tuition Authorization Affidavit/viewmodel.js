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
	// Form-scoped required indicators manager.
	// Safe to call before init. Calls to setRequired(...) queue until afterLoad runs init(vm).
	var requiredIndicators = formUtils.createRequiredIndicators();

	// Form-scoped autocomplete utility manager.
	// Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
	var autoCompleteUtils = formUtils.createAutoCompleteUtils();

	vm.addObservableArray("AcademicPeriodsAutocomplete");

	$(".developer").hide();

	// ================================ LOOKUP CHECK ==============================================

	$(".lookupCheck").hide();
	//set the lookup check variable to no. Form will not submit after the lookup check step until set to yes
	let lookupCheckTracker = "No";

	//call the lookup check function when the button is clicked
	$("#lookupCheckButton").click(function () {
		lookupCheck();
	});

	//Check for a student lookup
	function lookupCheck() {
		integration
			.first("Etrieve_Content_Connection_Student_Lookup_Check", {
				studentID: vm.studentIDLookupCheck()
			})
			.then(function (vals) {
				//console.log(vals);
				if (!vals) {
					lookupCheckTracker = "No";
					notify(
						"error",
						"No Lookup found for this student. There will need to be a Student Lookup before you can approve this formt."
					);
				} else {
					lookupCheckTracker = "Yes";
					notify(
						"success",
						"Student Lookup found! You may now approve this form."
					);
				}
			});
	}

	// ================================ END LOOKUP CHECK ==========================================

	//This function is used to set the autosize function on textareas with a class of autosizeareas.
	//Uncomment to use.
	//autosize($('.autosizeareas'));

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

		if (
			pkg.isAtStep(
				"WFTuitionAuthorizationAffidavitStudentServicesSpecialist"
			)
		) {
			$(".lookupCheck").show();
		}

		integration
			.all("Web_Ethos_Get_Academic_Periods_by_startOn_date", {
				logic: "$gte",
				startOnDate: dateManipulation(100)
			})
			.then(function (academicPeriodStartOnData) {
				//console.log('academicPeriodStartOnData',academicPeriodStartOnData);
				academicPeriodStartOnData.forEach(function (results) {
					vm.AcademicPeriodsAutocomplete.push({
						termCode: results.code,
						termGUID: results.id,
						termTitle: results.title
					});
				});
			});

		vm.selectedTerm.subscribe((newValue) => {
			if (newValue) {
				let [year, season] = newValue.split("/"); // Split the term into year and season
				let startYear = parseInt(year, 10); // Parse the year part as an integer
				let academicYear;

				// Determine the academic year based on the term season
				if (season === "FA") {
					// Fall is part of the next academic year cycle
					academicYear = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
				} else if (
					season === "WI" ||
					season === "SU" ||
					season === "AY"
				) {
					// Winter and Summer are part of the current academic year cycle
					academicYear = `${startYear - 1}-${startYear.toString().slice(-2)}`;
				} else {
					// Handle unexpected input
					academicYear = "Invalid term";
				}

				// Update the academicYear observable
				vm.academicYear(academicYear);
			} else {
				vm.academicYear("");
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

		// Initialize required indicators after VM bindings and form DOM are ready.
		// This replays any queued setRequired(...) calls made earlier in setDefaults.
		requiredIndicators.init(vm);

		// Initialize autocomplete utilities after VM bindings are ready.
		// Replays any queued makeReadOnly/makeEditable calls made earlier.
		autoCompleteUtils.init(vm);

		// Toggle export mode styling and behavior.
		// Hides required indicators/notes and normalizes readonly presentation for export.
		autoCompleteUtils.setExportMode(pkg.isExporting);

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		if (
			pkg.isAtStep(
				"WFTuitionAuthorizationAffidavitStudentServicesSpecialist"
			)
		) {
			$(":input").prop("disabled", true);
			$("#ssComments").prop("disabled", false);
			$("#studentNumber").prop("disabled", false);
			$("#studentIDLookupCheck").prop("disabled", false);
			$("#lookupCheckButton").prop("disabled", false);
			requiredIndicators.setRequired("studentNumber", true);
			$("#studentNumber").addClass("missing-required-value");

			$(document).ready(function () {
				setTimeout(function () {
					// Disable the autoCompleteTest input field
					$("#semester").prop("disabled", true);

					// Change cursor to 'not-allowed' or 'default' on mouse-over
					$("#semester").css("cursor", "not-allowed");
				}, 2000); // Adjust the timeout as necessary
			});
		}

		/*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
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

		//Require Human Resources to complete the HR Comments to Employee field if HR declines the form
		if (pkg.isAtStep("WFTuitionAuthorizationAffidavitHumanResources")) {
			if (vm.hrComments()) {
				return true;
			} else {
				requiredIndicators.setRequired("hrComments", true);

				throw new Error("Please fill out the HR Comments field.");
			}
		}

		//Require Student Services Specialist to complete the Student Services Comments field if SSS declines the form
		if (
			pkg.isAtStep(
				"WFTuitionAuthorizationAffidavitStudentServicesSpecialist"
			)
		) {
			if (vm.hrComments()) {
				return true;
			} else {
				requiredIndicators.setRequired("ssComments", true);
				throw new Error(
					"Please fill out the Student Services Comments field."
				);
			}
		}
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

		if (
			pkg.isAtStep(
				"WFTuitionAuthorizationAffidavitStudentServicesSpecialist"
			) &&
			vm.waiverRecipient() == "Spouse/Dependent"
		) {
			if (lookupCheckTracker == "No") {
				throw new Error(
					"Form cannot be submitted until a Lookup has been created for this student. Please try again later."
				);
			} else if (lookupCheckTracker == "Yes") {
				return true;
			}
		} else {
			return true;
		}
	};

	vm.onOptOut = function onOptOut(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	vm.onESignSubmit = function onESignSubmit(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	function dateManipulation(days) {
		var date = new Date();
		date.setDate(date.getDate() - days);
		var year = date.getFullYear();
		var month = (date.getMonth() + 1).toString().padStart(2, "0");
		var day = date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	return vm;
});
