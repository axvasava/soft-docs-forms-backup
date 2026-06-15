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
	"../293/formUtils.js",
	// "https://webapps.oaklandcc.edu/cdn/utils/formUtils.js",
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
	$(".deadlineDate").hide();
	$(".developer").hide();

	// Form-scoped required indicators manager.
	// Safe to call before init. Calls to setRequired(…) queue until afterLoad runs init(vm).
	var requiredIndicators = formUtils.createRequiredIndicators();

	// Form-scoped field state utility manager.
	// Handles readonly, disabled, hidden, helper text, export mode,
	// and workflow-style field locking behavior.
	//
	// Safe to call before init.
	// Calls to setFieldState/lockField/lockForm queue until afterLoad runs init(…).
	var fieldStateUtils = formUtils.createFieldStateUtils();

	var fieldValidation = formUtils.createFieldValidationUtils();

	//This function is used to set the autosize function on textareas with a class of autosizeareas.
	//Uncomment to use.
	//autosize($('.autosizeareas'));

	vm.addObservableArray("studentCourseReg");
	var courseSearchCompleted = ko.observable(false);
	var lastCourseLoadPersonGuid = null;
	var isLoadingCourses = false;

	vm.uiShowNoCoursesWarning = ko.computed(function () {
		const shouldDisable =
			courseSearchCompleted() && vm.studentCourseReg().length === 0;
		return shouldDisable;
	});

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

	let clickedOnDecline = false;

	$("#studentSearchButton").click(function () {
		const trimmedValue = (vm.studentSearch() || "").trim();
		vm.studentSearch(trimmedValue);
		$("#studentSearch").val(trimmedValue);

		/* CLEAR OUT ALL AUTOPOPULATED DATA*/
		vm.studentCourseReg.removeAll();
		vm.studentName(undefined);
		vm.studentEmail(undefined);

		// check if there is data in the colleague id
		if (vm.studentSearch()) {
			// check if there's 7 digits
			if (vm.studentSearch().length == 7) {
				//studentSearch

				$(".loading").show();

				// GET PERSON FROM COLLEAGUE ID
				integration
					.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
						personID: vm.studentSearch(), //studentSearch
					})
					.then(function (personResults) {
						if (personResults) {
							//console.log('Person Results', personResults);
							// const preferredName = personResults.names.find(element =>element.preference === "preferred");
							//  console.log("Preferred Name: ", preferredName.firstName + " " +preferredName.lastName)
							vm.studentName(
								formUtils.getPreferredName(personResults.names),
							);
							vm.personGUID(personResults.id);
							loadStudentCourses(personResults.id);
							const studentEmail = personResults.emails.find(
								(email) => email.preference === "primary",
							);

							//return primaryEmail ? primaryEmail.address : "No primary email found";

							vm.studentEmail(studentEmail.address);
						} else {
							fieldValidation.setError(
								"studentSearch",
								"Person not found",
							);
							$(".loading").hide();
						}
					});
				fieldValidation.clearError("studentSearch");
			} else {
				fieldValidation.setError(
					"studentSearch",
					"Colleague ID must be 7 digits.",
				);
			}
		} else {
			fieldValidation.setError("studentSearch", "Missing Colleague ID.");
		}
	});

	function formatDateAddDays(isoDateStr, daysToAdd) {
		// 1. Parse ISO date safely
		const date = new Date(isoDateStr + "T00:00:00"); // avoid timezone issues

		// 2. Add days
		date.setDate(date.getDate() + daysToAdd);

		// 3. Extract parts
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
		const year = date.getFullYear();

		// 4. Format MM/DD/YYYY
		return `${month}/${day}/${year}`;
	}

	function compareDates(startDate, endDate) {
		const startDt = new Date(startDate);
		const endDt = new Date(endDate);

		const currentDate = new Date();
		//const currentDate = new Date('04/2/2026'); //for testing

		try {
			if (startDt <= currentDate && currentDate <= endDt) {
				return true;
			} else return false;
		} catch (error) {
			console.error("Date compare error:", error);
		}
	}

	function readOnlyFields() {
		fieldStateUtils.lockFields([
			"studentSearch",
			"courseSection",
			"reason",
			"employeeSig",
			"studentSearchButton",
		]);
	}

	function hasFieldValidationErrors() {
		return (
			$(".is-field-error").filter(function () {
				return $(this).is(":visible") && !$(this).is(":disabled");
			}).length > 0
		);
	}

	function blockIfFieldValidationErrors() {
		if (hasFieldValidationErrors()) {
			notify(
				"error",
				"Please fix the validation errors before continuing.",
			);
			return false;
		}

		return true;
	}

	vm.onLoad = function onLoad(source, inputValues) {
		//  This takes place after applyBindings has been called and has added input observables to the
		//  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
		//  populating dropdowns, select options and other operations that need to take place every
		//  time the form is loaded.

		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.

		if (user.isOriginator) {
			$(".dean").hide();
		}
	};

	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.

		//  WARNING: if an integration source is called directly to retrieve values and populate inputs
		//  with default values, setDefaults must return the integration source promise.  If it doesn't,
		//  a form draft may be created every time a user opens the form and more importantly the values
		//  may not be saved to the server.

		fieldStateUtils.unlockFields(["deadlineDate"]);

		vm.personGUID.subscribe(function (newValue) {
			loadStudentCourses(newValue);
		});
		vm.studentEmail.subscribe(function (sig) {
			const email = $("#studentEmail").val();
			const username = email.split("@")[0];

			vm.username(username);
		});

		//Populating today's date on signature
		vm.employeeSig.subscribe(function (sig) {
			vm.employeeSigDate(formUtils.getTodayDate());
		});

		//Populating today's date on signature
		vm.deanSigName.subscribe(function (sig) {
			vm.deanSigDate(formUtils.getTodayDate());
		});

		// if currentDate is past the deadline date (censusDate + 21) then "This course has passed the deadline date!"
		vm.deadlineDate.subscribe(function (deadlineDt) {
			if (!deadlineDt || vm.uiShowNoCoursesWarning()) {
				return;
			}

			const deadlineDate = new Date(deadlineDt);
			const currentDate = new Date();

			if (currentDate > deadlineDate) {
				notify(
					"error",
					"This deadline date has passed for this course.",
				);
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

		if (pkg.isAtStep("ConditionalActorDean")) {
			readOnlyFields();

			//  $('#deanSigName').prop('readonly', true);
		}

		if (pkg.isAtStep("Registrar")) {
			readOnlyFields();
			fieldStateUtils.setReadOnly("deanSigName");
		}

		if (user.isInLibrary) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.
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

		// Initialize required indicators after VM bindings and form DOM are ready.
		// This replays any queued setRequired(…) calls made earlier in setDefaults.
		requiredIndicators.init(vm);

		// Initialize field state utilities after the form and required indicators are ready.
		// Pass requiredIndicators so hidden/disabled fields can automatically
		// clear required validation state when locked or hidden.
		fieldStateUtils.init({ requiredIndicators: requiredIndicators });

		vm.uiShowNoCoursesWarning.subscribe(applyNoCoursesWarningState);
		applyNoCoursesWarningState(vm.uiShowNoCoursesWarning());

		// Toggle export mode styling and behavior.
		// Hides required indicators/notes and normalizes readonly presentation for export.
		fieldStateUtils.setExportMode(pkg.isExporting);

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		fieldValidation.initAll();

		if (user.isOriginator || user.isInLibrary || user.isInDrafts) {
			fieldValidation.registerAutocompleteValidator({
				fieldId: "courseSection",
				observable: vm.courseSection,
				source: function () {
					return vm.studentCourseReg();
				},
				matchProperty: "registrationSection",
				allowBlank: true,

				onInvalid: function () {
					vm.deadlineDate("");
					vm.deanEmail("");
					if (value && value.trim()) {
						fieldValidation.setError(
							"courseSection",
							"Please select a valid course section from the dropdown.",
						);
					} else {
						fieldValidation.clearError("courseSection");
					}
				},

				onValid: function (value) {
					fieldValidation.clearError("courseSection");
					var subject = value.split("-")[0];
					var expectedValue = value;

					integration
						.first("Etrieve_Integration_Get_Dean_Info_By_Subject", {
							Subject: subject,
						})
						.then(function (val) {
							if (vm.courseSection() !== expectedValue) return;

							// if  dean email is carbone replace with linden
							if (
								val.Dean_Email.toLowerCase() ===
								"clcarbon@oaklandcc.edu"
							) {
								vm.deanEmail("smlinden@oaklandcc.edu");
							} else {
								vm.deanEmail(val.Dean_Email);
								// vm.deanEmail("axvasava@oaklandcc.edu");
							}
						});
				},
			});
		}

		if (vm.personGUID && vm.personGUID()) {
			loadStudentCourses(vm.personGUID());
		}

		vm.studentSearch.subscribe(function (newValue) {
			const trimmedValue = (vm.studentSearch() || "").trim();
			if (trimmedValue.length !== 7) {
				fieldValidation.setError(
					"studentSearch",
					"Please enter a valid 7 digit student ID.",
				);
			} else {
				fieldValidation.clearError("studentSearch");
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

	function loadStudentCourses(personGuid) {
		if (!personGuid) return;

		var xnStatusId = null;

		if (isLoadingCourses && lastCourseLoadPersonGuid === personGuid) {
			return;
		}

		isLoadingCourses = true;
		lastCourseLoadPersonGuid = personGuid;

		courseSearchCompleted(false);
		vm.studentCourseReg.removeAll();

		integration
			.all("Web_Ethos_Get_All_Registration_Statuses")
			.then(function (statuses) {
				var xnStatus = statuses.find(function (status) {
					return status.code === "XN";
				});

				if (!xnStatus || !xnStatus.id) {
					throw new Error(
						"Could not find registration status code XN.",
					);
				}

				xnStatusId = xnStatus.id;

				return integration.all(
					"Web_Ethos_Section_Registration_by_Registrant",
					{
						personGUID: personGuid,
					},
				);
			})
			.then(function (registrationResults) {
				const today = new Date();
				const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
				const daysToSubtract = 100;
				const resultDate = new Date(
					today.getTime() - daysToSubtract * oneDayInMilliseconds,
				);

				const formattedDateOnly = resultDate
					.toISOString()
					.substring(0, 10);
				const concatDate = formattedDateOnly + "T00:00:00:-04:00";

				var p = [];

				registrationResults.forEach(function (registrationSection) {
					if (
						registrationSection.status.detail.id === xnStatusId &&
						registrationSection.involvement.endOn >= concatDate
					) {
						p.push(
							integration.all(
								"Web_Ethos_Get_Sections_by_Section_ID",
								{
									sectionsGUID:
										registrationSection.section.id,
								},
							),
						);
					}
				});

				if (p.length === 0) {
					courseSearchCompleted(true);
					return [];
				}

				return Promise.all(p).then(function (sectionResults) {
					let isCurrentTerm = false;

					for (const regResult of registrationResults) {
						for (const secResult of sectionResults) {
							if (regResult.section.id === secResult.id) {
								isCurrentTerm = compareDates(
									secResult.startOn,
									secResult.endOn,
								);

								if (isCurrentTerm) {
									vm.studentCourseReg.push({
										registrationStatus:
											regResult.status.registrationStatus,
										registrationGUID: regResult.id,
										registrationStartDate:
											secResult.startOn,
										registrationEndDate: secResult.endOn,
										registrationTerm: secResult.termCode,
										registrationSection: secResult.code,
										registrationInstructorName:
											secResult.instructorFirstName +
											" " +
											secResult.instructorLastName,
										registrationCourseTitle:
											secResult.titles[0].value,
										registrationDeadlineDate:
											formatDateAddDays(
												secResult.censusDates[1],
												21,
											),
									});
								}
							}
						}
					}

					courseSearchCompleted(true);
				});
			})
			.catch(function (error) {
				console.error("Failed to load student courses:", error);
				courseSearchCompleted(true);
				notify("error", "There was an issue loading student courses.");
			})
			.finally(function () {
				isLoadingCourses = false;
				$(".loading").hide();
			});
	}

	function applyNoCoursesWarningState(shouldDisable) {
		console.info("uiShowNoCoursesWarning:", shouldDisable);

		if (!pkg.isAtStep("Start") && !user.isInLibrary && !user.isInDrafts) {
			return;
		}

		if (shouldDisable) {
			vm.courseSection("");
			vm.courseTitle("");

			fieldStateUtils.lockFields([
				"courseSection",
				"reason",
				"employeeSig",
			]);

			requiredIndicators.setRequiredFields(
				["courseSection", "reason", "employeeSig"],
				false,
			);

			fieldValidation.clearError("courseSection");
		} else {
			fieldStateUtils.unlockFields([
				"courseSection",
				"reason",
				"employeeSig",
			]);
			requiredIndicators.setRequiredFields(
				["courseSection", "reason", "employeeSig"],
				true,
			);
			fieldValidation.clearError("courseSection");
		}
	}

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

		if (!blockIfFieldValidationErrors()) return false;

		if (vm.uiShowNoCoursesWarning()) {
			notify(
				"error",
				"No eligible course registrations were found for this student.",
			);
			return false;
		}
	};

	vm.onApprove = function onApprove(form) {
		//  This method is called when the Approve button is clicked and before calling beforeRequired.

		if (!blockIfFieldValidationErrors()) return false;
	};

	vm.onDecline = function onDecline(form) {
		//  This method is called when the Decline button is clicked and before calling beforeRequired.
		//   const declineReason = $('#deanReasonDecline').val();
		//   if (declineReason == '') {
		//       notify('error', 'Reason for decline is a required field.');
		//       return false;
		//   }

		if (!blockIfFieldValidationErrors()) return false;
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
		// Remove temporary native browser `required` attributes after validation.
		// Required state is still tracked by the required indicators utility
		// through VM state, aria-required, and the visual required marker (*).
		requiredIndicators.clearNativeRequired();
		$(".missing-required-value").removeClass("missing-required-value");
	};

	vm.onOptOut = function onOptOut(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	vm.onESignSubmit = function onESignSubmit(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	return vm;
});
