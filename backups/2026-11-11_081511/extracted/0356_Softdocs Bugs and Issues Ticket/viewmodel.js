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
		attemptedAction: "Describe what you were trying to do.",
		observedBehavior: "Describe what happened.",
		expectedBehavior: "Describe what you expected to happen.",
	};
	var REQUIRED_RADIO_GROUPS = {
		isBlocking: "Select whether this is preventing you from completing the form.",
		affectedUsers: "Select who is affected.",
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

	function radioOptions(groupName) {
		return Array.from(
			document.querySelectorAll(
				'input[type="radio"][name="' + groupName + '"]',
			),
		);
	}

	function validateRequiredRadioGroup(groupName) {
		var group = document.getElementById(groupName + "Group");
		var error = document.getElementById(groupName + "Error");
		var options = radioOptions(groupName);
		var hasSelection = options.some(function isSelected(option) {
			return option.checked;
		});
		var message = hasSelection ? "" : REQUIRED_RADIO_GROUPS[groupName];

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

		Object.keys(REQUIRED_RADIO_GROUPS).forEach(
			function listenForGroupValidation(groupName) {
				var group = document.getElementById(groupName + "Group");
				var error = document.getElementById(groupName + "Error");

				radioOptions(groupName).forEach(function listenForSelection(option) {
					option.addEventListener("change", function clearStaleError() {
						if (!error.hidden) {
							validateRequiredRadioGroup(groupName);
						}
					});
				});
				group.addEventListener("focusout", function validateOnGroupExit(event) {
					if (!group.contains(event.relatedTarget)) {
						validateRequiredRadioGroup(groupName);
					}
				});
			},
		);

		validationListenersInitialized = true;
	}

	function validateRequiredFields() {
		Object.keys(REQUIRED_MESSAGE_BY_CONTROL).forEach(validateRequiredText);
		Object.keys(REQUIRED_RADIO_GROUPS).forEach(validateRequiredRadioGroup);
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
