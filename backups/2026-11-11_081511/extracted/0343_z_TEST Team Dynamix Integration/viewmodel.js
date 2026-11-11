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
	/*-- WARNING: Uncommenting the line of code below will allow you to use Etrieve Extenders on this form.
    Currently, Etrieve Extenders are only compatible with cloud based instances of Etrieve.
    If you are unsure if you can utilize Extenders, please contact your institution's Etrieve Administrator.*/
	// 'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js'
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
) {
	vm.addObservable("ticketResponse");
	vm.ticketResponse("");
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
	const TD_BASE_URL = "https://oaklandcc.teamdynamix.com/SBTDWebAPI/api";

	const TD_CREDENTIALS = {
		username: "softdocs.integration",
		password: "8rMQDtO6X@9GdBAEynbmI",
	};

	const tdRequest = {
		AccountID: 33824,
		ArticleID: 0,
		Attributes: [
			{
				AssociatedItemIDs: [0],
				Choices: [],
				DataType: "Int32",
				Description:
					"Include the employee's ID number.  This information is required to verify that the correct employee record is being updated.",
				FieldType: "textbox",
				ID: 26718,
				IsRequired: false,
				IsUpdatable: false,
				Name: "Employee ID Number",
				Order: 0,
				SectionID: 0,
				SectionName: null,
				Value: "1430579",
				ValueText: "1430579",
			},
			{
				AssociatedItemIDs: [0],
				Choices: [],
				DataType: "String",
				Description:
					"Include Employee's Birth Date.  This information is required to verify that the correct employee record is being updated.\nExample format: 01/10/96",
				FieldType: "textbox",
				ID: 26894,
				IsRequired: false,
				IsUpdatable: false,
				Name: "Employee's Birth Date",
				Order: 0,
				SectionID: 0,
				SectionName: null,
				Value: "11/11/11",
				ValueText: "11/11/11",
			},
			{
				AssociatedItemIDs: [0],
				Choices: [
					{
						IsActive: true,
						Name: "Legal Name Change",
						Order: 0,
					},
					{
						IsActive: true,
						Name: "Chosen Name Added",
						Order: 1,
					},
				],
				DataType: "String",
				Description:
					"Specify the type of name change that has occurred for the student or employee.  Is this change occurring due to a legal name change or the addition of a chosen name.",
				FieldType: "hradio",
				ID: 110211,
				IsRequired: false,
				IsUpdatable: false,
				Name: "Type of Name Change",
				Order: 0,
				SectionID: 0,
				SectionName: null,
				Value: "358994",
				ValueText: "Legal Name Change",
			},
			{
				AssociatedItemIDs: [0],
				Choices: [],
				DataType: "String",
				Description:
					"Include the Employee's new or corrected full name.  This information is required to verify that the correct employee record is being updated.\nExample: Smith, Jane L",
				FieldType: "textbox",
				ID: 26719,
				IsRequired: false,
				IsUpdatable: false,
				Name: "Employee's New/Correct Name",
				Order: 0,
				SectionID: 0,
				SectionName: null,
				Value: "TEST, DO NOT ASSIGN",
				ValueText: "TEST, DO NOT ASSIGN",
			},
			{
				AssociatedItemIDs: [0],
				Choices: [],
				DataType: "String",
				Description:
					"Include the Employee's old or incorrect full name.  This information is required to verify that the correct employee record is being updated.\nExample: Wright, Jane L",
				FieldType: "textbox",
				ID: 26724,
				IsRequired: false,
				IsUpdatable: false,
				Name: "Employee's Old/Incorrect Name",
				Order: 0,
				SectionID: 0,
				SectionName: null,
				Value: "Person, Not A",
				ValueText: "Person, Not A",
			},
			{
				AssociatedItemIDs: [0],
				Choices: [
					{
						IsActive: true,
						Name: "LEGAL: Normal process to update User Name to reflect New Name",
						Order: 0,
					},
					{
						IsActive: true,
						Name: "CHOSEN: Run XNC4/XNC5 to update User Name to reflect Chosen Name",
						Order: 1,
					},
				],
				DataType: "String",
				Description:
					"Processing instructions specific to the type of name change request: Legal or Chosen name changes.",
				FieldType: "vradio",
				ID: 110212,
				IsRequired: false,
				IsUpdatable: false,
				Name: "Name Change Processes",
				Order: 0,
				SectionID: 0,
				SectionName: null,
				Value: "358997",
				ValueText:
					"LEGAL: Normal process to update User Name to reflect New Name",
			},
			{
				AssociatedItemIDs: [0],
				Choices: [],
				DataType: "DateTime",
				Description: "Date that the change should take effect.",
				FieldType: "datefield",
				ID: 27042,
				IsRequired: false,
				IsUpdatable: false,
				Name: "Effective Date",
				Order: 0,
				SectionID: 0,
				SectionName: null,
				Value: "08/05/26",
				ValueText: "08/05/26",
			},
			{
				AssociatedItemIDs: [0],
				Choices: [
					{
						IsActive: true,
						Name: "LDAP",
						Order: 0,
					},
					{
						IsActive: true,
						Name: "Student Email",
						Order: 0,
					},
					{
						IsActive: true,
						Name: "Other",
						Order: 1,
					},
				],
				DataType: "String",
				Description:
					"Select your Colleague related administration request",
				FieldType: "dropdown",
				ID: 20432,
				IsRequired: false,
				IsUpdatable: true,
				Name: "Colleague Administration",
				Order: 0,
				SectionID: 0,
				SectionName: null,
				Value: "50726",
				ValueText: "Other",
			},
		],
		Description:
			"The listed employee’s name change has been processed by the Human Resources Department, either due to a Legal name change or a Chosen name change request.  <br><br>Please update the Employee's Network ID/User name, renaming the Email accounts and phone/voicemail box information accordingly.",
		EndDate: "2026-08-06",
		EstimatedMinutes: 78,
		ExpensesBudget: 0.0,
		FormID: 52180,
		ImpactID: 2695,
		IsRichHtml: true,
		LocationID: 0,
		LocationRoomID: 0,
		ParentID: 0,
		PriorityID: 2702,
		RequestorUid: "328be294-3285-f111-86f3-bb6d502f31c1",
		ResponsibleGroupID: 3856,
		ServiceID: 16128,
		ServiceOfferingID: 0,
		SourceID: 837,
		StartDate: "2026-08-04",
		StatusID: 6859,
		Tags: [],
		TimeBudget: 0.0,
		Title: "Employee Name change - Update User Name/Rename Email Account(s)/Update Phone",
		TypeID: 13672,
		UrgencyID: 0,
	};

	async function authenticateTD() {
		const response = await fetch(`${TD_BASE_URL}/auth`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(TD_CREDENTIALS),
		});

		if (!response.ok) {
			throw new Error("Authentication failed.");
		}

		return response.text(); // TD returns the bearer token as plain text
	}

	async function createTicket(token) {
		const response = await fetch(`${TD_BASE_URL}/287/tickets`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(tdRequest),
		});

		const body = await response.text();

		if (!response.ok) {
			throw new Error(body);
		}

		return body;
	}

	$("#ele3").click(function (event) {
		event.preventDefault();

		const $button = $(this);

		$button.prop("disabled", true);
		vm.ticketResponse("Creating ticket...");

		authenticateTeamDynamix()
			.then(function (token) {
				return createTeamDynamixTicket(token);
			})
			.then(function (ticketResult) {
				vm.ticketResponse(JSON.stringify(ticketResult, null, 2));

				console.log("TeamDynamix ticket result:", ticketResult);
				notify("success", "TeamDynamix ticket created.");
			})
			.catch(function (error) {
				const errorMessage =
					error && error.message
						? error.message
						: "Unknown TeamDynamix error.";

				vm.ticketResponse(errorMessage);

				console.error("TeamDynamix ticket error:", error);
				notify("error", "Failed to create TeamDynamix ticket.");
			})
			.finally(function () {
				$button.prop("disabled", false);
			});
	});

	function authenticateTeamDynamix() {
		return fetch(`${TD_BASE_URL}/auth`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(TD_CREDENTIALS),
		}).then(function (response) {
			return parseTeamDynamixResponse(response, "Authentication failed");
		});
	}

	function createTeamDynamixTicket(token) {
		return fetch(`${TD_BASE_URL}/287/tickets`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(tdRequest),
		}).then(function (response) {
			return parseTeamDynamixResponse(response, "Ticket creation failed");
		});
	}

	function parseTeamDynamixResponse(response, fallbackMessage) {
		const contentType = response.headers.get("content-type") || "";

		const responseBody = contentType.includes("application/json")
			? response.json()
			: response.text();

		return responseBody.then(function (body) {
			if (!response.ok) {
				const details =
					typeof body === "string"
						? body
						: JSON.stringify(body, null, 2);

				throw new Error(
					`${fallbackMessage}: ${response.status} ${response.statusText}\n${details}`,
				);
			}

			return body;
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
	};

	vm.afterLoad = function afterLoad() {
		//  This method is called after setDefaults has been called.

		//  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
		//  to save values to the server.

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		vm.afterLoad = function afterLoad() {
			liveVM.afterLoadEditsForVM();

			autosize($("textarea"));
		};

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

	return vm;
});
