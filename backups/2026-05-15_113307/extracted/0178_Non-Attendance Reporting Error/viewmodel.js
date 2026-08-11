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

  vm.addObservableArray("studentCourseReg");
  var DeadLineDatePassed = 0;

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
    /* CLEAR OUT ALL AUTOPOPULATED DATA*/

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
              vm.studentName(getPreferredName(personResults.names));
              vm.personGUID(personResults.id);
              const studentEmail = personResults.emails.find(
                (email) => email.preference === "primary",
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

  function getTodayDate() {
    const today = new Date();

    // Pad month/day with leading zero if needed
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${month}/${day}/${year}`;
  }

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
    $("#studentSearch").prop("disabled", true);
    $("#courseSection").prop("disabled", true);
    $("#reason").prop("disabled", true);
    $("#employeeSig").prop("disabled", true);
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

    $("#deadlineDate").prop("disabled", false);

    vm.personGUID.subscribe(function (NewValue) {
      if (NewValue) {
        integration
          .all("Web_Ethos_Section_Registration_by_Registrant", {
            personGUID: NewValue,
          })
          .then(function (registrationResults) {
            //start determining today - 365 days and formatting this date to match how the endOn value is being returned by Ethos
            const today = new Date();
            const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
            const daysToSubtract = 365;
            const resultDate = new Date(
              today.getTime() - daysToSubtract * oneDayInMilliseconds,
            );
            const formattedDate = resultDate.toISOString();
            const formattedDateOnly = formattedDate.substring(0, 10);
            const concatDate = formattedDateOnly + "T00:00:00:-04:00";

            var p = []; //this our promise array
            registrationResults.forEach(function (registrationSection, index) {
              if (
                registrationSection.status.registrationStatus == "registered" &&
                registrationSection.involvement.endOn >= concatDate
              ) {
                p.push(
                  integration.all("Web_Ethos_Get_Sections_by_Section_ID", {
                    sectionsGUID: registrationSection.section.id,
                  }),
                );
              }
            });

            Promise.all(p).then(function (sectionResults) {
              // Initialize an empty array to store matching results
              const SectionRegistration = [];
              let isCurrentTerm = false;

              // Loop through registrationResults and sectionResults
              for (const regResult of registrationResults) {
                for (const secResult of sectionResults) {
                  if (regResult.section.id === secResult.id) {
                    // Extract desired information

                    const term = secResult.termCode;
                    const startDate = secResult.startOn;
                    const endDate = secResult.endOn; //end date of the course

                    //checking for current registration
                    isCurrentTerm = compareDates(startDate, endDate);
                    //console.log('compare date', isCurrentTerm);
                    //

                    const regStatus = regResult.status.registrationStatus;
                    const regGUID = regResult.id;
                    const section = secResult.code;
                    const instructorName =
                      secResult.instructorFirstName +
                      " " +
                      secResult.instructorLastName;
                    const courseTitle = secResult.titles[0].value;
                    const censusDate = formatDateAddDays(
                      secResult.censusDates[1],
                      7,
                    );

                    //Will only push to the courseSection dropdown if the registration is within the current term
                    if (isCurrentTerm) {
                      vm.studentCourseReg.push({
                        registrationStatus: regStatus,
                        registrationGUID: regGUID,
                        registrationStartDate: startDate,
                        registrationEndDate: endDate,
                        registrationTerm: term,
                        registrationSection: section,
                        registrationInstructorName: instructorName,
                        registrationCourseTitle: courseTitle,
                        registrationDeadlineDate: censusDate, //censusDate + 7 days
                      });
                    } //end isCurrentTerm
                  }
                }
              }
            }); //promise.all
          }); // integration.all('Web_Ethos_Section_Registration_by_Registrant'
      } // if (NewValue)
    }); //personGUID.subscribe

    vm.studentEmail.subscribe(function (sig) {
      const email = $("#studentEmail").val();
      const username = email.split("@")[0];

      vm.username(username);
    });

    //Populating today's date on signature
    vm.employeeSig.subscribe(function (sig) {
      vm.employeeSigDate(getTodayDate());
    });

    //Populating today's date on signature
    vm.deanSigName.subscribe(function (sig) {
      vm.deanSigDate(getTodayDate());
    });

    //Get the dean based on the subject
    vm.courseSection.subscribe(function (sig) {
      var selectedVal = $("#courseSection").val(); // "HIS-0123-2345"
      var subject = selectedVal.split("-")[0];

      integration
        .first("Etrieve_Integration_Get_Dean_Info_By_Subject", {
          Subject: subject,
        })
        .then(function (val) {
          //Comment for testing
          vm.deanEmail(val.Dean_Email);

          //Uncomment for testing
          //vm.deanEmail('epeake@softdocs.com');
        });
    });

    // if currentDate is past the deadline date (censusDate + 3) then "This course has passed the deadline date!"
    vm.deadlineDate.subscribe(function (deadlineDt) {
      const deadlineDate = new Date(deadlineDt);
      const currentDate = new Date();

      //const currentDate = new Date('01/01/2026'); // for testing

      if (currentDate < deadlineDate) {
        DeadLineDatePassed = 0;
      } else {
        notify("error", "This deadline date has passed for this course.");
        DeadLineDatePassed = 1;
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
        } else if (season === "WI" || season === "SU" || season === "AY") {
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

      $("#deanSigName").prop("readonly", false);
      //  $('#deanReasonDecline').prop('readonly', false);
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

    if (DeadLineDatePassed == 1) {
      notify("error", "This deadline date has passed for this course.");
      return false;
    }
  };

  vm.onApprove = function onApprove(form) {
    //  This method is called when the Approve button is clicked and before calling beforeRequired.
  };

  vm.onDecline = function onDecline(form) {
    //  This method is called when the Decline button is clicked and before calling beforeRequired.
    //   const declineReason = $('#deanReasonDecline').val();
    //   if (declineReason == '') {
    //       notify('error', 'Reason for decline is a required field.');
    //       return false;
    //   }
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

  return vm;
});
