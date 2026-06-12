/* jshint maxerr: 10000 */

(function () {
	"use strict";

	function isValidDate(date) {
		return date instanceof Date && !isNaN(date.getTime());
	}

	function padDatePart(value) {
		return String(value).padStart(2, "0");
	}

	function formatDateYYYYMMDD(date) {
		if (!isValidDate(date)) {
			return null;
		}

		var year = date.getFullYear();
		var month = padDatePart(date.getMonth() + 1);
		var day = padDatePart(date.getDate());

		return `${year}-${month}-${day}`;
	}

	function formatDateMMDDYYYY(date) {
		if (!isValidDate(date)) {
			return null;
		}

		var month = padDatePart(date.getMonth() + 1);
		var day = padDatePart(date.getDate());
		var year = date.getFullYear();

		return `${month}/${day}/${year}`;
	}

	function getTodayDate() {
		return formatDateMMDDYYYY(new Date());
	}

	function addDaysToCurrentDate(days, appendMidnightUTC) {
		var date = new Date();

		date.setDate(date.getDate() + Number(days || 0));

		var formattedDate = formatDateYYYYMMDD(date);

		if (!formattedDate) {
			return null;
		}

		return appendMidnightUTC ? formattedDate + "T00:00:00Z" : formattedDate;
	}

	function normalizeDateStr(s) {
		return String(s || "").trim();
	}

	function generateDateRange(startDateStr, endDateStr) {
		var startDate = new Date(startDateStr);
		var endDate = new Date(endDateStr);
		var dateArray = [];

		if (!isValidDate(startDate) || !isValidDate(endDate)) {
			return dateArray;
		}

		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(0, 0, 0, 0);

		if (startDate > endDate) {
			return dateArray;
		}

		for (
			var dt = new Date(startDate);
			dt <= endDate;
			dt.setDate(dt.getDate() + 1)
		) {
			dateArray.push(formatDateMMDDYYYY(dt));
		}

		return dateArray;
	}

	function getAcademicYear() {
		var today = new Date();

		var currentYear = today.getFullYear();
		var nextYear = currentYear + 1;

		var currentYear2Digit = currentYear.toString().slice(-2);
		var nextYear2Digit = nextYear.toString().slice(-2);

		// September.
		// JavaScript months are zero-based.
		var academicYearStartMonth = 8;

		if (today.getMonth() < academicYearStartMonth) {
			return currentYear - 1 + "-" + currentYear2Digit;
		}

		return currentYear + "-" + nextYear2Digit;
	}

	window.dateUtils = {
		isValidDate: isValidDate,
		formatDateYYYYMMDD: formatDateYYYYMMDD,
		formatDateMMDDYYYY: formatDateMMDDYYYY,
		getTodayDate: getTodayDate,
		addDaysToCurrentDate: addDaysToCurrentDate,
		normalizeDateStr: normalizeDateStr,
		generateDateRange: generateDateRange,
		getAcademicYear: getAcademicYear,
	};
})();
