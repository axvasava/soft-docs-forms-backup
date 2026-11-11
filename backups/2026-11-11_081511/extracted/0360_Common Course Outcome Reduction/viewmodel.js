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
	var workflowReadonly = true;
	var selectedCourseCode = "";
	var selectedCourseLabel = "";
	var coursesPromise;

	function applyRequiredFields() {
		var required = isAtStart() && !packageValue("isExporting");
		occFramework.fields.required(
			document.getElementById("reductionReason"),
			required,
		);
		[
			"courseCodeSearch",
			"proposedCcoCount",
			"ballotYes",
			"ballotNo",
			"initiatorAcknowledgement",
		].forEach(function requireField(id) {
			occFramework.fields.required(
				document.getElementById(id).closest(".occ-field"),
				required,
			);
		});
	}

	function packageValue(name) {
		var value = pkg && pkg[name];
		return typeof value === "function" ? value() : value;
	}

	function isAtStart() {
		if (pkg && typeof pkg.isAtStep === "function") {
			return pkg.isAtStep("Start");
		}
		return (
			String(packageValue("stepCode") || "")
				.trim()
				.toLowerCase() === "start"
		);
	}

	vm.addObservableArray("currentCcos");
	vm.addObservableArray("proposedCcos");
	vm.currentCcos([]);
	vm.proposedCcos([]);

	function rowCount(value) {
		var count = Number(value);
		return Number.isSafeInteger(count) && count >= 0 ? count : null;
	}

	function syncCcos(group) {
		vm[group + "CcosData"](JSON.stringify(vm[group + "Ccos"]()));
	}

	function syncContentCcos(group) {
		if (packageValue("isExporting")) return;
		var value = vm[group + "Ccos"]()
			.map(function outcomeText(row) { return row.text; })
			.filter(function nonblank(text) { return text.trim() !== ""; })
			.join("  ");
		vm[group + "CCO"](value);
	}

	function renderCcos(group) {
		var list = document.getElementById(group + "CcoList");
		var title = group === "current" ? "Current" : "Proposed";
		list.replaceChildren();

		vm[group + "Ccos"]().forEach(function renderOutcome(row, index) {
			var field = document.createElement("div");
			var label = document.createElement("label");
			var input = document.createElement("textarea");
			var error = document.createElement("p");
			field.className = "occ-field";
			label.className = "occ-label";
			input.id = group + "Cco-" + index;
			input.name = group + "Cco[" + index + "]";
			input.maxLength = 1024;
			input.required = validationActive();
			input.readOnly = workflowReadonly;
			input.className = "occ-textarea";
			input.setAttribute("data-notsaved", "");
			error.id = input.id + "Error";
			error.className = "occ-error";
			error.hidden = true;
			input.setAttribute("aria-describedby", group + "CcoHelp " + error.id);
			input.value = row.text;
			label.htmlFor = input.id;
			label.textContent = title + " CCO " + (index + 1);
			input.addEventListener("input", function updateOutcome() {
				row.text = input.value;
				vm[group + "Ccos"].valueHasMutated();
				syncCcos(group);
				if (!error.hidden) validateCcoRow(group, index);
			});
			field.append(label, input, error);
			list.appendChild(field);
			occFramework.fields.required(field, validationActive());
		});
	}

	function validateCcoRow(group, index) {
		var input = document.getElementById(group + "Cco-" + index);
		var title = group === "current" ? "Current" : "Proposed";
		input.required = validationActive();
		return showValidation(input.id, input.value.trim() ? "" :
			"Enter " + title + " CCO " + (index + 1) + ".");
	}

	function validateCcoRows() {
		var valid = true;
		["current", "proposed"].forEach(function validateCollection(group) {
			vm[group + "Ccos"]().forEach(function validateOutcome(row, index) {
				if (!validateCcoRow(group, index)) valid = false;
			});
		});
		return valid;
	}

	function resizeCcos(group, value) {
		var count = rowCount(value);
		if (count === null) return;

		var rows = vm[group + "Ccos"]().slice(0, count);
		while (rows.length < count) rows.push({ text: "" });
		vm[group + "Ccos"](rows);
		renderCcos(group);
		syncCcos(group);
	}

	function restoreCcos(group) {
		var saved = vm[group + "CcosData"]();
		var rows = [];
		if (saved) {
			try {
				var parsed = JSON.parse(saved);
				if (
					Array.isArray(parsed) &&
					parsed.every(function isOutcome(row) {
						return row && typeof row.text === "string";
					})
				) {
					rows = parsed.map(function restoreOutcome(row) {
						return { text: row.text };
					});
				}
			} catch (error) {
				// Preserve an unreadable backing value; do not overwrite it on load.
			}
		} else {
			var count = rowCount(vm[group + "CcoCount"]());
			while (rows.length < (count || 0)) rows.push({ text: "" });
		}
		// Saved JSON wins over a conflicting count on reopen. Only subsequent
		// user changes resize it; restoration never truncates or rewrites JSON.
		vm[group + "Ccos"](rows);
		renderCcos(group);
	}

	function clearCourseDependents() {
		clearAcademicDean();
		[
			"courseTitle",
			"courseCredits",
			"courseDescription",
			"currentCcoCount",
			"proposedCcoCount",
		].forEach(function clearField(id) {
			vm[id]("");
		});
		resizeCcos("current", 0);
		resizeCcos("proposed", 0);
	}

	function clearAcademicDean() {
		vm.deanEmail("");
	}

	function loadAcademicDean(rawCourseCode) {
		clearAcademicDean();
		var subject = String(rawCourseCode || "").slice(0, 3);
		return integration
			.first("Etrieve_Integration_Get_Dean_Info_By_Subject", {
				Subject: subject,
			})
			.then(function populateAcademicDean(result) {
				console.log("[0360] Dean lookup result:", result);
				vm.deanEmail(
					result && result.Dean_Email != null
						? result.Dean_Email
						: "",
				);
			})
			.catch(function deanLookupFailed(error) {
				console.error("[0360] Dean lookup failed:", error);
			});
	}

	function courseDisplayCode(rawCourseCode) {
		return String(rawCourseCode || "").replace(
			/^([A-Za-z]{3})(\d+)$/,
			"$1-$2",
		);
	}

	function searchCourses(query) {
		if (workflowReadonly) return Promise.resolve([]);
		if (!coursesPromise) {
			// No request parameter contract is documented for this source.
			coursesPromise = integration
				.all("OIE_Get_Courses", {})
				.catch(function retryLater(error) {
					coursesPromise = null;
					throw error;
				});
		}
		return coursesPromise.then(function matchCourses(records) {
			// These two properties are established by working Form 0070's
			// OIE_Get_Courses labelMask/formFields and confirmed runtime results.
			return records
				.map(function courseOption(record) {
					return {
						value: String(record.CoursePrefixNumber || ""),
						label: [
							courseDisplayCode(record.CoursePrefixNumber),
							record.Title,
						]
							.filter(Boolean)
							.join(" - "),
						data: record,
					};
				})
				.filter(function matches(option) {
					return (
						option.value &&
						(option.label
							.toLowerCase()
							.includes(query.toLowerCase()) ||
							option.value
								.toLowerCase()
								.includes(query.toLowerCase()))
					);
				});
		});
	}

	function initializeCourseAutocomplete() {
		selectedCourseCode = String(vm.courseCode() || "");
		var autocomplete = occFramework.autocomplete.create(
			"#courseAutocomplete",
			{
				minLength: 1,
				search: searchCourses,
				onSelect: function commitCourse(item) {
					if (workflowReadonly) return;
					var course = item.data;
					selectedCourseLabel = item.label;
					if (item.value !== selectedCourseCode)
						clearCourseDependents();
					selectedCourseCode = item.value;
					vm.courseCode(course.CoursePrefixNumber);
					vm.courseTitle(course.Title);
					vm.courseCredits(course.CourseCredits);
					vm.courseDescription(
						course.CourseDesc == null ? "" : course.CourseDesc,
					);
					console.log("Course selected:", course.CoursePrefixNumber);
					loadAcademicDean(course.CoursePrefixNumber);
					validateCourse();
					console.log(
						"[0360] OIE_Get_Courses selected result:",
						item.data,
					);
				},
				onClear: function clearCourse() {
					if (workflowReadonly) return;
					selectedCourseCode = "";
					vm.courseCode("");
					clearCourseDependents();
					validateCourse();
				},
			},
		);
		if (selectedCourseCode) {
			selectedCourseLabel = courseDisplayCode(selectedCourseCode);
			// Adopt the saved scalar without a lookup or selection side effects.
			autocomplete.restore({
				value: selectedCourseCode,
				label: selectedCourseLabel,
			});
		}
	}

	function applyReason(clearInactive) {
		var selected = document.querySelector(
			'input[name="reductionReason"]:checked',
		);
		var reason = selected ? selected.value : "";
		var taxonomyActive = reason === "higherOrderThinking";
		var otherActive = reason === "other";
		document.getElementById("taxonomyUsedField").hidden = !taxonomyActive;
		document.getElementById("reductionReasonOtherField").hidden =
			!otherActive;
		if (clearInactive && !taxonomyActive) vm.taxonomyUsed("");
		if (clearInactive && !otherActive) vm.reductionReasonOther("");
	}

	function updateBallotTotal() {
		var total = ["ballotYes", "ballotNo", "ballotNoResponse"].reduce(
			function addVote(sum, id) {
				var votes = Number(vm[id]());
				return sum + (Number.isFinite(votes) ? votes : 0);
			},
			0,
		);
		vm.ballotTotal(String(total));
	}

	function activateChanges() {
		["ballotYes", "ballotNo", "ballotNoResponse"].forEach(function listenToBallotRange(id) {
			document.getElementById(id).addEventListener("input", function checkBallotRange() {
				validateBallotCount(id);
			});
		});
		document.getElementById("proposedCcoCount").addEventListener("input", function validateEnteredCount(event) {
			validateProposedCount(event.target.value);
		});
		vm.currentCcoCount.subscribe(function changeCurrentCount(value) {
			resizeCcos("current", value);
			validateProposedCount(vm.proposedCcoCount());
		});
		vm.proposedCcoCount.subscribe(function changeProposedCount(value) {
			resizeCcos("proposed", value);
			validateProposedCount(value);
		});
		vm.courseCredits.subscribe(function calculateCurrentCount(value) {
			var credits = Number(value);
			vm.currentCcoCount(
				value === "" || value == null || !Number.isFinite(credits)
					? ""
					: String(credits * 2),
			);
		});
		[
			"proposedCcoCount",
			"ballotYes",
			"ballotNo",
			"ballotNoResponse",
		].forEach(function listenToNumber(id) {
			document
				.getElementById(id)
				.addEventListener("input", function updateNumber(event) {
					var unchanged = vm[id]() === event.target.value;
					vm[id](event.target.value);
					if (id === "proposedCcoCount" && unchanged) {
						resizeCcos("proposed", event.target.value);
					}
				});
		});
		["ballotYes", "ballotNo", "ballotNoResponse"].forEach(
			function listenToBallot(id) {
				vm[id].subscribe(updateBallotTotal);
			},
		);
		document
			.getElementById("reductionReason")
			.addEventListener("change", function changeReason() {
				applyReason(true);
			});
	}

	vm.onLoad = function onLoad(source, inputValues) {};

	vm.setDefaults = function setDefaults(source, inputValues) {
		if (
			!packageValue("isExporting") &&
			user.isInLibrary &&
			!vm.academicYear()
		) {
			vm.academicYear(occFramework.utils.getAcademicYear());
		}
	};

	vm.afterLoad = function afterLoad() {
		if (initialized) return;
		var atStart = isAtStart();
		workflowReadonly = !atStart || !!packageValue("isExporting");
		// Subscribe after saved scalars load, before JSON restores the collections.
		["current", "proposed"].forEach(function watchContentCcos(group) {
			vm[group + "Ccos"].subscribe(function updateContentCcos() {
				syncContentCcos(group);
			});
		});
		restoreCcos("current");
		restoreCcos("proposed");
		applyReason(false);
		if (!workflowReadonly) updateBallotTotal();
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, !!packageValue("isExporting"));
		// Destructive subscriptions and selection callbacks are attached only
		// after both saved collections and scalar values have been restored.
		if (!workflowReadonly) activateChanges();
		initializeCourseAutocomplete();
		applyRequiredFields();
		document.querySelector(
			'[aria-labelledby="review-request-heading"]',
		).hidden = atStart;
		if (workflowReadonly) {
			occFramework.fields.readonly(
				document.querySelectorAll(
					"#commonCourseOutcomeReduction .occ-section:not(.developer)",
				),
				true,
			);
		}
		//document.querySelector('[aria-labelledby="acknowledgement-heading"]').hidden = !atStart; 
		initializeValidationCorrections();
		initialized = true;
	};

	function validationActive() {
		return isAtStart() && !packageValue("isExporting");
	}

	function showValidation(id, message) {
		var control = document.getElementById(id);
		var error = document.getElementById(id + "Error");
		if (!validationActive()) message = "";
		error.textContent = message;
		error.hidden = !message;
		if (message) control.setAttribute("aria-invalid", "true");
		else control.removeAttribute("aria-invalid");
		if (typeof control.setCustomValidity === "function") control.setCustomValidity(message);
		return !message;
	}

	function validateCourse() {
		var input = document.getElementById("courseCodeSearch");
		return showValidation("courseCodeSearch",
			vm.courseCode() && input.value && input.value === selectedCourseLabel
				? "" : "Select a course from the list.");
	}

	function validateProposedCount(value, requireBlank) {
		var control = document.getElementById("proposedCcoCount");
		var text = String(value == null ? control.value : value).trim();
		var message = "";
		if (control.validity.badInput || (text !== "" && (!Number.isInteger(Number(text)) || Number(text) < 1))) {
			message = "Enter a whole number of at least 1.";
		} else if (!text) {
			if (requireBlank) message = "Enter the proposed CCO count.";
		} else {
			var current = vm.currentCcoCount();
			if (current != null && String(current).trim() !== "" && Number.isFinite(Number(current)) && Number(text) > Number(current)) {
				message = "Proposed CCO count cannot be greater than the estimated CCO count.";
			}
		}
		return showValidation("proposedCcoCount", message);
	}

	function validateBallotCount(id, requireBlank) {
		var control = document.getElementById(id);
		var value = control.value.trim();
		var message = "";
		if (control.validity.badInput || (value !== "" && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 999))) {
			message = "Enter a whole number from 0 to 999.";
		} else if (!value && requireBlank && id !== "ballotNoResponse") {
			message = id === "ballotYes" ? "Enter the number of Yes votes." : "Enter the number of No votes.";
		}
		return showValidation(id, message);
	}

	function validateReason() {
		return showValidation("reductionReason", document.querySelector('input[name="reductionReason"]:checked') ? "" : "Select a reason for the reduction.");
	}

	function validateConditional(id, showError) {
		var selected = document.querySelector('input[name="reductionReason"]:checked');
		var reason = id === "taxonomyUsed" ? "higherOrderThinking" : "other";
		var required = validationActive() && selected && selected.value === reason;
		var control = document.getElementById(id);
		occFramework.fields.required(control.closest(".occ-field"), !!required);
		return showValidation(id, required && showError && !control.value.trim()
			? (id === "taxonomyUsed" ? "Enter the taxonomy used." : "Explain the reason for the reduction.") : "");
	}

	function validateAcknowledgement() {
		return showValidation("initiatorAcknowledgement", document.getElementById("initiatorAcknowledgement").checked ? "" : "Confirm the acknowledgement before submitting.");
	}

	function initializeValidationCorrections() {
		["taxonomyUsed", "reductionReasonOther"].forEach(function configureConditional(id) {
			validateConditional(id, false);
			if (!validationActive()) return;
			document.getElementById(id).addEventListener("input", function correctExplanation() {
				validateConditional(id, !document.getElementById(id + "Error").hidden);
			});
		});
		if (!validationActive()) return;
		document.getElementById("courseCodeSearch").addEventListener("input", validateCourse);
		document.getElementById("courseAutocomplete").addEventListener("focusout", function leaveCourse(event) {
			if (!this.contains(event.relatedTarget)) validateCourse();
		});
		document.getElementById("initiatorAcknowledgement").addEventListener("change", function correctAcknowledgement() {
			if (!document.getElementById("initiatorAcknowledgementError").hidden) validateAcknowledgement();
		});
		document.getElementById("reductionReason").addEventListener("change", function correctReason() {
			if (!document.getElementById("reductionReasonError").hidden) validateReason();
			["taxonomyUsed", "reductionReasonOther"].forEach(function updateConditional(id) {
				validateConditional(id, !document.getElementById(id + "Error").hidden);
			});
		});
	}

	function validateSubmission() {
		applyRequiredFields();
		var ccosValid = validateCcoRows();
		var valid = [validateCourse(), validateProposedCount(undefined, true),
			validateReason(), validateConditional("taxonomyUsed", true),
			validateConditional("reductionReasonOther", true),
			validateAcknowledgement(), validateBallotCount("ballotYes", true),
			validateBallotCount("ballotNo", true), validateBallotCount("ballotNoResponse", true)].every(Boolean);
		if (!valid || !ccosValid) throw new Error("Correct the highlighted fields before submitting.");
	}

	vm.onSubmit = function onSubmit(form) { validateSubmission(); };
	vm.onApprove = function onApprove(form) {};
	vm.onDecline = function onDecline(form) {};
	vm.beforeRequired = function beforeRequired(form) { validateSubmission(); };
	vm.afterRequired = function afterRequired(form) {};
	vm.onOptOut = function onOptOut(form) {};
	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
