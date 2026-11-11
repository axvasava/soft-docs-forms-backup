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

	var AUDIENCE_CLASS_BY_EMPLOYEE_STUDENT = {
		Student: "audience-text--student",
		Employee: "audience-text--employee",
		"Both (Employee and Student)": "audience-text--both",
	};
	var employeeStudentSubscription;
	var requestSummarySubscriptions = [];
	var previousEmployeeStudentValue;
	var validationListenersInitialized = false;
	var INTEGRATION_COMPLETION_DELAY_MS = 1000;

	function chosenAdditionalNamesAreEligible(employeeStudentValue) {
		return (
			employeeStudentValue === "Employee" ||
			employeeStudentValue === "Both (Employee and Student)"
		);
	}

	function updateAudienceText(employeeStudentValue) {
		var activeAudienceClass =
			AUDIENCE_CLASS_BY_EMPLOYEE_STUDENT[employeeStudentValue];

		document
			.querySelectorAll(".audience-text")
			.forEach(function updateAudienceVariant(element) {
				element.hidden =
					!activeAudienceClass ||
					!element.classList.contains(activeAudienceClass);
			});
	}

	function updateChosenAdditionalNames(employeeStudentValue) {
		["chosenMiddleNameField", "chosenLastNameField"].forEach(
			function updateChosenNameField(fieldId) {
				var field = document.getElementById(fieldId);

				if (chosenAdditionalNamesAreEligible(employeeStudentValue)) {
					occFramework.fields.show(field);
				} else {
					occFramework.fields.hide(field);
				}
			},
		);
	}

	function applyEmployeeStudentState(
		employeeStudentValue,
		clearIneligibleValue,
	) {
		updateAudienceText(employeeStudentValue);
		updateChosenAdditionalNames(employeeStudentValue);

		if (
			clearIneligibleValue &&
			!chosenAdditionalNamesAreEligible(employeeStudentValue)
		) {
			vm.chosenMiddleName("");
			vm.chosenLastName("");
		}
	}

	function initializeEmployeeStudentBehavior() {
		if (employeeStudentSubscription) {
			return;
		}

		previousEmployeeStudentValue = vm.employeeStudent();
		applyEmployeeStudentState(previousEmployeeStudentValue, false);

		employeeStudentSubscription = vm.employeeStudent.subscribe(
			function handleEmployeeStudentChange(newValue) {
				var becameIneligible =
					chosenAdditionalNamesAreEligible(
						previousEmployeeStudentValue,
					) && !chosenAdditionalNamesAreEligible(newValue);

				applyEmployeeStudentState(newValue, becameIneligible);
				previousEmployeeStudentValue = newValue;
			},
		);
	}

	function summaryDisplayValue(value) {
		var normalizedValue = String(value || "").trim();

		return normalizedValue || "Not provided";
	}

	function formatSummaryName(firstName, middleName, lastName) {
		var name = [firstName, middleName, lastName]
			.map(usableText)
			.filter(Boolean)
			.join(" ");

		return summaryDisplayValue(name);
	}

	function populateRequestSummary() {
		var additionalNamesAreEligible = chosenAdditionalNamesAreEligible(
			vm.employeeStudent(),
		);
		var requestedMiddleName = additionalNamesAreEligible
			? usableText(vm.chosenMiddleName()) ||
				usableText(vm.employeeMiddleInitial())
			: usableText(vm.employeeMiddleInitial());
		var requestedLastName = additionalNamesAreEligible
			? usableText(vm.chosenLastName()) ||
				usableText(vm.employeeLastNameLegal())
			: usableText(vm.employeeLastNameLegal());

		document.getElementById("requestSummaryRequestorType").textContent =
			summaryDisplayValue(vm.employeeStudent());
		document.getElementById("requestSummaryLegalName").textContent =
			formatSummaryName(
				vm.employeeFirstNameLegal(),
				vm.employeeMiddleInitial(),
				vm.employeeLastNameLegal(),
			);
		document.getElementById("requestSummaryRequestedName").textContent =
			formatSummaryName(
				vm.chosenFirstName(),
				requestedMiddleName,
				requestedLastName,
			);
		document.getElementById("requestSummaryPronoun").textContent =
			summaryDisplayValue(vm.chosenPersonalPronoun());
	}

	function initializeRequestSummary() {
		if (requestSummarySubscriptions.length) {
			return;
		}

		[
			"employeeStudent",
			"employeeLastNameLegal",
			"employeeFirstNameLegal",
			"employeeMiddleInitial",
			"chosenFirstName",
			"chosenMiddleName",
			"chosenLastName",
			"chosenPersonalPronoun",
		].forEach(function subscribeToSummaryField(observableName) {
			requestSummarySubscriptions.push(
				vm[observableName].subscribe(populateRequestSummary),
			);
		});

		populateRequestSummary();
	}

	function applyWorkflowState() {
		var officeUseSection = document.getElementById("officeUseSection");
		var atStart = pkg.isAtStep("Start");
		var atStudentServices = pkg.isAtStep("WFStudentServicesSpecialists");
		var atHumanResources = pkg.isAtStep("HRWFChosenName");

		document.getElementById("chosenNameInstructions").hidden = !atStudentServices;

		if (atStart) {
			occFramework.fields.hide(officeUseSection);
			return;
		}

		occFramework.fields.show(officeUseSection);

		if (!atStudentServices && !atHumanResources) {
			return;
		}

		occFramework.fields.readonly(
			[
				document.getElementById("yourInformationSection"),
				document.getElementById("yourRequestSection"),
				document.getElementById("acknowledgementSection"),
			],
			true,
		);
	}

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

	function validateEmployeeStudent() {
		var control = document.getElementById("employeeStudent");
		var error = document.getElementById("employeeStudentError");
		var message = control.value
			? ""
			: "Select whether you are a student, employee, or both.";

		synchronizeValidationError(control, error, message);
	}

	function validateChosenFirstName() {
		var control = document.getElementById("chosenFirstName");
		var error = document.getElementById("chosenFirstNameError");
		var message = control.value.trim()
			? ""
			: "Enter your chosen first name.";

		synchronizeValidationError(control, error, message);
	}

	function validateAcknowledgement() {
		var control = document.getElementById("acknowledgement");
		var error = document.getElementById("acknowledgementError");
		var message = control.checked
			? ""
			: "Confirm that the information on this form is complete and correct.";

		synchronizeValidationError(control, error, message);
	}

	function normalizeControlValue(controlId, observable) {
		var control = document.getElementById(controlId);
		var normalizedValue = control.value.trim();

		if (normalizedValue !== control.value) {
			observable(normalizedValue);
		}

		return normalizedValue;
	}

	function normalizeAndValidateChosenFirstName() {
		normalizeControlValue("chosenFirstName", vm.chosenFirstName);
		validateChosenFirstName();
	}

	function normalizeChosenLastName() {
		normalizeControlValue("chosenLastName", vm.chosenLastName);
	}

	function normalizeChosenMiddleName() {
		normalizeControlValue("chosenMiddleName", vm.chosenMiddleName);
	}

	function validateAlternateEmail() {
		var control = document.getElementById("alternateEmail");
		var error = document.getElementById("alternateEmailError");
		var message = control.validity.typeMismatch
			? "Enter a valid email address."
			: "";

		synchronizeValidationError(control, error, message);
	}

	function normalizeAndValidateAlternateEmail() {
		normalizeControlValue("alternateEmail", vm.alternateEmail);
		validateAlternateEmail();
	}

	function validateUserFields() {
		validateEmployeeStudent();
		normalizeAndValidateChosenFirstName();
		normalizeChosenMiddleName();
		normalizeChosenLastName();
		normalizeAndValidateAlternateEmail();
		validateAcknowledgement();
	}

	function initializeFieldValidation(
		controlId,
		errorId,
		validate,
		validateOnFocusout,
	) {
		var control = document.getElementById(controlId);
		var error = document.getElementById(errorId);

		control.addEventListener("focusout", validateOnFocusout || validate);
		["input", "change"].forEach(function listenForCorrection(eventName) {
			control.addEventListener(eventName, function clearStaleError() {
				if (!error.hidden) {
					validate();
				}
			});
		});
	}

	function initializeValidationListeners() {
		if (validationListenersInitialized) {
			return;
		}

		initializeFieldValidation(
			"employeeStudent",
			"employeeStudentError",
			validateEmployeeStudent,
		);
		initializeFieldValidation(
			"chosenFirstName",
			"chosenFirstNameError",
			validateChosenFirstName,
			normalizeAndValidateChosenFirstName,
		);
		initializeFieldValidation(
			"alternateEmail",
			"alternateEmailError",
			validateAlternateEmail,
			normalizeAndValidateAlternateEmail,
		);
		initializeFieldValidation(
			"acknowledgement",
			"acknowledgementError",
			validateAcknowledgement,
		);
		document
			.getElementById("chosenMiddleName")
			.addEventListener("focusout", normalizeChosenMiddleName);
		document
			.getElementById("chosenLastName")
			.addEventListener("focusout", normalizeChosenLastName);

		validationListenersInitialized = true;
	}

	function usableText(value) {
		return typeof value === "string" ? value.trim() : "";
	}

	function formatTeamDynamixName(lastName, firstName, middleName) {
		var givenNames = [usableText(firstName), usableText(middleName)]
			.filter(Boolean)
			.join(" ");

		return usableText(lastName) + ", " + givenNames;
	}

	function formatTeamDynamixBirthDate(value) {
		var match = usableText(value).match(
			/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(\d{4})$/,
		);

		return match ? match[3] + "-" + match[1] + "-" + match[2] : "";
	}

	function delayIntegrationCompletion(result) {
		return new Promise(function resolveAfterDelay(resolve) {
			setTimeout(function finishDelay() {
				resolve(result);
			}, INTEGRATION_COMPLETION_DELAY_MS);
		});
	}

	function formatDateOfBirth(value) {
		var match = usableText(value).match(
			/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:T.*)?$/,
		);

		return match ? match[2] + "/" + match[3] + "/" + match[1] : "";
	}

	function mapEmployeeData(employeeData) {
		var name =
			employeeData &&
			Array.isArray(employeeData.names) &&
			employeeData.names.length
				? employeeData.names[0]
				: null;
		var phone =
			employeeData &&
			Array.isArray(employeeData.phones) &&
			employeeData.phones.length
				? employeeData.phones[0]
				: null;
		var middleName = usableText(name && name.middleName);

		return {
			dateOfBirth: formatDateOfBirth(
				employeeData && employeeData.dateOfBirth,
			),
			lastName: usableText(name && name.lastName),
			firstName: usableText(name && name.firstName),
			middleInitial: middleName ? middleName.charAt(0) + "." : "",
			phoneNumber: usableText(phone && phone.number),
			personGuid: usableText(employeeData && employeeData.id),
		};
	}

	function assignIfUsable(observable, value) {
		if (value) {
			observable(value);
		}
	}

	function populateIdentityFields(employee) {
		assignIfUsable(vm.employeeDateOfBirth, employee.dateOfBirth);
		assignIfUsable(vm.employeeLastNameLegal, employee.lastName);
		assignIfUsable(vm.employeeFirstNameLegal, employee.firstName);
		assignIfUsable(vm.employeeMiddleInitial, employee.middleInitial);
		assignIfUsable(vm.phoneNumber, employee.phoneNumber);
	}

	function populatePayClassCode(personGuid) {
		if (!personGuid) {
			return Promise.resolve();
		}

		return integration
			.first("Web_Ethos_Get_institution_jobs_by_Person_GUID", {
				personGUID: personGuid,
			})
			.then(function loadPayClass(institutionJob) {
				var payClassGuid = usableText(
					institutionJob &&
						institutionJob.payClass &&
						institutionJob.payClass.id,
				);

				if (!payClassGuid) {
					return undefined;
				}

				return integration.first(
					"Web_Ethos_Get_Pay_Class_by_Pay_Class_GUID",
					{
						payClassGUID: payClassGuid,
					},
				);
			})
			.then(function assignPayClassCode(payClass) {
				assignIfUsable(
					vm.payClassCode,
					usableText(payClass && payClass.code),
				);
			})
			.catch(function handlePayClassFailure(error) {
				console.warn("Unable to populate payClassCode.", error);
			});
	}

	function populateEmployeeData() {
		return integration
			.first("EthosColleagueEmployeeByErpId", {})
			.then(function mapAndPopulateEmployee(employeeData) {
				var employee = mapEmployeeData(employeeData);
				populateIdentityFields(employee);

				return populatePayClassCode(employee.personGuid);
			})
			.catch(function handleEmployeeDataFailure(error) {
				console.warn("Unable to populate employee information.", error);
			});
	}

	function getTodayDateValue() {
		var today = new Date();
		var month = String(today.getMonth() + 1).padStart(2, "0");
		var day = String(today.getDate()).padStart(2, "0");

		return today.getFullYear() + "-" + month + "-" + day;
	}

	function populateProcessingMetadata() {
		if (
			!pkg.isAtStep("WFStudentServicesSpecialists") &&
			!pkg.isAtStep("HRWFChosenName")
		) {
			return;
		}
		vm.username(occFramework.usernameLocalPart(user.UserName));
		vm.effectiveDate(getTodayDateValue());
	}

	vm.onLoad = function onLoad(source, inputValues) {};

	vm.setDefaults = function setDefaults(source, inputValues) {
		initializeEmployeeStudentBehavior();
		initializeRequestSummary();
		populateProcessingMetadata();

		if (user.isInLibrary === true) {
			return populateEmployeeData();
		}

		return undefined;
	};

	vm.afterLoad = function afterLoad() {
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg && pkg.isExporting);
		applyWorkflowState();
		initializeValidationListeners();
	};

	vm.onSubmit = function onSubmit(form) {
		if (
			!pkg.isAtStep("WFStudentServicesSpecialists") &&
			!pkg.isAtStep("HRWFChosenName")
		) {
			return undefined;
		}
	};

	vm.onApprove = function onApprove(form) {
		var integrationName;
		var isStaffApproval = pkg.isAtStep("HRWFChosenName");

		if (isStaffApproval) {
			integrationName = "Team_Dynamix_Staff_Name_Change";
		} else if (pkg.isAtStep("WFStudentServicesSpecialists")) {
			integrationName = "Team_Dynamix_Student_Name_Change";
		} else {
			return undefined;
		}

		var additionalNamesAreEligible = chosenAdditionalNamesAreEligible(
			vm.employeeStudent(),
		);
		var chosenMiddleName = additionalNamesAreEligible
			? usableText(vm.chosenMiddleName())
			: "";
		var chosenLastName = additionalNamesAreEligible
			? usableText(vm.chosenLastName())
			: "";
		var sourceParameters = {
			username: vm.username(),
			birthDate: formatTeamDynamixBirthDate(vm.employeeDateOfBirth()),
			newName: formatTeamDynamixName(
				chosenLastName || vm.employeeLastNameLegal(),
				vm.chosenFirstName(),
				chosenMiddleName || vm.employeeMiddleInitial(),
			),
			oldName: formatTeamDynamixName(
				vm.employeeLastNameLegal(),
				vm.employeeFirstNameLegal(),
				vm.employeeMiddleInitial(),
			),
		};

		if (isStaffApproval) {
			sourceParameters.effectiveDate = vm.effectiveDate();
		}

		return integration
			.add(integrationName, sourceParameters)
			.then(function inspectTeamDynamixResult(result) {
				if (result && result.ticketNumber != null) {
					vm.ticketNumber(String(result.ticketNumber));
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

	vm.onDecline = function onDecline(form) {};

	vm.beforeRequired = function beforeRequired(form) {
		validateUserFields();
	};

	vm.afterRequired = function afterRequired(form) {};

	vm.onOptOut = function onOptOut(form) {};

	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
