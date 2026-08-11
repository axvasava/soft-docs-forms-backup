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

	vm.addObservableArray("AcademicPeriodsAutocomplete");
	vm.addObservableArray("SectionsAutocomplete");
	vm.addObservableArray("studentCourseReg");

	$("#personIdSearchBtn").click(function () {
		/* CLEAR OUT ALL AUTOPOPULATED DATA*/
		vm.studentPreferredName(undefined);

		// check if there is data in the colleague id
		if (vm.colleagueID()) {
			// check if there's 7 digits
			if (vm.colleagueID().length == 7) {
				$(".loading").show();

				// GET PERSON FROM COLLEAGUE ID
				integration
					.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
						personID: vm.colleagueID()
					})
					.then(function (personResults) {
						if (personResults) {
							vm.studentPreferredName(
								getPreferredName(personResults.names)
							);
							vm.personGUID(personResults.id);
							const studentEmail = personResults.emails.find(
								(email) => email.preference === "primary"
							);
							//return primaryEmail ? primaryEmail.address : "No primary email found";

							vm.studentEmail(studentEmail.address);
						} else {
							notify("error", "Person not found");
							$(".loading").hide();
						}
					});
			} else {
				notify("error", "Colleague ID must be 7 digits");
			}
		} else {
			notify("error", "Missing Colleague ID");
		}
	});

	//function to sort through all names and return the preferred name
	function getPreferredName(myArray) {
		// Loop through the array
		for (let i = 0; i < myArray.length; i++) {
			// Check if the current object's preference is "preferred"
			if (myArray[i].preference === "preferred") {
				// Return the fullName attribute value from the matching object
				return myArray[i].firstName + " " + myArray[i].lastName;
			}
		}
		// Return null if no match is found
		return null;
	}
	
	function makeAutoCompleteReadOnly(elementID) {
       $(`#${elementID}`)
        .prop('disabled', true)
        .attr({
            tabindex: '-1',
            'aria-disabled': 'true'
        })
        .css({
            'pointer-events': 'none',
            'background-color': '#f5f5f5',
            'color': '#555'
        });
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

		vm.skipDepartmentChair("No");
		vm.skipDean("No");

		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.
	};
	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.
		// When New Grade is entered run this code
		vm.newGrade.subscribe(function (newGradeValue) {
			//If grade is and F or WS make the Last Date of attendance as a Required field
			if (newGradeValue == "F" || newGradeValue == "WS") {
				requiredIndicators.setRequired("lastDateOfAttendance", true);
				$("#lastDateOfAttendance").addClass("missing-required-value");

				// Display message that Last Date of Attendance is now required.
				notify("info", "You must enter a Last Date of Attendance.");
			} else {
				requiredIndicators.setRequired("lastDateOfAttendance", false);
				$("#lastDateOfAttendance").removeClass(
					"missing-required-value"
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

		// integration.all('Web_Ethos_Get_Academic_Periods',{

		// }).then(function (academicPeriodEndOnData) {
		//         var todayMinus365 = dateSubtraction(365);
		//         var todayPlus125 = dateAddition(125);
		//     console.log('academicPeriodEndOnData', academicPeriodEndOnData);
		//     academicPeriodEndOnData.forEach(function (results) {
		//       if(results.endOn >= todayMinus365 &&  results.startOn <= todayPlus125){
		//         vm.AcademicPeriodsAutocomplete.push({
		//                 termCode: results.code,
		//                 termGUID: results.id,
		//                 termTitle: results.title
		//             });
		//       }
		//     });

		// });
		// console.log('AcademicPeriodsAutocomplete',vm.AcademicPeriodsAutocomplete())

		vm.personGUID.subscribe(function (NewValue) {
			if (NewValue) {
				integration.all("Web_Ethos_Section_Registration_by_Registrant", {
						personGUID: NewValue
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
								if (registrationSection.status.registrationStatus == "registered" 
									   && registrationSection.involvement.endOn >=	concatDate) {
									  p.push(
										integration.all("Web_Ethos_Get_Sections_by_Section_ID",	{
												sectionsGUID: registrationSection.section.id })
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
										const instructorName = secResult.instructorFirstName + " " + secResult.instructorLastName;

										// sometimes location doesn't exist
										const location = secResult?.site?.id;
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
                                        
										// Push to SectionRegistration array ONLY if it has a location that comes back in the results
										// Course Sections with no locations get ommitted from that array, also ommiting them from the autocomplete
										if (location)
											SectionRegistration.push(
												matchingEntry
											);
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
                                    registrationInstructorName: Results.instructorName, 
									registrationLocation: Results.location,
									registrationSectionID: Results.sectionID
								});
							});
							
						});
						
					});
			}
		});

		//  vm.termGUID.subscribe(function (newValue) {
		//     integration.all('Lingk_Get_Course_Section', {
		//         termGUID: newValue
		//     }).then(function (LingkSections) {
		//         console.log('LingkSections', LingkSections);
		//         let sections = LingkSections.nodes
		//         // Loop through LingkSections to create SectionsAutocomplete
		//         sections.forEach(function (SectionRow, index) {
		//             if (SectionRow.status != 'cancelled'){
		//                 vm.SectionsAutocomplete.push({
		//                     secName: SectionRow.code
		//                 });
		//             }
		//         });
		//         console.log('SectionsAutocomplete',vm.SectionsAutocomplete())
		//     });
		// });

		vm.locationGUID.subscribe(function (newValue) {
			integration
				.all("Web_Ethos_Get_Campus_Sites_by_GUID", {
					campusGUID: vm.locationGUID()
				})
				.then(function (locationData) {
					if (locationData.title == "Online") {
						let courseCode = vm.courseSection();

						// Split the string and get the section part (after the second dash)
						let sectionPart = courseCode.split("-")[2];

						// Determine the campus based on the first character of the sectionPart
						let onlineCampus = "";

						if (sectionPart.startsWith("A")) {
							onlineCampus = "Auburn Hills";
						} else if (sectionPart.startsWith("H")) {
							onlineCampus = "Highland Lakes";
						} else if (sectionPart.startsWith("O")) {
							onlineCampus = "Orchard Ridge";
						} else {
							onlineCampus = "Royal Oak/Southfield";
						}

						vm.campus(onlineCampus);
					} else {
						vm.campus(locationData.title);
					}
				});
		});
		
		//added 5.11.26 start
		vm.sectionGUID.subscribe(function (newValue){
		   //Web_Ethos_Get_Person_by_GUID
			integration.first("Web_Ethos_Get_Instructors_by_Section_GUID", {
              sectionGUID: newValue }
            )
            .then(function (instructorBySection) {
			    
				vm.instructorGUID(instructorBySection.instructor.id);
			    //console.log("instructorBySection",instructorBySection.instructor.id);
			}); 
		});
		
		vm.instructorGUID.subscribe(function (newValue){
			    integration.first("Web_Ethos_Get_Person_by_GUID", {
                   personGUID: newValue }
                )
                .then(function (instructorName) {
    			    if (instructorName){
        			    const firstName = instructorName.names[0].firstName;
        			    const lastName = instructorName.names[0].lastName;
        			    
        			    vm.instructor(firstName + " " + lastName);
                        
                        /*The vm.instructor field also has an autocomplete in case there is not an 
                          instructor assigned to the course. If one is located, the field will become
                          read-only. If not, one can be selected from the autocomplete */
        			    makeAutoCompleteReadOnly("instructor");
    			    } 
    			    
    			});	
		});
        // 5.11.26 end
        
		vm.courseSection.subscribe(function (newValue) {
			var changeCourse = vm.courseSection().split(/-/);
			var changeSubject = changeCourse[0];
			vm.subject(changeSubject);
		});

// 		vm.facultyStatus.subscribe(function (NewValue) {
// 		    if (NewValue == 'Dean') {
// 		        vm.skipDean("Yes");
// 		        vm.skipDepartmentChair("Yes");
// 		    } else if (NewValue == 'Full-Time Faculty') {
// 		        vm.skipDean("No");
// 		        vm.skipDepartmentChair("Yes");
// 		    } else if (NewValue == 'Adjunct Faculty') {
// 		        vm.skipDean("No");
// 		        vm.skipDepartmentChair("No");
// 		    } else if (NewValue == 'Faculty Secretary') {
// 		        if (vm.secretaryFor() == 'Full-Time Faculty') {
// 		           vm.skipDean("No");
// 		           vm.skipDepartmentChair("Yes");    
// 		        } else {
// 		           vm.skipDean("No");
// 		           vm.skipDepartmentChair("No"); 
// 		        }
		        
// 		    }  else if (vm.departmentChairEmail().toUpperCase() ==
// 				vm.originatorEmail().toUpperCase()) {
// 		        vm.skipDean("No");
// 		        vm.skipDepartmentChair("Yes");
// 		    }
// 		});
		
		vm.deanEmail.subscribe(function (NewValue) {
			if (
				vm.deanEmail().toUpperCase() ==
				vm.originatorEmail().toUpperCase()
			) {
				vm.skipDean("Yes");
			} else {
				vm.skipDean("No");
			}
		});

		vm.departmentChairEmail.subscribe(function (NewValue) {
			if (
				vm.departmentChairEmail().toUpperCase() ==
				vm.originatorEmail().toUpperCase()
			) {
				vm.skipDepartmentChair("Yes");
			} else {
				vm.skipDepartmentChair("No");
			}
		});

		//  WARNING: if an integration source is called directly to retrieve values and populate inputs
		//  with default values, setDefaults must return the integration source promise.  If it doesn't,
		//  a form draft may be created every time a user opens the form and more importantly the values
		//  may not be saved to the server.

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
				let campusParam = "";
				if (
					vm.campus() !== "Royal Oak" &&
					vm.campus() !== "Southfield"
				) {
					campusParam = vm.campus();
				} else {
					campusParam = "Royal Oak/Southfield";
				}

				integration
					.first("Get_Academic_Routing_Data", {
						subject: vm.subject(),
						campus: campusParam
					})
					.then(function (RoutingData) {
						vm.deanEmail(RoutingData.Dean_Email);
						vm.departmentChairEmail(
							RoutingData.Department_Chair_Email
						);
						vm.administrativeSpecialistEmail(
							RoutingData.Administrative_Specialist_Email
						);
					});
			}
		});
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
	function dateManipulation(days) {
		var date = new Date();
		date.setDate(date.getDate() - days);
		var year = date.getFullYear();
		var month = (date.getMonth() + 1).toString().padStart(2, "0");
		var day = date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	function dateAddition(days) {
		var date = new Date();
		date.setDate(date.getDate() + days);
		var year = date.getFullYear();
		var month = (date.getMonth() + 1).toString().padStart(2, "0");
		var day = date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	function dateSubtraction(days) {
		var date = new Date();
		date.setDate(date.getDate() - days);
		var year = date.getFullYear();
		var month = (date.getMonth() + 1).toString().padStart(2, "0");
		var day = date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}T00:00:00Z`;
	}

	return vm;
});
