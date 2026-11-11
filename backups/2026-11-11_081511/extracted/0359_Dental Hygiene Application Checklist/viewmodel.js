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

	var studentAutocomplete;
	var studentSelectionVersion = 0;
	// Autocomplete commits studentID before onSelect; retain the GPA owner separately.
	var gpaStudentID = "";
	var studentInformationLoading = false;
	var startRequirements = {
		studentID: "studentSearch",
		diplomaOrGedDocumentationAttached: "diplomaOrGedDocumentationAttached",
		dhyCurriculumDesignation: "dhyCurriculumDesignation",
		informationSessionAttended: "informationSessionAttended",
		informationSessionAssessmentDate: "informationSessionAssessmentDate",
		observationDocumentationAttached: "observationDocumentationAttached",
		jobShadowingDocumentationAttached: "jobShadowingDocumentationAttached",
	};

	function validateStartRequirement(id) {
		var control = document.getElementById(startRequirements[id]);
		var error = document.getElementById(control.id + "Error");
		var valid =
			id === "studentID"
				? String(vm.studentID() || "").trim() !== ""
				: id === "informationSessionAssessmentDate"
					? assessmentCalendarDate(vm[id]()) !== ""
					: control.checked;
		error.hidden = valid;
		control.setCustomValidity(valid ? "" : error.textContent);
		if (valid) control.removeAttribute("aria-invalid");
		else control.setAttribute("aria-invalid", "true");
		return valid;
	}
	var supportiveCourseFields = {
		"BIO-1570": "bio1570Result",
		"BIO-2710": "bio2710Result",
		"BIO-2630": "bio2630Result",
		"BIO-2640": "bio2640Result",
		"CHE-1320": "che1320Result",
		"COM-1600": "com1600Result",
		"ENG-1510": "eng1510Result",
		"PSY-2510": "psy2510Result",
		"SOC-2510": "soc2510Result",
	};
	var gpaCourseFields = {
		bio1570: "bio1570Result",
		bio2630: "bio2630Result",
		bio2710: "bio2710Result",
		bio2640: "bio2640Result",
		che1320: "che1320Result",
		com1600: "com1600Result",
		eng1510: "eng1510Result",
		psy2510: "psy2510Result",
		soc2510: "soc2510Result",
	};
	var registeredSupportiveCourses = {};
	var supportiveGradesLoaded = false;
	var assessmentFields = [
		{
			code: "DHY.HOURS",
			checkbox: "observationDocumentationAttached",
			date: "observationAssessmentDate",
		},
		{
			code: "DHY.INFO",
			checkbox: "informationSessionAttended",
			date: "informationSessionAssessmentDate",
		},
	];

	// Parse calendar components directly; never convert integration dates to local time.
	function assessmentCalendarDate(value) {
		if (typeof value !== "string") return "";
		var match = value
			.trim()
			.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T\d{2}:\d{2})/);
		if (!match) return "";
		var year = Number(match[1]);
		var month = Number(match[2]);
		var day = Number(match[3]);
		var date = new Date(0);
		date.setUTCFullYear(year, month - 1, day);
		if (
			year < 1 ||
			date.getUTCFullYear() !== year ||
			date.getUTCMonth() !== month - 1 ||
			date.getUTCDate() !== day
		)
			return "";
		return match[1] + "-" + match[2] + "-" + match[3];
	}

	function updateRegistrationIndicators() {
		Object.keys(supportiveCourseFields).forEach(
			function updateCourse(code) {
				var field = supportiveCourseFields[code];
				document.getElementById(field + "Registered").hidden =
					!supportiveGradesLoaded ||
					!registeredSupportiveCourses[code];
			},
		);
	}

	// Ascending letter-grade order. Non-letter outcomes need a separate business rule.
	var supportiveGradeOrder = [
		"F",
		"D-",
		"D",
		"D+",
		"C-",
		"C",
		"C+",
		"B-",
		"B",
		"B+",
		"A-",
		"A",
		"A+",
	];
	var hesiFields = [
		{ id: "hesiScore", code: "H.DHY.TOTL", label: "Total" },
		{ id: "hesiAnatomyScore", code: "H.DHY.A&P", label: "A&P" },
		{
			id: "hesiReadingScore",
			code: "H.DHY.READ",
			label: "Reading Comprehension",
		},
		{ id: "hesiMathScore", code: "H.DHY.MATH", label: "Math" },
	];
	var demographicFields = ["name", "phone", "email"];

	function updateSupportiveCourseWarning() {
		var hasLowGrade = Object.keys(supportiveCourseFields).some(
			function isLowGrade(code) {
				var grade = String(vm[supportiveCourseFields[code]]() || "")
					.trim()
					.toUpperCase();
				var rank = supportiveGradeOrder.indexOf(grade);
				return rank >= 0 && rank <= supportiveGradeOrder.indexOf("C-");
			},
		);
		document.getElementById("supportiveCourseWarning").hidden =
			!hasLowGrade;
	}

	function clearSupportiveCourseResults() {
		vm.humRequirementMet(false);
		vm.hea1510RequirementMet(false);
		Object.keys(supportiveCourseFields).forEach(function clearCourse(code) {
			vm[supportiveCourseFields[code]]("");
		});
		updateSupportiveCourseWarning();
	}

	// Apply the course integration response for the Student ID used by the request.
	vm.populateSupportiveCourseResults =
		function populateSupportiveCourseResults(studentID, results) {
			var id = String(studentID == null ? "" : studentID).trim();
			if (!id || id !== String(vm.studentID() || "")) return;
			if (!Array.isArray(results)) {
				throw new TypeError(
					"Supportive course results must be an array.",
				);
			}

			var bestGrades = {};
			var humRequirementMet = false;
			var hea1510RequirementMet = false;
			results.forEach(function inspectCourse(record) {
				if (
					!record ||
					typeof record.sectionCode !== "string" ||
					typeof record.grade !== "string"
				)
					return;
				// BIO-1570-A1501 becomes BIO-1570, independent of the section suffix.
				var match = record.sectionCode
					.trim()
					.toUpperCase()
					.match(/^([A-Z]+)-(\d+)(?:-|$)/);
				if (!match) return;
				var grade = record.grade.trim().toUpperCase();
				var rank = supportiveGradeOrder.indexOf(grade);
				if (rank < 0) return;
				if (rank >= supportiveGradeOrder.indexOf("C")) {
					if (match[1] === "HUM") humRequirementMet = true;
					if (match[1] === "HEA" && match[2] === "1510") {
						hea1510RequirementMet = true;
					}
				}
				var courseCode = match[1] + "-" + match[2];
				// COM 1600 and SPE 1610 fulfill the same supportive requirement.
				if (courseCode === "SPE-1610") courseCode = "COM-1600";
				var field = supportiveCourseFields[courseCode];
				if (!field) return;
				// Keep the highest grade for each course independently.
				if (
					!bestGrades[field] ||
					rank > supportiveGradeOrder.indexOf(bestGrades[field])
				) {
					bestGrades[field] = grade;
				}
			});

			clearSupportiveCourseResults();
			vm.humRequirementMet(humRequirementMet);
			vm.hea1510RequirementMet(hea1510RequirementMet);
			Object.keys(bestGrades).forEach(function populateGrade(field) {
				vm[field](bestGrades[field]);
			});
			updateSupportiveCourseWarning();
			updateRegistrationIndicators();
		};

	function setHesiNotice(message) {
		document.getElementById("hesiScoreNoticeText").textContent = message;
		document.getElementById("hesiScoreNotice").hidden = !message;
	}

	function dentalHygieneHesiScores(results) {
		var selected = null;
		(Array.isArray(results) ? results : []).forEach(
			function inspectTest(test) {
				if (!test || test.Code !== "HESI.DHY") return;
				var scores = {};
				hesiFields.forEach(function readScore(field) {
					var subTest = (
						Array.isArray(test.SubTests) ? test.SubTests : []
					).find(function matchesCode(subTest) {
						return subTest && subTest.Code === field.code;
					});
					var value = subTest && subTest.Score;
					var numeric =
						typeof value === "number" ||
						(typeof value === "string" && value.trim() !== "");
					scores[field.id] =
						numeric && Number.isFinite(Number(value))
							? Number(value)
							: null;
				});
				if (
					!hesiFields.some(function hasScore(field) {
						return scores[field.id] !== null;
					})
				)
					return;
				// Keep all components from one attempt; ties retain the first result.
				if (
					!selected ||
					(scores.hesiScore !== null &&
						(selected.hesiScore === null ||
							scores.hesiScore > selected.hesiScore))
				) {
					selected = scores;
				}
			},
		);
		return selected;
	}

	function clearStudentInformation(preserveAssessments, preserveGpa) {
		studentSelectionVersion += 1;
		if (!preserveGpa) {
			vm.dhyGpa("");
			gpaStudentID = "";
		}
		studentInformationLoading = false;
		registeredSupportiveCourses = {};
		supportiveGradesLoaded = false;
		if (!preserveAssessments) {
			assessmentFields.forEach(function clearAssessment(field) {
				vm[field.checkbox](false);
				vm[field.date]("");
			});
		}
		updateRegistrationIndicators();
		demographicFields.forEach(function clearField(id) {
			vm[id]("");
		});
		hesiFields.forEach(function clearHesiScore(field) {
			vm[field.id]("");
		});
		setHesiNotice("");
		clearSupportiveCourseResults();
	}

	function personName(person) {
		var name = (person.names || [])[0] || {};
		return [name.firstName, name.middleName, name.lastName]
			.filter(Boolean)
			.join(" ");
	}

	function searchStudents(query) {
		var id = query.trim();
		if (!id) return [];

		return integration
			.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
				personID: id,
			})
			.then(function mapStudent(person) {
				if (!person || !person.names || !person.names.length) return [];
				return [
					{
						label: id,
						description: personName(person),
						value: id,
						data: person,
					},
				];
			});
	}

	function retrieveCoordinatorGpa() {
		var studentID = vm.studentID();
		if (pkg.isExporting ||
			!(pkg.isAtStep("programCoordinator") || pkg.isAtStep("programCoordinator2")) ||
			!String(studentID || "").trim()) return Promise.resolve();
		var version = studentSelectionVersion;
		function isCurrentStudent() {
			return version === studentSelectionVersion &&
				String(vm.studentID() || "") === String(studentID);
		}
		// Saved values remain displayed until a valid response replaces them.
		return Promise.resolve()
			.then(function retrieveGpa() {
				if (!isCurrentStudent()) return;
				return integration.first("Web_Custom_DHY_GPA_Get", { studentID: studentID });
			})
			.then(function populateGpa(result) {
				if (!isCurrentStudent()) return;
				if (!result || typeof result !== "object" || Array.isArray(result)) {
					throw new TypeError("Dental Hygiene GPA must be a single object.");
				}
				if (result.studentId != null && String(result.studentId) !== String(studentID)) {
					throw new Error("Dental Hygiene GPA returned a different student.");
				}
				// The service owns primary grades, including the combined COM/SPE result.
				Object.keys(gpaCourseFields).forEach(function populateGrade(key) {
					vm[gpaCourseFields[key]](result[key] == null ? "" : result[key]);
				});
				var gpa = result.gpa;
				var numeric = typeof gpa === "number" ||
					(typeof gpa === "string" && gpa.trim() !== "");
				if (numeric && Number.isFinite(Number(gpa))) {
					// Preserve the returned representation; do not round or calculate GPA.
					vm.dhyGpa(String(gpa));
				}
				supportiveGradesLoaded = true;
				updateSupportiveCourseWarning();
				updateRegistrationIndicators();
			})
			.catch(function reportGpaError(error) {
				if (!isCurrentStudent()) return;
				console.error("Unable to retrieve Dental Hygiene GPA", error);
				notify("error", "Dental Hygiene GPA information could not be retrieved. Please contact support.");
			});
	}

	function selectStudent(item) {
		// Autocomplete calls onClear when the selected ID is edited or cleared.
		clearStudentInformation(true, gpaStudentID === String(item.value));
		gpaStudentID = String(item.value);
		vm.studentID(item.value);
		var version = studentSelectionVersion;
		var person = item.data;
		vm.name(personName(person));
		var phoneInput = document.getElementById("phone");
		phoneInput.value = ((person.phones || [])[0] || {}).number || "";
		// Apply the framework mask to the integration value before saving it.
		occFramework.init(phoneInput);
		vm.phone(phoneInput.value);
		vm.email(((person.emails || [])[0] || {}).address || "");

		studentInformationLoading = true;
		occFramework.loading.show(
			"Loading student assessments, grades, and HESI scores…",
		);
		var gradesRequest = Promise.resolve()
			.then(function retrieveGrades() {
				if (version !== studentSelectionVersion) return;
				return integration.all("Web_Custom_Student_Grades_All", {
					studentID: item.value,
				});
			})
			.then(function populateGrades(results) {
				if (version !== studentSelectionVersion) return;
				vm.populateSupportiveCourseResults(item.value, results);
				supportiveGradesLoaded = true;
				updateRegistrationIndicators();
			})
			.catch(function reportCourseError(error) {
				if (version !== studentSelectionVersion) return;
				console.error("Unable to retrieve supportive course grades", error);
				notify("error", "Course grades could not be loaded. Please contact support.");
			});

		var assessmentsRequest = Promise.resolve()
			.then(function retrieveAssessments() {
				return integration.all("Web_Custom_Student_Assessments", {
					studentID: item.value,
				});
			})
			.then(function populateAssessments(results) {
				if (version !== studentSelectionVersion) return;
				if (!Array.isArray(results))
					throw new TypeError(
						"Student assessments must be an array.",
					);
				assessmentFields.forEach(function populateAssessment(field) {
					var latest = "";
					results.forEach(function inspectAssessment(record) {
						if (!record || record.code !== field.code) return;
						var date = assessmentCalendarDate(record.assessedOn);
						if (date > latest) latest = date;
					});
					if (!latest) return;
					vm[field.checkbox](true);
					var savedDate = assessmentCalendarDate(vm[field.date]());
					if (latest > savedDate) vm[field.date](latest);
				});
			})
			.catch(function reportAssessmentError(error) {
				if (version !== studentSelectionVersion) return;
				console.error("Unable to retrieve student assessments", error);
				notify(
					"error",
					"Assessment dates could not be loaded. Clear the student and search again to retry.",
				);
			});

		integration
			.all("Web_Custom_Get_Student_Registered_Sections", {
				studentID: item.value,
			})
			.then(function populateRegistrations(results) {
				if (version !== studentSelectionVersion) return;
				if (!Array.isArray(results))
					throw new TypeError(
						"Registered sections must be an array.",
					);
				registeredSupportiveCourses = {};
				results.forEach(function inspectSection(section) {
					if (typeof section !== "string") return;
					var match = section
						.trim()
						.toUpperCase()
						.match(/^([A-Z]+)-(\d+)(?:-|$)/);
					var code = match && match[1] + "-" + match[2];
					if (code === "SPE-1610") code = "COM-1600";
					if (supportiveCourseFields[code])
						registeredSupportiveCourses[code] = true;
				});
				updateRegistrationIndicators();
			})
			.catch(function reportRegistrationError(error) {
				if (version !== studentSelectionVersion) return;
				registeredSupportiveCourses = {};
				updateRegistrationIndicators();
				console.error("Unable to retrieve registered sections", error);
				notify(
					"error",
					"Registered courses could not be loaded. Clear the student and search again to retry.",
				);
			});

		var hesiRequest = Promise.resolve()
			.then(function retrieveHesiScores() {
				return integration.all("Web_Ethos_Get_Student_Test_Scores", {
					studentID: item.value,
				});
			})
			.then(function populateHesiScore(results) {
				if (version !== studentSelectionVersion) return;
				var scores = dentalHygieneHesiScores(results);
				var missing = [];
				hesiFields.forEach(function populateScore(field) {
					var score = scores ? scores[field.id] : null;
					vm[field.id](score === null ? "" : String(score));
					if (score === null) missing.push(field.label);
				});
				setHesiNotice(
					!scores
						? "No Dental Hygiene HESI scores were found for this student."
						: missing.length
							? "The selected HESI attempt is missing scores for: " +
								missing.join(", ") +
								"."
							: "",
				);
			})
			.catch(function logStudentTestScoreError(error) {
				console.error(
					"Unable to retrieve student test scores",
					item.value,
					error,
				);
				if (version !== studentSelectionVersion) return;
				setHesiNotice(
					"The HESI scores could not be loaded. Clear the student and search again to retry.",
				);
			});

		// Wait for all saved student data, including HESI, before allowing submission.
		// Errors are reported above; absorb rejections so every request can settle.
		Promise.all([
			gradesRequest.catch(function () {}),
			assessmentsRequest.catch(function () {}),
			hesiRequest.catch(function () {}),
		]).then(function finishStudentLoading() {
			if (version !== studentSelectionVersion) return;
			studentInformationLoading = false;
			occFramework.loading.hide();
		});
	}

	function initializeStudentSearch() {
		if (studentAutocomplete) return;
		gpaStudentID = String(vm.studentID() || "");
		Object.keys(supportiveCourseFields).forEach(
			function watchCourseGrade(code) {
				vm[supportiveCourseFields[code]].subscribe(
					updateSupportiveCourseWarning,
				);
			},
		);
		Object.keys(startRequirements).forEach(function watchRequirement(id) {
			vm[id].subscribe(function clearCorrectedError() {
				var control = document.getElementById(startRequirements[id]);
				var error = document.getElementById(control.id + "Error");
				if (!error.hidden) validateStartRequirement(id);
			});
		});
		studentAutocomplete = occFramework.autocomplete.create(
			"#studentAutocomplete",
			{
				minLength: 1,
				search: searchStudents,
				onSelect: selectStudent,
				onClear: function clearStudent() {
					vm.studentID("");
					clearStudentInformation();
				},
			},
		);
		// Adopt saved fields without refreshing or overwriting the saved demographics.
		if (vm.studentID()) {
			studentAutocomplete.restore({
				value: vm.studentID(),
				label: vm.studentID(),
			});
		}
	}

	function applyWorkflowState() {
		var atStart = pkg.isAtStep("Start");
		var atCoordinator = pkg.isAtStep("programCoordinator");
		var atCoordinator2 = pkg.isAtStep("programCoordinator2");
		var exporting = Boolean(pkg && pkg.isExporting);
		var meeting = document.getElementById("followUpMeetingSection");
		meeting.hidden = atStart;

		if (atCoordinator || atCoordinator2 || exporting) {
			// These workflow steps permit only meeting edits, or no edits at all.
			occFramework.fields.readonly(
				document.querySelectorAll(
					".occ-section:not(#followUpMeetingSection):not(.developer)",
				),
				true,
			);
		}
		occFramework.fields.readonly(
			"#supportive-courses-content .occ-field",
			!atStart || exporting,
		);
		// Keep GPA locked after the Start-step course fields have been unlocked.
		document.getElementById("dhyGpaPanel").hidden = !(atCoordinator || atCoordinator2);
		occFramework.fields.readonly("#dhyGpaField", true);
		occFramework.fields.readonly(meeting, atCoordinator2 || exporting);
		occFramework.fields.readonly(
			"#informationSessionAssessmentField, #observationAssessmentField",
			!atStart || exporting,
		);
		// The autocomplete clear action is a button, outside fields.readonly's controls.
		document.querySelector(
			"#studentAutocomplete .occ-autocomplete__clear",
		).disabled = atCoordinator || atCoordinator2 || exporting;
	}

	vm.onLoad = function onLoad(source, inputValues) {
		occFramework.loading.show(
			"Loading Dental Hygiene application checklist…",
		);
	};

	vm.setDefaults = function setDefaults(source, inputValues) {};

	vm.afterLoad = function afterLoad() {
		try {
			occFramework.init(document);
			initializeStudentSearch();
			updateRegistrationIndicators();
			updateSupportiveCourseWarning();
			applyWorkflowState();
			occFramework.developerVisibility.apply(document, user);
			occFramework.exportMode.set(document, pkg && pkg.isExporting);
		} catch (error) {
			occFramework.loading.hide();
			throw error;
		}
		// Softdocs restores saved input values before afterLoad. Return the request
		// so the loading overlay follows its completion, including handled failures.
		return retrieveCoordinatorGpa().finally(function finishLoading() {
			occFramework.loading.hide();
		});
	};

	vm.onSubmit = function onSubmit(form) {
		if (studentInformationLoading) {
			throw new Error(
				"Wait for student information and HESI scores to finish loading before submitting.",
			);
		}
		if (pkg.isAtStep("Start") && !pkg.isExporting) {
			var firstInvalid;
			Object.keys(startRequirements).forEach(
				function checkRequirement(id) {
					if (!validateStartRequirement(id)) {
						var control = document.getElementById(
							startRequirements[id],
						);
						control.checkValidity();
						if (!firstInvalid) firstInvalid = control;
					}
				},
			);
			if (firstInvalid) {
				firstInvalid.focus();
				throw new Error(
					"Complete the required student and checklist fields.",
				);
			}
		}
		var attachmentCount = Number(form && form.attachmentCount) || 0;

		if (attachmentCount < 1) {
			throw new Error(
				"Attach at least one file before submitting this form.",
			);
		}

		return integration
			.update("Web_Custom_DHY_GPA_Put", {
				studentID: vm.studentID(),
			})
			.catch(function reportGpaUpdateError(error) {
				console.error("Unable to update Dental Hygiene GPA", error);
				throw new Error(
					"The Dental Hygiene GPA could not be updated. Please try submitting again.",
				);
			});
	};

	vm.onApprove = function onApprove(form) {
		vm.approvalStatus("Approved");
	};

	vm.onDecline = function onDecline(form) {
		vm.approvalStatus("Denied");
	};

	vm.beforeRequired = function beforeRequired(form) {};

	vm.afterRequired = function afterRequired(form) {};

	vm.onOptOut = function onOptOut(form) {};

	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
