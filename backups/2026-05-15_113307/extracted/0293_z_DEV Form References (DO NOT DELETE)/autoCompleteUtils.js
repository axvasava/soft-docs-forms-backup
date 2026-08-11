/* jshint maxerr: 10000 */
(function () {
	"use strict";

	function createAutoCompleteUtils(root = document) {
		const READONLY_CLASS = "is-autocomplete-readonly";
		const HELPER_CLASS = "autocomplete-helper-text";
		const REQUIRED_INDICATOR_CLASS = "required-indicator";

		console.log("autoCompleteUtils v20260504 loaded");

		let vm = null;
		let initialized = false;
		let queue = [];

		function getFieldById(id) {
			return root.getElementById
				? root.getElementById(id)
				: document.getElementById(id);
		}

		function getHelperId(fieldId) {
			return `${fieldId}-autocomplete-helper`;
		}

		function addDescribedBy(field, helperId) {
			const current = field.getAttribute("aria-describedby") || "";
			const ids = current.split(/\s+/).filter(Boolean);

			if (!ids.includes(helperId)) {
				ids.push(helperId);
			}

			field.setAttribute("aria-describedby", ids.join(" "));
		}

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

		function setHelperText(field, helperText) {
			if (!field || !field.id) return;

			const helperId = getHelperId(field.id);
			let helper = root.getElementById
				? root.getElementById(helperId)
				: document.getElementById(helperId);

			if (!helperText) {
				if (helper) helper.remove();
				removeDescribedBy(field, helperId);
				return;
			}

			if (!helper) {
				helper = document.createElement("div");
				helper.id = helperId;
				helper.className = HELPER_CLASS;

				field.insertAdjacentElement("afterend", helper);
			}

			helper.textContent = helperText;
			addDescribedBy(field, helperId);
		}

		function applyMakeReadOnly(fieldId, options) {
			const field = getFieldById(fieldId);
			if (!field) return;

			const helperText =
				options && options.helperText === false
					? ""
					: options && typeof options.helperText === "string"
						? options.helperText
						: "Auto-filled";

			field.readOnly = true;
			field.setAttribute("readonly", "readonly");
			field.setAttribute("aria-readonly", "true");
			field.classList.add(READONLY_CLASS);

			setHelperText(field, helperText);
		}

		function applyMakeEditable(fieldId) {
			const field = getFieldById(fieldId);
			if (!field) return;

			field.readOnly = false;
			field.removeAttribute("readonly");
			field.removeAttribute("aria-readonly");
			field.classList.remove(READONLY_CLASS);

			setHelperText(field, "");
		}

		function makeReadOnly(fieldId, options) {
			if (!fieldId) return;

			if (!initialized) {
				queue.push({
					action: "makeReadOnly",
					fieldId: fieldId,
					options: options || {}
				});
				return;
			}

			applyMakeReadOnly(fieldId, options || {});
		}

		function makeEditable(fieldId) {
			if (!fieldId) return;

			if (!initialized) {
				queue.push({
					action: "makeEditable",
					fieldId: fieldId
				});
				return;
			}

			applyMakeEditable(fieldId);
		}

		function flushQueue() {
			if (!queue.length) return;

			queue.forEach(function (item) {
				if (item.action === "makeReadOnly") {
					applyMakeReadOnly(item.fieldId, item.options || {});
				}

				if (item.action === "makeEditable") {
					applyMakeEditable(item.fieldId);
				}
			});

			queue = [];
		}

		function setExportMode(isEnabled) {
			const enabled = Boolean(isEnabled);

			document.body.classList.toggle("is-export-mode", enabled);

			root.querySelectorAll(`.${REQUIRED_INDICATOR_CLASS}`).forEach(
				function (indicator) {
					indicator.style.display = enabled ? "none" : "";
				}
			);

			root.querySelectorAll(".required-note").forEach(
				function (note) {
					note.style.display = enabled ? "none" : "";
				}
			);
		}

		function init(viewModel) {
			vm = viewModel;
			initialized = true;

			flushQueue();

			return api;
		}

		const api = {
			init: init,
			makeReadOnly: makeReadOnly,
			makeEditable: makeEditable,
			setExportMode: setExportMode
		};

		return api;
	}

	window.createAutoCompleteUtils = createAutoCompleteUtils;
})();