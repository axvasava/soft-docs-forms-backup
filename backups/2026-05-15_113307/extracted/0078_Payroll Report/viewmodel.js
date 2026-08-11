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

  //=========== HIDE SECTIONS ON FORM ORIGINATION ===========

  $(".onBehalf").hide();
  $(".dev").hide();

  //========= END HIDE SECTIONS ON FORM ORIGINATION =========

  const gridRows = document.getElementsByClassName("grid-row");

  // function getPreferredName(myArray) {
  //     // Loop through the array
  //     for (let i = 0; i < myArray.length; i++) {
  //       // Check if the current object's preference is "preferred"
  //       if (myArray[i].preference === "preferred") {
  //         // Return the fullName attribute value from the matching object
  //         return myArray[i].fullName;
  //       }
  //     }
  //     // Return null if no match is found
  //     return null;
  // }

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
  //   function getPrimaryEmail(emailArray) {
  //     // Loop through the array
  //     for (let i = 0; i < emailArray.length; i++) {
  //       // Check if the current object's preference is "primary"
  //       if (emailArray[i].preference === "primary") {
  //         // Return the address attribute value from the matching object
  //         return emailArray[i].address;
  //       }
  //     }
  //     // Return null if no match is found
  //     return null;
  //   }

  ////////////////////___________ USED IN MAIN TIMESHEET_________________
  vm.addObservable("WEEKDAYS", [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);

  vm.addObservableArray("personsPositionsList");
  function updateTwoWeeksDates(startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 13); // Add 13 days to include the start date in the range

    const endDateStr = `${end.getMonth() + 1}/${end.getDate()}/${end.getFullYear().toString().slice(2, 4)}`;
    vm.endDate(endDateStr);

    if (Object.prototype.toString.call(start) === "[object Date]") {
      if (isNaN(start.getTime())) {
        console.log("Invalid start date from datepicker");
      } else {
        // Clear the existing week list
        vm.weekList().forEach(function (row) {
          row.day(undefined);
          row.date(undefined);
          row.weekHeaderText(undefined);
        });
        vm.weekList.removeAll();

        let week = 1;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Add a new row to the week list
          vm.weekListAdd();
          const lastDayAddedIndex = vm.weekList().length - 1;
          const row = vm.weekList()[lastDayAddedIndex];

          // Set the day name and date
          row.day(vm.WEEKDAYS()[d.getDay()]);
          row.date(d.getMonth() + 1 + "/" + d.getDate());

          // Insert a header text for the first day of the week
          if (d.getDay() === 0 || lastDayAddedIndex === 0) {
            // First day of the week or first day overall
            row.weekHeaderText("Week " + week);
          } else {
            row.weekHeaderText(undefined);
          }

          // Increment the week number on Sundays
          if (d.getDay() === 6) {
            // Saturday is the last day of the week
            week++;
          }
        }
      }
    } else {
      console.log("Invalid start date input");
    }
  }

  //used to calculate time
  function calculateTimeDiff(startTime, endTime) {
    if (!startTime || !endTime) return 0;

    const start = new Date(`01/01/2022 ${startTime}`);
    const end = new Date(`01/01/2022 ${endTime}`);

    const hourDiff = end.getHours() - start.getHours();
    const minuteDiff = end.getMinutes() - start.getMinutes();

    return hourDiff + minuteDiff / 60; // Convert minutes to hours
  }
  ////////////////////___________ USED IN MAIN TIMESHEET END_________________
  $(".maskphone").mask("(999)999-9999? ext:9999");
  $(".maskzip").mask("99999?-9999");
  $(".maskssn").mask("999-99-9999");

  $("#employeeSearchButton").click(function () {
    //Update time Entries
    if (vm.employeeSearch()) {
      vm.employeeID(vm.employeeSearch());
    } else {
      notify("error", "You must enter an Employee ID to search.");
      vm.employeeID("");
    }
  });
  vm.onLoad = function onLoad(source, inputValues) {
    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.
  };

  vm.setDefaults = function setDefaults(source, inputValues) {
    if (!pkg.isAtStep("Start")) {
      $("#selfOrElse").prop("disabled", true);
    }

    $("#datepicker").datepicker({
      beforeShowDay: function (date) {
        // Check if the day is Sunday (0)
        if (date.getDay() === 0) {
          // Define a reference Sunday (e.g., January 1, 2023, which is a Sunday)
          const referenceSunday = new Date(2024, 3, 7); // Jan 1, 2023
          const timeDiff = date.getTime() - referenceSunday.getTime();
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          const weeksDiff = Math.floor(daysDiff / 7);

          // Check if the number of weeks is even (every other Sunday)
          if (weeksDiff % 2 === 0) {
            return [true, ""]; // Allow this Sunday
          }
        }
        return [false, ""]; // Disable all other days
      },
    });

    //datepicker to create timesheet
    vm.datepicker.subscribe(function (newDate) {
      if (newDate) {
        updateTwoWeeksDates(newDate); // Call your function with the new date
      } else {
        console.log("Datepicker value is empty or invalid");
      }
    });

    //needed for hide/show
    vm.primaryStatus.subscribe((newVal) => {
      const v = (newVal || "").trim();
      //For Grand Totals
      //'Work Study' has been removed as an option 4/7/2025'
      if (
        /*newVal !== 'PT-Hourly' && vm.primaryStatus() !== 'Student' && */ v !==
        "Work Study"
      ) {
        vm.otherOTCalculation("No");
      } else if (v === "Student" || v === "PT Hourly") {
        vm.otherOTCalculation("Yes");
      } else {
        vm.otherOTCalculation("Yes");
      }
      //For dropdown options
      //'Work Study' has been removed as an option 4/7/2025'
      if (
        /*newVal !== 'Student' && newVal !== 'PT-Hourly' && */ newVal !==
          "Faculty" &&
        newVal !== "Work Study"
      ) {
        vm.needOptions(true);
        if (newVal == "Public Safety") {
          vm.publicSafety(true);
          vm.notPublicSafety(false);
        } else {
          vm.notPublicSafety(true);
          vm.publicSafety(false);
          if (
            newVal == "Adjunct Teaching" ||
            newVal == "Student" ||
            newVal == "PT-Hourly"
          ) {
            vm.showOnlySickTime(true);
          } else {
            vm.showOnlySickTime(false);
          }
        }
      } else {
        vm.needOptions(false);
        vm.notPublicSafety(false);
        vm.publicSafety(false);
        vm.showOnlySickTime(false);
      }
    });

    vm.determineOT.subscribe((newVal) => {
      if (newVal != 0 && newVal <= 40) {
        vm.totalRegHoursOther(newVal);
        vm.overTimeHoursOther(0);
      } else {
        vm.totalRegHoursOther(40);
        const otherOTHours = vm.totalRegHours() - 40;
        vm.overTimeHoursOther(otherOTHours);
      }
    });

    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    vm.selfOrElse.subscribe(function (newValue) {
      vm.employeeSearch("");
      vm.employeeName("");
      vm.employeeID("");
      // vm.campus('');
      // vm.department('');
      if (newValue) {
        if (newValue == "Yes") {
          $(".onBehalf").show();
        } else if (newValue == "No") {
          $(".onBehalf").hide();
          vm.employeeID(user.ErpId);
        }
      } else {
        $(".onBehalf").hide();
      }
    });

    vm.employeeID.subscribe((newValue) => {
      if (newValue) {
        runEmployeeEthosCall(newValue);
      } else {
        vm.employeeName("");
        // vm.campus('');
        // vm.department('');
      }
    });

    vm.employeeSearch.subscribe((newVal) => {
      if (newVal && newVal !== "") {
        if (newVal.length < 7) {
          vm.employeeSearch(newVal.padStart(7, "0"));
        }
      }
    });

    //IF USER OPENS UP THE FORM IN DRAFTS, WILL STILL BE ABLE TO CLICK ON JOB TITLE AND POPULATE INFO
    if (user.isInDrafts && vm.selfOrElse() == "No") {
      runEmployeeEthosCall(vm.employeeID());
    }

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.
      //     integration.first('Web_Ethos_Get_Persons_by_Colleague_ID', {
      //         personID: user.ErpId
      //     }).then(function(personResults) {
      //             // GET JOBS
      //             vm.employeeName(getPreferredName(personResults.names));
      //             integration.first('Web_Ethos_Get_institution_jobs_by_Person_GUID', {
      //                 personGUID: personResults.id
      //             }).then(function(instJob) {
      //                 // Get department from the Job
      //                 integration.first('Web_Ethos_Get_Employment_Department_by_GUID', {
      //                     deptGUID: instJob.department.id
      //                 }).then(function(deptResults) {
      //                     // vm.department(deptResults.title);
      //                     // GET POSITIONS FROM JOB
      //                     integration.all('Web_Ethos_Get_institution_positions_by_Position_GUID', {
      //                         positionGUID: instJob.position.id
      //                     }).then(function(instPos) {
      //                         vm.position(instPos.title);
      //                         // GET SUPERVISOR Information from the Job
      //                         integration.all('Web_Ethos_Get_Person_by_GUID', {
      //                             personGUID: getPrimarySupervisor(instJob.supervisors)
      //                         }).then(function(supervisorData) {
      //                             vm.supervisorName(getPreferredName(supervisorData.names));
      //                             vm.supervisorEmail(getPrimaryEmail(supervisorData.emails));
      //                         });
      //                     });
      //                 });
      //             });
      // });
    } else {
      //  Input Values set here will be saved to the server immediately.
      //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
      //  prior users.  Inputs that already have values saved to the server will be overridden with
      //  values set in this method.
      $("#employeeName").prop("readonly", true);
    }
  };

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

    applyPrimaryStatusUI(vm.primaryStatus());

    // run whenever it changes
    vm.primaryStatus.subscribe(applyPrimaryStatusUI);

    //doing Timesheet Calculations
    ko.computed(function () {
      vm.weekList().forEach((dynamicListRow) => {
        const hasTimeInOut =
          dynamicListRow.timeIn() && dynamicListRow.timeOut();
        const hasTimeInOut2 =
          dynamicListRow.timeIn2() && dynamicListRow.timeOut2();
        const hasRemarks = dynamicListRow.hasRemarks();

        // Clear fields if no remarks and secondary times are provided
        if (
          !hasRemarks &&
          (dynamicListRow.timeIn2() || dynamicListRow.timeOut2())
        ) {
          dynamicListRow.timeIn2(undefined);
          dynamicListRow.timeOut2(undefined);
          dynamicListRow.regHours(0);
          dynamicListRow.OThours(0);
        }

        // Calculate regular hours
        let totalHours = 0;
        if (hasTimeInOut) {
          totalHours += calculateTimeDiff(
            dynamicListRow.timeIn(),
            dynamicListRow.timeOut(),
          );
        }
        if (hasTimeInOut2) {
          totalHours += calculateTimeDiff(
            dynamicListRow.timeIn2(),
            dynamicListRow.timeOut2(),
          );
        }
        dynamicListRow.regHours(totalHours);

        // Handle overtime hours
        //'Work Study' has been removed as an option 4/7/2025'
        if (
          totalHours > 8 &&
          !["PT Hourly", "Student", "Work Study"].includes(vm.primaryStatus())
        ) {
          const OTDiff = totalHours - 8;
          dynamicListRow.regHours(8);
          dynamicListRow.OThours(OTDiff);
        } else {
          dynamicListRow.OThours(0); // Clear overtime hours
        }
      });
    });

    //============ SHOW/HIDE sections related to "Will you be submitting this form on behalf of another employee?" dropdown ===================

    ko.computed(() => {
      if (vm.selfOrElse()) {
        if (vm.selfOrElse() === "Yes") {
          $(".onBehalf").show();
          // vm.employeeName('');
          // vm.employeeID('');
          // // vm.jobTitle('');
          // vm.supervisorName('');
          // vm.supervisorEmail('');
        } else {
          $(".onBehalf").hide();
          // $('.other').hide();
          // $('.yourself').show();
          // $('.self').show();
          //vm.employeeName(user.DisplayName);
          if (pkg.isAtStep("Start")) {
            // vm.employeeName(user.DisplayName);
            vm.employeeID(user.ErpId);
          }
        }
      }
    });
    //============ END SHOW/HIDE sections related to "Will you be submitting this form on behalf of another employee?" dropdown ===================

    //============ Changing Totals at the bottom based on primaryStatus (Student or PT Hourly) ===================
    function num(x) {
      const n = parseFloat(x);
      return isNaN(n) ? 0 : n;
    }

    ko.computed(function () {
      const status = (vm.primaryStatus() || "").trim().toLowerCase();

      // Sum hours from the dynamic list rows
      let totalWorked = 0;
      let dailyOtSum = 0;

      vm.weekList().forEach(function (r) {
        totalWorked += num(r.regHours());
        dailyOtSum += num(r.OThours());
      });

      // Student/PT Hourly: weekly OT after 40
      if (status === "student" || status === "pt hourly") {
        vm.totalRegHours(Math.min(40, totalWorked));
        vm.totalHoursOT(Math.max(0, totalWorked - 40));
        return;
      }

      // Everyone else: show full reg sum (already capped per day in your row logic) and daily OT sum
      vm.totalRegHours(totalWorked);
      vm.totalHoursOT(dailyOtSum);
    });

    //============ END Changing Totals at the bottom based on primaryStatus (Student or PT Hourly)===================

    //  This method is called after setDefaults has been called.

    //  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
    //  to save values to the server.

    //Initialize FormBuilder created form specific code
    liveVM.afterLoadEditsForVM();

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
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };
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

  function clearEmployeeAll() {
    vm.employeeName("");
    vm.employeeEmail("");
    vm.position("");
    vm.supervisorName("");
    vm.supervisorEmail("");
  }

  function clearEmployeeRelatedDetails() {
    vm.position("");
    vm.supervisorName("");
    vm.supervisorEmail("");
  }

  function runEmployeeEthosCall(employeeID) {
    clearEmployeeAll();
    vm.personsPositionsList([]);

    if (!employeeID) return;

    $(".loading").show();

    integration
      .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
        personID: employeeID,
      })
      .then(function (personResults) {
        if (!personResults || !personResults.id) {
          clearEmployeeAll();
          vm.employeeSearch("");
          notify("error", "Employee not found");
          return Promise.reject({ type: "EMPLOYEE_NOT_FOUND" });
        }

        vm.employeeName(getPreferredName(personResults.names) || "");
        vm.employeeEmail(getPrimaryEmail(personResults.emails) || "");

        return integration
          .all("Web_Ethos_Get_active_institution_jobs_by_Person_GUID", {
            personGUID: personResults.id,
          })
          .catch(function (error) {
            return null;
          });
      })
      .then(function (allInstJob) {
        if (!Array.isArray(allInstJob) || !allInstJob.length) {
          clearEmployeeRelatedDetails();
          notify(
            "warning",
            "Employee found, but job details could not be retrieved.",
          );
          return null;
        }

        const jobPromises = allInstJob.map(function (job) {
          let supervisorGUID = "";
          let isPrimaryJob = false;

          if (job && job.preference) {
            isPrimaryJob = true;
          }

          if (
            job &&
            job.supervisors &&
            job.supervisors[0] &&
            job.supervisors[0].supervisor &&
            job.supervisors[0].supervisor.id
          ) {
            supervisorGUID = job.supervisors[0].supervisor.id;
          }

          const positionGUID =
            job && job.position && job.position.id ? job.position.id : "";

          if (!positionGUID) {
            return Promise.resolve({
              job: job,
              isPrimaryJob: isPrimaryJob,
              supervisorGUID: supervisorGUID,
              personPosition: null,
              personPosCampus: null,
            });
          }

          return integration
            .first("Web_Ethos_Get_institution_positions_by_Position_GUID", {
              positionGUID: positionGUID,
            })
            .then(function (personPosition) {
              if (
                !personPosition ||
                !personPosition.campus ||
                !personPosition.campus.id
              ) {
                return {
                  job: job,
                  isPrimaryJob: isPrimaryJob,
                  supervisorGUID: supervisorGUID,
                  personPosition: personPosition,
                  personPosCampus: null,
                };
              }

              return integration
                .first("Web_Ethos_Get_Campus_Sites_by_GUID", {
                  campusGUID: personPosition.campus.id,
                })
                .then(function (personPosCampus) {
                  return {
                    job: job,
                    isPrimaryJob: isPrimaryJob,
                    supervisorGUID: supervisorGUID,
                    personPosition: personPosition,
                    personPosCampus: personPosCampus,
                  };
                })
                .catch(function (error) {
                  console.log("CAMPUS LOOKUP ERROR:", error);
                  return {
                    job: job,
                    isPrimaryJob: isPrimaryJob,
                    supervisorGUID: supervisorGUID,
                    personPosition: personPosition,
                    personPosCampus: null,
                  };
                });
            })
            .catch(function (error) {
              console.log("POSITION LOOKUP ERROR:", error);
              return {
                job: job,
                isPrimaryJob: isPrimaryJob,
                supervisorGUID: supervisorGUID,
                personPosition: null,
                personPosCampus: null,
              };
            });
        });

        return Promise.all(jobPromises);
      })
      .then(function (results) {
        if (!results) return null;

        let primaryJobResult = null;

        results.forEach(function (resultData, index) {
          const personPosition = resultData.personPosition;
          const personPosCampus = resultData.personPosCampus;

          let departmentGUID = "";

          if (
            personPosition &&
            personPosition.departments &&
            personPosition.departments[0] &&
            personPosition.departments[0].id
          ) {
            departmentGUID = personPosition.departments[0].id;
          }

          vm.personsPositionsList.push({
            preference:
              resultData.job && resultData.job.preference
                ? resultData.job.preference
                : "NOT PRIMARY",
            positionTitle:
              personPosition && personPosition.title
                ? personPosition.title
                : "",
            positionCode:
              personPosition && personPosition.code ? personPosition.code : "",
            campusTitle:
              personPosCampus && personPosCampus.title
                ? personPosCampus.title
                : "",
            positionDepartmentGUID: departmentGUID,
            supervisorGUID: resultData.supervisorGUID || "",
            department: "",
          });

          if (resultData.isPrimaryJob && !primaryJobResult) {
            primaryJobResult = resultData;
          }

          if (!departmentGUID) return;

          integration
            .first("Web_Ethos_Get_Employment_Department_by_GUID", {
              deptGUID: departmentGUID,
            })
            .then(function (deptResults) {
              vm.personsPositionsList()[index].department =
                deptResults && deptResults.title ? deptResults.title : "";

              if (vm.personsPositionsList.valueHasMutated) {
                vm.personsPositionsList.valueHasMutated();
              }
            })
            .catch(function (error) {
              console.log("DEPARTMENT LOOKUP ERROR:", error);
              vm.personsPositionsList()[index].department = "";

              if (vm.personsPositionsList.valueHasMutated) {
                vm.personsPositionsList.valueHasMutated();
              }
            });
        });

        if (!primaryJobResult && results.length) {
          primaryJobResult = results[0];
        }

        if (!primaryJobResult) {
          clearEmployeeRelatedDetails();
          notify(
            "warning",
            "Employee found, but job details could not be retrieved.",
          );
          return null;
        }

        if (
          primaryJobResult.personPosition &&
          (primaryJobResult.personPosition.title ||
            primaryJobResult.personPosition.code)
        ) {
          vm.position(
            (primaryJobResult.personPosition.title || "") +
              (primaryJobResult.personPosition.code
                ? " | " + primaryJobResult.personPosition.code
                : ""),
          );
        } else {
          vm.position("");
        }

        vm.personsPositionsList.sort(function (a, b) {
          if ((a.positionTitle || "") < (b.positionTitle || "")) return -1;
          if ((a.positionTitle || "") > (b.positionTitle || "")) return 1;

          if ((a.positionCode || "") < (b.positionCode || "")) return -1;
          if ((a.positionCode || "") > (b.positionCode || "")) return 1;

          if ((a.campusTitle || "") < (b.campusTitle || "")) return -1;
          if ((a.campusTitle || "") > (b.campusTitle || "")) return 1;

          return 0;
        });

        const primarySupervisorGUID = primaryJobResult.supervisorGUID || "";

        if (!primarySupervisorGUID) {
          vm.supervisorName("");
          vm.supervisorEmail("");
          return null;
        }

        return integration
          .first("Web_Ethos_Get_Person_by_GUID", {
            personGUID: primarySupervisorGUID,
          })
          .then(function (supervisorResult) {
            if (supervisorResult) {
              vm.supervisorName(getPreferredName(supervisorResult.names) || "");
              vm.supervisorEmail(
                getPrimaryEmail(supervisorResult.emails) || "",
              );
            } else {
              vm.supervisorName("");
              vm.supervisorEmail("");
            }
          })
          .catch(function (error) {
            console.log("PRIMARY SUPERVISOR LOOKUP ERROR:", error);
            vm.supervisorName("");
            vm.supervisorEmail("");
          });
      })
      .catch(function (error) {
        if (error && error.type === "EMPLOYEE_NOT_FOUND") return;

        console.log("Employee lookup error:", error);
        clearEmployeeRelatedDetails();
        notify(
          "warning",
          "Employee found, but job details could not be fully loaded.",
        );
      })
      .finally(function () {
        $(".loading").hide();
      });
  }
  // function runEmployeeEthosCall(employeeID) {
  //   clearEmployeeAll();
  //   if (!employeeID) return;

  //   integration.first('Web_Ethos_Get_Persons_by_Colleague_ID', { personID: employeeID })
  //     .then(function (personResults) {
  //       // HARD FAIL: employee not found
  //       if (!personResults || !personResults.id) {
  //         clearEmployeeAll();
  //         vm.employeeSearch('');
  //         notify('error', 'Employee not found');
  //         return Promise.reject({ type: 'EMPLOYEE_NOT_FOUND' }); // stop chain
  //       }

  //       // Success: populate the minimum guaranteed fields
  //       vm.employeeName(getPreferredName(personResults.names));
  //       vm.employeeEmail(getPrimaryEmail(personResults.emails));

  //       // Continue chain for optional details
  //       return integration.first('Web_Ethos_Get_institution_jobs_by_Person_GUID', {
  //         personGUID: personResults.id
  //       });
  //     })
  //     .then(function (instJob) {
  //       // SOFT FAIL: job missing or incomplete
  //       if (!instJob) {
  //         clearEmployeeRelatedDetails();
  //         notify('warning', 'Employee found, but job details could not be retrieved.');
  //         return null; // stop optional work, but keep name/email
  //       }

  //       const posGUID = instJob.position && instJob.position.id;
  //       const supGUID = getPrimarySupervisor(instJob.supervisors);

  //       // Position/supervisor are optional, do not throw
  //       const posPromise = posGUID
  //         ? integration.all('Web_Ethos_Get_institution_positions_by_Position_GUID', { positionGUID: posGUID })
  //             .catch(function () { return null; })
  //         : Promise.resolve(null);

  //       const supPromise = supGUID
  //         ? integration.first('Web_Ethos_Get_Person_by_GUID', { personGUID: supGUID })
  //             .catch(function () { return null; })
  //         : Promise.resolve(null);

  //       return Promise.all([posPromise, supPromise]);
  //     })
  //     .then(function (results) {
  //       // If we returned null above, just exit quietly
  //       if (!results) return;

  //       const positionResult = results[0];
  //       const supervisorResult = results[1];

  //       if (positionResult && positionResult.title) {
  //         vm.position(positionResult.title + " | " + positionResult.code);
  //       } else {
  //         vm.position(''); // keep blank if missing
  //       }

  //       if (supervisorResult) {
  //         vm.supervisorName(getPreferredName(supervisorResult.names));
  //         vm.supervisorEmail(getPrimaryEmail(supervisorResult.emails));
  //       } else {
  //         vm.supervisorName('');
  //         vm.supervisorEmail('');
  //       }

  //       // Optional: if either missing, show a gentle warning (without sounding like an error)
  //       if (!positionResult || !supervisorResult) {
  //         notify('warning', 'Employee found, but some job details are unavailable.');
  //       }
  //     })
  //     .catch(function (error) {
  //       // Only hard-fail should land here in a way that clears everything
  //       if (error && error.type === 'EMPLOYEE_NOT_FOUND') return;

  //       // IMPORTANT: Do NOT clear employeeName/employeeEmail here
  //       clearEmployeeRelatedDetails();
  //       notify('warning', 'Employee found, but job details could not be fully loaded.');
  //     });
  // }
  //EDITING UI BASED ON STUDENT OR PT HOURLY SELECTED
  function applyPrimaryStatusUI(status) {
    const isStudentOrPTHourly = /^(student|pt hourly)$/i.test(
      (status || "").trim(),
    );

    // Hide OT column
    $("#weekList")
      .find("div[id^='OTHRrsCol'], div[name='OTHRrsCol']")
      .toggle(!isStudentOrPTHourly);

    // Update Reg Hours label (all rows)
    $("#weekList")
      .find("div[id^='col566'], div:has(input[id^='regHours'])")
      .find("label")
      .text(isStudentOrPTHourly ? "Hours" : "Reg Hrs");
  }

  return vm;
});
