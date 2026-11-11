// Form 0375 GL account mappings. Update account strings here; keys match saved department values.
// Deploy to https://webapps.oaklandcc.edu/cdn/forms/0375/glAccounts.js
define(function createGlAccounts() {
	"use strict";
		var departmentAccounts = {
			"Academic Support Center": "111-92-440023-71130",
			Counseling: "111-92-530001-71130",
			Library: "111-92-410002-71130",
		};
		var academicAccounts = {
			ASC: "111-92-440023-71130",
			BUS: "111-92-440012-71130",
			CIS: "111-92-440011-71130",
			CNS: "111-92-530001-71130",
			EMIT: "111-11-440015-71130",
			"ENG, LIT & COM": "111-92-440004-71130",
			"Fine & Perf. Arts": "111-92-440005-71130",
			"Health Prof": "111-92-440013-71130",
			"HUM, ART & Design": "111-92-440009-71130",
			LIB: "111-92-410002-71130",
			"Life & Natural Sci": "111-92-440008-71130",
			MATH: "111-92-440006-71130",
			NUR: "111-92-440014-71130",
			"Public Services": "111-92-440030-71130",
			"Social Science": "111-92-440001-71130",
		};
	return { departmentAccounts: departmentAccounts, academicAccounts: academicAccounts };
});
