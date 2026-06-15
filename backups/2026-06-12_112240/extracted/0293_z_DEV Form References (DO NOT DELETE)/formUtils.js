define([
	"./requiredIndicators.js",
	"./fieldStateUtils.js",
	"./personUtils.js",
	"./formIdUtils.js",
	"./dateUtils.js",
	"./numberUtils.js",
	"./fieldValidationUtils.js",
	"./formIds.js",
	"./developerSectionUtils.js",
	"./formLifecycleUtils.js",
], function () {
	"use strict";

	console.info("formUtils 06-12");

	if (typeof window.createRequiredIndicators !== "function") {
		throw new Error("requiredIndicators.js did not load correctly.");
	}

	if (typeof window.createAutoCompleteUtils !== "function") {
		throw new Error("autoCompleteUtils.js did not load correctly.");
	}

	if (typeof window.createFieldStateUtils !== "function") {
		throw new Error("createFieldStateUtils.js did not load correctly.");
	}

	if (!window.personUtils) {
		throw new Error("personUtils.js did not load correctly.");
	}

	if (!window.formIdUtils) {
		throw new Error("formIdUtils.js did not load correctly.");
	}

	if (!window.dateUtils) {
		throw new Error("dateUtils.js did not load correctly.");
	}

	if (!window.numberUtils) {
		throw new Error("numberUtils.js did not load correctly.");
	}

	if (typeof window.createFieldValidationUtils !== "function") {
		throw new Error("fieldValidationUtils.js did not load correctly.");
	}

	if (!window.formIds) {
		throw new Error("formIds.js did not load correctly.");
	}

	if (!window.developerSectionUtils) {
		throw new Error("developerSectionUtils.js did not load correctly.");
	}

	if (typeof window.createFormLifecycleUtils !== "function") {
		throw new Error("formLifecycleUtils.js did not load correctly.");
	}

	return {
		createRequiredIndicators: window.createRequiredIndicators,
		createAutoCompleteUtils: window.createAutoCompleteUtils,
		createFieldStateUtils: window.createFieldStateUtils,
		createFieldValidationUtils: window.createFieldValidationUtils,

		getNestedValue: window.personUtils.getNestedValue,
		getMatchingValue: window.personUtils.getMatchingValue,
		getPreferredName: window.personUtils.getPreferredName,
		getPreferredFirstName: window.personUtils.getPreferredFirstName,
		getPreferredLastName: window.personUtils.getPreferredLastName,
		getPreferredDisplayName: window.personUtils.getPreferredDisplayName,

		getPrimaryEmail: window.personUtils.getPrimaryEmail,
		getPrimarySupervisor: window.personUtils.getPrimarySupervisor,
		generateFormID: window.formIdUtils.generateFormID,

		formatDateYYYYMMDD: window.dateUtils.formatDateYYYYMMDD,
		formatDateMMDDYYYY: window.dateUtils.formatDateMMDDYYYY,
		getTodayDate: window.dateUtils.getTodayDate,
		addDaysToCurrentDate: window.dateUtils.addDaysToCurrentDate,
		normalizeDateStr: window.dateUtils.normalizeDateStr,
		generateDateRange: window.dateUtils.generateDateRange,
		getAcademicYear: window.dateUtils.getAcademicYear,

		formatNumber: window.numberUtils.formatNumber,
		formatAmountRounded: window.numberUtils.formatAmountRounded,

		formIds: window.formIds,
		generateUUID: window.formIdUtils.generateUUID,

		createFormLifecycleUtils: window.createFormLifecycleUtils,
	};
});
