/* jshint maxerr: 10000 */

(function () {
	"use strict";

	function formatNumber(value, options = {}) {
		const { decimals = 2, showDollar = false } = options;

		if (value === undefined || value === null || value === "") {
			const emptyValue = Number(0).toFixed(decimals);

			return showDollar ? `$${emptyValue}` : emptyValue;
		}

		const stringValue = String(value);
		const isNegative = stringValue.includes("-");
		const cleanedValue = stringValue.replace(/[^0-9.]/g, "");

		if (!cleanedValue) {
			return null;
		}

		const parts = cleanedValue.split(".");

		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

		if (parts[1]) {
			parts[1] = parts[1].substring(0, decimals).padEnd(decimals, "0");
		} else {
			parts[1] = "0".repeat(decimals);
		}

		let formatted = parts.join(".");

		if (isNegative && parts[0] !== "") {
			formatted = "-" + formatted;
		}

		if (showDollar) {
			formatted = `$${formatted}`;
		}

		return formatted;
	}

	function formatAmountRounded(value, options = {}) {
		const { decimals = 2, showDollar = false } = options;

		if (value == null || value === "") {
			const emptyValue = Number(0).toFixed(decimals);
			return showDollar ? `$${emptyValue}` : emptyValue;
		}

		const cleaned = String(value).replace(/[^0-9.-]/g, "");
		const number = Number(cleaned);

		if (!Number.isFinite(number)) {
			const emptyValue = Number(0).toFixed(decimals);
			return showDollar ? `$${emptyValue}` : emptyValue;
		}

		const factor = Math.pow(10, decimals);
		const rounded = Math.round((number + Number.EPSILON) * factor) / factor;

		let formatted = rounded.toFixed(decimals);
		const parts = formatted.split(".");

		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

		formatted = parts.join(".");

		return showDollar ? `$${formatted}` : formatted;
	}

	window.numberUtils = {
		formatNumber: formatNumber,
		formatAmountRounded: formatAmountRounded,
	};
})();
