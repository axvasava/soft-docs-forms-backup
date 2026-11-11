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
		jobTitle: "Enter your job title.",
		campus: "Select your campus.",
		updateInformation: "Select what you want to update.",
		streetAddress: "Enter your street address.",
		city: "Enter your city.",
		state: "Select your state.",
		zip: "Enter your ZIP code.",
		emailAddress: "Enter your email address.",
		emergencyContactPerson: "Enter your emergency contact's name.",
		emergencyPhoneNumber: "Enter a phone number.",
		newName: "Enter your new legal name.",
		quickDropdownElement: "Select a pronoun.",
	};
	var startStateSubscriptions = [];
	var validationListenersInitialized = false;
	var phoneRepeaterInitialized = false;
	var phoneValidationListenersInitialized = false;
	var exportModeActive = false;
	var INTEGRATION_COMPLETION_DELAY_MS = 1000;
	var REVIEWER_CATEGORY_CONFIG = [
		{
			observableName: "homeAddressUpdateCheck",
			summaryItemId: "requestSummaryHomeAddress",
		},
		{
			observableName: "emailAddressCheck",
			summaryItemId: "requestSummaryEmailAddress",
		},
		{
			observableName: "personalPhoneNumberCheck",
			summaryItemId: "requestSummaryPhoneNumbers",
		},
		{
			observableName: "emergencyContactCheck",
			summaryItemId: "requestSummaryEmergencyContact",
		},
	];
	var PHONE_FIELD_CONFIG = {
		number: {
			id: "newPhoneNumber",
			name: "newPhoneNumber",
			errorId: "newPhoneNumberError",
		},
		extension: {
			id: "extension",
			name: "extension",
		},
		type: {
			id: "phoneType",
			name: "phoneType",
			errorId: "phoneTypeError",
		},
	};

	vm.addObservableArray("phoneNumbers");
	vm.phoneNumbers([]);

	function createOption(option) {
		var element = document.createElement("option");

		element.value = option.value;
		element.textContent = option.label;

		return element;
	}

	function populateStateOptions() {
		var stateSelect = document.getElementById("state");
		var selectedValue = stateSelect.value;

		stateSelect.textContent = "";
		stateSelect.appendChild(
			createOption({ value: "", label: "Choose a state" }),
		);
		occFramework.options.states.forEach(function appendStateOption(option) {
			stateSelect.appendChild(createOption(option));
		});
		stateSelect.value = selectedValue;
	}

	function populateCampusOptions() {
		var campusSelect = document.getElementById("campus");
		var selectedValue = campusSelect.value;

		campusSelect.textContent = "";
		campusSelect.appendChild(
			createOption({ value: "", label: "Choose a campus" }),
		);
		occFramework.options.campuses.withCollegeWide.forEach(
			function appendCampusOption(option) {
				campusSelect.appendChild(createOption(option));
			},
		);
		campusSelect.value = selectedValue;
	}

	function controlValue(control) {
		return String(control.value || "").trim();
	}

	function normalizeHomeAddressCity() {
		var control = document.getElementById("city");
		var city = controlValue(control).toLowerCase();
		var normalizedCity;

		if (city !== "detroit" && city !== "pontiac") {
			return;
		}

		normalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
		vm.city(normalizedCity);
		control.value = normalizedCity;
	}

	function phoneIsValid(value) {
		return (String(value).match(/\d/g) || []).length === 10;
	}

	function validationMessage(control) {
		var value = controlValue(control);

		if (!control.required) {
			return "";
		}

		if (!value) {
			return REQUIRED_MESSAGE_BY_CONTROL[control.id];
		}

		if (control.id === "zip" && !/^\d{5}(-\d{4})?$/.test(value)) {
			return "Enter a valid ZIP code.";
		}

		if (control.id === "emailAddress" && control.validity.typeMismatch) {
			return "Enter a valid email address.";
		}

		if (control.id === "emergencyPhoneNumber" && !phoneIsValid(value)) {
			return "Enter a valid phone number.";
		}

		return "";
	}

	function synchronizeValidationError(control, message, suppliedError) {
		var error =
			suppliedError || document.getElementById(control.id + "Error");
		var activeMessage = control.willValidate ? message : "";

		control.setCustomValidity(activeMessage);
		error.hidden = !activeMessage;

		if (activeMessage) {
			error.textContent = activeMessage;
			control.setAttribute("aria-invalid", "true");
		} else {
			control.removeAttribute("aria-invalid");
		}
	}

	function validateControl(controlId) {
		var control = document.getElementById(controlId);
		var message = validationMessage(control);

		synchronizeValidationError(control, message);

		return !message;
	}

	function clearContainerValidation(container) {
		container
			.querySelectorAll("input, select, textarea")
			.forEach(function clearControlValidation(control) {
				control.setCustomValidity("");
				control.removeAttribute("aria-invalid");
			});
		container
			.querySelectorAll(".occ-error")
			.forEach(function hideInlineError(error) {
				error.hidden = true;
			});
	}

	function phoneRows() {
		return Array.from(
			document
				.getElementById("phoneNumberRows")
				.querySelectorAll("[data-occ-repeating-group-row]"),
		);
	}

	function setPhoneRowPosition(row, index) {
		var suffix = index === 0 ? "" : "-" + index;
		var heading = row.querySelector("[data-phone-row-heading]");

		heading.id = "phone-row-heading" + suffix;
		row.setAttribute("aria-labelledby", heading.id);

		Object.keys(PHONE_FIELD_CONFIG).forEach(
			function positionPhoneField(fieldName) {
				var config = PHONE_FIELD_CONFIG[fieldName];
				var control = row.querySelector(
					'[data-phone-field="' + fieldName + '"]',
				);
				var label = row.querySelector(
					'[data-phone-label="' + fieldName + '"]',
				);

				control.id = config.id + suffix;
				control.name = config.name;
				label.htmlFor = control.id;

				if (config.errorId) {
					var error = row.querySelector(
						'[data-phone-error="' + fieldName + '"]',
					);

					error.id = config.errorId + suffix;
					control.setAttribute("aria-describedby", error.id);
				}
			},
		);
	}

	function phoneRowRequiredFields(row) {
		return ["number", "type"].map(function findPhoneField(fieldName) {
			return row
				.querySelector('[data-phone-field="' + fieldName + '"]')
				.closest(".occ-field");
		});
	}

	function setPhoneRowRequired(row, required) {
		occFramework.fields.required(phoneRowRequiredFields(row), required);
	}

	function setPhoneRowsRequired(required) {
		phoneRows().forEach(function setCurrentPhoneRowRequired(row) {
			setPhoneRowRequired(row, required);
		});
	}

	function emptyPhoneNumber() {
		return {
			number: "",
			extension: "",
			type: "",
		};
	}

	function normalizedPhoneNumber(phone) {
		return Object.keys(PHONE_FIELD_CONFIG).reduce(
			function normalizePhoneField(normalized, property) {
				normalized[property] = String(
					(phone && phone[property]) || "",
				);
				return normalized;
			},
			{},
		);
	}

	function readInitialPhoneNumber() {
		var row = phoneRows()[0];

		return Object.keys(PHONE_FIELD_CONFIG).reduce(
			function readPhoneField(phone, property) {
				phone[property] = row.querySelector(
					'[data-phone-field="' + property + '"]',
				).value;
				return phone;
			},
			{},
		);
	}

	function savedPhoneNumbers() {
		var data = vm.phoneNumbersData();
		var parsed;

		if (!data) {
			return null;
		}

		try {
			parsed = JSON.parse(data);
		} catch (error) {
			return null;
		}

		return Array.isArray(parsed)
			? parsed.map(normalizedPhoneNumber)
			: null;
	}

	function syncPhoneNumbersData() {
		vm.phoneNumbersData(JSON.stringify(vm.phoneNumbers()));
	}

	function bindPhoneRowControl(control, phone, property) {
		function updatePhoneRow() {
			phone[property] = control.value;
			vm.phoneNumbers.valueHasMutated();
			syncPhoneNumbersData();
		}

		control.addEventListener("input", updatePhoneRow);
		control.addEventListener("change", updatePhoneRow);
	}

	function configurePhoneRow(row, phone, index) {
		setPhoneRowPosition(row, index);

		Object.keys(PHONE_FIELD_CONFIG).forEach(
			function configurePhoneField(property) {
				var control = row.querySelector(
					'[data-phone-field="' + property + '"]',
				);

				control.value = phone[property];
				bindPhoneRowControl(control, phone, property);
			},
		);
	}

	function renderPhoneRow(phone, index) {
		var root = document.getElementById("phoneNumberRows");
		var template = root.querySelector(
			"[data-occ-repeating-group-template]",
		);
		var list = root.querySelector("[data-occ-repeating-group-list]");
		var row = template.content.firstElementChild.cloneNode(true);

		configurePhoneRow(row, phone, index);
		list.appendChild(row);
	}

	function renumberPhoneRows() {
		phoneRows().forEach(function renumberPhoneRow(row, index) {
			setPhoneRowPosition(row, index);
		});
	}

	function addPhoneRow(row, index) {
		var phone = emptyPhoneNumber();

		vm.phoneNumbers.push(phone);
		configurePhoneRow(row, phone, index);
		setPhoneRowRequired(
			row,
			!document.getElementById("phoneNumbersSubsection").hidden,
		);
		syncPhoneNumbersData();
	}

	function removePhoneRow(row, index) {
		vm.phoneNumbers.splice(index, 1);
		renumberPhoneRows();
		syncPhoneNumbersData();
	}

	function initializePhoneRepeater() {
		var root = document.getElementById("phoneNumberRows");
		var initialRow = phoneRows()[0];
		var restoredPhones;
		var phones;

		if (phoneRepeaterInitialized) {
			return;
		}

		restoredPhones = savedPhoneNumbers();
		phones =
			restoredPhones === null
				? [readInitialPhoneNumber()]
				: restoredPhones;
		vm.phoneNumbers(phones);

		if (phones.length === 0) {
			initialRow.remove();
		} else {
			configurePhoneRow(initialRow, phones[0], 0);
			phones.slice(1).forEach(function restorePhoneRow(phone, offset) {
				renderPhoneRow(phone, offset + 1);
			});
		}

		occFramework.repeatingGroups.create(root, {
			minRows: 1,
			maxRows: 3,
			onAdd: addPhoneRow,
			onRemove: removePhoneRow,
		});
		phoneRepeaterInitialized = true;
	}

	function phoneValidationMessage(control) {
		var value = controlValue(control);
		var fieldName = control.dataset.phoneField;

		if (!control.required) {
			return "";
		}

		if (!value) {
			return fieldName === "number"
				? "Enter a phone number."
				: "Select a phone type.";
		}

		if (fieldName === "number" && !phoneIsValid(value)) {
			return "Enter a valid phone number.";
		}

		return "";
	}

	function validatePhoneControl(control) {
		var fieldName = control.dataset.phoneField;
		var error = control
			.closest("[data-occ-repeating-group-row]")
			.querySelector('[data-phone-error="' + fieldName + '"]');
		var message = phoneValidationMessage(control);

		synchronizeValidationError(control, message, error);

		return !message;
	}

	function phoneValidationControl(target) {
		return target.matches(
			'[data-phone-field="number"], [data-phone-field="type"]',
		)
			? target
			: null;
	}

	function initializePhoneValidationListeners() {
		var root = document.getElementById("phoneNumberRows");

		if (phoneValidationListenersInitialized) {
			return;
		}

		root.addEventListener(
			"focusout",
			function validatePhoneOnFocusout(event) {
				var control = phoneValidationControl(event.target);

				if (control) {
					validatePhoneControl(control);
				}
			},
		);
		["input", "change"].forEach(
			function listenForPhoneCorrection(eventName) {
				root.addEventListener(
					eventName,
					function updatePhoneError(event) {
						var control = phoneValidationControl(event.target);

						if (!control) {
							return;
						}

						var fieldName = control.dataset.phoneField;
						var error = control
							.closest("[data-occ-repeating-group-row]")
							.querySelector(
								'[data-phone-error="' + fieldName + '"]',
							);

						if (!error.hidden) {
							validatePhoneControl(control);
						}
					},
				);
			},
		);
		phoneValidationListenersInitialized = true;
	}

	function validateActivePhoneRows() {
		var allValid = true;

		phoneRows().forEach(function validatePhoneRow(row) {
			row.querySelectorAll(
				'[data-phone-field="number"], [data-phone-field="type"]',
			).forEach(function validateRequiredPhoneControl(control) {
				if (control.required && !validatePhoneControl(control)) {
					allValid = false;
				}
			});
		});

		return allValid;
	}

	function fieldsFor(controlIds) {
		return controlIds.map(function findField(controlId) {
			return document.getElementById(controlId).closest(".occ-field");
		});
	}

	function setRequired(controlIds, required) {
		occFramework.fields.required(fieldsFor(controlIds), required);
	}

	function setSubsectionState(subsectionId, active, requiredControlIds) {
		var subsection = document.getElementById(subsectionId);

		subsection.hidden = !active;
		if (requiredControlIds.length) {
			setRequired(requiredControlIds, active);
		}

		if (!active) {
			clearContainerValidation(subsection);
		}
	}

	function setPathState(sectionId, active, requiredControlIds) {
		var section = document.getElementById(sectionId);

		if (active) {
			occFramework.fields.show(section);
		} else {
			occFramework.fields.hide(section);
		}

		if (requiredControlIds.length) {
			setRequired(requiredControlIds, active);
		}

		if (!active) {
			clearContainerValidation(section);
		}
	}

	function applyStartState() {
		var updateInformation;
		var contactInformationIsActive;
		var legalNameChangeIsActive;

		if (!pkg.isAtStep("Start")) {
			return;
		}

		updateInformation = vm.updateInformation();
		contactInformationIsActive =
			updateInformation === "Contact Information";
		legalNameChangeIsActive = updateInformation === "Legal Name Change";

		setPathState(
			"contactInformationSection",
			contactInformationIsActive,
			[],
		);
		setPathState("legalNameChangeSection", legalNameChangeIsActive, [
			"newName",
			"quickDropdownElement",
		]);
		setSubsectionState(
			"homeAddressSubsection",
			contactInformationIsActive && Boolean(vm.homeAddressUpdateCheck()),
			["streetAddress", "city", "state", "zip"],
		);
		setSubsectionState(
			"emailAddressSubsection",
			contactInformationIsActive && Boolean(vm.emailAddressCheck()),
			["emailAddress"],
		);
		setSubsectionState(
			"phoneNumbersSubsection",
			contactInformationIsActive &&
				Boolean(vm.personalPhoneNumberCheck()),
			[],
		);
		setPhoneRowsRequired(
			contactInformationIsActive &&
				Boolean(vm.personalPhoneNumberCheck()),
		);
		setSubsectionState(
			"emergencyContactSubsection",
			contactInformationIsActive && Boolean(vm.emergencyContactCheck()),
			["emergencyContactPerson", "emergencyPhoneNumber"],
		);
	}

	function isAtReviewerStep() {
		return (
			pkg.isAtStep("HRWFPartTimeHourlyReviewers") ||
			pkg.isAtStep("HRWFFullTimeReviewers")
		);
	}

	function reviewerDisplayValue(value) {
		var normalizedValue = String(value || "").trim();

		return normalizedValue || "Not provided";
	}

	function populateReviewerSummary(updateInformation) {
		var contactInformationIsActive =
			updateInformation === "Contact Information";
		var legalNameChangeIsActive = updateInformation === "Legal Name Change";
		var updateType = "Not provided";

		if (contactInformationIsActive) {
			updateType = "Contact information";
		} else if (legalNameChangeIsActive) {
			updateType = "Legal name";
		}

		document.getElementById("requestSummaryUpdateType").textContent =
			updateType;
		document.getElementById("requestSummaryChangesItem").hidden =
			!contactInformationIsActive;
		document.getElementById("requestSummaryNameItem").hidden =
			!legalNameChangeIsActive;
		document.getElementById("requestSummaryInstructions").hidden =
			!legalNameChangeIsActive;

		REVIEWER_CATEGORY_CONFIG.forEach(
			function updateReviewerCategory(category) {
				document.getElementById(category.summaryItemId).hidden =
					!Boolean(vm[category.observableName]());
			},
		);

		if (legalNameChangeIsActive) {
			document.getElementById("requestSummaryNameChange").textContent =
				reviewerDisplayValue(vm.formerName()) +
				" to " +
				reviewerDisplayValue(vm.newName());
		}
	}

	function setReadOnlySubsectionState(subsectionId, active) {
		document.getElementById(subsectionId).hidden = !active;
	}

	function hideReadOnlyActionsAndCallouts() {
		document
			.querySelectorAll(
				"[data-phone-add-action], [data-phone-remove-action], " +
					"[data-reviewer-attachment-callout]",
			)
			.forEach(function hideReadOnlyContent(element) {
				element.hidden = true;
			});
	}

	function applyReadOnlyRequestState() {
		var updateInformation;
		var contactInformationIsActive;
		var legalNameChangeIsActive;
		var phoneNumbersAreActive;
		var submittedSections;

		updateInformation = vm.updateInformation();
		contactInformationIsActive =
			updateInformation === "Contact Information";
		legalNameChangeIsActive = updateInformation === "Legal Name Change";
		phoneNumbersAreActive =
			contactInformationIsActive &&
			Boolean(vm.personalPhoneNumberCheck());
		submittedSections = [
			document.getElementById("yourInformationSection"),
			document.getElementById("updateSelectionSection"),
			document.getElementById("contactInformationSection"),
			document.getElementById("legalNameChangeSection"),
		];

		occFramework.fields.show(submittedSections[0]);
		occFramework.fields.hide(submittedSections[1]);
		if (contactInformationIsActive) {
			occFramework.fields.show(submittedSections[2]);
		} else {
			occFramework.fields.hide(submittedSections[2]);
		}
		if (legalNameChangeIsActive) {
			occFramework.fields.show(submittedSections[3]);
		} else {
			occFramework.fields.hide(submittedSections[3]);
		}
		document.getElementById("contactInformationChoices").hidden = true;

		setReadOnlySubsectionState(
			"homeAddressSubsection",
			contactInformationIsActive && Boolean(vm.homeAddressUpdateCheck()),
		);
		setReadOnlySubsectionState(
			"emailAddressSubsection",
			contactInformationIsActive && Boolean(vm.emailAddressCheck()),
		);
		setReadOnlySubsectionState(
			"phoneNumbersSubsection",
			phoneNumbersAreActive,
		);
		setReadOnlySubsectionState(
			"emergencyContactSubsection",
			contactInformationIsActive && Boolean(vm.emergencyContactCheck()),
		);

		if (phoneNumbersAreActive) {
			initializePhoneRepeater();
		}

		occFramework.fields.required(submittedSections, false);
		occFramework.fields.readonly(submittedSections, true);
		submittedSections.forEach(clearContainerValidation);
		hideReadOnlyActionsAndCallouts();
	}

	function applyReviewerState() {
		if (!isAtReviewerStep()) {
			return;
		}

		applyReadOnlyRequestState();
		occFramework.fields.show(document.getElementById("officeUseSection"));
		populateReviewerSummary(vm.updateInformation());
	}

	function applyExportState() {
		applyReadOnlyRequestState();
		occFramework.fields.hide(document.getElementById("officeUseSection"));
	}

	function initializeStartStateSubscriptions() {
		if (startStateSubscriptions.length) {
			return;
		}

		[
			"updateInformation",
			"homeAddressUpdateCheck",
			"emailAddressCheck",
			"personalPhoneNumberCheck",
			"emergencyContactCheck",
		].forEach(function subscribeToStartState(observableName) {
			startStateSubscriptions.push(
				vm[observableName].subscribe(applyStartState),
			);
		});
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
						if (controlId === "city") {
							normalizeHomeAddressCity();
						}
						validateControl(controlId);
					},
				);
				["input", "change"].forEach(
					function listenForCorrection(eventName) {
						control.addEventListener(
							eventName,
							function updateVisibleValidationError() {
								if (controlId === "city" && eventName === "change") {
									normalizeHomeAddressCity();
								}
								if (!error.hidden) {
									validateControl(controlId);
								}
							},
						);
					},
				);
			},
		);

		validationListenersInitialized = true;
	}

	function validateActiveFields() {
		var allValid = true;

		Object.keys(REQUIRED_MESSAGE_BY_CONTROL).forEach(
			function validateRequiredControl(controlId) {
				var control = document.getElementById(controlId);

				if (control.required && !validateControl(controlId)) {
					allValid = false;
				}
			},
		);

		return allValid;
	}

	function optionalText(value) {
		return typeof value === "string" ? value.trim() : "";
	}

	function formatDateOfBirth(value) {
		var match = optionalText(value).match(
			/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:T.*)?$/,
		);

		return match ? match[2] + "/" + match[3] + "/" + match[1] : "";
	}

	function formatTeamDynamixBirthDate(value) {
		var match = optionalText(value).match(
			/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(\d{4})$/,
		);

		return match ? match[3] + "-" + match[1] + "-" + match[2] : "";
	}

	function getTodayDateValue() {
		var today = new Date();
		var month = String(today.getMonth() + 1).padStart(2, "0");
		var day = String(today.getDate()).padStart(2, "0");

		return today.getFullYear() + "-" + month + "-" + day;
	}

	function delayIntegrationCompletion(result) {
		return new Promise(function resolveAfterDelay(resolve) {
			setTimeout(function finishDelay() {
				resolve(result);
			}, INTEGRATION_COMPLETION_DELAY_MS);
		});
	}

	function mapEmployee(employeeData) {
		var name =
			employeeData &&
			Array.isArray(employeeData.names) &&
			employeeData.names.length
				? employeeData.names[0]
				: null;
		var middleName =
			name && typeof name.middleName === "string"
				? name.middleName.trim()
				: "";

		return {
			dateOfBirth: formatDateOfBirth(
				employeeData && employeeData.dateOfBirth,
			),
			firstName: optionalText(name && name.firstName),
			middleInitial: middleName ? middleName.charAt(0) + "." : "",
			lastName: optionalText(name && name.lastName),
			personGuid: optionalText(employeeData && employeeData.id),
		};
	}

	function populateEmployeeNames(employee) {
		vm.employeeDateOfBirth(employee.dateOfBirth);
		vm.employeeFirstName(employee.firstName);
		vm.employeeMiddleInitial(employee.middleInitial);
		vm.employeeLastName(employee.lastName);
		vm.formerName(
			[
				vm.employeeFirstName(),
				vm.employeeMiddleInitial(),
				vm.employeeLastName(),
			]
				.map(optionalText)
				.filter(Boolean)
				.join(" "),
		);
	}

	function setEmployeeFieldReadonly(controlId, readonly) {
		var field = document.getElementById(controlId).closest(".occ-field");

		occFramework.fields.readonly(field, readonly);
	}

	function setEmployeeFieldFallback(controlId, fallback) {
		setEmployeeFieldReadonly(controlId, !fallback);
		setRequired([controlId], fallback);

		if (!fallback) {
			synchronizeValidationError(document.getElementById(controlId), "");
		}
	}

	function enableManualJobAndCampus() {
		setEmployeeFieldFallback("jobTitle", true);
		setEmployeeFieldFallback("campus", true);
	}

	function campusOptionValue(value) {
		var normalizedValue = optionalText(value)
			.toLowerCase()
			.replace(/campus/g, "")
			.replace(/[^a-z0-9]/g, "");
		var campusOption = occFramework.options.campuses.withCollegeWide.find(
			function findCampusOption(option) {
				var normalizedLabel = option.label
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "");

				return (
					option.value.toLowerCase() === normalizedValue ||
					normalizedLabel === normalizedValue
				);
			},
		);

		return campusOption ? campusOption.value : "";
	}

	function populatePayClassCode(payClassGuid) {
		if (!payClassGuid) {
			vm.payClassCode("");
			return Promise.resolve();
		}

		return integration
			.first("Web_Ethos_Get_Pay_Class_by_Pay_Class_GUID", {
				payClassGUID: payClassGuid,
			})
			.then(function assignPayClassCode(payClass) {
				vm.payClassCode(optionalText(payClass && payClass.code));
			})
			.catch(function reportPayClassFailure(error) {
				vm.payClassCode("");
				console.error("Unable to populate employee pay class.", error);
			});
	}

	function populatePositionAndCampus(positionGuid) {
		if (!positionGuid) {
			enableManualJobAndCampus();
			return Promise.resolve();
		}

		return integration
			.first("Web_Ethos_Get_institution_positions_by_Position_GUID", {
				positionGUID: positionGuid,
			})
			.then(function loadCampus(position) {
				var jobTitle = optionalText(position && position.title);
				var campusGuid = optionalText(
					position && position.campus && position.campus.id,
				);

				if (!position) {
					enableManualJobAndCampus();
					return undefined;
				}

				if (jobTitle) {
					vm.jobTitle(jobTitle);
					setEmployeeFieldFallback("jobTitle", false);
				} else {
					setEmployeeFieldFallback("jobTitle", true);
				}

				if (!campusGuid) {
					setEmployeeFieldFallback("campus", true);
					return undefined;
				}

				return integration
					.first("Web_Ethos_Get_Campus_Sites_by_GUID", {
						campusGUID: campusGuid,
					})
					.then(function assignPositionAndCampus(campus) {
						var campusValue = campusOptionValue(
							campus && campus.title,
						);

						if (campusValue) {
							vm.campus(campusValue);
							setEmployeeFieldFallback("campus", false);
						} else {
							setEmployeeFieldFallback("campus", true);
						}
					})
					.catch(function reportCampusFailure(error) {
						setEmployeeFieldFallback("campus", true);
						console.error(
							"Unable to populate employee campus.",
							error,
						);
					});
			})
			.catch(function reportPositionFailure(error) {
				enableManualJobAndCampus();
				console.error("Unable to populate employee position.", error);
			});
	}

	function populateInstitutionJob(personGuid) {
		vm.payClassCode("");

		if (!personGuid) {
			enableManualJobAndCampus();
			return Promise.resolve();
		}

		return integration
			.first("Web_Ethos_Get_institution_jobs_by_Person_GUID", {
				// TEMP: Use test person during form development. Remove before production.
				// personGUID: "6639d624-c71c-4c24-8f9a-74a7169967ff",
				personGUID: personGuid,
			})
			.then(function populateJobDetails(institutionJobs) {
				var payClassGuid = optionalText(
					institutionJobs &&
						institutionJobs.payClass &&
						institutionJobs.payClass.id,
				);
				var positionGuid = optionalText(
					institutionJobs &&
						institutionJobs.position &&
						institutionJobs.position.id,
				);

				if (!institutionJobs) {
					enableManualJobAndCampus();
					return undefined;
				}

				return Promise.all([
					populatePayClassCode(payClassGuid),
					populatePositionAndCampus(positionGuid),
				]);
			})
			.catch(function reportInstitutionJobFailure(error) {
				vm.payClassCode("");
				enableManualJobAndCampus();
				console.error(
					"Unable to populate employee institution job.",
					error,
				);
			});
	}

	function populateEmployeeInformation() {
		return integration
			.first("EthosColleagueEmployeeByErpId", {})
			.then(function loadInstitutionJob(employeeData) {
				var employee = mapEmployee(employeeData);

				populateEmployeeNames(employee);

				return populateInstitutionJob(employee.personGuid);
			});
	}

	vm.onLoad = function onLoad(source, inputValues) {
		console.log("inputValues:", inputValues);
		populateStateOptions();
		populateCampusOptions();
	};

	vm.setDefaults = function setDefaults(source, inputValues) {
		if (!user.isInLibrary) {
			return undefined;
		}

		return populateEmployeeInformation().catch(
			function reportEmployeeInformationFailure(error) {
				console.error(
					"Unable to populate employee information.",
					error,
				);
				throw error;
			},
		);
	};

	vm.afterLoad = function afterLoad() {
		initializePhoneRepeater();
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		exportModeActive = occFramework.exportMode.set(
			document,
			pkg && pkg.isExporting,
		);

		if (exportModeActive) {
			applyExportState();
			return;
		}

		if (isAtReviewerStep()) {
			applyReviewerState();
			return;
		}

		if (!pkg.isAtStep("Start")) {
			return;
		}

		initializePhoneRepeater();
		initializeValidationListeners();
		initializePhoneValidationListeners();
		initializeStartStateSubscriptions();
		applyStartState();
	};

	vm.onSubmit = function onSubmit(form) {
		syncPhoneNumbersData();
	};

	vm.onApprove = function onApprove(form) {
		var sourceParameters;

		if (
			exportModeActive ||
			!isAtReviewerStep() ||
			vm.updateInformation() !== "Legal Name Change"
		) {
			return undefined;
		}

		sourceParameters = {
			username: occFramework.usernameLocalPart(user.UserName),
			birthDate: formatTeamDynamixBirthDate(vm.employeeDateOfBirth()),
			newName: optionalText(vm.newName()),
			oldName: optionalText(vm.formerName()),
			effectiveDate: getTodayDateValue(),
		};

		if (!optionalText(sourceParameters.username)) {
			throw new Error(
				"The name change request cannot be submitted because the reviewer username is unavailable.",
			);
		}

		if (!sourceParameters.birthDate) {
			throw new Error(
				"The name change request cannot be submitted because the employee birth date is unavailable.",
			);
		}

		if (!sourceParameters.newName) {
			throw new Error(
				"The name change request cannot be submitted because the new legal name is unavailable.",
			);
		}

		if (!sourceParameters.oldName) {
			throw new Error(
				"The name change request cannot be submitted because the current legal name is unavailable.",
			);
		}

		if (!sourceParameters.effectiveDate) {
			throw new Error(
				"The name change request cannot be submitted because the effective date is unavailable.",
			);
		}

		return integration
			.add("Team_Dynamix_Staff_Name_Change", sourceParameters)
			.then(function inspectTeamDynamixResult(result) {
				if (result && result.ticketNumber != null) {
					vm.ticketNumber(result.ticketNumber);
				}

				return delayIntegrationCompletion(result);
			})
			.catch(function handleTeamDynamixFailure(error) {
				notify(
					"error",
					"We could not submit the name change request. Try again.",
					"Integration Error",
				);

				throw error;
			});
	};

	vm.beforeRequired = function beforeRequired(form) {
		if (exportModeActive || !pkg.isAtStep("Start")) {
			return;
		}

		normalizeHomeAddressCity();
		applyStartState();
		validateActiveFields();
		validateActivePhoneRows();
	};

	vm.afterRequired = function afterRequired(form) {
		var updateInformation;
		var attachmentCount;

		if (exportModeActive || !pkg.isAtStep("Start")) {
			return;
		}

		updateInformation = vm.updateInformation();
		attachmentCount = Number(form && form.attachmentCount) || 0;

		if (
			updateInformation === "Contact Information" &&
			Boolean(vm.homeAddressUpdateCheck()) &&
			attachmentCount < 1
		) {
			throw new Error(
				"Attach proof of residency before submitting this form.",
			);
		}

		if (updateInformation === "Legal Name Change" && attachmentCount < 1) {
			throw new Error(
				"Attach a copy of your Social Security card before submitting this form.",
			);
		}
	};

	return vm;
});
