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
  // Form-scoped required indicators manager.
  // Safe to call before init. Calls to setRequired(…) queue until afterLoad runs init(vm).
  var requiredIndicators = formUtils.createRequiredIndicators();

  // Form-scoped autocomplete utility manager.
  // Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
  var autoCompleteUtils = formUtils.createAutoCompleteUtils();
  // Define a mapping of rating values to scores
  const ratingScores = {
    Outstanding: 5,
    "Very Good": 4,
    Satisfactory: 3,
    "Needs Improvement": 2,
    Unsatisfactory: 1,
  };

  vm.addObservableArray("personsPositionsList");
  vm.addObservableArray("evaluatorPositionsList");
  //This function is used to set the autosize function on textareas with a class of autosizeareas.
  //Uncomment to use.
  //autosize($('.autosizeareas'));
  //$('.employeeSignature').hide();
  $(".developer").hide();

  $("#personIdSearchBtn").click(function () {
    /* CLEAR OUT ALL AUTOPOPULATED DATA*/
    vm.employeeName(undefined);
    // check if there is data in the colleague id
    if (vm.employeeIDSearch()) {
      // check if there's 7 digits
      if (vm.employeeIDSearch().length == 7) {
        $(".loading").show();
        // GET PERSON FROM COLLEAGUE ID
        integration
          .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
            personID: vm.employeeIDSearch(),
          })
          .then(function (personResults) {
            if (personResults) {
              vm.employeeName(getPreferredName(personResults.names));
              vm.personGUID(personResults.id);
              const primaryEmail = personResults.emails.find(
                (email) => email.preference === "primary",
              );
              vm.employeeEmail(
                primaryEmail ? primaryEmail.address : "No Email Found",
              );
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
                    let payClassID = "No Pay Class GUID";
                    if (job.payClass.id) {
                      payClassID = job.payClass.id;
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
                              payClassID,
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
                          positionCode: resultData.personPositions.code,
                          positionGUID: resultData.personPositions.id,
                          positionDepartmentGUID:
                            resultData.personPositions.departments[0].id,
                          supervisorGUID: resultData.supervisorID,
                          payClassGUID: resultData.payClassID,
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

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    // //lock down most of the form if user is not in library or drafts
    if (!user.isInLibrary && !user.isInDrafts) {
      // Select all input, select, checkbox, and textarea elements
      const elements = document.querySelectorAll("input, select, textarea");

      elements.forEach((element) => {
        // Check if the element's ID is in the exception list
        if (
          !["employeeComments", "employeeSign", "employeeFinalSign"].includes(
            element.id,
          )
        ) {
          if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            element.readOnly = true; // Make input and textarea read-only
          }
          if (element.tagName === "SELECT" || element.type === "checkbox") {
            element.disabled = true; // Disable select elements and checkboxes
          }
        }
      });
    }
    // Make Evaluator Title read-only at specific workflow steps
    if (
      pkg.isAtStep("ConditionalEmployee") ||
      pkg.isAtStep("WFHRManualEntry")
    ) {
      const evaluatorTitleField = document.getElementById("evaluatorTitle");
      if (evaluatorTitleField) {
        evaluatorTitleField.readOnly = true;
        evaluatorTitleField.disabled = true; // Disable the field to prevent interaction
        makeAutoCompleteReadOnly("evaluatorTitle");
      }

      const appraisalRadioIds = [
        "regularAppraisalType",
        "probationaryAppraisalType",
        "otherAppraisalType",
      ];

      appraisalRadioIds.forEach(function (id) {
        const field = document.getElementById(id);
        if (field) {
          field.disabled = true;
        }
      });
    }

    // HR Benefits step: lock employee signature/comment fields
    if (pkg.isAtStep("WFHRManualEntry")) {
      const employeeComments = document.getElementById("employeeComments");
      if (employeeComments) {
        employeeComments.readOnly = true; // textarea supports readOnly
      }

      const employeeFinalSign = document.getElementById("employeeFinalSign");
      if (employeeFinalSign) {
        employeeFinalSign.readOnly = true; // input supports readOnly
      }
    }

    if (
      pkg.isAtStep("ConditionalEmployee") ||
      pkg.isAtStep("WFHRManualEntry") ||
      pkg.isAtStep("End")
    ) {
      $(".employeeSignature").show();
    } else {
      $(".employeeSignature").hide();
    }

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

    vm.payClassGUID.subscribe(function (newValue) {
      if (newValue) {
        integration
          .first("Web_Ethos_Get_Pay_Class_by_Pay_Class_GUID", {
            payClassGUID: newValue,
          })
          .then(function (payClassInfo) {
            vm.payClass(payClassInfo.title);
          });
      } else {
      }
    });

    // Apply the function that calculates scores based on selection to all relevant observables
    subscribeToRating(vm.qualityOfWork, vm.qualityOfWorkScore);
    subscribeToRating(vm.quantityOfWork, vm.quantityOfWorkScore);
    subscribeToRating(vm.workHabits, vm.workHabitsScore);
    subscribeToRating(vm.attitude, vm.attitudeScore);
    subscribeToRating(vm.relationships, vm.relationshipsScore);
    subscribeToRating(vm.resourcefulness, vm.resourcefulnessScore);
    subscribeToRating(vm.attendance, vm.attendanceScore);

    // Subscribe to totalPoints and update overallPerformance accordingly
    vm.totalPoints.subscribe(function (newValue) {
      vm.overallPerformance(getOverallPerformance(newValue));
    });

    vm.facultySign.subscribe(function (newValue) {
      if (newValue) {
        vm.facultySignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.facultySignDate("");
      }
    });

    // vm.employeeSign.subscribe(function(newValue) {
    //     if (newValue) {
    //       vm.employeeSignDate(Extenders.utils.formatDate(new Date()));
    //     } else {
    //         vm.employeeSignDate('');
    //     }
    // });

    vm.employeeFinalSign.subscribe(function (newValue) {
      if (newValue) {
        vm.employeeFinalSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.employeeFinalSignDate("");
      }
    });

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.

      vm.formID(generateFormID());
      vm.hrDocType("Performance Appraisal");
      vm.evaluatorName(user.DisplayName);
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
    // This replays any queued setRequired(…) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    // Initialize autocomplete utilities after VM bindings are ready.
    // Replays any queued makeReadOnly/makeEditable calls made earlier.
    autoCompleteUtils.init(vm);

    // Toggle export mode styling and behavior.
    // Hides required indicators/notes and normalizes readonly presentation for export.
    autoCompleteUtils.setExportMode(pkg.isExporting);

    integration
      .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
        personID: user.ErpId,
      })
      .then(function (personResults) {
        if (personResults) {
          integration
            .all("Web_Ethos_Get_active_institution_jobs_by_Person_GUID", {
              personGUID: personResults.id,
            })
            .then(function (allInstJobs) {
              allInstJobs.forEach(function (job) {
                integration
                  .first(
                    "Web_Ethos_Get_institution_positions_by_Position_GUID",
                    {
                      positionGUID: job.position.id,
                    },
                  )
                  .then(function (positionInfo) {
                    vm.evaluatorPositionsList.push({
                      positionTitle: positionInfo.title,
                    });
                  });
              });
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

  //====================== HELPER FUNCTIONS ================================
  //===================== GET PREFERRED NAME ===============================
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
  // =================== END GET PREFERRED NAME =============================

  // ============================= GENERATE FORM ID =============================================
  function generateFormID() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      id += characters[randomIndex];
    }

    return id;
  }

  // ============================= END GENERATE FORM ID =========================================

  // ========================== SUBSCRIBE AND UPDATE SCORES =====================================
  function subscribeToRating(observable, scoreObservable) {
    observable.subscribe(function (newValue) {
      scoreObservable(newValue ? ratingScores[newValue] || "" : "");
    });
  }
  // =======================  END SUBSCRIBE AND UPDATE SCORES =====================================

  // ============= DETERMINE OVERALL PERFORMANCE BASED ON TATAL POINTS ============================
  function getOverallPerformance(points) {
    if (points >= 32 && points <= 35) return "Outstanding";
    if (points >= 25 && points <= 31) return "Very Good";
    if (points >= 21 && points <= 24) return "Satisfactory";
    if (points >= 14 && points <= 20) return "Needs Improvement";
    if (points >= 7 && points <= 13) return "Unsatisfactory";
    return ""; // Default if outside the defined ranges
  }
  // ========== END DETERMINE OVERALL PERFORMANCE BASED ON TATAL POINTS ============================
  return vm;
});

function makeAutoCompleteReadOnly(elementID) {
  $(`#${elementID}`)
    .prop("readonly", true)
    .attr({
      tabindex: "-1",
      "aria-disabled": "true",
    })
    .css({
      "pointer-events": "none",
      "background-color": "#e9ecef",
      color: "#555",
    });
}
