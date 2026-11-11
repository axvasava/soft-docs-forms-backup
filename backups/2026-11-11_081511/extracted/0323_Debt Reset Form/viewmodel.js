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

	var formLifecycle = formUtils.createFormLifecycleUtils({
		vm: vm,
		pkg: pkg,
		user: user,
		formUtils: formUtils,
	});

	var requiredIndicators = formLifecycle.requiredIndicators;
	var fieldStateUtils = formLifecycle.fieldStateUtils;
	var fieldValidation = formLifecycle.fieldValidation;
	var termSelectIds = ["intendedEnrollmentTerm", "plannedEnrollmentTerm"];
	var financialServicesRequiredFieldIds = [
		"studentVerificationConfirmed",
		"outstandingBalance",
		"forgivenAmount",
	];
	var studentServicesRequiredFieldIds = [
		"academicProgramSearch",
		"creditsCompleted",
		"lastTerm",
		"sapStatus",
	];
	var finalFinancialServicesRequiredFieldIds = [
		"plannedEnrollmentTerm",
		"finalFinancialServicesNotes",
	];

	var workflowSections = [
		"studentInfoSection",
		"applicationDetailsSection",
		"commitmentToParticipateSection",
		"studentSignatureSection",
		"financialServicesSection",
		"studentServicesSection",
		"finalFinancialServicesSection",
	];

	vm.addObservableArray("programsDropdown");

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
		populateTermSelects(inputValues);
	};
	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.

		//  WARNING: if an integration source is called directly to retrieve values and populate inputs
		//  with default values, setDefaults must return the integration source promise.  If it doesn't,
		//  a form draft may be created every time a user opens the form and more importantly the values
		//  may not be saved to the server.

		if (!isActingAsAnonymous()) {
			registerStudentLookupValidator();
		}

		initFormatValidation();
		initConfirmationRadioAliases();
		initStudentVerificationConfirmation();
		initNoIdSelection();
		initStudentLookupClearing();
		initStudentVerificationAvailability();
		initAcademicYearFromPlannedTerm();

		vm.studentSignature.subscribe(function (newValue) {
			const signature = String(newValue || "").trim();

			vm.studentSignatureDate(
				signature ? formUtils.getTodayDate() : undefined,
			);
		});

		if (user.isInLibrary) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.
		} else {
			//  Input Values set here will be saved to the server immediately.
			//  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
			//  prior users.  Inputs that already have values saved to the server will be overridden with
			//  values set in this method.
		}

		if (!isActingAsAnonymous()) {
			return loadAcademicPrograms();
		}
	};

	vm.afterLoad = function afterLoad() {
		//  This method is called after setDefaults has been called.

		//  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
		//  to save values to the server.

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		formLifecycle.afterLoad();
		applyWorkflowVisibility();
		updateStudentVerificationAvailability();
		registerAcademicProgramValidator();

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
		if (pkg.isAtStep("WFFinancialServices")) {
			requiredIndicators.setRequiredFields(
				financialServicesRequiredFieldIds,
				true,
			);
		}

		if (isStudentServicesStep()) {
			if (isChecked(vm.holdCheckbox())) {
				requiredIndicators.setRequiredFields(
					studentServicesRequiredFieldIds,
					false,
				);

				if (pkg.isAtStep("SSHold")) {
					throw new Error(
						"Uncheck Place form on Hold before approving.",
					);
				}
			} else {
				requiredIndicators.setRequiredFields(
					studentServicesRequiredFieldIds,
					true,
				);
			}
		}

		if (pkg.isAtStep("WFFinal")) {
			requiredIndicators.setRequiredFields(
				finalFinancialServicesRequiredFieldIds,
				true,
			);
		}
	};

	vm.onDecline = function onDecline(form) {
		//  This method is called when the Decline button is clicked and before calling beforeRequired.
		if (pkg.isAtStep("WFFinancialServices")) {
			requiredIndicators.setRequiredFields(
				financialServicesRequiredFieldIds,
				false,
			);
			requiredIndicators.setRequired("noID", true);
		}

		if (isStudentServicesStep()) {
			requiredIndicators.setRequiredFields(
				studentServicesRequiredFieldIds,
				false,
			);
		}

		if (pkg.isAtStep("WFFinal")) {
			requiredIndicators.setRequiredFields(
				finalFinancialServicesRequiredFieldIds,
				false,
			);
		}
	};

	vm.beforeRequired = function beforeRequired(form) {
		//  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.

		formLifecycle.beforeRequired();
		if (!isActingAsAnonymous()) {
			if (!isNoIdSelected()) {
				fieldValidation.requireValidIntegrationSearches(
					"Search for and confirm a valid student before continuing.",
				);
			}
			fieldValidation.requireValidAutocompletes(
				"Please select a valid academic program before continuing.",
			);
		}
		formatMoneyFields();
		fieldValidation.requireValidFields(
			"Please fix invalid field values before continuing.",
		);
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

	function isStudentServicesStep() {
		return pkg.isAtStep("WFStudentServices") || pkg.isAtStep("SSHold");
	}

	function populateTermSelects(inputValues) {
		var terms = formUtils.getIntendedEnrollmentTerms();

		termSelectIds.forEach(function (selectId) {
			var savedValue = inputValues.first(selectId);
			populateTermSelect(selectId, terms, savedValue);
		});
	}

	function populateTermSelect(selectId, terms, savedValue) {
		var select = document.getElementById(selectId);

		if (!select) {
			return;
		}

		clearSelectOptions(select);
		addSelectOption(select, "", "");

		terms.forEach(function (term) {
			addSelectOption(select, term.code, term.title);
		});

		if (
			savedValue &&
			!Array.from(select.options).some(function (option) {
				return option.value === savedValue;
			})
		) {
			addSelectOption(select, savedValue, savedValue);
		}
	}

	function clearSelectOptions(select) {
		while (select.options.length) {
			select.remove(0);
		}
	}

	function addSelectOption(select, value, text) {
		var option = document.createElement("option");

		option.value = value;
		option.text = text;

		select.add(option);
	}

	function loadAcademicPrograms() {
		if (isActingAsAnonymous()) {
			return;
		}

		return integration
			.all("EthosColleagueAcademicPrograms", {})
			.then(function (programs) {
				var activePrograms = (programs || [])
					.filter((program) => program.status === "active")
					.map((program) => ({
						title: program.title,
						code: program.code,
					}))
					.sort((a, b) => a.title.localeCompare(b.title));
				vm.programsDropdown(activePrograms);
			});
	}

	function registerAcademicProgramValidator() {
		if (isActingAsAnonymous()) {
			return;
		}

		fieldValidation.registerAutocompleteValidator({
			fieldId: "academicProgramSearch",
			observable: vm.academicProgramSearch,
			source: function () {
				return vm.programsDropdown();
			},
			matchMask: ["title", " | ", "code"],
			allowBlank: false,
			onValid: function (value, match) {
				setAcademicProgramCode(match.code);
			},
			onInvalid: function () {
				setAcademicProgramCode(undefined);
			},
		});
	}

	function applyWorkflowVisibility() {
		fieldStateUtils.showContainers(workflowSections);
		fieldStateUtils.unlockContainers(workflowSections);

		if (pkg.isAtStep("Start")) {
			fieldStateUtils.hideContainers([
				"financialServicesSection",
				"studentServicesSection",
				"finalFinancialServicesSection",
			]);
		}

		if (pkg.isAtStep("WFFinancialServices")) {
			fieldStateUtils.hideContainers([
				"studentServicesSection",
				"finalFinancialServicesSection",
			]);
			fieldStateUtils.lockContainers([
				"studentInfoSection",
				"applicationDetailsSection",
				"commitmentToParticipateSection",
				"studentSignatureSection",
			]);
		}

		if (isStudentServicesStep()) {
			fieldStateUtils.hideContainers(["finalFinancialServicesSection"]);
			fieldStateUtils.lockContainers([
				"studentInfoSection",
				"applicationDetailsSection",
				"commitmentToParticipateSection",
				"studentSignatureSection",
				"financialServicesSection",
			]);
		}

		if (pkg.isAtStep("WFFinal")) {
			fieldStateUtils.lockContainers([
				"studentInfoSection",
				"applicationDetailsSection",
				"commitmentToParticipateSection",
				"studentSignatureSection",
				"financialServicesSection",
				"studentServicesSection",
			]);
		}
	}

	function isActingAsAnonymous() {
		return (
			user &&
			(user.ActAsAnonymous === true ||
				String(user.ActAsAnonymous || "").toLowerCase() === "true")
		);
	}

	function initFormatValidation() {
		fieldValidation.registerFieldValidator({
			fieldId: "studentIdentifierLastFour",
			observable: vm.studentIdentifierLastFour,
			allowBlank: true,
			transform: getLastFourDigits,
			validate: isValidLastFour,
			message: "Enter the 4-digit SSN or TIN value.",
		});
		fieldValidation.registerFieldValidator({
			fieldId: "studentEmail",
			observable: vm.studentEmail,
			allowBlank: true,
			validate: isValidEmail,
			message: "Enter a valid email address.",
		});
		fieldValidation.registerFieldValidator({
			fieldId: "dateofBirth",
			observable: vm.dateofBirth,
			allowBlank: true,
			validate: isValidDate,
			message: "Enter a valid date.",
		});
		fieldValidation.registerFieldValidator({
			fieldId: "phoneNumber",
			observable: vm.phoneNumber,
			allowBlank: true,
			validate: isValidPhoneNumber,
			message: "Enter phone number as (###) ###-####.",
		});
		fieldValidation.setHint(
			"lastTerm",
			"Format: 20YY/SU, 20YY/WI, or 20YY/FA.",
		);
		fieldValidation.registerFieldValidator({
			fieldId: "lastTerm",
			observable: vm.lastTerm,
			allowBlank: true,
			validate: isValidLastTerm,
			message: "Enter Last Term as 20YY/SU, 20YY/WI, or 20YY/FA.",
		});
		fieldValidation.registerFieldValidator({
			fieldId: "outstandingBalance",
			observable: vm.outstandingBalance,
			allowBlank: true,
			validate: isValidMoney,
			message: "Enter a valid outstanding balance.",
		});
		fieldValidation.registerFieldValidator({
			fieldId: "forgivenAmount",
			observable: vm.forgivenAmount,
			allowBlank: true,
			validate: isValidForgivenAmount,
			message:
				"Forgiven amount cannot be greater than outstanding balance.",
		});

		$("#phoneNumber").mask("(999) 999-9999", {
			autoclear: false,
		});
		initMoneyFormatting();
	}

	function initMoneyFormatting() {
		$("#outstandingBalance").on("blur", function () {
			formatMoneyField("outstandingBalance", vm.outstandingBalance);
			if (getFieldValue("forgivenAmount")) {
				fieldValidation.validateField("forgivenAmount");
			}
		});

		$("#forgivenAmount").on("blur", function () {
			formatMoneyField("forgivenAmount", vm.forgivenAmount);
			fieldValidation.validateField("forgivenAmount");
		});
	}

	function formatMoneyFields() {
		formatMoneyField("outstandingBalance", vm.outstandingBalance);
		formatMoneyField("forgivenAmount", vm.forgivenAmount);
	}

	function formatMoneyField(fieldId, observable) {
		var field = document.getElementById(fieldId);
		var formattedValue;

		if (!field || !String(field.value || "").trim()) {
			return;
		}

		formattedValue = formatMoney(field.value);

		if (!formattedValue) {
			return;
		}

		field.value = formattedValue;

		if (typeof observable === "function") {
			observable(formattedValue);
		}
	}

	function getLastFourDigits(value) {
		return String(value || "")
			.replace(/\D/g, "")
			.substring(0, 4);
	}

	function isValidLastFour(value) {
		return /^\d{4}$/.test(value);
	}

	function isValidEmail(value) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	}

	function isValidDate(value) {
		var match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
		var month;
		var day;
		var year;
		var date;

		if (!match) {
			return false;
		}

		month = Number(match[1]);
		day = Number(match[2]);
		year = Number(match[3]);
		date = new Date(year, month - 1, day);

		return (
			date.getFullYear() === year &&
			date.getMonth() === month - 1 &&
			date.getDate() === day
		);
	}

	function isValidPhoneNumber(value) {
		var digits = String(value || "").replace(/\D/g, "");

		return /^\d{10}$/.test(digits);
	}

	function isValidLastTerm(value) {
		return /^20\d{2}\/(SU|WI|FA)$/.test(
			String(value || "")
				.trim()
				.toUpperCase(),
		);
	}

	function formatMoney(value) {
		var parsedValue = parseMoney(value);

		if (parsedValue === null) {
			return "";
		}

		return formUtils.formatAmountRounded(parsedValue, {
			showDollar: true,
		});
	}

	function isValidMoney(value) {
		return parseMoney(value) !== null;
	}

	function isValidForgivenAmount(value) {
		var forgivenAmount = parseMoney(value);
		var outstandingBalance = parseMoney(
			getFieldValue("outstandingBalance"),
		);

		if (forgivenAmount === null) {
			return "Enter a valid forgiven amount.";
		}

		if (outstandingBalance === null) {
			return true;
		}

		return forgivenAmount <= outstandingBalance;
	}

	function parseMoney(value) {
		var cleanedValue = String(value || "").replace(/[^0-9.-]/g, "");
		var parsedValue;

		if (!cleanedValue || cleanedValue === "-" || cleanedValue === ".") {
			return null;
		}

		parsedValue = Number(cleanedValue);

		return Number.isFinite(parsedValue) ? parsedValue : null;
	}

	function getFieldValue(fieldId) {
		var field = document.getElementById(fieldId);

		return field ? field.value : "";
	}

	function initAcademicYearFromPlannedTerm() {
		if (typeof vm.plannedEnrollmentTerm !== "function") {
			return;
		}

		vm.plannedEnrollmentTerm.subscribe(function (termCode) {
			if (!canUpdateAcademicYearFromPlannedTerm()) {
				return;
			}

			setAcademicYearFromPlannedTerm(termCode);
		});
	}

	function setAcademicYearFromPlannedTerm(termCode) {
		var academicYear = formUtils.getAcademicYearFromTerm(termCode);
		var field = document.getElementById("academicYear");

		if (
			typeof vm.academicYear === "function" &&
			String(vm.academicYear() || "") !== academicYear
		) {
			vm.academicYear(academicYear);
		}

		if (field && field.value !== academicYear) {
			field.value = academicYear;
			$(field).trigger("change");
		}
	}

	function canUpdateAcademicYearFromPlannedTerm() {
		return (
			pkg && typeof pkg.isAtStep === "function" && pkg.isAtStep("WFFinal")
		);
	}

	function setAcademicProgramCode(code) {
		var value = code || "";
		var field = document.getElementById("programCode");

		if (typeof vm.academicProgramCode === "function") {
			vm.academicProgramCode(value);
		}

		if (typeof vm.programCode === "function") {
			vm.programCode(value);
		}

		if (field && field.value !== value) {
			field.value = value;
			$(field).trigger("change");
		}
	}

	function registerStudentLookupValidator() {
		fieldValidation.registerIntegrationSearchValidator({
			fieldId: "lookupStudentIdSearch",
			buttonId: "lookupStudentButton",
			observable: vm.lookupStudentIdSearch,
			integration: integration,
			integrationSource: "Web_Ethos_Get_Persons_by_Colleague_ID",
			getParams: function (value) {
				return {
					personID: value,
				};
			},
			validateInput: function (value) {
				return /^\d{7}$/.test(value) || "Enter a 7-digit Colleague ID.";
			},
			notFoundMessage: "Student not found.",
			onValid: function (value, personResults) {
				vm.lookupStudentNameSearch(
					formUtils.getPreferredName(personResults.names),
				);
				vm.lookupStudentDateOfBirthSearch(
					formatDateMMDDYYYY(personResults.dateOfBirth),
				);
				vm.confirmOrNotFound(undefined);
				vm.studentId(undefined);
			},
			onInvalid: function () {
				clearStudentLookupResults();
			},
			onError: function (error) {
				if (
					window.console &&
					typeof window.console.error === "function"
				) {
					window.console.error("Student lookup failed.", error);
				}
			},
		});
	}

	function clearStudentLookupResults() {
		vm.lookupStudentNameSearch(undefined);
		vm.lookupStudentDateOfBirthSearch(undefined);
		vm.confirmOrNotFound(undefined);
		syncStudentIdFromVerificationSelection();
	}

	function initConfirmationRadioAliases() {
		if (typeof vm.confirmOrNotFound !== "function") {
			return;
		}

		vm.studentVerificationConfirmed = vm.confirmOrNotFound;
		vm.noID = vm.confirmOrNotFound;
	}

	function initStudentVerificationConfirmation() {
		if (typeof vm.confirmOrNotFound !== "function") {
			return;
		}

		vm.confirmOrNotFound.subscribe(function () {
			syncStudentIdFromVerificationSelection();
		});
	}

	function initNoIdSelection() {
		if (typeof vm.confirmOrNotFound !== "function") {
			return;
		}

		vm.confirmOrNotFound.subscribe(function () {
			syncStudentIdFromVerificationSelection();
		});

		syncStudentIdFromVerificationSelection();
	}

	function initStudentLookupClearing() {
		vm.lookupStudentIdSearch.subscribe(function (studentLookupId) {
			if (!String(studentLookupId || "").trim()) {
				clearStudentLookupResults();
			}
		});
	}

	function initStudentVerificationAvailability() {
		vm.lookupStudentNameSearch.subscribe(function () {
			updateStudentVerificationAvailability();
		});
		vm.lookupStudentDateOfBirthSearch.subscribe(function () {
			updateStudentVerificationAvailability();
		});

		updateStudentVerificationAvailability();
	}

	function updateStudentVerificationAvailability() {
		var confirmationField = document.getElementById(
			"studentVerificationConfirmed",
		);
		var hasStudentName = !!String(
			vm.lookupStudentNameSearch() || "",
		).trim();
		var hasDateOfBirth = !!String(
			vm.lookupStudentDateOfBirthSearch() || "",
		).trim();
		var canConfirmStudent = hasStudentName && hasDateOfBirth;

		if (!confirmationField) {
			return;
		}

		confirmationField.disabled = !canConfirmStudent;
		confirmationField.setAttribute(
			"aria-readonly",
			canConfirmStudent ? "false" : "true",
		);

		if (!canConfirmStudent && isStudentConfirmed()) {
			vm.confirmOrNotFound(undefined);
		}
	}

	function syncStudentIdFromVerificationSelection() {
		if (isNoIdSelected()) {
			vm.studentId("No_ID");
		} else if (isStudentConfirmed()) {
			vm.studentId(vm.lookupStudentIdSearch());
		} else {
			vm.studentId(undefined);
		}
	}

	function isNoIdSelected() {
		return (
			typeof vm.confirmOrNotFound === "function" &&
			String(vm.confirmOrNotFound() || "") === "No_ID"
		);
	}

	function isStudentConfirmed() {
		return (
			typeof vm.confirmOrNotFound === "function" &&
			String(vm.confirmOrNotFound() || "") === "confirmed"
		);
	}

	function isChecked(value) {
		if (Array.isArray(value)) {
			return value.length > 0;
		}

		return value === true || String(value || "").toLowerCase() === "yes";
	}

	function formatDateMMDDYYYY(value) {
		var parts = String(value || "").split("-");

		if (parts.length === 3) {
			return parts[1] + "/" + parts[2] + "/" + parts[0];
		}

		return value || "";
	}

	return vm;
});
