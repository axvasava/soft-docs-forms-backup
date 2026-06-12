/* jshint maxerr: 10000 */
(function () {
	"use strict";

	function createRequiredIndicators(root = document) {
		const REQUIRED_MARKER_CLASS = "required-indicator";
		const FIELD_SELECTOR = "input[id], select[id], textarea[id]";

		console.log("requiredIndicators 05-06-26 loaded");

		let vm = null;
		let initialized = false;
		let queue = [];
		let observer = null;
		let syncing = false;
		let refreshQueued = false;

		function getFieldById(id) {
			return root.getElementById
				? root.getElementById(id)
				: document.getElementById(id);
		}

		function getVmField(fieldId) {
			if (!vm || !fieldId) return null;
			return vm[fieldId] || null;
		}

		function getLabelForField(field) {
			if (!field || !field.id) return null;

			let label = root.querySelector(`label[for="${field.id}"]`);

			if (!label) {
				const container = field.closest("div");
				if (container) {
					label = container.querySelector("label");
				}
			}

			return label;
		}

		function isElementVisible(element) {
			if (!element) return false;

			return !!(
				element.offsetWidth ||
				element.offsetHeight ||
				element.getClientRects().length
			);
		}

		function isRequired(fieldId) {
			const field = getFieldById(fieldId);
			const vmField = getVmField(fieldId);

			if (!field) return false;

			if (vmField && vmField.required === true) {
				return true;
			}

			if (field.hasAttribute("required")) {
				return true;
			}

			return false;
		}

		function setAriaRequired(field, required) {
			if (!field) return;

			if (required) {
				field.setAttribute("aria-required", "true");
			} else {
				field.removeAttribute("aria-required");
			}
		}

		function syncIndicator(fieldId) {
			const field = getFieldById(fieldId);
			if (!field) return;

			const label = getLabelForField(field);
			const required = isRequired(fieldId);
			const visible = isElementVisible(field);

			setAriaRequired(field, required);

			if (!label) return;

			let marker = label.querySelector(`.${REQUIRED_MARKER_CLASS}`);

			if (required && visible) {
				if (!marker) {
					marker = document.createElement("span");
					marker.className = REQUIRED_MARKER_CLASS;
					marker.setAttribute("aria-hidden", "true");
					marker.textContent = " *";
					label.appendChild(marker);
				}
			} else if (marker) {
				marker.remove();
			}
		}

		function syncAll() {
			if (syncing) return;

			syncing = true;
			try {
				root.querySelectorAll(FIELD_SELECTOR).forEach(function (field) {
					if (field.id) {
						syncIndicator(field.id);
					}
				});
			} finally {
				syncing = false;
			}
		}

		function queueRefresh() {
			if (refreshQueued) return;

			refreshQueued = true;
			requestAnimationFrame(function () {
				refreshQueued = false;
				syncAll();
			});
		}

		function applySetRequired(fieldId, required) {
			const isNowRequired = required === true;
			const field = getFieldById(fieldId);
			const vmField = getVmField(fieldId);

			if (vmField) {
				vmField.required = isNowRequired;
			}

			if (field) {
				setAriaRequired(field, isNowRequired);
			}

			syncIndicator(fieldId);
		}

		function setRequired(fieldId, required) {
			if (!fieldId) return;

			if (!initialized) {
				queue.push({
					fieldId: fieldId,
					required: required === true
				});
				return;
			}

			applySetRequired(fieldId, required);
		}

		function flushQueue() {
			if (!queue.length) return;

			queue.forEach(function (item) {
				applySetRequired(item.fieldId, item.required);
			});

			queue = [];
		}

		function startObserver() {
			if (observer) return;

			observer = new MutationObserver(function (mutations) {
				if (syncing) return;

				let shouldRefresh = false;

				mutations.forEach(function (mutation) {
					if (mutation.type === "childList") {
						shouldRefresh = true;
						return;
					}

					if (mutation.type === "attributes") {
						const target = mutation.target;
						if (!target || target.nodeType !== 1) return;

						if (
							mutation.attributeName === "style" ||
							mutation.attributeName === "class" ||
							mutation.attributeName === "hidden"
						) {
							shouldRefresh = true;
						}
					}
				});

				if (shouldRefresh) {
					queueRefresh();
				}
			});

			observer.observe(root, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeFilter: ["style", "class", "hidden"]
			});
		}

		function init(viewModel) {
			vm = viewModel;
			initialized = true;

			syncAll();
			flushQueue();
			startObserver();

			return api;
		}

		function applyNativeRequiredForValidation() {
			root.querySelectorAll(FIELD_SELECTOR).forEach(function (field) {
				if (!field.id) return;

				const vmField = getVmField(field.id);
				const shouldRequire = !!(vmField && vmField.required === true);

				if (shouldRequire) {
					field.setAttribute("required", "required");
				} else {
					field.removeAttribute("required");
					field.required = false;
				}
			});
		}

		function clearNativeRequired() {
			root.querySelectorAll(FIELD_SELECTOR).forEach(function (field) {
				field.removeAttribute("required");
				field.required = false;
			});
		}

		function disconnect() {
			if (observer) {
				observer.disconnect();
				observer = null;
			}
		}

		const api = {
			init: init,
			setRequired: setRequired,
			applyNativeRequiredForValidation: applyNativeRequiredForValidation,
			clearNativeRequired: clearNativeRequired,
			disconnect: disconnect
		};

		return api;
	}

	window.createRequiredIndicators = createRequiredIndicators;
})();
