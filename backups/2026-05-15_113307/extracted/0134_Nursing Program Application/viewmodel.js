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

  $("head").append('<link rel="stylesheet" href="softdocs.css">');
  $(".testingCenter,.studentSignature, .nursingSection").addClass("hidden");
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

  function pointsReadingHesi(option) {
    let point = 0;

    if (option == "93-100") {
      return (point = 15);
    } else if (option == "85-92") {
      return (point = 10);
    } else if (option == "75-84") {
      return (point = 5);
    } else {
      notify("error", "Please select an option.");
    }
  }

  function pointsMathHesi(option) {
    let point = 0;
    if (option == "93-100") {
      return (point = 15);
    } else if (option == "89-92") {
      return (point = 10);
    } else if (option == "75-88") {
      return (point = 5);
    } else {
      notify("error", "Please select an option.");
    }
  }
  function pointsFromGrade(grade) {
    let points = 0;
    if (grade == "A") {
      return (points = 7);
    } else if (grade == "A-") {
      return (points = 6);
    } else if (grade == "B+") {
      return (points = 5);
    } else if (grade == "B") {
      return (points = 4);
    } else if (grade == "B-") {
      return (points = 3);
    }

    return (points = 0);
  }

  $(".developer").hide();
  vm.onLoad = function onLoad(source, inputValues) {
    //  This takes place after applyBindings has been called and has added input observables to the
    //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
    //  populating dropdowns, select options and other operations that need to take place every
    //  time the form is loaded.

    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.

    const hesiMathInfo = `<table class="hesiTable">
            <tr>
                <th>HESI Math Score</th>
                <th>Points</th>
            </tr>
            <tr>
                <td>93-100</td>
                <td>15</td>
            </tr>
            <tr>
                <td>89-92</td>
                <td>10</td>
            </tr>
            <tr>
                <td>75-88</td>
                <td>5</td>
            </tr>
        <table>`;
    $(".hesiMathTable").html(hesiMathInfo);

    const hesiReadingInfo = `
        <table class="hesiTable">
            <tr>
                <th>HESI Reading Comprehension Score</th>
                <th>Points</th>
            </tr>
            <tr>
                <td>93-100</td>
                <td>15</td>
            </tr>
            <tr>
                <td>85-92</td>
                <td>10</td>
            </tr>
            <tr>
                <td>75-84</td>
                <td>5</td>
            </tr>
        <table>`;

    $(".hesiReadingTable").html(hesiReadingInfo);

    const gradeMetricsTable = `
        <table class="hesiTable">
            <tr>
                <th>Grade Received</th>
                <th>Points</th>
            </tr>
            <tr>
                <td>A</td>
                <td>7</td>
            </tr>
            <tr>
                <td>A-</td>
                <td>6</td>
            </tr>
            <tr>
                <td>B+</td>
                <td>5</td>
            </tr>
             <tr>
                <td>B</td>
                <td>4</td>
            </tr>
            <tr>
                <td>B-</td>
                <td>3</td>
            </tr>
        <table>`;
    $(".gradesTable").html(gradeMetricsTable);

    //pointsExperienceTable
    const experienceTable = `
            <table class="hesiTable">
                <tr>
                    <th>Experience</th>
                    <th>Points</th>
                </tr>
                <tr>
                    <td>Healthcare Experience</td>
                    <td>20</td>
                </tr>
                <tr>
                    <td>Leadership Role</td>
                    <td>15</td>
                </tr>
                <tr>
                    <td>Bachelor's Degree</td>
                    <td>15</td>
                </tr>
                <tr>
                    <td>Community Service</td>
                    <td>10</td>
                </tr>
                <tr>
                    <td>Study Abroad or OCC Athlete</td>
                    <td>5</td>
                </tr>
                <tr>
                    <td>Healthcare Job shadowing</td>
                    <td>1</td>
                </tr>
                <tr>
                    <td>No experience</td>
                    <td>0</td>
                </tr>
            <table>`;
    $(".pointsExperienceTable").html(experienceTable);

    //essayTable
    const essayTable = `
            <table class="hesiTable">
                <tr>
                    <th>Performance</th>
                    <th>Points</th>
                </tr>
                <tr>
                    <td>Exemplary</td>
                    <td>2</td>
                </tr>
                <tr>
                    <td>Satisfactory</td>
                    <td>1</td>
                </tr>
                 <tr>
                    <td>Not addressed</td>
                    <td>0</td>
                </tr>
            <table>`;
    $(".essayTable").html(essayTable);
  };
  vm.setDefaults = function setDefaults(source, inputValues) {
    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.
    /*
            LOGIC TO POPULATE HESI POINTS
        */

    vm.scoreMathHesi.subscribe(function (dropdownOption) {
      // console.log(dropdownOption);
      let pointsMath = pointsMathHesi(dropdownOption);
      vm.pointsMathHesi(pointsMath);
    });

    vm.scoreReadingHesi.subscribe(function (dropdownOption) {
      // console.log(dropdownOption);
      let pointsReading = pointsReadingHesi(dropdownOption);
      vm.pointsReadingHesi(pointsReading);
    });

    //adding date automatically once users sign on the form
    vm.counselorSig.subscribe(function (newValue) {
      if (newValue) {
        vm.date(Extenders.utils.formatDate(new Date()));
      } else {
        vm.date("");
      }
    });
    vm.testingCenterSig.subscribe(function (newValue) {
      if (newValue) {
        vm.testingCenterDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.testingCenterDate("");
      }
    });
    // vm.studentSignature.subscribe(function(newValue) {
    //     if (newValue) {
    //         vm.studentDate(Extenders.utils.formatDate(new Date()));
    //     } else {
    //         vm.studentDate('');
    //     }
    // });

    /*
            Adding a Listener to all of the dropdowns from Grade Metrics Section - and populating the points field
        */

    $('select[id^="gradeText"]').on("change", function () {
      const id = this.id;
      const grade = $(this).val();
      const points = pointsFromGrade(grade);

      if (id.endsWith("One")) {
        vm.pointsOne(points);
      } else if (id.endsWith("Two")) {
        vm.pointsTwo(points);
      } else if (id.endsWith("Three")) {
        vm.pointsThree(points);
      } else if (id.endsWith("Four")) {
        vm.pointsFour(points);
      } else if (id.endsWith("Five")) {
        vm.pointsFive(points);
      } else if (id.endsWith("Six")) {
        vm.pointsSix(points);
      } else if (id.endsWith("Seven")) {
        vm.pointsSeven(points);
      }
    });

    let totalPointsExperience = 0;
    const pointsMap = {
      "Healthcare Experience": 20,
      "Leadership Role": 15,
      "Bachelor's Degree": 15,
      "Community Service": 10,
      "Study Abroad or OCC Athlete": 5,
      "Healthcare Job shadowing": 1,
      "No experience": 0,
    };

    //  $('input[id^="chkExp"]').on('change', function () {
    //     const chkName = $(this).next().text().trim();
    //     const points = pointsMap[chkName] || 0; // Fallback in case name is not in the map

    //     if ($(this).is(':checked')) {
    //         totalPointsExperience += points;
    //     } else {
    //         totalPointsExperience -= points;
    //     }

    //     console.log("Total Points:", totalPointsExperience);
    //     vm.totalPointsExperience(totalPointsExperience);
    //  });
    $('input[id^="chkExp"]').on("change", function () {
      let maxPoints = 0;

      $('input[id^="chkExp"]:checked').each(function () {
        const chkName = $(this).next().text().trim();
        const points = pointsMap[chkName] || 0;
        if (points > maxPoints) {
          maxPoints = points;
        }
      });

      totalPointsExperience = maxPoints;

      // console.log("Highest Points:", totalPointsExperience);
      vm.totalPointsExperience(totalPointsExperience);
    });

    $('input[id^="chkOther"]').on("change", function () {
      const checkedCount = $('input[id^="chkOther"]:checked').length;
      const isNotApplicableChk = $("#chkOtherNotApplicable").is(":checked");

      if (isNotApplicableChk) {
        vm.pointsOther(0);
        return;
      }

      if (checkedCount > 0) {
        vm.pointsOther(5);
      } else {
        vm.pointsOther(0);
      }
    });

    let totalPointsEssay = 0;

    $('input[id^="essayPoints"]').on("change", function () {
      let newVal = parseInt($(this).val(), 10) || 0;

      if (newVal < 0 || newVal > 2) {
        notify(
          "warning",
          "Points should be either 0, 1, or 2",
          "Invalid Number",
        );
        $(this).val(0);
        newVal = 0;
      }

      // Store previous value using jQuery’s .data()
      let prevVal = parseInt($(this).data("prev-val")) || 0;

      // Update total by removing previous value and adding new one
      totalPointsEssay = totalPointsEssay - prevVal + newVal;

      // Store the current value for the next change
      $(this).data("prev-val", newVal);

      // console.log("Total Essay Points:", totalPointsEssay);
      vm.totalPointsEssay(totalPointsEssay);
    });

    //Hidding and showing specific fields according to the step code
    if (pkg.isAtStep("testingCenter")) {
      $(".testingCenter").removeClass("hidden");
      requiredIndicators.setRequired("attachEssayChk", true);
      requiredIndicators.setRequired("testingCenterSig", true);
    } else if (pkg.isAtStep("Student")) {
      $(".testingCenter").removeClass("hidden");
      // $('.studentSignature').removeClass('hidden');
      // $('#studentSignature').prop('required', true);
      $(".studentShouldNotSee").hide();
    } else if (pkg.isAtStep("nursing") || pkg.isAtStep("End")) {
      $(".testingCenter").removeClass("hidden");
      // $('.studentSignature').removeClass('hidden');
      $(".nursingSection").removeClass("hidden");
      requiredIndicators.setRequired("nursingSig", true);
    }

    //Making fields readonly according to the step code
    if (!pkg.isAtStep("Start")) {
      $("#studentID, #counselorSig").prop("readonly", true);
      $("input[type=checkbox][id^='chk']").prop("disabled", true);
      $("select").prop("disabled", true);
      $("#potentialGraduationDate, #NursingInfoSession").prop("disabled", true);
    }

    if (!pkg.isAtStep("testingCenter")) {
      $("#testingCenterSig").prop("readonly", true);
      $("#attachEssayChk, #attachStudentSigChk").prop("disabled", true);
    }
    //   if(!pkg.isAtStep('Student')){
    //       $('#studentSignature').prop('readonly', true);
    //   }

    if (pkg.isAtStep("End")) {
      $(".potentialGraduationDate").show();
    }

    if (pkg.isAtStep("nursing")) {
      $('input[id^="essayPoints"]').each(function () {
        requiredIndicators.setRequired(this.id, true);
      });
    }

    if (user.isInLibrary || user.isInDrafts) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.

      if (pkg.isAtStep("Start")) {
        requiredIndicators.setRequired("chkBioCourses", true);
        requiredIndicators.setRequired("chkNURCurriculum", true);
        requiredIndicators.setRequired("chkEvidenceHighSchoolorGed", true);

        // $('.graduation').on('change',function(){
        //     var isGrad =   $('.graduation').is(':checked');
        //     if(isGrad){
        //         $('.potentialGraduationDate').show();
        //         $('#potentialGraduationDate').prop('required', true);
        //     } else{
        //         $('.potentialGraduationDate').hide();
        //     }
        // });
      }

      vm.formID(generateFormID());
      vm.academicYear(getAcademicYear());

      vm.studentID.subscribe(function (id) {
        integration
          .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
            personID: id,
          })
          .then(function (personResults) {
            if (personResults) {
              // console.log('Person Results', personResults);

              let addressGUIDForm = personResults.addresses[0].address.id;
              // console.log('Address GUID', addressGUIDForm);

              vm.studentName(
                personResults.names[0].firstName +
                  " " +
                  personResults.names[0].lastName,
              );
              vm.studentEmail(personResults.emails[0].address);
              vm.studentPhone(personResults.phones[0].number);

              var formattedDate = transformDateValue(personResults.dateOfBirth);
              vm.studentDOB(formattedDate);

              integration
                .first("Web_Ethos_Get_Address_By_Address_GUId", {
                  addressGUID: addressGUIDForm,
                })
                .then(function (addressData) {
                  // console.log('Address From Ethos', addressData);

                  vm.studentAddress(addressData.addressLines[0]);
                  vm.studentCity(addressData.place.country.locality);
                  vm.studentState(addressData.place.country.region.title);
                  vm.studentZipCode(addressData.place.country.postalCode);
                });
            }
          });
      });
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
    if (!validateChkOtherBeforeApprove()) {
      throw new Error(
        "Please select at least one option under 'Other' before approving.",
      ); // cancel approval if not valid
    }

    if (!validateChkExperienceBeforeApprove()) {
      throw new Error(
        "Please select at least one option under 'Experience' before approving",
      ); // cancel approval if not valid
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
    requiredIndicators.clearNativeRequired();
    //Collecting number of attachments from start step just so we can ensure that testingCenter has attached something
    if (pkg.isAtStep("Start")) {
      const inititalNumberAttachments = form.attachmentCount;
      // console.log("Initial Number of Attachments: ", inititalNumberAttachments);

      vm.initialNumAttachments(inititalNumberAttachments);
    }

    if (pkg.isAtStep("testingCenter")) {
      const prevCountAttachments = Number(vm.initialNumAttachments() || 0);
      const currentCountAttachments = form.attachmentCount;

      // console.log("Number Attachments from START: ", prevCountAttachments);
      // console.log("CURRENT NUMBER attachments (including from start): ", currentCountAttachments);

      /*
                    IF Current Number <= Previous Count, that means that they have not added any attachments to the form, and, therefore, the system must prevent them
                    from approving the form to the following step
                */
      if (
        currentCountAttachments <= prevCountAttachments ||
        currentCountAttachments < 2
      ) {
        notify(
          "error",
          "You must attach the student's essay and the signed paper..",
        );
        return false;
      } else {
        return true;
      }

      // if(form.attachmentCount < 1){
      //   notify('error',"You must attach the student's essay.");
      //   return false
      // }else{
      //   return true
      // }
    }
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  //Helper functions

  // ============================= TRANSFORM DATE FORMAT TO MM/DD/YYYY =============================================
  function transformDateValue(dateString) {
    if (!dateString) return "00/00/0000";

    var match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return "00/00/0000";
    }

    var year = match[1],
      month = match[2],
      day = match[3];

    return month + "/" + day + "/" + year;
  }

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

  // ============================= VALIDATE CHECKBOXES UNDER "OTHER" SECTION =============================================
  function validateChkOtherBeforeApprove() {
    const atLeastOneChecked =
      $("input[type=checkbox][id^='chkOther']:checked").length > 0;

    if (!atLeastOneChecked) {
      alert(
        "Please select at least one option under 'Other' before approving.",
      );
      return false; // prevent approval logic
    }

    return true; // proceed with approval
  }
  // ============================= END VALIDATE CHECKBOXES UNDER "OTHER" SECTION =============================================

  // ============================= VALIDATE CHECKBOXES UNDER "EXPERIENCE" SECTION =============================================
  function validateChkExperienceBeforeApprove() {
    const atLeastOneChecked =
      $("input[type=checkbox][id^='chkExp']:checked").length > 0;

    if (!atLeastOneChecked) {
      alert(
        "Please select at least one option under 'Experience' before approving.",
      );
      $("input[type=checkbox][id^='chkExp']").addClass("highlight-error");
      return false;
    }

    $("input[type=checkbox][id^='chkExp']").removeClass("highlight-error");
    return true;
  }
  // ============================= END VALIDATE CHECKBOXES UNDER "EXPERIENCE" SECTION =============================================

  return vm;
});
