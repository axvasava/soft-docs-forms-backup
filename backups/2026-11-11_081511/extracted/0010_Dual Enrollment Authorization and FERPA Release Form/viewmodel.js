/* jshint maxerr: 10000 */

define([
	"jquery",
	"knockout",
	"vmBase",
	"integration",
	"notify",
	"user",
	"template/autosize.min",
	"template/jquery.maskedinput",
	"./liveViewModel.js",
	"package",
	"https://webapps.oaklandcc.edu/cdn/utils/formUtils.js",
	/*-- WARNING: Uncommenting the line of code below will allow you to use Etrieve Extenders on this form.
    Currently, Etrieve Extenders are only compatible with cloud based instances of Etrieve.
    If you are unsure if you can utilize Extenders, please contact your institution's Etrieve Administrator.*/
	"https://softdocscdn.etrieve.cloud/extenders/extenders.min.js",
], function viewmodel(
	$,
	ko,
	vm,
	integration,
	notify,
	user,
	autosize,
	maskedinput,
	liveVM,
	pkg,
	formUtils,
) {
	var formLifecycle = formUtils.createFormLifecycleUtils({
		vm: vm,
		pkg: pkg,
		user: user,
		formUtils: formUtils,
	});

	var requiredIndicators = formLifecycle.requiredIndicators;
	var fieldStateUtils = formLifecycle.fieldStateUtils;
	var fieldValidation = formLifecycle.fieldValidation;

	integration
		.all("Etrieve_Integration_Get_Dual_Enrollment_Schools", {})
		.then(function (data) {});

	vm.addObservableArray("studentSelectedCourses");
	vm.addObservableArray("AcademicPeriodsAutocomplete");
	vm.addObservableArray("CourseSubjectAutocomplete");
	vm.addObservableArray("SubjectsAutocomplete");
	vm.addObservable("maxCoursesReached");

	const shouldShowSchoolRows =
		[
			"HighSchoolESignStep",
			"DistrictLevelReview",
			"AdmissionsESignStep",
			"ESignSecondaryPartnerships",
			"WFFinancialServices",
			"End",
			"EndNIS",
			"End5",
			"End4",
		].includes(pkg.stepCode) || user.isInActivity;

	$("#addSectionBtn").click(function () {
		var subject = vm.subjectSearch();
		var course = vm.courseSearch();
		var courseTitle = vm.titleSearch();

		var currNumRows = vm.studentSelectedCoursesRow().length;

		if (subject && course && courseTitle) {
			if (currNumRows >= 4) {
				syncMaxCoursesState();
				return;
			}

			vm.studentSelectedCoursesRow.push({});

			var numRows = vm.studentSelectedCoursesRow().length;
			var newRow = vm.studentSelectedCoursesRow()[numRows - 1];

			newRow.studentSelectedCourse(subject + " - " + course);
			newRow.studentSelectedCourseTitle(courseTitle);

			vm.subjectSearch(undefined);
			vm.courseSearch(undefined);
			vm.titleSearch(undefined);

			syncMaxCoursesState();
		} else {
			if (!subject) {
				fieldValidation.setError(
					"subjectSearch",
					"Select a subject from the list.",
				);
			}

			if (!course) {
				fieldValidation.setError(
					"courseSearch",
					"Select a course from the list.",
				);
			}

			if (!courseTitle) {
				fieldValidation.setError(
					"titleSearch",
					"Select a valid course first.",
				);
			}
		}
	});

	function graduationDateDropdown(dropdownID) {
		var currentYear = new Date().getFullYear();
		var $dropdown = $("#" + dropdownID);

		// 1. Clear existing options
		$dropdown.empty();

		// 2. Add empty first option
		$dropdown.append($("<option disabled selected>").text(""));

		// 3. Add "Class of" options
		for (var i = 0; i < 7; i++) {
			var year = currentYear + i;
			var label = "Class of " + year;
			$dropdown.append($("<option></option>").val(year).text(label));
		}
	}

	//This function is used to set the autosize function on textareas with a class of autosizeareas.
	//Uncomment to use.
	//autosize($('.autosizeareas'));

	/*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
	$(".maskphone").mask("(999)999-9999? ext:9999");
	$(".maskzip").mask("99999?-9999");
	$(".maskssn").mask("999-99-9999");
	/*End masking functions*/

	//Parameters:
	//  $: jQuery object. Additional documentation found at api.jquery.com

	//  ko: knockoutjs object. Additional documentation found at knockoutjs.com

	//  vm: is a base viewmodel object that enables you to interact with observable inputs on the
	//  view.html.  Observables for all inputs, selects, and textareas will be added when the
	//  viewmodel is bound to the view.  vmBase has functions to aid in adding additional observable
	//  properties to itself such as addObservables, addObservableArrays which both take a comma-
	//  separated string of names.

	//  user: The user parameter includes data associated with the current user including isInLibrary,
	//  isInDrafts, isInActivity, isOriginator, DisplayName, UserName, hasGroupOrRole, Email.

	//  integration: has functions for directly calling integration sources configured on the server
	//  integration.first: takes Source Code and an optional Parameter Object, returning a single object
	//  integration.all: takes Source Code and an optional Parameter Object, returning an array of objects
	//  integration.add: takes Source Code and a Parameter Object, returning an array of objects
	//  integration.update: takes Source Code and a Parameter Object, returning an array of objects
	//  integration.delete: takes Source Code and a Parameter Object, returning an array of objects

	//  notify: method that display a toast notification, it requires the next parameters
	//      - toastrType: string indicating the type of toast notification, could have the next values:
	//          - success
	//          - warning
	//          - error
	//      - message: string indicating the message to display on notification
	//      - title: string indicating the title for the notification

	//  pkg: The pkg viewmodel object includes parameters which return properties
	//  around the package and the package state throughout the workflow.
	//  stepCode, stepName, isAtStep, isExporting.

	//The following methods are lifecycle callbacks that will be called as described
	//if they are returned on the viewmodel object, but they are not required.

	//NOTE: if a JavaScript Promise is returned from any Lifecycle Callback, the process will wait until
	//the Promise is resolved before continuing.  Additionally, if an Integration source or any other
	//asynchronous method is called directly within one of these functions, it is required that a Promise
	//be returned in order to guarantee these methods are called in a predictable, sequential manner.

	//Loading Lifecycle Callbacks:
	//Parameters:
	//  source:
	//  If the form is configured to receive integration sources onLoad or onOrigination,
	//  they will be passed on the source parameter. onLoad sources will be available
	//  every time the form is loaded while onOrigination sources will only be available
	//  when user.isInLibrary is true.

	//  inputValues:
	//  inputValues.first(id) takes an input id & returns a single value if one exists.
	//  inputValues.all(id) takes an input id & returns an array of values if any exist.
	//  inputValues.audit(id) takes an input id & returns an array of audit history values if any exist.
	//  inputValues.list is an array of all values sent from the server that will be loaded
	//      into this form after setDefaults and prior to afterLoad.  This should only be needed if
	//      it is necessary to filter on something other than input id.

	vm.onLoad = function onLoad(source, inputValues) {
		//  This takes place after applyBindings has been called and has added input observables to the
		//  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
		//  populating dropdowns, select options and other operations that need to take place every
		//  time the form is loaded.

		fieldStateUtils.hideContainers([
			"newSchoolContactRow",
			"schoolContactRow",
			"homeSchool",
			"schoolRow",
			"schoolCourseRow",
			"districtContactRow",
			"studentIDEntry",
		]);

		/*Populating 2 dropdowns with Class of XXXX - Student Section and Counselor Section*/
		graduationDateDropdown("studentAnticipatedGraduationDate");
		graduationDateDropdown("schoolAnticipatedGraduationDate");

		//(studentAnticipatedGraduationDate);

		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.
	};
	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.

		if (pkg.isAtStep("Start")) {
			vm.formID(formUtils.generateUUID());
			vm.nisID("No_ID");
		}

		integration
			.all("EthosColleagueSubjects", {
				// Add relevant parameters here
			})
			.then(function (subjectsResults) {
				subjectsResults.forEach(function (subjectsResultsDataRow) {
					if (subjectsResultsDataRow.showInCatalog === "Y") {
						// Push custom attributes into autocomplete
						vm.SubjectsAutocomplete.push({
							subjectAbbreviation:
								subjectsResultsDataRow.abbreviation,
							subjectGUID: subjectsResultsDataRow.id,
							subjectTitle: subjectsResultsDataRow.title,
						});
					}
				});
			});

		vm.earlyCollegeStuChk.subscribe(function (isChecked) {
			if (isChecked) {
				vm.displayCourses("No");
				requiredIndicators.setRequired(
					"earlySchool",
					vm.highSchoolName() !== "OEC - Oakland Early College",
				);
				return;
			}

			vm.earlySchool("");
			requiredIndicators.setRequired("earlySchool", false);

			if (
				vm.highSchoolName() &&
				vm.highSchoolName() !== "OEC - Oakland Early College"
			) {
				vm.displayCourses("Yes");
			}
		});

		//OEC - Oakland Early College Logic
		vm.highSchoolName.subscribe(function (option) {
			if (option == "OEC - Oakland Early College") {
				vm.oaklandEarlyCollegeOption(option);

				if (ko.isObservable(vm.earlyCollegeStuChk))
					vm.earlyCollegeStuChk(true);
				$("#earlyCollegeStuChk")
					.prop("checked", true)
					.trigger("change"); // nudge “change” so it saves
				$("#earlyCollegeStuChk").css({
					"pointer-events": "none",
					"background-color": "#e9ecef",
					cursor: "not-allowed",
				});
				requiredIndicators.setRequired("earlySchool", false);
				vm.earlySchoolSelectionWorkflow(option);
			} else {
				vm.newHighSchoolName(option);
				vm.oaklandEarlyCollegeOption("");
				if (ko.isObservable(vm.earlyCollegeStuChk))
					vm.earlyCollegeStuChk(false);
				$("#earlyCollegeStuChk")
					.prop("checked", false)
					.trigger("change");

				$("#earlyCollegeStuChk").css({
					"pointer-events": "",
					"background-color": "",
					cursor: "",
				});
				requiredIndicators.setRequired("earlySchool", false);
			}
		});

		vm.earlySchool.subscribe(function (option) {
			vm.earlySchoolSelectionWorkflow(option);
		});

		if (pkg.stepCode === "Start") {
			vm.secondaryPartnershipsEmail("secondary@oaklandcc.edu");
		}

		if (!pkg.isAtStep("Start")) {
			fieldStateUtils.lockContainers([
				"studentSelectedCoursesRow",
				"CoursesRow",
			]);
			fieldStateUtils.hideContainers(["maxCoursesWarning"]);
		}

		if (
			pkg.isAtStep("ESignSecondaryPartnerships") ||
			pkg.isAtStep("WFFinancialServices") ||
			pkg.isAtStep("End") ||
			pkg.stepCode === "EndNIS" ||
			pkg.stepCode === "End5" ||
			pkg.stepCode === "End4" ||
			pkg.isAtStep("EndNIS")
		) {
			fieldStateUtils.showContainers(["studentIDEntry"]);
		}

		// Only show the Parent rows (class=parentRow) at the Parent Esign WF step (ParentESignStep) or consecutive steps
		if (
			pkg.stepCode === "ParentESignStep" ||
			pkg.stepCode === "HighSchoolESignStep" ||
			pkg.stepCode === "DistrictLevelReview" ||
			pkg.stepCode === "AdmissionsESignStep" ||
			pkg.stepCode === "WFFinancialServices" ||
			pkg.stepCode === "ESignSecondaryPartnerships" ||
			pkg.stepCode === "End" ||
			pkg.stepCode === "EndNIS" ||
			pkg.stepCode === "End5" ||
			pkg.stepCode === "End4" ||
			user.isInActivity
		) {
			fieldStateUtils.showContainers(["parentRow"]);
		} else {
			fieldStateUtils.hideContainers(["parentRow"]);
		}

		if (
			pkg.stepCode === "ESignSecondaryPartnerships" ||
			pkg.stepCode === "DistrictLevelReview" ||
			pkg.stepCode === "AdmissionsESignStep" ||
			pkg.stepCode === "WFFinancialServices" ||
			pkg.stepCode === "End" ||
			pkg.stepCode === "EndNIS" ||
			pkg.stepCode === "End5" ||
			pkg.stepCode === "End4" ||
			user.isInActivity
		) {
			if (vm.highSchoolName() == "Home School") {
				fieldStateUtils.showContainers(["districtContactRow"]);
			} else {
				fieldStateUtils.hideContainers(["districtContactRow"]);
			}
		}

		if (shouldShowSchoolRows) {
			if (vm.enrollmentType() === "Self-Pay") {
				fieldStateUtils.hideContainers([
					"schoolRow",
					"schoolCourseRow",
				]);
				//   } else if (vm.specialProgram() === 'Yes') {
				//     $('.schoolRow').show();
				//     $('.schoolCourseRow').hide();
			} else {
				fieldStateUtils.showContainers(["schoolRow"]);
				// Conditionally show/hide each course row
				for (let i = 1; i <= 4; i++) {
					const value = vm[`schoolCourseAuthorizationCourse${i}`]();
					const rowName = `schoolAuthCourse${i}`;

					if (value && value.toLowerCase() === "n/a") {
						fieldStateUtils.hideContainers([rowName]);
					} else {
						fieldStateUtils.showContainers([rowName]);
					}
				}
			}
		} else {
			fieldStateUtils.hideContainers(["schoolRow"]);
		}

		if (vm.highSchoolName()) {
			hsTypeRowShow(vm.highSchoolName());
		}

		vm.highSchoolName.subscribe(function (NewValue) {
			if (NewValue) {
				// If there's a new value
				vm.institution(NewValue);
				vm.highSchoolNameSelection(NewValue);
				hsTypeRowShow(vm.highSchoolName());
			} else {
				vm.institution(undefined);
			}
		});

		vm.newHighSchoolName.subscribe(function (NewValue) {
			if (NewValue) {
				// If there's a new value
				vm.institution(NewValue);
				vm.highSchoolNameSelection(NewValue);
			} else {
				vm.institution(undefined);
			}
		});

		vm.schoolContactEmail.subscribe(function (NewValue) {
			if (NewValue) {
				// If there's a new value
				vm.masterSchoolContactEmail(NewValue);
			} else {
				vm.masterSchoolContactEmail(undefined);
			}
		});

		vm.newSchoolContactEmail.subscribe(function (NewValue) {
			if (NewValue) {
				// If there's a new value
				vm.masterSchoolContactEmail(NewValue);
			} else {
				vm.masterSchoolContactEmail(undefined);
			}
		});

		integration
			.all("Web_Ethos_Get_Academic_Periods_by_startOn_date", {
				logic: "$gte",
				startOnDate: formUtils.addDaysToCurrentDate(365),
			})
			.then(function (academicPeriodStartOnData) {
				//console.log('academicPeriodStartOnData',academicPeriodStartOnData);
				academicPeriodStartOnData.forEach(function (results) {
					vm.AcademicPeriodsAutocomplete.push({
						termCode: results.code,
						termGUID: results.id,
						termTitle: results.title,
					});
				});
			});

		vm.subjectGUID.subscribe(function (newVal) {
			// empty previous results
			vm.CourseSubjectAutocomplete([]);
			vm.courseSearch(undefined);
			vm.titleSearch(undefined);

			fieldValidation.clearError("courseSearch");

			// only run this if the subject was selected
			if (newVal) {
				$(".loading").show();
				getAllDataFromPagingSource(
					"Web_Sources_Get_Courses_by_SubjectGUID",
					newVal,
					100,
				)
					.then((listOfCoursesBySubjectData) => {
						let coursesFound = false;

						listOfCoursesBySubjectData.forEach(
							function (listOfCoursesBySubjectDataRow) {
								if (
									listOfCoursesBySubjectDataRow.status.id ===
										"73c76722-884e-43e9-b093-8ebe092c045f" &&
									listOfCoursesBySubjectDataRow.credits[0]
										.creditCategory.creditType ===
										"institution"
								) {
									coursesFound = true;

									vm.CourseSubjectAutocomplete.push({
										courseTitle:
											listOfCoursesBySubjectDataRow
												.titles[0].value,
										courseNumber:
											listOfCoursesBySubjectDataRow.number,
										courseSubjectAndNumber:
											vm.subjectSearch() +
											" " +
											listOfCoursesBySubjectDataRow.number,
									});
								}
							},
						);

						if (!coursesFound) {
							fieldValidation.setError(
								"courseSearch",
								"No courses are currently available for the selected subject.",
							);
						} else {
							fieldValidation.clearError("courseSearch");
						}

						$(".loading").hide();
					})
					.catch((error) => {
						console.error(error);
					});
			} else {
			}
		});

		vm.studentSignature.subscribe(function (newValue) {
			const signature = String(newValue || "").trim();

			vm.studentSignatureDate(
				signature ? formUtils.getTodayDate() : undefined,
			);
		});

		vm.parentGuardianSignature.subscribe(function (newValue) {
			const signature = String(newValue || "").trim();

			vm.parentSignatureDate(
				signature ? formUtils.getTodayDate() : undefined,
			);
		});

		vm.schoolRepresentativeSignature.subscribe(function (newValue) {
			const signature = String(newValue || "").trim();

			vm.schoolRepresentativeDate(
				signature ? formUtils.getTodayDate() : undefined,
			);
		});

		if (pkg.stepCode === "Start") {
			ko.computed(function () {
				var row, i;
				for (i = 0; i < 4; i++) {
					row = vm.studentSelectedCoursesRow()[i] || null;
					if (row && row.studentSelectedCourse()) {
						//const subject = row.studentSelectedSubject();
						const course = row.studentSelectedCourse();
						const title = row.studentSelectedCourseTitle();
						vm["schoolCourseAuthorizationCourse" + (i + 1)](course);
						vm["schoolCourseAuthorizationCourseTitle" + (i + 1)](
							title,
						);
						vm["schoolCourseAuthorizationPayment" + (i + 1)](
							undefined,
						);
					} else {
						vm["schoolCourseAuthorizationCourse" + (i + 1)](
							undefined,
						);
						vm["schoolCourseAuthorizationCourseTitle" + (i + 1)](
							undefined,
						);
						vm["schoolCourseAuthorizationPayment" + (i + 1)]("n/a");
					}
				}
			});
		}

		if (pkg.stepCode === "ParentESignStep") {
			ko.computed(function () {
				var row, i;
				for (i = 0; i < 4; i++) {
					row = vm.studentSelectedCoursesRow()[i] || null;
					if (row && row.studentSelectedCourse()) {
						let course = row.studentSelectedCourse();
						let title = row.studentSelectedCourseTitle();
						vm["schoolCourseAuthorizationCourse" + (i + 1)](course);
						vm["schoolCourseAuthorizationCourseTitle" + (i + 1)](
							title,
						);
					} else {
						vm["schoolCourseAuthorizationCourse" + (i + 1)]("n/a");
						vm["schoolCourseAuthorizationCourseTitle" + (i + 1)](
							"n/a",
						);
					}
				}
			});
		}

		vm.districtContactEmail.subscribe(function (NewValue) {
			if (NewValue) {
				// If there's a new value
				vm.districtSignerEmail2(NewValue);
			}
		});

		vm.semester.subscribe((newValue) => {
			if (newValue) {
				// Extract the pure term from the dropdown value, e.g. "2026/WI" from "2026/WI (2026 Winter)"
				let term = newValue.split(" ")[0]; // Gets "2026/WI"
				let [year, season] = term.split("/"); // Split term into year and season

				let startYear = parseInt(year, 10);
				let academicYear;

				if (season === "FA") {
					// Fall → Next academic year cycle
					academicYear = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
				} else if (["WI", "SU", "AY"].includes(season)) {
					// Winter, Summer, AY → Current academic year cycle
					academicYear = `${startYear - 1}-${startYear.toString().slice(-2)}`;
				} else {
					academicYear = "Invalid term";
				}

				vm.academicYear(academicYear);
			} else {
				vm.academicYear("");
			}
		});

		//  WARNING: if an integration source is called directly to retrieve values and populate inputs
		//  with default values, setDefaults must return the integration source promise.  If it doesn't,
		//  a form draft may be created every time a user opens the form and more importantly the values
		//  may not be saved to the server.
		if (pkg.isAtStep("WFFinancialServices")) {
			requiredIndicators.setRequired("newSchoolContactName", false);
		}

		/*Making fields read only*/
		if (
			!pkg.isAtStep("Start") &&
			!pkg.isAtStep("WFAdmissionsOfficeCoordinator")
		) {
			let stepName = pkg.stepName;

			if (stepName.startsWith("End")) return; //If it is at the end step, we don't want to execute the following action

			fieldStateUtils.lockContainers(
				["studentSection", "studentSectionOther"],
				{
					except: pkg.isAtStep("HighSchoolESignStep")
						? [
								"schoolCourseAuthorizationPayment1",
								"schoolCourseAuthorizationPayment2",
								"schoolCourseAuthorizationPayment3",
								"schoolCourseAuthorizationPayment4",
								"sponsorshipType",
								"notesSchool",
								"schoolAnticipatedGraduationDate",
								"schoolRepresentativeSignature",
							]
						: [],
				},
			);

			fieldStateUtils.lockFields(["highSchoolName"]);
		}

		if (pkg.isAtStep("WFAdmissionsOfficeCoordinator")) {
			fieldStateUtils.lockContainer("studentSection");
			fieldStateUtils.lockFields(["semester"]);
		}

		if (user.isInLibrary) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.
			//vm.expiredFormsWF('False');
			vm.occDualEnrollmentContact("admissions@oaklandcc.edu");
			vm.schoolCourseAuthorizationPayment1("n/a");
			vm.schoolCourseAuthorizationPayment2("n/a");
			vm.schoolCourseAuthorizationPayment3("n/a");
			vm.schoolCourseAuthorizationPayment4("n/a");
		} else {
			//  Input Values set here will be saved to the server immediately.
			//  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
			//  prior users.  Inputs that already have values saved to the server will be overridden with
			//  values set in this method.
		}
	};

	vm.afterLoad = function afterLoad() {
		//  This method is called after setDefaults has been called.

		//  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
		//  to save values to the server.

		formLifecycle.afterLoad();

		syncMaxCoursesState();

		ko.computed(function () {
			vm.studentSelectedCoursesRow().length;
			syncMaxCoursesState();
			lockCourseSelectionAfterStart();
		});

		registerFieldValidators();
		registerStudentIdValidator();

		markAutoFilledFields();

		if (
			pkg.isAtStep("HighSchoolESignStep") ||
			pkg.isAtStep("AdmissionsESignStep") ||
			pkg.isAtStep("WFFinancialServices")
		) {
			$(document).ready(function () {
				setTimeout(function () {
					fieldStateUtils.lockFields([
						"semester",
						"highSchoolName",
						"subjectSearch",
						"courseSearch",
						"state",
					]);
				}, 2000); // Adjust the timeout as necessary
			});
		}

		if (
			pkg.stepCode === "HighSchoolESignStep" ||
			pkg.stepCode === "DistrictLevelReview"
		) {
			var row, i;
			for (i = 0; i < 4; i++) {
				row = vm.studentSelectedCoursesRow();
				row = row[i];
				var rowName = "counselorRow" + (i + 1);
				if (row && row.studentSelectedCourse()) {
					vm["schoolCourseAuthorizationPayment" + (i + 1)]("");
					fieldStateUtils.showContainers([rowName]);
				} else {
					vm["schoolCourseAuthorizationPayment" + (i + 1)]("n/a");
					fieldStateUtils.hideContainers([rowName]);
				}
			}
		}

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();
		lockCourseSelectionAfterStart();

		syncCoursesSectionVisibility();

		if (
			vm.displayCourses &&
			typeof vm.displayCourses.subscribe === "function"
		) {
			vm.displayCourses.subscribe(syncCoursesSectionVisibility);
		}

		syncEnrollmentTypeVisibility();

		if (
			vm.enrollmentType &&
			typeof vm.enrollmentType.subscribe === "function"
		) {
			vm.enrollmentType.subscribe(syncEnrollmentTypeVisibility);
		}

		syncEarlyCollegeVisibility();

		if (
			vm.highSchoolName &&
			typeof vm.highSchoolName.subscribe === "function"
		) {
			vm.highSchoolName.subscribe(syncEarlyCollegeVisibility);
		}

		if (
			vm.earlyCollegeStuChk &&
			typeof vm.earlyCollegeStuChk.subscribe === "function"
		) {
			vm.earlyCollegeStuChk.subscribe(syncEarlyCollegeVisibility);
		}

		/*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */

		vm.maxCoursesReached = ko.pureComputed(function () {
			return vm.studentSelectedCoursesRow().length >= 4;
		});

		syncMaxCoursesState();
		autosize($("textarea"));
	};

	//Submitting Lifecycle Callbacks:
	//Parameters:
	//  form.attachmentCount: integer

	//In order to stop the Submitting Lifecycle and prevent this form from moving to the next step in the workflow
	//process, add the following to any of the functions below:
	//    throw new Error('reason placed here will be displayed to the user');

	vm.onSubmit = function onSubmit(form) {
		//  This method is called when the Submit button is clicked and before calling beforeRequired.
		//  This normally occurs in the Forms Library, but may occur in the Inbox when a package is
		//  returned to Originator.
	};

	vm.onApprove = function onApprove(form) {
		//  This method is called when the Approve button is clicked and before calling beforeRequired.
	};

	vm.onDecline = function onDecline(form) {
		//  This method is called when the Decline button is clicked and before calling beforeRequired.
	};

	vm.beforeRequired = function beforeRequired(form) {
		if (pkg.isAtStep("HighSchoolESignStep")) {
			clearHighSchoolRequiredState();
		} else {
			formLifecycle.beforeRequired();
		}

		if (pkg.isAtStep("HighSchoolESignStep")) {
			logHighSchoolNativeValidationState();
		}

		const value = String(vm.studentID() || "").trim();

		if (value && !/^nis$/i.test(value) && !/^\d{7}$/.test(value)) {
			notify("error", "Student ID must be a 7-digit OCC ID or NIS.");
		}
	};

	vm.afterRequired = function afterRequired(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
		if (pkg.isAtStep("HighSchoolESignStep")) {
			console.info("HighSchoolESignStep reached afterRequired.");
		}

		formLifecycle.afterRequired();
		const selectedRows = vm.studentSelectedCoursesRow();

		//2026-03-19 - Allowing 0 courses here... should force at least 2.
		// Check that there are exactly 4 rows
		if (
			pkg.isAtStep("Start") &&
			selectedRows.length < 2 &&
			vm.displayCourses() == "Yes"
		) {
			//changed from !== 4 to < 2.
			//throw new Error('You must select exactly 4 courses before submitting this form.');
			throw new Error(
				"You must select at least 2 courses before submitting this form.",
			);
		}

		if (pkg.isAtStep("Start")) {
			var Courses = "";

			var course;
			let course1 = vm.schoolCourseAuthorizationCourse1();
			let course2 = vm.schoolCourseAuthorizationCourse2();
			let course3 = vm.schoolCourseAuthorizationCourse3();
			let course4 = vm.schoolCourseAuthorizationCourse4();

			if (course1) {
				Courses += formatCourse(course1);
				Courses += "  ";
			}

			if (course2) {
				Courses += formatCourse(course2);
				Courses += "  ";
			}

			if (course3) {
				Courses += formatCourse(course3);
				Courses += "  ";
			}

			if (course4) {
				Courses += formatCourse(course4);
			}

			vm.courseNames(Courses);
		}
	};

	function formatCourse(course) {
		return course.replace(/\s*-\s*/g, "-").trim();
	}

	vm.onOptOut = function onOptOut(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	vm.onESignSubmit = function onESignSubmit(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
		console.log(form);
		if (pkg.isAtStep("HighSchoolESignStep")) {
			console.info("HighSchoolESignStep reached onESignSubmit.");
		}

		if (pkg.isAtStep("ParentESignStep")) {
			if (
				(vm.enrollmentType() == "Self-Pay" && !vm.parentAgreement1()) ||
				(vm.enrollmentType() == "Sponsored by High School/District" &&
					!vm.parentAgreement2())
			) {
				throw new Error(
					"You must check the box below Select Appropriate Payment Option to proceed.",
				);
			} else {
				return true;
			}
		}

		if (pkg.isAtStep("HighSchoolESignStep")) {
			return true;
		}
	};

	//==================== HELPER FUNCTIONS =======================================

	function clearHighSchoolRequiredState() {
		const clearedFieldIds = [];
		const clearedNestedFieldPaths = [];
		let emptyRequiredFieldIds;
		let remainingRequiredFieldIds;
		const selectedCourseRows = vm.studentSelectedCoursesRow();

		$("input, select, textarea").each(function () {
			const fieldId = this.id || this.name;

			if (fieldId) {
				requiredIndicators.setRequired(fieldId, false);
				clearedFieldIds.push(fieldId);
			}

			this.required = false;
			this.removeAttribute("required");
			this.removeAttribute("aria-required");
		});

		Object.keys(vm).forEach(function (fieldId) {
			const field = vm[fieldId];

			if (!field || field.required !== true) return;

			field.required = false;
			if (!clearedFieldIds.includes(fieldId)) {
				clearedFieldIds.push(fieldId);
			}
		});

		selectedCourseRows.forEach(function (row, rowIndex) {
			Object.keys(row).forEach(function (fieldId) {
				const rowField = row[fieldId];

				if (!rowField || rowField.required !== true) return;

				rowField.required = false;
				clearedNestedFieldPaths.push(
					"studentSelectedCoursesRow[" + rowIndex + "]." + fieldId,
				);
			});
		});

		requiredIndicators.clearNativeRequired();

		remainingRequiredFieldIds = Object.keys(vm).filter(function (fieldId) {
			return vm[fieldId] && vm[fieldId].required === true;
		});
		emptyRequiredFieldIds = remainingRequiredFieldIds.filter(
			function (fieldId) {
				const field = document.getElementById(fieldId);
				const value = ko.unwrap(vm[fieldId]);

				if (field && /^(checkbox|radio)$/i.test(field.type)) {
					return !field.checked;
				}

				return value == null || String(value).trim() === "";
			},
		);

		console.info("HighSchoolESignStep required-field audit:", {
			clearedFields: clearedFieldIds,
			clearedNestedFields: clearedNestedFieldPaths,
			remainingRequiredFields: remainingRequiredFieldIds,
			emptyRequiredFields: emptyRequiredFieldIds,
		});
	}

	function logHighSchoolNativeValidationState() {
		const invalidControls = $("input, select, textarea")
			.filter(function () {
				return this.willValidate && !this.validity.valid;
			})
			.map(function () {
				return {
					fieldId: this.id || this.name,
					fieldType: this.type || this.tagName.toLowerCase(),
					required: this.required,
					validationMessage: this.validationMessage,
				};
			})
			.get();

		console.info("HighSchoolESignStep native validation audit:", {
			invalidControls: invalidControls,
			requiredAttributes: $(
				"input[required], select[required], textarea[required]",
			)
				.map(function () {
					return this.id || this.name;
				})
				.get(),
			ariaRequiredFields: $("[aria-required='true']")
				.map(function () {
					return this.id || this.getAttribute("name");
				})
				.get(),
		});
	}

	function registerStudentIdValidator() {
		const studentIdField = document.getElementById("studentID");

		function validateStudentId() {
			const value = String(vm.studentID() || "").trim();

			if (!value) {
				fieldValidation.clearError("studentID");
				return true;
			}

			const isNIS = /^nis$/i.test(value);
			const isOccId = /^\d{7}$/.test(value);

			if (isNIS || isOccId) {
				fieldValidation.clearError("studentID");
				return true;
			}

			fieldValidation.setError(
				"studentID",
				"Enter a 7-digit OCC ID or NIS.",
			);

			return false;
		}

		studentIdField.addEventListener("blur", validateStudentId);

		vm.studentID.subscribe(validateStudentId);
	}

	function registerFieldValidators() {
		fieldValidation.registerAutocompleteValidator({
			fieldId: "titleSearch",
			observable: vm.titleSearch,
			source: function () {
				return vm.CourseSubjectAutocomplete();
			},
			matchProperty: "courseTitle",
			allowBlank: true,
			onInvalid: function () {
				vm.titleSearch(undefined);
			},
		});

		fieldValidation.registerAutocompleteValidator({
			fieldId: "subjectSearch",
			observable: vm.subjectSearch,
			source: function () {
				return vm.SubjectsAutocomplete();
			},
			matchProperty: "subjectAbbreviation",
			allowBlank: true,
			onInvalid: function () {
				vm.subjectGUID(undefined);
				vm.courseSearch(undefined);
				vm.titleSearch(undefined);
				vm.CourseSubjectAutocomplete([]);
			},
		});

		fieldValidation.registerAutocompleteValidator({
			fieldId: "courseSearch",
			observable: vm.courseSearch,
			source: function () {
				return vm.CourseSubjectAutocomplete();
			},
			matchProperty: "courseNumber",
			allowBlank: true,
			onInvalid: function () {
				vm.courseSearch(undefined);
				vm.titleSearch(undefined);
			},
		});
	}

	function markAutoFilledFields() {
		const autoFilledFields = [
			"titleSearch",
			"studentSelectedCourse",
			"studentSelectedCourseTitle",
			"studentSignatureDate",
			"schoolRepresentativeDate",
			"parentSignatureDate",
			"schoolContact",
			"schoolContactEmail",
		];

		for (let i = 1; i <= 4; i++) {
			autoFilledFields.push(`schoolCourseAuthorizationCourse${i}`);
			autoFilledFields.push(`schoolCourseAuthorizationCourseTitle${i}`);
		}

		fieldStateUtils.setAutoFilledFields(autoFilledFields);
	}

	function setContainerVisible(containerName, shouldShow) {
		if (shouldShow) {
			fieldStateUtils.showContainers([containerName]);
		} else {
			fieldStateUtils.hideContainers([containerName]);
		}
	}

	function syncCoursesSectionVisibility() {
		setContainerVisible(
			"coursesSection",
			vm.displayCourses && vm.displayCourses() === "Yes",
		);
	}

	function syncEnrollmentTypeVisibility() {
		const enrollmentType = vm.enrollmentType && vm.enrollmentType();

		setContainerVisible("enrollmentAcknowledgements", !!enrollmentType);

		setContainerVisible("selfPayParagraph", enrollmentType === "Self-Pay");

		setContainerVisible(
			"sponsoredParagraph",
			enrollmentType === "Sponsored by High School/District",
		);
	}

	function syncEarlyCollegeVisibility() {
		const highSchoolName = vm.highSchoolName && vm.highSchoolName();
		const isOEC = highSchoolName === "OEC - Oakland Early College";
		const isEarlyCollege = vm.earlyCollegeStuChk && vm.earlyCollegeStuChk();

		setContainerVisible("earlyCollegeCol", isEarlyCollege && !isOEC);

		setContainerVisible("oaklandEarlyCollegeOptionColumn", isOEC);
	}

	function syncMaxCoursesState() {
		const maxReached = vm.studentSelectedCoursesRow().length >= 4;

		if (!pkg.isAtStep("Start")) {
			fieldStateUtils.setDisabled("addSectionBtn");
			fieldStateUtils.hideContainers(["maxCoursesWarning"]);
			return;
		}

		if (maxReached) {
			fieldStateUtils.setDisabled("addSectionBtn");
			fieldStateUtils.showContainers(["maxCoursesWarning"]);
		} else {
			fieldStateUtils.setEditable("addSectionBtn");
			fieldStateUtils.hideContainers(["maxCoursesWarning"]);
		}
	}

	function lockCourseSelectionAfterStart() {
		if (pkg.isAtStep("Start")) return;

		fieldStateUtils.lockContainers([
			"CoursesRow",
			"studentSelectedCoursesRow",
		]);

		fieldStateUtils.setDisabled("addSectionBtn");

		$("[name='selfPayRemoveRowButton']").prop("disabled", true);
	}

	function hsTypeRowShow(schoolVal) {
		// Reset state first so hidden fields do not stay required.
		requiredIndicators.setRequired("newHighSchoolName", false);
		requiredIndicators.setRequired("newSchoolContactName", false);
		requiredIndicators.setRequired("newSchoolContactEmail", false);
		requiredIndicators.setRequired("newSchoolContactPhone", false);
		requiredIndicators.setRequired("schoolDistrictName", false);

		switch (schoolVal) {
			case "Other":
				fieldStateUtils.showContainers(["newSchoolContactRow"]);
				fieldStateUtils.hideContainers([
					"schoolContactRow",
					"homeSchool",
				]);

				requiredIndicators.setRequired("newHighSchoolName", true);
				requiredIndicators.setRequired("newSchoolContactName", true);
				requiredIndicators.setRequired("newSchoolContactEmail", true);
				break;

			case "Home School":
				fieldStateUtils.showContainers(["homeSchool"]);
				fieldStateUtils.hideContainers([
					"schoolContactRow",
					"newSchoolContactRow",
				]);

				requiredIndicators.setRequired("schoolDistrictName", true);
				break;

			default:
				fieldStateUtils.showContainers(["schoolContactRow"]);
				fieldStateUtils.hideContainers([
					"newSchoolContactRow",
					"homeSchool",
				]);
				break;
		}
	}

	function getAllDataFromPagingSource(integrationCode, SubjectGUID, paging) {
		let offset = 0;
		let allData = [];
		return new Promise((resolve, reject) => {
			function getData() {
				integration
					.all(integrationCode, {
						SubjectGUID: SubjectGUID,
						offsetInt: offset,
					})
					.then((data) => {
						if (data.length === 0) {
							resolve(allData);
						} else {
							allData = [...allData, ...data];
							offset += paging;
							getData();
						}
					})
					.catch((error) => {
						reject(error);
					});
			}
			getData();
		});
	}

	function validateCourseAuthorizations() {
		const labelCourse = "Course Name";
		const labelPayment = "District Authorizes Payment for OCC Course";

		for (let i = 1; i <= 4; i++) {
			const courseField = document.getElementById(
				`schoolCourseAuthorizationCourse${i}`,
			);
			const paymentField = document.getElementById(
				`schoolCourseAuthorizationPayment${i}`,
			);

			if (courseField && paymentField) {
				const courseValue = courseField.value.trim();
				const paymentValue = paymentField.value.trim();

				if (courseValue && !paymentValue) {
					throw new Error(
						`Since ${labelCourse} ${i} is completed, ${labelPayment} ${i} must be completed.`,
					);
				}
			}
		}
	}

	return vm;
});
