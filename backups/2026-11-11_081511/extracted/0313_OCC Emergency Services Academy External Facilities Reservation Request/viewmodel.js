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


    /*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
    $('.maskphone').mask('999-999-9999');
    $('.maskzip').mask('99999');
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

	function lockContainers() {
		fieldStateUtils.lockContainers([
			"agencyInfo",
			"rentalFees",
			"activityInfo2",
			"facilitiesInfo",
			"audioVisuals",
			"softwareInfo",
			"pdServices",
		]);
	}
	
	function makeReadOnly() {
	     vm.datesTimesRow().forEach( function(dynamicListRow, index) {
            dynamicListRow.activityDate.disabled = true;
            dynamicListRow.arrivalTime.disabled = true;
            dynamicListRow.departTime.disabled = true;
            
            $(".btn-disable").prop("disabled", true);
        });
        
        $(".addDatesTimes").prop('disabled', true).attr('aria-disabled', 'true');
        $(".removeDatesTimes").prop('disabled', true).attr('aria-disabled', 'true');


	}
	
	function datesTimesRowValidate(){
        vm.datesTimesRow().forEach( function(dynamicListRow, index) {
            if (!dynamicListRow.activityDate()) {
                throw new Error("Please check the Activity Date field, it is required.");
            }
                
            if (!dynamicListRow.arrivalTime()) {
                throw new Error("Please check the Arrival Time field, it is required.");
            }
            
            if (!dynamicListRow.departTime()) {
                throw new Error("Please check the Departure Time field, it is required.");
            }
        });
    }

	vm.noStudentFound = ko.observable(false);

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

		
		//foundStudentID is a checkbox
		vm.noStudentFound.subscribe(function (isChecked) {
			if (isChecked) {
				vm.nisID("No_ID");
				vm.nisVendorName(vm.agency());

				vm.vendorPayeeName(undefined);
				fieldStateUtils.setDisabled("vendorSearch");     
				fieldStateUtils.setDisabled("differentPayee");
				fieldStateUtils.setDisabled("differentAddress");
			} else {
				vm.nisID(undefined);
				vm.nisVendorName(undefined);

				vm.vendorPayeeName(undefined);
				fieldStateUtils.unlockFields(["vendorSearch", "differentPayee", "differentAddress"]);
			}
		});
		
		vm.agency.subscribe(function (value) {
			vm.vendorName(value); 
		});
		
		vm.differentPayee.subscribe(function (isChecked) {
			if (isChecked) {
			    vm.vendorName(vm.differentVendorPayeeName());
			} else {
                 vm.vendorName(vm.agency()); 
			}
		});
		
		vm.vendorPayeeName.subscribe(function(value) {
		    vm.vendorName(value);
		});
		
		vm.differentVendorPayeeName.subscribe(function (value) {
		    vm.vendorName(value);
		});
		
		vm.vendorSearch.subscribe((newVal) => {
			if (newVal && newVal !== "") {
				if (newVal.length < 7) {
					vm.vendorSearch(newVal.padStart(7, "0"));
				}
			}
		});

		$("#vendorSearchButton").on("click", () => {
			if (vm.vendorSearch() && vm.vendorSearch() !== "") {
				vm.vendorPayeeName("");
				vm.address("");
				vm.city("");
				vm.state("");
				vm.zip("");

				let promiseArrays = [];

				promiseArrays.push(
					integration.first(
						"Web_Ethos_Get_Organizations_by_ColleagueID",
						{
							ColleagueID: vm.vendorSearch(),
						},
					),
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

				Promise.all(promiseArrays).then(
					function (allMyPromisesReturned) {
						if (allMyPromisesReturned[0]) {
							notify("success", "Organization Found");
							var data = allMyPromisesReturned[0];
							vm.vendorPayeeName(data.title);
							var addresses = data.addresses;
							var addressID;

							const targetAddress = addresses
								.filter(
									(addr) =>
										addr.type.addressType === "billing",
								)
								.sort(
									(a, b) =>
										new Date(b.startOn) -
										new Date(a.startOn),
								)[0];
							const primaryAddress = addresses.find(
								(addr) => addr?.preference === "primary",
							);

							if (targetAddress)
								vm.organizationAddressId(
									targetAddress.address.id,
								);
							else
								vm.organizationAddressId(
									primaryAddress.address.id,
								);
						} else if (allMyPromisesReturned[1]) {
							notify("success", "Institution Found");
							var payeeData = allMyPromisesReturned[1];
							vm.vendorPayeeName(allMyPromisesReturned[1].title);
							var payeeAddressID =
								payeeData.addresses[0].address.id;
							vm.organizationAddressId(payeeAddressID);
						} else if (allMyPromisesReturned[2]) {
							notify("success", "Person Found");
							var payeeData = allMyPromisesReturned[2];

							vm.vendorPayeeName(
								allMyPromisesReturned[2].names[0].fullName,
							);

							var payeeAddresses = payeeData.addresses;

							var payeeAddressID2;

							for (var a = 0; a < payeeAddresses.length; a++) {
								if (
									payeeAddresses[a].preference === "primary"
								) {
									payeeAddressID2 =
										payeeAddresses[a].address.id;
									vm.organizationAddressId(payeeAddressID2);
									break; // Stop the loop once the primary address is found
								}
							}
						} else {
							notify("error", "Colleague ID not found.");
						}
					},
				);
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
						vm.state(
							dataFromSource.place.country.region.code.substring(
								3,
							),
						);
						vm.zip(dataFromSource.place.country.postalCode);
					});
			}
		});
        
        if (user.isInLibrary) {
            //  Input Values set here will be saved to the server when the user makes a form
            //  instance creating action: changing an input value or clicking submit.

        } else {
            //  Input Values set here will be saved to the server immediately.
            //  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
            //  prior users.  Inputs that already have values saved to the server will be overridden with
            //  values set in this method.

        }
        
        if (pkg.isAtStep("Start")) {
			$(".agencySignature").hide();

		}
        
        if (pkg.isAtStep("ESign")) {
			$(".agencySignature").show();
			$(".occRentalFeeNotes").hide();
			
			lockContainers();
			makeReadOnly();
			
			fieldStateUtils.lockFields(["representativeSignature", "representativePhone"]);
			
		}
		
		if (pkg.isAtStep("PublicServices")) {
		    $(".agencySignature").show();
			
			lockContainers();
			makeReadOnly();
			
			fieldStateUtils.lockFields(["representativeSignature", "representativePhone"]);
			$(".venSearchBtn").prop('disabled', true).attr('aria-disabled', 'true');
		    
		}

		vm.organizationRepSignature.subscribe(function (newValue) {
			const signature = String(newValue || "").trim();

			vm.organizationRepSignDate(
				signature ? formUtils.getTodayDate() : undefined,
			);
		});
		
		vm.representativeSignature.subscribe(function (newValue) {
			const signature = String(newValue || "").trim();

			vm.representativeSignDate(
				signature ? formUtils.getTodayDate() : undefined,
			);
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
        autosize($('textarea'));
        
        if (vm.datesTimesRow().length === 0){
		     vm.datesTimesRow.push({});
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

        if (vm.food() == 'Yes') {
            if (!vm.breakfast() && !vm.lunch() && !vm.dinner()) {
              notify('error', 'Breakfast, lunch or dinner is required');
              return false;
            }
        }
        
        
        if (vm.lowerSite()) {
           if (!vm.bank() && !vm.gasStation() && !vm.motel() && !vm.twoStory() && !vm.ranch() && !vm.streets() && !vm.capeCod()) {
              notify('error', 'A Lower Site must be selected');
              return false;
           }
        }
        
        if (vm.upperSite()) {
           if (!vm.burnTower() && !vm.dirtyClassroom() && !vm.burnPit() && !vm.carFire() && !vm.phase1() && !vm.phase2() && !vm.mobile()) {
              notify('error', 'An Upper Site must be selected');
              return false;
           }
        }
        
        if (vm.trainingCenter()) {
           if (!vm.classroom114A() && !vm.classroom114B() && !vm.classroom122A() && !vm.classroom112B() && !vm.videoConferencing()) {
              notify('error', 'A Training Center must be selected');
              return false;
           }
        }
        
        if (vm.vehicles()) {
           if (!vm.policeCar() && !vm.firetruck() && !vm.civilianVehicle() && !vm.ambulance()) {
              notify('error', 'A Vehicle must be selected');
              return false;
           }
        }

        if (!$("#certificateYes").is(":checked") && !$("#certificateNo").is(":checked")) {
			if (form.attachmentCount < 1) { 
               notify('error','Certificate of Insurance is required'); 
               return false;
            }
		}
		
		if (vm.nonRequired() == 'no') {
           if (!vm.nonRequiredReason()) {
              notify('error', 'A reason is required if Non-Required / Reason is checked');
              return false;
           }
        }
        
        if (vm.secondaryContact()) {
            if (!vm.secondaryContactName()) {
                notify("error", "Secondary Contact Name is required");
                return false;
            }
            
            if (!vm.secondaryContactPhone()) {
                notify("error", "Secondary Contact Phone is required");
                return false;
            }
            
            if (!vm.secondaryContactEmail()) {
                notify("error", "Secondary Contact Email is required");
                return false;
            }

        }
        
        if (vm.noStudentFound()) {
           if (vm.agency()){
              let agencyName = vm.agency();
              vm.vendorName(agencyName);
           } else if (!vm.agency()){ 
              notify("error", "Agency name is required");
              return false;
           }   
        }
         
         datesTimesRowValidate();
         
    };

    vm.onApprove = function onApprove(form) {
        //  This method is called when the Approve button is clicked and before calling beforeRequired.
        

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
