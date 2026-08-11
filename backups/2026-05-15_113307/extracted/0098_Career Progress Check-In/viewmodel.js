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
  //This function is used to set the autosize function on textareas with a class of autosizeareas.
  //Uncomment to use.
  //autosize($('.autosizeareas'));

  // Form-scoped required indicators manager.
  // Safe to call before init. Calls to setRequired(…) queue until afterLoad runs init(vm).
  var requiredIndicators = formUtils.createRequiredIndicators();

  // Form-scoped autocomplete utility manager.
  // Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
  var autoCompleteUtils = formUtils.createAutoCompleteUtils();

  vm.addObservableArray("personsPositionsList");
  vm.personsPositionsList([]);

  $(".checkIn2").hide();
  $(".checkIn3").hide();
  $(".developer").hide();

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

  /************************************ FORM UPDATES **********************************************************
     2.24.25  ep_sd Form was using the approving users ID to grab the data from the database
                    which was causing a missmatch in the data. Added the originatorErpId to a
                    variable and used that in the integration. (see comments in code)
     2.26.26  ep_sd Origintor will submit 3 forms; Check-In 1, 2, 3. Form data is written to the 
                    database after each approval. After Check-In 3 has been approved, form data
                    will be written to database with final status of Complete. The 
                    originator wasn't seeing the correct sections and Check-In status in their submissions 
                    after form was submitted. This was corrected by adding code at each pkg.isAtStep to control
                    visibility and only allowing the code in afterLoad to run when isInLibrary or isInDrafts.

   **************************************************************************************************************/

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

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    /* 2.26.26 THIS IS FORCING THE DROPDOWN TO USE THE FISCAL YEAR EVEN IF THE PERSON SELECTS 
           SOMETHING DIFFERENT. BRIAN SELECTED 2024-25 AND THE CODE KEEPS OVERWRITING IT WITH 
           2025-26.     
        */
    //const fiscalYear = getFiscalYearLabel();
    //vm.checkInYear(fiscalYear);

    if (
      pkg.isAtStep("CheckIn1Supervisor") ||
      pkg.isAtStep("CheckIn2Supervisor") ||
      pkg.isAtStep("CheckIn3Supervisor")
    ) {
      $("#checkInYear").prop("disabled", true);
    }

    //2.26.26
    if (
      pkg.isAtStep("CheckIn1Supervisor") ||
      (pkg.isAtStep("Ended") && vm.checkInNumber() == "1")
    ) {
      $("#personalGoals").prop("readonly", true);
      $("#departmentGoals").prop("readonly", true);
      $("#collegewideGoals").prop("readonly", true);
      $("#empFeedbackCheckIn1").prop("readonly", true);
      $("#additionalCommentsCheckIn1").prop("readonly", false);
    }

    if (pkg.isAtStep("End")) {
      $(".checkIn2").show();
      $(".checkIn3").show();
    }

    //2.26.26
    //if(pkg.isAtStep('CheckIn2Supervisor')){
    if (
      pkg.isAtStep("CheckIn2Supervisor") ||
      (pkg.isAtStep("Ended") && vm.checkInNumber() == "2")
    ) {
      $(".checkIn1").show();
      $(".checkIn2").show();

      //2.26.26 everything below
      vm.checkInNumber("2");
      $("#personalGoals").prop("readonly", true);
      $("#departmentGoals").prop("readonly", true);
      $("#collegewideGoals").prop("readonly", true);
      $("#empFeedbackCheckIn1").prop("readonly", true);
      $("#additionalCommentsCheckIn1").prop("readonly", true);

      //make 2nd check in inputs read only
      $("#keyAccompCheckin2").prop("readonly", true);
      $("#opportunitiesCheckIn2").prop("readonly", true);
      $("#supportiveMeasuresCheckIn2").prop("readonly", true);
      $("#empFeedbackCheckIn2").prop("readonly", true);
      $("#additionalCommentsCheckIn2").prop("readonly", false);

      getCPCIData("2");
    }

    //2.26.26
    //if(pkg.isAtStep('CheckIn3Supervisor')){
    if (
      pkg.isAtStep("CheckIn3Supervisor") ||
      (pkg.isAtStep("Ended") && vm.checkInNumber() == "3")
    ) {
      $(".checkIn1").show();
      $(".checkIn2").show();
      $(".checkIn3").show();

      //2.26.26 everything below
      vm.checkInNumber("3");

      //make 1st check in inputs read only
      $("#personalGoals").prop("readonly", true);
      $("#departmentGoals").prop("readonly", true);
      $("#collegewideGoals").prop("readonly", true);
      $("#empFeedbackCheckIn1").prop("readonly", true);
      $("#additionalCommentsCheckIn1").prop("readonly", true);

      //make 2nd check in inputs read only
      $("#keyAccompCheckin2").prop("readonly", true);
      $("#opportunitiesCheckIn2").prop("readonly", true);
      $("#supportiveMeasuresCheckIn2").prop("readonly", true);
      $("#empFeedbackCheckIn2").prop("readonly", true);
      $("#additionalCommentsCheckIn2").prop("readonly", true);

      //make 3rd check in inputs read only
      $("#keyAccompCheckin3").prop("readonly", true);
      $("#opportunitiesCheckIn3").prop("readonly", true);
      $("#supportiveMeasuresCheckIn3").prop("readonly", true);
      $("#empFeedbackCheckIn3").prop("readonly", true);
      $("#additionalCommentsCheckIn3").prop("readonly", false);

      getCPCIData("3");
    }

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.

      vm.supervisorGUID.subscribe(function (NewValue) {
        if (NewValue != "No Supervisor GUID") {
          integration
            .all("Web_Ethos_Get_Person_by_GUID", {
              personGUID: vm.supervisorGUID(),
            })
            .then(function (supervisorData) {
              vm.supervisorName(getPreferredName(supervisorData.names));
              vm.supervisorEmail(getPrimaryEmail(supervisorData.emails));
            });
        } else {
          vm.supervisorName("No Supervisor Found");
          vm.supervisorEmail("No Supervisor Found");
        }
      });

      vm.departmentGUID.subscribe(function (NewValue) {
        if (NewValue) {
          integration
            .all("Web_Ethos_Get_Employment_Department_by_GUID", {
              deptGUID: vm.departmentGUID(),
            })
            .then(function (departmentData) {
              vm.currentDepartment(departmentData.title);
            });
        }
      });

      /* CLEAR OUT ALL AUTOPOPULATED DATA*/
      vm.employeeName(undefined);
      vm.currentCampus(undefined);
      vm.currentDepartment(undefined);

      $(".loading").show();

      // GET PERSON FROM COLLEAGUE ID
      integration
        .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
          personID: user.ErpId,
        })
        .then(function (personResults) {
          if (personResults) {
            vm.employeeName(getPreferredName(personResults.names));
            vm.employeeFirstName(getPreferredFirstName(personResults.names));
            vm.employeeLastName(getPreferredLastName(personResults.names));

            integration
              .all("Web_Ethos_Get_active_institution_jobs_by_Person_GUID", {
                personGUID: personResults.id,
              })
              .then(function (allInstJob) {
                // GET PERSON POSITIONS
                // loop through allInstJob
                // Create an array to store promises
                const promises = [];
                vm.personsPositionsList([]); // clear out local array

                //Get all Employee positions
                allInstJob.forEach(function (job) {
                  // Extract the supervisor ID
                  //const supervisorID = job.supervisors[0].supervisor.id;
                  let supervisorID = "No Supervisor GUID";
                  if (job.supervisors) {
                    if (job.supervisors[0].supervisor.id) {
                      supervisorID = job.supervisors[0].supervisor.id;
                    }
                  }

                  // Push promises into the array
                  const positionPromise = integration.first(
                    "Web_Ethos_Get_institution_positions_by_Position_GUID",
                    {
                      positionGUID: job.position.id,
                    },
                  );

                  promises.push(
                    positionPromise.then(function (personPositions) {
                      return integration
                        .first("Web_Ethos_Get_Campus_Sites_by_GUID", {
                          campusGUID: personPositions.campus.id,
                        })
                        .then(function (personPosCampus) {
                          // Return the combined data including supervisor ID
                          return {
                            personPositions,
                            personPosCampus,
                            supervisorID,
                          };
                        });
                    }),
                  );
                });

                // Wait for all promises to resolve
                Promise.all(promises)
                  .then(function (results) {
                    // Handle the combined data here
                    // You can access individual results like results[0].personPositions, results[0].personPosCampus, etc.
                    $(".loading").hide();
                    results.forEach(function (resultData) {
                      vm.personsPositionsList.push({
                        positionTitle: resultData.personPositions.title,
                        campusTitle: resultData.personPosCampus.title,
                        positionDepartmentGUID:
                          resultData.personPositions.departments[0].id,
                        supervisorGUID: resultData.supervisorID,
                      });
                    });

                    vm.personsPositionsList.sort(function (a, b) {
                      // Compare positionTitle
                      if (a.positionTitle < b.positionTitle) return -1;
                      if (a.positionTitle > b.positionTitle) return 1;

                      // If positionTitles are equal, compare positionCode
                      if (a.positionCode < b.positionCode) return -1;
                      if (a.positionCode > b.positionCode) return 1;

                      // If positionCodes are also equal, compare campusTitle
                      if (a.campusTitle < b.campusTitle) return -1;
                      if (a.campusTitle > b.campusTitle) return 1;

                      // Objects are considered equal in all criteria
                      return 0;
                    });
                  })
                  .catch(function (error) {
                    // Handle errors here
                    console.error("Error occurred:", error);
                  });
              });
          } else {
            //if personResults
            notify("error", "Person not found");
            $(".loading").hide();
          }
        })
        .catch(function (err) {
          console.error("HR_Get_Career_Progress_Check_In_Info failed", err);
          notify(
            "error",
            "Unable to load prior check-in data. Please try again or contact support.",
          );
        });
    } else {
    }
  };

  vm.afterLoad = function afterLoad() {
    //  This method is called after setDefaults has been called.

    // Initialize required indicators after VM bindings and form DOM are ready.
    // This replays any queued setRequired(…) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    // Initialize autocomplete utilities after VM bindings are ready.
    // Replays any queued makeReadOnly/makeEditable calls made earlier.
    autoCompleteUtils.init(vm);

    // Toggle export mode styling and behavior.
    // Hides required indicators/notes and normalizes readonly presentation for export.
    autoCompleteUtils.setExportMode(pkg.isExporting);

    let employeeID = document.getElementById("originatorErpId").value; //2.24.26
    if (user.isInLibrary || user.isInDrafts) {
      //2.26.26
      ko.computed(function () {
        if (vm.checkInYear() && vm.jobTitle()) {
          //if checkInYear and job title are selected initially make checkin 1 fields not ready only
          // $("#jobTitle").prop("readonly", false);
          $("#personalGoals").prop("readonly", false);
          $("#departmentGoals").prop("readonly", false);
          $("#collegewideGoals").prop("readonly", false);
          $("#empFeedbackCheckIn1").prop("readonly", false);
          $("#additionalCommentsCheckIn1").prop("readonly", false);
          //run the integration that checks for previous checkin info
          integration
            .all("HR_Get_Career_Progress_Check_In_Info", {
              checkInYear: vm.checkInYear(),
              //originatorErpId: user.ErpId, //ep_sd prev code 2/24/26
              originatorErpId: employeeID, //ep_sd added 2/24/26
              jobTitle: vm.jobTitle(),
            })
            .then(function (cpData) {
              if (cpData.length > 0) {
                if (cpData[0].CheckInNumber == "Complete") {
                  if (user.isInLibrary || user.isInDrafts) {
                    notify(
                      "error",
                      "Your Career Progress Check-in for the selected year is marked as complete for this job title.",
                    );
                  }
                } else if (cpData[0].CheckInNumber == "1") {
                  if (user.isInLibrary || user.isInDrafts) {
                    notify(
                      "success",
                      "There was 1 previous Check-In for the Year and Job Title you selected. Please complete the information for Check-In #2.",
                    );
                  }
                  vm.checkInNumber("2");
                  $(".checkIn2").show();
                  // $("#jobTitle").prop("readonly", false);
                  $("#personalGoals").prop("readonly", true);
                  $("#departmentGoals").prop("readonly", true);
                  $("#collegewideGoals").prop("readonly", true);
                  $("#empFeedbackCheckIn1").prop("readonly", true);
                  $("#additionalCommentsCheckIn1").prop("readonly", true);
                  vm.personalGoals(cpData[0].PersonalGoalsCheckIn1);
                  vm.departmentGoals(cpData[0].DepartmentGoalsCheckIn1);
                  vm.collegewideGoals(cpData[0].CollegeWideGoalsCheckIn1);
                  vm.empFeedbackCheckIn1(cpData[0].EmpFeedbackCheckIn1);
                  vm.additionalCommentsCheckIn1(cpData[0].AddCommentsCheckIn1);
                  vm.formCode(cpData[0].FormCode);
                  autosize.update($("textarea"));
                } else if (cpData[0].CheckInNumber == "2") {
                  if (user.isInLibrary || user.isInDrafts) {
                    notify(
                      "success",
                      "There were 2 previous Check-Ins for the Year and Job Title you selected. Please complete the information for Check-In #3.",
                    );
                  }
                  vm.checkInNumber("3");
                  $(".checkIn2").show();
                  $(".checkIn3").show();
                  //make 1st check in inputs read only
                  // $("#jobTitle").prop("readonly", false);
                  $("#personalGoals").prop("readonly", true);
                  $("#departmentGoals").prop("readonly", true);
                  $("#collegewideGoals").prop("readonly", true);
                  $("#empFeedbackCheckIn1").prop("readonly", true);
                  $("#additionalCommentsCheckIn1").prop("readonly", true);
                  //add data to 1st check in inputs
                  vm.personalGoals(cpData[0].PersonalGoalsCheckIn1);
                  vm.departmentGoals(cpData[0].DepartmentGoalsCheckIn1);
                  vm.collegewideGoals(cpData[0].CollegeWideGoalsCheckIn1);
                  vm.empFeedbackCheckIn1(cpData[0].EmpFeedbackCheckIn1);
                  vm.additionalCommentsCheckIn1(cpData[0].AddCommentsCheckIn1);
                  //make 2nd check in inputs read only
                  $("#keyAccompCheckin2").prop("readonly", true);
                  $("#opportunitiesCheckIn2").prop("readonly", true);
                  $("#supportiveMeasuresCheckIn2").prop("readonly", true);
                  $("#empFeedbackCheckIn2").prop("readonly", true);
                  $("#additionalCommentsCheckIn2").prop("readonly", true);
                  //add data to 2nd check in inputs
                  vm.keyAccompCheckin2(cpData[0].KeyAccompCheckIn2);
                  vm.opportunitiesCheckIn2(cpData[0].OppCheckIn2);
                  vm.supportiveMeasuresCheckIn2(cpData[0].SupMeasuresCheckIn2);
                  vm.empFeedbackCheckIn2(cpData[0].EmpFeedbackCheckIn2);
                  vm.additionalCommentsCheckIn2(cpData[0].AddCommentsCheckIn2);
                  //pull in form code for data upload
                  vm.formCode(cpData[0].FormCode);
                  //resize text areas to hold all data
                  autosize.update($("textarea"));
                }
              } else {
                vm.checkInNumber("1");
                vm.formCode(generateFormCode());
                if (user.isInLibrary || user.isInDrafts) {
                  notify(
                    "success",
                    "There were no previous Check-Ins for the Year and Job Title you selected. Please complete the information for Check-In #1.",
                  );
                }
              }
            });
        } else {
          //if no check-in year or job title make the first checkin inputs read only
          $("#personalGoals").prop("readonly", true);
          $("#departmentGoals").prop("readonly", true);
          $("#collegewideGoals").prop("readonly", true);
          $("#empFeedbackCheckIn1").prop("readonly", true);
          $("#additionalCommentsCheckIn1").prop("readonly", true);
        }
      });
    } else {
      makeAutoCompleteReadOnly("supervisorName");
    }

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

    // Remove temporary native browser `required` attributes after validation.
    // Required state is still tracked by the required indicators utility
    // through VM state, aria-required, and the visual required marker (*).
    requiredIndicators.clearNativeRequired();
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  function makeAutoCompleteReadOnly(elementID) {
    $(`#${elementID}`)
      .prop("disabled", true)
      .attr({
        tabindex: "-1",
        "aria-disabled": "true",
      })
      .css({
        pointerEvents: "none",
        backgroundColor: "#f5f5f5",
        color: "#555",
      });
  }

  //function to sort through all names and return the preferred name
  function getPreferredName(myArray) {
    // Loop through the array
    for (let i = 0; i < myArray.length; i++) {
      // Check if the current object's preference is "preferred"
      if (myArray[i].preference === "preferred") {
        // Return the fullName attribute value from the matching object
        return myArray[i].fullName;
      }
    }
    // Return null if no match is found
    return null;
  }

  //function to sort through all names and return the preferred name
  function getPreferredLastName(myArray) {
    // Loop through the array
    for (let i = 0; i < myArray.length; i++) {
      // Check if the current object's preference is "preferred"
      if (myArray[i].preference === "preferred") {
        // Return the fullName attribute value from the matching object
        return myArray[i].lastName;
      }
    }
    // Return null if no match is found
    return null;
  }

  //function to sort through all names and return the preferred name
  function getPreferredFirstName(myArray) {
    // Loop through the array
    for (let i = 0; i < myArray.length; i++) {
      // Check if the current object's preference is "preferred"
      if (myArray[i].preference === "preferred") {
        // Return the fullName attribute value from the matching object
        return myArray[i].firstName;
      }
    }
    // Return null if no match is found
    return null;
  }

  //function to sort through all supervisors and return the primary supervisor ID (GUID)
  function getPrimarySupervisor(supervisorArray) {
    // Loop through the array
    for (let i = 0; i < supervisorArray.length; i++) {
      // Check if the current object's type is "primary"
      if (supervisorArray[i].type === "primary") {
        // Return the id attribute value from the matching object
        return supervisorArray[i].supervisor.id;
      }
    }
    // Return null if no match is found
    return null;
  }

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

  function generateFormCode() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }

    return code;
  }

  function getFiscalYearLabel() {
    const today = new Date();
    const currentYear = today.getFullYear();

    // July is month index 6 (0-based index)
    const fiscalStartDate = new Date(currentYear, 6, 1); // July 1

    let startYear;
    let endYear;

    if (today < fiscalStartDate) {
      // BEFORE July 1
      startYear = currentYear - 1;
      endYear = currentYear;
    } else {
      // AFTER or ON July 1
      startYear = currentYear;
      endYear = currentYear + 1;
    }

    // Format second year to last 2 digits
    const endYearShort = String(endYear).slice(-2);

    return `${startYear}-${endYearShort}`;
  }

  //2.26.26
  function getCPCIData(checkInNum) {
    let employeeID = document.getElementById("originatorErpId").value;

    if (vm.checkInYear() && vm.jobTitle()) {
      //run the integration that checks for previous checkin info
      integration
        .all("HR_Get_Career_Progress_Check_In_Info", {
          checkInYear: vm.checkInYear(),
          originatorErpId: employeeID,
          jobTitle: vm.jobTitle(),
        })
        .then(function (cpData) {
          if (cpData.length > 0) {
            if (checkInNum == "1") {
            } else if (
              checkInNum == "2" ||
              cpData[0].CheckInNumber == "Complete"
            ) {
              //add data to 1st check in inputs
              vm.personalGoals(cpData[0].PersonalGoalsCheckIn1);
              vm.departmentGoals(cpData[0].DepartmentGoalsCheckIn1);
              vm.collegewideGoals(cpData[0].CollegeWideGoalsCheckIn1);
              vm.empFeedbackCheckIn1(cpData[0].EmpFeedbackCheckIn1);
              vm.additionalCommentsCheckIn1(cpData[0].AddCommentsCheckIn1);
            } else if (
              checkInNum == "3" ||
              cpData[0].CheckInNumber == "Complete"
            ) {
              //add data to 1st check in inputs
              vm.personalGoals(cpData[0].PersonalGoalsCheckIn1);
              vm.departmentGoals(cpData[0].DepartmentGoalsCheckIn1);
              vm.collegewideGoals(cpData[0].CollegeWideGoalsCheckIn1);
              vm.empFeedbackCheckIn1(cpData[0].EmpFeedbackCheckIn1);
              vm.additionalCommentsCheckIn1(cpData[0].AddCommentsCheckIn1);

              //add data to 2nd check in inputs
              vm.keyAccompCheckin2(cpData[0].KeyAccompCheckIn2);
              vm.opportunitiesCheckIn2(cpData[0].OppCheckIn2);
              vm.supportiveMeasuresCheckIn2(cpData[0].SupMeasuresCheckIn2);
              vm.empFeedbackCheckIn2(cpData[0].EmpFeedbackCheckIn2);
              vm.additionalCommentsCheckIn2(cpData[0].AddCommentsCheckIn2);
              vm.formCode(cpData[0].FormCode);
              autosize.update($("textarea"));
            }
          }
        }); //end cpData function
    } //end checkInYear & jobTitle check
  }

  return vm;
});
