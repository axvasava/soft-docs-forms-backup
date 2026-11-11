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

	//const campusIds = formUtils.campusIds;
	//var isSupervisorFound;

	/*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
	$(".maskphone").mask("999-999-99999");
	$(".maskzip").mask("99999");
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

	function makeAutoCompleteReadOnly(elementID) {
		$(`#${elementID}`)
			.prop("disabled", true)
			.attr({
				tabindex: "-1",
				"aria-disabled": "true",
			})
			.css({
				"pointer-events": "none",
				"background-color": "#f5f5f5",
				color: "#555",
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

		vm.campus.subscribe(function (newValue) {
			switch (newValue) {
				case "Auburn Hills":
					vm.groupPrincipalID(campusIds.auburnHills.publicSafety.id);
					vm.publicSafetyEmail(
						campusIds.auburnHills.publicSafety.email,
					);
					vm.originalCampus("AuburnHills");
					break;
				case "Highland Lakes":
					vm.groupPrincipalID(
						campusIds.highlandLakes.publicSafety.id,
					);
					vm.publicSafetyEmail(
						campusIds.highlandLakes.publicSafety.email,
					);
					vm.originalCampus("HighlandLakes");
					break;
				case "Orchard Ridge":
					vm.groupPrincipalID(campusIds.orchardRidge.publicSafety.id);
					vm.publicSafetyEmail(
						campusIds.orchardRidge.publicSafety.email,
					);
					vm.originalCampus("OrchardRidge");
					break;
				case "Royal Oak":
					vm.groupPrincipalID(campusIds.royalOak.publicSafety.id);
					vm.publicSafetyEmail(campusIds.royalOak.publicSafety.email);
					vm.originalCampus("RoyalOak");
					break;
				case "Southfield":
					vm.groupPrincipalID(campusIds.southfield.publicSafety.id);
					vm.publicSafetyEmail(
						campusIds.southfield.publicSafety.email,
					);
					vm.originalCampus("Southfield");
					break;
				default:
					vm.groupPrincipalID("");
					vm.originalCampus("");
					break;
			}
		});

		$(".noSelectedDept").hide(); //If no department is selected, there will be a dropdown presented to the user

		if (user.isInLibrary || user.isInDrafts) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.
			vm.formID(formUtils.generateFormID());
			vm.addNewLocation("no");

			integration
				.all("Web_Ethos_Get_Persons_by_Colleague_ID", {
					personID: vm.originatorErpId(),
				})
				.then(function (personResults) {
					console.log("personResults:", personResults);
					if (personResults) {
						vm.personGUID(personResults[0].id);
						const personGUID = personResults[0].id;

						integration
							.first(
								"Web_Ethos_Get_active_institution_jobs_by_Person_GUID",
								{
									personGUID: personGUID,
								},
							)
							.then(function (allInstJob) {
								if (allInstJob) {
									const deptGUID = allInstJob.department.id;
									integration
										.first(
											"Web_Ethos_Get_Employment_Department_by_GUID",
											{
												deptGUID: deptGUID,
											},
										)
										.then(function (deptResults) {
											if (deptResults) {
												console.log(
													"Dept Results: ",
													deptResults,
												);
												vm.department(
													deptResults.title,
												);
											} else {
												console.log("No results: ");
											}
										});
								} else {
									$(".noSelectedDept").show();
									$(".selectedDept").hide();
								}
							});
					}
				});

			$(".otherLocationAdd").hide();
			$(".updateItemTable").hide();
		} else {
			//  Input Values set here will be saved to the server immediately.
			//  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
			//  prior users.  Inputs that already have values saved to the server will be overridden with
			//  values set in this method.
		}

		var itemDescriptionList = "";
		var itemQuantityList = "";
		var itemList = "";
		ko.computed(function Item() {
			itemDescriptionList = "";
			itemQuantityList = "";
			itemList = "";

			//loop through each row in the item list
			vm.itemList().forEach(function (item, index) {
				if (item.itemQuantity() && item.itemDescription()) {
					itemList +=
						item.itemQuantity() + " " + item.itemDescription();
					itemList += "  ";
				}
			});

			// now remove the last double space
			itemList = itemList.slice(0, -2);
			vm.itemQuantityList(itemList);
		});

		vm.addItems.subscribe(function (newValue) {
			if (newValue == "yes") {
				vm.addAdditionalItems("yes");

				fieldStateUtils.unlockContainers(["items"]);
			} else if (newValue == "no") {
				vm.addAdditionalItems("no");

				fieldStateUtils.lockContainers(["items"]);
			}
		});

		vm.addLocation.subscribe(function (newValue) {
			if (newValue == "yes") {
				vm.addNewLocation("yes");
			} else if (newValue == "no") {
				vm.addNewLocation("no");
			}
		});

		vm.campus.subscribe(function (newValue) {
			vm.selectedCampus(newValue);
		});

		vm.locationDetails.subscribe(function (newValue) {
			vm.selectedLocation(newValue);
		});

		vm.otherLocation.subscribe(function (newValue) {
			vm.selectedLocation(newValue);
		});

		vm.otherBuilding.subscribe(function (newValue) {
			vm.selectedBuilding(newValue);
		});

		vm.otherRoom.subscribe(function (newValue) {
			vm.selectedRoom(newValue);
		});

		vm.changeAddLocation.subscribe(function (newValue) {
			if (newValue == "yes") {
				//requiredIndicators.setRequired("updatedCampus", true);
				//requiredIndicators.setRequired("updatedLocation", true);
			} else if (newValue == "no") {
				//requiredIndicators.setRequired("updatedCampus", false);
				//requiredIndicators.setRequired("updatedLocation", false);
			}
		});

		vm.updatedCampus.subscribe(function (newValue) {
			let campus = vm.originalCampus();

			if (campus != newValue) {
				vm.selectedCampus(newValue); //updatedCampusSelection
			} else {
				vm.selectedCampus(campus);
			}
		});

		vm.updatedLocation.subscribe(function (newValue) {
			let location = vm.location();
			let otherLocation = vm.otherLocation();

			if (location === "Other - ") {
				if (otherLocation != newValue) {
					vm.selectedLocation(newValue);
				} else {
					vm.selectedLocation(otherLocation);
				}
			}
		});

		vm.updatedBuilding.subscribe(function (newValue) {
			let location = vm.location();
			let otherBuilding = vm.otherBuilding();

			if (location === "Other - ") {
				if (otherBuilding != newValue) {
					vm.selectedBuilding(newValue);
				} else {
					vm.selectedBuilding(otherBuilding);
				}
			}
		});

		vm.updatedRoom.subscribe(function (newValue) {
			let location = vm.location();
			let otherRoom = vm.otherRoom();

			if (location === "Other - ") {
				if (otherRoom != newValue) {
					vm.selectedRoom(newValue);
				} else {
					vm.selectedRoom(otherRoom);
				}
			}
		});
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
		autosize($("textarea"));

		if (
			pkg.isAtStep("WFAHPublicSafety") ||
			pkg.isAtStep("WFHLPublicSafety") ||
			pkg.isAtStep("WFORPublicSafety") ||
			pkg.isAtStep("WFROPublicSafety") ||
			pkg.isAtStep("WFSFPublicSafety")
		) {
			$(".updateItemTable").show();

			fieldStateUtils.lockFields([
				"department",
				"phone",
				"campus",
				"location",
				"otherBuilding",
				"otherRoom",
				"otherLocation",
			]);

			if (!vm.addAdditionalItems()) {
				fieldStateUtils.lockContainers(["items"]);
			}

			if (vm.location() == "Other - ") {
				$(".otherLocationAdd").show();
			} else {
				$(".otherLocationAdd").hide();
			}
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

		if (vm.location() == "Other - " && !vm.otherLocation()) {
			requiredIndicators.setRequired("otherLocation", true);
		} else {
			requiredIndicators.setRequired("otherLocation", false);
		}
	};

	vm.onApprove = function onApprove(form) {
		// This method is called when the Approve button is clicked and before calling beforeRequired.

		if (vm.location() == "Other - " && !vm.otherLocation()) {
			requiredIndicators.setRequired("otherLocation", true);
		} else {
			requiredIndicators.setRequired("otherLocation", false);
		}

		// Require addLocation when a new/other location was entered.
		if (
			vm.location() === "Other - " &&
			vm.addLocation() !== "yes" &&
			vm.addLocation() !== "no"
		) {
			throw new Error(
				"Please select Yes or No for whether you would like to add the new location to the First Aid Kit table.",
			);
		}

		// Require changeAddLocation only when the new location will be added.
		if (
			vm.addLocation() === "yes" &&
			vm.changeAddLocation() !== "yes" &&
			vm.changeAddLocation() !== "no"
		) {
			throw new Error(
				"Please select Yes or No for whether you would like to update the new kit location before it is added.",
			);
		}

		// Require an item-update selection.
		if (vm.addItems() !== "yes" && vm.addItems() !== "no") {
			throw new Error(
				"Please select Yes or No for whether you would like to update the items being requested.",
			);
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

	return vm;
});
