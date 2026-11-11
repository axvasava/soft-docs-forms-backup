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
	var VISIT_FIELD_CONFIG = {
		purpose: "visitPurpose",
		firstDay: "visitDateRangeStart",
		lastDay: "visitDateRangeEnd",
		campus: "visitCampus",
	};
	var workflowState = "editable";
	var campusVisitsInitialized = false;
	var reviewInteractionGuardInitialized = false;
	var signatureDateSubscription;

	vm.addObservableArray("campusVisits");
	vm.campusVisits([]);

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
				hideStructuralActions;
		});
	}

	function applyWorkflowState() {
		var afterSubmitCallout =
			document.getElementById("afterSubmitCallout");
		var reviewSection = document.getElementById("reviewAndSignSection");
		var signature = document.getElementById("visitorSignature");
		var signatureField = signature.closest(".occ-field");
		var signatureDate = document.getElementById("visitorSignatureDate");
		var locked;

		workflowState = currentWorkflowState();
		locked = workflowState !== "editable";
		afterSubmitCallout.hidden = isExporting();

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

	function emptyCampusVisit() {
		return {
			purpose: "",
			firstDay: "",
			lastDay: "",
			campus: "",
		};
	}

	function normalizedCampusVisit(visit) {
		return Object.keys(VISIT_FIELD_CONFIG).reduce(
			function normalizeVisitField(normalized, property) {
				normalized[property] = String(
					(visit && visit[property]) || "",
				);
				return normalized;
			},
			{},
		);
	}

	function campusVisitRows() {
		return Array.from(
			document
				.getElementById("campusVisitRows")
				.querySelectorAll("[data-occ-repeating-group-row]"),
		);
	}

	function readInitialCampusVisit() {
		var row = campusVisitRows()[0];

		return Object.keys(VISIT_FIELD_CONFIG).reduce(
			function readVisitField(visit, property) {
				visit[property] = row.querySelector(
					'[data-csa-visit-field="' + property + '"]',
				).value;
				return visit;
			},
			{},
		);
	}

	function savedCampusVisits() {
		var data = vm.campusVisitsData();
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
			? parsed.map(normalizedCampusVisit)
			: null;
	}

	function syncCampusVisitsData() {
		vm.campusVisitsData(JSON.stringify(vm.campusVisits()));
	}

	function bindCampusVisitControl(control, visit, property) {
		control.addEventListener("input", function updateCampusVisit() {
			visit[property] = control.value;
			vm.campusVisits.valueHasMutated();
			syncCampusVisitsData();
		});
	}

	function setCampusVisitRowPosition(row, index) {
		var heading = row.querySelector("[data-csa-visit-heading]");
		var error = row.querySelector("[data-csa-visit-date-error]");
		var errorId = "visitDateRangeError-" + index;

		row.dataset.csaVisitIndex = String(index);
		heading.id = "visit-title-" + index;
		row.setAttribute("aria-labelledby", heading.id);
		error.id = errorId;

		Object.keys(VISIT_FIELD_CONFIG).forEach(
			function positionVisitField(property) {
				var control = row.querySelector(
					'[data-csa-visit-field="' + property + '"]',
				);
				var label = row.querySelector(
					'[data-csa-visit-label="' + property + '"]',
				);
				var baseName = VISIT_FIELD_CONFIG[property];

				control.id = baseName + "-" + index;
				control.name = baseName + "[" + index + "]";
				label.htmlFor = control.id;

				if (property === "lastDay") {
					control.setAttribute("aria-describedby", errorId);
				}
			},
		);
	}

	function configureCampusVisitRow(row, visit, index) {
		setCampusVisitRowPosition(row, index);
		populateCampusOptions(row);

		Object.keys(VISIT_FIELD_CONFIG).forEach(
			function configureVisitField(property) {
				var control = row.querySelector(
					'[data-csa-visit-field="' + property + '"]',
				);

				control.value = visit[property];
				bindCampusVisitControl(control, visit, property);
			},
		);
	}

	function renderCampusVisit(visit, index) {
		var root = document.getElementById("campusVisitRows");
		var template = root.querySelector(
			"[data-occ-repeating-group-template]",
		);
		var list = root.querySelector("[data-occ-repeating-group-list]");
		var row = template.content.firstElementChild.cloneNode(true);

		configureCampusVisitRow(row, visit, index);
		list.appendChild(row);
	}

	function renumberCampusVisitRows() {
		campusVisitRows().forEach(function renumberCampusVisit(row, index) {
			setCampusVisitRowPosition(row, index);
		});
	}

	function addCampusVisit(row, index) {
		var visit = emptyCampusVisit();

		vm.campusVisits.push(visit);
		configureCampusVisitRow(row, visit, index);
		syncCampusVisitsData();
		updateCampusVisitActionVisibility();
	}

	function removeCampusVisit(row, index) {
		vm.campusVisits.splice(index, 1);
		renumberCampusVisitRows();
		syncCampusVisitsData();
		updateCampusVisitActionVisibility();
	}

	function initializeCampusVisits() {
		var root = document.getElementById("campusVisitRows");
		var initialRow = campusVisitRows()[0];
		var restoredVisits;
		var visits;

		if (campusVisitsInitialized) {
			return;
		}

		restoredVisits = savedCampusVisits();
		visits =
			restoredVisits === null
				? [readInitialCampusVisit()]
				: restoredVisits;
		vm.campusVisits(visits);

		if (visits.length === 0) {
			initialRow.remove();
		} else {
			configureCampusVisitRow(initialRow, visits[0], 0);
			visits.slice(1).forEach(function restoreCampusVisit(visit, offset) {
				renderCampusVisit(visit, offset + 1);
			});
		}

		occFramework.repeatingGroups.create(root, {
			minRows: 1,
			onAdd: addCampusVisit,
			onRemove: removeCampusVisit,
		});
		campusVisitsInitialized = true;
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

	function campusLabel(value) {
		var campus = occFramework.options.campuses.bigFour.find(
			function findCampus(option) {
				return option.value === value;
			},
		);

		return campus ? campus.label : String(value || "");
	}

	function populateCampusVisitsSummary() {
		var values = vm.campusVisits().map(function summarizeVisit(visit) {
			return [
				campusLabel(visit.campus),
				visit.firstDay,
				visit.lastDay,
			];
		});

		vm.campusVisitsSummary(occFramework.utils.combineValues(values));
	}

	vm.onLoad = function onLoad(source, inputValues) {
		populateStateOptions();
		populateCampusOptions(document);
		initializeVisitDateValidation();
		initializeReviewInteractionGuard();
		applyWorkflowState();
	};

	vm.setDefaults = function setDefaults(source, inputValues) {
		initializeSignatureDate();
		initializeFormId();
	};

	vm.afterLoad = function afterLoad() {
		initializeCampusVisits();
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg && pkg.isExporting);
		validateAllVisitDateRanges();
		applyWorkflowState();
	};

	vm.onSubmit = function onSubmit(form) {
		populateCampusVisitsSummary();
	};

	vm.beforeRequired = function beforeRequired(form) {
		applyWorkflowState();
		validateAllVisitDateRanges();
		document.getElementById("csaTrainingAcknowledgment").checkValidity();
	};

	return vm;
});
