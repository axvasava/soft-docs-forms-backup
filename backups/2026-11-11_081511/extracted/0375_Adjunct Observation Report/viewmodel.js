define([
	"jquery",
	"knockout",
	"vmBase",
	"integration",
	"notify",
	"user",
	"package",
	"https://webapps.oaklandcc.edu/cdn/occ-framework/occFramework.js",
	"./glAccounts.js",
	"https://softdocscdn.etrieve.cloud/extenders/extenders.min.js",
], function viewmodel(
	$,
	ko,
	vm,
	integration,
	notify,
	user,
	pkg,
	occFramework,
	glAccounts,
) {
	"use strict";

	var adjunctAutocomplete;
	var academicSelection;
	var academicPeriods = [];
	var academicPeriodsMessage = "";
	var selectedSectionSubject = "";
	var chairRequestGeneration = 0;
	var chairSelectionInitialized = false;
	var visibleCampusTitles = [];
	var chairResolution = "unresolved";
	var chairSelectionChanged = false;
	var chairErrorMessage = "";
	var campusNames = {
		A: "Auburn Hills",
		D: "Auburn Hills",
		X: "Auburn Hills",
		Y: "Auburn Hills",
		Z: "Auburn Hills",
		R: "Royal Oak",
		S: "Southfield",
		H: "Highland Lakes",
		O: "Orchard Ridge",
	};

	function deriveCampus(sectionCode) {
		if (!sectionCode) return "";
		var identifier = /^.+-([A-Za-z0-9]{5})$/.exec(sectionCode);
		return identifier
			? campusNames[identifier[1][0].toUpperCase()] || "Unknown"
			: "Unknown";
	}

	function updateChairErrors(campusMessage, chairMessage) {
		chairErrorMessage = chairMessage;
		var campus = document.getElementById("campus");
		[
			["campus-error", campusMessage],
			["departmentChair-error", chairMessage],
		].forEach(function showError(pair) {
			var error = document.getElementById(pair[0]);
			error.textContent = pair[1];
			error.hidden = !pair[1];
		});
		campus.setCustomValidity(campusMessage || chairMessage);
		if (campusMessage || chairMessage)
			campus.setAttribute("aria-invalid", "true");
		else campus.removeAttribute("aria-invalid");
	}

	function validCampus(title) {
		return (
			Object.keys(campusNames).some(function known(prefix) {
				return campusNames[prefix] === title;
			}) && visibleCampusTitles.includes(title)
		);
	}

	function chairFailure() {
		chairResolution = "failed";
		document.getElementById("departmentChair-status").textContent = "";
		updateChairErrors(
			"",
			"Department chair information could not be retrieved. Contact IT before submitting this form.",
		);
		notify(
			"error",
			"Unable to retrieve department chair information. Contact IT for assistance.",
		);
	}

	function lookupDepartmentChair() {
		var generation = chairRequestGeneration;
		var subject = selectedSectionSubject;
		var campusTitle = vm.campus();
		if (
			!pkg.isAtStep("Start") ||
			(pkg && pkg.isExporting) ||
			!vm.courseObserved() ||
			!subject ||
			!validCampus(campusTitle)
		)
			return;
		var campus =
			campusTitle === "Royal Oak" || campusTitle === "Southfield"
				? "Royal Oak/Southfield"
				: campusTitle;
		chairResolution = "pending";
		document.getElementById("departmentChair-status").textContent =
			"Loading Department Chair information\u2026";
		function current() {
			return (
				generation === chairRequestGeneration &&
				subject === selectedSectionSubject &&
				campusTitle === vm.campus() &&
				pkg.isAtStep("Start") &&
				!(pkg && pkg.isExporting)
			);
		}
		return Promise.resolve()
			.then(function retrieveChair() {
				if (!current()) return;
				return integration.all(
					"Etrieve_Integration_Get_Department_Chairs",
					{ Subject: subject, Campus: campus },
				);
			})
			.then(function populateChair(records) {
				if (!current()) return;
				var record =
					Array.isArray(records) && records.length === 1
						? records[0]
						: null;
				if (
					!record ||
					typeof record.Department_Chair !== "string" ||
					!record.Department_Chair.trim() ||
					typeof record.Department_Chair_Email !== "string" ||
					!record.Department_Chair_Email.trim()
				) {
					chairFailure();
					return;
				}
				vm.departmentChair(record.Department_Chair.trim());
				vm.departmentChairEmail(record.Department_Chair_Email.trim());
				chairResolution = "resolved";
				document.getElementById("departmentChair-status").textContent =
					"";
				updateChairErrors("", "");
			})
			.catch(function reportChairFailure() {
				if (current()) chairFailure();
			});
	}

	function setSectionSubject(subject) {
		if (!pkg.isAtStep("Start") || (pkg && pkg.isExporting)) return;
		chairRequestGeneration += 1;
		chairSelectionChanged = true;
		chairResolution = "unresolved";
		selectedSectionSubject =
			typeof subject === "string" ? subject.trim() : "";
		vm.departmentChair("");
		vm.departmentChairEmail("");
		document.getElementById("departmentChair-status").textContent = "";
		updateChairErrors("", "");
		var section = vm.courseObserved();
		var campus = deriveCampus(section);
		vm.campus(campus);
		if (!section) return;
		if (campus === "Unknown") {
			var message =
				"Unable to determine the campus for the selected section. Contact IT for assistance.";
			updateChairErrors(message, "");
			notify("error", message);
			return;
		}
		if (!validCampus(campus)) {
			updateChairErrors(
				"The selected section's campus is unavailable. Contact IT before submitting this form.",
				"",
			);
			return;
		}
		if (!selectedSectionSubject) {
			updateChairErrors(
				"The selected section's subject is unavailable. Select the section again before submitting.",
				"",
			);
			return;
		}
		lookupDepartmentChair();
	}

	function initializeChairSelection() {
		if (chairSelectionInitialized) return;
		// Trust complete saved resolution until a user changes its prerequisites. No lookup or value writes.
		if (
			vm.courseObserved() &&
			vm.departmentChair() &&
			String(vm.departmentChair()).trim() &&
			vm.departmentChairEmail() &&
			String(vm.departmentChairEmail()).trim()
		)
			chairResolution = "saved";
		chairSelectionInitialized = true;
	}

	function validateStartChair() {
		if (!pkg.isAtStep("Start") || (pkg && pkg.isExporting)) return;
		var campus = vm.campus();
		if (!validCampus(campus)) {
			var campusMessage =
				campus === "Unknown"
					? "Unable to determine the campus for the selected section. Contact IT for assistance."
					: "Select a section with an available campus before submitting this form.";
			updateChairErrors(campusMessage, "");
			throw new Error(campusMessage);
		}
		if (chairResolution === "pending")
			throw new Error(
				"Wait for Department Chair information to finish loading before submitting.",
			);
		if (
			!vm.courseObserved() ||
			(chairSelectionChanged && !selectedSectionSubject) ||
			!["saved", "resolved"].includes(chairResolution) ||
			!String(vm.departmentChair() || "").trim() ||
			!String(vm.departmentChairEmail() || "").trim()
		) {
			updateChairErrors(
				"",
				"Department chair information could not be retrieved. Contact IT before submitting this form.",
			);
			throw new Error(chairErrorMessage);
		}
	}

	function validPeriod(record) {
		return (
			record &&
			typeof record.code === "string" &&
			record.code.trim() &&
			typeof record.title === "string" &&
			record.title.trim()
		);
	}

	function populateNextPeriods(savedValue, normalSaved) {
		var select = document.getElementById("nextObservationDate");
		select.textContent = "";
		function append(code, title) {
			var option = document.createElement("option");
			option.value = code;
			option.textContent = title;
			select.appendChild(option);
			return option;
		}
		append("", "Choose a future term");
		academicPeriods
			.slice(2)
			.filter(validPeriod)
			.forEach(function appendPeriod(record) {
				append(record.code, record.title);
			});
		if (
			typeof savedValue === "string" &&
			savedValue &&
			!Array.prototype.some.call(
				select.options,
				function matches(option) {
					return option.value === savedValue;
				},
			)
		) {
			append(
				savedValue,
				normalSaved || (pkg && pkg.isExporting)
					? savedValue
					: savedValue + " (unavailable)",
			).disabled = true;
		}
	}

	function loadCampuses() {
		var help = document.getElementById("campus-help");
		visibleCampusTitles = [];
		help.className = "occ-help";
		help.textContent = "";
		if (pkg && pkg.isExporting) return;
		help.textContent = "Loading campus information\u2026";
		return Promise.resolve()
			.then(function retrieveCampuses() {
				return integration.all("Academic_Db_Lookup_Sites", {
					fields: "title,isHidden",
				});
			})
			.then(function retainCampusTitles(records) {
				if (!Array.isArray(records))
					throw new Error("Invalid campus response");
				visibleCampusTitles = records
					.filter(function visibleSite(record) {
						return (
							record &&
							record.isHidden === false &&
							typeof record.title === "string" &&
							record.title.trim()
						);
					})
					.map(function siteTitle(record) {
						return record.title.trim();
					});
				help.textContent = visibleCampusTitles.length
					? ""
					: "No visible campuses are currently available. Contact IT for assistance.";
			})
			.catch(function reportCampusFailure() {
				help.className = "occ-error";
				help.textContent =
					"Campus information could not be loaded. Try reopening the form.";
			});
	}

	function mapAdjunct(person) {
		if (!person || typeof person !== "object" || Array.isArray(person)) {
			return null;
		}
		if (!Array.isArray(person.names) || !person.names.length) return null;
		var name = person.names[0];
		if (!name || typeof name.fullName !== "string") return null;
		var fullName = name.fullName.trim();
		if (!fullName) return null;

		var email = "";
		if (person.emails != null) {
			if (!Array.isArray(person.emails)) return null;
			if (person.emails.length) {
				var firstEmail = person.emails[0];
				if (
					!firstEmail ||
					typeof firstEmail !== "object" ||
					Array.isArray(firstEmail)
				)
					return null;
				if (
					firstEmail.address != null &&
					typeof firstEmail.address !== "string"
				)
					return null;
				email = (firstEmail.address || "").trim();
			}
		}
		return {
			name: fullName,
			email: email,
			firstName: typeof name.firstName === "string" ? name.firstName : "",
			lastName: typeof name.lastName === "string" ? name.lastName : "",
		};
	}

	function initializeAdjunctLookup() {
		if (adjunctAutocomplete) return;
		var input = document.getElementById("adjunctSearch");
		var help = document.getElementById("adjunctEmpId-help");
		function showSelectionHelp(show) {
			help.hidden = !show;
			// Hidden help must also leave the accessible description after selection.
			var descriptions = (input.getAttribute("aria-describedby") || "")
				.split(/\s+/)
				.filter(function otherDescription(id) {
					return id && id !== help.id;
				});
			if (show) descriptions.push(help.id);
			if (descriptions.length)
				input.setAttribute("aria-describedby", descriptions.join(" "));
			else input.removeAttribute("aria-describedby");
		}
		adjunctAutocomplete = occFramework.autocomplete.create(
			"#adjunctAutocomplete",
			{
				minLength: 7,
				search: function searchAdjuncts(query) {
					var id = query.trim();
					if (!/^\d{7}$/.test(id)) return [];
					return integration
						.first("Person_Lookup_by_Colleague_Id", {
							colleagueId: id,
							preferredNameOnly: true,
							primaryEmailOnly: true,
							fields: "names,emails",
						})
						.then(function mapSuggestion(person) {
							if (person == null) return [];
							var adjunct = mapAdjunct(person);
							if (!adjunct)
								throw new Error(
									"Employee information could not be read.",
								);
							return [
								{
									label: id,
									value: id,
									description: adjunct.name,
									data: adjunct,
								},
							];
						});
				},
				onSelect: function selectAdjunct(item) {
					showSelectionHelp(false);
					vm.adjunctEmpId(item.value);
					vm.adjunctName(item.data.name);
					vm.adjunctEmail(item.data.email);
					vm.instructorFirstName(item.data.firstName);
					vm.instructorLastName(item.data.lastName);
					if (academicSelection) academicSelection.refresh();
				},
				onClear: function clearAdjunct() {
					showSelectionHelp(true);
					vm.adjunctEmpId("");
					vm.adjunctName("");
					vm.adjunctEmail("");
					vm.instructorFirstName("");
					vm.instructorLastName("");
					if (academicSelection) academicSelection.reset();
				},
			},
		);
		// Adopt the saved selection without querying or overwriting saved demographics.
		if (vm.adjunctEmpId()) {
			adjunctAutocomplete.restore({
				label: vm.adjunctEmpId(),
				value: vm.adjunctEmpId(),
			});
			showSelectionHelp(false);
		}
	}

	var deanSelectionInitialized = false;
	var deanLookupGeneration = 0;
	var assistantLookupGeneration = 0;
	var deanListMessage = "";
	var deanListFailed = false;

	function clearAcademicDean() {
		deanLookupGeneration += 1;
		assistantLookupGeneration += 1;
		vm.dropdownDean("");
		vm.deanEmail("");
		vm.admin("");
		vm.administrativeSpecialistEmail("");
	}

	function loadAdministrativeAssistant(dean) {
		var generation = ++assistantLookupGeneration;
		vm.admin("");
		vm.administrativeSpecialistEmail("");
		if (!dean || (pkg && pkg.isExporting)) return;
		function current() {
			return (
				generation === assistantLookupGeneration &&
				vm.dropdownDean() === dean &&
				!(pkg && pkg.isExporting)
			);
		}
		return Promise.resolve()
			.then(function retrieveAssistant() {
				if (!current()) return;
				return integration.first(
					"Etrieve_Integration_Get_Administrative_Assistant_By_Dean",
					{ Dean: dean },
				);
			})
			.then(function populateAssistant(record) {
				if (!current()) return;
				if (
					!record ||
					typeof record.Administrative_Specialist !== "string"
				) {
					showDeanMessage(
						"Administrative Assistant information is unavailable.",
						true,
					);
					return;
				}
				vm.admin(record.Administrative_Specialist);
				vm.administrativeSpecialistEmail(
					typeof record.Administrative_Specialist_Email === "string"
						? record.Administrative_Specialist_Email
						: "",
				);
			})
			.catch(function reportAssistantFailure(error) {
				if (!current()) return;
				showDeanMessage(
					"Administrative Assistant information could not be loaded. Reselect the Dean or subject to retry.",
					true,
				);
				console.error(
					"[0375] Administrative Assistant integration failed:",
					error,
				);
			});
	}

	function loadDeanBySubject(subjectCode) {
		if (pkg && pkg.isExporting) return;
		clearAcademicDean();
		if (typeof subjectCode !== "string" || !subjectCode.trim()) {
			showDeanMessage("No subject is available for Dean lookup.", true);
			return;
		}
		var generation = deanLookupGeneration;
		function current() {
			return (
				generation === deanLookupGeneration && !(pkg && pkg.isExporting)
			);
		}
		showDeanMessage("Loading Dean information\u2026", false);
		return Promise.resolve()
			.then(function retrieveDean() {
				if (!current()) return;
				return integration.first(
					"Etrieve_Integration_Get_Dean_Info_By_Subject",
					{ Subject: subjectCode },
				);
			})
			.then(function populateDean(record) {
				if (!current()) return;
				if (
					!record ||
					typeof record.Dean !== "string" ||
					!record.Dean.trim()
				) {
					showDeanMessage(
						"No Dean information was found for this subject.",
						true,
					);
					return;
				}
				var select = document.getElementById("dropdownDean");
				var option = Array.prototype.find.call(
					select.options,
					function match(item) {
						return item.value === record.Dean;
					},
				);
				if (!option)
					option = appendDeanOption(
						select,
						record.Dean,
						record.Dean,
						record,
					);
				option.disabled = false;
				option.deanRecord = record;
				vm.dropdownDean(record.Dean);
				vm.deanEmail(
					typeof record.Dean_Email === "string"
						? record.Dean_Email
						: "",
				);
				showDeanMessage("", false);
				return loadAdministrativeAssistant(record.Dean);
			})
			.catch(function reportDeanFailure() {
				if (current())
					showDeanMessage(
						"Dean information could not be loaded. Reselect the subject or section to retry.",
						true,
					);
			});
	}

	function showDeanMessage(message, failed) {
		var help = document.getElementById("dropdownDean-help");
		help.textContent = message;
		help.className = failed ? "occ-error" : "occ-help";
	}

	function appendDeanOption(select, value, label, record) {
		var option = document.createElement("option");
		option.value = value;
		option.textContent = label;
		option.deanRecord = record;
		select.appendChild(option);
		return option;
	}

	function loadDeans(inputValues) {
		var select = document.getElementById("dropdownDean");
		var savedDean = inputValues && inputValues.first("dropdownDean");
		select.textContent = "";
		appendDeanOption(select, "", "Choose a Dean");
		deanListMessage = "";
		deanListFailed = false;

		function retainSavedDean(exporting) {
			if (typeof savedDean !== "string" || !savedDean) return;
			var available = Array.prototype.some.call(
				select.options,
				function matches(option) {
					return option.value === savedDean;
				},
			);
			if (!available) {
				var option = appendDeanOption(
					select,
					savedDean,
					exporting ? savedDean : savedDean + " (unavailable)",
				);
				// Softdocs can restore this value, but users cannot select it anew.
				option.disabled = true;
			}
		}

		if (pkg && pkg.isExporting) {
			retainSavedDean(true);
			showDeanMessage("", false);
			return;
		}
		showDeanMessage("Loading Dean options\u2026", false);
		return Promise.resolve()
			.then(function retrieveDeans() {
				return integration.all(
					"Etrieve_Integration_Get_Distinct_Deans",
				);
			})
			.then(function populateDeans(records) {
				if (!Array.isArray(records))
					throw new Error("Invalid Dean list response");
				var count = 0;
				records.forEach(function appendDean(record) {
					if (
						!record ||
						typeof record.Dean !== "string" ||
						!record.Dean.trim()
					)
						return;
					appendDeanOption(select, record.Dean, record.Dean, record);
					count += 1;
				});
				deanListMessage = count
					? ""
					: "No Deans are currently available.";
			})
			.catch(function reportDeanFailure() {
				deanListMessage =
					"Dean options could not be loaded. Try reopening the form.";
				deanListFailed = true;
			})
			.then(function finishDeanOptions() {
				retainSavedDean(false);
				showDeanMessage(deanListMessage, deanListFailed);
			});
	}

	function initializeDeanSelection() {
		var select = document.getElementById("dropdownDean");
		occFramework.fields.readonly(select.closest(".occ-field"), true);
		function updateDeanFeedback() {
			var option = select.options[select.selectedIndex];
			var unavailable = option && option.value && !option.deanRecord;
			var message = deanListMessage;
			if (unavailable && !deanListFailed) {
				message =
					"The saved Dean is no longer available. Choose a current Dean when updating this selection.";
			}
			showDeanMessage(
				pkg && pkg.isExporting ? "" : message,
				deanListFailed,
			);
		}
		updateDeanFeedback();
		if (deanSelectionInitialized) return;
		select.addEventListener("change", function selectDean() {
			deanLookupGeneration += 1;
			assistantLookupGeneration += 1;
			if (pkg && pkg.isExporting) return;
			vm.admin("");
			vm.administrativeSpecialistEmail("");
			var selectedDean = select.value;
			var option = select.options[select.selectedIndex];
			if (option && option.disabled) return;
			vm.dropdownDean(selectedDean);
			vm.deanEmail(
				option &&
					option.deanRecord &&
					typeof option.deanRecord.Dean_Email === "string"
					? option.deanRecord.Dean_Email
					: "",
			);
			updateDeanFeedback();
			if (!selectedDean || !option || !option.deanRecord) return;

			loadAdministrativeAssistant(selectedDean);
		});
		deanSelectionInitialized = true;
	}

	function loadAcademicPeriods(inputValues) {
		var select = document.getElementById("term");
		occFramework.fields.readonly(select.closest(".occ-field"), true);
		var help = document.getElementById("term-help");
		var savedTerm = inputValues && inputValues.first("term");
		var savedNextPeriod =
			inputValues && inputValues.first("nextObservationDate");
		var normalSaved =
			inputValues &&
			inputValues.first("dropdownRecommendation") ===
				"Normal (Every 3 years or 6 semesters)";
		academicPeriods = [];
		academicPeriodsMessage = "";
		var exporting = Boolean(pkg && pkg.isExporting);
		select.textContent = "";

		function appendOption(value, label) {
			var option = document.createElement("option");
			option.value = value;
			option.textContent = label;
			select.appendChild(option);
			return option;
		}
		function retainSavedTerm() {
			if (typeof savedTerm !== "string" || !savedTerm) return;
			var available = Array.prototype.some.call(
				select.options,
				function matches(option) {
					return option.value === savedTerm;
				},
			);
			if (!available) {
				appendOption(
					savedTerm,
					exporting ? savedTerm : savedTerm + " (unavailable)",
				).disabled = true;
			}
		}
		appendOption("", "Choose a term");
		help.className = "occ-help";
		help.textContent = "";
		if (exporting) {
			retainSavedTerm();
			populateNextPeriods(savedNextPeriod, normalSaved);
			return;
		}
		help.textContent = "Loading academic periods\u2026";
		return Promise.resolve()
			.then(function retrievePeriods() {
				return integration.all("Academic_Db_Academic_Periods", {
					current: true,
					previous: true,
					future: true,
					fields: "code,title",
				});
			})
			.then(function populatePeriods(records) {
				if (!Array.isArray(records))
					throw new Error("Invalid academic period response");
				var count = 0;
				academicPeriods = records;
				records.slice(0, 2).forEach(function appendPeriod(record) {
					if (
						!record ||
						typeof record.code !== "string" ||
						!record.code.trim() ||
						typeof record.title !== "string" ||
						!record.title.trim()
					)
						return;
					appendOption(record.code, record.title);
					count += 1;
				});
				help.textContent = count
					? ""
					: "No academic periods are currently available. Try reopening the form later.";
			})
			.catch(function reportPeriodFailure() {
				help.className = "occ-error";
				help.textContent =
					"Academic periods could not be loaded. Try reopening the form.";
				academicPeriodsMessage =
					"Academic periods could not be loaded. Try reopening the form.";
			})
			.then(function finishPeriods() {
				retainSavedTerm();
				populateNextPeriods(savedNextPeriod, normalSaved);
			});
	}

	function initializeAcademicSelection() {
		if (academicSelection || (pkg && pkg.isExporting)) return;
		var term = document.getElementById("term");
		var instructor = document.getElementById("instructorSection");
		var notice = document.getElementById("instructorSectionStatus");
		var manualToggle = document.getElementById("findAnotherSection");
		var manualRow = document.getElementById("manualSectionRow");
		var manualStatus = document.getElementById("manualSectionStatus");
		var title = document.getElementById("selectedSectionTitle");
		var instructorGeneration = 0;
		var manualGeneration = 0;
		var mode = "saved";
		var subject = null;
		var course = null;
		var subjectRequest = null;
		var courseRequest = null;
		var subjectControl, courseControl, sectionControl;
		var sectionRequest = null;

		function updateRequiredSelection() {
			var manual = manualToggle.checked;
			occFramework.fields.required(
				instructor.closest(".occ-field"),
				!manual,
			);
			["sectionSubject", "sectionCourse", "manualSection"].forEach(
				function requireManualSelection(id) {
					var input = document.getElementById(id + "Search");
					occFramework.fields.required(
						input.closest(".occ-field"),
						manual,
					);
					// Reevaluate commitment immediately when required state changes.
					input.setCustomValidity(
						manual &&
							input.value &&
							!document.getElementById(id + "Value").value
							? "Choose a value from the suggestions."
							: "",
					);
				},
			);
		}

		function updateTermState() {
			var ready = Boolean(
				vm.adjunctEmpId() &&
				String(vm.instructorFirstName() || "").trim() &&
				String(vm.instructorLastName() || "").trim(),
			);
			occFramework.fields.readonly(term.closest(".occ-field"), !ready);
			document.getElementById("term-instructor-help").hidden = ready;
		}

		function allowed() {
			return !(pkg && pkg.isExporting);
		}
		function clearTitle() {
			title.textContent = "";
			title.hidden = true;
		}
		function updateManualLocks() {
			occFramework.fields.readonly(
				document
					.getElementById("sectionCourseSearch")
					.closest(".occ-field"),
				!subject,
			);
			occFramework.fields.readonly(
				document
					.getElementById("manualSectionSearch")
					.closest(".occ-field"),
				!(subject && course),
			);
		}
		function clearSection() {
			vm.courseObserved("");
			setSectionSubject("");
			sectionControl.clear({ notify: false });
			sectionRequest = null;
			clearTitle();
		}
		function clearCourse() {
			courseControl.clear({ notify: false });
			course = null;
			updateManualLocks();
			courseRequest = null;
			clearSection();
		}
		function clearManual() {
			clearAcademicDean();
			manualGeneration += 1;
			subjectControl.clear({ notify: false });
			subject = null;
			subjectRequest = null;
			clearCourse();
		}
		function clearInstructor() {
			occFramework.fields.readonly(
				instructor.closest(".occ-field"),
				true,
			);
			instructor.textContent = "";
			var option = document.createElement("option");
			option.value = "";
			option.textContent = "Choose a section";
			instructor.appendChild(option);
		}
		function reset() {
			updateTermState();
			instructorGeneration += 1;
			clearInstructor();
			clearManual();
			notice.textContent =
				"Select an adjunct and term to load instructor sections.";
			manualStatus.textContent = term.value
				? "Choose a subject."
				: "Choose a term before searching.";
		}
		function activateManual() {
			manualToggle.checked = true;
			manualRow.hidden = false;
			updateRequiredSelection();
			if (!allowed() || mode === "manual") return;
			mode = "manual";
			instructor.value = "";
			clearManual();
			if (term.value)
				loadSubjects().catch(function ignoreReportedError() {});
		}
		function usable(record) {
			return (
				record &&
				typeof record.code === "string" &&
				record.code.trim() &&
				typeof record.title === "string" &&
				record.title.trim()
			);
		}
		function manualRequest(source, params) {
			var generation = manualGeneration;
			var period = term.value;
			manualStatus.textContent = "Loading options\u2026";
			return Promise.resolve()
				.then(function requestOptions() {
					if (
						generation !== manualGeneration ||
						period !== term.value ||
						!allowed()
					)
						return [];
					return integration.all(source, params);
				})
				.then(function validateOptions(records) {
					if (
						generation !== manualGeneration ||
						period !== term.value ||
						!allowed()
					)
						return [];
					if (!Array.isArray(records))
						throw new Error("Invalid academic options response");
					var items = records.filter(usable);
					manualStatus.textContent = items.length
						? ""
						: "No options found for this selection.";
					return items;
				})
				.catch(function reportOptionsError(error) {
					if (
						generation !== manualGeneration ||
						period !== term.value ||
						!allowed()
					)
						return [];
					manualStatus.textContent =
						"Options could not be loaded. Clear and reselect the prerequisite to retry.";
					throw error;
				});
		}
		function loadSubjects() {
			if (!subjectRequest)
				subjectRequest = manualRequest("Academic_Db_Lookup_Subjects", {
					academicPeriod: term.value,
					fields: "code,title",
				});
			return subjectRequest;
		}
		function suggestions(request, query, sectionOnly) {
			return request.then(function filterOptions(records) {
				return records
					.filter(function matches(record) {
						return (record.code + " " + record.title)
							.toLowerCase()
							.includes(query.toLowerCase());
					})
					.map(function suggestion(record) {
						return {
							label: sectionOnly
								? record.code
								: record.code + " - " + record.title,
							value: record.code,
							data: record,
						};
					});
			});
		}
		subjectControl = occFramework.autocomplete.create(
			"#sectionSubjectAutocomplete",
			{
				minLength: 0,
				search: function searchSubjects(query) {
					if (!allowed() || !term.value || mode !== "manual")
						return [];
					return suggestions(loadSubjects(), query, false);
				},
				onSelect: function selectSubject(item) {
					manualGeneration += 1;
					clearCourse();
					subject = item.data;
					loadDeanBySubject(subject.code);
					updateManualLocks();
					courseRequest = manualRequest(
						"Academic_Db_Lookup_Courses",
						{
							academicPeriod: term.value,
							subject: subject.code,
							fields: "code,title,courseNumber",
						},
					);
					courseRequest.catch(function ignoreReportedError() {});
				},
				onClear: function clearSubject() {
					clearAcademicDean();
					manualGeneration += 1;
					subject = null;
					clearCourse();
				},
			},
		);
		courseControl = occFramework.autocomplete.create(
			"#sectionCourseAutocomplete",
			{
				minLength: 0,
				search: function searchCourses(query) {
					if (!allowed() || !subject || !courseRequest) return [];
					return suggestions(
						courseRequest.then(function usableCourses(records) {
							return records.filter(function hasNumber(record) {
								return (
									(typeof record.courseNumber === "string" &&
										record.courseNumber.trim()) ||
									(typeof record.courseNumber === "number" &&
										Number.isFinite(record.courseNumber))
								);
							});
						}),
						query,
						false,
					);
				},
				onSelect: function selectCourse(item) {
					manualGeneration += 1;
					clearSection();
					course = item.data;
					updateManualLocks();
					sectionRequest = manualRequest(
						"Academic_Db_Lookup_Sections",
						{
							academicPeriod: term.value,
							subject: subject.code,
							courseNumber: course.courseNumber,
							fields: "code,title",
						},
					);
					sectionRequest.catch(function ignoreReportedError() {});
				},
				onClear: function clearSelectedCourse() {
					manualGeneration += 1;
					course = null;
					updateManualLocks();
					clearSection();
				},
			},
		);
		sectionControl = occFramework.autocomplete.create(
			"#manualSectionAutocomplete",
			{
				minLength: 0,
				search: function searchSections(query) {
					if (!allowed() || !course || !sectionRequest) return [];
					return suggestions(sectionRequest, query, true);
				},
				onSelect: function selectManualSection(item) {
					instructor.value = "";
					vm.courseObserved(item.value);
					setSectionSubject(subject && subject.code);
					title.textContent = item.data.title;
					title.hidden = false;
				},
				onClear: function clearSelectedSection() {
					vm.courseObserved("");
					setSectionSubject("");
					clearTitle();
				},
			},
		);
		function refresh() {
			if (!allowed()) return;
			reset();
			var period = term.value;
			var first = vm.instructorFirstName();
			var last = vm.instructorLastName();
			if (mode === "manual" && period)
				loadSubjects().catch(function ignoreReportedError() {});
			if (
				!period ||
				!String(first || "").trim() ||
				!String(last || "").trim()
			)
				return;
			var generation = instructorGeneration;
			notice.textContent = "Loading instructor sections\u2026";
			function current() {
				return (
					allowed() &&
					generation === instructorGeneration &&
					term.value === period &&
					vm.instructorFirstName() === first &&
					vm.instructorLastName() === last
				);
			}
			Promise.resolve()
				.then(function lookupInstructor() {
					if (!current()) return;
					return integration.first("Academic_Db_Lookup_Instructors", {
						instructorLastName: last,
						instructorFirstName: first,
						academicPeriod: period,
						fields: "code,title,subjectCode,instructorFirstName,instructorLastName",
					});
				})
				.then(function showInstructorSections(response) {
					if (!current()) return;
					if (
						!response ||
						!Number.isInteger(response.totalCount) ||
						response.totalCount < 0 ||
						(response.totalCount > 0 &&
							!Array.isArray(response.items))
					)
						throw new Error("Invalid instructor response");
					var sections = [];
					(response.totalCount === 0 ? [] : response.items).forEach(
						function collectSections(item) {
							if (item && Array.isArray(item.sections))
								sections = sections.concat(
									item.sections.filter(
										function usableInstructorSection(
											section,
										) {
											return (
												usable(section) &&
												typeof section.subjectCode ===
													"string" &&
												section.subjectCode.trim()
											);
										},
									),
								);
						},
					);
					sections.forEach(function appendSection(section) {
						var option = document.createElement("option");
						option.sectionRecord = section;
						option.value = section.code;
						option.textContent =
							section.code + " - " + section.title;
						instructor.appendChild(option);
					});
					occFramework.fields.readonly(
						instructor.closest(".occ-field"),
						!sections.length,
					);
					notice.textContent = sections.length
						? response.totalCount > 1
							? "Sections from multiple matching instructors are shown. Verify the section before selecting."
							: "Choose the section you observed."
						: response.totalCount > 0
							? "No usable instructor sections were returned. Use Find Another Section to search manually."
							: typeof response.message === "string" &&
								  response.message.trim()
								? response.message
								: "No instructor sections found. Find another section below.";
					if (response.totalCount === 0) {
						activateManual();
					}
				})
				.catch(function reportInstructorError() {
					if (!current()) return;
					notice.textContent =
						"Instructor sections could not be loaded. Use Find another section.";
				});
		}
		term.addEventListener("change", refresh);
		manualToggle.addEventListener("change", function toggleManual() {
			if (!allowed()) return;
			if (manualToggle.checked) activateManual();
			else {
				mode = "instructor";
				manualRow.hidden = true;
				clearManual();
				instructor.value = "";
			}
			updateRequiredSelection();
		});
		instructor.addEventListener(
			"change",
			function selectInstructorSection() {
				if (!allowed()) return;
				var selected = instructor.value;
				mode = "instructor";
				clearManual();
				manualToggle.checked = false;
				manualRow.hidden = true;
				updateRequiredSelection();
				vm.courseObserved(selected);
				var selectedOption =
					instructor.options[instructor.selectedIndex];
				setSectionSubject(
					selectedOption &&
						selectedOption.sectionRecord &&
						selectedOption.sectionRecord.subjectCode,
				);
				if (selectedOption && selectedOption.sectionRecord) {
					title.textContent = selectedOption.sectionRecord.title;
					title.hidden = false;
				}
				loadDeanBySubject(
					selectedOption &&
						selectedOption.sectionRecord &&
						selectedOption.sectionRecord.subjectCode,
				);
			},
		);
		updateTermState();
		updateManualLocks();
		updateRequiredSelection();
		if (vm.courseObserved()) {
			// Represent an existing saved code without guessing its original selection method.
			var savedSection = document.createElement("option");
			savedSection.value = vm.courseObserved();
			savedSection.textContent = vm.courseObserved();
			instructor.appendChild(savedSection);
			instructor.value = vm.courseObserved();
		}
		occFramework.fields.readonly(instructor.closest(".occ-field"), true);
		// Adopt ordinary saved fields without resetting selections or starting requests.
		academicSelection = { reset: reset, refresh: refresh };
	}

	var glAccountsInitialized = false;

	function initializeGlAccounts() {
		if (glAccountsInitialized) return;
		var department = document.getElementById("dropdown_2");
		var academicDepartment = document.getElementById("academicDepartment");
		var departmentField = department.closest(".occ-field");
		var academicField = academicDepartment.closest(".occ-field");
		var departmentAccounts = glAccounts.departmentAccounts;
		var academicAccounts = glAccounts.academicAccounts;
		var initialCategory = document.querySelector(
			'input[name="pleaseSelectStatus"]:checked',
		);
		var previousCategory = initialCategory ? initialCategory.value : "";
		function clearDepartmentError(control, field) {
			control.setCustomValidity("");
			control.removeAttribute("aria-invalid");
			field
				.querySelectorAll(".occ-error")
				.forEach(function clearError(error) {
					error.textContent = "";
					error.hidden = true;
				});
		}
		function updateGlAccount(recalculate) {
			var category = document.querySelector(
				'input[name="pleaseSelectStatus"]:checked',
			);
			var teaching = category && category.value === "Teaching adjunct";
			var nonTeaching =
				category && category.value === "Non-teaching adjunct";
			occFramework.fields[nonTeaching ? "show" : "hide"](departmentField);
			document.getElementById("observationAttachmentNotice").hidden = !(
				pkg.isAtStep("Start") && nonTeaching
			);
			occFramework.fields[teaching ? "show" : "hide"](academicField);
			occFramework.fields.required(departmentField, Boolean(nonTeaching));
			occFramework.fields.required(academicField, false);
			if (!nonTeaching) clearDepartmentError(department, departmentField);
			if (!teaching)
				clearDepartmentError(academicDepartment, academicField);
			if (recalculate && !(pkg && pkg.isExporting)) {
				vm.glAccountNumber(
					nonTeaching
						? departmentAccounts[department.value] || ""
						: teaching
							? academicAccounts[academicDepartment.value] || ""
							: "",
				);
			}
		}
		updateGlAccount(false);
		if (!(pkg && pkg.isExporting)) {
			document
				.getElementById("pleaseSelectStatus")
				.addEventListener("change", function changeCategory() {
					var selected = document.querySelector(
						'input[name="pleaseSelectStatus"]:checked',
					);
					var category = selected ? selected.value : "";
					if (category === previousCategory) return;
					previousCategory = category;
					if (category === "Teaching adjunct") vm.dropdown_2("");
					else if (category === "Non-teaching adjunct")
						vm.academicDepartment("");
					updateGlAccount(true);
				});
			department.addEventListener("change", function changeDepartment() {
				var category = document.querySelector(
					'input[name="pleaseSelectStatus"]:checked',
				);
				if (category && category.value === "Non-teaching adjunct")
					updateGlAccount(true);
			});
			academicDepartment.addEventListener(
				"change",
				function changeAcademicDepartment() {
					var category = document.querySelector(
						'input[name="pleaseSelectStatus"]:checked',
					);
					if (category && category.value === "Teaching adjunct")
						updateGlAccount(true);
				},
			);
		}
		glAccountsInitialized = true;
	}

	var nextObservationInitialized = false;

	function initializeNextObservation() {
		if (nextObservationInitialized) return;
		var recommendation = document.getElementById("dropdownRecommendation");
		var term = document.getElementById("term");
		var result = document.getElementById("nextObservationDate");
		var help = document.getElementById("nextObservationDate-help");
		var normal = "Normal (Every 3 years or 6 semesters)";
		function updateResult(recalculate) {
			var other = recommendation.value === "Other";
			var isNormal = recommendation.value === normal;
			occFramework.fields.readonly(
				result.closest(".occ-field"),
				!other || Boolean(pkg && pkg.isExporting),
			);
			occFramework.fields.required(
				result.closest(".occ-field"),
				other || isNormal,
			);
			result.setCustomValidity("");
			result.removeAttribute("aria-invalid");
			help.textContent = other
				? academicPeriodsMessage ||
					(!academicPeriods.slice(2).some(validPeriod)
						? "No future academic periods are available. Try reopening the form."
						: "")
				: "";
			if (!recalculate || (pkg && pkg.isExporting)) return;
			populateNextPeriods();
			var value = "";
			if (isNormal) {
				var period = /^(\d{4})\/([^/\s]+)$/.exec(term.value);
				if (period) {
					value = Number(period[1]) + 3 + "/" + period[2];
					var option = document.createElement("option");
					option.value = value;
					option.textContent = value;
					result.appendChild(option);
				} else {
					help.textContent =
						"Choose a valid term to calculate the next observation period.";
					result.setCustomValidity(help.textContent);
					result.setAttribute("aria-invalid", "true");
				}
			} else if (other && !academicPeriods.slice(2).some(validPeriod)) {
				help.textContent =
					academicPeriodsMessage ||
					"No future academic periods are available. Try reopening the form.";
			}
			vm.nextObservationDate(value);
		}
		// Softdocs has already restored the saved period or historical ISO value.
		updateResult(false);
		if (!(pkg && pkg.isExporting)) {
			recommendation.addEventListener(
				"change",
				function changeRecommendation() {
					updateResult(true);
				},
			);
			term.addEventListener("change", function changeObservationTerm() {
				updateResult(true);
			});
		}
		nextObservationInitialized = true;
	}

	function applyWorkflowState() {
		var exporting = Boolean(pkg && pkg.isExporting);
		var hourlyReviewStep = pkg.isAtStep("WFHRPTHourlyReviewers");
		var deanStep = pkg.isAtStep("ConditionalActorGetDean");
		var adminStep = pkg.isAtStep(
			"ConditionalActorGetAdministrativeSpecialist",
		);
		[
			"observer-heading",
			"adjunct-heading",
			"observation-heading",
			"assessment-heading",
			"dean-use-heading",
			"admin-heading",
		].forEach(function applySectionState(heading) {
			var section = document.querySelector(
				'[aria-labelledby="' + heading + '"]',
			);
			var deanSection = heading === "dean-use-heading";
			var adminSection = heading === "admin-heading";
			section.hidden =
				!exporting &&
				(!hourlyReviewStep || adminSection) &&
				(deanSection
					? !(deanStep || adminStep)
					: adminSection
						? !adminStep
						: false);
			var locked =
				exporting ||
				hourlyReviewStep ||
				(adminStep && !adminSection) ||
				(deanStep && !deanSection && !adminSection);
			if (locked) {
				occFramework.fields.readonly(section, true);
				// Autocomplete clear buttons are outside fields.readonly's control targets.
				section
					.querySelectorAll(".occ-autocomplete__clear")
					.forEach(function lockClearButton(button) {
						button.disabled = true;
					});
			}
		});
	}

	vm.onLoad = function onLoad(source, inputValues) {
		return Promise.all([
			loadDeans(inputValues),
			loadAcademicPeriods(inputValues),
			loadCampuses(),
		]);
	};

	vm.setDefaults = function setDefaults(source, inputValues) {};

	vm.afterLoad = function afterLoad() {
		if (!(pkg && pkg.isExporting)) {
			var today = new Date();
			document.getElementById("observationDate").max =
				today.getFullYear() +
				"-" +
				String(today.getMonth() + 1).padStart(2, "0") +
				"-" +
				String(today.getDate()).padStart(2, "0");
		}
		occFramework.init(document);
		initializeAdjunctLookup();
		initializeDeanSelection();
		initializeAcademicSelection();
		initializeChairSelection();
		initializeGlAccounts();
		initializeNextObservation();
		applyWorkflowState();
		occFramework.developerVisibility.apply(document, user);
		if (pkg && pkg.isExporting) {
			document.querySelector(
				'[aria-labelledby="developer-heading"]',
			).hidden = true;
		}
		occFramework.exportMode.set(document, pkg && pkg.isExporting);
	};

	var advancingWithAttachments = false;

	function validateAdminAttachment(form) {
		if (
			!pkg.isAtStep("ConditionalActorGetAdministrativeSpecialist") ||
			(pkg && pkg.isExporting)
		)
			return;
		var savedCount = vm.preAdminAttachmentCount();
		var previous = Number(savedCount);
		var current = Number(form && form.attachmentCount);
		if (
			savedCount == null ||
			String(savedCount).trim() === "" ||
			!Number.isInteger(previous) ||
			previous < 0
		) {
			throw new Error(
				"The previous attachment count is unavailable. Return the form to the preceding step before approving.",
			);
		}
		if (!Number.isInteger(current) || current <= previous) {
			throw new Error(
				"Please attach the observer's load report before approving.",
			);
		}
	}

	vm.onSubmit = function onSubmit(form) {
		advancingWithAttachments = false;
		validateStartChair();
		validateAdminAttachment(form);
		advancingWithAttachments = true;
	};

	vm.onApprove = function onApprove(form) {
		advancingWithAttachments = false;
		validateStartChair();
		validateAdminAttachment(form);
		advancingWithAttachments = true;
	};

	vm.onDecline = function onDecline(form) {
		advancingWithAttachments = false;
	};

	vm.beforeRequired = function beforeRequired(form) {};

	vm.afterRequired = function afterRequired(form) {
		if (!advancingWithAttachments || (pkg && pkg.isExporting)) return;
		if (pkg.isAtStep("Start") || pkg.isAtStep("ConditionalActorGetDean")) {
			var count = Number(form && form.attachmentCount);
			if (!Number.isInteger(count) || count < 0)
				throw new Error(
					"The attachment count could not be read. Reopen the form and try again.",
				);
			vm.preAdminAttachmentCount(String(count));
		}
	};

	vm.onOptOut = function onOptOut(form) {};

	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
