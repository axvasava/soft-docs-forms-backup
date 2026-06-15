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
  $(".maskzip").mask("99999");
  $(".maskssn").mask("9999");
  $(".maskID").mask("9999999");
  $(".maskBD").mask("99/99/9999");

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

  vm.noStudentFound = ko.observable(false);

  function getTodayDate() {
    const today = new Date();

    // Pad month/day with leading zero if needed
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const year = today.getFullYear();

    return `${month}/${day}/${year}`;
  }

  $("#studentSearchButton").click(function () {
    /* CLEAR OUT ALL AUTOPOPULATED DATA*/
    vm.studentFirstName(undefined);
    vm.studentLastName(undefined);

    // check if there is data in the colleague id
    if (vm.studentID()) {
      if (vm.studentID().length == 7) {
        // check if there's 7 digits

        // GET PERSON FROM COLLEAGUE ID
        integration
          .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
            personID: vm.studentID(),
          })
          .then(function (personResults) {
            if (personResults) {
              //vm.personGUID(personResults.id);
              //let personGUID = personResults.id;

              const studentName = personResults.names.find(
                (name) => name.preference === "preferred",
              );

              vm.studentFirstName(studentName.firstName);
              vm.studentLastName(studentName.lastName);
            } else {
              notify("error", "Person not found");
              vm.studentID(undefined);
              vm.studentFirstName(undefined);
              vm.studentLastName(undefined);
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
      .prop("disabled", true)
      .attr({
        tabindex: "-1",
        "aria-disabled": "true",
      })
      .css({
        "pointer-events": "none",
        "background-color": "#f5f5f5",
        color: "#555",
      });
  }

  function makeRadioReadOnly(elementID) {
    $(`#${elementID}`)
      .attr({
        "aria-disabled": "true",
        tabindex: "-1",
      })
      .css({
        "pointer-events": "none", // prevents clicking
        opacity: "0.6", // visual cue
        cursor: "not-allowed",
      });
  }

  function makeRadioAvailable(elementID) {
    const $el = $(`#${elementID}`);
    $el.prop("disabled", false).attr("aria-disabled", "false").css({
      "pointer-events": "", // prevents clicking
      opacity: "", // visual cue
      cursor: "",
    });
  }

  function studentInfoReadOnlyFields() {
    $("#SSN").prop("readonly", true);
    $("#DOB").prop("readonly", true);
    $("#FirstName").prop("readonly", true);
    $("#MiddleName").prop("readonly", true);
    $("#LastName").prop("readonly", true);
    $("#StudentEmailAddress").prop("readonly", true);
    $("#formerNames").prop("readonly", true);
    $("#Address").prop("readonly", true);
    $("#City").prop("readonly", true);
    makeAutoCompleteReadOnly("State");
    $("#Zip").prop("readonly", true);
    $("#PhoneNumber").prop("readonly", true);
  }

  function readOnlyFields() {
    $("#OtherComments").prop("readonly", true);
    $("#MailToAddress").prop("readonly", true);
    $("#FaxToNumber").prop("readonly", true);
    $("#EmailToAddress").prop("readonly", true);
    $("#NameOfOrganization").prop("readonly", true);
    $("#OtherComments").prop("readonly", true);

    //checkbox
    $("#Enrollment").prop("disabled", true);
    $("#TuitionFees").prop("disabled", true);
    $("#AttachedForm").prop("disabled", true);
    $("#Other").prop("disabled", true);
    $("#MailTo").prop("disabled", true);
    $("#FaxTo").prop("disabled", true);
    $("#EmailTo").prop("disabled", true);

    //dropdown
    $("#selectedStatus").attr("disabled", "disabled");
    $("#EnrollmentSemester").attr("disabled", "disabled");
    $("#TuitionFeeReleaseSemesterYear").attr("disabled", "disabled");

    makeRadioReadOnly("ReleaseOrDiscloseMyself");
    makeRadioReadOnly("ReleaseOrDiscloseOrganization");
    makeRadioReadOnly("CreditHoursInclude");
    makeRadioReadOnly("CreditHoursDoNot");
  }

  function availableFields() {
    $("#OtherComments").prop("readonly", false);
    $("#MailToAddress").prop("readonly", false);
    $("#FaxToNumber").prop("readonly", false);
    $("#EmailToAddress").prop("readonly", false);
    $("#NameOfOrganization").prop("readonly", false);
    $("#OtherComments").prop(false);

    //checkbox
    $("#Enrollment").prop("disabled", false);
    $("#TuitionFees").prop("disabled", false);
    $("#AttachedForm").prop("disabled", false);
    $("#Other").prop("disabled", false);
    $("#MailTo").prop("disabled", false);
    $("#FaxTo").prop("disabled", false);
    $("#EmailTo").prop("disabled", false);

    //dropdown
    $("#selectedStatus").attr("disabled", "disabled");
    $("#EnrollmentSemester").attr("disabled", false);
    $("#TuitionFeeReleaseSemesterYear").attr("disabled", false);

    makeRadioAvailable("ReleaseOrDiscloseMyself");
    makeRadioAvailable("ReleaseOrDiscloseOrganization");
    makeRadioAvailable("CreditHoursInclude");
    makeRadioAvailable("CreditHoursDoNot");
  }

  vm.onLoad = function onLoad(source, inputValues) {
    //  This takes place after applyBindings has been called and has added input observables to the
    //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
    //  populating dropdowns, select options and other operations that need to take place every
    //  time the form is loaded.

    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.

    //hidden fields on the form

    $(".developer").hide();

    if (user.isOriginator) {
      $(".instructions").hide();
      $(".otherRows").hide();
      $(".studentSig").hide();
      $(".OfficialUseOnly").hide();
    }
  };

  vm.setDefaults = function setDefaults(source, inputValues) {
    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    vm.studentStatus("Other");

    integration
      .all("GET_Current_Academic_Year", {})
      .then(function (academicYear) {
        //console.log(academicYear);

        let acadYr = academicYear[0].AcademicYear;
        vm.currentAcademicYear(acadYr);
      });

    //Populating today's date on signature
    vm.StudentSignature.subscribe(function (sig) {
      vm.StudentSignatureDate(getTodayDate());
    });

    //foundStudentID is a checkbox
    vm.noStudentFound.subscribe(function (isChecked) {
      if (isChecked) {
        vm.nisID("No_ID");
        vm.nisStudentName($("#FirstName").val() + " " + $("#LastName").val());

        vm.studentFirstName(undefined);
        vm.studentLastName(undefined);
      } else {
        vm.nisID(undefined);
        vm.nisStudentName(undefined);

        vm.studentFirstName(undefined);
        vm.studentLastName(undefined);
      }
    });

    if (pkg.isAtStep("Start")) {
    }

    if (pkg.isAtStep("RegistrarVerification")) {
      $("#noStudentFound").prop("disabled", false);
      $("#studentID").prop("disabled", false);

      studentInfoReadOnlyFields();
    }

    if (pkg.isAtStep("ESign")) {
      studentInfoReadOnlyFields();
      availableFields();

      $("#StudentSignature").prop("disabled", false);
    }

    if (pkg.isAtStep("Registrar")) {
      $("#noStudentFound").prop("disabled", false);
      $("#studentID").prop("disabled", false);

      studentInfoReadOnlyFields();
      readOnlyFields();
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

    if (pkg.isAtStep("RegistrarVerification")) {
      $(".OfficialUseOnly").show();
      $(".otherRows").hide();
      $(".studentSig").hide();
      $(".instructions").hide();
    }

    if (pkg.isAtStep("ESign")) {
      $(".OfficialUseOnly").hide();
      $(".studentSig").show();
      $(".instructions").show();
      $(".otherInstruction").hide();
    }

    if (pkg.isAtStep("Registrar")) {
      $(".OfficialUseOnly").show();
      $(".otherRows").show();
      $(".studentSig").show();
      $(".otherInstruction").hide();
    }

    $(".loading").hide();
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
    //Delivery Methods section
  };

  vm.onApprove = function onApprove(form) {
    //  This method is called when the Approve button is clicked and before calling beforeRequired.
    if (pkg.isAtStep("RegistrarVerification")) {
      var studentID = document.getElementById("studentID").value;
      var studentFirstName = document.getElementById("studentFirstName").value;

      if (!$("#noStudentFound").is(":checked") && studentID === "") {
        notify(
          "error",
          "Was this student searched for and located in the database?",
        );
        return false;
      }

      if (studentID !== "" && studentFirstName === "") {
        notify("error", "A valid student ID must be entered to proceed.");
        return false;
      }
    }
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
    let selected = $("input[name='ReleaseOrDisclose']:checked").val();
    if (selected == "organization") {
      if ($("#NameOfOrganization").val() == "") {
        requiredIndicators.setRequired("NameOfOrganization", true);
        notify(
          "error",
          "Name of Organization is required for releasing information to another organization.",
        );
        return false;
      }
    }

    if ($("#Enrollment").is(":checked")) {
      if ($("#EnrollmentSemester").val() == "") {
        requiredIndicators.setRequired("EnrollmentSemester", true);
        notify(
          "error",
          "Enrollment semester is required for Confirmation of Enrollment at the College",
        );
        return false;
      }
    }

    if ($("#TuitionFees").is(":checked")) {
      if ($("#TuitionFeeReleaseSemesterYear").val() == "") {
        requiredIndicators.setRequired("TuitionFeeReleaseSemesterYear", true);
        notify(
          "error",
          "Tuition and Fees semester is required for tuition and fee release",
        );
        return false;
      }
    }

    if ($("#MailTo").is(":checked")) {
      if ($("#MailToAddress").val() == "") {
        requiredIndicators.setRequired("MailToAddress", true);
        notify("error", "Mailing address is required");
        return false;
      }
    }

    if ($("#FaxTo").is(":checked")) {
      if ($("#FaxToNumber").val() == "") {
        requiredIndicators.setRequired("FaxToNumber", true);
        notify("error", "Fax number is required");
        return false;
      }
    }

    if ($("#EmailTo").is(":checked")) {
      if ($("#EmailToAddress").val() == "") {
        requiredIndicators.setRequired("EmailToAddress", true);
        notify("error", "Email address is required");
        return false;
      }
    }

    if (
      !$("#MailTo").is(":checked") &&
      !$("#FaxTo").is(":checked") &&
      !$("#EmailTo").is(":checked")
    ) {
      notify("error", "Please select at least one delivery method.");
      return false;
    }

    // Information to be released section
    if ($("#Other").is(":checked")) {
      if ($("#OtherComments").val() == "") {
        requiredIndicators.setRequired("OtherComments", true);
        notify(
          "error",
          'You selected "Other" information to be released. Please list an explaination in the space provided.',
        );
        return false;
      }
    }

    if (
      !$("#Enrollment").is(":checked") &&
      !$("#TuitionFees").is(":checked") &&
      !$("#AttachedForm").is(":checked") &&
      !$("#Other").is(":checked")
    ) {
      notify(
        "error",
        "Please select at least one piece of information to be released.",
      );
      return false;
    }

    //Form requires attachment
    if (form.attachmentCount < 1) {
      notify(
        "error",
        "Please attach a copy of a valid drivers license or state ID card",
      );
      return false;
    }
  };

  return vm;
});
