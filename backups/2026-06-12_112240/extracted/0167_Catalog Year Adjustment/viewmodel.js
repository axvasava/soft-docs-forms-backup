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
  // vm.addObservableArray("studentPrograms")
  // vm.studentPrograms([])

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
  $(".loading").hide();
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

  // integration.all('EthosColleagueStudentAcademicPrograms', {}).then(function(data){
  //     console.log("ethos colleague academic program: ", data)
  // })
  vm.addObservableArray("programOptions");
  vm.programOptions([]);

  vm.addObservables("selectedProgramText");
  $(".newCatalogHidden").hide();
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

    //new addition
    if (!pkg.isAtStep("Start")) {
      $("#studentID").prop("readonly", true);
      $(".newClg").hide();
      $(".newCatalogHidden").show();
      // $('#newCatalogYear').prop('disabled',true);
    }

    vm.studentCatalogYear.subscribe(function (newValue) {
      if (!newValue) return;
      populateCatalogDropdown(newValue, "#newCatalogYear");
    });

    vm.newCatalogYear.subscribe(function (selectedValue) {
      vm.selectedCatalogYear(selectedValue);
    });

    if (user.isInLibrary || user.isInDrafts) {
      //  Input Values set here will be saved to the server when the user makes a form
      //  instance creating action: changing an input value or clicking submit.
      // vm.submitterName(user.DisplayName);
      // vm.submitterEmail(user.Email);

      //EthosColleagueStudentByErpId
      // vm.studentID.subscribe(function(id){
      //     integration.all('Web_Ethos_Get_Persons_by_Colleague_ID', {
      //         personID:id
      //     }).then(function(personResults){
      //         var ethosGUID = personResults[0].id;
      //     });
      // });

      vm.studentID.subscribe((newVal) => {
        if (newVal && newVal !== "") {
          // show loading spinner
          $(".loading").show();
          //New Addition
          loadStudentInfo(newVal);
          // integration.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
          //     personID: newVal
          // }).then(studentData => {
          //     const { names, emails, id } = studentData
          //     const studentName = names.find(name => name.preference === 'preferred').fullName
          //     const studentEmail = emails.find(email => email.preference === 'primary').address
          //     vm.studentName(studentName)
          //     vm.studentEmail(studentEmail)
          //     vm.studentGUID(id)

          //     integration.all('Web_Ethos_Get_Student_Programs_by_Student_GUID_V2', {
          //          studentID:id
          //      }).then(function(academicProgram){
          //          var activeAcademicProgram = "";
          //          console.log("Student Academic Program:", academicProgram)

          //          academicProgram.forEach(function(program, index){
          //             var status = (program.enrollmentStatus.status).toLowerCase();

          //             if(status == "inactive") return

          //             activeAcademicProgram = program;
          //             console.log("PULLING ONLY ACTIVE PROGRAMS:", activeAcademicProgram)
          //          });

          //          if (!activeAcademicProgram) notify('error',"No active program found");
          //          $('.loading').hide();
          //          var programGUID = activeAcademicProgram.program.id;
          //          console.log("Program GUID:", programGUID)
          //           vm.programGUID(programGUID);
          //          integration.all('Web_Ethos_Get_Academic_Program_by_program_GUID', {
          //              programID: programGUID
          //          }).then(function(academicProgram){
          //              console.log("Academic Program Title:", academicProgram)
          //              console.log("Academic Program Title:", academicProgram.title)
          //              vm.studentProgram(academicProgram.title);
          //             //  vm.programCode(academicProgram.code);
          //          });

          //         //======End Pull Multiple Programs and Pass Catalog Year correct Variable==========
          //         // (Optional) ES5-friendly Promise.all polyfill if needed in your environment
          //         if (!Promise.all) {
          //           Promise.all = function (promises) {
          //             return new Promise(function (resolve, reject) {
          //               var results = [];
          //               var remaining = promises.length;
          //               if (remaining === 0) return resolve([]);
          //               promises.forEach(function (p, i) {
          //                 Promise.resolve(p).then(function (res) {
          //                   results[i] = res;
          //                   remaining -= 1;
          //                   if (remaining === 0) resolve(results);
          //                 }).catch(reject);
          //               });
          //             });
          //           };
          //         }

          //         integration.all('Web_Ethos_Get_Student_Programs_by_Student_GUID_V2', {
          //           studentID: id
          //         }).then(function (programs) {
          //           var dd = document.getElementById('programTitle');

          //           // Guard: ensure we have an array
          //           if (!programs || !programs.length) {
          //             notify('error', 'No programs found for this student.');
          //             if (dd) dd.innerHTML = '<option value="">No programs found</option>';
          //             return;
          //             $('.loading').hide();
          //           }

          //           // 1) Filter to ACTIVE programs (status !== 'inactive')
          //           var activePrograms = [];
          //           programs.forEach(function (p) {
          //             var status = (p && p.enrollmentStatus && p.enrollmentStatus.status)
          //               ? String(p.enrollmentStatus.status).toLowerCase() : '';
          //             if (status !== 'inactive') activePrograms.push(p);
          //           });

          //           if (!activePrograms.length) {
          //             notify('error', 'No active programs found.');
          //             if (dd) dd.innerHTML = '<option value="">No active programs</option>';
          //             return;
          //             $('.loading').hide();
          //           }

          //           // 2) Prep: GUID arrays and a map Program GUID -> Catalog GUID
          //           var activeProgramGUIDs = [];
          //           var programGUIDToCatalogGUID = {};
          //           var detailPromises = [];

          //           activePrograms.forEach(function (ap) {
          //             var guid = ap && ap.program && ap.program.id;
          //             var catalogId = ap && ap.catalog && ap.catalog.id;

          //             if (guid) {
          //               activeProgramGUIDs.push(guid);
          //               if (catalogId) programGUIDToCatalogGUID[guid] = catalogId;

          //               // Fetch academic program details to get title/code for dropdown text
          //               detailPromises.push(
          //                 integration.all('Web_Ethos_Get_Academic_Program_by_program_GUID', {
          //                   programID: guid
          //                 })
          //               );
          //             }
          //           });

          //           if (!detailPromises.length) {
          //             notify('error', 'Active programs found, but missing program IDs.');
          //             if (dd) dd.innerHTML = '<option value="">No valid program IDs</option>';
          //             return;
          //             $('.loading').hide();
          //           }

          //           // 3) Helper: Load Catalog Year (Calendar Year) for a given Program GUID
          //           function loadCatalogYearForProgramGUID(programGUID) {
          //             var catalogGUID = programGUIDToCatalogGUID[programGUID];

          //             if (!catalogGUID) {
          //               console.warn("No catalog GUID found for program:", programGUID);
          //               if (typeof vm !== 'undefined') {
          //                 vm.studentCatalogYear("");
          //                 $('.loading').hide();
          //               }
          //               return;
          //             }

          //             // ===== CATALOG YEAR LOOKUP =====
          //             integration.all('Web_Ethos_Academic_Catalogs', { id: catalogGUID })
          //               .then(function (catalogRes) {
          //                 // Resolve the catalog "code" from common Ethos shapes
          //                 var code =
          //                   (catalogRes && catalogRes.code) ||
          //                   (catalogRes && catalogRes.attributes && catalogRes.attributes.code) ||
          //                   (catalogRes && catalogRes.data && catalogRes.data.attributes && catalogRes.data.attributes.code) ||
          //                   "";

          //                 // Format "YYYY" (or any string containing a 4-digit year) to "YYYY-YY", or "UNK"
          //                 var display = formatCatalogYear(code);

          //                 // Set on your view model
          //                 if (typeof vm !== 'undefined') {
          //                   vm.studentCatalogYear(display);  // e.g., "2006-07" or "UNK"
          //                   vm.catalog(catalogGUID);
          //                 }

          //                 console.log("Catalog Year (raw):", code || "(blank)", " | Display:", display);
          //               })
          //               .catch(function (err) {
          //                 console.error("Catalog lookup failed:", err);
          //                 if (typeof vm !== 'undefined') {
          //                   vm.studentCatalogYear("UNK"); // if lookup fails entirely, show UNK
          //                 }
          //               });

          //             /**
          //              * Converts values like "2006" or "2006-2007" (or "AY2006") to "2006-07".
          //              * Returns "UNK" if no 4-digit year is found or the year looks invalid.
          //              */
          //             function formatCatalogYear(code) {
          //               if (!code) return "UNK";

          //               // Pull the first 4-digit year
          //               var m = String(code).match(/\b(19|20)\d{2}\b/); // restrict to 1900–2099; adjust if needed
          //               if (!m) return "UNK";

          //               var y = parseInt(m[0], 10);
          //               // sanity check (optional; adjust bounds if your catalogs go broader)
          //               if (isNaN(y) || y < 1900 || y > 2099) return "UNK";

          //               var nextYY = ("0" + ((y + 1) % 100)).slice(-2); // always 2 digits
          //               return y + "-" + nextYY;
          //             }
          //             // ===== END CATALOG YEAR LOOKUP =====
          //           }

          //           // 4) Build dropdown after all details are fetched
          //           Promise.all(detailPromises).then(function (detailsArray) {
          //             if (!dd) {
          //               console.warn('Dropdown element #programTitle not found.');
          //               return;
          //             }

          //             // Clear any existing options
          //             dd.innerHTML = '';

          //             // Placeholder option
          //             var placeholder = document.createElement('option');
          //             placeholder.value = '';
          //             placeholder.text = 'Select a program...';
          //             dd.appendChild(placeholder);

          //             // Create one option per active program
          //             for (var i = 0; i < detailsArray.length; i++) {
          //               var details = detailsArray[i];
          //               var guid = activeProgramGUIDs[i];

          //               var title = (details && details.title) ? details.title : 'Untitled Program';
          //               var code = (details && details.code) ? (' (' + details.code + ')') : '';

          //               var opt = document.createElement('option');
          //               opt.value = guid;            // Value = Program GUID
          //               opt.text = title + code;     // Visible = Title (Code)
          //               dd.appendChild(opt);
          //             }

          //             // Auto-select first program and update VM + Catalog Year
          //             if (detailsArray.length > 0) {
          //             //   dd.value = activeProgramGUIDs[0];

          //               if (typeof vm !== 'undefined') {
          //                 vm.programGUID(activeProgramGUIDs[0]);
          //                 var selectedDetails = detailsArray[0];
          //                 if (selectedDetails && selectedDetails.title) {
          //                   vm.studentProgram(selectedDetails.title);
          //                 }
          //               }

          //               // 🔗 Pull the correct Catalog Year for the pre-selected program
          //               loadCatalogYearForProgramGUID(activeProgramGUIDs[0]);
          //             }

          //             // React to user changes
          //             dd.onchange = function () {
          //               var selGUID = dd.value;

          //               if (typeof vm !== 'undefined') {
          //                 vm.programGUID(selGUID);
          //               }

          //               // Update the title in vm if we can match by index
          //               var selIndex = activeProgramGUIDs.indexOf(selGUID);
          //               if (selIndex > -1) {
          //                 var det = detailsArray[selIndex];
          //                 if (typeof vm !== 'undefined' && det && det.title) {
          //                   vm.studentProgram(det.title);
          //                 }
          //               }

          //               // 🔗 Load the correct Catalog Year for the selected program
          //               loadCatalogYearForProgramGUID(selGUID);
          //             };

          //           }).catch(function (err) {
          //             console.error('Error fetching academic program details:', err);
          //             notify('error', 'Failed to load academic program details.');
          //             if (dd) dd.innerHTML = '<option value="">Error loading programs</option>';
          //           });

          //         }).catch(function (err) {
          //           console.error('Error fetching student programs:', err);
          //           notify('error', 'Failed to load student programs.');
          //           var ddErrRoot = document.getElementById('programTitle');
          //           if (ddErrRoot) ddErrRoot.innerHTML = '<option value="">Error loading programs</option>';
          //         });
          //         //======End Pull Multiple Programs and Pass Catalog Year correct Variable==========

          //     $('.loading').hide();

          //     });

          // });
        }
      });
    } else {
      // //         //  Input Values set here will be saved to the server immediately.
      // //         //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
      // //         //  prior users.  Inputs that already have values saved to the server will be overridden with
      // //         //  values set in this method.
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

    ko.computed(() => {
      if (vm.programTitle()) {
        vm.programSelected(vm.programTitle.element.selectedOptions[0].text);
      }
    });

    //loading student info again when in-Drafts
    if (vm.studentID() && pkg.isAtStep("Start")) {
      loadStudentInfo(vm.studentID());

      let receivedCatalogYear = vm.studentCatalogYear();
      populateCatalogDropdown(receivedCatalogYear, "#newCatalogYear");
    }

    // ko.computed(function(){
    //     let receivedCatalogYear = vm.studentCatalogYear();
    //     populateCatalogDropdown(receivedCatalogYear, "#newCatalogYear");
    // });

    if (pkg.isAtStep("Start")) {
      $(".programDD").show();
      $(".programField").hide();
    } else {
      $(".programDD").hide();
      $(".programField").show();
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
  };

  vm.onOptOut = function onOptOut(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };

  vm.onESignSubmit = function onESignSubmit(form) {
    //  This method is called after the required inputs on the form have been confirmed to have values.
  };
  //new Addition

  function loadStudentInfo(newVal) {
    integration
      .first("Web_Ethos_Get_Persons_by_Colleague_ID", {
        personID: newVal,
      })
      .then((studentData) => {
        const { names, emails, id } = studentData;
        const studentName = names.find(
          (name) => name.preference === "preferred",
        ).fullName;
        const studentEmail = emails.find(
          (email) => email.preference === "primary",
        ).address;
        vm.studentName(studentName);
        vm.studentEmail(studentEmail);
        vm.studentGUID(id);

        integration
          .all("Web_Ethos_Get_Student_Programs_by_Student_GUID_V2", {
            studentID: id,
          })
          .then(function (academicProgram) {
            var activeAcademicProgram = "";

            academicProgram.forEach(function (program, index) {
              var status = program.enrollmentStatus.status.toLowerCase();

              if (status == "inactive") return;

              activeAcademicProgram = program;
            });

            if (!activeAcademicProgram)
              notify("error", "No active program found");
            $(".loading").hide();
            var programGUID = activeAcademicProgram.program.id;
            vm.programGUID(programGUID);
            integration
              .all("Web_Ethos_Get_Academic_Program_by_program_GUID", {
                programID: programGUID,
              })
              .then(function (academicProgram) {
                vm.studentProgram(academicProgram.title);
                //  vm.programCode(academicProgram.code);
              });

            //======End Pull Multiple Programs and Pass Catalog Year correct Variable==========
            // (Optional) ES5-friendly Promise.all polyfill if needed in your environment
            if (!Promise.all) {
              Promise.all = function (promises) {
                return new Promise(function (resolve, reject) {
                  var results = [];
                  var remaining = promises.length;
                  if (remaining === 0) return resolve([]);
                  promises.forEach(function (p, i) {
                    Promise.resolve(p)
                      .then(function (res) {
                        results[i] = res;
                        remaining -= 1;
                        if (remaining === 0) resolve(results);
                      })
                      .catch(reject);
                  });
                });
              };
            }

            integration
              .all("Web_Ethos_Get_Student_Programs_by_Student_GUID_V2", {
                studentID: id,
              })
              .then(function (programs) {
                var dd = document.getElementById("programTitle");

                // Guard: ensure we have an array
                if (!programs || !programs.length) {
                  notify("error", "No programs found for this student.");
                  if (dd)
                    dd.innerHTML =
                      '<option value="">No programs found</option>';
                  return;
                  $(".loading").hide();
                }

                // 1) Filter to ACTIVE programs (status !== 'inactive')
                var activePrograms = [];
                programs.forEach(function (p) {
                  var status =
                    p && p.enrollmentStatus && p.enrollmentStatus.status
                      ? String(p.enrollmentStatus.status).toLowerCase()
                      : "";
                  if (status !== "inactive") activePrograms.push(p);
                });

                if (!activePrograms.length) {
                  notify("error", "No active programs found.");
                  if (dd)
                    dd.innerHTML =
                      '<option value="">No active programs</option>';
                  return;
                  $(".loading").hide();
                }

                // 2) Prep: GUID arrays and a map Program GUID -> Catalog GUID
                var activeProgramGUIDs = [];
                var programGUIDToCatalogGUID = {};
                var detailPromises = [];

                activePrograms.forEach(function (ap) {
                  var guid = ap && ap.program && ap.program.id;
                  var catalogId = ap && ap.catalog && ap.catalog.id;

                  if (guid) {
                    activeProgramGUIDs.push(guid);
                    if (catalogId) programGUIDToCatalogGUID[guid] = catalogId;

                    // Fetch academic program details to get title/code for dropdown text
                    detailPromises.push(
                      integration.all(
                        "Web_Ethos_Get_Academic_Program_by_program_GUID",
                        {
                          programID: guid,
                        },
                      ),
                    );
                  }
                });

                if (!detailPromises.length) {
                  notify(
                    "error",
                    "Active programs found, but missing program IDs.",
                  );
                  if (dd)
                    dd.innerHTML =
                      '<option value="">No valid program IDs</option>';
                  return;
                  $(".loading").hide();
                }

                // 3) Helper: Load Catalog Year (Calendar Year) for a given Program GUID
                function loadCatalogYearForProgramGUID(programGUID) {
                  var catalogGUID = programGUIDToCatalogGUID[programGUID];

                  if (!catalogGUID) {
                    if (typeof vm !== "undefined") {
                      vm.studentCatalogYear("");
                      $(".loading").hide();
                    }
                    return;
                  }

                  // ===== CATALOG YEAR LOOKUP =====
                  integration
                    .all("Web_Ethos_Academic_Catalogs", {
                      id: catalogGUID,
                    })
                    .then(function (catalogRes) {
                      // Resolve the catalog "code" from common Ethos shapes
                      var code =
                        (catalogRes && catalogRes.code) ||
                        (catalogRes &&
                          catalogRes.attributes &&
                          catalogRes.attributes.code) ||
                        (catalogRes &&
                          catalogRes.data &&
                          catalogRes.data.attributes &&
                          catalogRes.data.attributes.code) ||
                        "";

                      // Format "YYYY" (or any string containing a 4-digit year) to "YYYY-YY", or "UNK"
                      var display = formatCatalogYear(code);

                      // Set on your view model
                      if (typeof vm !== "undefined") {
                        vm.studentCatalogYear(display); // e.g., "2006-07" or "UNK"
                        vm.catalog(catalogGUID);
                      }
                    })
                    .catch(function (err) {
                      console.error("Catalog lookup failed:", err);
                      if (typeof vm !== "undefined") {
                        vm.studentCatalogYear("UNK"); // if lookup fails entirely, show UNK
                      }
                    });

                  /**
                   * Converts values like "2006" or "2006-2007" (or "AY2006") to "2006-07".
                   * Returns "UNK" if no 4-digit year is found or the year looks invalid.
                   */
                  function formatCatalogYear(code) {
                    //if (!code) return "UNK";
                    if (code == "UNK") {
                      notify(
                        "error",
                        "The program you selected does not have a catalog associated with it. Please contact Student Services for more information.",
                      );
                      return "UNK";
                    }

                    // Pull the first 4-digit year
                    var m = String(code).match(/\b(19|20)\d{2}\b/); // restrict to 1900–2099; adjust if needed
                    if (!m) return "UNK";

                    var y = parseInt(m[0], 10);
                    // sanity check (optional; adjust bounds if your catalogs go broader)
                    if (isNaN(y) || y < 1900 || y > 2099) return "UNK";

                    var nextYY = ("0" + ((y + 1) % 100)).slice(-2); // always 2 digits
                    return y + "-" + nextYY;
                  }
                  // ===== END CATALOG YEAR LOOKUP =====
                }

                // 4) Build dropdown after all details are fetched
                Promise.all(detailPromises)
                  .then(function (detailsArray) {
                    if (!dd) {
                      console.warn("Dropdown element #programTitle not found.");
                      return;
                    }

                    // Clear any existing options
                    dd.innerHTML = "";

                    // Placeholder option
                    var placeholder = document.createElement("option");
                    placeholder.value = "";
                    placeholder.text = "Select a program...";
                    dd.appendChild(placeholder);

                    // Create one option per active program
                    for (var i = 0; i < detailsArray.length; i++) {
                      var details = detailsArray[i];
                      var guid = activeProgramGUIDs[i];

                      var title =
                        details && details.title
                          ? details.title
                          : "Untitled Program";
                      var code =
                        details && details.code
                          ? " (" + details.code + ")"
                          : "";

                      var opt = document.createElement("option");
                      opt.value = guid; // Value = Program GUID
                      opt.text = title + code; // Visible = Title (Code)
                      dd.appendChild(opt);
                    }

                    // Auto-select first program and update VM + Catalog Year
                    if (detailsArray.length > 0) {
                      //   dd.value = activeProgramGUIDs[0];

                      if (typeof vm !== "undefined") {
                        vm.programGUID(activeProgramGUIDs[0]);
                        var selectedDetails = detailsArray[0];
                        if (selectedDetails && selectedDetails.title) {
                          vm.studentProgram(selectedDetails.title);
                        }
                      }

                      // 🔗 Pull the correct Catalog Year for the pre-selected program
                      loadCatalogYearForProgramGUID(activeProgramGUIDs[0]);
                    }

                    // React to user changes
                    dd.onchange = function () {
                      var selGUID = dd.value;

                      if (typeof vm !== "undefined") {
                        vm.programGUID(selGUID);
                      }

                      // Update the title in vm if we can match by index
                      var selIndex = activeProgramGUIDs.indexOf(selGUID);
                      if (selIndex > -1) {
                        var det = detailsArray[selIndex];
                        if (typeof vm !== "undefined" && det && det.title) {
                          vm.studentProgram(det.title);
                        }
                      }

                      // 🔗 Load the correct Catalog Year for the selected program
                      loadCatalogYearForProgramGUID(selGUID);
                    };
                  })
                  .catch(function (err) {
                    console.error(
                      "Error fetching academic program details:",
                      err,
                    );
                    notify("error", "Failed to load academic program details.");
                    if (dd)
                      dd.innerHTML =
                        '<option value="">Error loading programs</option>';
                  });
              })
              .catch(function (err) {
                console.error("Error fetching student programs:", err);
                notify("error", "Failed to load student programs.");
                var ddErrRoot = document.getElementById("programTitle");
                if (ddErrRoot)
                  ddErrRoot.innerHTML =
                    '<option value="">Error loading programs</option>';
              });
            //======End Pull Multiple Programs and Pass Catalog Year correct Variable==========

            $(".loading").hide();
          });
      });
  }
  function parseCatalogYear(str) {
    const match = str.match(/^(\d{4})-(\d{2})$/);

    if (!match) {
      return null;
    }

    return parseInt(match[1], 10);
  }

  function generateCatalogYears(baseCatalogYear, numberOfYears = 5) {
    const parsedYear = parseCatalogYear(baseCatalogYear);

    // invalid input → return null
    if (parsedYear === null) {
      return null;
    }

    const currentYear = new Date().getFullYear();

    const years = [];
    years.push("");

    for (let i = 0; i < numberOfYears; i++) {
      const yearStart = currentYear - i;
      const yearEnd = (yearStart + 1).toString().slice(-2);

      years.push(`${yearStart}-${yearEnd}`);
    }

    return years;
  }

  function populateCatalogDropdown(baseCatalogYear, dropdownSelector) {
    const $dropdown = $(dropdownSelector);
    $dropdown.empty();

    const options = generateCatalogYears(baseCatalogYear);

    // If invalid format → leave dropdown blank
    if (!options) {
      return;
    }

    options.forEach(function (year) {
      $dropdown.append(
        $("<option>", {
          value: year,
          text: year,
        }),
      );
    });
  }

  return vm;
});
