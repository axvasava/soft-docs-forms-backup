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

  vm.addObservableArray("personsPositionsList");
  vm.addObservableArray("standardMileageData");
  vm.standardMileageData([]);
  vm.addObservableArray("mileageRatesWithStartDate");
  vm.mileageRatesWithStartDate([]);
  vm.addObservable("allAccounts");
  // vm.allAccounts('');
  vm.addObservable("allAccountsNonMileage");
  vm.allAccountsNonMileage("");

  let over50Miles = 0;

  //================= HIDE FORM SECTIONS ==========================
  $(".developer").hide();
  $(".onBehalf").hide();
  $(".yourself").hide();
  $(".other").hide();
  $(".supervisor").hide();
  $(".financialServices").hide();
  $(".declineHide").hide();
  $(".attachments").hide();
  $(".overFiftyAttachments").hide();
  $(".nonMileageAttachments").hide();
  $(".mileageExp").hide();
  $(".nonMileageExp").hide();

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

    integration.all("MileageRates", {}).then((mileageRates) => {
      // mileageRates.forEach((rate) => {
      //     vm.mileageRatesWithStartDate.push({
      //         StartDate: rate.StartDate,
      //         Rate: rate.Rate
      //     });
      // });
      vm.mileageRatesWithStartDate(mileageRates);
      console.log("Mileage By Start Date: ");
    });

    vm.employeeSearch.subscribe((newValue) => {
      vm.employeeID("");
      if (newValue) {
        if (newValue.length < 7) {
          vm.employeeSearch(newValue.padStart(7, "0"));
          vm.employeeID(newValue.padStart(7, "0"));
        } else vm.employeeID(newValue);
      } else {
        vm.employeeID("");
      }
    });

    //========================= SHOW AND HIDE AT STEPS ================================

    if (user.isInLibrary) {
      $(".self").hide();
    }

    if (
      pkg.isAtStep("ConditionalEmployee") ||
      pkg.isAtStep("ConditionalSupervisor") ||
      pkg.isAtStep("WFFinancialServices") ||
      pkg.isAtStep("End")
    ) {
      $(".self").show();
    }

    if (
      pkg.isAtStep("ConditionalSupervisor") ||
      pkg.isAtStep("WFFinancialServices") ||
      pkg.isAtStep("End")
    ) {
      $(".supervisor").show();
    }

    if (pkg.isAtStep("WFFinancialServices") || pkg.isAtStep("End")) {
      $(".financialServices").show();
    }

    //======================= END SHOW AND HIDE AT STEPS ==============================

    integration.all("StandardMileage", {}).then((standardMileage) => {
      vm.standardMileageData.push(standardMileage);
      console.log("Standard Mileage Table: ");
    });

    vm.selfOrElse.subscribe((newValue) => {
      vm.employeeSearch("");
      vm.employeeName("");
      vm.employeeID("");
      vm.campus("");
      vm.department("");
      if (newValue) {
        if (newValue == "Yes") {
          $(".onBehalf").show();
          $(".other").show();
          $(".yourself").hide();
          $(".self").hide();
        } else if (newValue == "No") {
          $(".onBehalf").hide();
          $(".other").hide();
          $(".yourself").show();
          $(".self").show();
          //vm.employeeName(user.DisplayName);
          vm.employeeID(user.ErpId);
        }
      } else {
        $(".onBehalf").hide();
        $(".yourself").hide();
        $(".other").hide();
        $(".self").hide();
      }
    });

    vm.employeeID.subscribe((newValue) => {
      if (newValue) {
        runEmployeeEthosCall(newValue);
      } else {
        vm.employeeName("");
        vm.campus("");
        vm.department("");
      }
    });

    //IF USER OPENS UP THE FORM IN DRAFTS, WILL STILL BE ABLE TO CLICK ON JOB TITLE AND POPULATE INFO
    if (user.isInDrafts && vm.selfOrElse() == "No") {
      runEmployeeEthosCall(vm.employeeID());
    }

    if (!pkg.isAtStep("Start")) {
      autoCompleteUtils.makeReadOnly("jobTitle");
    }

    vm.supervisorGUID.subscribe(function (NewValue) {
      if (NewValue != "No Supervisor GUID") {
        integration
          .all("Web_Ethos_Get_Person_by_GUID", {
            personGUID: vm.supervisorGUID(),
          })
          .then(function (supervisorData) {
            vm.supervisorSelect(getPreferredName(supervisorData.names));
            vm.supervisorEmail(getPrimaryEmail(supervisorData.emails));
          });
      } else {
        vm.supervisorSelect("No Supervisor Found");
        vm.supervisorEmail("No Supervisor Found");
      }
    });

    // vm.sameAccount.subscribe((newValue) => {
    //     vm.mileageExpenseRow.forEach((rowData) => {
    //         rowData.mileageGLNum('');
    //         rowData.mileageGLNumDesc('');
    //         vm.allAccounts('')
    //     })
    //     if (newValue == 'No') {
    //         vm.sameAccountGL('');
    //         vm.sameAccountGLDesc('');
    //         vm.mileageExpenseRow.forEach((rowData) => {
    //             rowData.mileageGLNum.readOnly = false;
    //             rowData.mileageGLNum('');
    //             rowData.mileageGLNumDesc('');
    //         });
    //     } else {
    //         vm.mileageExpenseRow.forEach((rowData) => {
    //             // rowData.addAccountNumber1(false);
    //             // rowData.addAccountNumber2(false);
    //         });
    //         vm.sameAccountGL('');
    //         vm.sameAccountGLDesc('');
    //     }
    // });

    //  IF filling for MILEAGE -> Will all entries below be under the same GL Account Number? -> DROPDOWN HAS ELEMENT ID sameAccount
    vm.sameAccount.subscribe((newValue) => {
      vm.mileageExpenseRow.forEach((rowData) => {
        rowData.mileageGLNum("");
        rowData.mileageGLNumDesc("");
        vm.allAccounts("");
      });
      if (newValue == "No") {
        vm.sameAccountGL("");
        vm.sameAccountGLDesc("");
        vm.mileageExpenseRow.forEach((rowData) => {
          rowData.mileageGLNum.readOnly = false;
          rowData.mileageGLNum("");
          rowData.mileageGLNumDesc("");
        });
      } else {
        vm.mileageExpenseRow.forEach((rowData) => {
          rowData.mileageGLNum.readOnly = true;
          // rowData.addAccountNumber1(false);
          // rowData.addAccountNumber2(false);
        });
        vm.sameAccountGL("");
        vm.sameAccountGLDesc("");
      }
    });

    vm.sameAccountGL.subscribe((newValue) => {
      if (newValue) {
        integration
          .all("Web_Ethos_Validate_Accounting_Strings_by_GLAccountNumber", {
            GLAccountNumber: newValue,
          })
          .then(function (validateAcctString) {
            vm.sameAccountGLDesc(validateAcctString["description"]);
            //vm.sameAccountGL().readOnly = true;
            notify("success", "Account number valid");
            vm.allAccounts(newValue);
          })
          .catch(function (error) {
            //console.error('An error occurred:', error.message);
            //vm.sameAccountGL(undefined);
            vm.sameAccountGLDesc(undefined);
            notify("error", "Account number not valid");
            vm.allAccounts("");
            vm.mileageExpenseRow.forEach((rowData) => {
              rowData.mileageGLNum("");
              rowData.mileageGLNumDesc("");
            });
          });
      } else {
        vm.mileageExpenseRow.forEach((rowData) => {
          rowData.mileageGLNum("");
          rowData.mileageGLNumDesc("");
          vm.allAccounts("");
        });
      }
    });

    //if user is in drafts and has a sameAccountGL -> we want to repeat the behavior above
    // ko.computed(function(){
    //     if(user.isInDrafts && vm.sameAccountGL()){
    //         integration.all('Web_Ethos_Validate_Accounting_Strings_by_GLAccountNumber',{
    //             GLAccountNumber: vm.sameAccountGL()
    //         }).then(function (validateAcctString) {
    //             console.log('validateAcctString',validateAcctString);
    //             vm.sameAccountGLDesc(validateAcctString['description']);
    //             //vm.sameAccountGL().readOnly = true;
    //             notify('success','Account number valid');
    //             vm.allAccounts(vm.sameAccountGL());
    //         }).catch(function (error) {
    //             //console.error('An error occurred:', error.message);
    //             //vm.sameAccountGL(undefined);
    //             vm.sameAccountGLDesc(undefined);
    //             notify('error','Account number not valid');
    //             vm.allAccounts('');
    //             vm.mileageExpenseRow.forEach((rowData) => {
    //                 rowData.mileageGLNum('');
    //                 rowData.mileageGLNumDesc('');
    //             });
    //         });
    //     } else {
    //         vm.mileageExpenseRow.forEach((rowData) => {
    //             rowData.mileageGLNum('');
    //             rowData.mileageGLNumDesc('');
    //             vm.allAccounts('');
    //         });
    //     }
    // });

    vm.sameAccountNonMileage.subscribe((newValue) => {
      vm.sameAccountNonMileageGLDesc("");
      vm.nonMileageExpenseRow.forEach((rowData) => {
        rowData.totalExpense("");
        rowData.nonMileageGLNum("");
        rowData.nonMileageGLNumDesc("");
        rowData.nonMileageGLNum2("");
        rowData.nonMileageGLNumDesc2("");
        rowData.nonMileageGLNum3("");
        rowData.nonMileageGLNumDesc3("");
        vm.allAccountsNonMileage("");
      });
      if (newValue == "No") {
        vm.sameAccountNonMileageGL("");
        vm.nonMileageExpenseRow.forEach((rowData) => {
          rowData.nonMileageGLNum.readOnly = false;
          rowData.nonMileageGLNum("");
          rowData.nonMileageGLNumDesc("");
        });
      } else {
        vm.nonMileageExpenseRow.forEach((rowData) => {
          rowData.nonMileageGLNum.readOnly = true;
          rowData.nonMileageAmount("");
          rowData.addNonMileageAcctNumber1(false);
          rowData.addNonMileageAccountNumber2(false);
        });
        vm.sameAccountNonMileageGL("");
        vm.sameAccountNonMileageGLDesc("");
      }
    });

    vm.sameAccountNonMileageGL.subscribe((newValue) => {
      vm.sameAccountNonMileageGLDesc(undefined);
      vm.sameAccountNonMileageGLProjNum(undefined);
      vm.nonMileageExpenseRow.forEach((rowData) => {
        rowData.nonMileageGLNum("");
        rowData.nonMileageGLNumDesc("");
        rowData.nonMileageGLNum2("");
        rowData.nonMileageGLNumDesc2("");
        rowData.nonMileageGLNum3("");
        rowData.nonMileageGLNumDesc3("");
        vm.allAccountsNonMileage("");
      });
      if (newValue) {
        vm.nonMileageExpenseRow.forEach((rowData) => {
          rowData.nonMileageGLNum("");
          rowData.nonMileageGLNumDesc("");
          rowData.nonMileageGLNum2("");
          rowData.nonMileageGLNumDesc2("");
          rowData.nonMileageGLNum3("");
          rowData.nonMileageGLNumDesc3("");
          vm.allAccountsNonMileage("");
        });
        integration
          .all("Web_Ethos_Validate_Accounting_Strings_by_GLAccountNumber", {
            GLAccountNumber: newValue,
          })
          .then(function (validateAcctString) {
            vm.sameAccountNonMileageGLDesc(validateAcctString["description"]);
            //vm.sameAccountGL().readOnly = true;
            notify("success", "Account number valid");
            vm.allAccountsNonMileage(newValue);
          })
          .catch(function (error) {
            //console.error('An error occurred:', error.message);
            //vm.sameAccountGL(undefined);
            vm.sameAccountNonMileageGLDesc(undefined);
            notify("error", "Account number not valid");
            vm.allAccountsNonMileage("");
            vm.nonMileageExpenseRow.forEach((rowData) => {
              rowData.nonMileageGLNum("");
              rowData.nonMileageGLNumDesc("");
            });
          });
      } else {
        vm.sameAccountNonMileageGLDesc(undefined);
        vm.sameAccountNonMileageGLProjNum(undefined);
        vm.nonMileageExpenseRow.forEach((rowData) => {
          rowData.nonMileageGLNum("");
          rowData.nonMileageGLNumDesc("");
          rowData.nonMileageGLNum2("");
          rowData.nonMileageGLNumDesc2("");
          rowData.nonMileageGLNum3("");
          rowData.nonMileageGLNumDesc3("");
          vm.allAccountsNonMileage("");
        });
      }
    });

    //========================== SUBSCRIBES FOR SIGNATURE/DATE SECTIONS =======================================
    vm.employeeSign.subscribe((newValue) => {
      if (newValue) {
        vm.employeeSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.employeeSignDate("");
      }
    });

    vm.supervisorSign.subscribe((newValue) => {
      if (newValue) {
        vm.supervisorSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.supervisorSignDate("");
      }
    });

    // vm.fsSign.subscribe((newValue) => {
    //     if (newValue) {
    //       vm.fsSignDate(Extenders.utils.formatDate(new Date()));
    //     } else {
    //         vm.fsSignDate('');
    //     }
    // });

    //======================== END SUBSCRIBES FOR SIGNATURE/DATE SECTIONS =====================================

    //======================== CALL MODAL IF FORM IS RETURNED TO EMPLOYEE =====================================

    // if (pkg.isAtStep("EmployeeDecline")) {
    //   showModal();
    // }

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.

      //========= CREATE AND SET OBSERVABLE TO FALSE - LATER USED TO CHECK IF ANY GL NUMBER STARTS WITH '14' ============
      vm.has14GL("No");
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

    //Hydrating allAccounts when user is in drafts
    if (user.isInDrafts && vm.sameAccount() === "Yes" && vm.sameAccountGL()) {
      vm.allAccounts(vm.sameAccountGL());
    }

    ko.computed(() => {
      let mileageTotal = 0;
      let nonMileageTotal = 0;

      vm.mileageExpenseRow.forEach((row) => {
        if (row.mileageAmount()) {
          const formatted = formatAsDollar(row.mileageAmount());
          // const rawNumber = parseInt(formatted.replace(',', ''))
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          mileageTotal += rawNumber;
          row.mileageAmount(formatted);
        }
      });

      const formattedMilesTotal = formatAsDollar(mileageTotal);
      vm.mileageTotal(formattedMilesTotal);
      vm.mileageGrandTotal(formattedMilesTotal);

      vm.nonMileageExpenseRow.forEach((row) => {
        if (row.nonMileageAmount()) {
          const formatted = formatAsDollar(row.nonMileageAmount());
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          nonMileageTotal += rawNumber;
          row.nonMileageAmount(formatted);
        }

        if (row.nonMileageAmount2()) {
          const formatted = formatAsDollar(row.nonMileageAmount2());
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          nonMileageTotal += rawNumber;
          row.nonMileageAmount2(formatted);
        }

        if (row.nonMileageAmount3()) {
          const formatted = formatAsDollar(row.nonMileageAmount3());
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          nonMileageTotal += rawNumber;
          row.nonMileageAmount3(formatted);
        }

        if (row.totalExpense()) {
          const formatted = formatAsDollar(row.totalExpense());
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          nonMileageTotal += rawNumber;
          row.totalExpense(formatted);
        }

        const formattedSum = formatAsDollar(nonMileageTotal);
        row.sumOfNonMileageAccounts(formattedSum);
      });

      const formattedNonMilesTotal = formatAsDollar(nonMileageTotal);
      vm.nonMileageTotal(formattedNonMilesTotal);
      vm.nonMileageGrandTotal(formattedNonMilesTotal);

      if (mileageTotal > 0 || nonMileageTotal > 0) {
        let grandTotal = 0;
        if (mileageTotal > 0 && nonMileageTotal > 0)
          grandTotal = parseFloat(mileageTotal) + parseFloat(nonMileageTotal);
        if (mileageTotal > 0 && nonMileageTotal <= 0)
          grandTotal = parseFloat(mileageTotal);
        if (mileageTotal <= 0 && nonMileageTotal > 0)
          grandTotal = parseFloat(nonMileageTotal);
        vm.grandTotal(formatAsDollar(grandTotal));
      }
    });

    ko.computed(() => {
      // if (user.isInLibrary) {
      if (
        (user.isInLibrary || user.isInDrafts) &&
        vm.mileageRatesWithStartDate().length > 0
      ) {
        vm.mileageExpenseRow.forEach((rowData) => {
          let from = rowData.mileageFrom();
          let to = rowData.mileageTo();
          let mileageDate = rowData.mileageDate();
          let roundTrip = rowData.mileageRoundTrip();
          let roundTripManual = rowData.roundTripManual();
          let enterMiles = parseFloat(rowData.enterMiles());

          if (from && to && mileageDate) {
            let mileageDateObj = new Date(mileageDate); // mm/dd/yyyy

            let applicableRates = vm
              .mileageRatesWithStartDate()
              .map((rate) => ({
                ...rate,
                StartDateObj: new Date(rate.StartDate),
              }));

            let mileageRate = applicableRates.find(
              (rate) =>
                rate.StartDateObj.getFullYear() ===
                mileageDateObj.getFullYear(),
            )?.Rate;
            // .filter(rate => mileageDateObj >= rate.StartDateObj)
            // .sort((a, b) => b.StartDateObj - a.StartDateObj); // Sort descending

            if (applicableRates.length === 0) {
              notify(
                "warning",
                "No applicable mileage rate found for date: " + mileageDate,
              );
              rowData.miles("");
              rowData.mileageAmount("");
              return;
            }

            // let mileageRate = applicableRates[0].Rate;
            let mileage = getMileage(from, to, vm.standardMileageData()[0]);

            if (mileage > 0) {
              let finalMiles = roundTrip ? mileage * 2 : mileage;
              rowData.miles(mileage);
              rowData.mileageAmount(finalMiles * mileageRate);

              rowData.enterMiles("");
              rowData.roundTripManual(false);
            } else {
              if (!isNaN(enterMiles)) {
                let finalMiles = roundTripManual ? enterMiles * 2 : enterMiles;
                rowData.miles("");
                rowData.mileageAmount(finalMiles * mileageRate);
              } else {
                notify(
                  "warning",
                  "No mileage data returned. Please enter your own mileage for this row.",
                );
                rowData.miles("");
                rowData.mileageAmount("");
              }
            }
          } else {
            rowData.miles("");
            rowData.mileageAmount("");
            rowData.mileageRoundTrip(false);
            rowData.roundTripManual(false);
          }

          // GL logic
          if (vm.allAccounts()) {
            rowData.mileageGLNum.readOnly = true;
            rowData.mileageGLNum(vm.allAccounts());
            rowData.mileageGLNumDesc(vm.sameAccountGLDesc());
          } else {
            rowData.mileageGLNum.readOnly = false;
            validateAccountNumberInDynamicList(
              rowData,
              "mileageGLNum",
              "mileageGLNumDesc",
            );
          }
        });
      }
    });

    ko.computed(() => {
      vm.nonMileageExpenseRow.forEach((rowData) => {
        if (!rowData.addNonMileageAcctNumber1()) {
          rowData.nonMileageGLNum2("");
          rowData.nonMileageGLNumDesc2("");
          rowData.nonMileageProjNum2("");
          rowData.nonMileageAmount2("");
          rowData.addNonMileageAccountNumber2(false);
        }

        if (!rowData.addNonMileageAccountNumber2()) {
          rowData.nonMileageGLNum3("");
          rowData.nonMileageGLNumDesc3("");
          rowData.nonMileageProjNum3("");
          rowData.nonMileageAmount3("");
        }

        // GL logic
        if (vm.allAccountsNonMileage()) {
          rowData.nonMileageGLNum.readOnly = true;
          rowData.nonMileageGLNum(vm.allAccountsNonMileage());
          rowData.nonMileageGLNumDesc(vm.sameAccountNonMileageGLDesc());
        } else {
          rowData.nonMileageGLNum.readOnly = false;
          validateAccountNumberInDynamicList(
            rowData,
            "nonMileageGLNum",
            "nonMileageGLNumDesc",
          );
          validateAccountNumberInDynamicList(
            rowData,
            "nonMileageGLNum2",
            "nonMileageGLNumDesc2",
          );
          validateAccountNumberInDynamicList(
            rowData,
            "nonMileageGLNum3",
            "nonMileageGLNumDesc3",
          );
        }
      });
    });

    vm.sameAccount.subscribe((newValue) => {
      vm.mileageExpenseRow.forEach((rowData) => {
        rowData.mileageGLNum("");
        rowData.mileageGLNumDesc("");
        vm.allAccounts("");
      });
      if (newValue == "No") {
        vm.sameAccountGL("");
        vm.sameAccountGLDesc("");
        vm.mileageExpenseRow.forEach((rowData) => {
          rowData.mileageGLNum.readOnly = false;
          rowData.mileageGLNum("");
          rowData.mileageGLNumDesc("");
        });
      } else {
        vm.mileageExpenseRow.forEach((rowData) => {
          // rowData.addAccountNumber1(false);
          // rowData.addAccountNumber2(false);
        });
        vm.sameAccountGL("");
        vm.sameAccountGLDesc("");
      }
    });

    //============ SEE IF ANY ROW HAS A GL NUMBER THAT STARTS WITH 14 FOR FORM ROUTING ==============

    // if (user.isInLibrary) {
    if (user.isInLibrary || user.isInDrafts) {
      vm.computeHas14GL = ko.computed(function () {
        let nonMileageHas14 = vm.nonMileageExpenseRow.some(
          (row) =>
            row.nonMileageGLNum() && row.nonMileageGLNum().startsWith("14"),
        );

        let mileageHas14 = vm.mileageExpenseRow.some(
          (row) => row.mileageGLNum() && row.mileageGLNum().startsWith("14"),
        );

        if (nonMileageHas14 || mileageHas14) {
          vm.has14GL("Yes");
        } else {
          vm.has14GL("No");
        }
      });
    }
    //======== END SEE IF ANY ROW HAS A GL NUMBER THAT STARTS WITH 14 FOR FORM ROUTING ==============

    //=========== LOOK FOR ANY ROW THAT HAS A MANUAL MILEAGE ENTRY OVER 50 MILES ====================

    //     ko.computed(() => {
    //         over50Miles = 0
    //         vm.mileageExpenseRow.forEach((rowData) => {
    //             if (rowData.enterMiles() > 50) {
    //                 over50Miles ++;
    //             }
    //         });

    //         validateNonMileage()

    //         if (user.isInLibrary || user.isInDrafts && (over50Miles > 0 || hasNonMileageValues)) {
    //             $('attachments').show();

    //             if (over50Miles > 0) {
    //                 $('.overFiftyAttachments').show();
    //             } else {
    //               $('.overFiftyAttachments').hide();
    //             }

    //             if (hasNonMileageValues) {
    //                 $('.nonMileageAttachments').show();
    //             } else {
    //               $('.nonMileageAttachments').hide();
    //             }

    //         } else {
    //             $('.attachments').hide();

    //         }
    //         console.log('Over 50 Miles: ', over50Miles);
    //     });

    // function validateNonMileage() {
    //     const hasNonMileageValues = vm.nonMileageExpenseRow().some(row =>
    //         Object.keys(row).some(key => {
    //             const value = row[key];
    //             return ko.isObservable(value) && value() !== null && value() !== undefined && value() !== '';
    //         })
    //     ); // <-- This closing parenthesis was missing
    // }

    ko.computed(() => {
      if (vm.mileageQuestion()) {
        if (vm.mileageQuestion() === "Both") {
          $(".mileageExp").show();
          $(".nonMileageExp").show();
          $(".nonMileageAttachments").hide();
        } else if (vm.mileageQuestion() === "Mileage") {
          $(".mileageExp").show();
          $(".nonMileageExp").hide();
          $(".nonMileageAttachments").hide();
        } else if (vm.mileageQuestion() === "Non-mileage") {
          $(".mileageExp").hide();
          $(".nonMileageExp").show();
          $(".nonMileageAttachments").show();
        } else {
          $(".mileageExp").hide();
          $(".nonMileageExp").hide();
          $(".nonMileageAttachments").hide();
        }
      }
    });

    ko.computed(() => {
      let over50Miles = 0;
      vm.mileageExpenseRow.forEach((rowData) => {
        if (rowData.enterMiles() > 50) {
          over50Miles++;
        }
      });

      const hasNonMileageValues = validateNonMileage();

      if (user.isInLibrary || user.isInDrafts) {
        //&& (over50Miles > 0 || hasNonMileageValues)) {
        // if ((user.isInLibrary || user.isInDrafts) && (over50Miles > 0)) {
        $(".attachments").hide();

        if (over50Miles > 0) {
          $(".overFiftyAttachments").show();
        } else {
          $(".overFiftyAttachments").hide();
        }

        if (hasNonMileageValues) {
          $(".nonMileageAttachments").show();
        } else {
          $(".nonMileageAttachments").hide();
        }
      } else {
        $(".attachments").hide();
        $(".nonMileageAttachments").hide();
        $(".overFiftyAttachments").hide();
      }
    });

    function validateNonMileage() {
      return vm.nonMileageExpenseRow().some((row) => {
        return [
          "nonMileagePaymentTo",
          "nonMileagePurpose",
          "nonMileageGLNum",
        ].some((field) => {
          const value = row[field];
          return (
            ko.isObservable(value) &&
            value() !== null &&
            value() !== undefined &&
            value() !== ""
          );
        });
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
    
    if ($("#mileageQuestion").val() == "Mileage") {
       
       mileageExpenseVerify();
       
    } else if ($("#mileageQuestion").val() == "Non-mileage") {
                  
        nonMileageExpenseVerify();          
                  
    } else if ($("#mileageQuestion").val() == "Both") {
        nonMileageExpenseVerify();
        mileageExpenseVerify();
    }
  };

  
    function nonMileageExpenseVerify() {
        vm.nonMileageExpenseRow().forEach(function (dynamicListRow, index) {
    
            // Check fields one-by-one so we know which to focus
            if (!dynamicListRow.nonMileageDate()) {
                throw new Error("Please check the Non-mileage Date field, it is required.");
            }
    
            if (!dynamicListRow.nonMileageGLNum()) {
                throw new Error("Please check Non-mileage GL Account Number field, it is required.");
            }
    
            if (!dynamicListRow.nonMileagePaymentTo()) {
                throw new Error("Please check the Non-mileage Payment To field, it is required.");
            }
    
            if (!dynamicListRow.nonMileagePurpose()) {
                throw new Error("Please check the Non-mileage Business Purpose/Attendees/Other Info field, it is required.");
            }
    
            if ($("#sameAccountNonMileage").val() === "Yes") {
                if (!dynamicListRow.totalExpense()) {
                    throw new Error("Please check the Non-mileage Total Expense field, it is required.");
                }
            } else if ($("#sameAccountNonMileage").val() === "No") {
                if (!dynamicListRow.nonMileageAmount()) {
                    throw new Error("Please check the Non-mileage Amount field, it is required.");
                }
            }
    
        });
    }

 
  function mileageExpenseVerify(){
    vm.mileageExpenseRow().forEach( function(dynamicListRow, index) {

        if (!dynamicListRow.mileageDate()) {
                throw new Error("Please check the Mileage Date field, it is required.");
            }
            
            if (!dynamicListRow.mileageFrom()) {
                throw new Error("Please check the Mileage From field, it is required.");
            }
            
            if (!dynamicListRow.mileageTo()) {
                throw new Error("Please check the Mileage To field, it is required.");
            }
            
            if (!dynamicListRow.mileagePurpose()) {
                throw new Error("Please check the Mileage Business Purpose field, it is required.");
            }
            
            if (!dynamicListRow.mileageGLNum()) {
                throw new Error("Please check the Mileage GL Account Number field, it is required.");
            }
    });
  }

  vm.onApprove = function onApprove(form) {
    //  This method is called when the Approve button is clicked and before calling beforeRequired.
    // if (pkg.isAtStep('WFFinancialServices')) {
    //     vm.dateProcessed(Extenders.utils.formatDate(new Date()))
    // }
    
    if (pkg.isAtStep("ConditionalSupervisor")) {
      $('#supervisorSign').attr('required', true);
    }
    
  };

  vm.onDecline = function onDecline(form) {
    //  This method is called when the Decline button is clicked and before calling beforeRequired.
    
    if (pkg.isAtStep("ConditionalSupervisor")) {
      $('#supervisorSign').attr('required', false);
    }
    
    /* 5.12.26 ep start removed section from the builder
    $(".declineHide").show();

    if (vm.reasonForDecline()) {
      return true;
    } else {
      requiredIndicators.setRequired("reasonForDecline", true);

      throw new Error(
        "Please enter a reason for declining at the bottom of the form, then click Decline again to move the form on through the workflow.",
      );
    }
    */ //end
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

    Extenders.utils.verifyDynamicListRequired(vm, ["nonMileageExpenseRow"]);
    Extenders.utils.verifyDynamicListRequired(vm, ["mileageExpenseRow"]);
    //=========== CHECK IF THERE ARE MILES OVER 50 ========================

    // if (over50Miles > 0) {
    //     if (form.attachmentCount < 1) {
    //         throw new Error('Please attach appropriate mileage documentation before submitting.');
    //     } else {
    //         validateNonMileageExpenses();
    //     }
    // }
    // else {
    //     validateNonMileageExpenses();
    // }
    if (over50Miles > 0) {
      if (form.attachmentCount < 1)
        throw new Error(
          "Please attach appropriate mileage documenation before submitting",
        );
    }
    //========== END CHECK IF THERE ARE MILES OVER 50 ========================

    //========== END CHECK IF THERE ARE ATTACHMENTS IF NON MILEAGE ========================
    let mileageQ = vm.mileageQuestion();
    //  if (vm.nonMileageExpenseRow().length > 0 && form.attachmentCount < 1) throw new Error("Please attach appropriate non-mileage documentation before submitting")

    if (mileageQ === "Non-mileage" && form.attachmentCount < 1)
      throw new Error(
        "Please attach appropriate non-mileage documentation before submitting",
      );
    else return true;

    //========== END CHECK IF THERE ARE ATTACHMENTS IF NON MILEAGE========================

    //========= CLEAR THE DECLINE COMMENTS AFTER RETURNED TO EMPLOYEE AND EMPLOYEE APPROVES ==========
    /* 5.12.26 ep start
    if (pkg.isAtStep("EmployeeDecline")) {
      vm.reasonForDecline("");
    }*/ //end
    //====== END CLEAR THE DECLINE COMMENTS AFTER RETURNED TO EMPLOYEE AND EMPLOYEE APPROVES ==========
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  //====================== HELPER FUNCTIONS =================================

  $("#employeeSearchButton").click(function () {
    //Update time Entries
    if (vm.employeeSearch()) {
      vm.employeeID(vm.employeeSearch());
    } else {
      notify("error", "You must enter an Employee ID to search.");
      vm.employeeID("");
    }
  });

  function runEmployeeEthosCall(idSearch) {
    // GET PERSON FROM COLLEAGUE ID
    integration
      .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
        personID: idSearch,
      })
      .then(function (personResults) {
        if (personResults) {
          vm.employeeName(
            getPreferredFirstName(personResults.names) +
              " " +
              getPreferredLastName(personResults.names),
          );
          vm.employeeEmail(getPrimaryEmail(personResults.emails));

          integration
            .all("Web_Ethos_Get_active_institution_jobs_by_Person_GUID", {
              personGUID: personResults.id,
            })
            .then(function (allInstJob) {
              // GET PERSON POSITIONS
              // loop through allInstJob
              // Create an array to store promises
              const promises = [];
              vm.personsPositionsList([]); // clear out local array

              //Get all Employee positions

              allInstJob.forEach(function (job) {
                // Extract the supervisor ID

                //const supervisorID = job.supervisors[0].supervisor.id;
                let supervisorID = "No Supervisor GUID";
                if (job.supervisors) {
                  if (job.supervisors[0].supervisor.id) {
                    supervisorID = job.supervisors[0].supervisor.id;
                  }
                }

                // Push promises into the array
                const positionPromise = integration.first(
                  "Web_Ethos_Get_institution_positions_by_Position_GUID",
                  {
                    positionGUID: job.position.id,
                  },
                );

                promises.push(
                  positionPromise.then(function (personPositions) {
                    return integration
                      .first("Web_Ethos_Get_Campus_Sites_by_GUID", {
                        campusGUID: personPositions.campus.id,
                      })
                      .then(function (personPosCampus) {
                        // Return the combined data including supervisor ID
                        return {
                          job,
                          personPositions,
                          personPosCampus,
                          supervisorID,
                        };
                      });
                  }),
                );
              });

              // Wait for all promises to resolve
              Promise.all(promises)
                .then(function (results) {
                  // Handle the combined data here
                  //console.log('Person-Position-Campus promise results', results);
                  // You can access individual results like results[0].personPositions, results[0].personPosCampus, etc.
                  $(".loading").hide();
                  //console.log('results',results)
                  results.forEach(function (resultData, index) {
                    if (resultData.job.preference) {
                      vm.jobTitle(resultData.personPositions.title);
                      vm.campus(resultData.personPosCampus.title);
                    }

                    vm.personsPositionsList.push({
                      preference: resultData.job.preference || "NOT PRIMARY",
                      positionTitle: resultData.personPositions.title,
                      campusTitle: resultData.personPosCampus.title,
                      positionDepartmentGUID:
                        resultData.personPositions.departments[0].id,
                      supervisorGUID: resultData.supervisorID,
                      department: "",
                    });

                    let departmentGUID =
                      vm.personsPositionsList()[index].positionDepartmentGUID;

                    integration
                      .first("Web_Ethos_Get_Employment_Department_by_GUID", {
                        deptGUID: departmentGUID,
                      })
                      .then((deptResults) => {
                        //   vm.department(deptResults.title);
                        if (resultData.job.preference) {
                          vm.department(deptResults.title);
                        }
                        // Update the existing row, don’t push a new one
                        vm.personsPositionsList()[index].department =
                          deptResults?.title || "";

                        // Sometimes KO needs a nudge to refresh UI for plain objects
                        if (vm.personsPositionsList.valueHasMutated)
                          vm.personsPositionsList.valueHasMutated();
                      });

                    vm.personsPositionsList.sort(function (a, b) {
                      // Compare positionTitle
                      if (a.positionTitle < b.positionTitle) return -1;
                      if (a.positionTitle > b.positionTitle) return 1;

                      // If positionTitles are equal, compare positionCode
                      if (a.positionCode < b.positionCode) return -1;
                      if (a.positionCode > b.positionCode) return 1;

                      // If positionCodes are also equal, compare campusTitle
                      if (a.campusTitle < b.campusTitle) return -1;
                      if (a.campusTitle > b.campusTitle) return 1;

                      // Objects are considered equal in all criteria
                      return 0;
                    });
                  });
                })
                .catch(function (error) {
                  // Handle errors here
                  console.error("Error occurred:", error);
                });
            });
        } else {
          notify("error", "Person not found");
          vm.employeeName("");
          vm.campus("");
          vm.department("");
          $(".loading").hide();
        }
      });
  }

  //function to sort through all names and return the preferred name
  function getPreferredName(myArray) {
    // Loop through the array
    for (let i = 0; i < myArray.length; i++) {
      // Check if the current object's preference is "preferred"
      if (myArray[i].preference === "preferred") {
        // Return the fullName attribute value from the matching object
        return myArray[i].fullName;
      }
    }
    // Return null if no match is found
    return null;
  }

  //function to sort through all names and return the preferred name
  function getPreferredLastName(myArray) {
    // Loop through the array
    for (let i = 0; i < myArray.length; i++) {
      // Check if the current object's preference is "preferred"
      if (myArray[i].preference === "preferred") {
        // Return the fullName attribute value from the matching object
        return myArray[i].lastName;
      }
    }
    // Return null if no match is found
    return null;
  }

  //function to sort through all names and return the preferred name
  function getPreferredFirstName(myArray) {
    // Loop through the array
    for (let i = 0; i < myArray.length; i++) {
      // Check if the current object's preference is "preferred"
      if (myArray[i].preference === "preferred") {
        // Return the fullName attribute value from the matching object
        return myArray[i].firstName;
      }
    }
    // Return null if no match is found
    return null;
  }

  //function to sort through all names and return the pimary email address
  function getPrimaryEmail(myArray) {
    // Loop through the array
    for (let i = 0; i < myArray.length; i++) {
      // Check if the current object's preference is "preferred"
      if (myArray[i].preference === "primary") {
        // Return the fullName attribute value from the matching object
        return myArray[i].address;
      }
    }
    // Return null if no match is found
    return null;
  }

  function getMileage(fromLocation, toLocation, standardMileageData) {
    if (!fromLocation || !toLocation || fromLocation === toLocation) return 0;

    const spaceSensitiveLocations = [
      "Auburn Hills",
      "District Office",
      "Highland Lakes",
      "Orchard Ridge",
      "Royal Oak",
    ];

    const cleanIfNeeded = (location) => {
      return spaceSensitiveLocations.includes(location)
        ? location.replace(/\s+/g, "")
        : location;
    };

    const locationExists = (location) =>
      standardMileageData.some((entry) => entry.Location === location);

    // If either location isn't present in the data, return 0
    if (!locationExists(fromLocation) || !locationExists(toLocation)) {
      return 0;
    }

    let mileage = null;

    // First, try finding the 'from' location as a row and look for the 'to' as a column
    let fromRow = standardMileageData.find(
      (entry) => entry.Location === fromLocation,
    );
    if (fromRow && fromRow[cleanIfNeeded(toLocation)] !== undefined) {
      mileage = fromRow[cleanIfNeeded(toLocation)];
    }

    // If not found, reverse: find the 'to' location as a row and check 'from' as a column
    if (mileage === null) {
      let toRow = standardMileageData.find(
        (entry) => entry.Location === toLocation,
      );
      if (toRow && toRow[cleanIfNeeded(fromLocation)] !== undefined) {
        mileage = toRow[cleanIfNeeded(fromLocation)];
      }
    }

    return mileage !== null ? mileage : 0;
  }

  function validateAccountNumberInDynamicList(
    dynamicListRow,
    accountNumber,
    accountNumberDesc,
  ) {
    // if a value exists in the account field ...
    if (dynamicListRow[accountNumber]()) {
      // ... AND the description is empty ...
      if (!dynamicListRow[accountNumberDesc]()) {
        // ... then check the integration for validating the account number AND populate the account number desc
        integration
          .all("Web_Ethos_Validate_Accounting_Strings_by_GLAccountNumber", {
            GLAccountNumber: dynamicListRow[accountNumber](),
          })
          .then(function (validateAcctString) {
            dynamicListRow[accountNumberDesc](
              validateAcctString["description"],
            );
            //dynamicListRow[accountNumber].readOnly = true;
            notify("success", "Account number valid");
          })
          .catch(function (error) {
            //console.error('An error occurred:', error.message);
            dynamicListRow[accountNumber](undefined);
            dynamicListRow[accountNumberDesc](undefined);
            notify("error", "Account number not valid");
          });
      } else {
      }
    } else {
      // if account number was removed...
      // ... then clear out the desc
      dynamicListRow[accountNumberDesc](undefined);
    }
  }

  function formatAsDollar(value, options = {}) {
    const {
      decimals = 2, // number of decimal places to keep
      showDollar = false, // whether to prefix with "$"
    } = options;

    if (value === undefined || value === null || value === "")
      return showDollar ? "$0.00" : "0.00";

    // Convert to string and keep "-" if negative
    value = value.toString();

    // Extract negative flag and clean value
    const isNegative = value.includes("-");
    value = value.replace(/[^0-9.]/g, ""); // remove everything except digits and dot

    // Split into whole and decimal parts
    let parts = value.split(".");

    // Format whole number with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Ensure decimal part exists and is limited to the chosen number of decimals
    if (parts[1]) {
      parts[1] = parts[1].substring(0, decimals).padEnd(decimals, "0");
    } else {
      parts[1] = "0".repeat(decimals);
    }

    let formatted = parts.join(".");

    // Add negative sign if needed
    if (isNegative && parts[0] !== "") {
      formatted = "-" + formatted;
    }

    // Add dollar sign if requested
    if (showDollar) {
      formatted = `$${formatted}`;
    }

    return formatted;
  }

  //================= FUNCTION TO GENERATE MODAL WHEN showModal() FUNCTION IS CALLED =====================
  //================================ STYLING IN FORM OPTIONS =============================================
  /* 5.12.26 ep start
  function showModal() {
    let reasonText = vm.reasonForDecline(); // unwrap the observable
    let modal = document.createElement("div");
    modal.id = "expenseModal";
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content">
          <p>Your Mileage/Expense Report has been returned for the following reason: <br><br><span style="color: red; font-weight: bold;">${reasonText}</span><br><br>
             To return this Mileage/Expense Report to your supervisor, click the 'Approve' button in the menu below the form after making any necessary changes.<br><br>
             To completely cancel this Mileage/Expense Report, click the 'Cancel' button in the menu below the form.<br><br><strong>Note:</strong> If canceled, the Mileage/Expense Report will be permanently removed.</p>
          <button class="modal-button" onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
      `;
    document.body.appendChild(modal);
    modal.style.display = "block";
  } */ //end
  //================ END FUNCTION TO CREATE MODAL WITH TRAVEL CANCELLATION INSTRUCTIONS ==================

  // function validateNonMileageExpenses() {
  //     // const hasValue = vm.nonMileageExpenseRow().some(row => {
  //     //     return Object.keys(row).some(key => {
  //     //         const value = row[key];
  //     //         if (ko.isObservable(value)) {
  //     //             const val = value();
  //     //             return val !== null && val !== undefined && val !== '';
  //     //         }
  //     //         return false;
  //     //     });
  //     // });

  //     // if (hasValue) {
  //     //     if (form.attachmentCount < 1) {
  //     //         throw new Error('Please attach appropriate documentation before submitting!.');
  //     //     } else {
  //     //         return false;//true;
  //     //     }
  //     // }

  //     // return true;

  //     if (vm.nonMileageExpenseRow().length > 0 && form.attachmentCount < 1) throw new Error("Please attach appropriate non-mileage documentation before submitting")
  //     else return true
  // }

  //================== END HELPER FUNCTIONS =============================

  return vm;
});
