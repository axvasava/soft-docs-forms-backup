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

  /*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
  $(".maskphone").mask("999-999-9999");
  $(".maskzip").mask("99999?-9999");
  $(".maskssn").mask("999-99-9999");
  /*End masking functions*/

  vm.addObservableArray("studentActivePrograms");
  vm.addObservableArray("studentInstitutionsAttended");

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

  $("#searchButton").click(function () {
    /* CLEAR OUT ALL AUTOPOPULATED DATA*/
    vm.studentName(undefined);
    vm.studentEmail(undefined);

    // check if there is data in the colleague id
    if (vm.studentSearch()) {
      if (vm.studentSearch().length == 7) {
        // check if there's 7 digits

        $(".loading").show();

        // GET PERSON FROM COLLEAGUE ID
        integration
          .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
            personID: vm.studentSearch(),
          })
          .then(function (personResults) {
            if (personResults) {
              vm.studentName(getPreferredName(personResults.names));
              vm.personGUID(personResults.id);
              let personGUID = personResults.id;

              //1. Uncomment before publishing
              const studentEmail = personResults.emails.find(
                (email) => email.preference === "primary",
              );

              //2. Comment Out before publishing
              //vm.studentEmail('epeake@softdocs.com');

              //3. Uncomment before publishing
              vm.studentEmail(studentEmail.address);

              integration
                .all("Web_Ethos_Get_Active_Programs_by_Colleague_ID", {
                  studentID: vm.studentSearch(),
                })
                .then(function (programInfo) {
                  programInfo.forEach((programs) => {
                    vm.studentActivePrograms.push({
                      programName: programs.ProgramName,
                      //,programCode: programs.ProgramCode
                    });
                  });
                });
            } else {
              notify("error", "Person not found");
              $(".loading").hide();
            }
          });

        $(".loading").hide();
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

  /* //Not needed at this time
   $('#credits').on('change', function() {
          let value = parseInt($(this).val(), 10);
          if (value < 1) {
             $(this).val(1);
          } else if (value > 4) {
             $(this).val(4);
          }
   });
    
   $('#creditsSub').on('change', function() {
        let creditsSubValue = parseInt($(this).val(), 10);
        let creditsValue = parseInt($('#credits').val(), 10);

        // Ensure minimum of 1
        if (creditsSubValue < 1) {
           //creditsSubValue = 1;
           notify ('error','The number of credit hours for the course substitution must be at least 1.');
        }

        // Ensure it does not exceed creditsValue + 1
        if (creditsSubValue > creditsValue + 1) {
          //creditsSubValue = creditsValue + 1;
          notify ('error','The number of credit hours for the course substitution cannot exceed the original number of credit hours');
        }
    });
    */

  function getCatalogYears() {
    // Catalog year starts in August (change if needed)
    const startMonth = 8;
    const today = new Date();
    const currentYear =
      today.getMonth() + 1 >= startMonth
        ? today.getFullYear()
        : today.getFullYear() - 1;

    const $dropdown = $("#catalogYear").empty();
    $dropdown.append($("<option/>"));

    // Add current and previous 3 years
    for (let i = 0; i <= 3; i++) {
      const start = currentYear - i;
      const end = start + 1;
      const yearText = `${start}–${end}`;
      $dropdown.append($("<option/>", { value: yearText, text: yearText }));
    }
  }

  $("#slideCourseGuidelines").on("click", function () {
    $("#slideCourseGuidelinesPara").stop().slideToggle("slow");
  });

  function disableRadio(elementID) {
    const $el = $(`#${elementID}`);
    $el
      .prop("disabled", true)
      .attr("aria-disabled", "true")
      .css({ opacity: "0.6", cursor: "not-allowed" });
  }

  function makeAllFieldsReadOnly() {
    //Student Information
    $("#studentSearch").prop("readonly", true);
    $("#studentCurriculumPrograms").prop("readonly", true);
    $("#catalogYear").attr("readonly", "readonly");

    //Course Information
    $("#courseNumber").prop("readonly", true);
    $("#courseTitle").prop("readonly", true);
    $("#courseNumber2").prop("readonly", true);
    $("#courseTitle2").prop("readonly", true);
    $("#reasonForRequest").prop("readonly", true);

    autoCompleteUtils.makeReadOnly("subject");
    autoCompleteUtils.makeReadOnly("subject2");
    autoCompleteUtils.makeReadOnly("institution");
    autoCompleteUtils.makeReadOnly("chairProgramCoordinator");
    autoCompleteUtils.makeReadOnly("dean");
    autoCompleteUtils.makeReadOnly("admin");

    disableRadio("transferCourseY");
    disableRadio("transferCourseN");
    disableRadio("addAnotherCourseY");
    disableRadio("addAnotherCourseN");
  }

  vm.onLoad = function onLoad(source, inputValues) {
    //  This takes place after applyBindings has been called and has added input observables to the
    //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
    //  populating dropdowns, select options and other operations that need to take place every
    //  time the form is loaded.

    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.

    getCatalogYears();

    $(".student").hide();
    $(".chair").hide();
    $(".dean").hide();
    $(".adminAssistant").hide();
    $(".OfficialUseOnly").hide();
    $(".developer").hide();

    //hide the comments unless the form has been declined
    $(".chairComments").hide();
    $(".deanComments").hide();
  };

  vm.setDefaults = function setDefaults(source, inputValues) {
    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    integration
      .all("GET_Current_Academic_Year", {})
      .then(function (academicYear) {
        //console.log(academicYear);

        let acadYr = academicYear[0].AcademicYear;
        vm.currentAcademicYear(acadYr);
      });

    if (!pkg.isAtStep("Start")) {
      autoCompleteUtils.makeReadOnly("StudentsPrograms");
      autoCompleteUtils.makeReadOnly("InstitutionTitle");

      $("#catalogYear").prop("disabled", true);
    }

    if (pkg.isAtStep("Student")) {
      //Signatures
      $(".student").show();
      $(".counselor").show();

      $(".chair").hide();
      $(".dean").hide();
      $(".adminAssistant").hide();

      $("#counselorSignature").prop("readonly", true);

      makeAllFieldsReadOnly();
    }

    if (
      pkg.isAtStep("ChairProgramCoordinator") ||
      pkg.isAtStep("ChairProgramDirectorDenied")
    ) {
      $(".student").show();
      $(".counselor").show();
      $(".chair").show();

      $(".dean").hide();
      $(".adminAssistant").hide();

      $("#studentSignature").prop("readonly", true);
      $("#counselorSignature").prop("readonly", true);

      vm.departmentChairEmail("epeake@softdocs.com");

      makeAllFieldsReadOnly();
    }

    if (pkg.isAtStep("Dean") || pkg.isAtStep("DeanDenied")) {
      $(".student").show();
      $(".dean").show();
      $(".counselor").show();
      $(".chair").show();

      $(".adminAssistant").hide();

      $("#studentSignature").prop("readonly", true);
      $("#counselorSignature").prop("readonly", true);
      $("#chairProgramCoordSignature").prop("readonly", true);

      // $("#chairDeclineComments").prop("required", true);
      requiredIndicators.setRequired("deanDeclineComments", true);

      vm.deanEmail("epeake@softdocs.com");

      makeAllFieldsReadOnly();
    }

    if (pkg.isAtStep("AdminAssistant")) {
      $(".student").show();
      $(".adminAssistant").show();
      $(".dean").show();
      $(".counselor").show();
      $(".chair").show();

      $("#studentSignature").prop("readonly", true);
      $("#counselorSignature").prop("readonly", true);
      $("#chairProgramCoordSignature").prop("readonly", true);
      $("#deanSignature").prop("readonly", true);

      vm.administrativeSpecialistEmail("epeake@softdocs.com");

      makeAllFieldsReadOnly();
    }

    if (
      pkg.isAtStep("WFRegistrar") ||
      pkg.isAtStep("Content") ||
      pkg.isAtStep("RegistrarDenied")
    ) {
      $(".student").show();
      $(".adminAssistant").show();
      $(".dean").show();
      $(".counselor").show();
      $(".chair").show();
      $(".OfficialUseOnly").show();

      $("#studentSignature").prop("readonly", true);
      $("#counselorSignature").prop("readonly", true);
      $("#chairProgramCoordSignature").prop("readonly", true);
      $("#deanSignature").prop("readonly", true);
      $("#deanAdminSignature").prop("readonly", true);

      makeAllFieldsReadOnly();
    }

    //

    //Populating today's date on signature
    vm.counselorSignature.subscribe(function (sig) {
      vm.counselorSignatureDate(getTodayDate());
    });

    //Populating today's date on signature
    vm.studentSignature.subscribe(function (sig) {
      vm.studentSignatureDate(getTodayDate());
    });

    //Populating today's date on signature
    vm.chairProgramCoordSignature.subscribe(function (sig) {
      vm.chairProgramCoordSignatureDate(getTodayDate());
    });

    //Populating today's date on signature
    vm.deanSignature.subscribe(function (sig) {
      vm.deanSignDate(getTodayDate());
    });

    //Populating today's date on signature
    vm.deanAdminSignature.subscribe(function (sig) {
      vm.deanAdminSignDate(getTodayDate());
    });

    vm.subject.subscribe(function (inst) {
      let personGUID = $("#personGUID").val();
      integration
        .all("Web_Ethos_Get_Person_External_Education_by_Person_GUID", {
          personGUID: personGUID,
        })
        .then(function (externalEdu) {
          //This uses one single object in the array and processes it through this integration and pushes it to the Transferring Institution autocomplete
          externalEdu.forEach((institution) => {
            integration
              .all("Web_Ethos_Get_Educational_Institutions_by_GUID", {
                InstitutionGUID: institution.institution.id,
              })
              .then(function (EduInstitution) {
                let instTitle = EduInstitution.title;
                if (instTitle != "Home School") {
                  vm.studentInstitutionsAttended.push({
                    title: EduInstitution.title,
                  });
                }
              });
          });
        });
    });
  };

  vm.afterLoad = function afterLoad() {
    $(".loading").hide();

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
    //  if (pkg.isAtStep('ChairProgramCoordinator')){
    //   $("#chairDeclineComments").prop("required", true);
    //   $('.chairComments').show();
    // }
    // if (pkg.isAtStep('Dean')){
    //   $("#deanDeclineComments").prop("required", true);
    //   $('.deanComments').show();
    // }
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
