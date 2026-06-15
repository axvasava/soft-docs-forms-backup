/* jshint maxerr: 10000 */
(function () {
	"use strict";

	/*
	fieldStateUtils

	Purpose:
	Centralized utility for managing field interaction states across Etrieve forms.

	Handles:
	- readonly fields
	- disabled fields
	- hidden fields
	- helper / status text
	- export mode cleanup
	- accessibility attributes
	- workflow-style field locking

	Design goals:
	- Reduce repetitive form-level jQuery code.
	- Keep accessibility behavior consistent.
	- Restore original field state when unlocking.
	- Support bulk operations on fields and sections.
  */

	function createFieldStateUtils(root = document) {
		/*
	  CSS classes used by this utility.

	  These are visual state classes only.
	  The actual behavior is still controlled through DOM attributes.
	*/
		const READONLY_CLASS = "is-field-readonly";
		const DISABLED_CLASS = "is-field-disabled";
		const HELPER_CLASS = "field-helper-text";
		const HIDDEN_CLASS = "is-field-hidden";

		const FIELD_SELECTOR =
			"input[id], select[id], textarea[id], button[id]";

		/*
	  Required indicators are owned by requiredIndicators.js,
	  but export mode needs to temporarily hide them.
	*/
		const REQUIRED_INDICATOR_CLASS = "required-indicator";

		console.info("fieldStateUtils 06-12-26 TEST");

		/*
	  initialized:
	  Prevents state changes from running before the form is ready.

	  queue:
	  Stores state changes requested before init() is called.

	  requiredIndicators:
	  Reference to requiredIndicators utility so we can
	  clear required state when fields become hidden or disabled.
	*/
		let initialized = false;
		let queue = [];
		let requiredIndicators = null;

		/*
	  Safely retrieve a field by ID.

	  Uses the provided root element if available,
	  otherwise falls back to document.
	*/
		function getFieldById(id) {
			return root.getElementById
				? root.getElementById(id)
				: document.getElementById(id);
		}

		/*
	  Generates a unique helper text ID for aria-describedby.
	*/
		function getHelperId(fieldId) {
			return `${fieldId}-field-helper`;
		}

		/*
	  Determine whether a field supports native readonly behavior.

	  Some fields do not support readonly:
	  - checkboxes
	  - radio buttons
	  - select dropdowns
	  - buttons

	  Those fields must use disabled instead.
	*/
		function supportsReadonly(field) {
			if (!field || !field.tagName) return false;

			const tag = field.tagName.toLowerCase();
			const type = (field.type || "").toLowerCase();

			if (tag === "textarea") return true;
			if (tag === "select") return true;
			if (tag === "button") return false;

			if (tag === "input") {
				return ![
					"checkbox",
					"radio",
					"button",
					"submit",
					"reset",
					"file",
					"range",
					"color",
				].includes(type);
			}

			return false;
		}

		/*
	  Store the field's original state the first time we touch it.

	  This allows unlock/editable operations to restore
	  the field back to its original state instead of blindly enabling it.

	  Example:
	  A field originally disabled in HTML should stay disabled
	  after lockForm() -> unlockForm().
	*/
		function cacheInitialState(field) {
			if (!field.dataset.fieldStateCached) {
				field.dataset.fieldStateCached = "true";

				field.dataset.initialDisabled = field.disabled
					? "true"
					: "false";

				field.dataset.initialReadonly = field.readOnly
					? "true"
					: "false";
			}
		}

		/*
	  Restore the field's original disabled state.
	*/
		function restoreDisabledState(field) {
			field.disabled = field.dataset.initialDisabled === "true";

			if (field.disabled) {
				field.setAttribute("aria-disabled", "true");
			} else {
				field.removeAttribute("aria-disabled");
			}
		}

		/*
	  Restore the field's original readonly state.
	*/
		function restoreReadonlyState(field) {
			const tag = field.tagName.toLowerCase();

			if (tag === "select") {
				field.removeAttribute("aria-readonly");
				return;
			}

			field.readOnly = field.dataset.initialReadonly === "true";

			if (field.readOnly) {
				field.setAttribute("readonly", "readonly");
				field.setAttribute("aria-readonly", "true");
			} else {
				field.removeAttribute("readonly");
				field.removeAttribute("aria-readonly");
			}
		}

		/*
	  Add a helper text ID to aria-describedby.

	  This keeps helper text connected to the field for screen readers.
	*/
		function addDescribedBy(field, helperId) {
			const current = field.getAttribute("aria-describedby") || "";

			const ids = current.split(/\s+/).filter(Boolean);

			if (!ids.includes(helperId)) {
				ids.push(helperId);
			}

			field.setAttribute("aria-describedby", ids.join(" "));
		}

		/*
	  Determine if a field is currently visible on screen.

	  Used by skipHidden options during bulk operations.
	*/
		function isVisible(field) {
			return !!(
				field &&
				(field.offsetWidth ||
					field.offsetHeight ||
					field.getClientRects().length)
			);
		}

		/*
	  Normalize ID arrays and remove empty values.
	*/
		function normalizeIdList(ids) {
			if (!Array.isArray(ids)) return [];

			return ids.filter(Boolean);
		}

		function normalizeContainerList(selectorOrElements) {
			if (Array.isArray(selectorOrElements)) {
				return selectorOrElements.filter(Boolean);
			}

			return selectorOrElements ? [selectorOrElements] : [];
		}

		function normalizeContainerSelector(selectorOrElement) {
			if (
				typeof selectorOrElement !== "string" ||
				!selectorOrElement.trim()
			) {
				return selectorOrElement;
			}

			const selector = selectorOrElement.trim();

			if (
				selector.startsWith(".") ||
				selector.startsWith("#") ||
				selector.startsWith("[")
			) {
				return selector;
			}

			if (root.getElementById && root.getElementById(selector)) {
				return `#${selector}`;
			}

			if (root.querySelector(`[name="${selector}"]`)) {
				return `[name="${selector}"]`;
			}

			return `.${selector}`;
		}

		/*
	  Determine if a field matches any excluded selectors.

	  Supports:
	  - direct field matching
	  - matching parent containers

	  Example:
	  exceptSelectors: [".alwaysEditable"]
	*/
		function matchesExcludedSelector(field, selectors) {
			if (!field || !Array.isArray(selectors)) return false;

			return selectors.some(function (selector) {
				try {
					return (
						field.matches(selector) ||
						(field.closest && field.closest(selector))
					);
				} catch (e) {
					console.warn(
						`fieldStateUtils: Invalid selector "${selector}"`,
						e,
					);

					return false;
				}
			});
		}

		/*
	  Determine whether a field should be skipped during lock operations.

	  Supports:
	  - excluded field IDs
	  - excluded selectors
	  - hidden field skipping
	*/
		function shouldSkipField(field, options) {
			const except = normalizeIdList(options && options.except);

			const exceptSelectors = Array.isArray(
				options && options.exceptSelectors,
			)
				? options.exceptSelectors
				: [];

			const skipHidden = options && options.skipHidden === true;

			if (!field || !field.id) return true;

			if (except.includes(field.id)) {
				return true;
			}

			if (matchesExcludedSelector(field, exceptSelectors)) {
				return true;
			}

			if (skipHidden && !isVisible(field)) {
				return true;
			}

			return false;
		}

		/*
	  Lock a single field.

	  Uses readonly where supported.
	  Uses disabled for controls that do not support readonly.
	*/
		function lockField(fieldId, options) {
			const field = getFieldById(fieldId);

			if (shouldSkipField(field, options)) return;

			if (supportsReadonly(field)) {
				setFieldState(fieldId, {
					state: {
						readonly: true,
					},

					helperText:
						options &&
						Object.prototype.hasOwnProperty.call(
							options,
							"helperText",
						)
							? options.helperText
							: false,
				});
			} else {
				setFieldState(fieldId, {
					state: {
						disabled: true,
					},

					helperText: false,
				});
			}
		}

		/*
	  Unlock operations intentionally ignore exclusion lists.

	  Exclusions are meant to prevent locking,
	  not prevent restoration.
	*/
		function shouldSkipUnlockField(field, options) {
			const skipHidden = options && options.skipHidden === true;

			if (!field || !field.id) return true;

			if (skipHidden && !isVisible(field)) return true;

			return false;
		}

		/*
	  Unlock a single field and restore its original state.
	*/
		function unlockField(fieldId, options) {
			const field = getFieldById(fieldId);

			if (shouldSkipUnlockField(field, options)) return;

			setFieldState(fieldId, {
				state: {
					readonly: false,
					disabled: false,
				},

				helperText: false,
			});
		}

		/*
	  Lock multiple fields by ID.
	*/
		function lockFields(fieldIds, options) {
			normalizeIdList(fieldIds).forEach(function (fieldId) {
				lockField(fieldId, options || {});
			});
		}

		/*
	  Unlock multiple fields by ID.
	*/
		function unlockFields(fieldIds, options) {
			normalizeIdList(fieldIds).forEach(function (fieldId) {
				unlockField(fieldId, options || {});
			});
		}

		/*
			Hide multiple fields.

			Accepts an array of field IDs.

			Each field's label, helper text,
			and validation message are hidden
			along with the field.

			Example:

				hideFields([
					"chosenLastName",
					"chosenLastNameReason"
				]);
		*/
		function hideFields(fieldIds) {
			normalizeIdList(fieldIds).forEach(function (fieldId) {
				hideField(fieldId);
			});
		}

		/*
			Show multiple fields.

			Accepts an array of field IDs.

			Each field is restored using the same logic as showField().

			Example:

				showFields([
					"chosenLastName",
					"chosenLastNameReason"
				]);
		*/
		function showFields(fieldIds) {
			normalizeIdList(fieldIds).forEach(function (fieldId) {
				showField(fieldId);
			});
		}

		/*
			Hide multiple containers.

			Accepts an array of:

			- CSS class names
			- CSS selectors
			- DOM elements

			Unlike hideFields(), this intentionally hides
			entire sections of the form.

			Example:

				hideContainers([
					"studentSection",
					"#schoolInformation"
				]);
		*/
		function hideContainers(selectorOrElements) {
			if (!Array.isArray(selectorOrElements)) {
				console.warn(
					"fieldStateUtils: hideContainers expects an array.",
				);
				return;
			}

			selectorOrElements.forEach(function (selectorOrElement) {
				hideContainer(selectorOrElement);
			});
		}

		/*
			Show multiple containers.

			Restores containers previously hidden through
			hideContainers().

			Example:

				showContainers([
					"studentSection",
					"#schoolInformation"
				]);
		*/
		function showContainers(selectorOrElements) {
			if (!Array.isArray(selectorOrElements)) {
				console.warn(
					"fieldStateUtils: showContainers expects an array.",
				);
				return;
			}

			selectorOrElements.forEach(function (selectorOrElement) {
				showContainer(selectorOrElement);
			});
		}

		/*
			Toggle multiple containers.

			Accepts an array of:

			- CSS class names
			- CSS selectors
			- DOM elements

			Shows containers when shouldShow is true.
			Hides containers when shouldShow is false.

			Example:

				toggleContainers([
					"developer",
					"#adminSection"
				], canViewDeveloperSection);
		*/
		function toggleContainers(selectorOrElements, isVisible) {
			if (!Array.isArray(selectorOrElements)) {
				console.warn(
					"fieldStateUtils: toggleContainers expects an array.",
				);
				return;
			}

			const shouldShowContainer = isVisible === true;

			selectorOrElements.forEach(function (selectorOrElement) {
				if (shouldShowContainer) {
					showContainer(selectorOrElement);
				} else {
					hideContainer(selectorOrElement);
				}
			});
		}

		/*
			Retrieve all fields inside a container or selector.

			Supports:
			- CSS selectors
			- direct DOM elements

			Prevents duplicate fields from being returned.
		*/
		function getContainerFields(selectorOrElements) {
			const seen = {};
			const fields = [];

			normalizeContainerList(selectorOrElements).forEach(
				function (selectorOrElement) {
					let containers = [];

					if (typeof selectorOrElement === "string") {
						const selector =
							normalizeContainerSelector(selectorOrElement);

						containers = Array.prototype.slice.call(
							root.querySelectorAll(selector),
						);

						if (!containers.length) {
							console.warn(
								`fieldStateUtils: No container found for "${selectorOrElement}".`,
							);
						}
					} else if (
						selectorOrElement &&
						selectorOrElement.nodeType === 1
					) {
						containers = [selectorOrElement];
					}

					containers.forEach(function (container) {
						container
							.querySelectorAll(FIELD_SELECTOR)
							.forEach(function (field) {
								if (!seen[field.id]) {
									seen[field.id] = true;
									fields.push(field);
								}
							});
					});
				},
			);

			return fields;
		}

		/*
			Lock multiple containers.

			Accepts an array of selectors, class names,
			or DOM elements.

			Every supported field inside the container
			will be locked.

			Example:

				lockContainers([
					"studentSection",
					"#schoolInformation"
				]);
		*/
		function lockContainers(selectorOrElements, options) {
			if (!Array.isArray(selectorOrElements)) {
				console.warn(
					"fieldStateUtils: lockContainers expects an array.",
				);
				return;
			}

			selectorOrElements.forEach(function (selectorOrElement) {
				lockContainer(selectorOrElement, options || {});
			});
		}

		/*
			Unlock multiple containers.

			Restores all fields inside the supplied
			containers to their original state.

			Example:

				unlockContainers([
					"studentSection",
					"#schoolInformation"
				]);
		*/
		function unlockContainers(selectorOrElements, options) {
			if (!Array.isArray(selectorOrElements)) {
				console.warn(
					"fieldStateUtils: unlockContainers expects an array.",
				);
				return;
			}

			selectorOrElements.forEach(function (selectorOrElement) {
				unlockContainer(selectorOrElement, options || {});
			});
		}

		/*
			Lock every supported field inside a container.

			The container may be supplied as:

			- CSS selector
			- Class name
			- DOM element

			Uses the same locking behavior as lockField().
		*/
		function lockContainer(selectorOrElement, options) {
			getContainerFields(selectorOrElement).forEach(function (field) {
				lockField(field.id, options || {});
			});
		}

		/*
			Shared container visibility engine.

			Used internally by:

			- hideContainer()
			- showContainer()
			- hideContainers()
			- showContainers()

			Responsibilities:

			- Add or remove the hidden CSS class
			- Apply aria-hidden for accessibility
			- Clear required indicators from fields that
			become hidden

			Containers may be supplied as:

			- CSS selectors
			- Class names
			- DOM elements
		*/
		function setContainerHidden(selectorOrElement, isHidden) {
			normalizeContainerList(selectorOrElement).forEach(function (item) {
				let containers = [];

				if (typeof item === "string") {
					containers = Array.prototype.slice.call(
						root.querySelectorAll(normalizeContainerSelector(item)),
					);
				} else if (item && item.nodeType === 1) {
					containers = [item];
				}

				containers.forEach(function (container) {
					container.classList.toggle(HIDDEN_CLASS, isHidden);

					if (isHidden) {
						container.setAttribute("aria-hidden", "true");

						container
							.querySelectorAll(FIELD_SELECTOR)
							.forEach(function (field) {
								clearRequired(field.id);
							});
					} else {
						container.removeAttribute("aria-hidden");
					}
				});
			});
		}

		function hideContainer(selectorOrElement) {
			setContainerHidden(selectorOrElement, true);
		}

		function showContainer(selectorOrElement) {
			setContainerHidden(selectorOrElement, false);
		}

		/*
	  Unlock all fields inside a container.
	*/
		function unlockContainer(selectorOrElement, options) {
			getContainerFields(selectorOrElement).forEach(function (field) {
				unlockField(field.id, options || {});
			});
		}

		/*
	  Remove helper text from aria-describedby.
	*/
		function removeDescribedBy(field, helperId) {
			const current = field.getAttribute("aria-describedby") || "";

			const ids = current
				.split(/\s+/)
				.filter(Boolean)
				.filter(function (id) {
					return id !== helperId;
				});

			if (ids.length) {
				field.setAttribute("aria-describedby", ids.join(" "));
			} else {
				field.removeAttribute("aria-describedby");
			}
		}

		/*
	  Create, update, or remove helper text.

	  Helper text is visually displayed and connected
	  to the field for accessibility.
	*/
		function getValidationMessageId(fieldId) {
			return `${fieldId}-validation`;
		}

		function setHelperText(field, helperText) {
			if (!field || !field.id) return;

			const helperId = getHelperId(field.id);
			const validationMessageId = getValidationMessageId(field.id);

			let message = document.getElementById(validationMessageId);
			let oldHelper = getFieldById(helperId);

			if (!helperText) {
				if (message) {
					message.textContent = "\u00A0";
					message.dataset.defaultHint = "";
				}

				if (oldHelper) oldHelper.remove();

				removeDescribedBy(field, helperId);
				removeDescribedBy(field, validationMessageId);
				return;
			}

			if (!message) {
				message = document.createElement("div");
				message.id = validationMessageId;
				message.className =
					HELPER_CLASS + " field-validation-message is-hint";

				field.insertAdjacentElement("afterend", message);
			}

			message.textContent = helperText;
			message.dataset.defaultHint = helperText;

			addDescribedBy(field, validationMessageId);

			if (oldHelper) {
				oldHelper.remove();
				removeDescribedBy(field, helperId);
			}
		}

		/*
	  Clear required state through requiredIndicators utility.

	  Hidden or disabled fields should not remain required.
	*/
		function clearRequired(fieldId) {
			if (
				requiredIndicators &&
				typeof requiredIndicators.setRequired === "function"
			) {
				requiredIndicators.setRequired(fieldId, false);
			}
		}

		/*
			Determine which DOM element should be hidden
			when hideField() is called.

			Goal:

			Hide the smallest meaningful field container
			without hiding an entire form section.

			Priority order:

			1. Explicit [data-field-container]
			2. Shared wrapper containing label + field
			3. Parent element
			4. Field itself

			This prevents hideField() from accidentally
			hiding Bootstrap rows or large sections of
			the form.
		*/
		function getFieldContainer(field) {
			if (!field || !field.id) return null;

			// Prefer an explicit container when the form author provides one.
			const explicitContainer = field.closest("[data-field-container]");
			if (explicitContainer) return explicitContainer;

			// FormBuilder usually wraps label + field in this inner div.
			// This hides the label, field, helper text, and validation message
			// without hiding the entire Bootstrap row.
			const label = root.querySelector(`label[for="${field.id}"]`);

			if (label) {
				const sharedWrapper = label.parentElement;

				if (
					sharedWrapper &&
					sharedWrapper.contains(field) &&
					!sharedWrapper.classList.contains("row")
				) {
					return sharedWrapper;
				}
			}

			// Fallback for fields without labels.
			if (
				field.parentElement &&
				!field.parentElement.classList.contains("row")
			) {
				return field.parentElement;
			}

			// Last resort: hide only the field itself.
			return field;
		}

		/*
	  Core state application engine.

	  Handles:
	  - hidden state
	  - disabled state
	  - readonly state
	  - helper text
	  - accessibility attributes
	  - required cleanup
	*/
		function applyFieldState(fieldId, options) {
			const field = getFieldById(fieldId);

			if (!field) return;

			/*
      Preserve original field state before modifying anything.
      */
			cacheInitialState(field);

			const state = options.state || {};

			const helperText =
				options.helperText === false
					? ""
					: typeof options.helperText === "string"
						? options.helperText
						: "";

			/*
      Hide field container.
      */
			if (state.hidden === true) {
				const container = getFieldContainer(field);

				if (container) {
					container.classList.add(HIDDEN_CLASS);

					container.setAttribute("aria-hidden", "true");
				}

				clearRequired(fieldId);
			}

			/*
      Show field container.
      */
			if (state.hidden === false) {
				const container = getFieldContainer(field);

				if (container) {
					container.classList.remove(HIDDEN_CLASS);

					container.removeAttribute("aria-hidden");
				}
			}

			/*
		Disable field interaction.
	  */
			if (state.disabled === true) {
				field.disabled = true;

				field.setAttribute("aria-disabled", "true");

				field.classList.add(DISABLED_CLASS);

				clearRequired(fieldId);
			}

			/*
		Restore original disabled state.
	  */
			if (state.disabled === false) {
				restoreDisabledState(field);

				field.classList.remove(DISABLED_CLASS);
			}

			/*
		Apply readonly behavior where supported.
	  */
			if (state.readonly === true) {
				const tag = field.tagName.toLowerCase();

				if (tag === "select") {
					field.setAttribute("aria-readonly", "true");

					// Keep enabled so value is preserved/submitted,
					// but prevent user interaction.
					attachInteractionLock(field);
				} else {
					field.readOnly = true;

					field.setAttribute("readonly", "readonly");
					field.setAttribute("aria-readonly", "true");

					if (
						isAutoCompleteField(field) ||
						isTimePickerField(field) ||
						$(field).hasClass("hasDatepicker")
					) {
						attachInteractionLock(field);
					}
				}

				field.classList.add(READONLY_CLASS);
			}

			/*
		Restore original readonly state.
	  */
			if (state.readonly === false) {
				restoreReadonlyState(field);
				detachInteractionLock(field);
				/*
		  Restore disabled state if needed.
		*/
				if (state.disabled === false) {
					restoreDisabledState(field);
				}

				field.classList.remove(READONLY_CLASS);
			}

			/*
		Apply helper text last.
		*/
			setHelperText(field, helperText);
		}

		/*
		Retrieve all labels associated with a field.

		Handles:
		- standard label[for="fieldId"]
		- native field.labels associations

		Some widgets remain interactive through labels even when
		readonly or disabled, so labels must also be locked.
		*/
		function getLabelsForField(field) {
			if (!field || !field.id) return [];

			const labels = Array.prototype.slice.call(
				root.querySelectorAll(`label[for="${field.id}"]`),
			);

			if (field.labels) {
				Array.prototype.slice
					.call(field.labels)
					.forEach(function (label) {
						if (!labels.includes(label)) {
							labels.push(label);
						}
					});
			}

			return labels;
		}

		/*
		Prevent interaction with readonly interactive widgets.

		Some third-party widgets (autocomplete, datepicker, timepicker, etc.)
		attach their own event handlers and may still open even when
		readonly is applied.

		This method suppresses:
		- mouse interaction
		- keyboard interaction
		- label-triggered interaction

		Also hides open datepickers immediately.
		*/
		function attachInteractionLock(field) {
			function blockInteraction(event) {
				if (
					field.readOnly ||
					field.disabled ||
					field.getAttribute("aria-readonly") === "true" ||
					field.classList.contains(READONLY_CLASS)
				) {
					event.preventDefault();
					event.stopImmediatePropagation();

					if (
						$(field).hasClass("hasDatepicker") &&
						typeof $(field).datepicker === "function"
					) {
						$(field).datepicker("hide");
					}

					field.blur();
					return false;
				}
			}

			$(field)
				.off(".fieldStateLock")
				.on(
					"mousedown.fieldStateLock click.fieldStateLock focus.fieldStateLock keydown.fieldStateLock",
					blockInteraction,
				);

			getLabelsForField(field).forEach(function (label) {
				$(label)
					.off(".fieldStateLock")
					.on(
						"mousedown.fieldStateLock click.fieldStateLock keydown.fieldStateLock",
						blockInteraction,
					)
					.css("cursor", "not-allowed");
			});
		}

		function detachInteractionLock(field) {
			$(field).off(".fieldStateLock");

			getLabelsForField(field).forEach(function (label) {
				$(label)
					.off(".fieldStateLock")
					.removeAttr("aria-disabled")
					.css("cursor", "");
			});
		}

		function isAutoCompleteField(field) {
			if (!field) return false;

			return (
				field.classList.contains("ui-autocomplete-input") ||
				(field.hasAttribute("data-bind") &&
					field.getAttribute("data-bind").includes("autocomplete:"))
			);
		}

		function isTimePickerField(field) {
			if (!field) return false;

			return (
				field.classList.contains("ui-timepicker-input") ||
				(field.hasAttribute("data-bind") &&
					field.getAttribute("data-bind").includes("timepicker:"))
			);
		}

		/*
	  Public method for applying field state.

	  If init() has not completed yet,
	  the request is queued and applied later.
	*/
		function setFieldState(fieldId, options) {
			if (!fieldId) return;

			const normalizedOptions = options || {};

			if (!initialized) {
				queue.push({
					fieldId: fieldId,
					options: normalizedOptions,
				});

				return;
			}

			applyFieldState(fieldId, normalizedOptions);
		}

		/*
	  Convenience method for readonly state.
	*/
		function setReadOnly(fieldId, options) {
			setFieldState(fieldId, {
				state: {
					readonly: true,
				},

				helperText:
					options &&
					Object.prototype.hasOwnProperty.call(options, "helperText")
						? options.helperText
						: false,
			});
		}

		function setAutoFilled(fieldId) {
			setReadOnly(fieldId, {
				helperText: "Auto-filled",
			});
		}

		/*
			Mark multiple fields as auto-filled.

			Applies readonly behavior and helper text
			to each field.

			Example:

				setAutoFilledFields([
					"studentName",
					"studentEmail"
				]);
		*/
		function setAutoFilledFields(fieldIds, helperText = "Auto-filled") {
			normalizeIdList(fieldIds).forEach(function (fieldId) {
				setReadOnly(fieldId, {
					helperText: helperText,
				});
			});
		}

		/*
	  Convenience method for editable state.
	*/
		function setEditable(fieldId) {
			setFieldState(fieldId, {
				state: {
					readonly: false,
					disabled: false,
				},

				helperText: false,
			});
		}

		/*
	  Convenience method for disabled state.
	*/
		function setDisabled(fieldId, options) {
			setFieldState(fieldId, {
				state: {
					disabled: true,
				},

				helperText:
					options &&
					Object.prototype.hasOwnProperty.call(options, "helperText")
						? options.helperText
						: false,
			});
		}

		/*
	  Hide a field container.
	*/
		function hideField(fieldId) {
			setFieldState(fieldId, {
				state: {
					hidden: true,
				},

				helperText: false,
			});
		}

		/*
	  Show a field container.
	*/
		function showField(fieldId) {
			setFieldState(fieldId, {
				state: {
					hidden: false,
				},
			});
		}

		/*
	  Retrieve all fields in the form.

	  Used for lockForm/unlockForm operations.
	*/
		function getAllFormFields() {
			const seen = {};
			const fields = [];

			root.querySelectorAll(FIELD_SELECTOR).forEach(function (field) {
				if (!seen[field.id]) {
					seen[field.id] = true;

					fields.push(field);
				}
			});

			return fields;
		}

		/*
	  Lock every field in the form.

	  Supports exclusions through:
	  - except
	  - exceptSelectors
	  - skipHidden
	*/
		function lockForm(options) {
			getAllFormFields().forEach(function (field) {
				lockField(field.id, options || {});
			});
		}

		/*
	  Unlock every field in the form.
	*/
		function unlockForm(options) {
			getAllFormFields().forEach(function (field) {
				unlockField(field.id, options || {});
			});
		}

		/*
	  Apply any queued operations after init().
	*/
		function flushQueue() {
			if (!queue.length) return;

			queue.forEach(function (item) {
				applyFieldState(item.fieldId, item.options);
			});

			queue = [];
		}

		/*
	  Export mode cleanup.

	  Hides:
	  - required indicators
	  - required notes
	  - helper text

	  Used during print/export rendering.
	*/
		function setExportMode(isEnabled) {
			const enabled = Boolean(isEnabled);

			document.body.classList.toggle("is-export-mode", enabled);

			root.querySelectorAll(`.${REQUIRED_INDICATOR_CLASS}`).forEach(
				function (indicator) {
					indicator.style.display = enabled ? "none" : "";
				},
			);

			root.querySelectorAll(".required-note").forEach(function (note) {
				note.style.display = enabled ? "none" : "";
			});

			root.querySelectorAll(`.${HELPER_CLASS}`).forEach(
				function (helper) {
					helper.style.display = enabled ? "none" : "";
				},
			);

			root.querySelectorAll(".developer").forEach(function (section) {
				section.style.display = enabled ? "none" : "";
			});
		}

		/*
	  Initialize utility.

	  Supports:
	  - new init({ requiredIndicators })
	  - legacy init(vm, { requiredIndicators })

	  Flushes queued operations after initialization.
	*/
		function init(viewModelOrOptions, maybeOptions) {
			const options = maybeOptions || viewModelOrOptions || {};

			requiredIndicators =
				options && options.requiredIndicators
					? options.requiredIndicators
					: null;

			initialized = true;

			flushQueue();

			return api;
		}

		/*
			Public API

			setReadOnly(fieldId)
				Marks a field as readonly.

			setEditable(fieldId)
				Restores original readonly/disabled state.

			setDisabled(fieldId)
				Disables a field.

			hideFields(fieldIds)
				Hides one or more fields.

			showFields(fieldIds)
				Shows one or more fields.

			hideContainers(containers)
				Hides one or more sections.

			toggleContainers(containers, shouldShow)
				Shows or hides one or more sections.

			showContainers(containers)
				Shows one or more sections.

			lockFields(fieldIds)
				Locks fields using readonly when possible.

			lockContainers(containers)
				Locks every field inside a container.

			lockForm()
				Locks all supported fields.

			unlockForm()
				Restores original field states.
		*/
		const api = {
			init: init,

			setFieldState: setFieldState,

			setReadOnly: setReadOnly,
			setEditable: setEditable,
			setDisabled: setDisabled,

			lockField: lockField,
			unlockField: unlockField,

			lockFields: lockFields,
			unlockFields: unlockFields,

			lockContainer: lockContainer,
			unlockContainer: unlockContainer,

			hideFields: hideFields,
			showFields: showFields,

			hideContainers: hideContainers,
			showContainers: showContainers,
			toggleContainers: toggleContainers,

			lockContainers: lockContainers,
			unlockContainers: unlockContainers,

			lockForm: lockForm,
			unlockForm: unlockForm,

			setExportMode: setExportMode,
			setAutoFilled: setAutoFilled,
			setAutoFilledFields: setAutoFilledFields,

			/*
				TODO: REMOVE after 06/15
				Backward compatibility for old autocomplete utility usage.
			*/
			makeReadOnly: setReadOnly,
			makeEditable: setEditable,
			makeAutoCompleteReadOnly: setReadOnly,
			makeAutoCompleteEditable: setEditable,
		};

		return api;
	}

	/*
	Global factory registration.
  */
	window.createFieldStateUtils = createFieldStateUtils;

	/*
	Temporary backward compatibility.

	Existing forms using createAutoCompleteUtils
	will continue to work until migrated.
  */
	window.createAutoCompleteUtils = createFieldStateUtils;
})();
