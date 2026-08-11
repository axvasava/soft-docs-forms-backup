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
  //This function is used to set the autosize function on textareas with a class of autosizeareas.

  //Uncomment to use.
  //autosize($('.autosizeareas'));

  $(".humanResources").hide();
  $(".departmentChair").hide();
  $(".signatures").hide();
  $(".supervisor").hide();
  $(".provost").hide();
  $(".chancellor").hide();
  $(".developer").hide();

  vm.addObservableArray("personsPositionsList");
  vm.personsPositionsList([]);

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

    //============================= DO STUFF BASED ON WORKFLOW STEP ===================================

    if (pkg.isAtStep("ConditionalSupervisor")) {
      $(".signatures").show();
      $(".supervisor").show();
    }

    if (pkg.isAtStep("ConditionalActorDepartmentChair")) {
      $(".signatures").show();
      $(".supervisor").show();
      $(".departmentChair").show();
    }

    if (pkg.isAtStep("CommitteeReview")) {
      $(".committeeOnly").show();
    }

    if (pkg.isAtStep("ConditionalExecutiveCouncilMember")) {
      $(".signatures").show();
      $(".supervisor").show();
      $(".departmentChair").show();
      $(".executiveCouncilMember").show();
      vm.execCouncilDisplayName(user.DisplayName);
    }

    if (pkg.isAtStep("HRAdmin")) {
      $(".signatures").show();
      $(".supervisor").show();
      $(".departmentChair").show();
      $(".executiveCouncilMember").show();
      $(".humanResources").show();
      vm.receivedHRDate(Extenders.utils.formatDate(new Date()));
      vm.hrActorEmail(user.Email);
    }

    if (pkg.isAtStep("WFIEProvost")) {
      $(".signatures").show();
      $(".supervisor").show();
      $(".departmentChair").show();
      $(".executiveCouncilMember").show();
      $(".humanResources").show();
      $(".provost").show();
      vm.provActorEmail(user.Email);
    }

    if (
      pkg.isAtStep("WFHRChancellor") ||
      pkg.isAtStep("EndApproved") ||
      pkg.isAtStep("EndDeclined")
    ) {
      $(".signatures").show();
      $(".supervisor").show();
      $(".departmentChair").show();
      $(".executiveCouncilMember").show();
      $(".humanResources").show();
      $(".provost").show();
      $(".chancellor").show();
      vm.chancActorEmail(user.Email);
    }

    //=========================== END DO STUFF BASED ON WORKFLOW STEP =================================

    vm.departmentGUID.subscribe(function (newValue) {
      if (newValue) {
        integration
          .all("Web_Ethos_Get_Employment_Department_by_GUID", {
            deptGUID: vm.departmentGUID(),
          })
          .then(function (departmentData) {
            vm.applicantDepartment(departmentData.title);
          });
      }
    });

    /*Function populates supervisor info after getting GUID*/
    vm.supervisorGUID.subscribe(function (NewValue) {
      if (NewValue != "No Supervisor GUID") {
        integration
          .all("Web_Ethos_Get_Person_by_GUID", {
            personGUID: vm.supervisorGUID(),
          })
          .then(function (supervisorData) {
            vm.supervisorSearch(getPreferredName(supervisorData.names));
            vm.supervisorEmail(getPrimaryEmail(supervisorData.emails));
          });
      } else {
        vm.supervisorSearch("No Supervisor Found");
        vm.supervisorEmail("No Supervisor Found");
      }
    });

    vm.leaveComRec.subscribe(function (newValue) {
      if (newValue) {
        if (newValue == "Yes") {
          vm.commRecForNote("recommends");
        }
        if (newValue == "No") {
          vm.commRecForNote("does not recommend");
        }
      } else {
        vm.commRecForNote("");
      }
    });

    //=========================== SUBSCRIBES FOR SIGNATURE FIELDS ===================================

    vm.employeeSign.subscribe(function (newValue) {
      if (newValue) {
        vm.employeeSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.employeeSignDate("");
      }
    });

    vm.supDeanSign.subscribe(function (newValue) {
      if (newValue) {
        vm.supDeanSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.supDeanSignDate("");
      }
    });

    vm.deptChairSign.subscribe(function (newValue) {
      if (newValue) {
        vm.deptChairSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.deptChairSignDate("");
      }
    });

    vm.humRecSign.subscribe(function (newValue) {
      if (newValue) {
        vm.humRecSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.humRecSignDate("");
      }
    });

    vm.provostSign.subscribe(function (newValue) {
      if (newValue) {
        vm.provostSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.provostSignDate("");
      }
    });

    vm.chancellorSign.subscribe(function (newValue) {
      if (newValue) {
        vm.chancellorSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.chancellorSignDate("");
      }
    });

    //========================= END SUBSCRIBES FOR SIGNATURE FIELDS ===================================

    if (user.isInLibrary || user.isInDrafts) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.
      $(".applicantOnly").show();
      vm.formCode(generateFormCode());

      //GET CHANCELLOR ADMINS EMAILS FROM ETRIEVE SECURITY FOR EMAIL NOTIFICATION LATER IN PROCESS
      integration
        .all("Etrieve_Security_Get_Chancellor_Admins", {})
        .then(function (chanAdminsInfo) {
          let integrationEmails = [];

          chanAdminsInfo.forEach(function (vals) {
            integrationEmails.push(vals.Email);
          });

          let chanAdminEmails = integrationEmails.join("; ");

          vm.chancellorAdminEmails(chanAdminEmails);
        });

      // GET PERSON FROM COLLEAGUE ID
      integration
        .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
          personID: user.ErpId,
        })
        .then(function (personResults) {
          if (personResults) {
            vm.chosenFIrstName(getPreferredName(personResults.names));
            vm.firstName(getPreferredFirstName(personResults.names));
            vm.lastName(getPreferredLastName(personResults.names));

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
            notify("error", "Person not found");
            $(".loading").hide();
          }
        });
    } else {
      //  Input Values set here will be saved to the server immediately.
      //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
      //  prior users.  Inputs that already have values saved to the server will be overridden with
      //  values set in this method.
      $(".applicantOnly").hide();
    }
  };

  vm.afterLoad = function afterLoad() {
    //  This method is called after setDefaults has been called.

    //  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
    //  to save values to the server.

    // Initialize required indicators after VM bindings and form DOM are ready.
    // This replays any queued setRequired(…) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    // Initialize autocomplete utilities after VM bindings are ready.
    // Replays any queued makeReadOnly/makeEditable calls made earlier.
    autoCompleteUtils.init(vm);

    // Toggle export mode styling and behavior.
    // Hides required indicators/notes and normalizes readonly presentation for export.
    autoCompleteUtils.setExportMode(pkg.isExporting);

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

    if (form.attachmentCount < 1) {
      notify(
        "error",
        "You must attach a Sabbatical Leave Proposal before submitting this form.",
      );
      return false;
    } else {
      return true;
    }

    if (pkg.isAtStep("ConditionalExecutiveCouncilMember")) {
      if (vm.sentToCommittee() == "No") {
        notify(
          "error",
          "You must click the button to notify the committee before moving this form alonog in the workflow.",
        );
        return false;
      }
    }
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

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

  // custom code ************************************************
  function submitFormsAPI() {
    const apiUrl = "https://oaklandcccentral.etrieve.cloud"; // Replace with your API base URL (no ending "/")

    const apiCalls = [
      {
        formTemplateID: "103", // Form: "Sabbatical Committee Notification"
        formData: [
          {
            ID: "committeeEmails",
            Values: [vm.committeeEmails()],
          },
          {
            ID: "execCouncilName",
            Values: [vm.execCouncilDisplayName()],
          },
          {
            ID: "formCode",
            Values: [vm.formCode()],
          },
          {
            ID: "applicantName",
            Values: [vm.chosenFIrstName()],
          },
        ],
      },
    ];

    const preEndpoint = "forms/api/Form/?templateVersionID=";
    // Array of Promises for Form creation
    const p_FormDraftCreation = [];
    const p_FormDataUpdate = [];
    const p_FormSubmit = [];

    // Push promises into the array based on the endpoints and payloads
    apiCalls.forEach((call) => {
      const url = `${apiUrl}/${preEndpoint}${call.formTemplateID}`;
      const payloadCall = call.payload;

      p_FormDraftCreation.push(apiRequest("POST", url, payloadCall));
    });

    // Handle the result of all promises
    Promise.all(p_FormDraftCreation)
      .then((draftResults) => {
        draftResults.forEach((draftResponse, index) => {
          // Handle successful API response

          /* ***************************************************************************** */
          /* ADD DATA INTO FORM DRAFT **************************************************** */
          /* ***************************************************************************** */

          // now that draft is created, add data into draft
          let urlPUT = `${apiUrl}/forms/api/Form/?`;
          if (apiCalls[index].formData.length > 0) {
            let formData = apiCalls[index].formData;
            let draftID = draftResponse.ID;
            let payload = {
              FormID: draftID,
              ChangedInputValues: formData,
              TaskID: null,
              IsFirstLoadFromLibrary: true,
              IsInDrafts: false,
              IsOriginator: true,
            };
            p_FormDataUpdate.push(apiRequest("PUT", urlPUT, payload));
          }
        });

        Promise.all(p_FormDataUpdate)
          .then((dataResults) => {
            dataResults.forEach((dataResponse, dataIndex) => {
              // Handle successful API response
              console.log("Form Data Update API Response ${dataIndex + 1}");
            });

            /* ***************************************************************************** */
            /* SUBMIT FORM INTO WORKFLOW *************************************************** */
            /* ***************************************************************************** */

            draftResults.forEach((draftResponse, index) => {
              let urlPUT = `${apiUrl}/forms/api/form/Submit/?`;
              let draftID = draftResponse.ID;
              let payload = {
                FormID: draftID,
                CaptchaResponse: "",
                ActorFilterValue: "",
                loadingId: "",
              };

              p_FormSubmit.push(apiRequest("PUT", urlPUT, payload));
            });

            Promise.all(p_FormSubmit)
              .then((submitResults) => {
                submitResults.forEach((submitResponse, submitIndex) => {
                  // Handle successful API response
                  console.log(`Submit Form API Response ${submitIndex + 1}`);
                });

                notify("success", "Committee has been notified.");

                apiCalls.length = 0; // clear global variable of apiCalls
              })
              .catch((error) => {
                // Handle any error occurred during the promises
                console.error("Form Submit API Error:", error);
                notify("error", "Issue with Submit.");
              });
          })
          .catch((error) => {
            // Handle any error occurred during the promises
            console.error("Form Data API Error:", error);
            notify("error", "Issue with Form Draft data.");
          });
      })
      .catch((error) => {
        // Handle any error occurred during the promises
        console.error("Form Draft Cration API Error:", error);
        notify("error", "Issue with Form Draft creation.");
      });
  }

  // functional code ************************************
  function apiRequest(method, url, payload = null) {
    // Get the CSRF token from cookies
    const csrfToken = getCSRFToken();

    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRF-Token": csrfToken, // Include the CSRF token in the request headers
        // Add any additional headers if needed
      },
      body: payload ? JSON.stringify(payload) : null,
    };

    return fetch(url, options)
      .then((response) => handleResponse(response))
      .catch((error) => {
        console.error("API Request Error:", error);
        throw error;
      });
  }

  function handleResponse(response) {
    const contentType = response.headers.get("content-type");

    return new Promise((resolve, reject) => {
      if (contentType && contentType.includes("application/json")) {
        response.json().then((data) => {
          if (response.ok) {
            resolve(data);
          } else {
            reject(new Error(data.message || "API Error"));
          }
        });
      } else if (!contentType || contentType === "text/plain") {
        // Treat empty responses or responses with content type 'text/plain' as success
        resolve("success");
      } else {
        reject(new Error("Invalid content type in response"));
      }
    });
  }

  function getCSRFToken() {
    // Replace 'csrfToken' with the name of your CSRF token cookie
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("CSRFToken"))
      .split("=")[1];
  }

  return vm;
});
