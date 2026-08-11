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
  $(".developer").hide();
  $(".declineHide").hide();
  $(".appComments").hide();
  $(".addSectionCol").hide();

  // Form-scoped required indicators manager.
  // Safe to call before init. Calls to setRequired(...) queue until afterLoad runs init(vm).
  var requiredIndicators = formUtils.createRequiredIndicators();

  // Form-scoped autocomplete utility manager.
  // Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
  var autoCompleteUtils = formUtils.createAutoCompleteUtils();

  // GLOBAL SPINNER MANAGEMENT
  window.loadingCounter = 0;

  function showSpinner() {
    window.loadingCounter++;
    $(".loading").show();
  }

  function hideSpinner() {
    window.loadingCounter--;
    if (window.loadingCounter <= 0) {
      window.loadingCounter = 0;
      $(".loading").hide();
    }
  }

  vm.addObservableArray("AcademicPeriodsAutocomplete");
  vm.addObservableArray("RoomList");
  vm.addObservableArray("ChangeRoomList");
  vm.addObservableArray("SubjectsAutocomplete");
  vm.addObservableArray("SectionsAutocomplete");
  vm.addObservableArray("CourseSubjectAutocomplete");

  // vm.campus = ko.observable("");

  //Global Action
  vm.campus = ko.observable("");

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

  // $(window).on('error', function() {
  //   $('.loading').hide();
  // });

  // integration.all('EthosColleagueSections', {

  // }).then(function(data){ console.log("ETHOS COLLEAGUE SECTIONS", data)})

  vm.onLoad = function onLoad(source, inputValues) {
    //  This takes place after applyBindings has been called and has added input observables to the
    //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
    //  populating dropdowns, select options and other operations that need to take place every
    //  time the form is loaded.
    //hide all sections until "Action" is selected and section is shown in set.defaults
    $(".addSectionRow").hide();
    $(".cancelSectionRow").hide();
    $(".changeSectionRow").hide();

    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.
  };
  vm.setDefaults = function setDefaults(source, inputValues) {
    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    if (!pkg.isAtStep("Start")) {
      $("#selfOrElse").prop("disabled", true);
      autoCompleteUtils.makeReadOnly("eimployeeSearch");
      $("#employeeEmail").prop("readonly", true);
    }

    // Helper: format a single record (insert <br> right after "Room XXXX")
    function formatOneRecord(s) {
      if (!s) return "";
      // Insert a <br> after "Room <letters/numbers[-letters/numbers]...>"
      return s.replace(
        /(\bRoom\s+[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)(?=([,\s]|$))/g,
        "$1<br>",
      );
    }

    vm.meetingInfoHidden.subscribe(function (raw) {
      if (!raw) {
        vm.currentMeetingTimes("");
        return;
      }

      // Normalize weird separator (ý)
      const parts = String(raw).split(/\u00FD+/);

      // Function to insert a <br> after "Room ..." and before the first date
      function formatOneRecord(s) {
        if (!s) return "";

        // Add break before first date (e.g. 01/12/2026-05/04/2026)
        s = s.replace(
          /^(\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4})/,
          "<br>$1",
        );

        // Add break *after* Room
        s = s.replace(
          /(\bRoom\s+[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*)(?=([,\s]|$))/g,
          "$1",
        );

        return s;
      }

      // Format each piece and join with break between records
      const formatted = parts
        .map((p) => p && p.trim())
        .filter(Boolean)
        .map(formatOneRecord)
        .join("<br>");

      // Push formatted HTML to your Knockout binding
      vm.currentMeetingTimes(formatted);
    });

    if (!pkg.isAtStep("Start") && !pkg.isAtStep("ConditionalActorEmployee")) {
      $(".appComments").show();
    }

    vm.selectedTerm.subscribe((newValue) => {
      if (newValue) {
        let [year, season] = newValue.split("/"); // Split the term into year and season
        let startYear = parseInt(year, 10); // Parse the year part as an integer
        let academicYear;

        // Determine the academic year based on the term season
        if (season === "FA") {
          // Fall is part of the next academic year cycle
          academicYear = `${startYear}-${(startYear + 1).toString().slice(-2)}`;
        } else if (season === "WI" || season === "SU" || season === "AY") {
          // Winter and Summer are part of the current academic year cycle
          academicYear = `${startYear - 1}-${startYear.toString().slice(-2)}`;
        } else {
          // Handle unexpected input
          academicYear = "Invalid term";
        }

        // Update the academicYear observable
        vm.academicYear(academicYear);
      } else {
        vm.academicYear("");
      }
    });

    //GETTING ALL SUBJECTS
    showSpinner();
    integration
      .all("EthosColleagueSubjects", {
        // Add relevant parameters here
      })
      .then(function (subjectsResults) {
        subjectsResults.forEach(function (subjectsResultsDataRow) {
          if (subjectsResultsDataRow.showInCatalog === "Y") {
            // Push custom attributes into autocomplete
            vm.SubjectsAutocomplete.push({
              subjectAbbreviation: subjectsResultsDataRow.abbreviation,
              subjectGUID: subjectsResultsDataRow.id,
              subjectTitle: subjectsResultsDataRow.title,
            });
          }
        });
      })
      .catch(function (error) {
        console.log("Error in EthosColleagueSubjects:", error);
        notify("error", "There was an issue loading subjects.");
      })
      .finally(hideSpinner);

    //GETTING THE TERM
    showSpinner();
    integration
      .all("Web_Ethos_Get_Academic_Periods_by_endOn_Date", {
        logic: "$gte",
        endOnDate: dateManipulation(0),
      })
      .then(function (academicPeriodEndOnData) {
        var todayPlus365 = dateAddition(720);
        academicPeriodEndOnData.forEach(function (results) {
          if (results.endOn <= todayPlus365) {
            vm.AcademicPeriodsAutocomplete.push({
              termCode: results.code,
              termGUID: results.id,
              termTitle: results.title,
            });
          }
        });
      })
      .catch(function (error) {
        console.log("Error in Web Ethos Get Academic periods:", error);
        notify("error", "There was an issue loading subjects.");
      })
      .finally(hideSpinner);

    vm.action.subscribe(function (actionValue) {
      actionRowShow(actionValue);

      if (actionValue === "Add a Section") {
        vm.changeSecName("");
        vm.cancelSecName("");
        vm.cancelSynonym("");
      } else if (actionValue === "Cancel a Section") {
        vm.changeSecName("");
        vm.addSubject("");
        vm.addCourse("");
      } else if (actionValue === "Change a Section") {
        vm.cancelSecName("");
        vm.addSubject("");
        vm.addCourse("");
        vm.cancelSynonym("");
      }
    });

    function clearSelectedCourseBits() {
      vm.selectedSubject("");
      vm.selectedCourseNumber("");
      vm.selectedSection("");
    }

    function applySectionToSelectedCourseBits(secName) {
      const parts = String(secName || "").split(/-/);
      vm.selectedSubject(parts[0] || "");
      vm.selectedCourseNumber(parts[1] || "");
      vm.selectedSection(parts[2] || "");
    }

    vm.cancelSecName.subscribe(function (newValue) {
      if (!newValue) {
        clearSelectedCourseBits();
        return;
      }
      if (!sectionExistsInAutocomplete(newValue)) {
        clearSelectedCourseBits();
        return;
      }
      applySectionToSelectedCourseBits(newValue);
    });

    vm.changeSecName.subscribe(function (newValue) {
      if (!newValue) {
        clearSelectedCourseBits();
        return;
      }
      if (!sectionExistsInAutocomplete(newValue)) {
        clearSelectedCourseBits();
        return;
      }
      applySectionToSelectedCourseBits(newValue);
    });

    vm.addSubject.subscribe(function (newValue) {
      vm.selectedSubject(newValue);
    });

    vm.addCourse.subscribe(function (newValue) {
      vm.selectedCourseNumber(newValue);
    });

    //POPULATING SECTION BASED ON TERM AND CAMPUS
    ko.computed(function () {
      var term = vm.academicPeriodGuid();
      var campus = vm.campus(); // <-- THIS is the filtering key

      // RUN ONLY WHEN BOTH ARE SELECTED
      if (!term || !campus) {
        return;
      }

      showSpinner();

      integration
        .all("Web_Custom_Sections", { termGUID: term })
        .then(function (WebSections) {
          vm.SectionsAutocomplete([]);

          var sections = WebSections;

          // filtered groups
          var filteredAuburn = [];
          var filteredRoyalOakSouthfield = [];
          var filteredHighlandLakes = [];
          var filteredOrchardRidge = [];

          function getCampusGroup(letter) {
            letter = letter.toUpperCase();

            if (["A", "D", "X", "Y", "Z"].includes(letter)) return "AUBURN";
            if (["R", "S"].includes(letter)) return "ROSF";
            if (letter === "H") return "HIGHLAND";
            if (letter === "O") return "ORCHARD";
            return "UNKNOWN";
          }

          sections.forEach(function (SectionRow) {
            var code = SectionRow.secName;
            var lastPart = code.split("-").pop();
            var firstChar = lastPart.charAt(0);
            var sectionCampus = getCampusGroup(firstChar);
            switch (sectionCampus) {
              case "AUBURN":
                filteredAuburn.push(SectionRow);
                break;
              case "ROSF":
                filteredRoyalOakSouthfield.push(SectionRow);
                break;
              case "HIGHLAND":
                filteredHighlandLakes.push(SectionRow);
                break;
              case "ORCHARD":
                filteredOrchardRidge.push(SectionRow);
                break;
            }
          });

          var finalList = [];

          // CAMPUS COMPARISON FIXED HERE
          if (campus === "Auburn Hills") {
            finalList = filteredAuburn;
          } else if (campus === "Royal Oak/Southfield") {
            finalList = filteredRoyalOakSouthfield;
          } else if (campus === "Highland Lakes") {
            finalList = filteredHighlandLakes;
          } else if (campus === "Orchard Ridge") {
            finalList = filteredOrchardRidge;
          } else {
            finalList = sections;
          }
          finalList.forEach(function (SectionRow) {
            vm.SectionsAutocomplete.push({
              ...SectionRow,
            });
          });
        })
        .catch(function (err) {
          console.log("Failed to load sections.", err);
          notify("error", "Failed to load sections.");
        })
        .finally(hideSpinner);
    });

    vm.addBuildingGUID.subscribe(function (newValue) {
      showSpinner();
      integration
        .all("Web_Ethos_Get_Rooms_filtered_by_Building", {
          buildingGUID: vm.addBuildingGUID(),
        })
        .then(function (Rooms) {
          //loop through Results to create the Rooms list:
          Rooms.forEach(function (Results) {
            // create list of Rooms
            vm.RoomList.push({
              RoomNumber: Results.number,
              RoomDescription: Results.description,
            });
          });
        })
        .catch(function (err) {
          console.log("Failed to load Rooms.", err);
        })
        .finally(hideSpinner);
    });

    vm.newBuildingGUID.subscribe(function (newValue) {
      showSpinner();
      integration
        .all("Web_Ethos_Get_Rooms_filtered_by_Building", {
          buildingGUID: vm.newBuildingGUID(),
        })
        .then(function (ChangeRooms) {
          //loop through Results to create the Rooms list:
          ChangeRooms.forEach(function (Results) {
            // create list of Rooms
            vm.ChangeRoomList.push({
              RoomNumber: Results.number,
              RoomDescription: Results.description,
            });
          });
        })
        .catch(function (err) {
          console.log("Failed to Filtered Room by Building List.", err);
        })
        .finally(hideSpinner);
    });

    vm.addSubjectID.subscribe(function (newVal) {
      // empty previous results

      vm.CourseSubjectAutocomplete([]);
      vm.addCourse(undefined);

      // only run this if the subject was selected
      if (newVal) {
        showSpinner();
        getAllDataFromPagingSource(
          "Web_Sources_Get_Courses_by_SubjectGUID",
          newVal,
          100,
        )
          .then((listOfCoursesBySubjectData) => {
            // loop through the results
            listOfCoursesBySubjectData.forEach(
              function (listOfCoursesBySubjectDataRow) {
                if (
                  listOfCoursesBySubjectDataRow.status.id ===
                    "73c76722-884e-43e9-b093-8ebe092c045f" &&
                  listOfCoursesBySubjectDataRow.credits[0].creditCategory
                    .creditType === "institution"
                ) {
                  // push custom attributes into autocomplete
                  vm.CourseSubjectAutocomplete.push({
                    courseTitle: listOfCoursesBySubjectDataRow.titles[0].value,
                    courseNumber: listOfCoursesBySubjectDataRow.number,
                    courseSubjectAndNumber:
                      vm.addSubject() +
                      " " +
                      listOfCoursesBySubjectDataRow.number,
                  });
                }
              },
            );
          })
          .catch((error) => {
            console.log("Failed to load CourseSubjectAutocomplete", error);
          })
          .finally(hideSpinner);
      }
    });

    vm.addInstructionalMethod.subscribe(function (newValue) {
      if (
        newValue === "Hybrid" ||
        newValue === "In-Person" ||
        newValue === "Online Course with in-person Testing"
      ) {
        requiredIndicators.setRequired("addStartTime", true);
        requiredIndicators.setRequired("addEndTime", true);
        requiredIndicators.setRequired("addRoom", true);
      } else if (
        newValue === "Flexible Live" ||
        newValue === "Flexible Online" ||
        newValue === "Online Live Course"
      ) {
        requiredIndicators.setRequired("addStartTime", true);
        requiredIndicators.setRequired("addEndTime", true);
        requiredIndicators.setRequired("addRoom", false);
      } else {
        requiredIndicators.setRequired("addStartTime", false);
        requiredIndicators.setRequired("addEndTime", false);
        requiredIndicators.setRequired("addRoom", false);
      }
    });

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    if (user.isInLibrary || user.isInDrafts) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.
      vm.semester.subscribe(function (semest) {
        //When we select a new semester, we want to erase the previous selections
        if (semest) {
          vm.action("");

          vm.addSubject("");
          vm.addCourse("");

          vm.changeSecName("");
          vm.currentSynonym("");

          vm.cancelSecName("");
          vm.cancelSynonym("");
        }
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
    // This replays any queued setRequired(...) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    // Initialize autocomplete utilities after VM bindings are ready.
    // Replays any queued makeReadOnly/makeEditable calls made earlier.
    autoCompleteUtils.init(vm);

    // Toggle export mode styling and behavior.
    // Hides required indicators/notes and normalizes readonly presentation for export.
    autoCompleteUtils.setExportMode(pkg.isExporting);

    if (vm.action()) {
      actionRowShow(vm.action());
    }

    ko.computed(() => {
      if (vm.selfOrElse()) {
        if (vm.selfOrElse() === "Myself") {
          if (vm.deanEmail()) {
            if (
              vm.deanEmail().toUpperCase() == vm.originatorEmail().toUpperCase()
            ) {
              vm.skipDean("Yes");
            } else {
              vm.skipDean("No");
            }
          } else {
            vm.skipDean("Yes");
          }

          if (vm.departmentChairEmail()) {
            if (
              vm.departmentChairEmail().toUpperCase() ==
              vm.originatorEmail().toUpperCase()
            ) {
              vm.skipDepartmentChair("Yes");
            } else {
              vm.skipDepartmentChair("No");
            }
          } else {
            vm.skipDepartmentChair("Yes");
          }
        } else if (vm.selfOrElse() === "On Behalf of Someone Else") {
          if (vm.deanEmail()) {
            if (
              vm.deanEmail().toUpperCase() == vm.employeeEmail().toUpperCase()
            ) {
              vm.skipDean("Yes");
            } else {
              vm.skipDean("No");
            }
          } else {
            vm.skipDean("Yes");
          }

          if (vm.departmentChairEmail()) {
            if (
              vm.departmentChairEmail().toUpperCase() ==
              vm.employeeEmail().toUpperCase()
            ) {
              vm.skipDepartmentChair("Yes");
            } else {
              vm.skipDepartmentChair("No");
            }
          } else {
            vm.skipDepartmentChair("Yes");
          }
        }
      } else {
        vm.skipDean("No");
        vm.skipDepartmentChair("No");
      }
    });

    ko.computed(function () {
      if (vm.selectedSubject() && vm.campus()) {
        integration
          .first("Get_Academic_Routing_Data", {
            subject: vm.selectedSubject(),
            campus: vm.campus(),
          })
          .then(function (RoutingData) {
            vm.deanEmail(RoutingData.Dean_Email);
            vm.departmentChairEmail(RoutingData.Department_Chair_Email);
            vm.administrativeSpecialistEmail(
              RoutingData.Administrative_Specialist_Email,
            );
          });
      }
    });

    if (pkg.isAtStep("ConditionalActorGetAdministrativeSpecialist")) {
      $(document).ready(function () {
        setTimeout(function () {
          // Disable the semester input field
          $("#semester").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#semester").css("cursor", "not-allowed");

          // Disable the addSubject input field
          $("#addSubject").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#addSubject").css("cursor", "not-allowed");

          // Disable the addCourse input field
          $("#addCourse").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#addCourse").css("cursor", "not-allowed");

          // Disable the  input field
          $("#addBuilding").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#addBuilding").css("cursor", "not-allowed");

          // Disable the addRoom input field
          $("#addRoom").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#addRoom").css("cursor", "not-allowed");

          // Disable the cancelSecName input field
          $("#cancelSecName").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#cancelSecName").css("cursor", "not-allowed");

          // Disable the changeSecName input field
          $("#changeSecName").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#changeSecName").css("cursor", "not-allowed");

          // Disable the newBuilding input field
          $("#newBuilding").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#newBuilding").css("cursor", "not-allowed");

          // Disable the newRoom input field
          $("#newRoom").prop("disabled", true);
          // Change cursor to 'not-allowed' or 'default' on mouse-over
          $("#newRoom").css("cursor", "not-allowed");

          // Diasable all inputs on the form
          $(":input").prop("disabled", true);

          // Re-enable specific ones
          $("#sectionNumber, #addSynonym, #approvalComments").prop(
            "disabled",
            false,
          );
        }, 2000); // Adjust the timeout as necessary
      });
    }

    // //Check the term and make sure that the current date isn't after the term active date in the utility table
    ko.computed(() => {
      if (
        (user.isInLibrary || user.isInDrafts) &&
        vm.selectedTerm() &&
        vm.action() === "Change a Section"
      ) {
        if (vm.selectedTerm().endsWith("/AY")) {
          vm.allowSectionChange("Yes");
          $(".changeSectionRow").show();
        } else {
          showSpinner();
          integration
            .first("FS_Get_Active_Term_Date_by_Term_Code", {
              termCode: vm.selectedTerm(),
            })
            .then((termDate) => {
              // Convert termDate string to a Date object
              var parts = termDate.TermActiveDate.split("/");
              var termDateObj = new Date(parts[2], parts[0] - 1, parts[1]); // year, month (0-based), day

              // Get today's date without time portion
              var today = new Date();
              today.setHours(0, 0, 0, 0);

              // Compare dates
              if (today >= termDateObj) {
                vm.allowSectionChange("No");
                notify(
                  "error",
                  "Section changes can no longer be made for this term, as it is already active. To make an update, please cancel the original section and add a new one.",
                );
                $(".changeSectionRow").hide();
              } else {
                vm.allowSectionChange("Yes");
                $(".changeSectionRow").show();
              }
            })
            .catch(function (error) {
              console.log("Error Section Change by active term", error);
            })
            .finally(hideSpinner);
        }
      }
    });

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
  };

  vm.onApprove = function onApprove(form) {
    //  This method is called when the Approve button is clicked and before calling beforeRequired.
  };

  vm.onDecline = function onDecline(form) {
    //  This method is called when the Decline button is clicked and before calling beforeRequired.

    $(".declineHide").show();

    if (
      pkg.isAtStep("ConditionalActorGetDean") ||
      pkg.isAtStep("ConditionalActorDepartmentChair")
    ) {
      if (vm.reasonForDecline()) {
        return true;
      } else {
        $("#reasonForDecline").prop("required", true);
        throw new Error(
          "Please enter a reason for declining at the bottom of the form and click Decline again to move the form along in the workflow.",
        );
      }
    }
  };

  function normalizeSectionName(s) {
    return String(s || "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  function sectionExistsInAutocomplete(secName) {
    const target = normalizeSectionName(secName);
    if (!target) return false;

    const list = vm.SectionsAutocomplete ? vm.SectionsAutocomplete() : [];
    return list.some((r) => normalizeSectionName(r && r.secName) === target);
  }

  function requireValidSection(secName, labelForError) {
    if (!secName) {
      throw new Error(`${labelForError} is required.`);
    }
    if (!sectionExistsInAutocomplete(secName)) {
      throw new Error(
        `${labelForError} must be selected from the list. ` +
          `Start typing, then click a matching option.`,
      );
    }
  }

  vm.beforeRequired = function beforeRequired(form) {
    requiredIndicators.applyNativeRequiredForValidation();
    //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
    const action = vm.action && vm.action();
    try {
      // Only enforce for the actions that use the section picker fields.
      if (action === "Change a Section") {
        // changeSecName is required in HTML, but this makes it "must match dataset".
        requireValidSection(
          vm.changeSecName && vm.changeSecName(),
          "Section Name (Change)",
        );
      }

      if (action === "Cancel a Section") {
        // cancelSecName is required in HTML, but this makes it "must match dataset"
        requireValidSection(
          vm.cancelSecName && vm.cancelSecName(),
          "Section Name (Cancel)",
        );
      }

      return true;
    } catch (error) {
      requiredIndicators.clearNativeRequired();
      throw error;
    }
  };

  vm.afterRequired = function afterRequired(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
    requiredIndicators.clearNativeRequired();

    if (pkg.isAtStep("ConditionalActorGetAdministrativeSpecialist")) {
      synonymAcordingToAction(vm.action());
      if (vm.action()) {
        actionRowShow(vm.action());
      }
    }

    //ensuring at least one checkbox from meeting day(s) is checked (when adding a course)
    let instructionalMethodAddCourse = vm.addInstructionalMethod();

    if (
      pkg.isAtStep("Start") &&
      (instructionalMethodAddCourse === "In-Person" ||
        instructionalMethodAddCourse === "Online Live Course" ||
        instructionalMethodAddCourse === "Flexible Online" ||
        instructionalMethodAddCourse === "Flexible Live")
    ) {
      const checkboxes = $('input[type="checkbox"][id^="add"]');
      const oneChecked = checkboxes.is(":checked");
      if (!oneChecked) {
        notify("warning", "Please select at least one Meeting Day!");
        throw Error;
      }
    }
    $(".loading").hide();
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  function synonymAcordingToAction(actionValue) {
    switch (actionValue) {
      case "Add a Section":
        vm.synonymHidden(vm.addSynonym());
        break;

      case "Cancel a Section":
        vm.synonymHidden(vm.cancelSynonym());
        break;

      case "Change a Section":
        vm.synonymHidden(vm.currentSynonym());
        break;
    }
  }

  function actionRowShow(actionValue) {
    switch (actionValue) {
      case "Add a Section":
        $(".addSectionRow").show();
        $(".cancelSectionRow").hide();
        $(".changeSectionRow").hide();
        if (
          pkg.isAtStep("ConditionalActorGetAdministrativeSpecialist") ||
          pkg.isAtStep("End")
        ) {
          $(".addSectionCol").show();
          requiredIndicators.setRequired("sectionNumber", true);
          requiredIndicators.setRequired("addSynonym", true);
        }
        break;

      case "Cancel a Section":
        $(".addSectionRow").hide();
        $(".cancelSectionRow").show();
        $(".changeSectionRow").hide();
        break;

      case "Change a Section":
        $(".addSectionRow").hide();
        $(".cancelSectionRow").hide();
        $(".changeSectionRow").show();
        break;

      default:
        $(".addSectionRow").hide();
        $(".cancelSectionRow").hide();
        $(".changeSectionRow").hide();
        break;
    }
  }

  function dateManipulation(days) {
    var date = new Date();
    date.setDate(date.getDate() + days);
    var year = date.getFullYear();
    var month = (date.getMonth() + 1).toString().padStart(2, "0");
    var day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateAddition(days) {
    var date = new Date();
    date.setDate(date.getDate() + days);
    var year = date.getFullYear();
    var month = (date.getMonth() + 1).toString().padStart(2, "0");
    var day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}T00:00:00Z`;
  }

  function getAllDataFromPagingSource(integrationCode, SubjectGUID, paging) {
    let offset = 0;
    let allData = [];
    return new Promise((resolve, reject) => {
      function getData() {
        integration
          .all(integrationCode, {
            SubjectGUID: SubjectGUID,
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

  return vm;
});
