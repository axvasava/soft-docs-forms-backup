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
	"https://softdocscdn.etrieve.cloud/extenders/extenders.min.js"
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
	formUtils
) {
	$(".developer").hide();

	// Form-scoped required indicators manager.
	// Safe to call before init. Calls to setRequired(...) queue until afterLoad runs init(vm).
	var requiredIndicators = formUtils.createRequiredIndicators();

	// Form-scoped autocomplete utility manager.
	// Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
	var autoCompleteUtils = formUtils.createAutoCompleteUtils();

	var gradeVal = "";

	vm.addObservableArray("studentCourseReg");

	// Function to sort through all emails and return the primary name
	function getPrimaryEmail(emailArray) {
		// Loop through the array
		for (let i = 0; i < emailArray.length; i++) {
			// Check if the current object's preference is "primary"
			if (emailArray[i].preference === "primary") {
				// Return the address attribute value from the matching object
				return emailArray[i].address;
			}
		}
		// Return null if no match is found
		return null;
	}

	//This Function provides a unique ID for the form
	function makeid(length) {
		var result = "";
		var characters = "ABCDEFG0123456789";
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(
				Math.floor(Math.random() * charactersLength)
			);
		}
		return new Date().getFullYear() + "-" + result;
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
		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.
	};
	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.

		requiredIndicators.setRequired(
			"rationaleGradeAppeal",
			pkg.isAtStep("Start")
		);

		integration
			.all("Web_Ethos_Get_Persons_by_Colleague_ID", {
				personID: user.ErpId
			})
			.then(function (personResults) {
				vm.ethosGUID(personResults[0].id);

				integration
					.all("Web_Ethos_Section_Registration_by_Registrant", {
						personGUID: personResults[0].id
					})
					.then(function (registrationResults) {
						//start determining today - 365 days and formatting this date to match how the endOn value is being returned by Ethos
						const today = new Date();
						const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
						const daysToSubtract = 365;
						const resultDate = new Date(
							today.getTime() -
								daysToSubtract * oneDayInMilliseconds
						);
						const formattedDate = resultDate.toISOString();
						const formattedDateOnly = formattedDate.substring(
							0,
							10
						);
						const concatDate =
							formattedDateOnly + "T00:00:00:-04:00";

						var p = []; //this our promise array
						registrationResults.forEach(
							function (registrationSection, index) {
								if (
									registrationSection.status
										.registrationStatus == "registered" &&
									registrationSection.involvement.endOn >=
										concatDate
								) {
									p.push(
										integration.all(
											"Web_Ethos_Get_Sections_by_Section_ID",
											{
												sectionsGUID:
													registrationSection.section
														.id
											}
										)
									);
								}
							}
						);
						Promise.all(p).then(function (sectionResults) {
							// Initialize an empty array to store matching results
							const SectionRegistration = [];

							// Loop through registrationResults and sectionResults
							for (const regResult of registrationResults) {
								for (const secResult of sectionResults) {
									if (regResult.section.id === secResult.id) {
										// Extract desired information
										const regStatus =
											regResult.status.registrationStatus;
										const regGUID = regResult.id;
										const endDate = secResult.endOn;
										const term = secResult.termCode;
										const section = secResult.code;
										const instructorName =
											secResult.instructorFirstName +
											" " +
											secResult.instructorLastName;
										const location = secResult.site.id;
										const sectionID = secResult.id;

										// Create an object with extracted information
										const matchingEntry = {
											regStatus,
											regGUID,
											endDate,
											term,
											section,
											instructorName,
											location,
											sectionID
										};

										// Push to SectionRegistration array
										SectionRegistration.push(matchingEntry);
									}
								}
							}

							// Print or use the SectionRegistration array as needed
							SectionRegistration.forEach(function (Results) {
								vm.studentCourseReg.push({
									registrationStatus: Results.regStatus,
									registrationGUID: Results.regGUID,
									registrationEndDate: Results.endDate,
									registrationTerm: Results.term,
									registrationSection: Results.section,
									registrationInstructorName:
										Results.instructorName,
									registrationLocation: Results.location,
									registrationSectionID: Results.sectionID
								});
							});
						});
					});
			});

		vm.courseSection.subscribe(function (newValue) {
			if (!newValue) return;

			var Course = vm.courseSection().split(/-/);
			var Subject = Course[0];
			vm.subject(Subject);
		});

		vm.locationGUID.subscribe(function (newValue) {
			integration
				.all("Web_Ethos_Get_Campus_Sites_by_GUID", {
					campusGUID: vm.locationGUID()
				})
				.then(function (locationData) {
					vm.campus(locationData.title);
				});
		});

		vm.sectionGUID.subscribe(function (newValue) {
			integration
				.all("Web_Ethos_Get_Student_Transcript_Grades_by_STC_GUID", {
					studentGUID: vm.ethosGUID()
				})
				.then(function (stcData) {
					stcData.forEach(function (Results) {
						if (vm.sectionGUID() == Results.course.section.id) {
							vm.gradeGUID(Results.grade.id);
						} else {
							vm.grade("No Grade Found");
						}
					});
				});
		});

		vm.sectionGUID.subscribe(function (newValue) {
			integration
				.all("Web_Ethos_Get_Instructors_by_Section_GUID", {
					sectionGUID: vm.sectionGUID()
				})
				.then(function (instructorData) {
					instructorData.forEach(function (Results) {
						if (Results.instructorRole == "primary") {
							vm.instructorGUID(Results.instructor.id);

							integration
								.all("Web_Ethos_Get_Person_by_GUID", {
									personGUID: Results.instructor.id
								})
								.then(function (instructorInformation) {
									vm.instructorEmail(
										getPrimaryEmail(
											instructorInformation.emails
										)
									);
								});
						} else {
							console.log("No Primary Instructor");
							notify("error", "No Primary Instructor Found");
						}
					});
				});
		});

		vm.gradeGUID.subscribe(function (newValue) {
			integration
				.first("Web_Ethos_Get_Grade_Definitions_by_ID", {
					gradeGUID: vm.gradeGUID()
				})
				.then(function (gradeData) {
					/*Notifying users: they can't submit the form if gradeData = N*/
					gradeVal = gradeData.grade.value;

					if (gradeVal === "N") {
						notify(
							"error",
							"You cannot use this form to remove an N grade"
						);
					}

					vm.grade(gradeData.grade.value); //== Results.course.section.id);
				});
		});
		/*Making "You MUST Submit a Change of Grade Checkbox required at its respectives steps*/
		if (pkg.isAtStep("ConditionalActorInstructor")) {
			requiredIndicators.setRequired(
				"instructorSubmitChangeGrade",
				false
			);
		} else if (pkg.isAtStep("ConditionalActorDepartmentChair")) {
			requiredIndicators.setRequired("deptChairSubmitChangeGrade", false);
		} else if (pkg.isAtStep("ConditionalActorAdministrativeReviewer")) {
			requiredIndicators.setRequired("deanSubmitChangeGrade", false);
		}

		//Conditionally Shpw/Hide rows based upon WF steps
		if (
			pkg.stepCode === "ConditionalActorInstructor" ||
			pkg.stepCode === "ConditionalActorOriginatorEscalateToDeptChair" ||
			pkg.stepCode === "ConditionalActorDepartmentChair" ||
			pkg.stepCode ===
				"ConditionalActorOriginatorEscalateToAdminApprover" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ApprovalEndStep" ||
			pkg.stepCode === "NotEscalatedEndStep" ||
			pkg.stepCode === "DeniedEndStep" ||
			user.isInActivity
		) {
			$(".instructorResponseRow").show();
		} else {
			$(".instructorResponseRow").hide();
		}

		if (
			pkg.stepCode === "ConditionalActorOriginatorEscalateToDeptChair" ||
			pkg.stepCode === "ConditionalActorDepartmentChair" ||
			pkg.stepCode ===
				"ConditionalActorOriginatorEscalateToAdminApprover" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ApprovalEndStep" ||
			pkg.stepCode === "NotEscalatedEndStep" ||
			pkg.stepCode === "DeniedEndStep" ||
			user.isInActivity
		) {
			$(".studentDepartmentChairSubmissionRow").show();
		} else {
			$(".studentDepartmentChairSubmissionRow").hide();
		}

		if (
			pkg.stepCode === "ConditionalActorDepartmentChair" ||
			pkg.stepCode ===
				"ConditionalActorOriginatorEscalateToAdminApprover" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ApprovalEndStep" ||
			pkg.stepCode === "NotEscalatedEndStep" ||
			pkg.stepCode === "DeniedEndStep" ||
			user.isInActivity
		) {
			$(".departmentChairResponseRow").show();
		} else {
			$(".departmentChairResponseRow").hide();
		}

		if (
			pkg.stepCode ===
				"ConditionalActorOriginatorEscalateToAdminApprover" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ApprovalEndStep" ||
			pkg.stepCode === "NotEscalatedEndStep" ||
			pkg.stepCode === "DeniedEndStep" ||
			user.isInActivity
		) {
			$(".studentAdminReviewerSubmissionRow").show();
		} else {
			$(".studentAdminReviewerSubmissionRow").hide();
		}

		if (
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ConditionalActorAdministrativeReviewer" ||
			pkg.stepCode === "ApprovalEndStep" ||
			pkg.stepCode === "NotEscalatedEndStep" ||
			pkg.stepCode === "DeniedEndStep" ||
			user.isInActivity
		) {
			$(".adminReviewerResponseRow").show();
		} else {
			$(".adminReviewerResponseRow").hide();
		}

		//add current date to the instructorDate when a value changes for the instructorRecommendation field.
		vm.instructorRecommendation.subscribe(function (newValue) {
			if (instructorRecommendation.length > 0) {
				var today = new Date();
				var dd = String(today.getDate()).padStart(2, "0");
				var mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
				var yyyy = today.getFullYear();

				var currentDate = mm + "/" + dd + "/" + yyyy;
				vm.instructorDate(currentDate);
			} else {
				vm.instructorDate(undefined);
			}
		});

		//add current date to the departmentChairDate when a value changes for the dcRecommendation field.
		vm.dcRecommendation.subscribe(function (newValue) {
			if (dcRecommendation.length > 0) {
				var today = new Date();
				var dd = String(today.getDate()).padStart(2, "0");
				var mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
				var yyyy = today.getFullYear();

				var currentDate = mm + "/" + dd + "/" + yyyy;
				vm.departmentChairDate(currentDate);
			} else {
				vm.departmentChairDate(undefined);
			}
		});

		//add current date to the departmentChairDate when a value changes for the deanDecision field.
		vm.deanDecision.subscribe(function (newValue) {
			if (deanDecision.length > 0) {
				var today = new Date();
				var dd = String(today.getDate()).padStart(2, "0");
				var mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
				var yyyy = today.getFullYear();

				var currentDate = mm + "/" + dd + "/" + yyyy;
				vm.deanDate(currentDate);
			} else {
				vm.deanDate(undefined);
			}
		});

		vm.semester.subscribe((newValue) => {
			if (newValue) {
				let [year, season] = newValue.split("/"); // Split the term into year and season
				let startYear = parseInt(year, 10); // Parse the year part as an integer
				let academicYear;
				// Determine the academic year based on the term season
				if (season === "FA") {
					// Fall is part of the next academic year cycle
					academicYear = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
				} else if (
					season === "WI" ||
					season === "SU" ||
					season === "AY"
				) {
					// Winter and Summer are part of the current academic year cycle
					academicYear = `${startYear - 1}-${startYear.toString().slice(-2)}`;
				} else {
					// Handle unexpected input
					academicYear = "Invalid term";
				}
				// Update the academicYear observable
				vm.academicYear(academicYear);
			} else {
				vm.academicYear("");
			}
		});

		//  WARNING: if an integration source is called directly to retrieve values and populate inputs
		//  with default values, setDefaults must return the integration source promise.  If it doesn't,
		//  a form draft may be created every time a user opens the form and more importantly the values
		//  may not be saved to the server.

		if (user.isInLibrary) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.

			vm.formID(makeid(6));
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

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		// Initialize required indicators after VM bindings and form DOM are ready.
		// This replays any queued setRequired(...) calls made earlier in setDefaults.
		requiredIndicators.init(vm);

		// Initialize autocomplete utilities after VM bindings are ready.
		// Replays any queued makeReadOnly/makeEditable calls made earlier.
		autoCompleteUtils.init(vm);

		// Toggle export mode styling and behavior.
		// Hides required indicators/notes and normalizes readonly presentation for export.
		autoCompleteUtils.setExportMode(pkg.isExporting);

		ko.computed(function () {
			if (vm.subject() && vm.campus()) {
				integration
					.first("Get_Academic_Routing_Data", {
						subject: vm.subject(),
						campus: vm.campus()
					})
					.then(function (RoutingData) {
						vm.departmentChairName(RoutingData.Department_Chair);
						vm.departmentChairEmail(
							RoutingData.Department_Chair_Email
						);
						vm.administrativeSpecialistEmail(
							RoutingData.Administrative_Specialist_Email
						);
						vm.deanName(RoutingData.Dean);
						vm.deanEmail(RoutingData.Dean_Email);
					});
			}
		});

		/*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
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

		/*Preventing users from submitting the form if Grade = N*/
		if (gradeVal == "N") {
			throw new Error("You cannot use this form to remove an N grade");
		}
	};

	vm.onApprove = function onApprove(form) {
		//  This method is called when the Approve button is clicked and before calling beforeRequired.
	};

	vm.onDecline = function onDecline(form) {
		//  This method is called when the Decline button is clicked and before calling beforeRequired.
	};

	vm.beforeRequired = function beforeRequired(form) {
		//  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
		// Enable native DOM `required` attributes at validation time.
		// This prevents fields from appearing invalid on initial load,
		// while still allowing browser validation during submit.
		requiredIndicators.applyNativeRequiredForValidation();
	};

	vm.afterRequired = function afterRequired(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
		requiredIndicators.clearNativeRequired();
	};

	vm.onOptOut = function onOptOut(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	vm.onESignSubmit = function onESignSubmit(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	return vm;
});
