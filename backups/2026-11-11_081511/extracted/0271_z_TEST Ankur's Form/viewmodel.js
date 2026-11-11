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

	var WORKFLOW = {
		start: "Start",
		esign: "ESign",
		content: "Content",
	};
	var visitFieldPattern =
		/^visit(?:Purpose|DateRangeStart|DateRangeEnd|Campus)\[(\d+)\]$/;
	var workflowState = "editable";
	var reviewInteractionGuardInitialized = false;
	var signatureDateSubscription;

	function packageValue(name) {
		var value = pkg && pkg[name];

		return typeof value === "function" ? value() : value;
	}

	function isAtWorkflowStep(step) {
		if (pkg && typeof pkg.isAtStep === "function") {
			return pkg.isAtStep(step);
		}

		return (
			String(packageValue("stepCode") || "")
				.trim()
				.toLowerCase() === step.toLowerCase()
		);
	}

	function currentWorkflowState() {
		if (isAtWorkflowStep(WORKFLOW.esign)) {
			return "esign";
		}

		if (isAtWorkflowStep(WORKFLOW.content)) {
			return "content";
		}

		return "editable";
	}

	function isExporting() {
		return Boolean(packageValue("isExporting"));
	}

	function getTodayDisplayValue() {
		var today = new Date();
		var month = String(today.getMonth() + 1).padStart(2, "0");
		var day = String(today.getDate()).padStart(2, "0");

		return month + "/" + day + "/" + today.getFullYear();
	}

	function initializeSignatureDate() {
		if (signatureDateSubscription) {
			return;
		}

		signatureDateSubscription = vm.visitorSignature.subscribe(
			function setVisitorSignatureDate(newValue) {
				var signature = String(newValue || "").trim();

				vm.visitorSignatureDate(
					signature ? getTodayDisplayValue() : undefined,
				);
			},
		);
	}

	function initializeFormId() {
		if (
			isAtWorkflowStep(WORKFLOW.start) &&
			!String(vm.formId() || "").trim()
		) {
			vm.formId(occFramework.formId.generate());
		}
	}

	function isReviewInteractionControl(control) {
		return Boolean(
			control &&
				control.matches &&
				control.matches('select, input[type="checkbox"]') &&
				control.closest("[data-csa-review-content]"),
		);
	}

	function preventLockedPointerInteraction(event) {
		if (
			workflowState !== "editable" &&
			isReviewInteractionControl(event.target)
		) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	}

	function preventLockedKeyboardInteraction(event) {
		if (
			workflowState !== "editable" &&
			event.key !== "Tab" &&
			isReviewInteractionControl(event.target)
		) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	}

	function initializeReviewInteractionGuard() {
		var form;

		if (reviewInteractionGuardInitialized) {
			return;
		}

		form = document.getElementById("csaTrainingAcknowledgment");
		["pointerdown", "mousedown", "touchstart", "click"].forEach(
			function guardPointerEvent(eventName) {
				form.addEventListener(
					eventName,
					preventLockedPointerInteraction,
					true,
				);
			},
		);
		form.addEventListener("keydown", preventLockedKeyboardInteraction, true);
		reviewInteractionGuardInitialized = true;
	}

	function setUnsupportedReviewControlsReadonly(readonly) {
		document
			.querySelectorAll(
				'[data-csa-review-content] select, [data-csa-review-content] input[type="checkbox"]',
			)
			.forEach(function setReadonlyState(control) {
				if (readonly) {
					control.setAttribute("aria-readonly", "true");
				} else {
					control.removeAttribute("aria-readonly");
				}
			});
	}

	function updateCampusVisitActionVisibility() {
		var visitRoot = document.getElementById("campusVisitRows");
		var rows;
		var hideStructuralActions;

		if (!visitRoot) {
			return;
		}

		rows = Array.from(
			visitRoot.querySelectorAll("[data-occ-repeating-group-row]"),
		);
		hideStructuralActions = workflowState !== "editable" || isExporting();

		visitRoot.querySelector("[data-csa-visit-add-action]").hidden =
			hideStructuralActions;
		rows.forEach(function updateRowRemoveAction(row) {
			row.querySelector("[data-csa-visit-remove-action]").hidden =
				hideStructuralActions || rows.length <= 1;
		});
	}

	function applyWorkflowState() {
		var reviewSection = document.getElementById("reviewAndSignSection");
		var signature = document.getElementById("visitorSignature");
		var signatureField = signature.closest(".occ-field");
		var signatureDate = document.getElementById("visitorSignatureDate");
		var locked;

		workflowState = currentWorkflowState();
		locked = workflowState !== "editable";

		document
			.querySelectorAll("[data-csa-review-content]")
			.forEach(function setReviewContentReadonly(section) {
				occFramework.fields.readonly(section, locked);
			});
		setUnsupportedReviewControlsReadonly(locked);

		if (locked || isExporting()) {
			occFramework.fields.show(reviewSection);
		} else {
			occFramework.fields.hide(reviewSection);
		}

		occFramework.fields.readonly(
			signatureField,
			workflowState === "content",
		);
		occFramework.fields.required(
			signatureField,
			workflowState === "esign",
		);
		signatureDate.readOnly = true;
		updateCampusVisitActionVisibility();
	}

	function createOption(option) {
		var element = document.createElement("option");

		element.value = option.value;
		element.textContent = option.label;

		return element;
	}

	function populateSelect(select, options, prompt) {
		var selectedValue = select.value;

		select.textContent = "";
		select.appendChild(createOption({ value: "", label: prompt }));
		options.forEach(function appendOption(option) {
			select.appendChild(createOption(option));
		});
		select.value = selectedValue;
	}

	function populateStateOptions() {
		var stateSelect = document.getElementById("institutionState");

		populateSelect(
			stateSelect,
			occFramework.options.states,
			"Choose a state",
		);
	}

	function populateCampusOptions(root) {
		var scope = root || document;

		Array.from(scope.querySelectorAll("[data-csa-campus-select]")).forEach(
			function populateCampusSelect(select) {
				populateSelect(
					select,
					occFramework.options.campuses.bigFour,
					"Choose a campus",
				);
			},
		);
	}

	function savedInputNames(inputValues) {
		var values = Array.isArray(inputValues)
			? inputValues
			: inputValues && inputValues.list;
		var names = [];

		if (inputValues && !Array.isArray(inputValues)) {
			names = Object.keys(inputValues);
		}

		if (!Array.isArray(values)) {
			return names;
		}

		return names.concat(
			values
				.map(function getInputName(inputValue) {
					return (
						inputValue &&
						(inputValue.name ||
							inputValue.Name ||
							inputValue.inputName ||
							inputValue.InputName ||
							inputValue.id ||
							inputValue.Id ||
							inputValue.inputId ||
							inputValue.InputId ||
							inputValue.key ||
							inputValue.field)
					);
				})
				.filter(Boolean),
		);
	}

	function requiredVisitRowCount(inputValues) {
		return savedInputNames(inputValues).reduce(function findHighestKey(
			count,
			name,
		) {
			var match = String(name).match(visitFieldPattern);
			var rowKey = match ? Number(match[1]) : -1;

			return Number.isInteger(rowKey)
				? Math.max(count, rowKey + 1)
				: count;
		}, 1);
	}

	function initializeCampusVisits(inputValues) {
		var visitRoot = document.getElementById("campusVisitRows");
		var visitList = visitRoot.querySelector(
			"[data-occ-repeating-group-list]",
		);
		var visitTemplate = visitRoot.querySelector(
			"[data-occ-repeating-group-template]",
		);
		var requiredRows = requiredVisitRowCount(inputValues);
		var campusVisitGroup;

		populateCampusOptions(visitTemplate.content);
		campusVisitGroup = occFramework.repeatingGroups.create(visitRoot, {
			minRows: 1,
		});

		while (
			visitRoot.querySelectorAll("[data-occ-repeating-group-row]")
				.length < requiredRows
		) {
			campusVisitGroup.add();
		}

		new MutationObserver(updateCampusVisitActionVisibility).observe(
			visitList,
			{
				childList: true,
			},
		);
		updateCampusVisitActionVisibility();
	}

	function validateVisitDateRange(row) {
		var firstDay = row.querySelector("[data-csa-visit-first-day]");
		var lastDay = row.querySelector("[data-csa-visit-last-day]");
		var error = row.querySelector("[data-csa-visit-date-error]");
		var invalid = Boolean(
			firstDay.value && lastDay.value && lastDay.value < firstDay.value,
		);

		lastDay.setCustomValidity(
			invalid ? "Last day cannot be before first day." : "",
		);
		error.hidden = !invalid;

		if (invalid) {
			lastDay.setAttribute("aria-invalid", "true");
		} else {
			lastDay.removeAttribute("aria-invalid");
		}
	}

	function validateAllVisitDateRanges() {
		document
			.getElementById("campusVisitRows")
			.querySelectorAll("[data-occ-repeating-group-row]")
			.forEach(validateVisitDateRange);
	}

	function initializeVisitDateValidation() {
		var visitRoot = document.getElementById("campusVisitRows");

		function validateChangedVisit(event) {
			if (
				!event.target.matches(
					"[data-csa-visit-first-day], [data-csa-visit-last-day]",
				)
			) {
				return;
			}

			validateVisitDateRange(
				event.target.closest("[data-occ-repeating-group-row]"),
			);
		}

		visitRoot.addEventListener("input", validateChangedVisit);
		visitRoot.addEventListener("change", validateChangedVisit);
	}

	vm.onLoad = function onLoad(source, inputValues) {
		populateStateOptions();
		initializeCampusVisits(inputValues);
		initializeVisitDateValidation();
		initializeReviewInteractionGuard();
		applyWorkflowState();
	};

	vm.setDefaults = function setDefaults(source, inputValues) {
		initializeSignatureDate();
		initializeFormId();
	};

	vm.afterLoad = function afterLoad() {
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg && pkg.isExporting);
		validateAllVisitDateRanges();
		applyWorkflowState();
	};

	vm.beforeRequired = function beforeRequired(form) {
		applyWorkflowState();
		validateAllVisitDateRanges();
	};

	return vm;
});
