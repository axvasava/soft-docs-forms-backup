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

  function getTodayDate() {
    const today = new Date();

    // Pad month/day with leading zero if needed
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${month}/${day}/${year}`;
  }

  function disableRadio(elementID) {
    const $el = $(`#${elementID}`);
    $el
      .prop("disabled", true)
      .attr("aria-disabled", "true")
      .css({ opacity: "0.6", cursor: "not-allowed" });
  }

  function makeAllFieldsReadOnly() {
    autoCompleteUtils.makeReadOnly("");
    autoCompleteUtils.makeReadOnly("#organizationName");
    autoCompleteUtils.makeReadOnly("#federalID");
    autoCompleteUtils.makeReadOnly("#organizationAddress");
    autoCompleteUtils.makeReadOnly("#organizationCity");
    autoCompleteUtils.makeReadOnly("#organizationState");
    autoCompleteUtils.makeReadOnly("#organizationZip");
    autoCompleteUtils.makeReadOnly("#organizationContactName");
    autoCompleteUtils.makeReadOnly("#organizationContactEmail");
    autoCompleteUtils.makeReadOnly("#organizationContactPhone");
    autoCompleteUtils.makeReadOnly("#instructorName");
    autoCompleteUtils.makeReadOnly("#instructorPhone");
    autoCompleteUtils.makeReadOnly("#software");
    autoCompleteUtils.makeReadOnly("#purposeOfEvent");
    autoCompleteUtils.makeReadOnly("#expectedAttendance");
    autoCompleteUtils.makeReadOnly("#eventDate");
    autoCompleteUtils.makeReadOnly("#eventTime");
    autoCompleteUtils.makeReadOnly("#arrivalTime");
    autoCompleteUtils.makeReadOnly("#departTime");
    autoCompleteUtils.makeReadOnly("#purposeOfEvent");
    autoCompleteUtils.makeReadOnly("#partyDescription");
    autoCompleteUtils.makeReadOnly("#neededEasels");
    autoCompleteUtils.makeReadOnly("#other");

    //dropdown and checkboxes
    $("#foodPlanned").prop("disabled", true);
    $("#reserveDiningRoom").prop("disabled", true);
    $("#monday").prop("disabled", true);
    $("#tuesday").prop("disabled", true);
    $("#wednesday").prop("disabled", true);
    $("#thursday").prop("disabled", true);
    $("#friday").prop("disabled", true);
    $("#saturday").prop("disabled", true);
    $("#computerLab20HalfDay").prop("disabled", true);
    $("#computerLab20FullDay").prop("disabled", true);
    $("#computerLab32HalfDay").prop("disabled", true);
    $("#computerLab32FullDay").prop("disabled", true);
    $("#meetingRoom20HalfDay").prop("disabled", true);
    $("#meetingRoom20FullDay").prop("disabled", true);
    $("#meetingRoom50HalfDay").prop("disabled", true);
    $("#meetingRoom50FullDay").prop("disabled", true);
    $("#videoConferenceRoom12").prop("disabled", true);
    $("#roomLayout").prop("disabled", true);
    $("#internetInstructor").prop("disabled", true);
    $("#studentsInternet").prop("disabled", true);
    $("#printerInstructor").prop("disabled", true);
    $("#printerStudents").prop("disabled", true);
    $("#bringingLaptop").prop("disabled", true);

    // $("#occRepresentative").prop("readonly", true);
    // $("#representativeSignature").prop("readonly", true);
  }

  vm.onLoad = function onLoad(source, inputValues) {
    //  This takes place after applyBindings has been called and has added input observables to the
    //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
    //  populating dropdowns, select options and other operations that need to take place every
    //  time the form is loaded.

    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.

    $(".developer").hide();
  };

  vm.setDefaults = function setDefaults(source, inputValues) {
    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.
    vm.year(new Date().getFullYear());

    vm.occRepresentativeSignature.subscribe(function (sig) {
      vm.occRepresentativeSignDate(getTodayDate());
    });

    vm.representativeSignature.subscribe(function (sig) {
      vm.representativeSignDate(getTodayDate());
    });

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.
    } else {
      //  Input Values set here will be saved to the server immediately.
      //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
      //  prior users.  Inputs that already have values saved to the server will be overridden with
      //  values set in this method.
    }

    if (pkg.isAtStep("Start")) {
      $(".occ").hide();
    }

    if (pkg.isAtStep("BusinessServicesManager")) {
      $(".occ").hide();
      $(".rental").show();

      makeAllFieldsReadOnly();

      $("#representativeSignature").prop("readonly", true);
    }

    if (pkg.isAtStep("EWDCoordinator")) {
      $(".occ").hide();
      $(".rental").show();

      makeAllFieldsReadOnly();

      $("#occRepresentative").prop("readonly", true);
      $("#representativeSignature").prop("readonly", true);
    }

    if (pkg.isAtStep("EWDAdmin")) {
      $(".occ").hide();
      $(".rental").show();

      makeAllFieldsReadOnly();

      $("#occRepresentative").prop("readonly", true);
      $("#representativeSignature").prop("readonly", true);
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

    if (
      !$("#classroomLayout").is(":checked") &&
      !$("#podLayout").is(":checked") &&
      !$("#uShaped").is(":checked") &&
      !$("#openSquare").is(":checked")
    ) {
      notify("error", "Please select at least one desired layout of the room.");
      return false;
    }

    if (
      !$("#monday").is(":checked") &&
      !$("#tuesday").is(":checked") &&
      !$("#wednesday").is(":checked") &&
      !$("#thursday").is(":checked") &&
      !$("#friday").is(":checked") &&
      !$("#saturday").is(":checked")
    ) {
      notify(
        "error",
        "Please select at least one day that the facility is needed.",
      );
      return false;
    }
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

  return vm;
});
