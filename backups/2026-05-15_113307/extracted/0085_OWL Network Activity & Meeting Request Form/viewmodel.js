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
  //HIDE SECTIONS OF THE FORM
  $(".developer").hide();
  $(".advisorSig").hide();
  $(".secSig").hide();
  $(".facSig").hide();
  $(".secSig2").hide();

  const GROUP = {
    FacilitiesAH: "0c15715c-869f-4aa2-ab42-94ff699ccdce",
    FacilitiesHL: "84899944-5986-4d50-b06e-ed250176358b",
    FacilitiesOR: "cd5fa1c2-f03a-4f58-bea2-165f31db738e",
    FacilitiesROSF: "10235c2d-3708-4d40-b2d8-e85d65a0f08e",
  };

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

    if (
      pkg.isAtStep("ConditionalAdvisor") ||
      pkg.isAtStep("WFRSOStudentEngagementCoordinators") ||
      pkg.isAtStep("ConditionalFacilitiesGroup") ||
      pkg.isAtStep("WFRSOStudentEngagementCoordinators2") ||
      pkg.isAtStep("End")
    ) {
      $(".advisorSig").show();
    }

    if (
      pkg.isAtStep("WFRSOStudentEngagementCoordinators") ||
      pkg.isAtStep("ConditionalFacilitiesGroup") ||
      pkg.isAtStep("WFRSOStudentEngagementCoordinators2") ||
      pkg.isAtStep("End")
    ) {
      $(".secSig").show();
    }

    if (
      pkg.isAtStep("ConditionalFacilitiesGroup") ||
      pkg.isAtStep("WFRSOStudentEngagementCoordinators2") ||
      pkg.isAtStep("End")
    ) {
      $(".facSig").show();
    }

    if (
      pkg.isAtStep("WFRSOStudentEngagementCoordinators2") ||
      pkg.isAtStep("End")
    ) {
      $(".secSig2").show();
    }

    // //ONLY SHOW OTHER OFF SECTION IF TITLE HAS VALUE
    // if (vm.otherOffTitle()) {
    //     $('.otherOff').show();
    // } else {
    //   $('.otherOff').hide();
    // }

    // vm.otherOffTitle.subscribe(function(newValue) {
    //     if (newValue) {
    //         $('.otherOff').show();
    //     } else {
    //         $('.otherOff').hide();
    //     }
    // });

    vm.studentSign.subscribe(function (newValue) {
      if (newValue) {
        vm.studentSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.studentSignDate("");
      }
    });

    vm.advisorSign.subscribe(function (newValue) {
      if (newValue) {
        vm.advisorSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.advisorSignDate("");
      }
    });

    vm.secSign.subscribe(function (newValue) {
      if (newValue) {
        vm.secSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.secSignDate("");
      }
    });

    vm.facSign.subscribe(function (newValue) {
      if (newValue) {
        vm.facSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.facSignDate("");
      }
    });

    vm.secSign2.subscribe(function (newValue) {
      if (newValue) {
        vm.secSignDate2(Extenders.utils.formatDate(new Date()));
      } else {
        vm.secSignDate2("");
      }
    });

    vm.campusSelect.subscribe(function (newValue) {
      switch (newValue) {
        case "Auburn Hills":
          vm.groupPrincipalID(GROUP.FacilitiesAH);
          break;
        case "Highland Lakes":
          vm.groupPrincipalID(GROUP.FacilitiesHL);
          break;
        case "Orchard Ridge":
          vm.groupPrincipalID(GROUP.FacilitiesOR);
          break;
        case "Royal Oak":
          vm.groupPrincipalID(GROUP.FacilitiesROSF);
          break;
        case "Southfield":
          vm.groupPrincipalID(GROUP.FacilitiesROSF);
          break;
        default:
          vm.groupPrincipalID("");
          break;
      }
    });

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.

      //RUN THE FUNCTION TO GET CURRENT ACADEMIC YEAR BASED ON DATE OF ORIGINATION
      vm.academicYear(getAcademicYear());

      //POPULATE THE DOCUMENT TYPE FOR EMAIL TEMPLATE AT END OF WORKFLOW
      vm.secDocType("Activity Request Form");

      //GENERATE A FORM ID FOR EMAIL TEMPLATE AT END OF WORKFLOW
      vm.formID(generateFormID());
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

    if (!user.isInLibrary && !user.isInDrafts) {
      $(document).ready(function () {
        setTimeout(function () {
          // Disable the autoCompleteTest input field
          $("#rsoName").prop("disabled", true);

          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#rsoName").css("cursor", "not-allowed");

          //notify('info', 'Autocomplete disabled', 'Information');
        }, 1000); // Adjust the timeout as necessary
      });
    }

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

    // if (vm.contracting() == 'Yes') {
    //     if(form.attachmentCount < 1){
    //       notify('error','Since you indicated that you will be contracting an outside vendor, you must attach a copy of your contract before submitting this form.');
    //       return false;
    //     }else{
    //       return true;
    //     }
    // }
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  // ============================= HELPER FUNCTIONS =============================================

  // ============================= GENERATE ACADEMIC YEAR =======================================

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

  // ============================= END GENERATE ACADEMIC YEAR ===================================

  // ============================= GENERATE FORM ID =============================================

  function generateFormID() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_+=[]{}|;:,.";
    let id = "";

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      id += characters[randomIndex];
    }

    return id;
  }

  // ============================= END GENERATE FORM ID =========================================

  // ============================= END HELPER FUNCTIONS =========================================

  return vm;
});
