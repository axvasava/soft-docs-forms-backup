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

	/* This code needs to be added to the Builder under Form Options
        <link rel="stylesheet" href="https://webapps.oaklandcc.edu/cdn/styles/main.css" />
        <link rel="stylesheet" href="https://webapps.oaklandcc.edu/cdn/icons/css/fontawesome.min.css" />
        <link rel="stylesheet" href="https://webapps.oaklandcc.edu/cdn/icons/css/solid.min.css" />
        <link rel="stylesheet" href="https://webapps.oaklandcc.edu/cdn/icons/css/regular.min.css" />
    */

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

	//This helper function is being used for the textarea's to not allow more than 1000 characters
	function setupCharacterCount(fieldId, countId, maxLength) {
		$("#" + fieldId).on("input", function () {
			var value = $(this).val();

			if (value.length > maxLength) {
				value = value.substring(0, maxLength);
				$(this).val(value);
			}

			$("#" + countId).text(maxLength - value.length);
		});
	}
	//

	vm.addObservableArray("AcademicPeriodsAutocomplete");
	vm.addObservableArray("SubjectsAutocomplete");
	vm.addObservableArray("SectionsAutocomplete");
	vm.addObservableArray("CourseSubjectAutocomplete");
	vm.addObservableArray("DeanAutocomplete");

	window.loadingCounter = 0;

	function showSpinner() {
		window.loadingCounter++;
		$(".loading").show();
	}

	function hideSpinner() {
		window.loadingCounter--;
		if (window.loadingCounter <= 0) {
			window.loadingCounter = 0;
			$(".loading").hide();
		}
	}

	function rsiQuestionResponsesReadOnlyFields() {
		fieldStateUtils.lockContainers(["rsiQuestions"]);
	}

	function rsiQuestionResponsesNotReadOnlyFields() {
		fieldStateUtils.unlockContainers(["rsiQuestions"]);
	}

	$(".developer").addClass("hidden");

	vm.onLoad = function onLoad(source, inputValues) {
		//  This takes place after applyBindings has been called and has added input observables to the
		//  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
		//  populating dropdowns, select options and other operations that need to take place every
		//  time the form is loaded.

		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.

		var vm = ko.dataFor(document.body);
	};

	function setDefaultDeanFromCourseSection(courseSection) {
		var subject = vm.selectedSubject();
		var campus = vm.campus();

		if (!subject || !campus) {
			vm.dean("");
			vm.deanEmail("");
			return;
		}

		integration
			.first("Etrieve_Integration_Get_Dean_Info_By_Campus", {
				Campus: campus,
				Subject: subject,
			})
			.then(function (deanInfo) {
				// user changed sections while request was running
				if (vm.courseSection() !== courseSection) {
					return;
				}

				vm.dean(deanInfo.Dean || "");
				vm.deanEmail(deanInfo.Dean_Email || "");
			});
	}

	function setUpdateResponsesRequired(isRequired) {
		$('input[name="updateResponses"]').prop("required", isRequired);
	}

	function clearRsiQuestionResponses() {
		var responseFields = [
			"directInstructionOne",
			"directInstructionTwo",
			"directInstructionThree",
			"directInstructionFour",
			"directInstructionFive",
			"directInstructionSix",
			"directInstructionSeven",
			"directInstructionEight",
			"studentWorkFeedbackOne",
			"studentWorkFeedbackTwo",
			"studentWorkFeedbackThree",
			"studentWorkFeedbackFour",
			"studentWorkFeedbackFive",
			"studentWorkFeedbackSix",
			"courseCommunicationOne",
			"courseCommunicationTwo",
			"courseCommunicationThree",
			"courseCommunicationFour",
			"courseCommunicationFive",
			"courseCommunicationSix",
			"courseCommunicationSeven",
			"discussionFacilitationOne",
			"discussionFacilitationTwo",
			"discussionFacilitationThree",
			"discussionFacilitationFour",
			"proactiveCommunicationOne",
			"proactiveCommunicationTwo",
			"proactiveCommunicationThree",
			"proactiveCommunicationFour",
			"proactiveCommunicationFive",
			"proactiveCommunicationSix",
			"proactiveCommunicationSeven",
			"proactiveCommunicationEight",
			"proactiveCommunicationNine",
		];

		responseFields.forEach(function (fieldId) {
			if (ko.isWriteableObservable(vm[fieldId])) {
				vm[fieldId]("");
			}
		});

		vm.updateQuestionResponses("no");
	}

	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.

		//  WARNING: if an integration source is called directly to retrieve values and populate inputs
		//  with default values, setDefaults must return the integration source promise.  If it doesn't,
		//  a form draft may be created every time a user opens the form and more importantly the values
		//  may not be saved to the server.

		/*This variable is being set to No initially so the workflow will know to Add the new row 
           The update response question is only shown when responses are returned from the database. If the
           answer to this question is No the form will not be allowed to be submitted.
        */
		vm.updateQuestionResponses("no");

		setupCharacterCount("directInstructionEight", "charCount", 1000);
		setupCharacterCount("studentWorkFeedbackSix", "charCount1", 1000);
		setupCharacterCount("courseCommunicationSeven", "charCount2", 1000);
		setupCharacterCount("discussionFacilitationFour", "charCount3", 1000);
		setupCharacterCount("proactiveCommunicationNine", "charCount4", 1000);

		if (user.isInLibrary || user.isInDrafts) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.
			showSpinner();
			integration
				.all("Web_Ethos_Get_Academic_Periods_by_endOn_Date", {
					logic: "$gte",
					endOnDate: formUtils.addDaysToCurrentDate(-24),
				})
				.then(function (academicPeriodEndOnData) {
					var todayPlus365 = formUtils.addDaysToCurrentDate(720);
					academicPeriodEndOnData.forEach(function (results) {
						if (results.endOn <= todayPlus365) {
							if (!results.code.endsWith("/AY")) {
								vm.AcademicPeriodsAutocomplete.push({
									termCode: results.code,
									termGUID: results.id,
									termTitle: results.title,
								});
							}
						}
					});
				})
				.catch(function (error) {
					console.log(
						"Error in Web Ethos Get Academic periods:",
						error,
					);
					notify("error", "There was an issue loading subjects.");
				})
				.finally(hideSpinner);

			showSpinner();

			integration
				.all("Etrieve_Integration_Get_Distinct_Deans")
				.then(function (deans) {
					vm.DeanAutocomplete([]);
					deans.forEach(function (dean) {
						vm.DeanAutocomplete.push({
							deanName: dean.Dean,
							deanEmail: dean.Dean_Email,
						});
					});
				})
				.catch(function (error) {
					console.log(
						"Error loading dean autocomplete options:",
						error,
					);

					notify(
						"error",
						"There was an issue loading the dean list.",
					);
				})
				.finally(hideSpinner);
		} else {
			//  Input Values set here will be saved to the server immediately.
			//  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
			//  prior users.  Inputs that already have values saved to the server will be overridden with
			//  values set in this method.
		}

		//All RSI questions and the update response question are hidden on start.
		if (pkg.isAtStep("Start")) {
			$(".rsiQuestions").addClass("hidden");
			$(".rsiResponseQuestion").addClass("hidden");
		}

		function clearCourseSectionSelection() {
			vm.courseSection("");
			vm.synonym("");
			vm.selectedSubject("");
			vm.SectionsAutocomplete([]);
		}

		vm.campus.subscribe(function (campus) {
			vm.selectedCampus(campus);
			clearCourseSectionSelection();
		});

		vm.academicPeriodGuid.subscribe(function () {
			clearCourseSectionSelection();
		});

		vm.updateResponses.subscribe(function (response) {
			if (response == "yes") {
				rsiQuestionResponsesNotReadOnlyFields(); //This function will make all fields available for update
			} else {
				rsiQuestionResponsesReadOnlyFields(); //This function will make all fields read-only
				notify(
					"error",
					"Since there are no updates to the reponses below, this form does not need to be submitted again.",
				);
			}

			vm.updateQuestionResponses(response);
		});

		vm.courseSection.subscribe(function (courseSection) {
			clearRsiQuestionResponses();

			if (!courseSection) {
				$(".rsiQuestions").addClass("hidden");
				$(".rsiResponseQuestion").addClass("hidden");
				setUpdateResponsesRequired(false);

				vm.selectedSubject("");
				vm.dean("");
				vm.deanEmail("");

				return;
			}

			var originatorErpId = vm.originatorErpId();

			$(".rsiQuestions").removeClass("hidden");
			$(".rsiResponseQuestion").addClass("hidden");

			setUpdateResponsesRequired(false);
			rsiQuestionResponsesReadOnlyFields();

			integration
				.all("Get_RSI_Documentation_Responses_by_Course_Section", {
					originatorErpId: originatorErpId,
					courseSection: courseSection,
				})
				.then(function (vals) {
					if (vals.length > 0) {
						var s = vals[0];

						vm.directInstructionOne(s.directInstructionOne);
						vm.directInstructionTwo(s.directInstructionTwo);
						vm.directInstructionThree(s.directInstructionThree);
						vm.directInstructionFour(s.directInstructionFour);
						vm.directInstructionFive(s.directInstructionFive);
						vm.directInstructionSix(s.directInstructionSix);
						vm.directInstructionSeven(s.directInstructionSeven);
						vm.directInstructionEight(s.directInstructionEight);
						vm.studentWorkFeedbackOne(s.studentWorkFeedbackOne);
						vm.studentWorkFeedbackTwo(s.studentWorkFeedbackTwo);
						vm.studentWorkFeedbackThree(s.studentWorkFeedbackThree);
						vm.studentWorkFeedbackFour(s.studentWorkFeedbackFour);
						vm.studentWorkFeedbackFive(s.studentWorkFeedbackFive);
						vm.studentWorkFeedbackSix(s.studentWorkFeedbackSix);
						vm.courseCommunicationOne(s.courseCommunicationOne);
						vm.courseCommunicationTwo(s.courseCommunicationTwo);
						vm.courseCommunicationThree(s.courseCommunicationThree);
						vm.courseCommunicationFour(s.courseCommunicationFour);
						vm.courseCommunicationFive(s.courseCommunicationFive);
						vm.courseCommunicationSix(s.courseCommunicationSix);
						vm.courseCommunicationSeven(s.courseCommunicationSeven);
						vm.discussionFacilitationOne(
							s.discussionFacilitationOne,
						);
						vm.discussionFacilitationTwo(
							s.discussionFacilitationTwo,
						);
						vm.discussionFacilitationThree(
							s.discussionFacilitationThree,
						);
						vm.discussionFacilitationFour(
							s.discussionFacilitationFour,
						);
						vm.proactiveCommunicationOne(
							s.proactiveCommunicationOne,
						);
						vm.proactiveCommunicationTwo(
							s.proactiveCommunicationTwo,
						);
						vm.proactiveCommunicationThree(
							s.proactiveCommunicationThree,
						);
						vm.proactiveCommunicationFour(
							s.proactiveCommunicationFour,
						);
						vm.proactiveCommunicationFive(
							s.proactiveCommunicationFive,
						);
						vm.proactiveCommunicationSix(
							s.proactiveCommunicationSix,
						);
						vm.proactiveCommunicationSeven(
							s.proactiveCommunicationSeven,
						);
						vm.proactiveCommunicationEight(
							s.proactiveCommunicationEight,
						);
						vm.proactiveCommunicationNine(
							s.proactiveCommunicationNine,
						);

						$(".rsiResponseQuestion").removeClass("hidden");
						setUpdateResponsesRequired(true);
						rsiQuestionResponsesReadOnlyFields();
					} else {
						$(".rsiResponseQuestion").addClass("hidden");
						setUpdateResponsesRequired(false);
						rsiQuestionResponsesNotReadOnlyFields();
					}
				})
				.catch(function (error) {
					console.log(
						"Error loading RSI documentation responses:",
						error,
					);

					$(".rsiResponseQuestion").addClass("hidden");
					setUpdateResponsesRequired(false);
					rsiQuestionResponsesNotReadOnlyFields();
				});

			var subjectMatch = String(courseSection).match(/^[A-Za-z]+/);
			var selectedSubject = subjectMatch ? subjectMatch[0] : "";

			vm.selectedSubject(selectedSubject);
			setDefaultDeanFromCourseSection(courseSection);
		});

		var sectionRequestId = 0;

		ko.computed(function () {
			var term = vm.academicPeriodGuid();
			var campus = vm.campus(); // <-- THIS is the filtering key
			var requestId = ++sectionRequestId;

			$(".no-sections-message").addClass("hidden");
			$("#courseSection").prop("disabled", false);

			// RUN ONLY WHEN BOTH ARE SELECTED
			if (!term || !campus) {
				return;
			}

			showSpinner();

			integration
				.all("Web_Custom_Sections", { termGUID: term })
				.then(
					function (sections) {
						if (requestId === sectionRequestId) {
							if (sections.length === 0) {
								$(".no-sections-message").removeClass("hidden");
								$("#courseSection").prop("disabled", true);
							} else {
								$(".no-sections-message").addClass("hidden");
								$("#courseSection").prop("disabled", false);
							}
						}
						return sections;
					},
					function () {
						return integration.all("Web_Custom_Sections_Previous_Period");
					},
				)
				.then(function (WebSections) {
					if (requestId !== sectionRequestId) {
						return;
					}

					vm.SectionsAutocomplete([]);

					var sections = WebSections;

					// filtered groups
					var filteredAuburn = [];
					var filteredRoyalOakSouthfield = [];
					var filteredHighlandLakes = [];
					var filteredOrchardRidge = [];

					function getCampusGroup(letter) {
						letter = letter.toUpperCase();

						if (["A", "D", "X", "Y", "Z"].includes(letter))
							return "AUBURN";
						if (["R", "S"].includes(letter)) return "ROSF";
						if (letter === "H") return "HIGHLAND";
						if (letter === "O") return "ORCHARD";
						return "UNKNOWN";
					}

					sections.forEach(function (SectionRow) {
						var code = SectionRow.secName;
						var lastPart = code.split("-").pop();
						var firstChar = lastPart.charAt(0);
						var sectionCampus = getCampusGroup(firstChar);
						switch (sectionCampus) {
							case "AUBURN":
								filteredAuburn.push(SectionRow);
								break;
							case "ROSF":
								filteredRoyalOakSouthfield.push(SectionRow);
								break;
							case "HIGHLAND":
								filteredHighlandLakes.push(SectionRow);
								break;
							case "ORCHARD":
								filteredOrchardRidge.push(SectionRow);
								break;
						}
					});

					var finalList = [];

					// CAMPUS COMPARISON FIXED HERE
					if (campus === "Auburn Hills") {
						finalList = filteredAuburn;
					} else if (campus === "Royal Oak/Southfield") {
						finalList = filteredRoyalOakSouthfield;
					} else if (campus === "Highland Lakes") {
						finalList = filteredHighlandLakes;
					} else if (campus === "Orchard Ridge") {
						finalList = filteredOrchardRidge;
					} else {
						finalList = sections;
					}
					finalList.forEach(function (SectionRow) {
						vm.SectionsAutocomplete.push({
							...SectionRow,
						});
					});
					console.log(
						"Filtered SectionsAutocomplete:",
						vm.SectionsAutocomplete(),
					);
				})
				.catch(function (err) {
					console.log("Failed to load sections.", err);
					notify("error", "Failed to load sections.");
				})
				.finally(hideSpinner);
		});

		vm.selectedTerm.subscribe((newValue) => {
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
				//vm.academicYear(academicYear);

				//GETTING ALL SUBJECTS
				showSpinner();
				integration
					.all("EthosColleagueSubjects", {
						// Add relevant parameters here
					})
					.then(function (subjectsResults) {
						subjectsResults.forEach(
							function (subjectsResultsDataRow) {
								if (
									subjectsResultsDataRow.showInCatalog === "Y"
								) {
									// Push custom attributes into autocomplete
									vm.SubjectsAutocomplete.push({
										subjectAbbreviation:
											subjectsResultsDataRow.abbreviation,
										subjectGUID: subjectsResultsDataRow.id,
										subjectTitle:
											subjectsResultsDataRow.title,
									});
								}
							},
						);
					})
					.catch(function (error) {
						console.log("Error in EthosColleagueSubjects:", error);
						notify("error", "There was an issue loading subjects.");
					})
					.finally(hideSpinner);
			} else {
				//vm.academicYear("");
			}
		});

		vm.addSubjectID.subscribe(function (newVal) {
			// empty previous results

			vm.CourseSubjectAutocomplete([]);
			vm.addCourse(undefined);

			// only run this if the subject was selected
			if (newVal) {
				console.log(newVal);
				showSpinner();
				getAllDataFromPagingSource(
					"Web_Sources_Get_Courses_by_SubjectGUID",
					newVal,
					100,
				)
					.then((listOfCoursesBySubjectData) => {
						// loop through the results
						listOfCoursesBySubjectData.forEach(
							function (listOfCoursesBySubjectDataRow) {
								if (
									listOfCoursesBySubjectDataRow.status.id ===
										"73c76722-884e-43e9-b093-8ebe092c045f" &&
									listOfCoursesBySubjectDataRow.credits[0]
										.creditCategory.creditType ===
										"institution"
								) {
									// push custom attributes into autocomplete
									vm.CourseSubjectAutocomplete.push({
										courseTitle:
											listOfCoursesBySubjectDataRow
												.titles[0].value,
										courseNumber:
											listOfCoursesBySubjectDataRow.number,
										courseSubjectAndNumber:
											//vm.addSubject() +
											//" " +
											listOfCoursesBySubjectDataRow.number,
									});
								}
							},
						);
					})
					.catch((error) => {
						console.log(
							"Failed to load CourseSubjectAutocomplete",
							error,
						);
					})
					.finally(hideSpinner);
			}
		});
	};

	vm.afterLoad = function afterLoad() {
		//  This method is called after setDefaults has been called.

		formLifecycle.afterLoad();

		//  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
		//  to save values to the server.

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

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

		if (vm.updateResponses() === "no") {
			notify(
				"error",
				"Since there are no updates to the responses below, this form does not need to be submitted again.",
			);

			return false;
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
		formLifecycle.beforeRequired();
	};

	vm.afterRequired = function afterRequired(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
		formLifecycle.afterRequired();
	};

	vm.onOptOut = function onOptOut(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	vm.onESignSubmit = function onESignSubmit(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

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

	return vm;
});
