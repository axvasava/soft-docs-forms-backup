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

  function formatAmountRounded(value) {
    if (value == null || value === "") return "0.00";

    // remove everything except digits, dot and minus
    const cleaned = String(value).replace(/[^0-9.-]/g, "");
    const number = Number(cleaned);

    if (!Number.isFinite(number)) return "0.00";

    // ROUND first to avoid floating point drift
    const rounded = Math.round((number + Number.EPSILON) * 100) / 100;

    // format with commas and exactly 2 decimals
    const parts = rounded.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return parts.join(".");
  }

  function disableButtons() {
    $("button").each(function () {
      // Disable everything else: buttons, checkboxes, radios, selects, etc.
      $(this).prop("disabled", true);
    });
  }

  /*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
  $(".maskphone").mask("(999)999-9999? ext:9999");
  $(".maskzip").mask("99999?-9999");
  $(".maskssn").mask("999-99-9999");
  /*End masking functions*/

  vm.addObservableArray("personsPositionsList");
  vm.personsPositionsList([]);

  $(".developer").hide();

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

    //02/12/26 EP form wasn't always loading this value which was causing issues in the workflow
    vm.has14GL("No");

    vm.selfOrElse.subscribe((newValue) => {
      vm.employeeID("");
      vm.employeeSearch("");
      vm.personsPositionsList([]);
      vm.jobTitle("");
      if (newValue) {
        if (newValue == "Myself") {
          vm.employeeID(user.ErpId);
        } else if (newValue == "On Behalf of Another Employee") {
          vm.employeeID("");
          vm.employeeSearch("");
          vm.employeeName("");
          vm.employeeEmail("");
        }
      } else {
        vm.employeeID("");
        vm.employeeSearch("");
      }
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

    $("#employeeSearchButton").on("click", () => {
      vm.employeeName("");
      vm.employeeEmail("");
      vm.department("");
      vm.campus("");
      if (vm.employeeID()) {
        runEmployeeEthosCall(vm.employeeID());
      } else {
        vm.employeeName("");
        vm.employeeEmail("");
        vm.department("");
        vm.campus("");
      }
    });

    vm.employeeID.subscribe((newVal) => {
      if (newVal) runEmployeeEthosCall(newVal);
    });

    // vm.travelRelated.subscribe((newVal) => {
    //     if (newVal == 'No') {
    //         $('.long1099Span').hide();
    //     } else {
    //       $('.long1099Span').show();
    //     }
    // });

    vm.vendorSearch.subscribe((newVal) => {
      if (newVal && newVal !== "") {
        if (newVal.length < 7) {
          vm.vendorSearch(newVal.padStart(7, "0"));
        }
      }
    });

    $("#vendorSearchButton").on("click", () => {
      if (vm.vendorSearch() && vm.vendorSearch() !== "") {
        // vm.payeeName('')
        // vm.vendorName('');
        vm.vendorPayeeName("");
        vm.address("");
        vm.city("");
        vm.state("");
        vm.zip("");

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
            var addresses = data.addresses;
            var addressID;

            const targetAddress = addresses
              .filter((addr) => addr.type.addressType === "billing")
              .sort((a, b) => new Date(b.startOn) - new Date(a.startOn))[0];
            const primaryAddress = addresses.find(
              (addr) => addr?.preference === "primary",
            );

            if (targetAddress)
              vm.organizationAddressId(targetAddress.address.id);
            else vm.organizationAddressId(primaryAddress.address.id);
          } else if (allMyPromisesReturned[1]) {
            notify("success", "Institution Found");
            var payeeData = allMyPromisesReturned[1];
            vm.vendorPayeeName(allMyPromisesReturned[1].title);
            var payeeAddressID = payeeData.addresses[0].address.id;
            vm.organizationAddressId(payeeAddressID);
            // var payeeAddresses = payeeData.addresses;
            // var payeeAddressID;
            // for (var a = 0; a < payeeAddresses.length; a++) {
            //     if (payeeAddresses[a].preference === "primary") {
            //         payeeAddressID = payeeAddresses[a].address.id;
            //         console.log('Organization Address ID:',addressID);
            //         vm.organizationAddressId(payeeAddressID);
            //         break; // Stop the loop once the primary address is found
            //     }
            // }
          } else if (allMyPromisesReturned[2]) {
            notify("success", "Person Found");
            var payeeData = allMyPromisesReturned[2];
            vm.vendorPayeeName(allMyPromisesReturned[2].names[0].fullName);
            var payeeAddresses = payeeData.addresses;
            var payeeAddressID;
            for (var a = 0; a < payeeAddresses.length; a++) {
              if (payeeAddresses[a].preference === "primary") {
                payeeAddressID = payeeAddresses[a].address.id;
                vm.organizationAddressId(payeeAddressID);
                break; // Stop the loop once the primary address is found
              }
            }
          } else {
            notify("error", "Colleague ID not found.");
          }
        });
      } else {
        // vm.payeeName('');
        // vm.vendorName('');
        vm.vendorPayeeName("");
        vm.address("");
        vm.city("");
        vm.state("");
        vm.zip("");
      }
    });

    // if an organization returns in the vendor ID search, look at the organizationAddressID and run the Ethos address call then populate the appropriate data.
    vm.organizationAddressId.subscribe(function (newValue) {
      vm.address("");
      vm.city("");
      vm.state("");
      vm.zip("");

      if (newValue) {
        integration
          .first("Web_Ethos_Get_Address_By_Address_GUId", {
            addressGUID: newValue,
          })
          .then(function (dataFromSource) {
            if (dataFromSource.addressLines.length > 1) {
              vm.address(
                dataFromSource.addressLines[0] +
                  ", " +
                  dataFromSource.addressLines[1],
              );
            } else {
              vm.address(dataFromSource.addressLines[0]);
            }

            vm.city(dataFromSource.place.country.locality);
            vm.state(dataFromSource.place.country.region.code.substring(3));
            vm.zip(dataFromSource.place.country.postalCode);
          });
      }
    });

    if (user.isInLibrary) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.
      //========= CREATE AND SET OBSERVABLE TO FALSE - LATER USED TO CHECK IF ANY GL NUMBER STARTS WITH '14' ============
      //02/12/26 EP form wasn't always loading this value which was causing issues in the workflow; moved to onLoad function
      //vm.has14GL('No');
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
      $("#approver").css("pointer-events", "none");
      $("#approver").prop("readonly", true);
      $("#approver").css("background-color", "#e9ecef");
      disableButtons();
    }

    ko.computed(() => {
      let total = 0;

      vm.invoiceRow.forEach((row) => {
        if (row.invoiceAmount()) {
          let formatted = formatAmountRounded(row.invoiceAmount());
          // const rawNumber = parseInt(formatted.replace(",", ''))  --> When we use parseInt, we round the numbers so instead of parseInt, we need to use parseFloat
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          total += rawNumber;
          row.invoiceAmount(formatted);
        }
      });

      let formattedTotal = formatAmountRounded(total);
      vm.invoicesTotal(formattedTotal);
    });

    ko.computed(function () {
      let total = 0;
      // loop through dynamic list
      vm.accountRow().forEach(function (rowData) {
        validateAccountNumberInDynamicList(rowData, "glNumber", "glNumDesc");

        if (rowData.amount()) {
          // let formatted = formatAsDollar(rowData.amount())
          let formatted = formatAmountRounded(rowData.amount());
          //  const rawNumber = parseInt(formatted.replace(",", ''))  --> When we use parseInt, we round the numbers so instead of parseInt, we need to use parseFloat
          const rawNumber = parseFloat(formatted.replace(/,/g, ""));
          total += rawNumber;
          rowData.amount(formatted);
        }
      });

      let formattedTotal = formatAmountRounded(total);
      vm.accountTotal(formattedTotal);
    });

    var Invoices = "";
    //Computed will run the function if any of the data changes
    ko.computed(function () {
      Invoices = "";
      //loop through each row in the studentTable
      vm.invoiceRow().forEach(function (invoice, index) {
        //if the row has first name and last name values
        if (invoice.invoiceNumber()) {
          //add Course Instructor Username field values into the listOfInstructors array
          Invoices += invoice.invoiceNumber();
          Invoices += "  ";
        }
      });
      // now remove the last double space from FirstLastName
      //if (Invoices )

      Invoices = Invoices.slice(0, -2);
      vm.invoiceNumbers(Invoices);
    });

    //Initialize FormBuilder created form specific code
    liveVM.afterLoadEditsForVM();

    //============ SEE IF ANY ROW HAS A GL NUMBER THAT STARTS WITH 14 FOR FORM ROUTING ==============

    // if (user.isInLibrary) {
    if (user.isInLibrary || user.isInDrafts) {
      vm.computeHas14GL = ko.computed(function () {
        //.some tests whether at least one element in the array passes the condition below
        let accountRowHas14 = vm.accountRow.some(
          (row) => row.glNumber() && row.glNumber().startsWith("14"),
        );
        if (accountRowHas14) {
          vm.has14GL("Yes");
        } else {
          vm.has14GL("No");
        }
      });
    }
    //======== END SEE IF ANY ROW HAS A GL NUMBER THAT STARTS WITH 14 FOR FORM ROUTING ==============

    // disableEdits()

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
    if (vm.accountTotal() !== vm.invoicesTotal())
      throw new Error(
        "Please ensure your totals for Accounts and Invoices match",
      );
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
    vm.accountRow().forEach(function (row, index) {
      const raw = row.amount && row.amount();
      const cleaned = String(raw || "").replace(/,/g, "");
      const value = parseFloat(cleaned);

      // REQUIRED check
      if (!raw) {
        throw new Error(`Amount is required in Account row ${index + 1}`);
      }

      // > 0 check
      // 			if (!Number.isFinite(value) || value <= 0) {
      // 				throw new Error(
      // 					`Amount must be greater than 0 in Account row ${index + 1}`
      // 				);
      // 			}
    });

    return true;
  };

  vm.afterRequired = function afterRequired(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
    requiredIndicators.clearNativeRequired();
    Extenders.utils.verifyDynamicListRequired(vm, ["accountRow"]);

    if (form.attachmentCount < 1) {
      throw new Error(
        "Please attach at least 1 supporting document before submitting",
      );
    } else {
      return true;
    }
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  function runEmployeeEthosCall(idSearch) {
    console.log("running function");
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
                      //console.log('Dept Results: ', deptResults);
                      vm.department(deptResults.title);
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

  function generateFormCode() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }

    return code;
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

  return vm;
});
