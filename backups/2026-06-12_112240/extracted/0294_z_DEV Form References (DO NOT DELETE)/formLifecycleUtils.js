/* jshint maxerr: 10000 */

(function () {
	"use strict";

	/*
		formLifecycleUtils

		Purpose:
		Centralize common form setup and lifecycle behavior.

		Handles:
		- Utility creation
		- Utility initialization
		- Developer section visibility
		- Export mode configuration
		- Required field validation lifecycle

		Design goals:
		- Reduce repeated boilerplate across forms.
		- Provide a consistent initialization pattern.
		- Maintain backward compatibility with older forms.
		- Keep lifecycle-related logic in one place.
	*/

	function createFormLifecycleUtils(options) {
		console.info("formLifecycleUtils 06-12-26 TEST");
		options = options || {};

		var vm = options.vm;
		var pkg = options.pkg;
		var user = options.user;

		/*
			Optional formUtils reference.

			Allows new forms to inject dependencies while
			maintaining compatibility with older forms that
			rely on globally registered utilities.
		*/
		var utils = options.formUtils || window.formUtils || {};

		/*
			Create utility instances.

			Supports:
			- Explicit dependency injection
			- formUtils factory methods
			- Legacy global utility factories
		*/
		var requiredIndicators =
			options.requiredIndicators ||
			(utils.createRequiredIndicators
				? utils.createRequiredIndicators()
				: window.createRequiredIndicators());

		var fieldStateUtils =
			options.fieldStateUtils ||
			(utils.createFieldStateUtils
				? utils.createFieldStateUtils()
				: window.createFieldStateUtils());

		var fieldValidation =
			options.fieldValidation ||
			(utils.createFieldValidationUtils
				? utils.createFieldValidationUtils()
				: window.createFieldValidationUtils());

		/*
			Prevent initialization from running more than once.

			Some lifecycle methods may be called multiple times,
			but utility initialization should only occur once.
		*/
		var initialized = false;

		/*
			Initialize all form utilities.

			Responsibilities:

			- Initialize required indicators
			- Initialize field state utilities
			- Initialize field validation

			Safe to call multiple times.
		*/
		function initialize() {
			if (initialized) return api;

			requiredIndicators.init(vm);

			fieldStateUtils.init({
				requiredIndicators: requiredIndicators,
			});

			fieldValidation.initAll();

			initialized = true;

			return api;
		}

		/*
			Apply developer section visibility.

			Developer-only sections are automatically
			shown or hidden based on group membership.

			Delegates visibility logic to
			developerSectionUtils.
		*/
		function applyDeveloperSectionVisibility() {
			if (
				window.developerSectionUtils &&
				typeof window.developerSectionUtils
					.applyDeveloperSectionVisibility === "function"
			) {
				window.developerSectionUtils.applyDeveloperSectionVisibility({
					user: user,
					fieldStateUtils: fieldStateUtils,
				});
			}

			return api;
		}

		/*
			Apply export mode behavior.

			Used when forms are rendered for:

			- Export
			- Printing
			- PDF generation

			Delegates export-specific cleanup to
			fieldStateUtils.
		*/
		function applyExportMode() {
			if (pkg) {
				fieldStateUtils.setExportMode(pkg.isExporting);
			}

			return api;
		}

		/*
			After-load lifecycle helper.

			Performs all standard initialization required
			after form values and bindings are ready.

			Responsibilities:

			- Initialize utilities
			- Apply developer visibility
			- Configure export mode
		*/
		function afterLoad() {
			initialize();
			applyDeveloperSectionVisibility();
			applyExportMode();

			return api;
		}

		/*
			Before-required lifecycle helper.

			Prepares validation immediately before
			Etrieve evaluates required fields.

			Responsibilities:

			- Apply native required attributes
			- Require valid autocomplete selections
		*/
		function beforeRequired() {
			initialize();

			requiredIndicators.applyNativeRequiredForValidation();
			fieldValidation.requireValidAutocompletes();

			return api;
		}

		/*
			After-required lifecycle helper.

			Cleans up temporary validation state after
			required field validation has completed.

			Responsibilities:

			- Remove native required attributes
		*/
		function afterRequired() {
			requiredIndicators.clearNativeRequired();

			return api;
		}

		/*
			Public API

			requiredIndicators
				Shared required indicator utility instance.

			fieldStateUtils
				Shared field state utility instance.

			fieldValidation
				Shared field validation utility instance.

			initialize()
				Initialize all utilities.

			afterLoad()
				Run standard after-load processing.

			beforeRequired()
				Run standard pre-validation processing.

			afterRequired()
				Run standard post-validation cleanup.

			applyExportMode()
				Apply export mode behavior.
		*/
		var api = {
			requiredIndicators: requiredIndicators,
			fieldStateUtils: fieldStateUtils,
			fieldValidation: fieldValidation,

			initialize: initialize,
			afterLoad: afterLoad,
			beforeRequired: beforeRequired,
			afterRequired: afterRequired,
			applyExportMode: applyExportMode,
		};

		return api;
	}

	/*
		Global factory registration.
	*/
	window.createFormLifecycleUtils = createFormLifecycleUtils;
})();
