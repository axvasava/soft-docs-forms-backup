define([
	"jquery",
	"knockout",
	"vmBase",
	"integration",
	"notify",
	"user",
	"package",
	"https://webapps.oaklandcc.edu/cdn/occ-framework/occFramework.js",
	"https://softdocscdn.etrieve.cloud/extenders/extenders.min.js",
], function viewmodel($, ko, vm, integration, notify, user, pkg, occFramework) {
	"use strict";

	var REQUIRED_MESSAGE_BY_CONTROL = {
		formIdentifier: "Enter the form name or number.",
		requestedImprovement: "Describe what you would like to change or improve.",
		problemToSolve: "Describe the problem this would solve.",
		currentProcess: "Describe how this is handled today.",
		beneficiaries: "Describe who would benefit from this change.",
	};
	var validationListenersInitialized = false;

	function synchronizeValidationError(control, error, message) {
		var activeMessage = control.willValidate ? message : "";

		control.setCustomValidity(activeMessage);
		error.hidden = !activeMessage;

		if (activeMessage) {
			control.setAttribute("aria-invalid", "true");
		} else {
			control.removeAttribute("aria-invalid");
		}
	}

	function validateRequiredText(controlId) {
		var control = document.getElementById(controlId);
		var error = document.getElementById(controlId + "Error");
		var message = control.value.trim()
			? ""
			: REQUIRED_MESSAGE_BY_CONTROL[controlId];

		synchronizeValidationError(control, error, message);
	}

	function initializeValidationListeners() {
		if (validationListenersInitialized) {
			return;
		}

		Object.keys(REQUIRED_MESSAGE_BY_CONTROL).forEach(
			function listenForFieldValidation(controlId) {
				var control = document.getElementById(controlId);
				var error = document.getElementById(controlId + "Error");

				control.addEventListener("focusout", function validateOnFocusout() {
					validateRequiredText(controlId);
				});
				control.addEventListener("input", function clearStaleError() {
					if (!error.hidden) {
						validateRequiredText(controlId);
					}
				});
			},
		);
		validationListenersInitialized = true;
	}

	function validateRequiredFields() {
		Object.keys(REQUIRED_MESSAGE_BY_CONTROL).forEach(validateRequiredText);
	}

	vm.onLoad = function onLoad(source, inputValues) {};

	vm.setDefaults = function setDefaults(source, inputValues) {};

	vm.afterLoad = function afterLoad() {
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg && pkg.isExporting);
		initializeValidationListeners();
	};

	vm.onSubmit = function onSubmit(form) {};

	vm.onApprove = function onApprove(form) {};

	vm.onDecline = function onDecline(form) {};

	vm.beforeRequired = function beforeRequired(form) {
		validateRequiredFields();
	};

	vm.afterRequired = function afterRequired(form) {};

	vm.onOptOut = function onOptOut(form) {};

	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
