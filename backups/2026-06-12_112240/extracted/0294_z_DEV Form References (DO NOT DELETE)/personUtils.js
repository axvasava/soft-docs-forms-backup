/* jshint maxerr: 10000 */

(function () {
	"use strict";

	/**
	 * Safely retrieves a nested property value using dot notation.
	 *
	 * Example:
	 * getNestedValue(obj, "supervisor.id")
	 */
	function getNestedValue(obj, path) {
		// Stop if object or path is missing.
		if (!obj || !path) {
			return null;
		}

		// Split dot notation into parts.
		//
		// Example:
		// "supervisor.id"
		// becomes:
		// ["supervisor", "id"]
		var parts = path.split(".");

		var current = obj;

		// Walk through the object path one level at a time.
		for (var i = 0; i < parts.length; i++) {
			// Stop if the next property does not exist.
			if (current == null) {
				return null;
			}

			current = current[parts[i]];
		}

		return current != null ? current : null;
	}

	/**
	 * Searches an array of records and returns a value
	 * from the first matching object.
	 *
	 * Parameters:
	 *
	 * records
	 * Array of objects to search.
	 *
	 * matchProperty
	 * Property name used for comparison.
	 * Example: "preference" or "type"
	 *
	 * matchValue
	 * Value to match.
	 * Example: "preferred" or "primary"
	 *
	 * returnProperty
	 * Property to return from the matching record.
	 * Supports nested dot notation.
	 *
	 * Example:
	 * getMatchingValue(
	 *     users,
	 *     "type",
	 *     "primary",
	 *     "supervisor.id"
	 * )
	 */
	function getMatchingValue(
		records,
		matchProperty,
		matchValue,
		returnProperty,
	) {
		// Make sure records is an array.
		if (!Array.isArray(records)) {
			return null;
		}

		// Find the first matching record.
		var matchingRecord = records.find(function (record) {
			var currentValue = getNestedValue(record, matchProperty);

			return (
				String(currentValue || "").toLowerCase() ===
				String(matchValue || "").toLowerCase()
			);
		});

		// Return the requested property from the matching record.
		return matchingRecord
			? getNestedValue(matchingRecord, returnProperty)
			: null;
	}

	/**
	 * Returns the preferred full name.
	 */
	function getPreferredName(names) {
		return getMatchingValue(names, "preference", "preferred", "fullName");
	}

	/**
	 * Returns the preferred first name.
	 */
	function getPreferredFirstName(names) {
		return getMatchingValue(names, "preference", "preferred", "firstName");
	}

	/**
	 * Returns the preferred last name.
	 */
	function getPreferredLastName(names) {
		return getMatchingValue(names, "preference", "preferred", "lastName");
	}

	/**
	 * Returns the preferred first and last name combined
	 * into a single display name.
	 *
	 * Example:
	 * "John Smith"
	 */
	function getPreferredDisplayName(names) {
		var firstName = getPreferredFirstName(names);

		var lastName = getPreferredLastName(names);

		return [firstName, lastName].filter(Boolean).join(" ");
	}

	/**
	 * Returns the primary email address.
	 */
	function getPrimaryEmail(emails) {
		return getMatchingValue(emails, "preference", "primary", "address");
	}

	/**
	 * Returns the primary supervisor GUID.
	 */
	function getPrimarySupervisor(supervisors) {
		return getMatchingValue(
			supervisors,
			"type",
			"primary",
			"supervisor.id",
		);
	}

	// Expose utilities publicly so formUtils.js can re-export them.
	window.personUtils = {
		getNestedValue: getNestedValue,
		getMatchingValue: getMatchingValue,
		getPreferredName: getPreferredName,
		getPreferredFirstName: getPreferredFirstName,
		getPreferredLastName: getPreferredLastName,
		getPreferredDisplayName: getPreferredDisplayName,
		getPrimaryEmail: getPrimaryEmail,
		getPrimarySupervisor: getPrimarySupervisor,
	};
})();
