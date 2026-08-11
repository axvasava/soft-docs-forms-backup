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

  $(".maskphone").mask("(999)999-9999? ext:9999");
  $(".maskzip").mask("99999?-9999");
  $(".maskssn").mask("999-99-9999");
  $(".maskid").mask("9999999");
  /*End masking functions*/

  function payeeReadOnlyFields() {
    $("#originatorDisplayName").prop("disabled", true);
    $("#originatorErpId").prop("disabled", true);
    $("#originatorEmail").prop("disabled", true);

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
    //used for email template for both check stop pay forms
    vm.displayName(vm.originatorDisplayName());

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
        if (newValue == "Payroll (Payroll)") vm.checkType("payroll");
        if (newValue == "Student Refund (AR)") vm.checkType("ar");
        if (newValue == "Vendor/Employee Reimbursement (AP)")
          vm.checkType("ap");
      }
    });

    if (pkg.isAtStep("Start")) {
      $(".voucherInfo").hide();
      $(".bankService").hide();
      $(".apManager").hide();
      $(".checkReissue").hide();
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
      $(".checkReissue").hide();
    }

    if (pkg.isAtStep("BankingService")) {
      payeeReadOnlyFields();
      voucherInfoReadOnlyFields();

      //WF-FS Check Stop (AP/AR/Payroll)
      $(".voucherInfo").show();

      //WF-FS Banking Service
      $(".bankService").show();
      $("#bankServSign").prop("disabled", false);
      $(".checkReissue").hide();

      $(".apManager").hide();
    }

    //Only routes here if checkType = Payroll
    if (pkg.isAtStep("CheckStopPayrollChkReissue")) {
      payeeReadOnlyFields();
      voucherInfoReadOnlyFields();

      //WF-FS Check Stop (AP/AR/Payroll)
      $(".voucherInfo").show();

      //WF-FS Banking Service
      $(".bankService").show();
      $("#bankServSign").prop("disabled", true);
      $("#hasBankConfirmed").attr("disabled", "disabled");

      $(".checkReissue").show();
      $("#checkReissue").attr("disabled", false);
      $("#reason").prop("disabled", false);

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

      $(".checkReissue").show();
      $("#checkReissue").attr("disabled", "disabled");
      $("#reason").prop("disabled", true);

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

    //CheckStopPayrollChkReissue
    if (pkg.isAtStep("CheckStopPayrollChkReissue")) {
      requiredIndicators.setRequired("checkReissue", true);
      let option = $("#checkReissue option:selected").text();
      if (option.trim() == "No" && $("#reason").val() == "") {
        notify(
          "error",
          "Reason is required when selecting check has not been re-issued",
        );
        return false;
      }
    }

    if (pkg.isAtStep("APManager")) {
      requiredIndicators.setRequired("FSNotes", true);

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
      requiredIndicators.setRequired("bankServSign", false);
    }

    if (pkg.isAtStep("APManager")) {
      requiredIndicators.setRequired("FSNotes", false);
    }
  };

  vm.beforeRequired = function beforeRequired(form) {
    // Enable native DOM `required` attributes at validation time.
    // This prevents fields from appearing invalid on initial load,
    // while still allowing browser validation during submit.
    requiredIndicators.applyNativeRequiredForValidation();
  };

  vm.afterRequired = function afterRequired(form) {
    requiredIndicators.clearNativeRequired();
  };

  vm.onOptOut = function onOptOut(form) {};

  vm.onESignSubmit = function onESignSubmit(form) {};

  return vm;
});
