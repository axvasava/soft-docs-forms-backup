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
	var formLifecycle = formUtils.createFormLifecycleUtils({
		vm: vm,
		pkg: pkg,
		user: user,
		formUtils: formUtils,
	});

	var requiredIndicators = formLifecycle.requiredIndicators;
	var fieldStateUtils = formLifecycle.fieldStateUtils;
	var fieldValidation = formLifecycle.fieldValidation;
    //This function is used to set the autosize function on textareas with a class of autosizeareas.
    //Uncomment to use.
    //autosize($('.autosizeareas'));

    $(".supervisor").hide();

    /*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
    $('.maskphone').mask('(999)999-9999? ext:9999');
    $('.maskzip').mask('99999?-9999');
    $('.maskssn').mask('999-99-9999');
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
    
    function readOnlyFields() {
		fieldStateUtils.lockFields([
			"campus",
			"counselorNotes",
			"counselorSignature",
			"requestedDate",

		]);
	}
	
	function disableAddScheduleChangeList(){
	    vm.addScheduleChangeRow().forEach(function (dynamicListRow, index) {
			dynamicListRow.requestedDate.disabled = true;
			dynamicListRow.requestedStart.disabled = true;
			dynamicListRow.requestedEnd.disabled = true;
			dynamicListRow.requestedType.disabled = true;
			dynamicListRow.scheduleCode.disabled = true;
		
			$(".btn-delete-item").prop("disabled", true);
		});
	}

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

        if (user.isInLibrary) {
            //  Input Values set here will be saved to the server when the user makes a form
            //  instance creating action: changing an input value or clicking submit.

        } else {
            //  Input Values set here will be saved to the server immediately.
            //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
            //  prior users.  Inputs that already have values saved to the server will be overridden with
            //  values set in this method.

        }
        
        vm.counselorSignature.subscribe(function (sign) {
            vm.counselorSignatureDate(formUtils.getTodayDate());
        });
        
        vm.supervisorSignature.subscribe(function (sign) {
            vm.supervisorSignatureDate(formUtils.getTodayDate());
        });
        
        if (pkg.isAtStep("Supervisor")) {
			//can use internal notes and history as signature
			$(".supervisor").show();

            readOnlyFields();
			fieldStateUtils.unlockFields(["supervisorSignature"]);
			disableAddScheduleChangeList();
		}
		
		if (pkg.isAtStep("StudentServicesSpecialists")) {
			//can use internal notes and history as signature
			$(".supervisor").show();

		    readOnlyFields();
			fieldStateUtils.lockFields(["supervisorSignature"]);
			disableAddScheduleChangeList();
		}
    };

    vm.afterLoad = function afterLoad() {
        //  This method is called after setDefaults has been called.

        //  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
        //  to save values to the server.

        //Initialize FormBuilder created form specific code
        liveVM.afterLoadEditsForVM();
        
        formLifecycle.afterLoad();


        /*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
        autosize($('textarea'));
        
        if (vm.addScheduleChangeRow().length === 0){
		     vm.addScheduleChangeRow.push({});
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
        
        for (var i = 0; i < vm.addScheduleChangeRow().length; i++){ 
          if (!vm.addScheduleChangeRow()[i].requestedDate() || !vm.addScheduleChangeRow()[i].requestedStart() || !vm.addScheduleChangeRow()[i].requestedEnd()
              || !vm.addScheduleChangeRow()[i].requestedType() || !vm.addScheduleChangeRow()[i].scheduleCode()){ 
              notify("error", 'All schedule change information is required.') ;
              return false;
          } 
        }
    };

    vm.onApprove = function onApprove(form) {
        //  This method is called when the Approve button is clicked and before calling beforeRequired.
       
       if (!vm.supervisorSignature()) {
          requiredIndicators.setRequired("supervisorSignature", true);
       }
    };

    vm.onDecline = function onDecline(form) {
        //  This method is called when the Decline button is clicked and before calling beforeRequired.
       

    };

    vm.beforeRequired = function beforeRequired(form) {
        //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
        formLifecycle.beforeRequired();

    };

    vm.afterRequired = function afterRequired(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.
        formLifecycle.afterRequired();

    };

     vm.onOptOut = function onOptOut(form) {
       //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    vm.onESignSubmit = function onESignSubmit(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };
    
    // custom code ************************************************
	function submitFormsAPI() {
		const apiUrl = "https://oaklandcccentral.etrieve.cloud"; // Replace with your API base URL (no ending "/")

		const apiCalls = [
			{
				formTemplateID: "103", // Form: "Sabbatical Committee Notification"
				formData: [
					{
						ID: "committeeEmails",
						Values: [vm.committeeEmails()],
					},
					{
						ID: "execCouncilName",
						Values: [vm.execCouncilDisplayName()],
					},
					{
						ID: "formCode",
						Values: [vm.formCode()],
					},
					{
						ID: "applicantName",
						Values: [vm.chosenFIrstName()],
					},
				],
			},
		];

		const preEndpoint = "forms/api/Form/?templateVersionID=";
		// Array of Promises for Form creation
		const p_FormDraftCreation = [];
		const p_FormDataUpdate = [];
		const p_FormSubmit = [];

		// Push promises into the array based on the endpoints and payloads
		apiCalls.forEach((call) => {
			const url = `${apiUrl}/${preEndpoint}${call.formTemplateID}`;
			const payloadCall = call.payload;

			p_FormDraftCreation.push(apiRequest("POST", url, payloadCall));
		});

		// Handle the result of all promises
		Promise.all(p_FormDraftCreation)
			.then((draftResults) => {
				draftResults.forEach((draftResponse, index) => {
					// Handle successful API response

					/* ***************************************************************************** */
					/* ADD DATA INTO FORM DRAFT **************************************************** */
					/* ***************************************************************************** */

					// now that draft is created, add data into draft
					let urlPUT = `${apiUrl}/forms/api/Form/?`;
					if (apiCalls[index].formData.length > 0) {
						let formData = apiCalls[index].formData;
						let draftID = draftResponse.ID;
						let payload = {
							FormID: draftID,
							ChangedInputValues: formData,
							TaskID: null,
							IsFirstLoadFromLibrary: true,
							IsInDrafts: false,
							IsOriginator: true,
						};
						p_FormDataUpdate.push(
							apiRequest("PUT", urlPUT, payload),
						);
					}
				});

				Promise.all(p_FormDataUpdate)
					.then((dataResults) => {
						dataResults.forEach((dataResponse, dataIndex) => {
							// Handle successful API response
							console.log(
								"Form Data Update API Response ${dataIndex + 1}",
							);
						});

						/* ***************************************************************************** */
						/* SUBMIT FORM INTO WORKFLOW *************************************************** */
						/* ***************************************************************************** */

						draftResults.forEach((draftResponse, index) => {
							let urlPUT = `${apiUrl}/forms/api/form/Submit/?`;
							let draftID = draftResponse.ID;
							let payload = {
								FormID: draftID,
								CaptchaResponse: "",
								ActorFilterValue: "",
								loadingId: "",
							};

							p_FormSubmit.push(
								apiRequest("PUT", urlPUT, payload),
							);
						});

						Promise.all(p_FormSubmit)
							.then((submitResults) => {
								submitResults.forEach(
									(submitResponse, submitIndex) => {
										// Handle successful API response
										console.log(
											`Submit Form API Response ${submitIndex + 1}`,
										);
									},
								);

								notify(
									"success",
									"Committee has been notified.",
								);

								apiCalls.length = 0; // clear global variable of apiCalls
							})
							.catch((error) => {
								// Handle any error occurred during the promises
								console.error("Form Submit API Error:", error);
								notify("error", "Issue with Submit.");
							});
					})
					.catch((error) => {
						// Handle any error occurred during the promises
						console.error("Form Data API Error:", error);
						notify("error", "Issue with Form Draft data.");
					});
			})
			.catch((error) => {
				// Handle any error occurred during the promises
				console.error("Form Draft Cration API Error:", error);
				notify("error", "Issue with Form Draft creation.");
			});
	}

	// functional code ************************************
	function apiRequest(method, url, payload = null) {
		// Get the CSRF token from cookies
		const csrfToken = getCSRFToken();

		const options = {
			method: method,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"X-CSRF-Token": csrfToken, // Include the CSRF token in the request headers
				// Add any additional headers if needed
			},
			body: payload ? JSON.stringify(payload) : null,
		};

		return fetch(url, options)
			.then((response) => handleResponse(response))
			.catch((error) => {
				console.error("API Request Error:", error);
				throw error;
			});
	}

	function handleResponse(response) {
		const contentType = response.headers.get("content-type");

		return new Promise((resolve, reject) => {
			if (contentType && contentType.includes("application/json")) {
				response.json().then((data) => {
					if (response.ok) {
						resolve(data);
					} else {
						reject(new Error(data.message || "API Error"));
					}
				});
			} else if (!contentType || contentType === "text/plain") {
				// Treat empty responses or responses with content type 'text/plain' as success
				resolve("success");
			} else {
				reject(new Error("Invalid content type in response"));
			}
		});
	}

	function getCSRFToken() {
		// Replace 'csrfToken' with the name of your CSRF token cookie
		return document.cookie
			.split("; ")
			.find((row) => row.startsWith("CSRFToken"))
			.split("=")[1];
	}

    return vm;
});
