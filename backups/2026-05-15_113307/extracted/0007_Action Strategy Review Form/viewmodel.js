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
  "../293/formUtils.js",
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
  // Safe to call before init. Calls to setRequired(...) queue until afterLoad runs init(vm).
  var requiredIndicators = formUtils.createRequiredIndicators();

  // Form-scoped autocomplete utility manager.
  // Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
  var autoCompleteUtils = formUtils.createAutoCompleteUtils();

  //This Function provides a unique ID for the form
  vm.makeid = function (length) {
    let result = "";
    let characters = "ABCDEFG0123456789"; // characters & numbers used to create the random string
    let charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return new Date().getFullYear() + "-" + result; // use this to include year in the result: YYYY-xxxxxx
    //return result;                                    // use this to only return the result: xxxxxx
  };

  vm.addObservableArray("academicProgramList");
  vm.addObservableArray("SubjectsAutocomplete");

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
    $(".programRow").hide();
    $(".disciplineRow").hide();
    $(".genEdRow").hide();

    if (user.isOriginator) {
      $(".leadReviewerRow").hide();
    }
    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.
  };
  vm.setDefaults = function setDefaults(source, inputValues) {
    if (pkg.isAtStep("WFIEResearchAssociate")) {
      $(".ieResearchAssociate").show();
    } else {
      $(".ieResearchAssociate").hide();
    }

    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.
    vm.q1(
      "What is the issue or problem that needs to be addressed? Indicate the page number(s) in report where this is referenced and the data that supports this concern.",
    );
    vm.q2(
      "What is the proposed action to address the issue or problem described in question one.",
    );
    vm.q3(
      "What has already been done to try to address the issue or problem? Why have these actions not been successful?",
    );
    vm.q4("What individual will see to it that this action is carried out?");
    vm.q5("Indicate the date by which this action will be implemented.");
    vm.q6(
      "What College services or support are needed to implement this plan?",
    );
    vm.q7("What is the estimated cost to implement this strategy?");
    vm.q8(
      "How will you measure the impact or effectiveness of this action? What will be your metric for knowing when this action has successfully addressed the issue or problem?",
    );
    vm.ActionStrategyStatus("New");

    //updating action strategy number process *****************************************************************************
    if (
      pkg.isAtStep("ConditionalActorGetLeadReviewer") ||
      (pkg.isAtStep("ConditionalActorGetDean") &&
        vm.skipLeadReviewer() !== "No")
    ) {
      if (
        vm.progDiscGEOName() &&
        vm.reviewYear() &&
        vm.actionCodeSet() !== "Yes"
      ) {
        integration
          .all(
            "Etrieve_Integration_Get_Next_Action_Strategy_Number_by_Review_Code_and_Review_Year",
            {
              ProgDiscGEOName: "%" + vm.progDiscGEOName() + "%",
              AcademicYear: vm.reviewYear(),
            },
          )
          .then(function (actionStrategyData) {
            vm.actionNumber(actionStrategyData[0].NextASNumber || "1");
          });
        vm.actionCodeSet("Yes");
      }
    }

    vm.actionNumber.subscribe(function (newValue) {
      if (newValue) {
        integration.add("Etrieve_Integration_Update_Action_Strategy_Number", {
          progDiscGEOName: vm.progDiscGEOName(),
          reviewYear: vm.reviewYear(),
          actionNumber: newValue,
          formID: vm.formID(),
        });
      }
    });
    //end updating action strategy number process **************************************************************************

    vm.reviewType.subscribe(function (reviewTypeValue) {
      reviewTypeRowShow(reviewTypeValue);
    });

    vm.leadReviewerEmail.subscribe(function (NewValue) {
      let lrEmail = NewValue.toUpperCase();
      let userEmail = user.Email.toUpperCase();

      if ((lrEmail == userEmail && user.isOriginator) || user.isInActivity) {
        $(".leadReviewerRow").show();
        vm.skipLeadReviewer("Yes");
      } else {
        $(".leadReviewerRow").hide();
        vm.skipLeadReviewer("No");
      }
    });

    //only show the Executive Council rows (class=ECRow) at the Executive Council WF step (WFExecutiveCouncil)
    if (
      pkg.stepCode === "WFProvost" ||
      pkg.stepCode === "End" ||
      user.isInActivity
    ) {
      $(".ECRow").show();
    } else {
      $(".ECRow").hide();
    }

    //only show the Academic Dean rows (class=academicDeanRow) at the Deans WF step (ConditionalActorGetDean) or the Executive Council WF step (WFExecutiveCouncil)
    if (
      pkg.stepCode === "ConditionalActorGetDean" ||
      pkg.stepCode === "WFProvost" ||
      pkg.stepCode === "End" ||
      user.isInActivity
    ) {
      $(".academicDeanRow").show();
    } else {
      $(".academicDeanRow").hide();
    }

    //add current date to the deanRecommendationDate when a value changes for the recommendApproval field.
    vm.recommendApproval.subscribe(function (newValue) {
      if (newValue.length > 0) {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, "0");
        var mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
        var yyyy = today.getFullYear();

        var currentDate = mm + "/" + dd + "/" + yyyy;
        vm.deanRecommendationDate(currentDate);
      } else {
        vm.deanRecommendationDate(undefined);
      }
    });

    //add current date to the ecApprovalDate when a value changes for the approval field.
    vm.approval.subscribe(function (newValue) {
      if (newValue.length > 0) {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, "0");
        var mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
        var yyyy = today.getFullYear();

        var currentDate = mm + "/" + dd + "/" + yyyy;
        vm.ecApprovalDate(currentDate);
      } else {
        vm.ecApprovalDate(undefined);
      }
    });

    //If the Academic Dean does not recommend then make the Not Recommended Reason a required field.
    vm.recommendApproval.subscribe(function (NewValue) {
      if (NewValue == "NotRecommended") {
        requiredIndicators.setRequired("notRecommendedReason", true);
      } else {
        requiredIndicators.setRequired("notRecommendedReason", false);
      }
    });

    //If the Executive Council Represetative does not recommend then make the Not Approved Reason a required field.
    vm.approval.subscribe(function (approvalValue) {
      if (approvalValue == "NotApproved") {
        requiredIndicators.setRequired("notApprovedReason", true);
      } else {
        requiredIndicators.setRequired("notApprovedReason", false);
      }
    });

    vm.programCode.subscribe(function (NewValue) {
      if (NewValue) {
        // If there's a new value
        vm.reviewCode(NewValue);
      } else {
        vm.reviewCode(undefined);
      }
    });

    vm.discipline.subscribe(function (NewValue) {
      if (NewValue) {
        vm.reviewCode("R." + vm.discipline() + "1");
      } else {
        vm.reviewCode(undefined);
      }
    });

    // Disable Comments for Lead Reviewer fields at the Lead Reviewer step
    if (
      pkg.isAtStep("Start") ||
      pkg.isAtStep("ConditionalActorGetLeadReviewer")
    ) {
      $("#ecCommentsForLeadReviewer").prop("disabled", true);
      $("#ecCommentsForLeadReviewer").css("cursor", "not-allowed");
      $("#deanCommentsForLeadRev").prop("disabled", true);
      $("#deanCommentsForLeadRev").css("cursor", "not-allowed");
    }

    // The following code will populate the progDiscGEOName field with what program/discipline/GEO name is selected.
    vm.program.subscribe(function (NewValue) {
      if (NewValue && vm.reviewType() == "Program") {
        vm.progDiscGEOName(NewValue);
      } else {
        vm.progDiscGEOName(undefined);
      }
    });

    vm.discipline.subscribe(function (NewValue) {
      if (NewValue && vm.reviewType() == "Discipline") {
        vm.progDiscGEOName(NewValue);
      } else {
        vm.progDiscGEOName(undefined);
      }
    });

    vm.generalEducation.subscribe(function (NewValue) {
      if (NewValue && vm.reviewType() == "General Education") {
        vm.progDiscGEOName(NewValue);
      } else {
        vm.progDiscGEOName(undefined);
      }
    });

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.
      vm.skipLeadReviewer("No");
      vm.formID(vm.makeid(6));
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
    // This replays any queued setRequired(...) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    // Initialize autocomplete utilities after VM bindings are ready.
    // Replays any queued makeReadOnly/makeEditable calls made earlier.
    autoCompleteUtils.init(vm);

    // Toggle export mode styling and behavior.
    // Hides required indicators/notes and normalizes readonly presentation for export.
    autoCompleteUtils.setExportMode(pkg.isExporting);

    //Initialize FormBuilder created form specific code
    liveVM.afterLoadEditsForVM();

    if (vm.reviewType()) {
      reviewTypeRowShow(vm.reviewType());
    }

    // ko.computed(function () {
    //     if (vm.reviewCode() && vm.reviewYear()) {
    //         integration.all('OIE_Get_Action_Strategy_by_Review_Code_and_Review_Year', {
    //             reviewCode: '%'+vm.reviewCode()+'%',
    //             reviewYear: vm.reviewYear()
    //         }).then(function (actionStrategyData) {
    //             console.log('actionStrategyData');
    //             vm.actionNumber(actionStrategyData[0].NextASNumber || '1');

    //         });

    //     }
    // });

    // ko.computed(function () {
    //     if (vm.progDiscGEOName() && vm.reviewYear() && user.isInLibrary) {
    //         integration.all('Etrieve_Integration_Get_Next_Action_Strategy_Number_by_Review_Code_and_Review_Year', {
    //             ProgDiscGEOName: '%'+vm.progDiscGEOName()+'%',
    //             AcademicYear: vm.reviewYear()
    //         }).then(function (actionStrategyData) {
    //             console.log('actionStrategyData','actionStrategyData');
    //             vm.actionNumber(actionStrategyData[0].NextASNumber || '1');

    //         });

    //     }
    // });

    ko.computed(function () {
      if (vm.questionFourName() && vm.questionFourEmail()) {
        vm.nameTitle(vm.questionFourName() + " " + vm.questionFourEmail());
      } else {
        vm.nameTitle(undefined);
      }
    });

    // ko.computed(function () {
    //     if (vm.reviewCode() && vm.actionNumber()) {
    //         vm.reviewID(vm.reviewCode()+'.'+vm.actionNumber());
    //     }
    //     else {
    //         vm.reviewID(undefined);
    //     }
    // });

    ko.computed(function () {
      if (vm.recommendApproval() == "Recommend") {
        vm.deanNotes(vm.deanRecommendComments());
        $("#notRecommendedReason").prop("disabled", true);
        $("#deanRecommendComments").prop("disabled", false);
      }
      if (vm.recommendApproval() == "NotRecommended") {
        vm.deanNotes(vm.notRecommendedReason());
        $("#deanRecommendComments").prop("disabled", true);
        $("#notRecommendedReason").prop("disabled", false);
      }
      if (vm.approval() == "Approved") {
        vm.ecNotes(vm.executiveCouncilApprovalComments());
        $("#notApprovedReason").prop("disabled", true);
        $("#executiveCouncilApprovalComments").prop("disabled", false);
      }
      if (vm.approval() == "NotApproved") {
        vm.ecNotes(vm.notApprovedReason());
        $("#executiveCouncilApprovalComments").prop("disabled", true);
        $("#notApprovedReason").prop("disabled", false);
      }
    });

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

    //run the function at the bottom of the form to create timestamp when user submits.
    vm.submissionDateTime(dateTimeStamp());
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

  function reviewTypeRowShow(reviewTypeValue) {
    switch (reviewTypeValue) {
      case "Program":
        $(".programRow").show();
        $(".disciplineRow").hide();
        $(".genEdRow").hide();
        break;
      case "Discipline":
        $(".programRow").hide();
        $(".disciplineRow").show();
        $(".genEdRow").hide();
        break;
      case "General Education":
        $(".programRow").hide();
        $(".disciplineRow").hide();
        $(".genEdRow").show();
        break;
      default:
        $(".programRow").hide();
        $(".disciplineRow").hide();
        $(".genEdRow").hide();
        break;
    }
  }

  function dateTimeStamp() {
    // Get the current date and time
    const now = new Date();

    // Extract day, month, and year
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = now.getFullYear();

    // Extract hours and minutes
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");

    // Determine AM/PM
    const ampm = hours >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hours = hours % 12 || 12;

    // Format the timestamp
    const timestamp = `${month}/${day}/${year} - ${hours}:${minutes} ${ampm}`;

    return timestamp;
  }

  return vm;
});
