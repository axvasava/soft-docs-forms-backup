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
  $(".acknowledgements").hide();
  $(".empAcknowledgement").hide();
  $(".supAcknowledgement").hide();
  $(".developer").hide();

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
  var isEmployeeFound = false;
  vm.supervisorSearch = ko.observable("");
  vm.employeeName = ko.observable("");

  integration
    .all("Etrieve_Security_Get_Active_Employees", {})
    .then(function (data) {
      console.log("Etrieve_Security_Get_Active_Employees");
    });

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

    //console.log('Ethos Employees: ', source.EthosColleagueEmployee);
    //console.log('Active Employees: ', source.Web_Ethos_Get_all_Employees_with_offsetInt);

    if (
      pkg.isAtStep("Employee") ||
      pkg.isAtStep("SupervisorOverride") ||
      pkg.isAtStep("End")
    ) {
      $(".acknowledgements").show();
      if (
        pkg.isAtStep("Employee") ||
        pkg.isAtStep("SupervisorOverride") ||
        (pkg.isAtStep("End") && !vm.supervisorOverride())
      ) {
        $(".supervisor").hide();
      }

      // Disable all inputs, checkboxes, dropdowns, and textareas except specific ones
      document
        .querySelectorAll("input, select, textarea, checkbox, button")
        .forEach((element) => {
          if (
            element.id !== "supervisorCheckOutSignature" &&
            element.id !== "checkOutSignature"
          ) {
            element.disabled = true;
          }
        });
    }

    if (
      (pkg.isAtStep("Employee") || pkg.isAtStep("End")) &&
      !vm.supervisorOverride()
    ) {
      $(".empAcknowledgement").show();
    }

    if (
      (pkg.isAtStep("SupervisorOverride") || pkg.isAtStep("End")) &&
      vm.supervisorOverride()
    ) {
      $(".supAcknowledgement").show();
    }

    vm.checkOutSignature.subscribe(function (newValue) {
      if (newValue) {
        vm.checkOutSignatureDate(Extenders.utils.formatDate(new Date()));
      } else vm.checkOutSignatureDate("");
    });

    vm.supervisorCheckOutSignature.subscribe(function (newValue) {
      if (newValue) {
        vm.supervisorCheckOutSignatureDate(
          Extenders.utils.formatDate(new Date()),
        );
      } else vm.supervisorCheckOutSignatureDate("");
    });

    vm.supervisorOverride.subscribe(function () {
      vm.supervisorSearch("");
      vm.routeSupervisorEmail("");
    });

    // if (!user.isInLibary && !user.isInDrafts) {
    //     document.getElementById("supervisorOverride").disabled = true;
    //     document.getElementById("supervisorSearch").disabled = true;
    // }

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
    // getAllDataFromPagingSource('Web_Ethos_Get_all_Employees_with_offsetInt',100).then(listOfAssetData => {
    //   console.log('listOfAssetData',listOfAssetData);
    // });

    ko.computed(function () {
      // Create the HTML table
      if (vm.checkOutEquipment() == true || vm.checkInEquipment() == true) {
        var equipmentSerialNumbers = "";
        var htmlSummaryTable = "";
        htmlSummaryTable += "<p><div>";

        // If there was equipment checked out, add the corresponding HTML
        if (vm.checkOutEquipment() == true) {
          htmlSummaryTable +=
            "<div><p><strong>Equipment Assigned:</strong></p></div>";

          vm.equipmentCheckOutRow().forEach(function (checkOutTableRow) {
            htmlSummaryTable +=
              "<strong>Description: </strong>" +
              checkOutTableRow.equipmentSignOutDescription() +
              "<br>";
            htmlSummaryTable +=
              "<strong>Serial Number: </strong>" +
              checkOutTableRow.equipmentSignOutSerialNumber() +
              "<br>";
            if (checkOutTableRow.equipmentSignOutSerialNumber()) {
              equipmentSerialNumbers +=
                checkOutTableRow.equipmentSignOutSerialNumber(); //add the serial number into the list
              equipmentSerialNumbers += "  "; //add double space for multi-value key field
            }

            if (checkOutTableRow.equipmentAssignedComments()) {
              htmlSummaryTable +=
                "<strong>Equipment Comments: </strong>" +
                checkOutTableRow.equipmentAssignedComments() +
                "<br>";
            }

            htmlSummaryTable += "<br>";
          });
        }

        // Add HTML for equipment checked in
        if (vm.checkInEquipment() == true) {
          htmlSummaryTable +=
            "<div><p><strong>Equipment Returned:</strong></p></div>";

          vm.equipmentCheckInRow().forEach(function (checkInTableRow) {
            htmlSummaryTable +=
              "<strong>Description: </strong>" +
              checkInTableRow.equipmentSignInDescription() +
              "<br>";
            htmlSummaryTable +=
              "<strong>Serial Number: </strong>" +
              checkInTableRow.equipmentSignInSerialNumber() +
              "<br>";
            if (checkInTableRow.equipmentSignInSerialNumber()) {
              equipmentSerialNumbers +=
                checkInTableRow.equipmentSignInSerialNumber(); //add the serial number to the list
              equipmentSerialNumbers += "  "; //add double space for multivalue key field
            }
            if (checkInTableRow.equipmentComments()) {
              htmlSummaryTable +=
                "<strong>Equipment Comments: </strong>" +
                checkInTableRow.equipmentComments() +
                "<br>";
            }
            htmlSummaryTable += "<br>";
          });
        }

        htmlSummaryTable += "</p></div>";
        vm.formActionsTableHTML(htmlSummaryTable);

        // now remove the last double space from equipmentSerialNumbers
        equipmentSerialNumbers.slice(0, -2);
        vm.serialNumbers(equipmentSerialNumbers);
      } else {
        vm.formActionsTableHTML("");
      }
    });

    vm.isSamePerson = ko.computed(function () {
      var supervisor = vm.routeSupervisorEmail() || "";
      var employee = vm.routingEmail() || "";

      var isSamePerson =
        supervisor.trim().toLowerCase() === employee.trim().toLowerCase();
      return isSamePerson;
    });

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
    if (!isEmployeeFound)
      throw new Error("No employee found with that ID. Please try again.");
    if (vm.isSamePerson()) {
      notify("error", "Supervisor and Employee names must be different.");
      return false; // Prevent submission
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

    if (!vm.checkOutEquipment() && !vm.checkInEquipment()) {
      throw new Error(
        "You must select a form action and complete the action's corresponding section before submitting.",
      );
    }

    if (vm.checkOutEquipment() == true) {
      vm.equipmentCheckOutRow().forEach(function (checkOutTableRow) {
        if (
          !checkOutTableRow.equipmentSignOutDescription() ||
          !checkOutTableRow.equipmentSignOutSerialNumber()
        ) {
          // stop the form submission & notify the user
          throw new Error(
            "Either deselect the checkbox, or Description and Serial Number must be entered in the Check Out Equipment section of the form before submitting.",
          );
        }
      });
    }

    if (vm.checkInEquipment() == true) {
      vm.equipmentCheckInRow().forEach(function (checkInTableRow) {
        if (
          !checkInTableRow.equipmentSignInDescription() ||
          !checkInTableRow.equipmentSignInSerialNumber()
        ) {
          // stop the form submission & notify the user
          throw new Error(
            "Either deselect the checkbox, or Description and Serial Number must be entered in the Check In Equipment section of the form before submitting.",
          );
        }
      });
    }

    if (vm.supervisorOverride() && !vm.supervisorSearch()) {
      throw new Error(
        "You've indicated that the form should route to a supervisor, but no supervisor is selected. Either select a supervisor or uncheck the Supervisor Override box to route to the employee.",
      );
    }
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  //Helper Functions*******************************************************************************************

  $("#employeeSearchButton").click(function () {
    // Clear previous values
    vm.employeeName("");
    vm.routingEmail("");

    // Fetch person data
    integration
      .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
        personID: vm.employeeSearch(),
      })
      .then(function (personData) {
        if (!personData) {
          isEmployeeFound = false;
          notify("error", "No employee found with that ID. Please try again.");
        } else {
          notify("success", "Employee found!");
          isEmployeeFound = true;
          vm.employeeName(
            `${personData.chosenName?.firstName ?? personData.names[0].firstName} ${personData.names[0].lastName}`,
          );
          //vm.employeeName(personData.chosenName.firstName | personData.names[0].firstName + ' ' + personData.names[0].lastName);
          //vm.employeeName(personData.names[0].firstName + ' ' + personData.names[0].lastName);
          // Get the primary email address
          const primaryEmail = personData.emails.find(
            (email) => email.preference === "primary",
          );
          if (primaryEmail) {
            vm.routingEmail(primaryEmail.address); // Assign only the email address
          } else {
            console.warn("No primary email found");
          }
        }
      });
  });

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

  //End Helper Functions **************************************************************************************

  return vm;
});
