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
  $(".maskphone").mask("999-999-9999");
  $(".maskzip").mask("99999?-9999");
  $(".maskssn").mask("999-99-9999");
  $(".maskid").mask("9999999");

  /*End masking functions*/

  $("#vendorSearchButton").on("click", () => {
    if (vm.vendorSearch() && vm.vendorSearch() !== "") {
      vm.vendorPayeeName(undefined);
      let promiseArrays = [];

      promiseArrays.push(
        integration.first("Web_Ethos_Get_Organizations_by_ColleagueID", {
          ColleagueID: vm.vendorSearch(),
        }),
      );

      promiseArrays.push(
        integration.first(
          "Web_Ethos_Get_Educational_Institutions_by_ColleagueID",
          {
            ColleagueID: vm.vendorSearch(),
          },
        ),
      );

      promiseArrays.push(
        integration.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
          personID: vm.vendorSearch(),
        }),
      );

      Promise.all(promiseArrays).then(function (allMyPromisesReturned) {
        if (allMyPromisesReturned[0]) {
          notify("success", "Organization Found");
          var data = allMyPromisesReturned[0];
          vm.vendorPayeeName(data.title);
        } else if (allMyPromisesReturned[1]) {
          notify("success", "Institution Found");
          var payeeData = allMyPromisesReturned[1];
          vm.vendorPayeeName(allMyPromisesReturned[1].title);
        } else if (allMyPromisesReturned[2]) {
          notify("success", "Person Found");
          var personData = allMyPromisesReturned[2];
          vm.vendorPayeeName(getPreferredName(personData.names));
        } else {
          notify("error", "Colleague ID not found.");
        }
      });
    } else {
      vm.vendorPayeeName(undefined);
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

  function payeeReadOnlyFields() {
    $("#displayName").prop("disabled", true);
    $("#vendorStudentID").prop("disabled", true);
    $("#emailAddress").prop("disabled", true);
    $("#personalPhone").prop("disabled", true);

    $("#reasonForStop").attr("disabled", "disabled");
    $("#ddCheckType").attr("disabled", "disabled");
    $("#returnDetails").prop("disabled", true);
    $("#nameOnCheck").prop("disabled", true);
    $("#chkAcknowledge").prop("disabled", true);
  }

  function voucherInfoReadOnlyFields() {
    $("#voucherNumber").prop("disabled", true);
    $("#voucherDate").prop("disabled", true);
    $("#checkAmount").prop("disabled", true);
    $("#checkNumber").prop("disabled", true);
    $("#checkDate").prop("disabled", true);
  }

  vm.onLoad = function onLoad(source, inputValues) {
    $(".developer").hide();
  };

  vm.setDefaults = function setDefaults(source, inputValues) {
    vm.bankServSign.subscribe((newValue) => {
      if (newValue) {
        vm.bankServSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.bankServSignDate("");
      }
    });

    //Payroll (Payroll)     Student Refund (AR)    Vendor/Employee Reimbursement (AP)
    vm.ddCheckType.subscribe((newValue) => {
      if (newValue) {
        if (newValue == "Student Refund (AR)") vm.checkType("ar");
        if (newValue == "Vendor/Employee Reimbursement (AP)")
          vm.checkType("ap");
      }
    });

    if (pkg.isAtStep("Start")) {
      $(".voucherInfo").hide();
      $(".bankService").hide();
      $(".apManager").hide();
    }

    if (
      pkg.isAtStep("CheckStopPayroll") ||
      pkg.isAtStep("CheckStopAP") ||
      pkg.isAtStep("CheckStopAR")
    ) {
      payeeReadOnlyFields();
      $(".voucherInfo").show();

      $(".bankService").hide();
      $(".apManager").hide();
    }

    if (pkg.isAtStep("BankingService")) {
      payeeReadOnlyFields();
      voucherInfoReadOnlyFields();

      //WF-FS Check Stop (AP/AR/Payroll)
      $(".voucherInfo").show();

      //WF-FS Banking Service
      $(".bankService").show();
      $("#bankServSign").prop("disabled", false);

      $(".apManager").hide();
    }

    if (pkg.isAtStep("APManager")) {
      payeeReadOnlyFields();
      voucherInfoReadOnlyFields();

      //WF-FS Check Stop (AP/AR/Payroll)
      $(".voucherInfo").show();

      //WF-FS Banking Service
      $(".bankService").show();
      $("#bankServSign").prop("disabled", true);
      $("#hasBankConfirmed").prop("disabled", true);

      //WF-FS AP Manager
      $(".apManager").show();
    }

    if (user.isInLibrary) {
    } else {
    }
  };

  vm.afterLoad = function afterLoad() {
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

  vm.onSubmit = function onSubmit(form) {};

  vm.onApprove = function onApprove(form) {
    if (pkg.isAtStep("CheckStopAP") || pkg.isAtStep("CheckStopAR")) {
      requiredIndicators.setRequired("voucherNumber", true);
      requiredIndicators.setRequired("voucherDate", true);
      requiredIndicators.setRequired("checkAmount", true);
      requiredIndicators.setRequired("checkNumber", true);
      requiredIndicators.setRequired("checkDate", true);
      requiredIndicators.setRequired("checkStopSign", true);
    }

    if (pkg.isAtStep("CheckStopPayroll")) {
      requiredIndicators.setRequired("checkAmount", true);
      requiredIndicators.setRequired("checkNumber", true);
      requiredIndicators.setRequired("checkDate", true);
      requiredIndicators.setRequired("checkStopSign", true);
    }

    if (pkg.isAtStep("BankingService")) {
      requiredIndicators.setRequired("bankServSign", true);
    }

    if (pkg.isAtStep("APManager")) {
      requiredIndicators.setRequired("fieldId", true);
      requiredIndicators.setRequired("fieldId", true);
    }
  };

  vm.onDecline = function onDecline(form) {
    if (
      pkg.isAtStep("CheckStopPayroll") ||
      pkg.isAtStep("CheckStopAP") ||
      pkg.isAtStep("CheckStopAR")
    ) {
      requiredIndicators.setRequired("voucherNumber", false);
      requiredIndicators.setRequired("voucherDate", false);
      requiredIndicators.setRequired("checkAmount", false);
      requiredIndicators.setRequired("checkNumber", false);
      requiredIndicators.setRequired("checkDate", false);
      requiredIndicators.setRequired("checkStopSign", false);
    }

    if (pkg.isAtStep("BankingService")) {
      //WF-FS Banking Service
      requiredIndicators.setRequired("bankServSign", false);
    }

    if (pkg.isAtStep("APManager")) {
      //WF-FS AP Manager
      requiredIndicators.setRequired("FSNotes", false);
      if (
        !$("#voidedCheckOnly").is(":checked") &&
        !$("#voidedCheckAndVoucher").is(":checked")
      ) {
        notify(
          "error",
          "You must make a selection between check only or check and voucher",
        );
        return false;
      }
    }
  };

  vm.beforeRequired = function beforeRequired(form) {
    // Enable native DOM `required` attributes at validation time.
    // This prevents fields from appearing invalid on initial load,
    // while still allowing browser validation during submit.
    requiredIndicators.applyNativeRequiredForValidation();
  };

  vm.afterRequired = function afterRequired(form) {
    // Remove temporary native browser `required` attributes after validation.
    // Required state is still tracked by the required indicators utility
    // through VM state, aria-required, and the visual required marker (*).
    requiredIndicators.clearNativeRequired();
  };

  vm.onOptOut = function onOptOut(form) {};

  vm.onESignSubmit = function onESignSubmit(form) {};

  return vm;
});
