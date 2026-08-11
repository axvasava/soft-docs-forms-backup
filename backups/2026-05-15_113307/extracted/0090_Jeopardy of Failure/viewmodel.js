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

  vm.addObservableArray("studentCourseReg");

  //This function is used to set the autosize function on textareas with a class of autosizeareas.
  //Uncomment to use.
  //autosize($('.autosizeareas'));
  $(".studentSignature").hide();
  $(".developer").hide();

  $("#personIdSearchBtn").click(function () {
    /* CLEAR OUT ALL AUTOPOPULATED DATA*/
    vm.studentPreferredName(undefined);
    // check if there is data in the colleague id
    if (vm.studentIDSearch()) {
      // check if there's 7 digits
      if (vm.studentIDSearch().length == 7) {
        $(".loading").show();
        // GET PERSON FROM COLLEAGUE ID
        integration
          .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
            personID: vm.studentIDSearch(),
          })
          .then(function (personResults) {
            if (personResults) {
              vm.studentPreferredName(getPreferredName(personResults.names));
              vm.personGUID(personResults.id);
              // const primaryEmail = personResults.emails.find(email => email.preference === "primary");
              const primaryEmail = personResults.emails?.find(
                (email) => email.preference === "primary",
              );
              vm.studentEmail(
                primaryEmail ? primaryEmail.address : "No Email Found",
              );
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

    if (pkg.isAtStep("ConditionalStudent") || pkg.isAtStep("End")) {
      $(".studentSignature").show();

      // Select all input and checkbox elements
      document.querySelectorAll("input").forEach((input) => {
        // Make all inputs read-only except the one with id "studentSign"
        if (input.id !== "studentSign") {
          input.readOnly = true;
        }
      });

      // Select all checkboxes and disable them
      document
        .querySelectorAll("input[type='checkbox']")
        .forEach((checkbox) => {
          if (checkbox.id !== "studentSign") {
            checkbox.disabled = true;
          }
        });
    }

    vm.facultySign.subscribe(function (newValue) {
      if (newValue) {
        vm.facultySignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.facultySignDate("");
      }
    });

    vm.studentSign.subscribe(function (newValue) {
      if (newValue) {
        vm.studentSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.studentSignDate("");
      }
    });

    vm.personGUID.subscribe(function (NewValue) {
      // Always start clean for the new person
      if (ko.isObservable(vm.studentCourseReg)) {
        vm.studentCourseReg.removeAll();
        vm.courseSelect("");
      }

      if (NewValue) {
        integration
          .all("Web_Ethos_Section_Registration_by_Registrant", {
            personGUID: NewValue,
          })
          .then(function (registrationResults) {
            if (
              !Array.isArray(registrationResults) ||
              registrationResults.length === 0
            ) {
              makeAutoCompleteReadOnly("courseSelect");
              notify("error", "Student has no courses this Semester");
              return;
            }
            //start determining today - 365 days and formatting this date to match how the endOn value is being returned by Ethos
            // const today = new Date();
            // const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
            // const daysToSubtract = 365;
            // const resultDate = new Date(today.getTime() - daysToSubtract * oneDayInMilliseconds);
            // const formattedDate = resultDate.toISOString();
            // const formattedDateOnly = formattedDate.substring(0, 10);
            // const concatDate = formattedDateOnly + 'T00:00:00:-04:00';

            // const resultDate = new Date(today.getTime()); // just a copy of today
            // const formattedDate = resultDate.toISOString();
            // const formattedDateOnly = formattedDate.substring(0, 10);
            // const concatDate = formattedDateOnly + 'T00:00:00-04:00';

            const today = new Date();
            const todayISO = today.toISOString();
            const todayDateOnly = todayISO.substring(0, 10); // "2025-09-29"

            var p = []; //this our promise array
            var isCourseEnded = 0;
            registrationResults.forEach(function (registrationSection, index) {
              if (
                registrationSection.status.registrationStatus == "registered" &&
                registrationSection.involvement.endOn >= todayDateOnly
              ) {
                makeAutoCompleteEditable("courseSelect");
                p.push(
                  integration.all("Web_Ethos_Get_Sections_by_Section_ID", {
                    sectionsGUID: registrationSection.section.id,
                  }),
                );
              } else {
                isCourseEnded++;
                if (isCourseEnded >= registrationResults.length) {
                  makeAutoCompleteReadOnly("courseSelect");
                  notify("error", "Student has no courses this Semester");
                }
              }
            });
            Promise.all(p).then(function (sectionResults) {
              // Initialize an empty array to store matching results
              const SectionRegistration = [];

              // Loop through registrationResults and sectionResults
              for (const regResult of registrationResults) {
                for (const secResult of sectionResults) {
                  if (regResult.section.id === secResult.id) {
                    // Extract desired information
                    const regStatus = regResult.status.registrationStatus;
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
                      sectionID,
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
                  registrationInstructorName: Results.instructorName,
                  registrationLocation: Results.location,
                  registrationSectionID: Results.sectionID,
                });
              });
            });
          });
      }
    });

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.

      vm.formID(generateFormID());
      vm.hsDocType("Jeopardy of Failure");
      vm.academicYear(getAcademicYear());
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
    // This replays any queued setRequired(…) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    // Initialize autocomplete utilities after VM bindings are ready.
    // Replays any queued makeReadOnly/makeEditable calls made earlier.
    autoCompleteUtils.init(vm);

    // Toggle export mode styling and behavior.
    // Hides required indicators/notes and normalizes readonly presentation for export.
    autoCompleteUtils.setExportMode(pkg.isExporting);

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

  //====================== HELPER FUNCTIONS ================================

  function makeAutoCompleteReadOnly(elementID) {
    $(`#${elementID}`)
      .prop("readonly", true) // blocks typing
      .attr({
        tabindex: "-1", // skips on tab navigation
        "aria-disabled": "true", // accessibility
      })
      .css({
        pointerEvents: "none", // blocks clicks/focus
        backgroundColor: "#f5f5f5", // gray background
        color: "#555", // dim text
      });
  }

  // Optional: Unlock it later
  function makeAutoCompleteEditable(elementID) {
    $(`#${elementID}`)
      .prop("readonly", false)
      .removeAttr("tabindex aria-disabled")
      .css({
        pointerEvents: "",
        backgroundColor: "",
        color: "",
      });
  }

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

  // ===================== GET ACADEMIC YEAR FROM CURRENT DATE ==================================

  function getAcademicYear() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // January is 0, December is 11

    // Academic year starts in August (month 7)
    if (month >= 7) {
      // August or later
      return `${year}-${String(year + 1).slice(-2)}`;
    } else {
      // Before August
      return `${year - 1}-${String(year).slice(-2)}`;
    }
  }
  // =================== END GET ACADEMIC YEAR FROM CURRENT DATE ================================

  return vm;
});
