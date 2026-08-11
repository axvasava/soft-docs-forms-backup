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
  var fieldStateUtils = formUtils.createFieldStateUtils();

  $(".approvalRow").hide();
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

  /* =========================
	   DATE HELPERS
	========================== */

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

  /* =========================
	   UI HELPERS
	========================== */

  function showSpinner() {
    $("#loading").show();
  }

  function hideSpinner() {
    $("#loading").hide();
  }

  function toggleRequiredLabel(fieldId, isRequired) {
    var label = $('label[for="' + fieldId + '"]');

    if (!label.length) return;

    label.find(".required-asterisk").remove();

    if (isRequired) {
      label.append('<span class="required-asterisk">&nbsp;*</span>');
    }
  }

  function syncRequiredLabel(fieldId, fieldObservable) {
    if (!fieldObservable) return;

    toggleRequiredLabel(fieldId, !!fieldObservable.required);
  }

  function setFieldRequired(fieldId, fieldObservable, isRequired) {
    if (!fieldObservable) return;

    fieldObservable.required = isRequired;
    syncRequiredLabel(fieldId, fieldObservable);
  }

  function hideIsHiddenElements() {
    $(".isHidden").each(function () {
      $(this).hide().attr("aria-hidden", "true");
    });
  }

  function notifyIfEmpty(items, emptyMessage, title, cacheKey, cacheValue) {
    var safeItems = items || [];
    var shouldNotify = safeItems.length === 0;

    if (!shouldNotify) {
      if (cacheKey) {
        vm[cacheKey] = null;
      }
      return;
    }

    if (cacheKey) {
      if (vm[cacheKey] === cacheValue) {
        return;
      }
      vm[cacheKey] = cacheValue;
    }

    notify("warning", emptyMessage, title || "No Results Found");
  }

  function isAddActionSelected() {
    return vm.action && vm.action() === "Add a Section";
  }

  function isAddAdministrativeReviewStep() {
    return (
      pkg.isAtStep("ConditionalActorGetAdministrativeSpecialist") ||
      pkg.isAtStep("End")
    );
  }

  function isAdministrativeSpecialistReviewStep() {
    return pkg.isAtStep("ConditionalActorGetAdministrativeSpecialist");
  }

  function syncAdministrativeSpecialistReadOnlyState() {
    var isLocked = isAdministrativeSpecialistReviewStep();

    $(":input").prop("disabled", isLocked);

    if (isLocked) {
      $("#sectionNumber, #addSynonym, #approvalComments").prop(
        "disabled",
        false,
      );
    }
  }

  function syncAddStepSpecificState() {
    var shouldShowAddSectionCol =
      isAddActionSelected() && isAddAdministrativeReviewStep();

    $(".addSectionCol").toggle(shouldShowAddSectionCol);

    setFieldRequired(
      "sectionNumber",
      vm.sectionNumber,
      shouldShowAddSectionCol,
    );
    setFieldRequired("addSynonym", vm.addSynonym, shouldShowAddSectionCol);
  }

  function syncAddSectionDetailsVisibility() {
    var shouldShow =
      isAddActionSelected() &&
      !!(vm.addSubject && vm.addSubject()) &&
      !!(vm.addCourse && vm.addCourse());

    $(".addSectionDetails").toggle(shouldShow);
  }

  function isCancelActionSelected() {
    return vm.action && vm.action() === "Cancel a Section";
  }

  function syncCancelStepSpecificState() {
    var shouldShowCancelSectionRow = isCancelActionSelected();

    $(".cancelSectionRow").toggle(shouldShowCancelSectionRow);
  }

  function isChangeActionSelected() {
    return vm.action && vm.action() === "Change a Section";
  }

  function syncChangeStepSpecificState() {
    var shouldShowChangeSectionRow =
      isChangeActionSelected() && vm.allowSectionChange() !== false;

    $(".changeSectionRow").toggle(shouldShowChangeSectionRow);
  }

  function syncChangeSelectionState(sectionName) {
    if (!sectionName) {
      clearSelectedCourseBits();
      clearSelectedSectionDetails();
      return;
    }

    applySectionToSelectedCourseBits(sectionName);
    applySectionDetails(sectionName);
  }

  function syncAllStepSpecificUiState() {
    syncAddStepSpecificState();
    syncCancelStepSpecificState();
    syncChangeStepSpecificState();
    syncAdministrativeSpecialistReadOnlyState();
    syncAddSectionDetailsVisibility();
  }

  function validateChangeSection() {
    if (!(vm.action && vm.action() === "Change a Section")) {
      return true;
    }

    if (vm.allowSectionChange() === false) {
      throw new Error(
        "Section changes can no longer be made for this term. Please cancel the section and add a new one.",
      );
    }

    requireValidSection(vm.changeSecName && vm.changeSecName(), "Section Name");

    return true;
  }

  function instructionalMethodRequiresChangeMeetingDays(instructionalMethod) {
    return (
      instructionalMethod === "Online Live Course" ||
      instructionalMethod === "Flexible Online" ||
      instructionalMethod === "Flexible Live"
    );
  }

  function validateChangeMeetingDays() {
    var actionValue = vm.action ? vm.action() : "";
    var instructionalMethod = vm.newInstructionalMethod
      ? vm.newInstructionalMethod()
      : "";
    var changeOneChecked;

    if (actionValue !== "Change a Section") {
      return true;
    }

    if (!pkg.isAtStep("Start")) {
      return true;
    }

    if (!instructionalMethodRequiresChangeMeetingDays(instructionalMethod)) {
      return true;
    }

    changeOneChecked = $('input[type="checkbox"][id^="new"]').is(":checked");

    if (!changeOneChecked) {
      notify("warning", "Please select at least one Meeting Day!");
      throw new Error("Please select at least one Meeting Day.");
    }

    return true;
  }

  function instructionalMethodRequiresAddMeetingDays(instructionalMethod) {
    return (
      instructionalMethod === "In-Person" ||
      instructionalMethod === "Online Live Course" ||
      instructionalMethod === "Flexible Online" ||
      instructionalMethod === "Flexible Live"
    );
  }

  function validateAddMeetingDays() {
    var actionValue = vm.action ? vm.action() : "";
    var instructionalMethod = vm.addInstructionalMethod
      ? vm.addInstructionalMethod()
      : "";
    var addOneChecked;

    if (actionValue !== "Add a Section") {
      return true;
    }

    if (!pkg.isAtStep("Start")) {
      return true;
    }

    if (!instructionalMethodRequiresAddMeetingDays(instructionalMethod)) {
      return true;
    }

    addOneChecked = $('input[type="checkbox"][id^="add"]').is(":checked");

    if (!addOneChecked) {
      notify("warning", "Please select at least one Meeting Day!");
      throw new Error("Please select at least one Meeting Day.");
    }

    return true;
  }

  function syncCancelSelectionState(sectionName) {
    if (!sectionName) {
      clearSelectedCourseBits();
      return;
    }

    applySectionToSelectedCourseBits(sectionName);
  }

  function syncEmployeeSearchRequiredState() {
    var isRequired = vm.isOnBehalfMode && vm.isOnBehalfMode();

    setFieldRequired("employeeSearch", vm.employeeSearch, isRequired);

    if (!isRequired && vm.employeeSearch) {
      vm.employeeSearch("");
    }
  }

  function syncTotalCost() {
    var bookCost = parseFloat(vm.addBookCost && vm.addBookCost()) || 0;
    var taxesChecked = vm.addTaxesCheckBox && vm.addTaxesCheckBox();

    var taxes = taxesChecked ? bookCost * 0.06 : 0;
    var total = bookCost + taxes;

    if (vm.addTaxes) {
      vm.addTaxes(taxes.toFixed(2));
    }

    if (vm.totalCost) {
      vm.totalCost(total.toFixed(2));
    }
  }

  function safeUpper(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }

  function isSelfOrElseSkipStep() {
    return pkg.isAtStep("Start") || pkg.isAtStep("ConditionalActorEmployee");
  }

  function getSkipComparisonEmail() {
    var mode = vm.selfOrElse ? vm.selfOrElse() : "";

    var comparisonEmailByMode = {
      Myself: vm.originatorEmail ? vm.originatorEmail() : "",
      "On Behalf of Someone Else": vm.employeeEmail ? vm.employeeEmail() : "",
    };

    return comparisonEmailByMode[mode] || "";
  }

  function getApproverSkipValue(approverEmail, comparisonEmail) {
    var normalizedApprover = safeUpper(approverEmail);
    var normalizedComparison = safeUpper(comparisonEmail);

    if (!normalizedApprover) {
      return "Yes";
    }

    if (!normalizedComparison) {
      return "No";
    }

    return normalizedApprover === normalizedComparison ? "Yes" : "No";
  }

  function syncSelfOrElseSkipLogic() {
    var mode = vm.selfOrElse ? vm.selfOrElse() : "";
    var comparisonEmail;

    if (!isSelfOrElseSkipStep()) {
      if (vm.skipDean) vm.skipDean("No");
      if (vm.skipDepartmentChair) vm.skipDepartmentChair("No");
      return;
    }

    if (!mode) {
      if (vm.skipDean) vm.skipDean("No");
      if (vm.skipDepartmentChair) vm.skipDepartmentChair("No");
      return;
    }

    comparisonEmail = getSkipComparisonEmail();

    [
      { approver: "deanEmail", skip: "skipDean" },
      { approver: "departmentChairEmail", skip: "skipDepartmentChair" },
    ].forEach(function (config) {
      if (!vm[config.skip]) return;

      var approverEmail = vm[config.approver] ? vm[config.approver]() : "";
      vm[config.skip](getApproverSkipValue(approverEmail, comparisonEmail));
    });
  }

  function validateCancelSection() {
    if (!isCancelActionSelected()) {
      return true;
    }

    requireValidSection(vm.cancelSecName && vm.cancelSecName(), "Section Name");

    return true;
  }

  /* =========================
		INTEGRATION HELPERS
	========================== */

  function getAllPagedResults(integrationCode, params, pageSize) {
    var offset = 0;
    var allResults = [];
    var effectivePageSize = pageSize || 100;

    function fetchPage() {
      var requestParams = Object.assign({}, params, {
        offsetInt: offset,
      });

      return integration
        .all(integrationCode, requestParams)
        .then(function (results) {
          var pageResults = results || [];

          if (!pageResults.length) {
            return allResults;
          }

          allResults = allResults.concat(pageResults);
          offset += effectivePageSize;

          return fetchPage();
        });
    }

    return fetchPage();
  }

  /* =========================
		TERM HELPERS
	========================== */

  function getAcademicYearFromTerm(termCode) {
    if (!termCode) return "";

    var parts = termCode.split("/");
    if (parts.length !== 2) return "";

    var year = parts[0];
    var season = parts[1];
    var startYear = parseInt(year, 10);

    if (Number.isNaN(startYear)) return "";

    if (season === "FA") {
      return startYear + "-" + String(startYear + 1).slice(-2);
    }

    if (season === "WI" || season === "SU" || season === "AY") {
      return startYear - 1 + "-" + String(startYear).slice(-2);
    }

    return "";
  }

  function mapAcademicPeriod(term) {
    return {
      termCode: term.code,
      termGUID: term.id,
      termTitle: term.title,
      displayText: term.code + " | " + term.title,
    };
  }

  function isSelectableAcademicPeriod(term, maxEndOn) {
    return !!term && !!term.endOn && term.endOn <= maxEndOn;
  }

  function findAcademicPeriodByCode(terms, termCode) {
    if (!Array.isArray(terms) || !termCode) return null;

    return (
      terms.find(function (term) {
        return term.termCode === termCode;
      }) || null
    );
  }

  function findAcademicPeriodByGuid(terms, termGUID) {
    if (!Array.isArray(terms) || !termGUID) return null;

    const academicPeriod =
      terms.find(function (term) {
        return term.termGUID === termGUID;
      }) || null;

    return academicPeriod;
  }

  function normalizeAcademicPeriodSelection(selection, terms) {
    if (!selection) return null;

    if (
      typeof selection === "object" &&
      selection.termCode &&
      selection.termGUID
    ) {
      return selection;
    }

    if (typeof selection === "string") {
      return (
        findAcademicPeriodByCode(terms, selection) ||
        findAcademicPeriodByGuid(terms, selection)
      );
    }

    return null;
  }

  function loadAcademicPeriods() {
    showSpinner();

    return integration
      .all("Web_Ethos_Get_Academic_Periods_by_endOn_Date", {
        logic: "$gte",
        endOnDate: dateManipulation(0),
      })
      .then(function (results) {
        var maxEndOn = dateAddition(720);

        return results
          .filter(function (term) {
            return (
              isSelectableAcademicPeriod(term, maxEndOn) &&
              term.code &&
              !term.code.endsWith("/AY")
            );
          })
          .map(mapAcademicPeriod);
      })
      .catch(function (error) {
        console.log("Error in Web Ethos Get Academic periods:", error);
        notify("error", "There was an issue loading terms", "Loading Error");
        return [];
      })
      .finally(hideSpinner);
  }

  /* =========================
		ADD SECTION HELPERS
	========================== */

  function loadSubjects() {
    showSpinner();

    return integration
      .all("EthosColleagueSubjects", {})
      .then(function (results) {
        var mappedSubjects = (results || [])
          .filter(function (subject) {
            return subject && subject.showInCatalog === "Y";
          })
          .map(function (subject) {
            return {
              subjectAbbreviation: subject.abbreviation,
              subjectGUID: subject.id,
              subjectTitle: subject.title,
            };
          });

        vm.subjectsAutocomplete(mappedSubjects);
        return mappedSubjects;
      })
      .catch(function (error) {
        console.log("Error loading subjects:", error);
        notify(
          "error",
          "There was an issue loading subjects.",
          "Loading Error",
        );
        vm.subjectsAutocomplete([]);
        return [];
      })
      .finally(hideSpinner);
  }

  // TODO_FIX: getting 403 when trying to call it here. Works fine from builder
  // function loadActiveEmployees() {
  //     showSpinner();

  //     return integration.all('Etrieve_Security_Get_Active_Employees', {})
  //         .then(function (results) {
  //             var mappedEmployees = (results || []).map(function (employee) {
  //                 return {
  //                     displayName: employee.DisplayName || '',
  //                     email: employee.Email || '',
  //                     userName: employee.UserName || ''
  //                 };
  //             });

  //             vm.employeeSearchAutoComplete(mappedEmployees);
  //             return mappedEmployees;
  //         })
  //         .catch(function (error) {
  //             console.log('Error loading active employees:', error);
  //             notify('error', 'There was an issue loading employees.', 'Loading Error');
  //             vm.employeeSearchAutoComplete([]);
  //             return [];
  //         })
  //         .finally(hideSpinner);
  // }

  function loadCoursesForSelectedAddSubject(subjectGUID) {
    vm.courseSubjectAutocomplete([]);
    if (vm.addCourse) {
      vm.addCourse("");
    }

    if (!subjectGUID) {
      return Promise.resolve([]);
    }

    showSpinner();

    return getAllPagedResults(
      "Web_Sources_Get_Courses_by_SubjectGUID",
      { SubjectGUID: subjectGUID },
      100,
    )
      .then(function (results) {
        var selectedSubject = vm.addSubject ? vm.addSubject() : "";

        var mappedCourses = (results || [])
          .filter(function (course) {
            return (
              course &&
              course.status &&
              course.status.id === "73c76722-884e-43e9-b093-8ebe092c045f" &&
              course.credits &&
              course.credits[0] &&
              course.credits[0].creditCategory &&
              course.credits[0].creditCategory.creditType === "institution"
            );
          })
          .map(function (course) {
            return {
              courseTitle:
                course.titles && course.titles[0] ? course.titles[0].value : "",
              courseNumber: course.number || "",
              courseSubjectAndNumber:
                selectedSubject + " " + (course.number || ""),
            };
          });

        notifyIfEmpty(
          mappedCourses,
          "No courses are available for " +
            (selectedSubject || "the selected subject") +
            ".",
          "No Courses Found",
          "_lastNoCourseSubject",
          subjectGUID,
        );

        vm.courseSubjectAutocomplete(mappedCourses);
        return mappedCourses;
      })
      .catch(function (error) {
        console.log("Failed to load courseSubjectAutocomplete", error);
        notify("error", "There was an issue loading courses.", "Loading Error");
        vm.courseSubjectAutocomplete([]);
        return [];
      })
      .finally(hideSpinner);
  }

  function loadBuildings() {
    showSpinner();

    return integration
      .all("Web_Ethos_Get_Buildings", {})
      .then(function (results) {
        var mappedBuildings = (results || []).map(function (building) {
          return {
            code: building.code || "",
            title: building.title || "",
            id: building.id || "",
          };
        });

        vm.buildingAutocomplete(mappedBuildings);
        return mappedBuildings;
      })
      .catch(function (error) {
        console.log("Error loading buildings:", error);
        notify(
          "error",
          "There was an issue loading buildings.",
          "Loading Error",
        );
        vm.buildingAutocomplete([]);
        return [];
      })
      .finally(hideSpinner);
  }

  function mapRooms(results) {
    return (results || []).map(function (room) {
      return {
        RoomNumber: room.number || "",
        RoomDescription: room.description || "",
      };
    });
  }

  function loadRoomsForAddBuilding(buildingGUID) {
    vm.roomAutoComplete([]);

    if (vm.addRoom) {
      vm.addRoom("");
    }

    if (!buildingGUID) {
      return Promise.resolve([]);
    }

    showSpinner();

    return integration
      .all("Web_Ethos_Get_Rooms_filtered_by_Building", {
        buildingGUID: buildingGUID,
      })
      .then(function (results) {
        var mappedRooms = (results || []).map(function (room) {
          return {
            RoomNumber: room.number || "",
            RoomDescription: room.description || "",
          };
        });

        notifyIfEmpty(
          mappedRooms,
          "No rooms are available for " + getSelectedAddBuildingDisplay() + ".",
          "No Rooms Found",
          "_lastNoRoomBuilding",
          buildingGUID,
        );

        vm.roomAutoComplete(mappedRooms);
        return mappedRooms;
      })
      .catch(function (error) {
        console.log("Failed to load roomAutoComplete.", error);
        notify("error", "There was an issue loading rooms.", "Loading Error");
        vm.roomAutoComplete([]);
        return [];
      })
      .finally(hideSpinner);
  }

  function loadRoomsForChangeBuilding(buildingGUID) {
    if (vm.changeRoomAutoComplete) {
      vm.changeRoomAutoComplete([]);
    }

    if (vm.newRoom) {
      vm.newRoom("");
    }

    if (!buildingGUID) {
      return Promise.resolve([]);
    }

    showSpinner();

    return integration
      .all("Web_Ethos_Get_Rooms_filtered_by_Building", {
        buildingGUID: buildingGUID,
      })
      .then(function (results) {
        var mappedRooms = mapRooms(results);

        notifyIfEmpty(
          mappedRooms,
          "No rooms are available for " +
            getSelectedChangeBuildingDisplay() +
            ".",
          "No Rooms Found",
          "_lastNoChangeRoomBuilding",
          buildingGUID,
        );

        if (vm.changeRoomAutoComplete) {
          vm.changeRoomAutoComplete(mappedRooms);
        }

        return mappedRooms;
      })
      .catch(function (error) {
        console.log("Failed to load changeRoomAutoComplete.", error);
        notify("error", "There was an issue loading rooms.", "Loading Error");

        if (vm.changeRoomAutoComplete) {
          vm.changeRoomAutoComplete([]);
        }

        return [];
      })
      .finally(hideSpinner);
  }

  function getSelectedAddBuildingDisplay() {
    var buildingCode = vm.addBuilding ? vm.addBuilding() : "";
    var buildingGUID = vm.addBuildingGUID ? vm.addBuildingGUID() : "";
    var buildings = vm.buildingAutocomplete ? vm.buildingAutocomplete() : [];

    var matchedBuilding =
      buildings.find(function (building) {
        return building && building.id === buildingGUID;
      }) || null;

    if (matchedBuilding) {
      return (
        (matchedBuilding.code || "") + " - " + (matchedBuilding.title || "")
      );
    }

    return buildingCode || "the selected building";
  }

  function getSelectedChangeBuildingDisplay() {
    var buildingCode = vm.newBuilding ? vm.newBuilding() : "";
    var buildingGUID = vm.newBuildingGUID ? vm.newBuildingGUID() : "";
    var buildings = vm.buildingAutocomplete ? vm.buildingAutocomplete() : [];

    var matchedBuilding =
      buildings.find(function (building) {
        return building && building.id === buildingGUID;
      }) || null;

    if (matchedBuilding) {
      return (
        (matchedBuilding.code || "") + " - " + (matchedBuilding.title || "")
      );
    }

    return buildingCode || "the selected building";
  }

  /* =========================
	   VIEWMODEL STATE
	========================== */

  vm.addObservableArray("terms");
  vm.addObservableArray("sectionsAutocomplete");
  vm.addObservableArray("allSectionsForTerm");
  vm.addObservableArray("subjectsAutocomplete");
  vm.addObservableArray("courseSubjectAutocomplete");
  vm.addObservableArray("buildingAutocomplete");
  vm.addObservableArray("roomAutoComplete");
  vm.addObservableArray("changeRoomAutoComplete");
  vm.addObservableArray("employeeSearchAutoComplete");
  // TODO_FIX: Broken because of 403 error in loadActiveEmployees
  // vm.addObservableArray('employeeSearchAutoComplete');

  vm._subscriptionsInitialized = vm._subscriptionsInitialized || false;
  vm._termChangeEligibilityCache = vm._termChangeEligibilityCache || {};
  vm._lastNoCourseSubject = vm._lastNoCourseSubject || null;
  vm._lastNoRoomBuilding = vm._lastNoRoomBuilding || null;
  vm._lastNoChangeRoomBuilding = vm._lastNoChangeRoomBuilding || null;

  vm.selectedTermInput = ko.observable("");
  vm.selectedTermCode = ko.observable("");
  vm.selectedTermGUID = ko.observable("");
  vm.selectedTermTitle = ko.observable("");
  vm.selectedSubject = ko.observable("");
  vm.selectedCourseNumber = ko.observable("");
  vm.selectedSection = ko.observable("");
  vm.selectedSynonym = ko.observable("");

  vm.durationLength = ko.observable("");
  vm.secCapacity = ko.observable("");
  vm.secCrossListed = ko.observable("");
  vm.secStartDate = ko.observable("");
  vm.secEndDate = ko.observable("");
  vm.secMeetingTimes = ko.observable("");
  vm.secStatus = ko.observable("");

  vm.skipDean = ko.observable("");
  vm.skipDepartmentChair = ko.observable("");
  vm.originatorEmail = ko.observable("");
  vm.employeeEmail = ko.observable("");
  vm.deanEmail = ko.observable("");
  vm.departmentChairEmail = ko.observable("");
  vm.administrativeSpecialistEmail = ko.observable("");

  vm.allowSectionChange = ko.observable(null);
  vm.isOnBehalfMode = ko.pureComputed(function () {
    return vm.selfOrElse && vm.selfOrElse() === "On Behalf of Someone Else";
  });

  vm.selectedTerm = ko.pureComputed(function () {
    return findAcademicPeriodByGuid(vm.terms(), vm.selectedTermGUID()) || null;
  });

  vm.academicYear = ko.pureComputed(function () {
    return getAcademicYearFromTerm(vm.selectedTermCode());
  });

  vm.hasSelectedTerm = ko.pureComputed(function () {
    return !!vm.selectedTerm();
  });

  /* =========================
	   TERM SELECTION METHODS
	========================== */

  vm.setSelectedTerm = function setSelectedTerm(term) {
    if (!term) {
      vm.clearSelectedTerm();
      return;
    }

    vm.selectedTermInput(term.displayText);
    vm.selectedTermCode(term.termCode);
    vm.selectedTermGUID(term.termGUID);
    vm.selectedTermTitle(term.termTitle);
  };

  vm.clearSelectedTerm = function clearSelectedTerm() {
    vm.selectedTermInput("");
    vm.selectedTermCode("");
    vm.selectedTermGUID("");
    vm.selectedTermTitle("");
  };

  vm.syncSelectedTermFromInput = function syncSelectedTermFromInput() {
    var inputValue = vm.selectedTermInput();
    var terms = vm.terms();
    var matchedTerm = null;

    if (!inputValue) {
      vm.clearSelectedTerm();
      return;
    }

    matchedTerm =
      terms.find(function (term) {
        return (
          term.displayText === inputValue ||
          term.termCode === inputValue ||
          term.termTitle === inputValue
        );
      }) || null;

    if (matchedTerm) {
      vm.setSelectedTerm(matchedTerm);
      return;
    }

    vm.selectedTermCode("");
    vm.selectedTermGUID("");
    vm.selectedTermTitle("");
  };

  vm.selectAcademicPeriod = function selectAcademicPeriod(selection) {
    var normalizedSelection = normalizeAcademicPeriodSelection(
      selection,
      vm.terms(),
    );

    if (!normalizedSelection) {
      vm.clearSelectedTerm();
      return;
    }

    vm.setSelectedTerm(normalizedSelection);
  };

  /* =========================
		SUBSCRIPTIONS
	========================== */

  vm.selectedTermInput.subscribe(function () {
    var selectedTerm = vm.selectedTerm();
    var inputValue = vm.selectedTermInput();

    if (!inputValue) {
      vm.selectedTermCode("");
      vm.selectedTermGUID("");
      vm.selectedTermTitle("");
      return;
    }

    if (selectedTerm && inputValue !== selectedTerm.displayText) {
      vm.selectedTermCode("");
      vm.selectedTermGUID("");
      vm.selectedTermTitle("");
    }
  });

  function initializeSubscriptions() {
    if (vm._subscriptionsInitialized) {
      return;
    }

    ko.computed(function () {
      hideIsHiddenElements();
    });

    vm._subscriptionsInitialized = true;
    syncTotalCost();

    if (vm.selectedTermGUID) {
      vm.selectedTermGUID.subscribe(function () {
        clearActionAndSectionSelections();
        updateActionAvailability();

        loadSectionsForSelectedTerm().then(function () {
          return evaluateSectionChangeAvailability();
        });
      });
    }

    if (vm.campus) {
      vm.campus.subscribe(function () {
        clearActionAndSectionSelections();
        applyCampusSectionFilter();
        updateActionAvailability();
      });
    }

    if (vm.action) {
      vm.action.subscribe(function (actionValue) {
        evaluateSectionChangeAvailability().then(function (isAllowed) {
          if (actionValue === "Change a Section" && isAllowed === false) {
            vm.action("");
            hideAllActionRows();
            return;
          }

          showActionRow(actionValue);
        });

        clearFieldsForOtherActions(actionValue);
      });
    }

    if (vm.cancelSecName) {
      vm.cancelSecName.subscribe(function (newValue) {
        syncCancelSelectionState(newValue);
      });
    }

    if (vm.changeSecName) {
      vm.changeSecName.subscribe(function (newValue) {
        syncChangeSelectionState(newValue);
      });
    }

    /* =========================
		   ADD SECTION SUBSCRIPTIONS
		========================== */

    if (vm.addSubject) {
      vm.addSubject.subscribe(function (newValue) {
        if (vm.selectedSubject) {
          vm.selectedSubject(newValue || "");
        }
        syncAddSectionDetailsVisibility();
      });
    }

    if (vm.addCourse) {
      vm.addCourse.subscribe(function (newValue) {
        if (vm.selectedCourseNumber) {
          vm.selectedCourseNumber(newValue || "");
        }
        syncAddSectionDetailsVisibility();
      });
    }

    if (vm.addSynonym) {
      vm.addSynonym.subscribe(function (newValue) {
        if (vm.selectedSynonym) {
          vm.selectedSynonym(newValue || "");
        }
      });
    }

    if (vm.addSubjectID) {
      vm.addSubjectID.subscribe(function (newValue) {
        loadCoursesForSelectedAddSubject(newValue);
      });
    }

    if (vm.addBuildingGUID) {
      vm.addBuildingGUID.subscribe(function (newValue) {
        loadRoomsForAddBuilding(newValue);
      });
    }

    if (vm.newBuildingGUID) {
      vm.newBuildingGUID.subscribe(function (newValue) {
        loadRoomsForChangeBuilding(newValue);
      });
    }

    if (vm.addBookCost) {
      vm.addBookCost.subscribe(function () {
        syncTotalCost();
      });
    }

    if (vm.addTaxesCheckBox) {
      vm.addTaxesCheckBox.subscribe(function () {
        syncTotalCost();
      });
    }

    syncEmployeeSearchRequiredState();
    syncSelfOrElseSkipLogic();

    if (vm.addInstructionalMethod) {
      vm.addInstructionalMethod.subscribe(function (newValue) {
        var requiresTimes =
          newValue === "Hybrid" ||
          newValue === "In-Person" ||
          newValue === "Online Course with in-person Testing" ||
          newValue === "Flexible Live" ||
          newValue === "Flexible Online" ||
          newValue === "Online Live Course";

        var requiresRoom =
          newValue === "Hybrid" ||
          newValue === "In-Person" ||
          newValue === "Online Course with in-person Testing";

        setFieldRequired("addStartTime", vm.addStartTime, requiresTimes);
        setFieldRequired("addEndTime", vm.addEndTime, requiresTimes);
        setFieldRequired("addBuilding", vm.addBuilding, requiresRoom);
        setFieldRequired("addRoom", vm.addRoom, requiresRoom);
      });
    }

    if (vm.addInstructionalMethod && vm.addInstructionalMethod()) {
      vm.addInstructionalMethod.valueHasMutated();
    }

    if (vm.newInstructionalMethod) {
      vm.newInstructionalMethod.subscribe(function (newValue) {
        var requiresTimes =
          newValue === "Hybrid" ||
          newValue === "In-Person" ||
          newValue === "Online Course with in-person Testing" ||
          newValue === "Flexible Live" ||
          newValue === "Flexible Online" ||
          newValue === "Online Live Course";

        var requiresRoom =
          newValue === "Hybrid" ||
          newValue === "In-Person" ||
          newValue === "Online Course with in-person Testing";

        setFieldRequired("newStartTime", vm.newStartTime, requiresTimes);
        setFieldRequired("newEndTime", vm.newEndTime, requiresTimes);
        setFieldRequired("newBuilding", vm.newBuilding, requiresRoom);
        setFieldRequired("newRoom", vm.newRoom, requiresRoom);
      });
    }

    if (vm.newInstructionalMethod && vm.newInstructionalMethod()) {
      vm.newInstructionalMethod.valueHasMutated();
    }

    if (vm.selfOrElse) {
      vm.selfOrElse.subscribe(function () {
        syncEmployeeSearchRequiredState();
        syncSelfOrElseSkipLogic();
      });
    }

    if (vm.deanEmail) {
      vm.deanEmail.subscribe(function () {
        syncSelfOrElseSkipLogic();
      });
    }

    if (vm.departmentChairEmail) {
      vm.departmentChairEmail.subscribe(function () {
        syncSelfOrElseSkipLogic();
      });
    }

    if (vm.employeeEmail) {
      vm.employeeEmail.subscribe(function () {
        syncSelfOrElseSkipLogic();
      });
    }

    if (vm.originatorEmail) {
      vm.originatorEmail.subscribe(function () {
        syncSelfOrElseSkipLogic();
      });
    }
  }

  /* =========================
		ACTION HELPERS
	========================== */

  function hideAllActionRows() {
    $(".addSectionRow").hide();
    $(".cancelSectionRow").hide();
    $(".changeSectionRow").hide();
  }

  function showActionRow(actionValue) {
    hideAllActionRows();

    if (
      (actionValue === "Cancel a Section" ||
        actionValue === "Change a Section") &&
      !hasAvailableSectionsForSelectedTermAndCampus()
    ) {
      notifyNoSectionsAvailableForSelectedTermAndCampus();
      if (vm.action) {
        vm.action("");
      }
      return;
    }

    switch (actionValue) {
      case "Add a Section":
        $(".addSectionRow").show();
        break;

      case "Cancel a Section":
        $(".cancelSectionRow").show();
        break;

      case "Change a Section":
        $(".changeSectionRow").show();
        break;
    }

    syncAllStepSpecificUiState();
  }

  function resetObservableIfExists(observableName, resetValue) {
    if (vm[observableName]) {
      vm[observableName](resetValue);
    }
  }

  function notifyNoSectionsAvailableForSelectedTermAndCampus() {
    notify(
      "error",
      "There are no scheduled sections for the selected term and campus.",
      "No Sections Available",
    );
  }

  function clearAddSectionFields() {
    /* =========================
		   ADD FIELD VALUES
		========================== */

    resetObservableIfExists("addSubject", "");
    resetObservableIfExists("addSubjectID", "");
    resetObservableIfExists("addCourse", "");
    resetObservableIfExists("addSynonym", "");
    resetObservableIfExists("addInstructionalMethod", "");
    resetObservableIfExists("addStartTime", "");
    resetObservableIfExists("addEndTime", "");
    resetObservableIfExists("addBuilding", "");
    resetObservableIfExists("addBuildingGUID", "");
    resetObservableIfExists("addRoom", "");
    resetObservableIfExists("addReason", "");
    resetObservableIfExists("addCourseNote", "");

    /* =========================
		   OPTIONAL ADD COMMENTS / NOTES
		   Leave these in if the fields exist in your form
		========================== */

    resetObservableIfExists("addComments", "");
    resetObservableIfExists("addComment", "");
    resetObservableIfExists("addNotes", "");
    resetObservableIfExists("addNote", "");

    /* =========================
		   SHARED SELECTED BITS
		========================== */

    resetObservableIfExists("selectedSubject", "");
    resetObservableIfExists("selectedCourseNumber", "");
    resetObservableIfExists("selectedSynonym", "");

    /* =========================
		   ADD DAY CHECKBOX OBSERVABLES
		========================== */

    resetObservableIfExists("dayCheckBox1", false);
    resetObservableIfExists("dayCheckBox2", false);
    resetObservableIfExists("dayCheckBox3", false);
    resetObservableIfExists("dayCheckBox4", false);
    resetObservableIfExists("dayCheckBox5", false);
    resetObservableIfExists("dayCheckBox6", false);
    resetObservableIfExists("dayCheckBox7", false);

    /* =========================
		   ADD DAY CHECKBOX DOM STATE
		========================== */

    $('input[type="checkbox"][id^="add"]').prop("checked", false);

    /* =========================
		   ADD DATA SOURCES
		========================== */

    if (vm.courseSubjectAutocomplete) {
      vm.courseSubjectAutocomplete([]);
    }

    if (vm.roomAutoComplete) {
      vm.roomAutoComplete([]);
    }

    /* =========================
		   RESET EMPTY-RESULT TOAST CACHE
		========================== */

    vm._lastNoCourseSubject = null;
    vm._lastNoRoomBuilding = null;

    /* =========================
		   RESET CONDITIONAL REQUIRED STATE
		========================== */

    setFieldRequired("addStartTime", vm.addStartTime, false);
    setFieldRequired("addEndTime", vm.addEndTime, false);
    setFieldRequired("addBuilding", vm.addBuilding, false);
    setFieldRequired("addRoom", vm.addRoom, false);
    setFieldRequired("sectionNumber", vm.sectionNumber, false);
    setFieldRequired("addSynonym", vm.addSynonym, false);
  }

  function clearCancelSectionFields() {
    resetObservableIfExists("cancelSecName", "");
    syncCancelSelectionState("");
  }

  function clearChangeSectionFields() {
    resetObservableIfExists("changeSecName", "");
    syncChangeSelectionState("");
    clearChangeEditFields();
  }

  function clearFieldsForOtherActions(actionValue) {
    switch (actionValue) {
      case "Add a Section":
        clearCancelSectionFields();
        clearChangeSectionFields();
        break;

      case "Cancel a Section":
        clearAddSectionFields();
        clearChangeSectionFields();
        break;

      case "Change a Section":
        clearAddSectionFields();
        clearCancelSectionFields();
        break;

      default:
        clearAddSectionFields();
        clearCancelSectionFields();
        clearChangeSectionFields();
        break;
    }
  }

  /* =========================
		SECTION HELPERS
	========================== */

  function updateActionAvailability() {
    var hasTerm = !!(vm.selectedTermGUID && vm.selectedTermGUID());
    var hasCampus = !!(vm.campus && vm.campus());
    var isEnabled = hasTerm && hasCampus;

    $("#action").prop("disabled", !isEnabled);

    if (!isEnabled && vm.action) {
      vm.action("");
      hideAllActionRows();
    }
  }

  function evaluateSectionChangeAvailability() {
    var selectedTermCode = vm.selectedTermCode ? vm.selectedTermCode() : "";
    var action = vm.action ? vm.action() : "";
    var cache = vm._termChangeEligibilityCache || {};

    if (!(user.isInLibrary || user.isInDrafts)) {
      vm.allowSectionChange(null);
      syncChangeStepSpecificState();
      return Promise.resolve(true);
    }

    if (!selectedTermCode || action !== "Change a Section") {
      vm.allowSectionChange(null);
      syncChangeStepSpecificState();
      return Promise.resolve(true);
    }

    if (Object.prototype.hasOwnProperty.call(cache, selectedTermCode)) {
      vm.allowSectionChange(cache[selectedTermCode]);
      syncChangeStepSpecificState();

      if (cache[selectedTermCode] === false) {
        notify(
          "error",
          "Section changes can no longer be made for this term, as it is already active. To make an update, please cancel the original section and add a new one.",
          "Active",
        );
      }

      return Promise.resolve(cache[selectedTermCode]);
    }

    showSpinner();

    return integration
      .first("FS_Get_Active_Term_Date_by_Term_Code", {
        termCode: selectedTermCode,
      })
      .then(function (termDate) {
        var termActiveDate = termDate && termDate.TermActiveDate;
        var parts;
        var termDateObj;
        var today = new Date();
        var isAllowed = true;

        if (!termActiveDate) {
          vm.allowSectionChange(null);
          syncChangeStepSpecificState();
          return true;
        }

        parts = termActiveDate.split("/");
        termDateObj = new Date(parts[2], parts[0] - 1, parts[1]);
        today.setHours(0, 0, 0, 0);

        isAllowed = today < termDateObj;

        cache[selectedTermCode] = isAllowed;
        vm._termChangeEligibilityCache = cache;
        vm.allowSectionChange(isAllowed);
        syncChangeStepSpecificState();

        if (!isAllowed) {
          notify(
            "error",
            "Section changes can no longer be made for this term, as it is already active. To make an update, please cancel the original section and add a new one.",
            "Active",
          );
        }

        return isAllowed;
      })
      .catch(function (error) {
        console.log("Error Section Change by active term", error);
        vm.allowSectionChange(null);
        syncChangeStepSpecificState();
        return true;
      })
      .finally(hideSpinner);
  }

  function hasAvailableSectionsForSelectedTermAndCampus() {
    return !!(vm.sectionsAutocomplete && vm.sectionsAutocomplete().length);
  }

  function clearSectionSelections() {
    if (vm.cancelSecName) vm.cancelSecName("");
    if (vm.changeSecName) vm.changeSecName("");
    if (vm.selectedSubject) vm.selectedSubject("");
    if (vm.selectedCourseNumber) vm.selectedCourseNumber("");
    if (vm.selectedSection) vm.selectedSection("");
    if (vm.selectedSynonym) vm.selectedSynonym("");
    clearSelectedSectionDetails();
  }

  function clearSelectedSectionDetails() {
    if (vm.durationLength) vm.durationLength("");
    if (vm.secCapacity) vm.secCapacity("");
    if (vm.secCrossListed) vm.secCrossListed("");
    if (vm.secStartDate) vm.secStartDate("");
    if (vm.secEndDate) vm.secEndDate("");
    if (vm.secMeetingTimes) vm.secMeetingTimes("");
    if (vm.secStatus) vm.secStatus("");
  }

  function clearActionAndSectionSelections() {
    if (vm.action) {
      vm.action("");
    }

    clearAddSectionFields();
    clearCancelSectionFields();
    clearChangeSectionFields();
    clearSectionSelections();

    syncAllStepSpecificUiState();
  }

  function clearChangeEditFields() {
    if (vm.newInstructionalMethod) vm.newInstructionalMethod("");
    if (vm.newStartTime) vm.newStartTime("");
    if (vm.newEndTime) vm.newEndTime("");
    if (vm.newRoom) vm.newRoom("");
    if (vm.newBuilding) vm.newBuilding("");
    if (vm.newBuildingGUID) vm.newBuildingGUID("");
    if (vm.newComments) vm.newComments("");

    if (vm.changeRoomAutoComplete) {
      vm.changeRoomAutoComplete([]);
    }

    $('input[type="checkbox"][id^="new"]').prop("checked", false);

    setFieldRequired("newStartTime", vm.newStartTime, false);
    setFieldRequired("newEndTime", vm.newEndTime, false);
    setFieldRequired("newRoom", vm.newRoom, false);
    setFieldRequired("newBuilding", vm.newBuilding, false);
  }

  function requireValidSection(sectionName, labelForError) {
    if (!sectionName) {
      throw new Error(labelForError + " is required.");
    }

    if (!findSectionByName(sectionName)) {
      throw new Error(
        labelForError +
          " must be selected from the list. Start typing, then click a matching option.",
      );
    }
  }

  /* =========================
		SECTION FILTER HELPERS
	========================== */

  function getCampusGroupFromSectionName(sectionName) {
    var code = String(sectionName || "");
    var lastPart = code.split("-").pop() || "";
    var firstChar = lastPart.charAt(0).toUpperCase();

    if (["A", "D", "X", "Y", "Z"].indexOf(firstChar) !== -1) {
      return "AUBURN";
    }

    if (["R", "S"].indexOf(firstChar) !== -1) {
      return "ROSF";
    }

    if (firstChar === "H") {
      return "HIGHLAND";
    }

    if (firstChar === "O") {
      return "ORCHARD";
    }

    return "UNKNOWN";
  }

  function filterSectionsByCampus(sections, campus) {
    if (!Array.isArray(sections) || sections.length === 0) {
      return [];
    }

    if (!campus) {
      return sections.slice();
    }

    return sections.filter(function (sectionRow) {
      var campusGroup = getCampusGroupFromSectionName(
        sectionRow && sectionRow.secName,
      );

      if (campus === "Auburn Hills") return campusGroup === "AUBURN";
      if (campus === "Royal Oak/Southfield") return campusGroup === "ROSF";
      if (campus === "Highland Lakes") return campusGroup === "HIGHLAND";
      if (campus === "Orchard Ridge") return campusGroup === "ORCHARD";

      return true;
    });
  }

  function applyCampusSectionFilter() {
    var allSections = vm.allSectionsForTerm ? vm.allSectionsForTerm() : [];
    var campus = vm.campus ? vm.campus() : "";

    var filteredSections = filterSectionsByCampus(allSections, campus);
    vm.sectionsAutocomplete(filteredSections);

    updateActionAvailability();
    return filteredSections;
  }

  function loadSectionsForSelectedTerm() {
    var termGUID = vm.selectedTermGUID && vm.selectedTermGUID();

    vm.allSectionsForTerm([]);
    vm.sectionsAutocomplete([]);

    if (!termGUID) {
      updateActionAvailability();
      return Promise.resolve([]);
    }

    showSpinner();

    return integration
      .all("Web_Custom_Sections", {
        termGUID: termGUID,
      })
      .then(function (sections) {
        vm.allSectionsForTerm(sections || []);

        var filteredSections = applyCampusSectionFilter();
        if (vm.campus && vm.campus() && filteredSections.length === 0) {
          notify(
            "error",
            "There are no scheduled sections for the selected term and campus.",
            "No Sections Available",
          );
        }

        return sections || [];
      })
      .catch(function (error) {
        console.log("Failed to load sections.", error);
        notify(
          "error",
          "There was an issue loading sections.",
          "Loading Error",
        );
        vm.allSectionsForTerm([]);
        vm.sectionsAutocomplete([]);
        updateActionAvailability();
        return [];
      })
      .finally(hideSpinner);
  }

  function normalizeSectionName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  /* =========================
		SELECTED SECTION HELPERS
	========================== */

  function findSectionByName(sectionName) {
    var target = normalizeSectionName(sectionName);

    if (!target || !vm.sectionsAutocomplete) {
      return null;
    }

    return (
      vm.sectionsAutocomplete().find(function (row) {
        return normalizeSectionName(row && row.secName) === target;
      }) || null
    );
  }

  function clearSelectedCourseBits() {
    if (vm.selectedSubject) vm.selectedSubject("");
    if (vm.selectedCourseNumber) vm.selectedCourseNumber("");
    if (vm.selectedSection) vm.selectedSection("");
    if (vm.selectedSynonym) vm.selectedSynonym("");
  }

  function applySectionToSelectedCourseBits(sectionName) {
    var matchedSection = findSectionByName(sectionName);
    var parts;

    if (!matchedSection) {
      clearSelectedCourseBits();
      return;
    }

    parts = String(matchedSection.secName || "").split("-");

    if (vm.selectedSubject) {
      vm.selectedSubject(parts[0] || "");
    }

    if (vm.selectedCourseNumber) {
      vm.selectedCourseNumber(parts[1] || "");
    }

    if (vm.selectedSection) {
      vm.selectedSection(matchedSection.secName || "");
    }

    if (vm.selectedSynonym) {
      vm.selectedSynonym(matchedSection.secSynonym || "");
    }
  }

  function applySectionDetails(sectionName) {
    var matchedSection = findSectionByName(sectionName);

    if (!matchedSection) {
      clearSelectedSectionDetails();
      return;
    }

    if (vm.durationLength)
      vm.durationLength(matchedSection.durationLength || "");
    if (vm.secCapacity) vm.secCapacity(matchedSection.secCapacity || "");
    if (vm.secCrossListed)
      vm.secCrossListed(matchedSection.secCrossListed || "");
    if (vm.secStartDate) vm.secStartDate(matchedSection.secStartDate || "");
    if (vm.secEndDate) vm.secEndDate(matchedSection.secEndDate || "");
    if (vm.secMeetingTimes)
      vm.secMeetingTimes(matchedSection.secMeetingTimes || "");
    if (vm.secStatus) vm.secStatus(matchedSection.secStatus || "");
  }

  vm.onLoad = function onLoad(source, inputValues) {
    //  This takes place after applyBindings has been called and has added input observables to the
    //  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
    //  populating dropdowns, select options and other operations that need to take place every
    //  time the form is loaded.

    //  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
    //  to save values to the server.
    hideIsHiddenElements();
    hideAllActionRows();

    $("#action").prop("disabled", true);

    updateActionAvailability();
    syncAllStepSpecificUiState();
  };

  vm.setDefaults = function setDefaults(source, inputValues) {
    //  This method is called after values from the server are loaded into the form inputs and before
    //  afterLoad is called.

    //  WARNING: if an integration source is called directly to retrieve values and populate inputs
    //  with default values, setDefaults must return the integration source promise.  If it doesn't,
    //  a form draft may be created every time a user opens the form and more importantly the values
    //  may not be saved to the server.

    initializeSubscriptions();

    // Initialize required indicators after VM bindings and form DOM are ready.
    // This replays any queued setRequired(...) calls made earlier in setDefaults.
    requiredIndicators.init(vm);

    return loadAcademicPeriods().then(function (terms) {
      vm.terms(terms);

      return loadSubjects().then(function () {
        return loadBuildings().then(function () {
          if (vm.selectedTermGUID && vm.selectedTermGUID()) {
            return loadSectionsForSelectedTerm().then(function () {
              return evaluateSectionChangeAvailability().then(function () {
                if (vm.action && vm.action()) {
                  showActionRow(vm.action());
                }
                return true;
              });
            });
          }

          if (vm.action && vm.action()) {
            return evaluateSectionChangeAvailability().then(function () {
              showActionRow(vm.action());
              return true;
            });
          }

          return true;
        });
      });
    });
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

    fieldStateUtils.setFieldState("originationDate", {
      state: {
        readonly: true,
      },
      helperText: "Auto-filled",
    });

    /*
		//  This is resizing the textarea's when the form loads incase it is pulling in real data.
		var ta = document.querySelector('.autosizeareas');
		var evt = document.createEvent('Event');
		evt.initEvent('autosize:update', true, false);
		ta.dispatchEvent(evt);
		*/
    autosize($("textarea"));

    hideIsHiddenElements();

    if (vm.action && vm.action()) {
      showActionRow(vm.action());
    }

    syncAllStepSpecificUiState();

    if (vm.addInstructionalMethod && vm.addInstructionalMethod()) {
      vm.addInstructionalMethod.valueHasMutated();
    }

    if (vm.newInstructionalMethod && vm.newInstructionalMethod()) {
      vm.newInstructionalMethod.valueHasMutated();
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
  };

  vm.onApprove = function onApprove(form) {
    //  This method is called when the Approve button is clicked and before calling beforeRequired.
  };

  vm.onDecline = function onDecline(form) {
    //  This method is called when the Decline button is clicked and before calling beforeRequired.
  };
  //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
  vm.beforeRequired = function beforeRequired(form) {
    // Enable native DOM `required` attributes at validation time.
    // This prevents fields from appearing invalid on initial load,
    // while still allowing browser validation during submit.
    requiredIndicators.applyNativeRequiredForValidation();

    validateCancelSection();
    validateChangeSection();

    return true;
  };

  //  This method is called after the required inputs on the form have been confirmed to have values.

  vm.afterRequired = function afterRequired(form) {
    validateAddMeetingDays();
    validateChangeMeetingDays();
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
