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

	//This function is used to set the autosize function on textareas with a class of autosizeareas.
	//Uncomment to use.
	//autosize($('.autosizeareas'));

	/*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
	$(".maskphone").mask("999-999-9999");
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

	vm.addObservableArray("AcademicPeriodsAutocomplete");
	vm.addObservableArray("SubjectsAutocomplete");
	vm.addObservableArray("SectionsAutocomplete");
	vm.addObservableArray("CourseSubjectAutocomplete");
	vm.addObservableArray("RegisteredCoursesAutocomplete");

	function makeAllFieldsReadOnly() {
		fieldStateUtils.lockFields([
			"studentPhoneNumber",
			"studentSignature",
			//"semester",
		]);

		vm.addCourseRow().forEach(function (dynamicListRow, index) {
		    dynamicListRow.addTerm.disabled = true;
			dynamicListRow.addSubject.disabled = true;
			dynamicListRow.addCourse.disabled = true;
			dynamicListRow.courseSection.disabled = true;
			dynamicListRow.ddAudit.disabled = true;

			$(".btn-delete-item").prop("disabled", true);
		});

		$(".addCourseBtn").prop("disabled", true).attr("aria-disabled", "true");
		$(".removeCourseBtn")
			.prop("disabled", true)
			.attr("aria-disabled", "true");

		vm.dropCourseRow().forEach(function (dynamicListRow, index) {
			dynamicListRow.dropTerm.disabled = true;
			dynamicListRow.dropCourseName.disabled = true;

			$(".btn-delete-item").prop("disabled", true);
		});

		$(".dropCourseBtn")
			.prop("disabled", true)
			.attr("aria-disabled", "true");
		$(".removeCourseDropBtn")
			.prop("disabled", true)
			.attr("aria-disabled", "true");
	}

	vm.onLoad = function onLoad(source, inputValues) {
		//  This takes place after applyBindings has been called and has added input observables to the
		//  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
		//  populating dropdowns, select options and other operations that need to take place every
		//  time the form is loaded.

		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.

		var vm = ko.dataFor(document.body);
	};

	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.

		//  WARNING: if an integration source is called directly to retrieve values and populate inputs
		//  with default values, setDefaults must return the integration source promise.  If it doesn't,
		//  a form draft may be created every time a user opens the form and more importantly the values
		//  may not be saved to the server.

		if (user.isInLibrary || user.isInDrafts) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.

			//This populates the Term field. When the user selects a term, it populates a hidden field
			// on the form called selectedTerm. This field sets off the Subject integration.
			showSpinner();
			
			//GETS TERMS
			integration.all("Web_Ethos_Get_Academic_Periods_by_endOn_Date", {
				logic: "$gte",
				endOnDate: formUtils.addDaysToCurrentDate(0),
					
			}).then(function (academicPeriodEndOnData) {
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
			}).catch(function (error) {
				console.log("Error in Web Ethos Get Academic periods:",	error,	);
				notify("error", "There was an issue loading subjects.");
			}).finally(hideSpinner);
				
			//GETS CURRENT ACADEMIC YEAR
			integration.all("GET_Current_Academic_Year", {
					
			}).then(function (ay) {
					
				ay.forEach(function (results) {
					console.log("AY", results);
					vm.academicYear(results.AcademicYear);
				});
			}).catch(function (error) {
					console.log("Error in Get Current Academic Year:",	error,	);
					notify("error", "There was an issue retrieving the current academic year.");
			});
			
			const studentID = '1336665'; //registered for 2026/WI
			integration.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
			    personID: studentID,
			}).then(function (studentInfo) {
			      //console.log("studentInfo", studentInfo)
			      vm.personGUID(studentInfo.id); 
			}).catch(function (error) {
				// console.log("Error in EthosColleagueSubjects:", error);
				// notify("error", "There was an issue loading subjects.");
			});
				
		} else {
			//  Input Values set here will be saved to the server immediately.
			//  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
			//  prior users.  Inputs that already have values saved to the server will be overridden with
			//  values set in this method.
		}


		if (pkg.isAtStep("Start")) {
			$(".athletics").hide();
			$(".ss2").hide(); //SS2
			$(".registration").hide();
		}

		if (pkg.isAtStep("Athletics")) {
			$(".athletics").show();
			$(".ss2").hide(); //SS2
			$(".registration").hide();
			$(".loading").hide();

			makeAllFieldsReadOnly();

			fieldStateUtils.lockFields([
				"registrationSignature",
				"ss2Signature",
			]);
		}

		if (pkg.isAtStep("SS2")) {
			$(".athletics").hide();
			$(".ss2").show(); //SS2
			$(".registration").hide();
			$(".loading").hide();

			makeAllFieldsReadOnly();

			fieldStateUtils.lockFields([
				"registrationSignature",
				"athleticsSignature",
			]);
		}

		if (pkg.isAtStep("Registration")) {
			$(".athletics").hide();
			$(".ss2").hide(); //SS2
			$(".registration").show();
			$(".loading").hide();

			makeAllFieldsReadOnly();
		}

		vm.studentSignature.subscribe(function (sig) {
			vm.studentSignDate(formUtils.getTodayDate());
		});

		vm.athleticsSignature.subscribe(function (sig) {
			vm.athleticsSignDate(formUtils.getTodayDate());
		});

		vm.ss2Signature.subscribe(function (sig) {
			vm.ss2SignDate(formUtils.getTodayDate());
		});

		vm.registrationSignature.subscribe(function (sig) {
			vm.registrationSignDate(formUtils.getTodayDate());
		});
		
		vm.studentStatus.subscribe(function (value) {
		    vm.selectedStudentStatus(value);
		});

		ko.computed(function () {
			vm.addCourseRow().forEach(function (dynamicListRow, index) {
				if (dynamicListRow.ddAudit() == "Yes") {
					dynamicListRow.courseCredits("0");
				}
				
				//this is assigned here so line 582 will work
				vm.academicPeriodGuid(dynamicListRow.academicPeriodGuid);
				
			});
		});
		
		ko.computed(function () {
			vm.dropCourseRow().forEach(function (dynamicListRow, index) {
			
				
				getRegisteredCourseSections(dynamicListRow.academicPeriodGuid);
			});
		});
		

		   //GETTING ALL SUBJECTS
			showSpinner();
			integration.all("EthosColleagueSubjects", {
						
			}).then(function (subjectsResults) {
				subjectsResults.forEach(
					function (subjectsResultsDataRow) {
						if (
							subjectsResultsDataRow.showInCatalog === "Y"
						) {
						   // Push custom attributes into autocomplete
						   vm.SubjectsAutocomplete.push({
						  	 subjectAbbreviation: subjectsResultsDataRow.abbreviation,
							 subjectGUID: subjectsResultsDataRow.id,
							 subjectTitle: subjectsResultsDataRow.title,
						   });
					    }
				    },
			    );
			}).catch(function (error) {
				console.log("Error in EthosColleagueSubjects:", error);
				notify("error", "There was an issue loading subjects.");
			}).finally(hideSpinner);
			
		
			 //   // this is for dropping a course the student is already registered for		
				// vm.RegisteredCoursesAutocomplete([]);

			 //   let person = vm.personGUID()
			 //   console.log("personGUID", person)
			 //   let selectedTerm = vm.academicPeriodGuid();
			 //   integration.all("Web_Ethos_Section_Registration_by_Registrant", {
				// 	personGUID: vm.personGUID(),
					
				// }).then(function (registration) {
				// 	//console.log('AcademicPeriod', selectedTerm);

				// 	let mappedSections = [];

				// 	registration.forEach((section) => {
				// 		let regStatus = section.status.registrationStatus;
				// 		let regTermGUID = section.academicPeriod.id;

				// 		if (
				// 			regStatus == "registered" &&
				// 			regTermGUID == selectedTerm
				// 		) {
				// 			integration.all("Web_Ethos_Get_Sections_by_Section_ID", {
				// 					sectionsGUID: section.section.id,
				// 			}).then(function (courseSection) {
				// 				vm.RegisteredCoursesAutocomplete.push({
				// 					sectionCode: courseSection.code,
				// 				});
				// 			});
				// 		}
				// 	});
				// }); 

	};

	vm.afterLoad = function afterLoad() {
		//  This method is called after setDefaults has been called.

		//  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
		//  to save values to the server.

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		formLifecycle.afterLoad();

		/*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
		autosize($("textarea"));

		vm.addCourseRow().forEach(function (row) {
			wireCourseRow(row);
			wireSectionRow(row);
		});

		vm.addCourseRow.subscribe(
			function (changes) {
				changes.forEach(function (change) {
					if (change.status === "added") {
						wireCourseRow(change.value);
						wireSectionRow(change.value);
					}
				});
			},
			null,
			"arrayChange",
		);
		
		
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
		
	   var addTerms = "";
      addTerms = "";
 
      vm.addCourseRow().forEach(function (term, index) {
          if (term.addTerm()) {
             addTerms += term.addTerm();
             addTerms += "  ";
          }
      });

      addTerms = addTerms.slice(0, -2);
      vm.addTermList(addTerms);


      var dropTerms = "";
      dropTerms = "";
 
      vm.dropCourseRow().forEach(function (term, index) {
          let dropValue = selectedTerm(term.dropTerm());
          if (dropValue) {
             dropTerms += dropValue;
             dropTerms += "  ";
          }
      });

      dropTerms = dropTerms.slice(0, -2);
      vm.dropTermList(dropTerms);
       
      return false;
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

    function getRegisteredCourseSections(selectedTerm) {
        // this is for dropping a course the student is already registered for		
				vm.RegisteredCoursesAutocomplete([]);

			    let person = vm.personGUID()
			    console.log("personGUID", person)
			    //let selectedTerm = vm.academicPeriodGuid();
			    integration.all("Web_Ethos_Section_Registration_by_Registrant", {
					personGUID: person,
					
				}).then(function (registration) {
					console.log('registration', registration);

					let mappedSections = [];

					registration.forEach((section) => {
						let regStatus = section.status.registrationStatus;
						let regTermGUID = section.academicPeriod.id;

						if (
							regStatus == "registered" &&
							regTermGUID == selectedTerm
						) {
							integration.all("Web_Ethos_Get_Sections_by_Section_ID", {
									sectionsGUID: section.section.id,
							}).then(function (courseSection) {
								vm.RegisteredCoursesAutocomplete.push({
									sectionCode: courseSection.code,
								});
								
							});
						}
					});
				}); 
        
    }

	function loadCoursesBySubject(row) {
		if (!row || !row.addSubjectID) return;

		let subjectGUID = row.addSubjectID();
		let subject = row.addSubject ? row.addSubject() : "";

		vm.CourseSubjectAutocomplete([]);
		row.addCourse("");
		row.courseName("");

		if (!subjectGUID) return;

		showSpinner();

		integration
			.all("Web_Sources_Get_Courses_by_SubjectGUID", {
				SubjectGUID: subjectGUID,
				offsetInt: 0,
			})
			.then(function (courses) {
				if (!courses || !courses.length) return;

				let mappedCourses = [];

				courses.forEach(function (course) {
					let title =
						course.titles && course.titles.length
							? course.titles[0].value
							: "";
					let number = course.number || "";
					let credits = course.credits[0].minimum;

					if (number) {
						if (
							course.status.id ===
								"73c76722-884e-43e9-b093-8ebe092c045f" &&
							course.credits[0].creditCategory.creditType ===
								"institution"
						) {
							//added this section
							mappedCourses.push({
								courseTitle: title,
								courseNumber: number,
								courseSubjectAndNumber: subject + "-" + number,
								courseCredits: credits,
							});
						}
					}
				});

				vm.CourseSubjectAutocomplete(mappedCourses);
			})
			.catch(function (error) {
				console.log("Failed to load CourseSubjectAutocomplete", error);
			})
			.finally(hideSpinner);
	}

	function loadSectionsByCourse(row) {
		if (!row || !row.courseSubjectAndNumber) return;

		let courseSection = row.courseSubjectAndNumber(); //ACC-1500
		let course = row.addCourse ? row.addCourse() : "";

		vm.SectionsAutocomplete([]);
		row.courseSection("");

		if (!courseSection) return;

		showSpinner();
		let selectedTerm = vm.academicPeriodGuid();
		integration
			.all("Web_Custom_Sections", {
				termGUID: selectedTerm,
			})
			.then(function (sections) {
				if (!sections || !sections.length) return;

				let mappedSections = [];

				sections.forEach(function (section) {
					let secName = section.secName;
					let secTerm = section.secTerm;

					if (secName.includes(courseSection)) {
						mappedSections.push({
							section: secName,
						});
					}
				});

				if (!mappedSections || !mappedSections.length) {
					mappedSections.push({
						section: "No sections",
					});
				}

				vm.SectionsAutocomplete(mappedSections);
			})
			.catch(function (error) {
				console.log("Failed to load CourseSubjectAutocomplete", error);
			})
			.finally(hideSpinner);
	}

	function wireCourseRow(row) {
		if (!row || !row.addSubjectID || row._subjectSubscriptionWired) return;

		row._subjectSubscriptionWired = true;

		row.addSubjectID.subscribe(function (newVal) {
			loadCoursesBySubject(row);
		});
	}

	function wireSectionRow(row) {
		if (
			!row ||
			!row.courseSubjectAndNumber ||
			row._sectionSubscriptionWired
		)
			return;

		row._subjectSubscriptionWired = true;

		row.courseSubjectAndNumber.subscribe(function (newVal) {
			loadSectionsByCourse(row);
		});
	}
	
	

	return vm;
});
