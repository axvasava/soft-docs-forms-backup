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
  "./formUtils.js",
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
  var requiredIndicators = formUtils.createRequiredIndicators();
  var fieldStateUtils = formUtils.createFieldStateUtils();

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
  $(".maskid").mask("9999999");

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

  // $('#studentSearchButton').click(function (){

  //     /* CLEAR OUT ALL AUTOPOPULATED DATA*/
  //     vm.studentFirstName(undefined);
  //     vm.studentLastName(undefined);

  //     // check if there is data in the colleague id
  //     if (vm.studentID()) {
  //         if (vm.studentID().length == 7) { // check if there's 7 digits

  //             $('.loading').show();

  //             // GET PERSON FROM COLLEAGUE ID
  //             integration.first('Web_Ethos_Get_Persons_by_Colleague_ID',{personID: vm.studentID()}).then(function(personResults){
  //                 console.log(personResults);

  //                 if (personResults) {
  //                   vm.personGUID(personResults.id);
  //                   let personGUID = personResults.id;

  //                   const studentName = personResults.names.find(name => name.preference === "preferred");

  //                   vm.studentFirstName(studentName.firstName);
  //                   vm.studentLastName(studentName.lastName);

  //                 } else {
  //                   notify('error','Person not found');
  //                   vm.studentID(undefined);
  //                   vm.studentFirstName(undefined);
  //                   vm.studentLastName(undefined);
  //                 }
  //             });
  //         } else {
  //             notify('error','Colleague ID must be 7 digits');
  //         }
  //     } else {
  //         notify('error','Missing Colleague ID');

  //     }

  // });

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

  function makeRadioReadOnly(elementID) {
    $(`#${elementID}`)
      .attr({
        "aria-readonly": "true",
      })
      .css({
        "pointer-events": "none", // prevents clicking
        opacity: "0.6", // visual cue
        cursor: "not-allowed",
      });
  }

  vm.onLoad = function onLoad(source, inputValues) {
    //  This takes place after applyBindings has been called and has added input observables to the
    //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
    //  populating dropdowns, select options and other operations that need to take place every
    //  time the form is loaded.

    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.

    $(".developer").hide(); //hidden fields
  };

  vm.setDefaults = function setDefaults(source, inputValues) {
    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    //Review Status is needed to update REG Transcript Dashboard
    vm.reviewStatus("Needs Review");

    integration
      .all("GET_Current_Academic_Year", {})
      .then(function (academicYear) {
        //console.log(academicYear);

        let acadYr = academicYear[0].AcademicYear;
        vm.currentAcademicYear(acadYr);
      });

    // vm.ddStudentStatus.subscribe(function(selectedVal){
    //     //console.log(selectedVal);
    //     vm.studentStatus(selectedVal);
    // });

    //Populating today's date on signature
    vm.StudentSignature.subscribe(function (sig) {
      vm.StudentSignatureDate(getTodayDate());
    });

    //External Student, therefore nisID = NO_ID
    vm.nisID("No_ID");
    vm.nisStudentName($("#FirstName").val() + " " + $("#LastName").val());
    vm.reviewStatus("Needs Review");
    vm.noStudentFound("nisStudent");

    //foundStudentID is a checkbox
    // vm.noStudentFound1.subscribe(function(isChecked){
    //     if (isChecked) {

    //       vm.nisID('No_ID');
    //       vm.nisStudentName($("#FirstName").val() + ' ' + $("#LastName").val());
    //       vm.reviewStatus('Needs Review');
    //       vm.noStudentFound('nisStudent');
    //       console.log($("#nisID").val(), $("#nisStudentName").val(), $("#noStudentFound").val());

    //       vm.studentFirstName(undefined);
    //       vm.studentLastName(undefined);
    //     } else {
    //       vm.nisID(undefined);
    //       vm.nisStudentName(undefined);
    //       vm.noStudentFound(undefined);

    //       vm.studentFirstName(undefined);
    //       vm.studentLastName(undefined);
    //     }
    // });

    vm.NumberOfCopies.subscribe(function (cost) {
      var NumberOfCopies = document.getElementById("NumberOfCopies").value;
      //console.log(NumberOfCopies);

      let costPerCopy = 5.0;
      var TotalAmountForCopies;

      TotalAmountForCopies = Number(NumberOfCopies) * costPerCopy;
      //console.log(TotalAmountForCopies.toFixed(2));

      vm.TotalAmountForCopies(TotalAmountForCopies.toFixed(2));
    });

    if (pkg.isAtStep("Start")) {
      $(".OfficialUseOnly").hide();
    }

    if (pkg.isAtStep("BOTranscripts")) {
      $(".OfficialUseOnly").show();

      fieldStateUtils.lockForm();
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

    requiredIndicators.init(vm);

    fieldStateUtils.init(vm, {
      requiredIndicators: requiredIndicators,
    });

    fieldStateUtils.setExportMode(pkg.isExporting);

    /*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
    autosize($("textarea"));
  };

  vm.onSubmit = function onSubmit(form) {
    //  This method is called when the Submit button is clicked and before calling beforeRequired.
    //  This normally occurs in the Forms Library, but may occur in the Inbox when a package is
    //  returned to Originator.

    if (!$("#SSN").val()) {
      notify("error", "SSN is required.");
      return false;
    }

    if (!$("#AnotherCollege").is(":checked") && !$("#Student").is(":checked")) {
      notify(
        "error",
        "You must indicate where we should send this transcript.",
      );
      return false;
    }

    // if ($("#HoldForGrades").is(":checked") && !$("#SemesterYear").val()) {
    //   notify('error','Semester is required.');
    //   $("#SemesterYear").focus();
    //   return false;
    // }

    if ($("#AnotherCollege").is(":checked") && !$("#sendToAddress").val()) {
      notify(
        "error",
        "The address for the College, Company or Agency where you would like us to send this transcript is required.",
      );
      return false;
    }

    // if (!$("#CheckForMTA").is(":checked") && !$("#HoldForGrades").is(":checked") && !$("#HoldForDegree").is(":checked")) {
    //   notify("error", "Other Instruction selection is required.");
    //   return false;
    // }

    if (!$("#USPS").is(":checked") && !$("#ExpeditedUSPS").is(":checked")) {
      notify("error", "Delivery method is required.");
      return false;
    }
  };

  vm.onApprove = function onApprove(form) {
    //  This method is called when the Approve button is clicked and before calling beforeRequired.
    // if (pkg.isAtStep('BOTranscripts')){
    //     // var studentID = document.getElementById('studentID').value;
    //     var studentFirstName = document.getElementById('studentFirstName').value;
    //     // if ((!$("#noStudentFound1").is(":checked")) && (studentID === "")) {
    //     //   notify("error", "Was this student searched for and located in the database?");
    //     //   return false;
    //     // }
    //     // if ((studentID !== "") && (studentFirstName === "")) {
    //     //   notify("error", "A valid student ID must be entered to proceed.");
    //     //   return false;
    //     // }
    // }
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

  return vm;
});
