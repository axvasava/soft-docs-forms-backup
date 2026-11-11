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

	var initialized = false;
	var maximumCredits = 24;
	var academicResult = "Not yet determined";
	var studentRequest = 0;
	var resolvedPersonGuid = null;
	var academicEligible = false;
	var deanListAvailable = false;
	var deanLoadMessage = "Dean options have not loaded yet.";

	function element(id) {
		return document.getElementById(id);
	}

	function updateDeanState() {
		var select = element("dean");
		var isExporting = pkg && pkg.isExporting;
		if (typeof isExporting === "function") isExporting = isExporting();
		select.disabled =
			!academicEligible || !deanListAvailable || !!isExporting;
		var selected = select.selectedOptions[0];
		element("deanStatus").textContent =
			selected && selected.dataset.unavailable
				? deanLoadMessage +
					" The saved dean is unavailable in the current list; the saved name and email are retained."
				: deanLoadMessage;
	}

	function syncDeanEmail() {
		var select = element("dean");
		var selected = select.selectedOptions[0];
		if (!select.value) vm.deanEmail("");
		else if (selected && !selected.dataset.unavailable) {
			vm.deanEmail(selected.dataset.email);
		}
		updateDeanState();
	}

	function preserveSavedDean(name) {
		var select = element("dean");
		if (!name) return;
		if (
			!Array.from(select.options).some(function (option) {
				return option.value === name;
			})
		) {
			var option = document.createElement("option");
			option.value = name;
			option.textContent = name;
			option.dataset.unavailable = "true";
			// Preserve the saved choice, but do not offer it as a new selection.
			option.disabled = true;
			select.appendChild(option);
		}
		select.value = name;
	}

	function clearStudentIdentity() {
		resolvedPersonGuid = null;
		element("studentName").textContent = "Not yet resolved";
		element("summaryStudent").textContent = "Not yet resolved";
	}

	function preferredFullName(names) {
		if (!Array.isArray(names)) return null;
		var preferred = names.find(function (name) {
			return (
				name &&
				String(name.preference || "").toLowerCase() === "preferred"
			);
		});
		return preferred && preferred.fullName;
	}

	async function searchStudent() {
		var isExporting = pkg && pkg.isExporting;
		if (typeof isExporting === "function") isExporting = isExporting();
		if (isExporting) return;

		var input = element("studentId");
		var studentId = input.value.trim();
		input.value = studentId;
		if (typeof vm.studentId === "function") vm.studentId(studentId);
		var request = ++studentRequest;
		var status = element("studentLookupStatus");
		var button = element("studentSearchButton");
		clearStudentIdentity();
		input.removeAttribute("aria-invalid");
		if (!/^[0-9]{7}$/.test(studentId)) {
			input.setAttribute("aria-invalid", "true");
			status.textContent = "Enter a 7-digit Student ID.";
			return;
		}

		function isCurrentRequest() {
			return (
				request === studentRequest && input.value.trim() === studentId
			);
		}

		button.disabled = true;
		status.textContent = "Searching...";
		try {
			var personResults = await integration.first(
				"Web_Ethos_Get_Persons_by_Colleague_ID",
				{ personID: studentId },
			);
			if (!isCurrentRequest()) return;
			if (!personResults) {
				clearStudentIdentity();
				status.textContent = "Student not found.";
				return;
			}
			// Transient identity only; persistence/restoration awaits runtime evidence.
			resolvedPersonGuid = personResults.id;
			var name = preferredFullName(personResults.names);
			element("studentName").textContent =
				name || "Preferred name unavailable";
			element("summaryStudent").textContent =
				name || "Preferred name unavailable";
			status.textContent = name
				? "Student found."
				: "Student found, but a preferred full name is unavailable.";
		} catch (error) {
			if (!isCurrentRequest()) return;
			clearStudentIdentity();
			status.textContent =
				"Student lookup could not be completed. Try again.";
		} finally {
			if (isCurrentRequest()) button.disabled = false;
		}
	}

	function updateSelection(changed) {
		var selected = Array.from(
			document.querySelectorAll("#amnestyRows input:checked"),
		);
		var credits = selected.reduce(function total(sum, input) {
			return sum + Number(input.dataset.credits);
		}, 0);
		if (credits > maximumCredits && changed) {
			changed.checked = false;
			element("creditLimitMessage").textContent =
				"This selection would exceed the 24-credit maximum. Unselect another course first.";
			return;
		}
		element("creditLimitMessage").textContent = "";
		element("selectedCredits").textContent = String(credits);
		element("summaryCredits").textContent = String(credits);
		element("summaryCount").textContent = String(selected.length);
	}

	// DEVELOPMENT ONLY: explicit sample buttons reveal the example rows in index.html.
	// These are transient UI values, not academic records or persisted petition fields.
	// Remove this function, its listeners and the marked HTML fixtures when real data is available.
	function showExample(state) {
		var hasExample = state !== "empty";
		var eligible = state === "eligible";
		academicEligible = eligible;
		updateDeanState();
		element("amnestyRows").hidden = !hasExample;
		element("amnestyEmpty").hidden = hasExample;
		element("qualifyingRows").hidden = !hasExample;
		element("qualifyingEmpty").hidden = hasExample;
		element("qualifyingFinalCourse").hidden = !eligible;
		document
			.querySelectorAll("#amnestyRows input")
			.forEach(function reset(input) {
				input.checked = false;
				input.disabled = !hasExample;
			});
		element("lastAttendance").textContent = hasExample
			? "Winter 2026 (example)"
			: "Not yet available";
		element("qualifyingCredits").textContent = hasExample
			? eligible
				? "17"
				: "14"
			: "Not yet available";
		academicResult = hasExample
			? eligible
				? "Eligible (example)"
				: "Not eligible (example)"
			: "Not yet determined";
		element("summaryAcademic").textContent = academicResult;
		var result = element("academicResult");
		result.className =
			"occ-callout occ-callout--" +
			(hasExample ? (eligible ? "success" : "error") : "info");
		result.textContent = hasExample
			? eligible
				? "Eligible (example): 17 qualifying credits. The final whole course counts, so the total may exceed 16."
				: "Not eligible (example): 14 qualifying credits; at least 16 are needed. This petition cannot continue."
			: "Academic eligibility has not yet been determined.";
		element("submissionHelp").textContent =
			hasExample && !eligible
				? "This petition cannot continue: fewer than 16 qualifying credits. Submission is also unavailable in this preliminary UI."
				: "Submission is unavailable in this preliminary UI. Filing eligibility, dean options and workflow are pending.";
		updateSelection();
	}

	vm.onLoad = async function onLoad(source, inputValues) {
		var select = element("dean");
		var savedDean = select.value || inputValues.first("dean");
		preserveSavedDean(savedDean);
		deanListAvailable = false;
		var isExporting = pkg && pkg.isExporting;
		if (typeof isExporting === "function") isExporting = isExporting();
		if (isExporting) {
			deanLoadMessage = "Dean list is not refreshed during export.";
			updateDeanState();
			return;
		}
		deanLoadMessage = "Loading dean list...";
		updateDeanState();
		try {
			var deans = await integration.all("OIE_Get_Deans");
			console.log("Deans loaded:", deans);
			if (!Array.isArray(deans)) throw new Error("Expected a dean list.");
			var deansByName = new Map();
			deans.forEach(function (dean) {
				var existing = deansByName.get(dean.Dean);
				if (!existing || (!existing.Dean_Email && dean.Dean_Email)) {
					deansByName.set(dean.Dean, dean);
				}
			});
			// OIE names are "Last, First", so sorting the name sorts by surname.
			var uniqueDeans = Array.from(deansByName.values()).sort(function (a, b) {
				return a.Dean.localeCompare(b.Dean, "en", { sensitivity: "base" });
			});
			var options = document.createDocumentFragment();
			uniqueDeans.forEach(function (dean) {
				var option = document.createElement("option");
				option.value = dean.Dean;
				option.textContent = dean.Dean;
				option.dataset.email =
					dean.Dean_Email == null ? "" : dean.Dean_Email;
				options.appendChild(option);
			});
			// Keep the authored blank option and preserve the exact saved name values.
			while (select.options.length > 1) select.remove(1);
			select.appendChild(options);
			preserveSavedDean(savedDean);
			deanListAvailable = uniqueDeans.length > 0;
			deanLoadMessage = deanListAvailable
				? ""
				: "No deans are currently available.";
		} catch (error) {
			deanLoadMessage =
				"The dean list could not be loaded. Please try reopening the form.";
		}
		updateDeanState();
	};
	vm.setDefaults = function setDefaults(source, inputValues) {
		// Softdocs has restored scalar fields now. Do not overwrite an unavailable
		// saved dean's email, or any restored email when the list failed/export skipped it.
		var restoredDean = vm.dean();
		if (restoredDean) preserveSavedDean(restoredDean);
		else element("dean").value = "";
		if (deanListAvailable) syncDeanEmail();
	};
	vm.afterLoad = function afterLoad() {
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg && pkg.isExporting);
		if (initialized) return;
		initialized = true;
		element("dean").addEventListener("change", function deanChanged() {
			vm.dean(element("dean").value);
			syncDeanEmail();
		});
		element("studentSearchButton").addEventListener("click", searchStudent);
		element("amnestyRows").addEventListener(
			"change",
			function selectCourse(event) {
				if (event.target.matches("input[type=checkbox]"))
					updateSelection(event.target);
			},
		);
		element("studentId").addEventListener(
			"input",
			function studentChanged() {
				studentRequest++;
				clearStudentIdentity();
				element("studentLookupStatus").textContent = "";
				element("studentId").removeAttribute("aria-invalid");
				element("studentSearchButton").disabled = false;
				showExample("empty");
			},
		);
		// DEVELOPMENT ONLY: no integration or academic-history algorithm is called.
		element("exampleEligible").addEventListener("click", function () {
			showExample("eligible");
		});
		element("exampleIneligible").addEventListener("click", function () {
			showExample("ineligible");
		});
		element("exampleClear").addEventListener("click", function () {
			showExample("empty");
		});
	};

	// Preliminary UI only. Also block the host action so example data cannot be submitted.
	vm.onSubmit = function onSubmit(form) {
		throw new Error(
			"This preliminary Academic Amnesty UI is not ready for submission.",
		);
	};
	vm.onApprove = function onApprove(form) {
		throw new Error(
			"This preliminary Academic Amnesty UI is not ready for approval.",
		);
	};
	vm.onDecline = function onDecline(form) {};
	vm.beforeRequired = function beforeRequired(form) {};
	vm.afterRequired = function afterRequired(form) {};
	vm.onOptOut = function onOptOut(form) {};
	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
