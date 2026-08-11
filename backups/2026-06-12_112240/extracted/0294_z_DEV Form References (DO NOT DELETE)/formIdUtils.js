/* jshint maxerr: 10000 */

(function () {
	"use strict";

	/**
	 * Generates a random 10-character ID string.
	 *
	 * IMPORTANT:
	 * This function intentionally preserves the existing
	 * ID generation logic used throughout older forms.
	 *
	 * Do not change:
	 * - Character set
	 * - Length
	 * - Random generation logic
	 *
	 * Existing forms, integrations, exports, or database
	 * records may depend on this exact format.
	 *
	 * Example output:
	 * "aB3$kP!9zQ"
	 */
	function generateFormID() {
		// List of all possible characters that can appear in the ID.
		//
		// Includes:
		// - Uppercase letters
		// - Lowercase letters
		// - Numbers
		// - Special characters
		const characters =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_+=[]{}|;:,.";

		// Stores the final generated ID.
		let id = "";

		// Build the ID one character at a time.
		//
		// Current standard length is 10 characters.
		for (let i = 0; i < 10; i++) {
			// Pick a random position from the characters string.
			const randomIndex = Math.floor(Math.random() * characters.length);

			// Add the randomly selected character to the ID.
			id += characters[randomIndex];
		}

		// Return the completed ID.
		return id;
	}

	function generateUUID() {
		if (window.crypto && typeof window.crypto.randomUUID === "function") {
			return window.crypto.randomUUID();
		}

		return "10000000-1000-4000-8000-100000000000".replace(
			/[018]/g,
			function (c) {
				return (
					c ^
					(window.crypto.getRandomValues(new Uint8Array(1))[0] &
						(15 >> (c / 4)))
				).toString(16);
			},
		);
	}

	// Expose utilities publicly so formUtils.js can re-export them.
	window.formIdUtils = {
		generateFormID: generateFormID, // legacy
		generateUUID: generateUUID,
	};
})();
