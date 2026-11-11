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

	var lookups = [
		{
			id: "creditCredential",
			optionsSource: "Web_Custom_MTN_Unique_Credentials",
			detailsSource: "Web_Custom_MTN_By_Credential",
			parameter: "credential",
			requestVersion: 0,
		},
		{
			id: "creditInstitution",
			optionsSource: "Web_Custom_MTN_Unique_Institutions",
			detailsSource: "Web_Custom_MTN_By_Institution",
			parameter: "institution",
			requestVersion: 0,
		},
	];

	function isExporting() {
		var value = pkg && pkg.isExporting;
		return Boolean(typeof value === "function" ? value() : value);
	}

	function loadOptions(lookup) {
		var select = document.getElementById(lookup.id);
		var status = document.getElementById(lookup.id + "Status");
		status.textContent = "Loading " + lookup.parameter + " options...";
		// Keep the authored placeholder; Softdocs restores saved values after onLoad.
		select.options.length = 1;
		lookup.optionsLoaded = false;

		return Promise.resolve()
			.then(function retrieveOptions() {
				if (isExporting()) return;
				return integration.all(lookup.optionsSource);
			})
			.then(function populateOptions(values) {
				if (isExporting()) return;
				if (!Array.isArray(values) || values.some(function invalid(value) {
					return typeof value !== "string";
				})) {
					throw new TypeError("Expected an array of strings.");
				}
				values.forEach(function appendOption(value) {
					var option = document.createElement("option");
					option.value = value;
					option.textContent = value;
					select.appendChild(option);
				});
				lookup.optionsLoaded = true;
				status.textContent = "";
			})
			.catch(function reportOptionsError() {
				if (isExporting()) return;
				status.textContent = "Unable to load " + lookup.parameter + " options.";
			});
	}

	function loadDetails(lookup) {
		var version = ++lookup.requestVersion;
		var value = document.getElementById(lookup.id).value;
		var response = document.getElementById(lookup.id + "Response");
		var status = document.getElementById(lookup.id + "Status");
		response.textContent = "";
		response.hidden = true;
		if (isExporting() || !lookup.optionsLoaded) return Promise.resolve();
		status.textContent = "";
		if (!value) return Promise.resolve();

		status.textContent = "Loading " + lookup.parameter + " details...";
		var parameters = {};
		parameters[lookup.parameter] = value;
		return Promise.resolve()
			.then(function retrieveDetails() {
				if (version !== lookup.requestVersion || isExporting()) return;
				return integration.all(lookup.detailsSource, parameters);
			})
			.then(function displayDetails(result) {
				if (version !== lookup.requestVersion || isExporting()) return;
				response.textContent = JSON.stringify(result, null, 2);
				response.hidden = false;
				status.textContent = "Details loaded.";
			})
			.catch(function reportDetailsError() {
				if (version !== lookup.requestVersion || isExporting()) return;
				status.textContent = "Unable to load " + lookup.parameter + " details. Select again to retry.";
			});
	}

	vm.onLoad = function onLoad(source, inputValues) {
		if (isExporting()) return;
		return Promise.all(lookups.map(loadOptions));
	};
	vm.setDefaults = function setDefaults(source, inputValues) {};

	vm.afterLoad = function afterLoad() {
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg && pkg.isExporting);

		if (isExporting()) return;
		return Promise.all(lookups.map(function initializeLookup(lookup) {
			if (!lookup.listening) {
				document.getElementById(lookup.id).addEventListener("change", function selectionChanged() {
					loadDetails(lookup);
				});
				lookup.listening = true;
			}
			// Read the restored selection without changing Softdocs persistence.
			return loadDetails(lookup);
		}));
	};

	vm.onSubmit = function onSubmit(form) {};
	vm.onApprove = function onApprove(form) {};
	vm.onDecline = function onDecline(form) {};
	vm.beforeRequired = function beforeRequired(form) {};
	vm.afterRequired = function afterRequired(form) {};
	vm.onOptOut = function onOptOut(form) {};
	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
