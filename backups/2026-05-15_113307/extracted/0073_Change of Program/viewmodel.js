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
  //Hide the Staff Comments
  $(".ssStaffComments").hide();
  //Hide the Developer Section
  $(".developer").hide();
  //Hide the Decline Reason
  $(".declineHide").hide();

  //Add observable array for student programs dropdown
  vm.addObservableArray("studentActivePrograms");
  vm.addObservableArray("AcademicPeriodsAutocomplete");

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

    integration
      .all("EthosColleagueAcademicPrograms", {})
      .then(function (programInfo) {
        // Sorting by title);
        // List of program codes to exclude
        const excludedCodes = [
          "DEI.NON",
          "DHY.AASX",
          "DHY.APP",
          "DMS.AASX",
          "DMS.APP",
          "MTA",
          "NCS.NON",
          "NDS.NON",
          "NDS.EWD.NON",
          "NUR.AAS",
          "NUR.APP",
          "PROG",
          //"PLG.AAS",
          "PLG.APP",
          "PLG.CT",
          "PLG.ONL.CT",
          "RAL.AASX",
          "RAL.APP",
          "RSP.AASX",
          "RSP.APP",
          "SUR.AASX",
          "SUR.APP",
          
          
        ];

        const activePrograms = programInfo
          .filter(
            (program) =>
              program.status === "active" &&
              !excludedCodes.includes(program.code) &&
              !program.code.startsWith("NCP.") &&
              !program.code.startsWith("NON."),
          )
          .map((program) => ({
            title: program.title,
            code: program.code,
          }))
          .sort((a, b) => a.title.localeCompare(b.title)); // Sorting by title

        vm.programsDropdown(activePrograms);
      });

    if (
      !user.isInLibrary &&
      !user.isInDrafts &&
      !pkg.isAtStep("ConditionalOriginator")
    ) {
      $(".ssStaffComments").show();
    }

    if (pkg.isAtStep("WFChangeofProgramDEOEC") || pkg.isAtStep("SSStaff")) {
      vm.approvedBy(user.DisplayName);
      vm.reasonForDecline("");
    }

    // if(pkg.isAtStep('ConditionalOriginator') || pkg.isAtStep('cancelForm')) {
    //     $('.declineHide').show();
    //     document.getElementById('reasonForDecline').readOnly = true;
    // } else {
    //     document.getElementById('reasonForDecline').readOnly = false;
    // }

    if (
      pkg.isAtStep("cancelForm") ||
      (user.isInActivity && vm.reasonForDecline())
    ) {
      $(".declineHide").show();
      document.getElementById("reasonForDecline").readOnly = true;
    } else {
      document.getElementById("reasonForDecline").readOnly = false;
    }

    integration
      .all("Web_Ethos_Get_Academic_Periods_by_endOn_Date", {
        logic: "$gte",
        endOnDate: dateManipulation(0),
      })
      .then(function (academicPeriodEndOnData) {
        const selectedPeriods = getCurrentAndNextPeriods(
          academicPeriodEndOnData,
        );

        vm.AcademicPeriodsAutocomplete(
          selectedPeriods.map((period) => ({
            termCode: period.code,
            termTitle: period.title,
          })),
        );
      });

    function dateManipulation(days) {
      let date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
    }

    function getCurrentAndNextPeriods(data) {
      const currentDate = new Date();

      // Filter out terms that contain "AY" in their code
      const filteredData = data.filter((term) => !term.code.includes("AY"));

      // Sort terms by start date
      filteredData.sort((a, b) => new Date(a.startOn) - new Date(b.startOn));

      // Find the current period or the next available one
      let currentPeriodIndex = filteredData.findIndex(
        (term) =>
          new Date(term.startOn) <= currentDate &&
          new Date(term.endOn) >= currentDate,
      );

      if (currentPeriodIndex === -1) {
        currentPeriodIndex = filteredData.findIndex(
          (term) => new Date(term.startOn) > currentDate,
        );
      }

      // Return current and next period (if available)
      return currentPeriodIndex !== -1
        ? filteredData.slice(currentPeriodIndex, currentPeriodIndex + 2)
        : [];
    }

    integration
      .all("Web_Ethos_Get_Active_Programs_by_Colleague_ID", {
        studentID: user.ErpId,
      })
      .then(function (programInfo) {
        programInfo.forEach((programs) => {
          vm.studentActivePrograms.push({
            programName: programs.ProgramName,
            programCode: programs.ProgramCode,
          });
        });
      });

    vm.studentSignature.subscribe(function (newValue) {
      if (newValue) {
        vm.studentSignatureDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.studentSignatureDate("");
      }
    });

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.

      vm.currentAcademicYear(getAcademicYear());
      vm.ssDocType("Change of Program");

      if (pkg.isAtStep("Start")) {
        requiredIndicators.setRequired("reasonForChange", true);
      } else {
        requiredIndicators.setRequired("reasonForChange", false);
      }
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

    $(".declineHide").show();
    if (vm.reasonForDecline()) {
      return true;
    } else {
      requiredIndicators.setRequired("reasonForDecline", true);
      throw new Error(
        "Please enter a reason for declining at the bottom of the form, then click Decline again to send the form back to the Student.",
      );
    }
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

  // ========================== HELPER FUNCTIONS ==========================================

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

  // ============================ END HELPER FUNCTIONS ======================================

  return vm;
});
