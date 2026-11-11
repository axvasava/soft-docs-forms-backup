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
	"use strict";

	// Preliminary form-local data. Replace only after integration requirements are agreed.
	var MOCK_PROGRAMS = [
		{ title: "Business Administration (sample)", code: "MOCK.BUS" },
		{ title: "Computer Information Systems (sample)", code: "MOCK.CIS" },
		{ title: "Nursing (sample)", code: "MOCK.NUR" },
	];
	var COLLECTION_FIELDS = {
		newPositions: [
			"positionTitle",
			"isNewPositionTitle",
			"campus",
			"isGrantFunded",
			"grantName",
			"grantStartDate",
			"grantEndDate",
			"employmentType",
			"hoursPerWeek",
			"employeeGroup",
			"managerAdministratorType",
			"reasonNeeded",
		],
		positionUpgrades: [
			"currentPositionTitle",
			"willTitleChange",
			"proposedPositionTitle",
			"employmentType",
			"employeeGroup",
			"managerAdministratorType",
			"reasonNeeded",
		],
		temporaryEmployees: [
			"positionTitle",
			"isNewPositionTitle",
			"isGrantFunded",
			"grantName",
			"startDate",
			"endDate",
			"employmentType",
			"hoursPerWeek",
			"managerAdministratorType",
			"reasonNeeded",
		],
	};
	var initialized = false;
	var currentFiscalYear;
	var departmentItems = [];
	var managerItems = [];
	var departmentLoadError = false;
	var managerLoadError = false;
	var contactRequest = 0;
	var departmentRequest = 0;
	var positionChoices = [];
	var departmentChoices = [];
	var departmentAutocomplete;
	var lastEmployeeId = "";
	var contactInitialized = false;

	Object.keys(COLLECTION_FIELDS).forEach(function addCollection(name) {
		vm.addObservableArray(name);
	});

	function appendOption(select, value, label) {
		var option = document.createElement("option");
		option.value = value;
		option.textContent = label;
		select.appendChild(option);
	}

	function fiscalYear(startYear) {
		return startYear + "\u2013" + (startYear + 1);
	}

	function populateFiscalYears(inputValues) {
		var today = new Date();
		var startYear = today.getFullYear() - (today.getMonth() < 6 ? 1 : 0);
		var years = [];
		var saved = inputValues && inputValues.first("budgetYear");
		var select = document.getElementById("budgetYear");
		currentFiscalYear = fiscalYear(startYear);
		for (var offset = 0; offset < 5; offset += 1) {
			years.push(fiscalYear(startYear + offset));
		}
		// Keep five choices while retaining an older saved year on reopen.
		if (saved && years.indexOf(saved) === -1) {
			years[4] = saved;
		}
		select.textContent = "";
		years.forEach(function addYear(year) {
			appendOption(select, year, year);
		});
	}

	function emptyRecord(name) {
		return COLLECTION_FIELDS[name].reduce(function addProperty(
			record,
			property,
		) {
			record[property] = "";
			return record;
		}, {});
	}

	function restoreRecords(name) {
		var saved = vm[name + "Json"]();
		if (!saved) return [emptyRecord(name)];
		// Do not silently replace malformed saved data with an empty collection.
		// This is persistence parsing, not business-field validation.
		var records = JSON.parse(saved);
		if (!Array.isArray(records)) {
			throw new Error("Unable to restore saved " + name + " collection.");
		}
		return records.length
			? records.map(function normalizeRecord(record) {
					return COLLECTION_FIELDS[name].reduce(function copyProperty(
						result,
						property,
					) {
						result[property] = String(
							record && record[property] != null
								? record[property]
								: "",
						);
						return result;
					}, {});
				})
			: [emptyRecord(name)];
	}

	function initializeCollection(name) {
		var group = document.getElementById(name + "Group");
		var list = group.querySelector("[data-occ-repeating-group-list]");
		var template = group.querySelector("template");
		var nextRowId = 0;
		var records = restoreRecords(name);
		vm[name](records);

		function save() {
			vm[name + "Json"](JSON.stringify(vm[name]()));
		}

		function bindRow(row, record) {
			// IDs stay stable across removal; visible positions are framework-owned.
			var rowId = name + "-" + nextRowId++;
			row.querySelectorAll("[data-position-field]").forEach(
				function bindField(control, index) {
					var property = control.dataset.positionField;
					var label = row.querySelector(
						'label[for="' + control.id + '"]',
					);
					control.id = rowId + "-" + property + "-" + index;
					control.name = rowId + "[" + property + "]";
					if (label) label.htmlFor = control.id;
					if (control.hasAttribute("data-campus-options")) {
						occFramework.options.campuses.bigFour.forEach(
							function addCampus(option) {
								appendOption(
									control,
									option.value,
									option.label,
								);
							},
						);
					}
					if (control.type === "radio") {
						control.checked = control.value === record[property];
					} else {
						control.value = record[property];
					}
					function updateRecord() {
						if (control.type === "radio" && !control.checked)
							return;
						record[property] = control.value;
						vm[name].valueHasMutated();
						save();
					}
					control.addEventListener("input", updateRecord);
					control.addEventListener("change", updateRecord);
				},
			);
		}

		// Reuse the authored first row; additional rows follow the same inert template.
		records.forEach(function restoreRow(record, index) {
			var row =
				index === 0
					? list.firstElementChild
					: template.content.firstElementChild.cloneNode(true);
			if (index !== 0) list.appendChild(row);
			bindRow(row, record);
		});
		occFramework.repeatingGroups.create(group, {
			minRows: 1,
			onAdd: function addPosition(row, index) {
				var record = emptyRecord(name);
				vm[name].splice(index, 0, record);
				bindRow(row, record);
				save();
				row.querySelector("[data-position-field]").focus();
			},
			onRemove: function removePosition(row, index) {
				vm[name].splice(index, 1);
				save();
				var nextRow =
					list.children[Math.min(index, list.children.length - 1)];
				nextRow.querySelector("[data-position-field]").focus();
			},
		});
	}

	function initializeAutocomplete(field, committedField, items) {
		var control = document.getElementById(field);
		var instance = occFramework.autocomplete.create(
			"#" + field + "Autocomplete",
			{
				source: items,
				minLength: 0,
				maxResults: items.length,
				onSelect: function saveSelection(item) {
					vm[field](item.label);
					vm[committedField](item.value);
				},
				onClear: function saveEditedText() {
					vm[field](control.value);
					vm[committedField]("");
				},
			},
		);
		var saved = vm[committedField]();
		if (saved) {
			instance.restore({ label: vm[field]() || saved, value: saved });
		}
	}

	function text(value) {
		return typeof value === "string" ? value.trim() : "";
	}

	function setField(name, value) {
		vm[name](value);
		document.getElementById(name).value = value;
	}

	function status(id, message) {
		document.getElementById(id).textContent = message;
	}

	function renderPositionChoices() {
		var select = document.getElementById("contactPositionChoice");
		select.textContent = "";
		appendOption(select, "", "Choose the applicable position");
		positionChoices.forEach(function (choice) {
			appendOption(select, choice.guid, choice.label);
		});
		select.value = vm.contactPositionGuid();
		select.disabled = !positionChoices.length;
		select.required = positionChoices.length > 1;
		select.hidden = !positionChoices.length;
		document.getElementById("contactPosition").hidden =
			!!positionChoices.length;
		document.getElementById("contactPositionLabel").htmlFor =
			positionChoices.length
				? "contactPositionChoice"
				: "contactPosition";
		status(
			"contactPositionStatus",
			!positionChoices.length &&
				(vm.contactPosition() || vm.contactPositionGuid())
				? "Saved position retained; not verified by the current lookup."
				: "",
		);
	}

	function clearDepartmentChoices() {
		departmentChoices = [];
		var select = document.getElementById("contactDepartmentChoice");
		select.textContent = "";
		select.disabled = true;
		document.getElementById("contactDepartmentChoiceField").hidden = true;
	}

	function clearDepartment() {
		departmentRequest += 1;
		if (departmentAutocomplete)
			departmentAutocomplete.clear({ notify: false });
		setField("contactDepartment", "");
		setField("contactDepartmentCode", "");
		clearDepartmentChoices();
		status("contactDepartmentStatus", "");
	}

	function clearContact() {
		contactRequest += 1;
		[
			"contactDisplayName",
			"contactEmail",
			"contactPhone",
			"contactPosition",
			"contactPositionGuid",
		].forEach(function (name) {
			setField(name, "");
		});
		positionChoices = [];
		renderPositionChoices();
		clearDepartment();
		status("contactLookupStatus", "");
	}

	function resolveDepartments(position, request) {
		var revision = departmentRequest;
		var guids = [];
		(Array.isArray(position.departments)
			? position.departments
			: []
		).forEach(function (reference) {
			var guid = reference && text(reference.id);
			if (guid && guids.indexOf(guid) === -1) guids.push(guid);
		});
		if (!guids.length) {
			status(
				"contactDepartmentStatus",
				"No department is available for this position. Choose an HR department below.",
			);
			return Promise.resolve();
		}
		status("contactDepartmentStatus", "Loading position departments...");
		return Promise.all(
			guids.map(function (guid) {
				return integration
					.first("Web_Ethos_Get_Employment_Department_by_GUID", {
						deptGUID: guid,
					})
					.then(function (department) {
						return department && text(department.title)
							? { guid: guid, title: text(department.title) }
							: null;
					})
					.catch(function () {
						return null;
					});
			}),
		).then(function (results) {
			// A newer employee, position, or manual HR edit owns the department now.
			if (request !== contactRequest || revision !== departmentRequest)
				return;
			departmentChoices = results.filter(function (result) {
				return !!result;
			});
			if (guids.length === 1 && departmentChoices.length === 1) {
				setField("contactDepartment", departmentChoices[0].title);
				status(
					"contactDepartmentStatus",
					"Department filled from the position. You may choose an HR department below.",
				);
			} else if (departmentChoices.length) {
				var select = document.getElementById("contactDepartmentChoice");
				select.textContent = "";
				appendOption(select, "", "Choose a position department");
				departmentChoices.forEach(function (department) {
					appendOption(select, department.guid, department.title);
				});
				select.disabled = false;
				document.getElementById("contactDepartmentChoiceField").hidden =
					false;
				status(
					"contactDepartmentStatus",
					departmentChoices.length === guids.length
						? "This position has multiple departments. Choose one, or select an HR department below."
						: "Some position departments could not be loaded. Choose an available department or an HR department below.",
				);
			} else {
				status(
					"contactDepartmentStatus",
					"Position departments could not be loaded. Choose an HR department below.",
				);
			}
		});
	}

	function selectPosition(guid, preserveDepartment) {
		var choice = positionChoices.find(function (item) {
			return item.guid === guid;
		});
		if (!preserveDepartment) clearDepartment();
		setField("contactPositionGuid", choice ? choice.guid : "");
		setField("contactPosition", choice ? choice.label : "");
		renderPositionChoices();
		if (!choice || preserveDepartment) return Promise.resolve();
		return resolveDepartments(choice.position, contactRequest);
	}

	function loadContact(employeeId, restoring) {
		// The ID-change handler clears stale identity data before starting a new lookup.
		var savedPosition = text(vm.contactPositionGuid());
		var savedDepartment = !!(
			vm.contactDepartment() || vm.contactDepartmentCode()
		);
		positionChoices = [];
		renderPositionChoices();
		clearDepartmentChoices();
		departmentRequest += 1;
		var initialDepartmentRequest = departmentRequest;
		var request = ++contactRequest;
		status("contactLookupStatus", "Looking up the contact employee...");
		return integration
			.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
				personID: employeeId,
			})
			.then(function (person) {
				if (request !== contactRequest) return;
				// The Person GUID is local to this lookup; it is never persisted.
				var personGuid = person && text(person.id);
				if (!personGuid) {
					if (!restoring) clearContact();
					status(
						"contactLookupStatus",
						restoring
							? "The saved contact could not be verified. Saved values are retained; check the Employee ID and retry."
							: "No usable person record was found. Check the Employee ID and try again.",
					);
					return;
				}
				var names = Array.isArray(person.names) ? person.names : [];
				var name = names.find(function (item) {
					return (
						item &&
						text(item.preference).toLowerCase() === "preferred"
					);
				});
				var emails = Array.isArray(person.emails) ? person.emails : [];
				var email = emails.find(function (item) {
					return (
						item &&
						text(item.preference).toLowerCase() === "primary"
					);
				});
				var phone = Array.isArray(person.phones) && person.phones[0];
				var values = {
					contactDisplayName: name
						? text(name.fullName) ||
							[text(name.firstName), text(name.lastName)]
								.filter(Boolean)
								.join(" ")
						: "",
					contactEmail: email ? text(email.address) : "",
					// Local first-record convention only; no work/preferred-phone claim.
					contactPhone: phone ? text(phone.number) : "",
				};
				Object.keys(values).forEach(function (field) {
					if (!restoring || !vm[field]())
						setField(field, values[field]);
				});
				status(
					"contactLookupStatus",
					"Loading the contact's active positions...",
				);
				return integration
					.all(
						"Web_Ethos_Get_active_institution_jobs_by_Person_GUID",
						{ personGUID: personGuid },
					)
					.then(function (jobs) {
						if (request !== contactRequest) return;
						if (!Array.isArray(jobs))
							throw new Error("Unexpected jobs response.");
						return Promise.all(
							jobs.map(function (job) {
								var guid =
									job &&
									job.position &&
									text(job.position.id);
								if (!guid) return null;
								return integration
									.first(
										"Web_Ethos_Get_institution_positions_by_Position_GUID",
										{ positionGUID: guid },
									)
									.then(function (position) {
										var label =
											position &&
											[
												text(position.title),
												text(position.code),
											]
												.filter(Boolean)
												.join(" | ");
										return label
											? {
													guid: guid,
													label: label,
													position: position,
												}
											: null;
									})
									.catch(function () {
										return null;
									});
							}),
						).then(function (results) {
							if (request !== contactRequest) return;
							positionChoices = [];
							results.forEach(function (choice) {
								// Repeated job references to the same Position GUID represent one position choice.
								if (
									choice &&
									!positionChoices.some(function (item) {
										return item.guid === choice.guid;
									})
								)
									positionChoices.push(choice);
							});
							var incomplete = results.some(function (result) {
								return !result;
							});
							var saved = positionChoices.find(function (choice) {
								return choice.guid === savedPosition;
							});
							var departmentEdited =
								departmentRequest !== initialDepartmentRequest;
							status(
								"contactLookupStatus",
								!positionChoices.length
									? "No usable active positions are available. You may select an HR department manually."
									: incomplete
										? "Some positions could not be loaded. Choose an available position, or retry the employee lookup."
										: "Contact found. Review the applicable position and department.",
							);
							if (saved)
								return selectPosition(
									saved.guid,
									savedDepartment || departmentEdited,
								);
							if (savedPosition && incomplete) {
								// Failure is not evidence that the saved position ceased to exist.
								positionChoices = [];
								renderPositionChoices();
								status(
									"contactLookupStatus",
									"The saved position could not be verified. Saved values are retained; retry the employee lookup.",
								);
								return;
							}
							// A saved selection no longer in the current list must not drive department state.
							if (savedPosition && !departmentEdited)
								clearDepartment();
							if (positionChoices.length === 1 && !incomplete) {
								return selectPosition(
									positionChoices[0].guid,
									departmentEdited ||
										(!savedPosition && savedDepartment),
								);
							}
							return selectPosition(
								"",
								departmentEdited ||
									(!savedPosition && savedDepartment),
							);
						});
					})
					.catch(function () {
						if (request !== contactRequest) return;
						status(
							"contactLookupStatus",
							"Active positions could not be loaded. Retry the employee lookup. Saved values have been retained.",
						);
					});
			})
			.catch(function () {
				if (request !== contactRequest) return;
				// Only the current manual failure may invalidate dependent saved/UI state.
				// A failed recheck on reopen is not evidence that saved data is invalid.
				if (!restoring) clearContact();
				status(
					"contactLookupStatus",
					restoring
						? "The saved contact could not be verified because the employee lookup failed. Saved values are retained; retry the lookup."
						: "The employee lookup failed. Check the Employee ID and try again.",
				);
			});
	}

	function initializeContactControls() {
		if (contactInitialized) return;
		contactInitialized = true;
		departmentAutocomplete = occFramework.autocomplete.create(
			"#contactDepartmentAutocomplete",
			{
				source: departmentItems,
				minLength: 0,
				maxResults: 10,
				onSelect: function (item) {
					departmentRequest += 1;
					clearDepartmentChoices();
					setField("contactDepartment", item.label);
					setField("contactDepartmentCode", item.value);
					status(
						"contactDepartmentStatus",
						"HR department selected.",
					);
				},
				onClear: function () {
					departmentRequest += 1;
					setField(
						"contactDepartment",
						document.getElementById("contactDepartment").value,
					);
					setField("contactDepartmentCode", "");
				},
			},
		);
		if (vm.contactDepartmentCode()) {
			// Restore the saved HR pair; never infer a code from an Ethos title.
			departmentAutocomplete.restore({
				label: vm.contactDepartment(),
				value: vm.contactDepartmentCode(),
			});
		}
		status(
			"hrDepartmentStatus",
			departmentLoadError
				? "HR department choices could not be loaded. Reopen the form to retry; saved department values are retained."
				: !departmentItems.length
					? "No HR department choices are available."
					: "",
		);
		document
			.getElementById("contactDepartment")
			.addEventListener("input", function () {
				departmentRequest += 1;
				clearDepartmentChoices();
				setField("contactDepartment", this.value);
				setField("contactDepartmentCode", "");
				status(
					"contactDepartmentStatus",
					"Choose an HR suggestion to save its department code.",
				);
			});
		document
			.getElementById("contactDepartmentChoice")
			.addEventListener("change", function () {
				var choice = departmentChoices.find(function (item) {
					return item.guid === this.value;
				}, this);
				departmentRequest += 1;
				departmentAutocomplete.clear({ notify: false });
				setField("contactDepartment", choice ? choice.title : "");
				setField("contactDepartmentCode", "");
			});
		var manager = occFramework.autocomplete.create(
			"#hiringManagerNameAutocomplete",
			{
				source: managerItems,
				minLength: 0,
				maxResults: 10,
				onSelect: function (item) {
					if (
						vm.hiringManagerName() !== item.label ||
						vm.hiringManagerEmail() !== text(item.data.Email)
					) {
						setField("hiringManagerTitle", "");
						setField("hiringManagerDepartment", "");
					}
					setField("hiringManagerName", item.label);
					setField("hiringManagerEmail", text(item.data.Email));
					status("hiringManagerStatus", "");
				},
				onClear: clearManagerDetails,
			},
		);
		// Exact saved name/email matching restores UI state only, never an Ethos identity.
		var matches = managerItems.filter(function (item) {
			return (
				item.label === vm.hiringManagerName() &&
				text(item.data.Email) === vm.hiringManagerEmail()
			);
		});
		if (matches.length === 1) manager.restore(matches[0]);
		status(
			"hiringManagerStatus",
			managerLoadError
				? "Employee choices could not be loaded. Reopen the form to retry; saved manager values are retained."
				: !managerItems.length
					? "No employee choices are available."
					: vm.hiringManagerName() && matches.length !== 1
						? "The saved manager could not be uniquely matched. Select a current employee to change this contact."
						: "",
		);
		document
			.getElementById("hiringManagerName")
			.addEventListener("input", clearManagerDetails);
		function clearManagerDetails() {
			setField(
				"hiringManagerName",
				document.getElementById("hiringManagerName").value,
			);
			[
				"hiringManagerEmail",
				"hiringManagerTitle",
				"hiringManagerDepartment",
			].forEach(function (field) {
				setField(field, "");
			});
		}
		vm.contactEmployeeId.subscribe(function (value) {
			if (text(value) === lastEmployeeId) return;
			lastEmployeeId = text(value);
			clearContact();
		});
		var employeeInput = document.getElementById("contactEmployeeId");
		employeeInput.addEventListener("input", function () {
			vm.contactEmployeeId(this.value);
		});
		function searchContact() {
			vm.contactEmployeeId(employeeInput.value);
			var id = text(employeeInput.value);
			if (!id) {
				clearContact();
				return Promise.resolve();
			}
			// Rechecking the same ID must preserve an explicit department override.
			// Changing the ID has already cleared dependent state via the subscription.
			return loadContact(id, false);
		}
		document
			.getElementById("contactEmployeeSearch")
			.addEventListener("click", searchContact);
		employeeInput.addEventListener("keydown", function (event) {
			if (event.key === "Enter") {
				event.preventDefault();
				searchContact();
			}
		});
		document
			.getElementById("contactPositionChoice")
			.addEventListener("change", function () {
				selectPosition(this.value, false);
			});
	}

	vm.onLoad = function onLoad(source, inputValues) {
// 		integration.all("z_TEST Security").then(function (records) {
// 			console.log("z_TEST Security", records);
// 		});

		populateFiscalYears(inputValues);
		if (pkg && pkg.isExporting) return;
		return Promise.all([
			integration
				.all("Etrieve_Integration_Get_HR_Departments", {})
				.then(function (records) {
					if (!Array.isArray(records))
						throw new Error("Unexpected HR department response.");
					departmentItems = records.map(function (record) {
						if (
							!record ||
							!text(record.DepartmentName) ||
							!text(record.DepartmentCode)
						) {
							throw new Error(
								"Department name or code unavailable.",
							);
						}
						// Preserve source strings/order; no Active filter, sort, or name crosswalk.
						return {
							label: record.DepartmentName,
							value: record.DepartmentCode,
							description: record.DepartmentCode,
							data: record,
						};
					});
				})
				.catch(function () {
					departmentItems = [];
					departmentLoadError = true;
				}),
			integration
				.all("Etrieve_Security_Get_Active_Employees")
				.then(function (records) {
					console.log(
						"Etrieve_Security_Get_Active_Employees",
						records,
					);
					if (!Array.isArray(records))
						throw new Error("Unexpected employee response.");
					managerItems = records.reduce(function (
						items,
						record,
						index,
					) {
						if (record && text(record.UserName)) {
							// Session-only selection token; neither the name nor email is an Ethos ID.
							items.push({
								label: text(record.UserName),
								value: String(index),
								description: text(record.Email),
								data: record,
							});
						}
						return items;
					}, []);
				})
				.catch(function () {
					managerItems = [];
					managerLoadError = true;
				}),
		]);
	};

	vm.setDefaults = function setDefaults(source, inputValues) {
		if (!vm.budgetYear()) vm.budgetYear(currentFiscalYear);
		// Author each collection's saved JSON in the persistence-safe defaults callback.
		Object.keys(COLLECTION_FIELDS).forEach(
			function defaultCollection(name) {
				if (!vm[name + "Json"]()) {
					vm[name + "Json"](JSON.stringify([emptyRecord(name)]));
				}
			},
		);
		if (pkg && pkg.isExporting) return;
		// Rebuild derived choices in the persistence-safe callback, before afterLoad.
		lastEmployeeId = text(vm.contactEmployeeId());
		if (lastEmployeeId) return loadContact(lastEmployeeId, true);
	};

	vm.afterLoad = function afterLoad() {
		if (initialized) return;
		Object.keys(COLLECTION_FIELDS).forEach(initializeCollection);
		initializeAutocomplete(
			"academicProgram",
			"academicProgramCode",
			MOCK_PROGRAMS.map(function programItem(program) {
				return {
					label: program.title + " | " + program.code,
					value: program.code,
					data: program,
				};
			}),
		);
		occFramework.init(document);
		occFramework.developerVisibility.apply(document, user);
		occFramework.exportMode.set(document, pkg && pkg.isExporting);
		if (!(pkg && pkg.isExporting)) initializeContactControls();
		initialized = true;
	};

	// Native lifecycle entry points retained; this preliminary UI has no routing or validation.
	vm.onSubmit = function onSubmit(form) {};
	vm.onApprove = function onApprove(form) {};
	vm.onDecline = function onDecline(form) {};
	vm.beforeRequired = function beforeRequired(form) {};
	vm.afterRequired = function afterRequired(form) {};
	vm.onOptOut = function onOptOut(form) {};
	vm.onESignSubmit = function onESignSubmit(form) {};

	return vm;
});
