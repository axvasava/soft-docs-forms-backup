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

	// Add near your utility setup
	vm.addObservableArray("EmployeesAutocomplete");

	//This function is used to set the autosize function on textareas with a class of autosizeareas.
	//Uncomment to use.
	//autosize($('.autosizeareas'));

	/*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
	$(".maskphone").mask("999-999-9999");
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
		return integration
			.all("Security_Get_CW_Employees", {})
			.then(function (employees) {
				vm.EmployeesAutocomplete([]);

				employees.forEach(function (employee) {
					vm.EmployeesAutocomplete.push(employee);
				});

				if (user.isInLibrary) {
					vm.formId(formUtils.generateFormID());

					vm.instructor($("#originatorDisplayName").val());
					vm.instructorEmail($("#originatorEmail").val());
				}

				vm.campus.subscribe(function (campus) {
					vm.selectedCampus(campus);
				});

				if (pkg.isAtStep("Start")) {
					$(".admin").hide();
					$(".facilities").hide();
				}

				if (
					pkg.isAtStep("FacilitiesAH") ||
					pkg.isAtStep("FacilitiesHL") ||
					pkg.isAtStep("FacilitiesOR") ||
					pkg.isAtStep("FacilitiesROSF")
				) {
					$(".admin").hide();

					fieldStateUtils.lockForm({
						except: ["actualRoomAssignment", "admin", "notes"],
						skipHidden: true,
					});
				}

				if (pkg.isAtStep("CondAdmin")) {
					$(".admin").show();
					$(".facilities").show();

					fieldStateUtils.lockForm({
						except: [
							"cardDone",
							"lblCardDone",
							"facultySecretary",
							"dean",
							"deptChair",
							"roomUpdated",
						],
						skipHidden: true,
					});

					fieldStateUtils.unlockFields("cardDone");
				}
			})
			.catch(function (error) {
				console.log("Failed to load EmployeesAutocomplete", error);

				notify(
					"error",
					"There was an issue loading employee autocomplete data.",
				);
			});
	};

	vm.afterLoad = function afterLoad() {
		//  This method is called after setDefaults has been called.

		//  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
		//  to save values to the server.

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		formLifecycle.afterLoad();

		registerDropdownAutocompleteValidators();

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

		fieldValidation.requireValidAutocompletes();

		//  returned to Originator.

		const originatorEmail = $("#originatorEmail").val();
		const instructorEmail = $("#instructorEmail").val();
		if (instructorEmail == originatorEmail) {
			vm.isOriginatorInstructor("Yes");
		} else {
			vm.isOriginatorInstructor("No");
		}

		if (
			!$("#monday").is(":checked") &&
			!$("#tuesday").is(":checked") &&
			!$("#wednesday").is(":checked") &&
			!$("#thursday").is(":checked") &&
			!$("#friday").is(":checked") &&
			!$("#saturday").is(":checked") &&
			!$("#sunday").is(":checked")
		) {
			notify("error", "Days of the week is required");
			return false;
		}
	};

	vm.onApprove = function onApprove(form) {
		//  This method is called when the Approve button is clicked and before calling beforeRequired.

		fieldValidation.requireValidAutocompletes();

		if (
			pkg.isAtStep("FacilitiesAH") ||
			pkg.isAtStep("FacilitiesHL") ||
			pkg.isAtStep("FacilitiesOR") ||
			pkg.isAtStep("FacilitiesROSF")
		) {
			fieldStateUtils.unlockFields([
				"actualRoomAssignment",
				"admin",
				"notes",
			]);
		}

		if (pkg.isAtStep("CondAdmin")) {
			//Admin Use
			fieldStateUtils.unlockFields([
				"facultySecretary",
				"dean",
				"deptChair",
				"cardDone",
			]);
		}
	};

	vm.onDecline = function onDecline(form) {
		//  This method is called when the Decline button is clicked and before calling beforeRequired.

		fieldValidation.requireValidAutocompletes();
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

	function getEmployeeList() {
		return vm.EmployeesAutocomplete ? vm.EmployeesAutocomplete() : [];
	}

	function registerDropdownAutocompleteValidators() {
		fieldValidation.registerAutocompleteValidator({
			fieldId: "instructor",
			observable: vm.instructor,
			source: getEmployeeList,
			matchProperty: "UserName",
			allowBlank: false,

			onValid: function (value, match) {
				vm.instructorEmail(match.Email || "");
			},

			onInvalid: function () {
				vm.instructorEmail("");
			},
		});

		fieldValidation.registerAutocompleteValidator({
			fieldId: "admin",
			observable: vm.admin,
			source: function () {
				return vm.administrativeSpecialistEmail()
					? [
							{
								displayValue: vm.admin(),
								email: vm.administrativeSpecialistEmail(),
							},
						]
					: [];
			},
			matchProperty: "displayValue",
			allowBlank: false,

			onValid: function () {},

			onInvalid: function () {
				vm.administrativeSpecialistEmail("");
			},
		});

		fieldValidation.registerAutocompleteValidator({
			fieldId: "facultySecretary",
			observable: vm.facultySecretary,
			source: function () {
				return vm.facultySecretaryEmail()
					? [
							{
								displayValue: vm.facultySecretary(),
								email: vm.facultySecretaryEmail(),
							},
						]
					: [];
			},
			matchProperty: "displayValue",
			allowBlank: true,

			onValid: function () {},

			onInvalid: function () {
				vm.facultySecretaryEmail("");
			},
		});

		fieldValidation.registerAutocompleteValidator({
			fieldId: "dean",
			observable: vm.dean,
			source: function () {
				return vm.deanEmail()
					? [
							{
								displayValue: vm.dean(),
								email: vm.deanEmail(),
							},
						]
					: [];
			},
			matchProperty: "displayValue",
			allowBlank: true,

			onValid: function () {},

			onInvalid: function () {
				vm.deanEmail("");
			},
		});

		fieldValidation.registerAutocompleteValidator({
			fieldId: "deptChair",
			observable: vm.deptChair,
			source: function () {
				return vm.departmentChairEmail()
					? [
							{
								displayValue: vm.deptChair(),
								email: vm.departmentChairEmail(),
							},
						]
					: [];
			},
			matchProperty: "displayValue",
			allowBlank: true,

			onValid: function () {},

			onInvalid: function () {
				vm.departmentChairEmail("");
			},
		});
	}

	return vm;
});
