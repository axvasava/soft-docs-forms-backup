define([
	"jquery",
	"knockout",
	"vmBase",
	"integration",
	"notify",
	"user",
	"package",
	"https://webapps.oaklandcc.edu/cdn/occ-framework/occFramework.js",
	"https://softdocscdn.etrieve.cloud/extenders/extenders.min.js",
], function viewmodel($, ko, vm, integration, notify, user, pkg, occFramework) {
	var coveringEmployeeAutocomplete;
	var coveringEmployeeOptions = [];
	var departmentAutocomplete;
	var employeeInformationState;
	var nursingFacilitatorAutocomplete;
	var nursingFacilitatorOptionsPromise;

	function getTodayDateValue() {
		var today = new Date();
		var month = String(today.getMonth() + 1).padStart(2, "0");
		var day = String(today.getDate()).padStart(2, "0");

		return today.getFullYear() + "-" + month + "-" + day;
	}

	function setInlineError(inputId, errorId, invalid) {
		var input = document.getElementById(inputId);
		var error = document.getElementById(errorId);

		error.hidden = !invalid;

		if (invalid) {
			input.setAttribute("aria-invalid", "true");
		} else {
			input.removeAttribute("aria-invalid");
		}
	}

	function clearDepartmentError() {
		setInlineError("departmentSearch", "departmentError", false);
	}

	function validateDepartment() {
		var committedValue = document.getElementById("department").value;

		setInlineError("departmentSearch", "departmentError", !committedValue);
	}

	function clearNursingFacilitatorError() {
		setInlineError("facilitatorName", "facilitatorNameError", false);
	}

	function validateNursingFacilitator() {
		var nursingIsActive =
			document.getElementById("department").value === "Nursing";
		var facilitatorInput = document.getElementById("facilitatorName");
		var committedValue = document.getElementById(
			"nursingFacilitatorSelection",
		).value;

		setInlineError(
			"facilitatorName",
			"facilitatorNameError",
			nursingIsActive && !facilitatorInput.readOnly && !committedValue,
		);
	}

	function clearCoveringEmployeeError() {
		setInlineError("coveringEmployee", "coveringEmployeeError", false);
	}

	function validateCoveringEmployee() {
		var coveringEmployee = document.getElementById("coveringEmployee");
		var committedValue = document.getElementById(
			"coveringEmployeeSelection",
		).value;

		setInlineError(
			"coveringEmployee",
			"coveringEmployeeError",
			!coveringEmployee.readOnly && !committedValue,
		);
	}

	function clearCourseError() {
		setInlineError("course", "courseError", false);
		setInlineError("courseSelection", "courseError", false);
	}

	function getActiveCourseControl() {
		var courseSelection = document.getElementById("courseSelection");

		return courseSelection.hidden
			? document.getElementById("course")
			: courseSelection;
	}

	function validateCourse() {
		var courseInput = document.getElementById("course");
		var courseSelection = document.getElementById("courseSelection");
		var course = getActiveCourseControl();
		var error = document.getElementById("courseError");
		var message = "";

		courseInput.removeAttribute("aria-invalid");
		courseSelection.removeAttribute("aria-invalid");

		if (course.required && !course.value.trim()) {
			message =
				course === courseSelection
					? "Select a course from the list."
					: "Enter a course.";
		} else if (
			course === courseInput &&
			!course.readOnly &&
			course.validity.patternMismatch
		) {
			message = "Enter a course in AAA-9999 format, such as NUR-1410.";
		}

		error.textContent = message;
		setInlineError(course.id, "courseError", Boolean(message));
	}

	function validateReasonForRequest() {
		var reason = document.getElementById("reasonForRequest");

		setInlineError(
			"reasonForRequest",
			"reasonForRequestError",
			!reason.readOnly && reason.required && !reason.value.trim(),
		);
	}

	function listenForAutocompleteFocusout(rootId, validate) {
		var root = document.getElementById(rootId);

		root.addEventListener(
			"focusout",
			function validateAfterFocusLeaves(event) {
				if (!root.contains(event.relatedTarget)) {
					validate();
				}
			},
		);
	}

	function initializeInlineValidation() {
		var courseInput = document.getElementById("course");
		var courseSelection = document.getElementById("courseSelection");
		var courseError = document.getElementById("courseError");
		var reason = document.getElementById("reasonForRequest");
		var reasonError = document.getElementById("reasonForRequestError");
		var startDate = document.getElementById("startDate");
		var endDate = document.getElementById("endDate");
		var startDateError = document.getElementById("startDateError");
		var endDateError = document.getElementById("endDateError");
		var today = getTodayDateValue();
		var startDateChanged = false;
		var endDateChanged = false;
		var startDateValidated = false;
		var endDateValidated = false;

		function showDateError(input, error, message) {
			if (message) {
				error.textContent = message;
			}

			setInlineError(input.id, error.id, Boolean(message));
		}

		function startDateIsValid() {
			return (
				Boolean(startDate.value) &&
				(!startDateChanged || startDate.value >= today)
			);
		}

		function getStartDateError() {
			if (!startDate.value) {
				return "Enter your first day off.";
			}

			if (startDateChanged && startDate.value < today) {
				return "Your first day off cannot be before today.";
			}

			return "";
		}

		function getEndDateError() {
			if (!endDate.value) {
				return "Enter your last day off.";
			}

			if (endDateChanged && endDate.value < today) {
				return "Your last day off cannot be before today.";
			}

			if (startDateIsValid() && endDate.value < startDate.value) {
				return "Your last day off cannot be before your first day off.";
			}

			return "";
		}

		function validateStartDate(showNewError) {
			var message = getStartDateError();

			if (!message || showNewError) {
				showDateError(startDate, startDateError, message);
			}
		}

		function validateEndDate(showNewError) {
			var message = getEndDateError();

			if (!message || showNewError) {
				showDateError(endDate, endDateError, message);
			}
		}

		function updateStartDateMinimum() {
			// Keep a persisted historical value natively valid until it is edited.
			startDate.min =
				!startDateChanged && startDate.value && startDate.value < today
					? startDate.value
					: today;
		}

		function updateEndDateMinimum() {
			// Keep a persisted historical value natively valid until it is edited.
			var savedHistoricalDateIsUnchanged =
				!endDateChanged && endDate.value && endDate.value < today;
			var minimum = savedHistoricalDateIsUnchanged
				? endDate.value
				: today;

			if (
				startDateIsValid() &&
				(!savedHistoricalDateIsUnchanged || startDateChanged) &&
				startDate.value > minimum
			) {
				minimum = startDate.value;
			}

			endDate.min = minimum;
		}

		listenForAutocompleteFocusout(
			"departmentAutocomplete",
			validateDepartment,
		);
		listenForAutocompleteFocusout(
			"facilitatorAutocomplete",
			validateNursingFacilitator,
		);
		listenForAutocompleteFocusout(
			"coveringEmployeeAutocomplete",
			validateCoveringEmployee,
		);

		[courseInput, courseSelection].forEach(
			function listenForCourseValidation(courseControl) {
				courseControl.addEventListener("focusout", validateCourse);
				courseControl.addEventListener(
					"input",
					function updateVisibleCourseError() {
						if (!courseError.hidden) {
							validateCourse();
						}
					},
				);
			},
		);
		courseSelection.addEventListener(
			"change",
			function commitSelectedCourse() {
				vm.course(courseSelection.value);

				if (!courseError.hidden) {
					validateCourse();
				}
			},
		);
		reason.addEventListener("focusout", validateReasonForRequest);
		reason.addEventListener("input", function updateVisibleReasonError() {
			if (!reasonError.hidden) {
				validateReasonForRequest();
			}
		});

		updateStartDateMinimum();
		updateEndDateMinimum();

		startDate.addEventListener(
			"focusout",
			function validateStartDateOnFocusout() {
				startDateValidated = true;
				validateStartDate(true);
			},
		);

		endDate.addEventListener(
			"focusout",
			function validateEndDateOnFocusout() {
				endDateValidated = true;
				validateEndDate(true);
			},
		);

		["input", "change"].forEach(function listenForDateChanges(eventName) {
			startDate.addEventListener(
				eventName,
				function handleStartDateChange() {
					startDateChanged = true;
					updateStartDateMinimum();
					updateEndDateMinimum();
					validateStartDate(
						startDateValidated || !startDateError.hidden,
					);

					if (endDate.value) {
						validateEndDate(true);
					}
				},
			);

			endDate.addEventListener(eventName, function handleEndDateChange() {
				endDateChanged = true;
				updateEndDateMinimum();
				validateEndDate(endDateValidated || !endDateError.hidden);
			});
		});
	}

	function buildDepartmentOptions(records) {
		var departmentsByKey = Object.create(null);

		departmentsByKey.nursing = {
			label: "Nursing",
			value: "Nursing",
			data: null,
		};

		(records || []).forEach(function addDepartment(record) {
			var department = record && record.department;

			if (typeof department !== "string" || !department.trim()) {
				return;
			}

			department = department.trim();

			var key = department.toLowerCase();

			if (!Object.prototype.hasOwnProperty.call(departmentsByKey, key)) {
				departmentsByKey[key] = {
					label: department,
					value: department,
					data: record,
				};
			}
		});

		return Object.keys(departmentsByKey)
			.map(function getDepartment(key) {
				return departmentsByKey[key];
			})
			.sort(function sortDepartments(left, right) {
				return left.label.localeCompare(right.label);
			});
	}

	function buildCoveringEmployeeOptions(records) {
		var employeesByKey = Object.create(null);

		(records || []).forEach(function addCoveringEmployee(record) {
			var userName =
				record && typeof record.UserName === "string"
					? record.UserName.trim()
					: "";

			if (!userName) {
				return;
			}

			var key = userName.toLowerCase();

			if (!Object.prototype.hasOwnProperty.call(employeesByKey, key)) {
				employeesByKey[key] = {
					label: userName,
					value: userName,
					description:
						record && typeof record.Email === "string"
							? record.Email.trim()
							: "",
					data: record,
				};
			}
		});

		return Object.keys(employeesByKey)
			.map(function getCoveringEmployee(key) {
				return employeesByKey[key];
			})
			.sort(function sortCoveringEmployees(left, right) {
				return left.label.localeCompare(right.label);
			});
	}

	function createCoveringEmployeeAutocomplete(options) {
		coveringEmployeeOptions = options;
		coveringEmployeeAutocomplete = occFramework.autocomplete.create(
			"#coveringEmployeeAutocomplete",
			{
				source: options,
				minLength: 0,
				maxResults: 10,
				onSelect: function populateCoveringEmployee(item) {
					vm.coveringEmployee(item.value);
					vm.coveringEmployeeEmail(
						item.data && item.data.Email ? item.data.Email : "",
					);
					clearCoveringEmployeeError();
				},
				onClear: function clearCoveringEmployeeEmail() {
					vm.coveringEmployee(
						document.getElementById("coveringEmployee").value,
					);
					vm.coveringEmployeeEmail("");
					clearCoveringEmployeeError();
				},
			},
		);
	}

	function restoreCoveringEmployeeSelection() {
		var savedEmployee = String(vm.coveringEmployee() || "").trim();

		if (!coveringEmployeeAutocomplete || !savedEmployee) {
			return;
		}

		var savedOption = coveringEmployeeOptions.find(
			function employeeMatchesSavedValue(option) {
				return (
					option.value.toLowerCase() === savedEmployee.toLowerCase()
				);
			},
		);

		if (savedOption) {
			coveringEmployeeAutocomplete.restore(savedOption);
		}
	}

	function setFacilitator(record) {
		vm.facilitatorName(record && record.name ? record.name : "");
		vm.facilitatorEmail(record && record.email ? record.email : "");
	}

	function normalizeCourse(course) {
		return typeof course === "string" ? course.trim() : "";
	}

	function setCourseControlMode(useSelection, inputReadonly, required) {
		var courseField = document.getElementById("courseField");
		var courseLabel = document.getElementById("courseLabel");
		var courseInput = document.getElementById("course");
		var courseSelection = document.getElementById("courseSelection");
		var courseHelp = document.getElementById("courseHelp");

		courseInput.hidden = useSelection;
		courseSelection.hidden = !useSelection;
		courseSelection.disabled = !useSelection;
		courseLabel.htmlFor = useSelection ? courseSelection.id : courseInput.id;
		courseHelp.hidden = useSelection || inputReadonly;

		occFramework.fields.readonly(courseField, inputReadonly);
		occFramework.fields.required(courseField, required);
		courseInput.required = !useSelection && required;
		courseSelection.required = useSelection && required;
	}

	function replaceCourseSelectionOptions(courses) {
		var courseSelection = document.getElementById("courseSelection");
		var placeholder = document.createElement("option");

		courseSelection.textContent = "";
		placeholder.value = "";
		placeholder.textContent = "Select a course";
		placeholder.disabled = true;
		placeholder.selected = true;
		courseSelection.appendChild(placeholder);

		courses.forEach(function addCourseOption(course) {
			var option = document.createElement("option");

			option.value = course;
			option.textContent = course;
			courseSelection.appendChild(option);
		});
	}

	function setCourseOptions(courses, savedCourse) {
		var courseSelection = document.getElementById("courseSelection");
		var uniqueCourses = [];
		var coursesByKey = Object.create(null);

		(courses || []).forEach(function addCourse(course) {
			var normalizedCourse = normalizeCourse(course);
			var key = normalizedCourse.toLowerCase();

			if (normalizedCourse && !coursesByKey[key]) {
				coursesByKey[key] = true;
				uniqueCourses.push(normalizedCourse);
			}
		});

		uniqueCourses.sort(function sortCourses(left, right) {
			return left.localeCompare(right);
		});

		replaceCourseSelectionOptions(uniqueCourses);

		if (uniqueCourses.length > 1) {
			var normalizedSavedCourse = normalizeCourse(savedCourse);
			var selectedCourse = uniqueCourses.find(
				function courseMatchesSavedValue(course) {
					return (
						course.toLowerCase() ===
						normalizedSavedCourse.toLowerCase()
					);
				},
			);

			courseSelection.value = selectedCourse || "";
			vm.course(selectedCourse || "");
			setCourseControlMode(true, true, true);
		} else {
			vm.course(uniqueCourses.length === 1 ? uniqueCourses[0] : "");
			setCourseControlMode(false, true, false);
		}

		clearCourseError();
	}

	function resetCourse() {
		setCourseOptions([], "");
	}

	function setManualCourseMode(savedCourse) {
		replaceCourseSelectionOptions([]);
		vm.course(savedCourse || "");
		setCourseControlMode(false, false, true);
		clearCourseError();
	}

	function normalizeNursingName(name) {
		if (typeof name !== "string") {
			return "";
		}

		var normalized = name.trim();
		var commaIndex = normalized.indexOf(",");

		if (commaIndex < 0) {
			return normalized;
		}

		var lastName = normalized.slice(0, commaIndex).trim();
		var firstName = normalized.slice(commaIndex + 1).trim();

		return lastName && firstName ? firstName + " " + lastName : normalized;
	}

	function buildNursingFacilitatorOptions(records) {
		var facilitatorsByKey = Object.create(null);

		(records || []).forEach(function addNursingFacilitator(record) {
			var name = normalizeNursingName(record && record.name);
			var course = normalizeCourse(record && record.courseFacilitation);

			if (!name) {
				return;
			}

			var key = name.toLowerCase();

			if (!Object.prototype.hasOwnProperty.call(facilitatorsByKey, key)) {
				facilitatorsByKey[key] = {
					label: name,
					value: name,
					data: {
						email: record && record.email ? record.email : "",
						courseFacilitations: [],
					},
					coursesByKey: Object.create(null),
				};
			}

			var facilitator = facilitatorsByKey[key];

			if (!facilitator.data.email && record && record.email) {
				facilitator.data.email = record.email;
			}

			if (course && !facilitator.coursesByKey[course.toLowerCase()]) {
				facilitator.coursesByKey[course.toLowerCase()] = true;
				facilitator.data.courseFacilitations.push(course);
			}
		});

		return Object.keys(facilitatorsByKey)
			.map(function getNursingFacilitator(key) {
				var facilitator = facilitatorsByKey[key];

				facilitator.data.courseFacilitations.sort(
					function sortFacilitatorCourses(left, right) {
						return left.localeCompare(right);
					},
				);
				delete facilitator.coursesByKey;

				return facilitator;
			})
			.sort(function sortNursingFacilitators(left, right) {
				return left.label.localeCompare(right.label);
			});
	}

	function loadNursingFacilitatorOptions() {
		if (!nursingFacilitatorOptionsPromise) {
			nursingFacilitatorOptionsPromise = integration
				.all("NursingCourseFacilitators")
				.then(buildNursingFacilitatorOptions);
		}

		return nursingFacilitatorOptionsPromise;
	}

	function setNursingFacilitatorMode(active) {
		var field = document.getElementById("facilitatorNameField");
		var facilitatorInput = document.getElementById("facilitatorName");
		var committedValue = document.getElementById(
			"nursingFacilitatorSelection",
		);
		var label = field.querySelector(".occ-label");

		occFramework.fields.readonly(field, !active);
		occFramework.fields.required(field, false);
		facilitatorInput.required = false;
		facilitatorInput.setCustomValidity("");
		committedValue.required = false;

		if (active) {
			var requiredIndicator = document.createElement("span");

			requiredIndicator.className = "occ-required";
			requiredIndicator.setAttribute("aria-hidden", "true");
			requiredIndicator.textContent = "*";
			label.append(" ", requiredIndicator);
		}

		if (!active) {
			clearNursingFacilitatorError();
		}
	}

	function captureEmployeeInformationState(section) {
		var controls = Array.from(
			section.querySelectorAll("input, select, textarea"),
		).map(function captureControlState(control) {
			return {
				control: control,
				disabled: control.disabled,
				readOnly: control.readOnly,
				required: control.required,
			};
		});
		var fields = Array.from(
			section.querySelectorAll(".occ-field, .occ-fieldset"),
		).map(function captureFieldState(field) {
			return {
				field: field,
				required: controls.some(
					function fieldHasRequiredControl(state) {
						return (
							state.control.closest(
								".occ-field, .occ-fieldset",
							) === field && state.required
						);
					},
				),
			};
		});
		var clearButtons = Array.from(
			section.querySelectorAll(".occ-autocomplete__clear"),
		).map(function captureClearButtonState(button) {
			return {
				button: button,
				disabled: button.disabled,
			};
		});

		return {
			clearButtons: clearButtons,
			controls: controls,
			fields: fields,
		};
	}

	function setEmployeeInformationActionable(actionable) {
		var section = document.getElementById("employeeInformationSection");

		if (!employeeInformationState) {
			employeeInformationState = captureEmployeeInformationState(section);
		}

		if (!actionable) {
			occFramework.fields.readonly(section, true);
			occFramework.fields.required(section, false);

			section
				.querySelectorAll('input[type="radio"], select')
				.forEach(function disableNonReadonlyControl(control) {
					control.disabled = true;
				});
			employeeInformationState.clearButtons.forEach(
				function disableAutocompleteClearButton(state) {
					state.button.disabled = true;
				},
			);
			return;
		}

		occFramework.fields.readonly(section, false);
		employeeInformationState.fields.forEach(
			function restoreFieldRequired(state) {
				occFramework.fields.required(state.field, state.required);
			},
		);
		employeeInformationState.controls.forEach(
			function restoreControlState(state) {
				state.control.disabled = state.disabled;
				state.control.readOnly = state.readOnly;
				state.control.required = state.required;
			},
		);
		employeeInformationState.clearButtons.forEach(
			function restoreAutocompleteClearButton(state) {
				state.button.disabled = state.disabled;
			},
		);
	}

	function applyWorkflowState() {
		var employeeInformationSection = document.getElementById(
			"employeeInformationSection",
		);
		var atStart = pkg.isAtStep("Start");
		var atCoordinator = pkg.isAtStep("conditionalCoordinator");
		var atDean = pkg.isAtStep("conditionalDean");
		var atNursingReview = pkg.isAtStep("nursingReveiw");

		if (!atStart && !atCoordinator && !atDean && !atNursingReview) {
			return;
		}

		occFramework.fields.show(employeeInformationSection);
		setEmployeeInformationActionable(atStart);

		if (atStart) {
			setNursingFacilitatorMode(
				document.getElementById("department").value === "Nursing",
			);
		}
	}

	function resetNursingFacilitator() {
		if (nursingFacilitatorAutocomplete) {
			nursingFacilitatorAutocomplete.clear({ notify: false });
		} else {
			document.getElementById("nursingFacilitatorSelection").value = "";
		}

		setFacilitator(null);
		resetCourse();
	}

	function createNursingFacilitatorAutocomplete(options) {
		if (!nursingFacilitatorAutocomplete) {
			nursingFacilitatorAutocomplete = occFramework.autocomplete.create(
				"#facilitatorAutocomplete",
				{
					source: options,
					minLength: 0,
					maxResults: options.length || 1,
					onSelect: function populateNursingFacilitator(item) {
						vm.facilitatorName(item.value);
						vm.facilitatorEmail(
							item.data && item.data.email ? item.data.email : "",
						);
						setCourseOptions(
							item.data && item.data.courseFacilitations,
							"",
						);
						clearNursingFacilitatorError();
					},
					onClear: function clearNursingFacilitatorEmail() {
						vm.facilitatorName(
							document.getElementById("facilitatorName").value,
						);
						vm.facilitatorEmail("");
						resetCourse();
						clearNursingFacilitatorError();
					},
				},
			);
		}

		return nursingFacilitatorAutocomplete;
	}

	function activateNursingFacilitator(preserveSavedValues) {
		var savedName = preserveSavedValues ? vm.facilitatorName() : "";
		var savedCourse = preserveSavedValues ? vm.course() : "";

		clearNursingFacilitatorError();

		if (!preserveSavedValues) {
			resetNursingFacilitator();
		}

		setNursingFacilitatorMode(true);

		return loadNursingFacilitatorOptions().then(
			function initializeNursingFacilitator(options) {
				var autocomplete =
					createNursingFacilitatorAutocomplete(options);
				var savedFacilitator = options.find(
					function facilitatorMatchesSavedName(option) {
						return (
							option.value.toLowerCase() ===
							normalizeNursingName(savedName).toLowerCase()
						);
					},
				);

				if (preserveSavedValues && savedName) {
					autocomplete.restore(savedFacilitator || savedName);
				}

				setCourseOptions(
					savedFacilitator &&
						savedFacilitator.data.courseFacilitations,
					savedCourse,
				);
			},
		);
	}

	function deactivateNursingFacilitator(record) {
		resetNursingFacilitator();
		setNursingFacilitatorMode(false);
		setFacilitator(record);

		if (record) {
			setManualCourseMode("");
		}

		clearNursingFacilitatorError();
	}

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
		if (pkg.isExporting) {
			return;
		}

		//  This takes place after applyBindings has been called and has added input observables to the
		//  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
		//  populating dropdowns, select options and other operations that need to take place every
		//  time the form is loaded.
		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.

		var departmentPromise = integration
			.all("ProgramCoordinatorsDirectors")
			.then(function initializeDepartmentAutocomplete(records) {
				var departmentOptions = buildDepartmentOptions(records);

				departmentAutocomplete = occFramework.autocomplete.create(
					"#departmentAutocomplete",
					{
						source: departmentOptions,
						minLength: 0,
						maxResults: departmentOptions.length,
						onSelect: function handleDepartmentSelection(item) {
							vm.departmentSearch(item.label);
							clearDepartmentError();

							if (item.value === "Nursing") {
								activateNursingFacilitator(false);
							} else {
								deactivateNursingFacilitator(item.data);
							}
						},
						onClear: function clearFacilitator() {
							vm.departmentSearch(
								document.getElementById("departmentSearch")
									.value,
							);
							clearDepartmentError();
							deactivateNursingFacilitator(null);
						},
					},
				);
			});
		var coveringEmployeePromise = integration
			.all("Etrieve_Security_Get_Active_Employees")
			.then(function initializeCoveringEmployeeAutocomplete(records) {
				createCoveringEmployeeAutocomplete(
					buildCoveringEmployeeOptions(records),
				);
			});

		return Promise.all([departmentPromise, coveringEmployeePromise]);
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
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg.isExporting);

		if (pkg.isExporting) {
			return;
		}

		initializeInlineValidation();
		restoreCoveringEmployeeSelection();

		var savedDepartment = document.getElementById("department").value;

		if (departmentAutocomplete && savedDepartment) {
			departmentAutocomplete.restore(savedDepartment);
			vm.departmentSearch(savedDepartment);
		}

		if (savedDepartment === "Nursing") {
			return activateNursingFacilitator(true).then(applyWorkflowState);
		}

		setNursingFacilitatorMode(false);

		if (savedDepartment) {
			setManualCourseMode(vm.course());
		}

		applyWorkflowState();
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
		// TODO: Revisit this after testing on submit
		// if (pkg.isAtStep("Start")) {
		// 	var facilitatorInput = document.getElementById("facilitatorName");
		// 	var nursingIsActive =
		// 		document.getElementById("department").value === "Nursing";
		// 	facilitatorInput.required = nursingIsActive;
		// }
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
