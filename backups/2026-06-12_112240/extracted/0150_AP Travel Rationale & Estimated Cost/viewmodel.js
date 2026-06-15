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

  //=========== ADD OBSERVABLE ARRAYS ===========

  vm.addObservableArray("personsPositionsList");
  vm.addObservableArray("dates");
  vm.addObservableArray("filteredDates");

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const fiscYear = `${currentYear}-${nextYear}`;

  //=========== HIDE SECTIONS ON FORM ORIGINATION ===========

  $(".onBehalf").hide();
  $(".self").hide();
  $(".supSig").hide();
  $(".bugManSig").hide();
  $(".ecMemSig").hide();
  // $('.sigHeader').hide();
  $(".developer").hide();

  //========= END HIDE SECTIONS ON FORM ORIGINATION =========

  vm.onLoad = function onLoad(source, inputValues) {};

  vm.setDefaults = function setDefaults(source, inputValues) {
    integration
      .first("FS_Get_Mileage_Rate_by_Year", { mileageYear: currentYear })
      .then((data) => vm.mileageRate(data.Rate));
    integration
      .first("FS_Get_Per_Diem_Rates_by_Year", { fiscYear: fiscYear })
      .then((data) => {
        const { breakfast, lunch, dinner } = data;
        vm.breakfastRate(breakfast);
        vm.lunchRate(lunch);
        vm.dinnerRate(dinner);
      });

    if (pkg.isAtStep("Start")) vm.start("Y");
    else vm.start("N");

    if (pkg.isAtStep("Start")) {
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
    }

    // ko.computed(() => {
    //     if (vm.selfOrElse()) {
    //         if (vm.selfOrElse() === "Yes") {
    //             $('.onBehalf').show();
    //             $('.other').show();
    //             $('.yourself').hide();
    //             $('.self').hide();
    //         } else {
    //             $('.onBehalf').hide();
    //             $('.other').hide();
    //             $('.yourself').show();
    //             $('.self').show();
    //             //vm.employeeName(user.DisplayName);
    //             vm.employeeID(user.ErpId);
    //         }
    //     }
    // });

    vm.employeeID.subscribe((newValue) => {
      if (newValue) {
        runEmployeeEthosCall(newValue);
      } else {
        vm.employeeName("");
        vm.campus("");
        vm.department("");
      }
    });

    //Job Title autocomplete is readonly if package is NOT at start step
    if (!pkg.isAtStep("Start")) {
      $("#employeeSearchButton").prop("disabled", true);
      $("#selfOrElse").prop("disabled", true);
      autoCompleteUtils.makeReadOnly("jobTitle");
    }

    //IF USER OPENS UP THE FORM IN DRAFTS, WILL STILL BE ABLE TO CLICK ON JOB TITLE AND POPULATE INFO
    if (user.isInDrafts && vm.selfOrElse() == "No") {
      runEmployeeEthosCall(vm.employeeID());
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

        var departmentGUID = vm.departmentGUID();
        integration
          .first("Web_Ethos_Get_Employment_Department_by_GUID", {
            deptGUID: departmentGUID,
          })
          .then((deptResults) => {
            //console.log('Dept Change Results: ', deptResults);
            vm.department(deptResults.title);
          });
      } else {
        vm.supervisorSelect("No Supervisor Found");
        vm.supervisorEmail("No Supervisor Found");
      }
    });

    //================== SHOW SIGNATURE ROWS AT APPROPRIATE STEPS =======================

    if (pkg.isAtStep("ConditionalActorEmployee")) {
      $(".self").show();
      // $('.sigHeader').show();
    }

    if (
      pkg.isAtStep("ConditionalActorSupervisor") ||
      pkg.isAtStep("WFFSBudgetManager") ||
      pkg.isAtStep("ConditionalActorExecutiveCouncilMember") ||
      pkg.isAtStep("EndApproved") ||
      pkg.isAtStep("EndDeclined")
    ) {
      $(".supSig").show();
      //  $('.sigHeader').show();
      $(".self").show();
    }

    if (
      pkg.isAtStep("WFFSBudgetManager") ||
      (pkg.isAtStep("ConditionalActorExecutiveCouncilMember") &&
        vm.grantRelated() == "Yes") ||
      (pkg.isAtStep("EndDeclined") && vm.grantRelated() == "Yes") ||
      (pkg.isAtStep("EndApproved") && vm.grantRelated() == "Yes")
    ) {
      $(".bugManSig").show();
      $(".self").show();
      //  $('.sigHeader').show();
    }

    if (
      pkg.isAtStep("ConditionalActorExecutiveCouncilMember") ||
      (pkg.isAtStep("EndDeclined") && vm.over5000() == "Yes") ||
      (pkg.isAtStep("EndApproved") && vm.over5000() == "Yes")
    ) {
      $(".ecMemSig").show();
      $(".self").show();
    }

    //================ END SHOW SIGNATURE ROWS AT APPROPRIATE STEPS =====================

    //================== SIGNATURES =======================
    vm.employeeSign.subscribe((newValue) => {
      if (newValue) {
        vm.employeeSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.employeeSignDate("");
      }
    });

    vm.supDeanSign.subscribe((newValue) => {
      if (newValue) {
        vm.supDeanSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.supDeanSignDate("");
      }
    });

    vm.budManSign.subscribe((newValue) => {
      if (newValue) {
        vm.budManSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.budManSignDate("");
      }
    });

    vm.execCounSign.subscribe((newValue) => {
      if (newValue) {
        vm.execCounSignDate(Extenders.utils.formatDate(new Date()));
      } else {
        vm.execCounSignDate("");
      }
    });

    vm.employeeSearch.subscribe((newVal) => {
      if (newVal && newVal !== "") {
        if (newVal.length < 7) {
          vm.employeeSearch(newVal.padStart(7, "0"));
        }
      }
    });
    //================ END SIGNATURES =====================

    //=========== GET MILEAGE YEAR FROM TO DATE ===========
    vm.toDate.subscribe((newValue) => {
      if (newValue) {
        let yearArray = newValue.split("/");
        vm.mileageYear(yearArray[2]);
      } else {
        vm.mileageYear("");
      }
    });
    //========= END GET MILEAGE YEAR FROM TO DATE =========

    //=========== GET MILEAGE RATE FROM MILEAGE YEAR ===========
    vm.mileageYear.subscribe((newValue) => {
      if (newValue) {
        integration
          .first("FS_Get_Mileage_Rate_by_Year", {
            mileageYear: newValue,
          })
          .then((rateData) => {
            vm.mileageRate(rateData.Rate);
          });
      } else {
        vm.mileageRate("");
      }
    });
    //========= END GET MILEAGE RATE FROM MILEAGE YEAR =========

    //=========== CHECK IF TOTAL EXPENSES ARE OVER 5000 ===========
    vm.expenseTotal.subscribe((newValue) => {
      if (newValue) {
        if (newValue > 5000) {
          vm.over5000("Yes");
        } else {
          vm.over5000("No");
        }
      } else {
        vm.over5000("No");
      }
    });

    //======= END CHECK IF TOTAL EXPENSES ARE OVER 5000 ===========

    if (user.isInLibrary) {
      vm.over5000("No");
    } else {
    }
  };

  //============ AFTERLOAD ================
  vm.afterLoad = function afterLoad() {
    // Initialize required indicators after VM bindings and form DOM are ready.
    // This replays any queued setRequired(…) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    // Initialize autocomplete utilities after VM bindings are ready.
    // Replays any queued makeReadOnly/makeEditable calls made earlier.
    autoCompleteUtils.init(vm);

    // Toggle export mode styling and behavior.
    // Hides required indicators/notes and normalizes readonly presentation for export.
    autoCompleteUtils.setExportMode(pkg.isExporting);

    if (!pkg.isAtStep("Start")) {
      $("#supervisorSelect").css("pointer-events", "none");
      $("#supervisorSelect").prop("readonly", true);
      $("#supervisorSelect").css("background-color", "#e9ecef");
    }

    //============ CHECK VALID GL ACCOUNT CODE IN DYNAMIC LIST ===================
    ko.computed(() => {
      vm.accountRow.forEach((rowData) => {
        validateAccountNumberInDynamicList(rowData, "glNum", "glDescription");
      });
    });
    //===========END CHECK VALID GL ACCOUNT CODE IN DYNAMIC LIST =================

    ko.computed(() => {
      vm.expenseRow.forEach((rowData, id) => {
        if (rowData.expenseDescription()) {
          if (rowData.expenseDescription() == "Personal Car Miles") {
            rowData.mileageRateExp(vm.mileageRate());
            rowData.estimatedCost(rowData.estimatedCostMiles());
          } else if (rowData.expenseDescription() == "Meals (including tips)") {
            const totalEstimate =
              vm.lunchRate() + vm.breakfastRate() + vm.dinnerRate();
            if (rowData.estimatedCost()) {
              const rowTotal = parseInt(rowData.estimatedCost());
              if (rowTotal > totalEstimate) {
                rowData.estimatedCost(0.0);
                notify(
                  "error",
                  `Estimate for this row of meals should not exceed the combined per diem rate of ${totalEstimate}`,
                );
              }
            }

            const $mealDateSelect = $(`#expenseRow__${id}__mealDate`); // target the meals dropdown on each row
            // if there's no date specified, initialize dropdown with options
            if (!rowData.mealDate()) {
              $mealDateSelect.empty();
              $mealDateSelect.append($("<option></option>"));

              // if the filtered dates has more than one entry, we've been here before and it's a new row, so filter out the dates already used to populate the dropdown
              if (vm.filteredDates().length > 0) {
                const datesNotUsed = vm
                  .dates()
                  .filter((d) => !vm.filteredDates().includes(d));
                datesNotUsed.forEach((date) => {
                  $mealDateSelect.append(
                    $("<option>", {
                      value: date,
                      text: date,
                    }),
                  );
                });
                // otherwise initialize the dropdown in its "default" state
              } else {
                vm.dates.forEach((date) => {
                  $mealDateSelect.append(
                    $("<option>", {
                      value: date,
                      text: date,
                    }),
                  );
                });
              }
            } else {
              // if neither of the above blocks get hit, that means we need to track and filter out the date selected here for the next loop
              if (!vm.filteredDates().includes(rowData.mealDate()))
                vm.filteredDates.push(rowData.mealDate());
              rowData.mealDateChosen(rowData.mealDate());
            }
          } else rowData.numberOfMiles(0);
        }
      });
    });

    ko.computed(() => {
      if (vm.fromDate() && vm.toDate()) {
        vm.dates([]);
        const mealDates = generateDateRange(vm.fromDate(), vm.toDate());
        vm.dates(mealDates);
      }
    });

    ko.computed(() => {
      let total = 0;

      vm.expenseRow.forEach((row) => {
        if (row.estimatedCost()) {
          let formatted = formatAsDollar(row.estimatedCost());
          // const rawNumber = parseInt(formatted.replace(",", ''))  --> When we use parseInt, we round the numbers so instead of parseInt, we need to use parseFloat
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          total += rawNumber;
          row.estimatedCost(formatted);
        }
      });

      let formattedTotal = formatAsDollar(total);
      // console.log("Formatted Total:",formattedTotal);
      vm.expenseTotal(formattedTotal);
    });

    ko.computed(() => {
      let total = 0;

      vm.accountRow.forEach((row) => {
        if (row.glAmount()) {
          let formatted = formatAsDollar(row.glAmount());
          // const rawNumber = parseInt(formatted.replace(",", ''))  --> When we use parseInt, we round the numbers so instead of parseInt, we need to use parseFloat
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          total += rawNumber;
          row.glAmount(formatted);
        }
      });

      let formattedTotal = formatAsDollar(total);
      // console.log("Formatted Total:",formattedTotal);
      vm.accountTotal(formattedTotal);
    });

    liveVM.afterLoadEditsForVM();

    //============ SHOW/HIDE sections related to "Will you be submitting this form on behalf of another employee?" dropdown ===================

    // ko.computed(() => {
    //         if (vm.selfOrElse()) {
    //             if (vm.selfOrElse() === "Yes") {
    //                 $('.onBehalf').show();
    //                 $('.other').show();
    //                 $('.yourself').hide();
    //                 $('.self').hide();
    //                 vm.employeeName('');
    //                 vm.employeeID('');
    //                 vm.jobTitle('');
    //             } else {
    //                 $('.onBehalf').hide();
    //                 $('.other').hide();
    //                 $('.yourself').show();
    //                 $('.self').show();
    //                 //vm.employeeName(user.DisplayName);
    //                 if(pkg.isAtStep('Start')){
    //                     vm.employeeName(user.DisplayName);
    //                     vm.employeeID(user.ErpId);
    //                 }

    //             }
    //         }
    // });

    ko.computed(() => {
      const val = (vm.selfOrElse() || "").trim();
      if (val === "Yes") {
        $(".onBehalf").show();
        $(".other").show();
        $(".yourself").hide();
        $(".self").hide();
      } else if (val === "No") {
        $(".onBehalf").hide();
        $(".other").hide();
        $(".yourself").show();
        $(".self").show();
      } else {
        $(".onBehalf").hide();
        $(".other").hide();
        $(".yourself").hide();
        $(".self").hide();
      }
    });
    //============ END SHOW/HIDE sections related to "Will you be submitting this form on behalf of another employee?" dropdown ===================

    autosize($("textarea"));
  };
  //========= END AFTERLOAD ================

  vm.onSubmit = function onSubmit(form) {
    if (parseInt(vm.accountTotal()) !== parseInt(vm.expenseTotal()))
      throw new Error(
        "Please ensure the Account Total and Expense Total match",
      );
  };

  vm.onApprove = function onApprove(form) {
    //  This method is called when the Approve button is clicked and before calling beforeRequired.
    // if (!vm.glNum()) throw new Error("Please supply a GL Number before approval")
    vm.accountRow.forEach((row) => {
      if (!row.glNum())
        throw new Error("Please supply a GL number before approval");
    });
    vm.approvalStatus("Approved");
  };

  vm.onDecline = function onDecline(form) {
    //  This method is called when the Decline button is clicked and before calling beforeRequired.
    // if (!vm.glNum()) throw new Error("Please supply a GL Number before denial")
    vm.approvalStatus("Declined");
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
    Extenders.utils.verifyDynamicListRequired(vm, ["accountRow"]);
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  //=================== HELPER FUNCTIONS =======================

  function formatAsDollar(value, locale = "en-US") {
    // normalize input
    const n = Number(String(value).replace(/,/g, "").trim());
    if (!Number.isFinite(n)) return "";

    // truncate toward zero at 2 decimals (no rounding)
    const truncated = Math.trunc(n * 100) / 100;

    // add separators and always show 2 decimals
    return truncated.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  $("#employeeSearchButton").click(function () {
    //Update time Entries
    if (vm.employeeSearch()) {
      vm.employeeID(vm.employeeSearch());
    } else {
      notify("error", "You must enter an Employee ID to search.");
      vm.employeeID("");
    }
  });

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
                  results.forEach(function (resultData) {
                    vm.personsPositionsList.push({
                      positionTitle: resultData.personPositions.title,
                      campusTitle: resultData.personPosCampus.title,
                      positionDepartmentGUID:
                        resultData.personPositions.departments[0].id,
                      supervisorGUID: resultData.supervisorID,
                    });
                  });

                  integration
                    .first("Web_Ethos_Get_Employment_Department_by_GUID", {
                      deptGUID:
                        vm.personsPositionsList()[0].positionDepartmentGUID,
                    })
                    .then((deptResults) => {
                      console.log("Dept Results: ");
                      //vm.department(deptResults.title);
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

  function generateDateRange(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const dateArray = [];

    // Normalize time to midnight
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    for (
      let dt = new Date(startDate);
      dt <= endDate;
      dt.setDate(dt.getDate() + 1)
    ) {
      const formatted = formatDateMMDDYYYY(dt);
      dateArray.push(formatted);
    }

    return dateArray;
  }

  function formatDateMMDDYYYY(date) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  //================= END HELPER FUNCTIONS =====================

  return vm;
});
