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
		requestName: "Enter a form or request name.",
		processDescription: "Describe what this process does.",
		formAudience: "Describe who completes the form.",
		postSubmissionProcess: "Describe what happens after submission.",
		currentProcessDescription: "Describe how the current process works.",
	};
	var validationListenersInitialized = false;
	var currentProcessInitialized = false;

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

	function currentProcessOptions() {
		return Array.from(
			document.querySelectorAll("[data-current-process-option]"),
		);
	}

	function selectedCurrentProcessValues() {
		return currentProcessOptions()
			.filter(function isSelected(option) {
				return option.checked;
			})
			.map(function optionValue(option) {
				return option.value;
			});
	}

	function synchronizeCurrentProcessValue() {
		var selectedValues = selectedCurrentProcessValues();
		var savedValue = occFramework.utils.combineValues(
			selectedValues.map(function valueRow(value) {
				return [value];
			}),
		);

		vm.currentProcess(savedValue);
	}

	function validateCurrentProcess() {
		var group = document.getElementById("currentProcessGroup");
		var error = document.getElementById("currentProcessError");
		var options = currentProcessOptions();
		var message = selectedCurrentProcessValues().length
			? ""
			: "Select how this is handled today.";

		error.hidden = !message;

		options.forEach(function updateOptionState(option) {
			option.setCustomValidity(message);

			if (message) {
				option.setAttribute("aria-invalid", "true");
			} else {
				option.removeAttribute("aria-invalid");
			}
		});

		if (message) {
			group.setAttribute("aria-invalid", "true");
		} else {
			group.removeAttribute("aria-invalid");
		}
	}

	function initializeCurrentProcess() {
		if (currentProcessInitialized) {
			return;
		}

		currentProcessOptions().forEach(function listenForSelection(option) {
			option.addEventListener("change", function handleSelectionChange() {
				synchronizeCurrentProcessValue();

				if (!document.getElementById("currentProcessError").hidden) {
					validateCurrentProcess();
				}
			});
		});
		currentProcessInitialized = true;
	}

	function initializeValidationListeners() {
		if (validationListenersInitialized) {
			return;
		}

		Object.keys(REQUIRED_MESSAGE_BY_CONTROL).forEach(
			function listenForFieldValidation(controlId) {
				var control = document.getElementById(controlId);
				var error = document.getElementById(controlId + "Error");

				control.addEventListener(
					"focusout",
					function validateOnFocusout() {
						validateRequiredText(controlId);
					},
				);
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
		validateCurrentProcess();
	}

	vm.onLoad = function onLoad(source, inputValues) {};

	vm.setDefaults = function setDefaults(source, inputValues) {};

	vm.afterLoad = function afterLoad() {
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg && pkg.isExporting);
		initializeCurrentProcess();
		initializeValidationListeners();
	};

	vm.onSubmit = function onSubmit(form) {};

	vm.onApprove = function onApprove(form) {};

	vm.onDecline = function onDecline(form) {};

	vm.beforeRequired = function beforeRequired(form) {
		synchronizeCurrentProcessValue();
		validateRequiredFields();
	};

	vm.afterRequired = function afterRequired(form) {};

	vm.onOptOut = function onOptOut(form) {};

	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
