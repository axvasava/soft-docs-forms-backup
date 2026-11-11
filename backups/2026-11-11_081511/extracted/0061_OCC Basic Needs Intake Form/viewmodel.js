/* jshint maxerr: 10000 */
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

	vm.addObservableArray("startTimes");
	vm.startTimes([
		{ startTime: "9:00 AM" },
		{ startTime: "9:30 AM" },
		{ startTime: "10:00 AM" },
		{ startTime: "10:30 AM" },
		{ startTime: "11:00 AM" },
		{ startTime: "11:30 AM" },
		{ startTime: "12:00 PM" },
	]);

	vm.addObservableArray("endTimes");
	vm.endTimes([
		{ endTime: "1:00 PM" },
		{ endTime: "1:30 PM" },
		{ endTime: "2:00 PM" },
		{ endTime: "2:30 PM" },
		{ endTime: "3:00 PM" },
		{ endTime: "3:30 PM" },
		{ endTime: "4:00 PM" },
	]);
	
	vm.howDidYouHear = ko.observable('');
    vm.ethnicity = ko.observable('');

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

	//08/03/26 EP
	function formatSelection(selected) {
       return selected
             .replace(/\s*-\s*/g, "-")
             .trim();
    }
    // end
	
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

		// Subscribe to availability checkboxes and clear related fields if unchecked
		vm.mondayHoursCheck.subscribe(function () {
			clearRelatedFields(
				vm.mondayMorningStart,
				vm.mondayMorningEnd,
				vm.mondayAfternoonStart,
				vm.mondayAfternoonEnd,
			);
		});

		vm.tuesdayHoursCheck.subscribe(function () {
			clearRelatedFields(
				vm.tuesdayMorningStart,
				vm.tuesdayMorningEnd,
				vm.tuesdayAfternoonStart,
				vm.tuesdayAfternoonEnd,
			);
		});

		vm.wednesdayHoursCheck.subscribe(function () {
			clearRelatedFields(
				vm.wednesdayMorningStart,
				vm.wednesdayMorningEnd,
				vm.wednesdayAfternoonStart,
				vm.wednesdayAfternoonEnd,
			);
		});

		vm.thursdayHoursCheck.subscribe(function () {
			clearRelatedFields(
				vm.thursdayMorningStart,
				vm.thursdayMorningEnd,
				vm.thursdayAfternoonStart,
				vm.thursdayAfternoonEnd,
			);
		});

		vm.fridayHoursCheck.subscribe(function () {
			clearRelatedFields(
				vm.fridayMorningStart,
				vm.fridayMorningEnd,
				vm.fridayAfternoonStart,
				vm.fridayAfternoonEnd,
			);
		});

		// Apply to all Monday through Friday input pairs
		handleTimeInput(vm.mondayMorningStart, "#mondayMorningEnd");
		handleTimeInput(vm.mondayAfternoonStart, "#mondayAfternoonEnd");
		handleTimeInput(vm.tuesdayMorningStart, "#tuesdayMorningEnd");
		handleTimeInput(vm.tuesdayAfternoonStart, "#tuesdayAfternoonEnd");
		handleTimeInput(vm.wednesdayMorningStart, "#wednesdayMorningEnd");
		handleTimeInput(vm.wednesdayAfternoonStart, "#wednesdayAfternoonEnd");
		handleTimeInput(vm.thursdayMorningStart, "#thursdayMorningEnd");
		handleTimeInput(vm.thursdayAfternoonStart, "#thursdayAfternoonEnd");
		handleTimeInput(vm.fridayMorningStart, "#fridayMorningEnd");
		handleTimeInput(vm.fridayAfternoonStart, "#fridayAfternoonEnd");

		// Apply the helper function for all days and time slots
		handleTimeComparison(vm.mondayMorningStart, vm.mondayMorningEnd);
		handleTimeComparison(vm.mondayAfternoonStart, vm.mondayAfternoonEnd);
		handleTimeComparison(vm.tuesdayMorningStart, vm.tuesdayMorningEnd);
		handleTimeComparison(vm.tuesdayAfternoonStart, vm.tuesdayAfternoonEnd);
		handleTimeComparison(vm.wednesdayMorningStart, vm.wednesdayMorningEnd);
		handleTimeComparison(
			vm.wednesdayAfternoonStart,
			vm.wednesdayAfternoonEnd,
		);
		handleTimeComparison(vm.thursdayMorningStart, vm.thursdayMorningEnd);
		handleTimeComparison(
			vm.thursdayAfternoonStart,
			vm.thursdayAfternoonEnd,
		);
		handleTimeComparison(vm.fridayMorningStart, vm.fridayMorningEnd);
		handleTimeComparison(vm.fridayAfternoonStart, vm.fridayAfternoonEnd);

		if (user.isInLibrary) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.

			// Make Monday through Friday time inputs read-only
			setTimeout(function () {
				// Disable the specified input fields and change the cursor to 'not-allowed'
				fieldStateUtils.lockFields([
					"mondayMorningEnd, mondayAfternoonEnd, tuesdayMorningEnd, tuesdayAfternoonEnd, wednesdayMorningEnd, wednesdayAfternoonEnd, thursdayMorningEnd, thursdayAfternoonEnd, fridayMorningEnd, fridayAfternoonEnd",
				]);
			}, 200); // Adjust the timeout as necessary

			vm.email(user.Email);
			vm.formID(formUtils.generateFormID());
		} else {
			//  Input Values set here will be saved to the server immediately.
			//  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
			//  prior users.  Inputs that already have values saved to the server will be overridden with
			//  values set in this method.
		}
		
		//08/03/26 EP maintenance
		vm.ddCountyOfResidence.subscribe(function(county){
		    vm.countyOfResidence(county);
		});
		
		$('input[type="checkbox"]').on('change', function () {
            updateCheckboxList('services', 'howDidYouHear');
            updateCheckboxList('race', 'ethnicity');
            
        });
        // end
	};

	vm.afterLoad = function afterLoad() {
		//  This method is called after setDefaults has been called.

		//  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
		//  to save values to the server.

		// ko.computed(function(){
		//     if (vm.mondayMorningStart() && vm.mondayMorningEnd) {

		//     }
		// })

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		formLifecycle.afterLoad();
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

		vm.submissionDate(Extenders.utils.formatDate(new Date()));
		
		//08/03/26 EP maintenance
		let countyOfResidence = vm.ddCountyOfResidence();
		if (countyOfResidence == 'Other' && !vm.otherCountyOfResidence()) {
		    vm.otherCountyOfResidence().focus;
		    throw new Error("Please spefify Other county of residence");
		}
		
		let gender = vm.gender();
		if (gender == 'Other' && !vm.specifyOtherGender()) {
		    vm.specifyOtherGender().focus;
		    throw new Error("Please specify Other gender");
		}
		
		if (!vm.foodProgramCheck() && !vm.medicalProgramCheck() && !vm.childDaycareProgramCheck() && !vm.cashProgramCheck() && !vm.stateEmergencyReliefProgramCheck()) {
		    throw new Error("Which MDHHS Programs are you interested in is required");
		}
		
		if (!vm.consentToFERPA() && !vm.doNotConsentToFERPA()) {
			throw new Error(
				"You must must make a selection in the FERPA Statement section of the form before submitting.",
			);
		}
		
		if (!vm.emailContactCheck() && !vm.phoneContactCheck()) {
			throw new Error(
				"Prefered method of contact is required.",
			);
		}
		
		if (!vm.mondayHoursCheck() && !vm.tuesdayHoursCheck() && !vm.wednesdayHoursCheck() && !vm.thursdayHoursCheck() && !vm.fridayHoursCheck()) {
			throw new Error(
				"Please select your availbility for a follow-up. You must select at least 1 day.",
			);
		} else {
		    if (!vm.mondayMorningStart() && !vm.mondayAfternoonStart() && !vm.tuesdayMorningStart() && !vm.tuesdayAfternoonStart()
		       && !vm.wednesdayMorningStart() && !vm.wednesdayAfternoonStart() && !vm.thursdayMorningStart() && !vm.thursdayAfternoonStart()
		       && !vm.fridayMorningStart() && !vm.fridayAfternoonStart()) {
			   throw new Error(
				 "You must select at least 1 time; morning or afternoon.",
			   );
		    }
		}
		
		//
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

	//Helper Function *******************************************************************************************
   
    //08/03/26
//   function updateCheckboxList(checkboxName, targetField) {
//         const selected = $('input[name="' + checkboxName + '"]:checked')
//             .map(function () {
//                 return $('label[for="' + this.id + '"]').text().trim();
//             })
//             .get()
//             .join(', ');
    
//         $(targetField).val(selected);
//         //vm.selectedServicesOnCampus(selected);
//     }
 
function updateCheckboxList(checkboxName, targetField) {
    const selected = $('input[name="' + checkboxName + '"]:checked')
        .map(function () {
            return $('label[for="' + this.id + '"]').text().trim();
        })
        .get()
        .join(', ');
 
    if (typeof vm[targetField] === 'function') {
        vm[targetField](selected);
    }
}

	// Helper function to clear related fields when hours checkbox is unchecked
	function clearRelatedFields(
		morningStart,
		morningEnd,
		afternoonStart,
		afternoonEnd,
	) {
		morningStart("");
		morningEnd("");
		afternoonStart("");
		afternoonEnd("");
	}

	// Helper function to convert 12-hour time string to a Date object
	function parseTime(timeString) {
		// Split the time and AM/PM part
		let [time, modifier] = timeString.split(" ");
		let [hours, minutes] = time.split(":");

		// Ensure hours and minutes are integers
		hours = parseInt(hours, 10);
		minutes = parseInt(minutes, 10);

		// Handle PM and AM cases for 12-hour format
		if (modifier === "PM" && hours !== 12) {
			hours += 12;
		} else if (modifier === "AM" && hours === 12) {
			hours = 0;
		}

		// Return a valid date object with just time portion, ignoring the date part
		return new Date(1970, 0, 1, hours, minutes, 0); // Hours, minutes, seconds
	}

	// Helper function to handle subscriptions, enable/disable inputs, and clear end fields
	function handleTimeInput(startField, endField) {
		startField.subscribe(function (newValue) {
			setTimeout(function () {
				if (newValue) {
					// Enable the corresponding end input and reset cursor
					$(endField)
						.prop("disabled", false)
						.css("cursor", "default");
				} else {
					// Disable the corresponding end input, set cursor to 'not-allowed', and clear the field
					$(endField)
						.prop("disabled", true)
						.css("cursor", "not-allowed")
						.val("");
				}
			}, 200); // Adjust the timeout as necessary
		});
	}

	// Helper function to handle subscriptions for comparing start and end times
	function handleTimeComparison(startField, endField) {
		endField.subscribe(function (newEndTime) {
			if (newEndTime) {
				let start = startField();
				let end = newEndTime;

				if (start && end) {
					// Convert times to Date objects for comparison
					let startTime = parseTime(start);
					let endTime = parseTime(end);

					if (endTime <= startTime) {
						notify("error", "End time must be after start time!");
						setTimeout(function () {
							endField(undefined); // Clear the end time
						}, 200);
					}
				}
			}
		});
	}

	//End Helper Function ***************************************************************************************

	return vm;
});
