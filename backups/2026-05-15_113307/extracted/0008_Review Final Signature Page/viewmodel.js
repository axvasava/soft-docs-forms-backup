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

	//This Function provides a unique ID for the form
	vm.makeid = function (length) {
		let result = "";
		let characters = "ABCDEFG0123456789"; // characters & numbers used to create the random string
		let charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(
				Math.floor(Math.random() * charactersLength)
			);
		}
		return new Date().getFullYear() + "-" + result; // use this to include year in the result: YYYY-xxxxxx
		//return result;                                    // use this to only return the result: xxxxxx
	};

	vm.addObservableArray("academicProgramList");
	vm.addObservableArray("SubjectsAutocomplete");

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
		$(".programRow").hide();
		$(".disciplineRow").hide();
		$(".genEdRow").hide();
		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.
	};
	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.

		vm.formID(vm.makeid(6));

		vm.reviewType.subscribe(function (reviewTypeValue) {
			reviewTypeRowShow(reviewTypeValue);
		});

		//unhide rows that need to be completed by the lead reviewer if the lead reviewer is the originator
		vm.leadReviewerEmail.subscribe(function (NewValue) {
			let lrEmail = NewValue.toUpperCase();
			let userEmail = user.Email.toUpperCase();

			if (
				(lrEmail == userEmail && user.isOriginator) ||
				user.isInActivity
			) {
				$(".leadReviewerRow").show();
				vm.skipLeadReviewer("Yes");
			} else {
				$(".leadReviewerRow").hide();
				vm.skipLeadReviewer("No");
			}
		});

		if (
			pkg.stepCode === "WFCurriculumReviewCommitteeChair" ||
			pkg.stepCode === "WFStudentOutcomesAssessmentCommitteeChair" ||
			pkg.stepCode === "End" ||
			user.isInActivity
		) {
			$(".committeeChairRow").show();
		} else {
			$(".committeeChairRow").hide();
		}

		if (
			pkg.stepCode === "ConditionalActorGetDean" ||
			pkg.stepCode === "WFCurriculumReviewCommitteeChair" ||
			pkg.stepCode === "WFStudentOutcomesAssessmentCommitteeChair" ||
			pkg.stepCode === "End" ||
			user.isInActivity
		) {
			$(".academicDeanRow").show();
		} else {
			$(".academicDeanRow").hide();
		}

		integration
			.all("EthosColleagueSubjects", {
				// Add relevant parameters here
			})
			.then(function (subjectsResults) {
				subjectsResults.forEach(function (subjectsResultsDataRow) {
					if (subjectsResultsDataRow.showInCatalog === "Y") {
						// Push custom attributes into autocomplete
						vm.SubjectsAutocomplete.push({
							subjectAbbreviation:
								subjectsResultsDataRow.abbreviation,
							subjectGUID: subjectsResultsDataRow.id,
							subjectTitle: subjectsResultsDataRow.title
						});
					}
				});
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

		// Initialize autocomplete utilities after VM bindings are ready.
		// Replays any queued makeReadOnly/makeEditable calls made earlier.
		autoCompleteUtils.init(vm);

		// Toggle export mode styling and behavior.
		// Hides required indicators/notes and normalizes readonly presentation for export.
		autoCompleteUtils.setExportMode(pkg.isExporting);

		// Initialize required indicators after VM bindings and form DOM are ready.
		// This replays any queued setRequired(...) calls made earlier in setDefaults.
		requiredIndicators.init(vm);

		if (vm.reviewType()) {
			reviewTypeRowShow(vm.reviewType());
		}

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

	function reviewTypeRowShow(reviewTypeValue) {
		switch (reviewTypeValue) {
			case "Program":
				$(".programRow").show();
				$(".disciplineRow").hide();
				$(".genEdRow").hide();
				break;
			case "Discipline":
				$(".programRow").hide();
				$(".disciplineRow").show();
				$(".genEdRow").hide();
				break;
			case "General Education":
				$(".programRow").hide();
				$(".disciplineRow").hide();
				$(".genEdRow").show();
				break;
			default:
				$(".programRow").hide();
				$(".disciplineRow").hide();
				$(".genEdRow").hide();
				break;
		}
	}

	return vm;
});
