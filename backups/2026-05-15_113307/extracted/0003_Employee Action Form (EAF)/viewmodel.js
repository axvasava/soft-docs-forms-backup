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
  // Safe to call before init. Calls to setRequired(...) queue until afterLoad runs init(vm).
  var requiredIndicators = formUtils.createRequiredIndicators();

  // Form-scoped autocomplete utility manager.
  // Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
  var autoCompleteUtils = formUtils.createAutoCompleteUtils();

  vm.addObservableArray("personsPositionsList");
  vm.addObservableArray("GLAccountsAutocomplete");
  vm.addObservableArray("AllEmployeesAutocomplete");
  vm.addObservableArray("AcademicPeriodsAutocomplete");
  vm.addObservableArray("CourseSectionsAutocomplete");
  vm.addObservableArray("filteredPositionTitle");

  $(".developer").hide();

  var fundingTrackerStipend = "";

  $("#personIdSearchBtn").click(function () {
    /* CLEAR OUT ALL AUTOPOPULATED DATA*/
    vm.employeeName(undefined);
    vm.currentCampus(undefined);
    vm.currentDepartment(undefined);

    // check if there is data in the colleague id
    if (vm.colleagueID()) {
      // check if there's 7 digits
      if (vm.colleagueID().length == 7) {
        $(".loading").show();

        // GET PERSON FROM COLLEAGUE ID
        integration
          .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
            personID: vm.colleagueID(),
          })
          .then(function (personResults) {
            if (personResults) {
              //console.log('Person Results', personResults);
              vm.employeeName(getPreferredName(personResults.names));
              vm.employeeFirstName(getPreferredFirstName(personResults.names));
              vm.employeeLastName(getPreferredLastName(personResults.names));

              integration
                .all("Web_Ethos_Get_active_institution_jobs_by_Person_GUID", {
                  personGUID: personResults.id,
                })
                .then(function (allInstJob) {
                  //console.log('allInstJob',allInstJob);

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
                          positionCode: resultData.personPositions.code,
                          positionGUID: resultData.personPositions.id,
                          positionDepartmentGUID:
                            resultData.personPositions.departments[0].id,
                          supervisorGUID: resultData.supervisorID,
                        });
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

                      //console.log('vm.personsPositionsList()',vm.personsPositionsList());
                    })
                    .catch(function (error) {
                      // Handle errors here
                      console.error("Error occurred:", error);
                    });
                });
            } else {
              notify("error", "Person not found");
              $(".loading").hide();
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

  //function to sort through all supervisors and return the primary supervisor ID (GUID)
  function getPrimarySupervisor(supervisorArray) {
    // Loop through the array
    for (let i = 0; i < supervisorArray.length; i++) {
      // Check if the current object's type is "primary"
      if (supervisorArray[i].type === "primary") {
        // Return the id attribute value from the matching object
        return supervisorArray[i].supervisor.id;
      }
    }
    // Return null if no match is found
    return null;
  }

  // Function to sort through all emails and return the primary name
  function getPrimaryEmail(emailArray) {
    // Loop through the array
    for (let i = 0; i < emailArray.length; i++) {
      // Check if the current object's preference is "primary"
      if (emailArray[i].preference === "primary") {
        // Return the address attribute value from the matching object
        return emailArray[i].address;
      }
    }
    // Return null if no match is found
    return null;
  }

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

    //hide all sections until Action Type is select and displayed in set.defaults

    $(".additionalAppointmentRow").hide();
    $(".removeAppointmentRow").hide();
    $(".leaveRow").hide();
    $(".newEmployeeRow").hide();
    $(".payAdjustmentRow").hide();
    $(".separationRow").hide();
    $(".stipendRequestRow").hide();
    $(".endProbationRow").hide();
    $(".newPositionRow").hide();
    $(".probationExtensionRow").hide();
    $(".returnFromLeaveRow").hide();

    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.
  };

  vm.setDefaults = function setDefaults(source, inputValues) {
    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    //  getAllDataFromPagingSource('Web_Ethos_Get_Active_Positions',100).then(listOfActivePositions => {
    //      console.log('Active Positions: ', listOfActivePositions);
    //  });

    //  integration.all('Web_Ethos_Get_Active_Positions',{

    //  }).then(function (ActivePositions) {
    //      console.log('ActivePositions',ActivePositions)

    //  });

    vm.supervisorGUID.subscribe(function (NewValue) {
      if (NewValue != "No Supervisor GUID") {
        integration
          .all("Web_Ethos_Get_Person_by_GUID", {
            personGUID: vm.supervisorGUID(),
          })
          .then(function (supervisorData) {
            //console.log('supervisorData', supervisorData);

            vm.supervisorName(getPreferredName(supervisorData.names));
            //vm.supervisorEmail(
            //	getPrimaryEmail(supervisorData.emails)
            //);
          });
      } else {
        vm.supervisorName("No Supervisor Found");
        //vm.supervisorEmail("No Supervisor Found");
      }
    });

    vm.departmentGUID.subscribe(function (NewValue) {
      if (NewValue) {
        integration
          .all("Web_Ethos_Get_Employment_Department_by_GUID", {
            deptGUID: vm.departmentGUID(),
          })
          .then(function (departmentData) {
            //console.log('departmentData', departmentData);
            vm.currentDepartment(departmentData.title);
          });
      }
    });

    vm.supervisorName.subscribe(function (NewValue) {
      integration
        .all("Security_Get_CW_Employees", {})
        .then(function (allEmployeesData) {
          //console.log('allEmployeesData',allEmployeesData);
          allEmployeesData.forEach(function (results) {
            vm.AllEmployeesAutocomplete.push({
              username: results.UserName,
            });
          });
        });
    });

    //This code will update a hidden field that is used in Workflow to determin if finance should be notified by Employee Type
    vm.currentPosEmployeeClassification.subscribe(function (employeeType) {
      // Check if employeeType is blank
      if (!employeeType) {
        vm.notifyFinance(undefined);
        return;
      }

      switch (true) {
        case employeeType == "Adjunct Non-Teaching":
          vm.notifyFinance("No");
          break;

        case employeeType == "Adjunct Teaching":
          vm.notifyFinance("No");
          break;

        case employeeType == "Part-Time Hourly":
          vm.notifyFinance("No");
          break;

        case employeeType == "Student":
          vm.notifyFinance("No");
          break;

        default:
          vm.notifyFinance("Yes");
          break;
      }
    });

    vm.currentPosEmployeeClassification.subscribe(function (NewValue) {
      if (NewValue) {
        vm.employeeClassification(NewValue);
      } else {
        vm.employeeClassification(undefined);
      }
    });

    // vm.separationEmployeeType.subscribe(function(NewValue) {
    //     if (NewValue) {
    //         vm.employeeClassification(NewValue);
    //     }
    // 	else{
    // 	    vm.employeeClassification(undefined);
    // 	}
    // });

    vm.newPosEmployeeClassification.subscribe(function (NewValue) {
      if (NewValue) {
        vm.employeeClassification(NewValue);
      } else {
        vm.employeeClassification(undefined);
      }
    });

    // vm.newEmpEmployeeType.subscribe(function(NewValue) {
    //      if (NewValue) {
    //          vm.employeeClassification(NewValue);
    //      }
    //  	else{
    //      	vm.employeeClassification(undefined);
    //  	}
    //  });

    if (pkg.stepCode == "WFHumanResources") {
      vm.currentDepartment.readOnly = false;
      //vm.supervisorEmail.readOnly = false; //ep 5/4
      vm.timeEntryApprover.readOnly = false; //ep added 5/4
      vm.supervisorName.readOnly = false;
      vm.currentCampus.readOnly = false;
      vm.currentPositionID.readOnly = false;
      vm.currentPositionTitle.readOnly = false;
    } else {
      vm.currentDepartment.readOnly = true;
      //vm.supervisorEmail.readOnly = false; //true;   Temp fix to allow users to enter unfound supervisor.
      vm.timeEntryApprover.readOnly = false; //added 5/4
      vm.supervisorName.readOnly = false; //true;
      vm.currentCampus.readOnly = true;
      vm.currentPositionID.readOnly = true;
      vm.currentPositionTitle.readOnly = true;
    }

    integration
      .all("Web_Ethos_Get_Academic_Periods_by_startOn_date", {
        logic: "$gte",
        startOnDate: dateManipulation(180), //was 150 added 30 to let current Summer appear longer.
      })
      .then(function (academicPeriodStartOnData) {
        //console.log('academicPeriodStartOnData',academicPeriodStartOnData);
        academicPeriodStartOnData.forEach(function (results) {
          vm.AcademicPeriodsAutocomplete.push({
            termCode: results.code,
            termGUID: results.id,
            termTitle: results.title,
          });
        });
      });

    vm.actionType.subscribe(function (newVal) {
      actionTypeRowShow(newVal);
    });

    // vm.positionGUID.subscribe(function (positionGUID) {
    //     integration.all('Web_Ethos_Get_active_institution_jobs_by_Position_GUID', {
    //         positionGUID: positionGUID
    //     }).then(function (positionData) {

    //         console.log('positionData', positionData);
    //     });

    // });

    if (!pkg.isAtStep("Start")) {
      $("#colleagueID").prop("readonly", true);
      $("#personIdSearchBtn, #actionType").prop("disabled", true);
    }

    $("#addApptDepartment").on("input", function () {
      var selection = $(this).val();
    });

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    //Getting Position Title and ID based on Department selection (Additional Appointment Section)
    $(document).on(
      "autocompleteselect",
      "input[name='addApptDepartment']",
      function (event, ui) {
        const $row = $(this).closest("[data-bind*='dynamicList']");

        // what user sees
        const label = ui.item.label;

        // a hidden code, if returned by integration (depends on your source)
        const value = ui.item.value;

        const deptCode = label.split("|")[0].trim();
        // set the hidden field in this row
        $("#departmentSelectionAddSection").val(deptCode);

        integration.all("Positions", {}).then(function (data) {
          vm.filteredPositionTitle(
            data.filter((item) => item.PositionDept === deptCode),
          );
        });
      },
    );

    //Getting Position Title and ID based on Department selection (Remove Appointment Section)
    $(document).on(
      "autocompleteselect",
      "input[name='removeApptDepartment']",
      function (event, ui) {
        const $row = $(this).closest("[data-bind*='dynamicList']");

        // what user sees
        const label = ui.item.label;

        // a hidden code, if returned by integration (depends on your source)
        const value = ui.item.value;

        const deptCode = label.split("|")[0].trim();
        // set the hidden field in this row
        $("#departmentSelectionRemoveSection").val(deptCode);

        integration.all("Positions", {}).then(function (data) {
          vm.filteredPositionTitle(
            data.filter((item) => item.PositionDept === deptCode),
          );
        });
      },
    );

    if (user.isInLibrary || user.isInDrafts) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.

      // vm.grantFunding('No');

      if (pkg.isAtStep("Start")) {
        vm.grantFundedStipend.subscribe(function (isGrantFunded) {
          if (isGrantFunded == "Yes") {
            vm.grantFunding("Yes");
          }
        });
      }
    } else {
      //  Input Values set here will be saved to the server immediately.
      //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
      //  prior users.  Inputs that already have values saved to the server will be overridden with
      //  values set in this method.
    }
  };

  vm.afterLoad = function afterLoad() {
    //  This method is called after setDefaults has been called.

    //autosize($('textarea'));

    $(".loading").hide();

    // Initialize required indicators after VM bindings and form DOM are ready.
    // This replays any queued setRequired(...) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    // Initialize autocomplete utilities after VM bindings are ready.
    // Replays any queued makeReadOnly/makeEditable calls made earlier.
    autoCompleteUtils.init(vm);

    // Toggle export mode styling and behavior.
    // Hides required indicators/notes and normalizes readonly presentation for export.
    autoCompleteUtils.setExportMode(pkg.isExporting);

    if (vm.actionType()) {
      actionTypeRowShow(vm.actionType());
    }

    //loop through rows with money inputs and apply commas **********************************************
    ko.computed(function () {
      vm.additionalApptPosition().forEach(function (row) {
        const rowAmount = row.addApptAmount();
        const withCommas = formatAsDollar(rowAmount);
        row.addApptAmount(withCommas);
      });
    });

    ko.computed(function () {
      vm.newEmployeeRow().forEach(function (row) {
        const rowAmount = row.newEmpRate();
        const withCommas = formatAsDollar(rowAmount);
        row.newEmpRate(withCommas);
      });
    });
    //end loop through rows with money inputs and apply commas ******************************************

    //apply commas to inputs not in dynamic lists ********************************************************
    ko.computed(function () {
      const withCommas = formatAsDollar(vm.adjustCurrentAmount());
      vm.adjustCurrentAmount(withCommas);
    });

    ko.computed(function () {
      const withCommas = formatAsDollar(vm.adjustAdjustedAmount());
      vm.adjustAdjustedAmount(withCommas);
    });

    ko.computed(function () {
      const withCommas = formatAsDollar(vm.stipendAmount());
      vm.stipendAmount(withCommas);
    });

    ko.computed(function () {
      const withCommas = formatAsDollar(vm.newPosRate());
      vm.newPosRate(withCommas);
    });

    ko.computed(function () {
      const withCommas = formatAsDollar(vm.rateOfPay());
      vm.rateOfPay(withCommas);
    });

    //end apply commas to inputs not in dynamic lists ****************************************************

    //Add Row to Stipend Accounting Row Dynamic List if one is not present
    let stipendNumberOfRowsToShow = 1;

    while (vm.stipendAccountingRow().length < stipendNumberOfRowsToShow) {
      vm.stipendAccountingRow.push({});
    }

    //Add Row to Pay Adjustment Accounting Row Dynamic List if one is not present
    let payAdjustNumberOfRowsToShow = 1;

    while (vm.payAdjustAccountingRow().length < payAdjustNumberOfRowsToShow) {
      vm.payAdjustAccountingRow.push({});
    }

    //  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
    //  to save values to the server.

    //Initialize FormBuilder created form specific code
    liveVM.afterLoadEditsForVM();
    autosize($("textarea"));

    // DynamicList: payAdjustAccountingRow
    ko.computed(function () {
      // loop through dynamic list
      vm.payAdjustAccountingRow().forEach(function (rowData) {
        validateAccountNumberInDynamicList(
          rowData,
          "payAdjustAccountingInfo",
          "payAdjustAccountingInfoDesc",
        );

        // if a value exists in the account field ...
        /*if (rowData.payAdjustAccountingInfo()) {
                    // ... AND the description is empty ...
                    if (!rowData.payAdjustAccountingInfoDesc()) {
                        // ... then check the integration for validating the account number AND populate the account number desc
                        integration.all('Web_Ethos_Validate_Accounting_Strings_by_GLAccountNumber',{
                            GLAccountNumber: rowData.payAdjustAccountingInfo()
                        }).then(function (validateAcctString) {
                            console.log('validateAcctString',validateAcctString);
                            rowData.payAdjustAccountingInfoDesc(validateAcctString['description']);
                            notify('success','Account number valid');
                        }).catch(function (error) {
                            //console.error('An error occurred:', error.message);
                            rowData.payAdjustAccountingInfo(undefined);
                            rowData.payAdjustAccountingInfoDesc(undefined);
                            notify('error','Account number not valid');
                        });
                    }
                }
                else {
                    // if account number was removed...
                    // ... then clear out the desc
                    rowData.payAdjustAccountingInfoDesc(undefined);
                }*/
      });
    });

    ko.computed(function () {
      // loop through dynamic list
      vm.stipendAccountingRow().forEach(function (rowData) {
        validateAccountNumberInDynamicList(
          rowData,
          "stipendAccountingInfo",
          "stipendAccountingInfoDesc",
        );
      });
    });

    ko.computed(function () {
      // loop through dynamic list
      vm.newPosAccountingRow().forEach(function (rowData) {
        validateAccountNumberInDynamicList(
          rowData,
          "newPosAccountingInfo",
          "newPosAccountingInfoDesc",
        );
      });
    });

    ko.computed(function () {
      // loop through dynamic list
      vm.additionalApptPosition().forEach(function (rowData) {
        validateAccountNumberInDynamicList(
          rowData,
          "addApptGLNumber",
          "addApptGLNumberDesc",
        );
      });
    });

    ko.computed(function () {
      // loop through dynamic list
      vm.newEmployeeRow().forEach(function (rowData, index) {
        if (rowData.newEmpEmployeeType() && index == 0) {
          vm.employeeClassification(rowData.newEmpEmployeeType());
        }
      });
    });

    if (pkg.isAtStep("Start")) {
      vm.grantFundedStipend.subscribe(function (isGrantFunded) {
        if (isGrantFunded == "Yes") {
          vm.grantFunding("Yes");
        }
      });
      ko.computed(function () {
        let fundingTrackerAddPos = "No";
        let fundingTrackerNewEmp = "No";
        let fundingTrackerNewPos = "No";
        let fundingTrackerStipend = "No";

        fundingTrackerStipend = vm.grantFundedStipend() || "No";

        vm.additionalApptPosition().forEach(function (vals) {
          if (vals.grantFundedAddApp() == "Yes") {
            fundingTrackerAddPos = "Yes";
          } else {
            fundingTrackerAddPos = "No";
          }
        });

        vm.newEmployeeRow().forEach(function (vals) {
          if (vals.grantFundedNewEmp() == "Yes") {
            fundingTrackerNewEmp = "Yes";
          } else {
            fundingTrackerNewEmp = "No";
          }
        });

        if (vm.newPosGrantFunded() == "Yes") {
          fundingTrackerNewPos = "Yes";
        } else {
          fundingTrackerNewPos = "No";
        }

        if (
          fundingTrackerAddPos == "Yes" ||
          fundingTrackerNewEmp == "Yes" ||
          fundingTrackerNewPos == "Yes" ||
          fundingTrackerStipend
        ) {
          vm.grantFunding("Yes");
        } else {
          vm.grantFunding("No");
        }
      });
    }
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

    if (vm.actionType() == "New Position") {
      if (vm.newPosAcctTotal() != 100) {
        throw new Error(
          "The General Ledger Number percentages must add up to 100%.",
        );
      }
    }

    if (vm.actionType() == "Pay Adjustment") {
      if (vm.payAdjusmentTotal() != 100) {
        throw new Error(
          "The General Ledger Number percentages must add up to 100%.",
        );
      }
    }

    if (vm.actionType() == "Stipend Request") {
      if (vm.percentageTotal() != 100) {
        throw new Error(
          "The General Ledger Number percentages must add up to 100%.",
        );
      }
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
    //  This method is called after the required inputs on the form have been confirmed to have values
    requiredIndicators.clearNativeRequired();
    // Loop through the Dynamic List
    vm.additionalApptPosition().forEach(
      function (additionalApptPositionRow, index) {
        // if the Full Name on the row is filled in
        if (additionalApptPositionRow.addApptCampus()) {
          // if Title, Position ID, Starting Date, or Amout is NOT filled in
          if (
            !additionalApptPositionRow.addApptTitle() ||
            !additionalApptPositionRow.addApptPositionID() ||
            !additionalApptPositionRow.addApptStartingDate() ||
            !additionalApptPositionRow.addApptAmount()
          ) {
            // stop the form submission & notify the user
            throw new Error(
              "Title, Position ID, Start Date, and Amount must be filled in for each Additional Position.",
            );
          }
        }
      },
    );

    vm.newEmployeeRow().forEach(function (newEmployeeRow, index) {
      // if the Full Name on the row is filled in
      if (newEmployeeRow.newEmpPositionTitle()) {
        // if age, relationship, enrolled, or college is NOT filled in
        if (
          !newEmployeeRow.newEmpRate() ||
          !newEmployeeRow.newEmpDesiredStartDate() ||
          !newEmployeeRow.newEmpEmployeeType() ||
          !newEmployeeRow.newEmpSupervisor() ||
          !newEmployeeRow.newEmpCampus() ||
          !newEmployeeRow.newEmpDepartment()
        ) {
          // stop the form submission & notify the user
          throw new Error(
            "Department, Campus Location, Employee Type, Supervisor, Start Date and Rate must be filled in for each New Position.",
          );
        }
      }
    });

    // Loop through the Leave Dynamic List
    vm.leaveTable().forEach(function (leaveRow, index) {
      // if the Leave Type on the row is Other
      if (leaveRow.leaveType() === "Other") {
        // if Leave Type = Other then make leaveDateComments required
        if (!leaveRow.leaveComments()) {
          // stop the form submission & notify the user
          throw new Error(
            " When Others is selected as a the Leave Type, you must provide a Comment.",
          );
        }
      }
    });
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  function actionTypeRowShow(actionVal) {
    switch (actionVal) {
      case "Additional Appointment":
        $(".additionalAppointmentRow").show();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "Remove Additional Appointment":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").show();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "Leave":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").show();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "New Employee":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").show();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".currentPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        break;
      case "Pay Adjustment":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").show();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "Separation":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").show();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "Stipend Request":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").show();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "New Position":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").show();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "End Probation":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").show();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "Probation Extension":
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").show();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
      case "Return from leave":
        $(".returnFromLeaveRow").show();
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".currentPositionRow").show();
        break;
      default:
        $(".additionalAppointmentRow").hide();
        $(".removeAppointmentRow").hide();
        $(".leaveRow").hide();
        $(".newEmployeeRow").hide();
        $(".payAdjustmentRow").hide();
        $(".separationRow").hide();
        $(".stipendRequestRow").hide();
        $(".endProbationRow").hide();
        $(".newPositionRow").hide();
        $(".probationExtensionRow").hide();
        $(".returnFromLeaveRow").hide();
        $(".currentPositionRow").show();
        break;
    }
  }

  function dateManipulation(days) {
    var date = new Date();
    date.setDate(date.getDate() - days);
    var year = date.getFullYear();
    var month = (date.getMonth() + 1).toString().padStart(2, "0");
    var day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
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
            //console.log('validateAcctString',validateAcctString);
            dynamicListRow[accountNumberDesc](
              validateAcctString["description"],
            );
            dynamicListRow[accountNumber].readOnly = true;
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

  function getAllDataFromPagingSource(integrationCode, paging) {
    let offset = 0;
    let allData = [];
    return new Promise((resolve, reject) => {
      function getData() {
        integration
          .all(integrationCode, {
            offsetInt: offset,
          })
          .then((data) => {
            if (data.length === 0) {
              resolve(allData);
            } else {
              allData = [...allData, ...data];
              offset += paging;
              getData();
            }
          })
          .catch((error) => {
            reject(error);
          });
      }
      getData();
    });
  }

  // function formatAsDollar(value) {
  //     if (value === undefined || value === null) return "0.00";
  //     // Ensure the value is a string
  //     value = value.toString();
  //     // Remove all non-digit and non-decimal characters
  //     value = value.replace(/[^0-9.]/g, "");
  //     // Split the value into whole number and decimal parts
  //     let parts = value.split(".");
  //     // Format the whole number part with commas
  //     parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  //     // Limit the decimal part to two digits
  //     if (parts[1]) {
  //         parts[1] = parts[1].substring(0, 2);
  //     } else {
  //         parts[1] = "00"; // Ensure two decimal places
  //     }
  //     //return `$${parts.join(".")}`; //if you want dollar sign in final string
  //     return parts.join("."); // Final string with no dollar sign
  // }

  function formatAsDollar(value, options = {}) {
    const {
      decimals = 4, // number of decimal places to keep
      showDollar = false, // whether to prefix with "$"
    } = options;

    if (value === undefined || value === null || value === "")
      return showDollar ? "$0.0000" : "0.0000";

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

  return vm;
});
