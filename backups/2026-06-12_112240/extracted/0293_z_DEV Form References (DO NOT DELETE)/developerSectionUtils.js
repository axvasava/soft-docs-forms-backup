/* jshint maxerr: 10000 */

(function () {
	"use strict";

	/*
		developerSectionUtils

		Purpose:
		Centralize developer-only section visibility across forms.

		Handles:
		- Checking developer group membership
		- Showing developer-only containers
		- Hiding developer-only containers
		- Backward compatibility with older fieldStateUtils versions

		Design goals:
		- Keep developer group IDs out of forms.
		- Provide a single source of truth for developer access.
		- Reduce repeated visibility logic across forms.
		- Gracefully support older forms during migration.
	*/

	var DEFAULT_DEVELOPER_CONTAINERS = ["developer"];

	/*
		Show or hide developer-only sections.

		Options:

		- user
			Current Etrieve user object.

		- fieldStateUtils
			Instance of fieldStateUtils used to
			show or hide containers.

		- containers (optional)
			Array of container names or selectors.

			Default:
				["developer"]

		Returns:

		- true
			User has developer access.

		- false
			User does not have developer access
			or required dependencies are missing.
	*/
	function applyDeveloperSectionVisibility(options) {
		options = options || {};

		var currentUser = options.user;
		var fieldStateUtils = options.fieldStateUtils;
		var containers = options.containers || DEFAULT_DEVELOPER_CONTAINERS;

		/*
			fieldStateUtils is required because this utility
			delegates all visibility management to it.
		*/
		if (!fieldStateUtils) {
			console.warn("developerSectionUtils: fieldStateUtils is required.");

			return false;
		}

		/*
			Retrieve the configured developer group ID.

			The ID is stored in formIds.js so it can be
			updated in one location if it ever changes.
		*/
		var developerGroupId =
			window.formIds &&
			window.formIds.groups &&
			window.formIds.groups.developer;

		/*
			Determine whether the current user
			belongs to the developer group.
		*/
		var canViewDeveloperSection =
			!!developerGroupId &&
			!!currentUser &&
			typeof currentUser.hasGroupOrRole === "function" &&
			currentUser.hasGroupOrRole(developerGroupId);

		/*
			Preferred path.

			Newer versions of fieldStateUtils support
			toggleContainers() which handles both
			show and hide behavior.
		*/
		if (typeof fieldStateUtils.toggleContainers === "function") {
			fieldStateUtils.toggleContainers(
				containers,
				canViewDeveloperSection,
			);
			/*
				Backward compatibility.

				Support older fieldStateUtils versions
				that only expose showContainers() and
				hideContainers().
			*/
		} else if (
			canViewDeveloperSection &&
			typeof fieldStateUtils.showContainers === "function"
		) {
			fieldStateUtils.showContainers(containers);
		} else if (
			!canViewDeveloperSection &&
			typeof fieldStateUtils.hideContainers === "function"
		) {
			fieldStateUtils.hideContainers(containers);
		} else {
			/*
			Last-resort fallback.

			Allows visibility control even if
			fieldStateUtils is unavailable or
			missing visibility methods.
		*/
			$(".developer").toggle(!!canViewDeveloperSection);
		}

		return canViewDeveloperSection;
	}

	/*
		Public API

		applyDeveloperSectionVisibility(options)
			Show or hide developer-only sections
			based on the current user's permissions.
	*/
	window.developerSectionUtils = {
		applyDeveloperSectionVisibility: applyDeveloperSectionVisibility,
	};
})();
