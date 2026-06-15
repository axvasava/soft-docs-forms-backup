/* jshint maxerr: 10000 */
/**
 * fieldValidationUtils
 *
 * Provides a consistent way to:
 * - Display helper text
 * - Display validation errors
 * - Apply accessibility attributes
 * - Register reusable field validators
 *
 * The utility is form-scoped and intended to be created once per form:
 *
 *     var fieldValidation = formUtils.createFieldValidationUtils();
 *
 * After the form loads:
 *
 *     fieldValidation.initAll();
 *
 * Validation messages are rendered immediately after the field and
 * automatically connected using aria-describedby.
 */

(function () {
	"use strict";

	function createFieldValidationUtils(root = document) {
		const FIELD_SELECTOR = "input[id], select[id], textarea[id]";
		const FIELD_ERROR_CLASS = "is-field-error";
		const MESSAGE_CLASS = "field-validation-message";
		const MESSAGE_HINT_CLASS = "is-hint";
		const MESSAGE_ERROR_CLASS = "is-error";
		const HIDDEN_CLASS = "is-field-hidden";
		const AUTOCOMPLETE_VALIDATOR_FLAG =
			"__fieldValidationAutocompleteBound";

		const invalidAutocompleteFields = {};

		function isChoiceField(field) {
			return field.type === "checkbox" || field.type === "radio";
		}

		console.info("fieldValidationUtils 06-10 TEST");

		function getFieldById(fieldId) {
			return root.getElementById
				? root.getElementById(fieldId)
				: document.getElementById(fieldId);
		}

		function getMessageId(fieldId) {
			return fieldId + "-validation";
		}

		function getOrCreateMessage(field) {
			const messageId = getMessageId(field.id);
			let message = document.getElementById(messageId);

			if (message) return message;

			message = document.createElement("div");
			message.id = messageId;
			message.className = MESSAGE_CLASS + " " + MESSAGE_HINT_CLASS;

			field.insertAdjacentElement("afterend", message);

			return message;
		}

		function preserveExistingHelperText(field, message) {
			const next = field.nextElementSibling;

			if (
				next &&
				next.classList.contains("field-helper-text") &&
				!message.dataset.defaultHint
			) {
				message.dataset.defaultHint = next.textContent.trim();
				message.textContent = message.dataset.defaultHint || "\u00A0";
				next.classList.add(HIDDEN_CLASS);
			}
		}

		function ensureDescribedBy(field, messageId) {
			const describedBy = field.getAttribute("aria-describedby") || "";
			const ids = describedBy.split(/\s+/).filter(Boolean);

			if (!ids.includes(messageId)) {
				ids.push(messageId);
				field.setAttribute("aria-describedby", ids.join(" "));
			}
		}

		function showHint(message, hintText) {
			message.classList.remove(MESSAGE_ERROR_CLASS);
			message.classList.add(MESSAGE_HINT_CLASS);
			message.textContent = hintText || "\u00A0";
		}

		function showError(message, errorText) {
			message.classList.remove(MESSAGE_HINT_CLASS);
			message.classList.add(MESSAGE_ERROR_CLASS);
			message.textContent = errorText || "This field is invalid.";
		}

		function initField(fieldId) {
			const field = getFieldById(fieldId);
			if (!field) return api;

			if (isChoiceField(field)) {
				return api;
			}

			const message = getOrCreateMessage(field);

			preserveExistingHelperText(field, message);
			ensureDescribedBy(field, message.id);

			if (!message.textContent.trim()) {
				message.textContent = "\u00A0";
			}

			return api;
		}

		function initAll() {
			root.querySelectorAll(FIELD_SELECTOR).forEach(function (field) {
				if (field.id) {
					initField(field.id);
				}
			});

			return api;
		}

		function setHint(fieldId, hintText) {
			const field = getFieldById(fieldId);
			if (!field) return api;

			const message = getOrCreateMessage(field);

			message.dataset.defaultHint = hintText || "";

			field.classList.remove(FIELD_ERROR_CLASS);
			field.removeAttribute("aria-invalid");

			showHint(message, hintText);
			ensureDescribedBy(field, message.id);

			return api;
		}

		function setError(fieldId, errorText) {
			const field = getFieldById(fieldId);
			if (!field) return api;

			const message = getOrCreateMessage(field);

			field.classList.add(FIELD_ERROR_CLASS);
			field.setAttribute("aria-invalid", "true");

			showError(message, errorText);
			ensureDescribedBy(field, message.id);

			return api;
		}

		function clearError(fieldId) {
			const field = getFieldById(fieldId);
			if (!field) return api;

			field.classList.remove(FIELD_ERROR_CLASS);
			field.removeAttribute("aria-invalid");

			if (isChoiceField(field)) {
				const existingMessage = document.getElementById(
					getMessageId(field.id),
				);

				if (existingMessage) {
					existingMessage.remove();
				}

				return api;
			}

			const message = getOrCreateMessage(field);
			const defaultHint = message.dataset.defaultHint || "";

			showHint(message, defaultHint);
			ensureDescribedBy(field, message.id);

			return api;
		}

		/**
		 * Safely retrieves a nested property using dot notation.
		 *
		 * Examples:
		 *     getNestedValue(person, "name.first")
		 *     getNestedValue(course, "section.code")
		 *
		 * Returns null if any segment of the path does not exist.
		 *
		 * This allows validators to work with both simple and nested objects.
		 */

		function getNestedValue(obj, path) {
			if (!obj || !path) {
				return null;
			}

			var parts = path.split(".");
			var current = obj;

			for (var i = 0; i < parts.length; i++) {
				if (current == null) {
					return null;
				}

				current = current[parts[i]];
			}

			return current;
		}

		function setAutocompleteValidity(fieldId, isValid) {
			if (isValid) {
				delete invalidAutocompleteFields[fieldId];
			} else {
				invalidAutocompleteFields[fieldId] = true;
			}

			return api;
		}

		function getInvalidAutocompleteFields() {
			return Object.keys(invalidAutocompleteFields);
		}

		function requireValidAutocompletes(message) {
			var invalidFields = getInvalidAutocompleteFields();

			if (invalidFields.length) {
				throw new Error(
					message ||
						"Please fix invalid selections before continuing.",
				);
			}

			return api;
		}

		/**
		 * Registers validation for an autocomplete field.
		 *
		 * Validation succeeds only when the field value exists in the supplied
		 * source list.
		 *
		 * Features:
		 * - Blur-time validation
		 * - Immediate error clearing when a valid value is entered
		 * - Optional blank value support
		 * - Nested property support via dot notation
		 * - Automatic accessibility handling through setError()/clearError()
		 *
		 * Example:
		 *
		 * fieldValidation.registerAutocompleteValidator({
		 *     fieldId: "courseSection",
		 *     source: function () {
		 *         return vm.studentCourseReg();
		 *     },
		 *     matchProperty: "registrationSection",
		 *     allowBlank: true,
		 *     onInvalid: function () {
		 *         vm.deadlineDate("");
		 *         vm.deanEmail("");
		 *     }
		 * });
		 */

		function registerAutocompleteValidator(options) {
			var fieldId = options.fieldId;
			var source = options.source;
			var matchProperty = options.matchProperty;
			var allowBlank = options.allowBlank !== false;
			var onInvalid = options.onInvalid || function () {};
			var onValid = options.onValid || function () {};
			var observable = options.observable;

			var integration = options.integration;
			var integrationSource = options.integrationSource;
			var integrationParams = options.integrationParams || {};

			var field = getFieldById(fieldId);
			var lastValidValue = null;

			if (!field) return api;

			function normalize(value) {
				return String(value || "")
					.trim()
					.toUpperCase();
			}

			function getList() {
				if (typeof source === "function") {
					return Promise.resolve(source() || []);
				}

				if (Array.isArray(source)) {
					return Promise.resolve(source);
				}

				if (integration && integrationSource) {
					return integration.all(
						integrationSource,
						integrationParams,
					);
				}

				return Promise.resolve([]);
			}

			function findMatch(value) {
				var target = normalize(value);
				if (!target) return Promise.resolve(null);

				return getList().then(function (list) {
					return (
						list.find(function (item) {
							return (
								normalize(
									getNestedValue(item, matchProperty),
								) === target
							);
						}) || null
					);
				});
			}

			function validateValue(rawValue, reason) {
				var value = String(rawValue || "").trim();

				if (!value) {
					if (allowBlank) {
						clearError(fieldId);
						setAutocompleteValidity(fieldId, true);
						lastValidValue = null;
						return true;
					}

					setError(fieldId, "This field is required.");
					setAutocompleteValidity(fieldId, false);
					lastValidValue = null;
					onInvalid(value, null, reason);
					return false;
				}

				return findMatch(value).then(function (match) {
					if (!match) {
						setError(fieldId, value + " is not a valid entry.");
						setAutocompleteValidity(fieldId, false);
						lastValidValue = null;
						onInvalid(value, null, reason);
						return false;
					}

					clearError(fieldId);
					setAutocompleteValidity(fieldId, true);

					if (normalize(value) !== normalize(lastValidValue)) {
						lastValidValue = value;
						onValid(value, match, reason);
					}

					return true;
				});
			}

			if (field[AUTOCOMPLETE_VALIDATOR_FLAG]) return api;
			field[AUTOCOMPLETE_VALIDATOR_FLAG] = true;

			field.addEventListener("blur", function () {
				validateValue(field.value, "blur");
			});

			field.addEventListener("input", function () {
				validateValue(field.value, "input");
			});

			field.addEventListener("change", function () {
				validateValue(field.value, "change");
			});

			if (observable && typeof observable.subscribe === "function") {
				observable.subscribe(function (value) {
					setTimeout(function () {
						validateValue(value || field.value, "observable");
					}, 0);
				});
			}

			return api;
		}

		/**
		 * Public API
		 *
		 * initField(fieldId)
		 *     Initializes validation messaging for a single field.
		 *
		 * initAll()
		 *     Initializes validation messaging for all supported fields.
		 *
		 * setHint(fieldId, hintText)
		 *     Displays helper text beneath a field.
		 *
		 * setError(fieldId, errorText)
		 *     Displays an error and marks the field invalid.
		 *
		 * clearError(fieldId)
		 *     Removes the error state and restores helper text.
		 *
		 * getNestedValue(object, path)
		 *     Retrieves nested properties using dot notation.
		 *
		 * registerAutocompleteValidator(options)
		 *     Adds reusable autocomplete validation behavior.
		 */

		const api = {
			initField: initField,
			initAll: initAll,
			setHint: setHint,
			setError: setError,
			clearError: clearError,
			getNestedValue: getNestedValue,
			setAutocompleteValidity: setAutocompleteValidity,
			getInvalidAutocompleteFields: getInvalidAutocompleteFields,
			requireValidAutocompletes: requireValidAutocompletes,
			registerAutocompleteValidator: registerAutocompleteValidator,
		};

		return api;
	}

	window.createFieldValidationUtils = createFieldValidationUtils;
})();
