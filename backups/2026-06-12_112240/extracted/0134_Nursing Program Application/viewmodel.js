define([
	"jquery",
	"knockout",
	"vmBase",
	"integration",
	"notify",
	"user",
	"template/autosize.min",
	"template/jquery.maskedinput",
	"./liveViewModel.js",
	"package",
	"https://webapps.oaklandcc.edu/cdn/utils/formUtils.js",
	/*-- WARNING: Uncommenting the line of code below will allow you to use Etrieve Extenders on this form.
    Currently, Etrieve Extenders are only compatible with cloud based instances of Etrieve.
    If you are unsure if you can utilize Extenders, please contact your institution's Etrieve Administrator.*/
	"https://softdocscdn.etrieve.cloud/extenders/extenders.min.js",
], function viewmodel(
	$,
	ko,
	vm,
	integration,
	notify,
	user,
	autosize,
	maskedinput,
	liveVM,
	pkg,
	formUtils,
) {
	// Form-scoped required indicators manager.
	// Safe to call before init. Calls to setRequired(…) queue until afterLoad runs init(vm).
	var requiredIndicators = formUtils.createRequiredIndicators();

	// Form-scoped autocomplete utility manager.
	// Safe to call before init. Calls to makeReadOnly/makeEditable queue until afterLoad runs init(vm).
	var autoCompleteUtils = formUtils.createAutoCompleteUtils();
	//This function is used to set the autosize function on textareas with a class of autosizeareas.
	//Uncomment to use.
	//autosize($('.autosizeareas'));

	/*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
	$(".maskphone").mask("(999)999-9999? ext:9999");
	$(".maskzip").mask("99999?-9999");
	$(".maskssn").mask("999-99-9999");
	/*End masking functions*/

	$("head").append('<link rel="stylesheet" href="softdocs.css">');
	$(
		".testingCenter,.studentSignature, .nursingSection, .adjustedGrandTotal",
	).addClass("hidden");

	//Parameters:
	//  $: jQuery object. Additional documentation found at api.jquery.com

	//  ko: knockoutjs object. Additional documentation found at knockoutjs.com

	//  vm: is a base viewmodel object that enables you to interact with observable inputs on the
	//  view.html.  Observables for all inputs, selects, and textareas will be added when the
	//  viewmodel is bound to the view.  vmBase has functions to aid in adding additional observable
	//  properties to itself such as addObservables, addObservableArrays which both take a comma-
	//  separated string of names.

	//  user: The user parameter includes data associated with the current user including isInLibrary,
	//  isInDrafts, isInActivity, isOriginator, DisplayName, UserName, hasGroupOrRole, Email.

	//  integration: has functions for directly calling integration sources configured on the server
	//  integration.first: takes Source Code and an optional Parameter Object, returning a single object
	//  integration.all: takes Source Code and an optional Parameter Object, returning an array of objects
	//  integration.add: takes Source Code and a Parameter Object, returning an array of objects
	//  integration.update: takes Source Code and a Parameter Object, returning an array of objects
	//  integration.delete: takes Source Code and a Parameter Object, returning an array of objects

	//  notify: method that display a toast notification, it requires the next parameters
	//      - toastrType: string indicating the type of toast notification, could have the next values:
	//          - success
	//          - warning
	//          - error
	//      - message: string indicating the message to display on notification
	//      - title: string indicating the title for the notification

	//  pkg: The pkg viewmodel object includes parameters which return properties
	//  around the package and the package state throughout the workflow.
	//  stepCode, stepName, isAtStep, isExporting.

	//The following methods are lifecycle callbacks that will be called as described
	//if they are returned on the viewmodel object, but they are not required.

	//NOTE: if a JavaScript Promise is returned from any Lifecycle Callback, the process will wait until
	//the Promise is resolved before continuing.  Additionally, if an Integration source or any other
	//asynchronous method is called directly within one of these functions, it is required that a Promise
	//be returned in order to guarantee these methods are called in a predictable, sequential manner.

	//Loading Lifecycle Callbacks:
	//Parameters:
	//  source:
	//  If the form is configured to receive integration sources onLoad or onOrigination,
	//  they will be passed on the source parameter. onLoad sources will be available
	//  every time the form is loaded while onOrigination sources will only be available
	//  when user.isInLibrary is true.

	//  inputValues:
	//  inputValues.first(id) takes an input id & returns a single value if one exists.
	//  inputValues.all(id) takes an input id & returns an array of values if any exist.
	//  inputValues.audit(id) takes an input id & returns an array of audit history values if any exist.
	//  inputValues.list is an array of all values sent from the server that will be loaded
	//      into this form after setDefaults and prior to afterLoad.  This should only be needed if
	//      it is necessary to filter on something other than input id.

	function pointsReadingHesi(option) {
		let point = 0;
		//05.21.26 ep
		// if (option == "93-100") {
		//   return (point = 15);
		// } else if (option == "85-92") {
		//   return (point = 10);
		// } else if (option == "75-84") {
		//   return (point = 5);
		// } else {
		//   notify("error", "Please select an option.");
		// }

		if (option >= 93 && option <= 100) {
			return (point = 15);
		} else if (option >= 85 && option <= 92) {
			return (point = 10);
		} else if (option >= 75 && option <= 84) {
			return (point = 5);
		}
		// end
	}

	function pointsMathHesi(option) {
		let point = 0;

		//05.21.26 ep
		// if (option == "93-100") {
		//   return (point = 15);
		// } else if (option == "89-92") {
		//   return (point = 10);
		// } else if (option == "75-88") {
		//   return (point = 5);
		// } else {
		//   notify("error", "Please select an option.");
		// }

		if (option >= 93 && option <= 100) {
			return (point = 15);
		} else if (option >= 89 && option <= 92) {
			return (point = 10);
		} else if (option >= 75 && option <= 88) {
			return (point = 5);
		}
		//end
	}

	function pointsFromGrade(grade) {
		let points = 0;
		if (grade == "A") {
			return (points = 7);
		} else if (grade == "A-") {
			return (points = 6);
		} else if (grade == "B+") {
			return (points = 5);
		} else if (grade == "B") {
			return (points = 4);
		} else if (grade == "B-") {
			return (points = 3);
		}

		return (points = 0);
	}

	//5.20.26 ep added
	function pointsFromExperience(option) {
		let totalPointsExperience = 0;

		if (option == "Healthcare Experience") {
			totalPointsExperience = 20;
		} else if (option == "Leadership Role") {
			totalPointsExperience = 15;
		} else if (option == "Bachelor's Degree") {
			totalPointsExperience = 15;
		} else if (option == "Community Service") {
			totalPointsExperience = 10;
		} else if (option == "Study Abroad or OCC Athlete") {
			totalPointsExperience = 5;
		} else if (option == "Healthcare Job shadowing") {
			totalPointsExperience = 1;
		} else if (option == "No experience") {
			totalPointsExperience = 0;
		}

		return totalPointsExperience;
	}

	vm.lblPreviousSelection = ko.observable("");
	vm.lblOtherPreviousSelection = ko.observable("");
	$(".developer").hide();

	vm.onLoad = function onLoad(source, inputValues) {
		//  This takes place after applyBindings has been called and has added input observables to the
		//  viewmodel (vm) and before values are loaded into the form.  This method is ideal for
		//  populating dropdowns, select options and other operations that need to take place every
		//  time the form is loaded.

		//  WARNING: It is not recommended to set input values during onLoad because it is not guaranteed
		//  to save values to the server.

		//05.20.26 ep This has been updated to pull from Colleague via Ethos
		// const hesiMathInfo = `<table class="hesiTable">
		//         <tr>
		//             <th>HESI Math Score</th>
		//             <th>Points</th>
		//         </tr>
		//         <tr>
		//             <td>93-100</td>
		//             <td>15</td>
		//         </tr>
		//         <tr>
		//             <td>89-92</td>
		//             <td>10</td>
		//         </tr>
		//         <tr>
		//             <td>75-88</td>
		//             <td>5</td>
		//         </tr>
		//     <table>`;
		// $(".hesiMathTable").html(hesiMathInfo);

		//05.20.26 ep This has been updated to pull from Colleague via Ethos
		// const hesiReadingInfo = `
		//     <table class="hesiTable">
		//         <tr>
		//             <th>HESI Reading Comprehension Score</th>
		//             <th>Points</th>
		//         </tr>
		//         <tr>
		//             <td>93-100</td>
		//             <td>15</td>
		//         </tr>
		//         <tr>
		//             <td>85-92</td>
		//             <td>10</td>
		//         </tr>
		//         <tr>
		//             <td>75-84</td>
		//             <td>5</td>
		//         </tr>
		//     <table>`;

		// $(".hesiReadingTable").html(hesiReadingInfo);

		const gradeMetricsTable = `
        <table class="hesiTable">
            <tr>
                <th>Grade Received</th>
                <th>Points</th>
            </tr>
            <tr>
                <td>A</td>
                <td>7</td>
            </tr>
            <tr>
                <td>A-</td>
                <td>6</td>
            </tr>
            <tr>
                <td>B+</td>
                <td>5</td>
            </tr>
             <tr>
                <td>B</td>
                <td>4</td>
            </tr>
            <tr>
                <td>B-</td>
                <td>3</td>
            </tr>
        <table>`;
		$(".gradesTable").html(gradeMetricsTable);

		//pointsExperienceTable
		const experienceTable = `
            <table class="hesiTable">
                <tr>
                    <th>Experience</th>
                    <th>Points</th>
                </tr>
                <tr>
                    <td>Healthcare Experience</td>
                    <td>20</td>
                </tr>
                <tr>
                    <td>Leadership Role</td>
                    <td>15</td>
                </tr>
                <tr>
                    <td>Bachelor's Degree</td>
                    <td>15</td>
                </tr>
                <tr>
                    <td>Community Service</td>
                    <td>10</td>
                </tr>
                <tr>
                    <td>Study Abroad or OCC Athlete</td>
                    <td>5</td>
                </tr>
                <tr>
                    <td>Healthcare Job shadowing</td>
                    <td>1</td>
                </tr>
                <tr>
                    <td>No experience</td>
                    <td>0</td>
                </tr>
            <table>`;
		$(".pointsExperienceTable").html(experienceTable);

		//essayTable
		const essayTable = `
            <table class="hesiTable">
                <tr>
                    <th>Performance</th>
                    <th>Points</th>
                </tr>
                <tr>
                    <td>Exemplary</td>
                    <td>2</td>
                </tr>
                <tr>
                    <td>Satisfactory</td>
                    <td>1</td>
                </tr>
                 <tr>
                    <td>Not addressed</td>
                    <td>0</td>
                </tr>
            <table>`;
		$(".essayTable").html(essayTable);
	};

	vm.setDefaults = function setDefaults(source, inputValues) {
		//  This method is called after values from the server are loaded into the form inputs and before
		//  afterLoad is called.

		//  WARNING: if an integration source is called directly to retrieve values and populate inputs
		//  with default values, setDefaults must return the integration source promise.  If it doesn't,
		//  a form draft may be created every time a user opens the form and more importantly the values
		//  may not be saved to the server.

		/*
            LOGIC TO POPULATE HESI POINTS
    */
		viewGradeMetricsUpdateFields();

		vm.scoreMathHesi.subscribe(function (dropdownOption) {
			//   /* 5.18.26 ep remove logic for dropdown since we are pulling from ethos
			//                 Need to ensure score is between 75-100
			//   */
			//   console.log(dropdownOption);
			let pointsMath = pointsMathHesi(dropdownOption);
			vm.pointsMathHesi(pointsMath);
		});

		vm.scoreReadingHesi.subscribe(function (dropdownOption) {
			//   /* 5.18.26 ep remove logic for dropdown since we are pulling from ethos
			//                 Need to ensure score is between 75-100
			//   */
			//   console.log(dropdownOption);
			let pointsReading = pointsReadingHesi(dropdownOption);
			vm.pointsReadingHesi(pointsReading);
		});

		//adding date automatically once users sign on the form
		vm.counselorSig.subscribe(function (newValue) {
			if (newValue) {
				vm.date(Extenders.utils.formatDate(new Date()));
			} else {
				vm.date("");
			}
		});

		vm.testingCenterSig.subscribe(function (newValue) {
			if (newValue) {
				vm.testingCenterDate(Extenders.utils.formatDate(new Date()));
			} else {
				vm.testingCenterDate("");
			}
		});

		vm.nursingSig.subscribe(function (newValue) {
			if (newValue) {
				vm.nursingDate(Extenders.utils.formatDate(new Date()));
			} else {
				vm.nursingDate("");
			}
		});

		vm.chkPointsExpOverride.subscribe(function (newValue) {
			if (newValue) {
				$(".prevExperience").removeClass("hidden");
				enableRadioGroup("chkHealthCare");

				$('input[name="chkHealthCare"]:checked').each(function () {
					let label = $('label[for="' + this.id + '"]').text();
					//console.log(label);

					vm.lblPreviousSelection(label);
				});
			} else {
				$(".prevExperience").addClass("hidden");
			}
		});

		vm.chkPointsOtherOverride.subscribe(function (newValue) {
			if (newValue) {
				$(".prevOther").removeClass("hidden");
				enableRadioGroup("chkOther");

				$('input[name="chkOther"]:checked').each(function () {
					let label = $('label[for="' + this.id + '"]').text();
					//console.log(label);

					vm.lblOtherPreviousSelection(label);
				});
			} else {
				$(".prevOther").addClass("hidden");
			}
		});

		// $('input[id^="chkExpTotalOverride"]').on("change", function () {
		//   const selected = $('input[id^="chkExpTotalOverride"]').is(":checked");
		//   if (selected){
		//       $("hideExtraSpace").hide();
		//   } else {
		//       $("hideExtraSpace").show();
		//   }

		// });

		// vm.studentSignature.subscribe(function(newValue) {
		//     if (newValue) {
		//         vm.studentDate(Extenders.utils.formatDate(new Date()));
		//     } else {
		//         vm.studentDate('');
		//     }
		// });

		$('select[id^="gradeText"]').on("change", function () {
			const id = this.id;
			const grade = $(this).val();
			const points = pointsFromGrade(grade);

			if (id.endsWith("One")) {
				vm.pointsOne(points);
			} else if (id.endsWith("Two")) {
				vm.pointsTwo(points);
			} else if (id.endsWith("Three")) {
				vm.pointsThree(points);
			} else if (id.endsWith("Four")) {
				vm.pointsFour(points);
			} else if (id.endsWith("Five")) {
				vm.pointsFive(points);
			} /* else if (id.endsWith("Six")) {
        vm.pointsSix(points);
      } else if (id.endsWith("Seven")) {
        vm.pointsSeven(points);
      }*/
		});

		// 05/20/26 ep the new grade dropdown that appears when update is checked
		$('select[id^="newGradeText"]').on("change", function () {
			const id = this.id;
			const grade = $(this).val();
			const points = pointsFromGrade(grade);

			if (id.endsWith("One")) {
				vm.newPointsOne(points);
			} else if (id.endsWith("Two")) {
				vm.newPointsTwo(points);
			} else if (id.endsWith("Three")) {
				vm.newPointsThree(points);
			} else if (id.endsWith("Four")) {
				vm.newPointsFour(points);
			} else if (id.endsWith("Five")) {
				vm.newPointsFive(points);
			} /* else if (id.endsWith("Six")) {
        vm.newPointsSix(points);
      } else if (id.endsWith("Seven")) {
        vm.newPointsSeven(points);
      }*/
		});

		// 05/20/26 ep start checkboxes were changed to radio buttons
		// added the ability to override the total points for experience
		// let totalPointsExperience = 0;
		// const pointsMap = {
		//   //"Healthcare Experience": 20, //ep 5.18.26
		//   "Healthcare Experience (Paid Direct Patient Care)": 20, //ep 5.18.26
		//   "Leadership Role": 15,
		//   "Bachelor's Degree": 15,
		//   "Community Service": 10,
		//   "Study Abroad or OCC Athlete": 5,
		//   "Healthcare Job shadowing": 1,
		//   "No experience": 0,
		// };

		// $('input[id^="chkExp"]').on("change", function () {
		//   let maxPoints = 0;
		//   const selected = $('input[id^="chkExp"]:checked');

		//       $('input[id^="chkExp"]:checked').each(function () {
		//         const chkName = $(this).next().text().trim();
		//         const points = pointsMap[chkName] || 0;
		//         if (points > maxPoints) {
		//           maxPoints = points;
		//         }
		//       });

		//   totalPointsExperience = maxPoints;

		//   // console.log("Highest Points:", totalPointsExperience);
		//   vm.totalPointsExperience(totalPointsExperience);
		// });

		//Update checkbox for each grade in the Grade Metrix section

		$('input[id^="chkUpdate"]').on("change", function () {
			const id = this.id;
			const isChecked = $(this).is(":checked");

			const match = id.match(/(One|Two|Three|Four|Five)$/);
			if (!match) return;

			const suffix = match[1];

			if (isChecked) {
				$(`.newRow${suffix}`).removeClass("hidden");
				$(`.oldRow${suffix}`).addClass("hidden");

				//courses dropdown
				$("#newTextOne, #newTextFive").prop("disabled", false);

				//grade dropdown
				$(`#newGradeText${suffix}`).prop("disabled", false);

				// $(`#newText${suffix}`).prop("disabled", true);
			} else if (!isChecked) {
				$(`.newRow${suffix}`).addClass("hidden");
				$(`.oldRow${suffix}`).removeClass("hidden");

				$(`#newPoints${suffix}`).val(0);
			}
		});

		//This is the override checkbox for the HESI section
		vm.chkHesiScoreOverride.subscribe(function (newValue) {
			if (vm.chkHesiScoreOverride()) {
				$(".overrideHesi").removeClass("hidden");
			} else {
				$(".overrideHesi").addClass("hidden");

				//clear out values if Override is unchecked
				vm.newScoreMathHesi(0);
				vm.newPointsMathHesi("");
				vm.newScoreReadingHesi(0);
				vm.newPointsReadingHesi("");
			}
		});

		vm.newScoreMathHesi.subscribe(function (newValue) {
			const newPointsMathHesi = pointsMathHesi(newValue);

			if (newValue < 75 && newValue != 0) {
				$("#newScoreMathHesi").val(75);
				notify("error", "Math score must be between 75 - 100");
				return;
			} else if (newValue > 100) {
				$("#newScoreMathHesi").val(100);
				notify("error", "Math score must be between 75 - 100");
				return;
			}

			vm.newPointsMathHesi(newPointsMathHesi);
		});

		vm.newScoreReadingHesi.subscribe(function (newValue) {
			const newReadingPoints = pointsReadingHesi(newValue);

			if (newValue < 75 && newValue != 0) {
				$("#newScoreReadingHesi").val(75);
				notify("error", "Reading score must be between 75 - 100");
				return;
			} else if (newValue > 100) {
				$("#newScoreReadingHesi").val(100);
				notify("error", "Reading score must be between 75 - 100");
				return;
			}

			vm.newPointsReadingHesi(newReadingPoints);
		});

		// end

		$('input[id^="chkOther"]').on("change", function () {
			//   const checkedCount = $('input[id^="chkOther"]:checked').length;
			const isNotApplicableChk = $("#chkOtherNotApplicable").is(
				":checked",
			);
			const isOverrideChk = $("#chkPointsOtherOverride").is(":checked"); //05.21.26 ep start

			//   if (isNotApplicableChk) {
			//       vm.pointsOther(0);
			//       return;
			//   }

			//   if (checkedCount > 0) {
			//     vm.pointsOther(5);
			//   } else {
			//     vm.pointsOther(0);
			//   }

			if (isNotApplicableChk && !isOverrideChk) {
				vm.pointsOther(0);
				return;
			} else if (isNotApplicableChk && isOverrideChk) {
				vm.newPointsOther(0);
				return;
			}

			if (isOverrideChk) {
				vm.newPointsOther(5);
			} else {
				vm.pointsOther(5);
			} // end
		});

		let totalPointsEssay = 0;

		$('input[id^="essayPoints"]').on("change", function () {
			let newVal = parseInt($(this).val(), 10) || 0;

			if (newVal < 0 || newVal > 2) {
				notify(
					"warning",
					"Points should be either 0, 1, or 2",
					"Invalid Number",
				);
				$(this).val(0);
				newVal = 0;
			}

			// Store previous value using jQuery’s .data()
			let prevVal = parseInt($(this).data("prev-val")) || 0;

			// Update total by removing previous value and adding new one
			totalPointsEssay = totalPointsEssay - prevVal + newVal;

			// Store the current value for the next change
			$(this).data("prev-val", newVal);

			// console.log("Total Essay Points:", totalPointsEssay);
			vm.totalPointsEssay(totalPointsEssay);
		});

		//Hidding and showing specific fields according to the step code
		if (pkg.isAtStep("testingCenter")) {
			$(".testingCenter").removeClass("hidden");
			$(".overrideHesi,.prevOther, .prevExperience, .override").addClass(
				"hidden",
			);
			//requiredIndicators.setRequired("attachEssayChk", true);
			//requiredIndicators.setRequired("testingCenterSig", true);
			makeRadioGroupReadOnly("chkHealthCare");
			makeRadioGroupReadOnly("chkOther");
		} else if (pkg.isAtStep("Start")) {
			$(".overrideHesi,.prevOther, .prevExperience, .override").addClass(
				"hidden",
			);
		} else if (pkg.isAtStep("nursing")) {
			$(".testingCenter").removeClass("hidden");
			// $('.studentSignature').removeClass('hidden');
			$(".nursingSection").removeClass("hidden");
			//requiredIndicators.setRequired("nursingSig", true);
			$(".override").removeClass("hidden");
			makeRadioGroupReadOnly("chkHealthCare");
			makeRadioGroupReadOnly("chkOther");

			handleUpdateShowHide();
		} else if (pkg.isAtStep("End")) {
			$(".testingCenter").removeClass("hidden");
			$(".nursingSection").removeClass("hidden");
			$(".override").removeClass("hidden");

			handleUpdateShowHide();
		}

		//Making fields readonly according to the step code
		if (!pkg.isAtStep("Start")) {
			$("#studentID, #counselorSig, #nursingNotes").prop(
				"readonly",
				true,
			);
			$("input[type=checkbox][id^='chk']").prop("disabled", true);
			$("select").prop("disabled", true);
			$("#potentialGraduationDate, #NursingInfoSession").prop(
				"disabled",
				true,
			);
		}

		if (!pkg.isAtStep("testingCenter")) {
			$("#testingCenterSig").prop("readonly", true);
			$("#attachEssayChk, #attachStudentSigChk").prop("disabled", true);
		}
		//   if(!pkg.isAtStep('Student')){
		//       $('#studentSignature').prop('readonly', true);
		//   }

		if (pkg.isAtStep("End")) {
			$(".potentialGraduationDate").show();
		}

		if (pkg.isAtStep("nursing")) {
			// $('input[id^="essayPoints"]').each(function () {
			// 	requiredIndicators.setRequired(this.id, true);
			// });

			$('select[id^="gradeText"]').each(function () {
				//this.id.prop('disabled', false);
				//this.id.prop('readonly', false);
			});

			[
				"#chkHesiScoreOverride",
				"#chkPointsExpOverride",
				"#chkPointsOtherOverride",
				"#chkUpdateOne",
				"#chkUpdateTwo",
				"#chkUpdateThree",
				"#chkUpdateFour",
				"#chkUpdateFive",
				"#chkUpdateSix",
				"#chkUpdateSeven",
			].forEach((id) => $(id).prop("disabled", false));

			ko.computed(function adjustedGrandTotal() {
				var adjustedTotal = 0;
				let chkHesiScoreOverride = vm.chkHesiScoreOverride();
				let chkUpdateOne = vm.chkUpdateOne();
				let chkUpdateTwo = vm.chkUpdateTwo();
				let chkUpdateThree = vm.chkUpdateThree();
				let chkUpdateFour = vm.chkUpdateFour();
				let chkUpdateFive = vm.chkUpdateFive();
				let newGradeMetricsTotal = vm.newGradeMetricsTotal();
				let chkPointsExpOverride = vm.chkPointsExpOverride();
				let chkPointsOtherOverride = vm.chkPointsOtherOverride();

				if (chkHesiScoreOverride) {
					let totalHesiScore = Number(vm.totalHesiScore());

					let newHesiMathPoints = Number(vm.newPointsMathHesi()) || 0;
					let newHesiReadingPoints =
						Number(vm.newPointsReadingHesi()) || 0;
					let newScoreMathHesi = Number(vm.newScoreMathHesi()) || 0;
					let newScoreReadingHesi =
						Number(vm.newScoreReadingHesi()) || 0;

					//if null undefined empty string or a string that contain whitespace
					if (!newScoreMathHesi && !newScoreReadingHesi) {
						// notify("error","Since the override box is checked, please enter a new HESI Math Score or a new HESI Reading Score.");
					} else {
						if (newHesiMathPoints) {
							adjustedTotal += newHesiMathPoints; //new Math HESI ponts
						} else {
							let pointsMathHesi = Number(vm.pointsMathHesi()); //original Math HESI points
							adjustedTotal += pointsMathHesi;
						}

						if (newHesiReadingPoints) {
							adjustedTotal += newHesiReadingPoints; //new Math HESI ponts
						} else {
							let pointsReadingHesi = Number(
								vm.pointsReadingHesi(),
							); //original Math HESI points
							adjustedTotal += pointsReadingHesi;
						}
					}

					vm.newHesiScore(adjustedTotal);
				} else {
					adjustedTotal += totalHesiScore;
				}

				if (
					chkUpdateOne ||
					chkUpdateTwo ||
					chkUpdateThree ||
					chkUpdateFour ||
					chkUpdateFive
				) {
					var gradeMetricsTotal = 0;
					let newPointsOne = Number(vm.newPointsOne());
					let newPointsTwo = Number(vm.newPointsTwo());
					let newPointsThree = Number(vm.newPointsThree());
					let newPointsFour = Number(vm.newPointsFour());
					let newPointsFive = Number(vm.newPointsFive());

					let pointsOne = Number(vm.pointsOne());
					let pointsTwo = Number(vm.pointsTwo());
					let pointsThree = Number(vm.pointsThree());
					let pointsFour = Number(vm.pointsFour());
					let pointsFive = Number(vm.pointsFive());

					if (chkUpdateOne) {
						gradeMetricsTotal += newPointsOne;
					} else {
						gradeMetricsTotal += pointsOne;
					}

					if (chkUpdateTwo) {
						gradeMetricsTotal += newPointsTwo;
					} else {
						gradeMetricsTotal += pointsTwo;
					}

					if (chkUpdateThree) {
						gradeMetricsTotal += newPointsThree;
					} else {
						gradeMetricsTotal += pointsThree;
					}

					if (chkUpdateFour) {
						gradeMetricsTotal += newPointsFour;
					} else {
						gradeMetricsTotal += pointsFour;
					}

					if (chkUpdateFive) {
						gradeMetricsTotal += newPointsFive;
					} else {
						gradeMetricsTotal += pointsFive;
					}

					adjustedTotal += gradeMetricsTotal;
					vm.newGradeMetricsTotal(gradeMetricsTotal);
				}

				let totalPointsExperience = Number(vm.totalPointsExperience());
				if (chkPointsExpOverride) {
					let newTotalPointsExperience = Number(
						vm.newTotalPointsExperience(),
					);

					if (!newTotalPointsExperience) {
						// throw new Error(
						// 	"You must make a selection since the override box is checked",
						// );
					} else {
						adjustedTotal += newTotalPointsExperience;
					}
				} else {
					adjustedTotal += totalPointsExperience;
				}

				let pointsOther = Number(vm.pointsOther()); //newPointsOther
				if (chkPointsOtherOverride) {
					let newPointsOther = Number(vm.newPointsOther());

					if (!newPointsOther) {
						// throw new Error ("You must make a selection since the override box is checked");
					} else {
						adjustedTotal += newPointsOther;
					}
				} else {
					adjustedTotal += pointsOther;
				}

				let totalEssayPoints = Number(vm.totalEssayPoints());
				adjustedTotal += totalEssayPoints;

				vm.adjustedGrandTotal(adjustedTotal);

				checkContentFields();
			}); //end ko.computed
		}

		if (user.isInLibrary || user.isInDrafts) {
			//  Input Values set here will be saved to the server when the user makes a form
			//  instance creating action: changing an input value or clicking submit.

			vm.formID(generateFormID());
			vm.academicYear(getAcademicYear());

			vm.studentID.subscribe(function (id) {
				integration
					.first("Web_Ethos_Get_Persons_by_Colleague_ID", {
						personID: id,
					})
					.then(function (personResults) {
						if (personResults) {
							// console.log('Person Results', personResults);

							let addressGUIDForm =
								personResults.addresses[0].address.id;
							// console.log('Address GUID', addressGUIDForm);

							vm.studentName(
								personResults.names[0].firstName +
									" " +
									personResults.names[0].lastName,
							);
							vm.studentEmail(personResults.emails[0].address);
							vm.studentPhone(personResults.phones[0].number);

							var formattedDate = transformDateValue(
								personResults.dateOfBirth,
							);
							vm.studentDOB(formattedDate);

							integration
								.first(
									"Web_Ethos_Get_Address_By_Address_GUId",
									{
										addressGUID: addressGUIDForm,
									},
								)
								.then(function (addressData) {
									// console.log('Address From Ethos', addressData);

									vm.studentAddress(
										addressData.addressLines[0],
									);
									vm.studentCity(
										addressData.place.country.locality,
									);
									vm.studentState(
										addressData.place.country.region.title,
									);
									vm.studentZipCode(
										addressData.place.country.postalCode,
									);
								});

							integration
								.all("Web_Ethos_Get_Student_Test_Scores", {
									studentID: id,
								})
								.then(function (testScoreResults) {
									console.log(
										"Test Results From Ethos",
										testScoreResults,
									);

									var prevMathScore = 0;
									var prevReadingScore = 0;
									var currvMathScore = 0;
									var currReadingScore = 0;
									var highestMathScore = 0;
									var highestReadingScore = 0;

									testScoreResults.forEach(
										function (testScore, index) {
											if (testScore.Code == "HESI.NUR") {
												//H.NUR.READ   H.NUR.MATH
												const subTest0 =
													testScore.SubTests[0].Code;
												const subTest1 =
													testScore.SubTests[1].Code;

												if (subTest0 == "H.NUR.READ") {
													currReadingScore =
														testScore.SubTests[0]
															.Score;
												} else if (
													subTest1 == "H.NUR.READ"
												) {
													currReadingScore =
														testScore.SubTests[1]
															.Score;
												}

												if (subTest0 == "H.NUR.MATH") {
													currvMathScore =
														testScore.SubTests[0]
															.Score;
												} else if (
													subTest1 == "H.NUR.MATH"
												) {
													currvMathScore =
														testScore.SubTests[1]
															.Score;
												}

												if ((prevReadingScore = 0)) {
													prevReadingScore =
														currReadingScore;
												} else {
													if (
														currReadingScore >
														prevReadingScore
													) {
														highestReadingScore =
															currReadingScore;
													} else {
														highestReadingScore =
															prevReadingScore;
													}
												}

												if ((prevMathScore = 0)) {
													prevMathScore =
														currvMathScore;
												} else {
													if (
														currvMathScore >
														prevMathScore
													) {
														highestMathScore =
															currvMathScore;
													} else {
														highestMathScore =
															prevMathScore;
													}
												}
											} //end testScore.code
										},
									); //end forEach

									vm.scoreReadingHesi(highestReadingScore);
									vm.scoreMathHesi(highestMathScore);
								}); //testScoreResults
						} //end personResults
					});
			});
		} else {
			//  Input Values set here will be saved to the server immediately.
			//  CAUTION: It is recommended to only set the values of inputs that haven't been populated by
			//  prior users.  Inputs that already have values saved to the server will be overridden with
			//  values set in this method.
		}
	};

	vm.afterLoad = function afterLoad() {
		//  This method is called after setDefaults has been called.

		//  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
		//  to save values to the server.

		//Initialize FormBuilder created form specific code
		liveVM.afterLoadEditsForVM();

		// Initialize required indicators after VM bindings and form DOM are ready.
		// This replays any queued setRequired(…) calls made earlier in setDefaults.
		requiredIndicators.init(vm);

		// Initialize autocomplete utilities after VM bindings are ready.
		// Replays any queued makeReadOnly/makeEditable calls made earlier.
		autoCompleteUtils.init(vm);

		// Toggle export mode styling and behavior.
		// Hides required indicators/notes and normalizes readonly presentation for export.
		autoCompleteUtils.setExportMode(pkg.isExporting);

		/*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
		autosize($("textarea"));

		// TODO: Uncomment
		// if (pkg.isAtStep("Start")) {
		// 	requiredIndicators.setRequired("chkBioCourses", true);
		// 	requiredIndicators.setRequired("chkNURCurriculum", true);
		// 	requiredIndicators.setRequired("chkEvidenceHighSchoolorGed", true);

		// 	// $('.graduation').on('change',function(){
		// 	//     var isGrad =   $('.graduation').is(':checked');
		// 	//     if(isGrad){
		// 	//         $('.potentialGraduationDate').show();
		// 	//         $('#potentialGraduationDate').prop('required', true);
		// 	//     } else{
		// 	//         $('.potentialGraduationDate').hide();
		// 	//     }
		// 	// });
		// }
	};

	//Submitting Lifecycle Callbacks:
	//Parameters:
	//  form.attachmentCount: integer

	//In order to stop the Submitting Lifecycle and prevent this form from moving to the next step in the workflow
	//process, add the following to any of the functions below:
	//    throw new Error('reason placed here will be displayed to the user');

	vm.onSubmit = function onSubmit(form) {
		return true;
		//  This method is called when the Submit button is clicked and before calling beforeRequired.
		//  This normally occurs in the Forms Library, but may occur in the Inbox when a package is
		//  returned to Originator.

		//if (pkg.isAtStep("nursing")) {
		ko.computed(function verifyChecked() {
			if (
				vm.chkHesiScoreOverride() ||
				vm.chkPointsExpOverride() ||
				vm.chkPointsOtherOverride() ||
				vm.chkUpdateOne() ||
				vm.chkUpdateTwo() ||
				vm.chkUpdateThree() ||
				vm.chkUpdateFour() ||
				vm.chkUpdateFive() ||
				vm.chkUpdateSix() ||
				vm.chkUpdateSeven()
			) {
				$(".adjustedGrossTotal").removeClass("hidden");

				if (vm.chkHesiScoreOverride()) {
					requiredIndicators.setRequired("hesiNotes", true);
				}

				if (vm.chkPointsExpOverride()) {
					requiredIndicators.setRequired("experienceNotes", true);
				}

				if (vm.chkPointsOtherOverride()) {
					requiredIndicators.setRequired("notesOther", true);
				}

				if (
					vm.chkUpdateOne() ||
					vm.chkUpdateTwo() ||
					vm.chkUpdateThree() ||
					vm.chkUpdateFour() ||
					vm.chkUpdateFive() ||
					vm.chkUpdateSix() ||
					vm.chkUpdateSeven()
				) {
					requiredIndicators.setRequired("gradeMetricsNotes", true);
				}
			} else {
				$(".adjustedGrossTotal").addClass("hidden");
			}
		});

		//} //end pkg.isAtStep()

		// TODO: Uncomment
		// if (form.attachmentCount < 1) {
		// 	var selectedExperience = vm.chkHealthCare();
		// 	throw new Error(
		// 		"You must attach proof of student's selected experience: " +
		// 			selectedExperience,
		// 	);
		// }

		// if (!validateChkOtherBeforeApprove()) {
		//   throw new Error(
		//     "Please select at least one option under 'Other' before approving.",
		//   ); // cancel approval if not valid
		// }

		// if (!validateChkExperienceBeforeApprove()) {
		//   throw new Error(
		//     "Please select at least one option under 'Experience' before approving",
		//   ); // cancel approval if not valid
		// }
	};

	vm.onApprove = function onApprove(form) {
		return true; // TODO: REMOVE
		//  This method is called when the Approve button is clicked and before calling beforeRequired.
		if (pkg.isAtStep("testingCenter")) {
			requiredIndicators.setRequired("attachEssayChk", true);
			requiredIndicators.setRequired("testingCenterSig", true);
		} else if (pkg.isAtStep("nursing") || pkg.isAtStep("End")) {
			requiredIndicators.setRequired("nursingSig", true);
		}
	};

	vm.onDecline = function onDecline(form) {
		//  This method is called when the Decline button is clicked and before calling beforeRequired.
	};

	vm.beforeRequired = function beforeRequired(form) {
		$("[required]").prop("required", false);
		return true;
		//  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
		// Enable native DOM `required` attributes at validation time.
		// This prevents fields from appearing invalid on initial load,
		// while still allowing browser validation during submit.
		requiredIndicators.applyNativeRequiredForValidation();
	};

	vm.afterRequired = function afterRequired(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
		requiredIndicators.clearNativeRequired();
		return true;
		//Collecting number of attachments from start step just so we can ensure that testingCenter has attached something
		// TODO: Uncomment
		// if (pkg.isAtStep("Start")) {
		// 	const inititalNumberAttachments = form.attachmentCount;
		// 	// console.log("Initial Number of Attachments: ", inititalNumberAttachments);

		// 	vm.initialNumAttachments(inititalNumberAttachments);
		// }

		if (pkg.isAtStep("testingCenter")) {
			const prevCountAttachments = Number(
				vm.initialNumAttachments() || 0,
			);
			const currentCountAttachments = form.attachmentCount;

			// console.log("Number Attachments from START: ", prevCountAttachments);
			// console.log("CURRENT NUMBER attachments (including from start): ", currentCountAttachments);

			/*
                    IF Current Number <= Previous Count, that means that they have not added any attachments to the form, and, therefore, the system must prevent them
                    from approving the form to the following step
                */
			if (
				currentCountAttachments <= prevCountAttachments ||
				currentCountAttachments < 2
			) {
				notify(
					"error",
					"You must attach the student's essay and the signed paper..",
				);
				return false;
			} else {
				return true;
			}

			// if(form.attachmentCount < 1){
			//   notify('error',"You must attach the student's essay.");
			//   return false
			// }else{
			//   return true
			// }
		}
	};

	vm.onOptOut = function onOptOut(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	vm.onESignSubmit = function onESignSubmit(form) {
		//  This method is called after the required inputs on the form have been confirmed to have values.
	};

	function makeRadioGroupReadOnly(groupName) {
		const radios = $(`input[name="${groupName}"]`);

		radios.prop("disabled", true).attr("aria-disabled", "true");

		// Optional visual styling
		radios.css({
			opacity: "0.6",
			cursor: "not-allowed",
		});
	}

	function enableRadioGroup(groupName) {
		const radios = $(`input[name="${groupName}"]`);

		radios.prop("disabled", false).attr("aria-disabled", "false");

		// Reset optional styling
		radios.css({
			opacity: "1",
			cursor: "auto",
		});
	}

	function handleUpdateShowHide(newValue) {
		if (vm.chkHesiScoreOverride()) {
			$(".overrideHesi").removeClass("hidden");
		} else {
			$(".overrideHesi").addClass("hidden");
		}

		if (vm.chkPointsExpOverride()) {
			$(".prevOther").removeClass("hidden");
		} else {
			$(".prevOther").addClass("hidden");
		}

		if (vm.chkPointsOtherOverride()) {
			$(".prevExperience").removeClass("hidden");
		} else {
			$(".prevExperience").addClass("hidden");
		}
	}

	function viewGradeMetricsUpdateFields(newValue) {
		if (vm.chkUpdateOne()) {
			//addClass("hidden")   removeClass("hidden")
			$(".newRowOne").removeClass("hidden");
			$(".oldRowOne").addClass("hidden");
		}

		if (vm.chkUpdateTwo()) {
			$(".newRowTwo").removeClass("hidden");
			$(".oldRowTwo").addClass("hidden");
		}

		if (vm.chkUpdateThree()) {
			$(".newRowThree").removeClass("hidden");
			$(".oldRowThree").addClass("hidden");
		}

		if (vm.chkUpdateFour()) {
			$(".newRowFour").removeClass("hidden");
			$(".oldRowFour").addClass("hidden");
		}

		if (vm.chkUpdateFive()) {
			$(".newRowFive").removeClass("hidden");
			$(".oldRowFive").addClass("hidden");
		}

		if (vm.chkUpdateSix()) {
			$(".newRowSix").removeClass("hidden");
			$(".oldRowSix").addClass("hidden");
		}

		if (vm.chkUpdateSeven()) {
			$(".newRowSeven").removeClass("hidden");
			$(".oldRowSeven").addClass("hidden");
		}

		if (
			vm.chkHesiScoreOverride() ||
			vm.chkPointsExpOverride() ||
			vm.chkPointsOtherOverride() ||
			vm.chkUpdateOne() ||
			vm.chkUpdateTwo() ||
			vm.chkUpdateThree() ||
			vm.chkUpdateFour() ||
			vm.chkUpdateFive() ||
			vm.chkUpdateSix() ||
			vm.chkUpdateSeven()
		) {
			$(".adjustedGrandTotal").removeClass("hidden");
		}
	}

	function checkContentFields(newValue) {
		if (vm.chkHesiScoreOverride()) {
			if (vm.newScoreMathHesi() != null) {
				vm.hesiMathScore(vm.newScoreMathHesi());
				vm.hesiMathPoints(vm.newPointsMathHesi());
			} else {
				vm.hesiMathScore(vm.scoreMathHesi());
				vm.hesiMathPoints(vm.pointsMathHesi());
			}

			if (vm.newScoreReadingHesi() != null) {
				vm.hesiReadingScore(vm.newScoreReadingHesi());
				vm.hesiReadingPoints(vm.newPointsReadingHesi());
			} else {
				vm.hesiReadingScore(vm.scoreReadingHesi());
				vm.hesiReadingPoints(vm.pointsReadingHesi());
			}

			vm.hesiTotal(vm.newHesiScore());
		} else {
			vm.hesiMathScore(vm.scoreMathHesi());
			vm.hesiMathPoints(vm.pointsMathHesi());
			vm.hesiReadingScore(vm.scoreReadingHesi());
			vm.hesiReadingPoints(vm.pointsReadingHesi());

			vm.hesiTotal(vm.totalHesiScore());
		}

		if (vm.chkPointsOtherOverride()) {
			vm.otherTotalPoints(vm.newPointsOther());
		} else {
			vm.otherTotalPoints(vm.pointsOther());
		}

		vm.essayTotalPoints(vm.totalEssayPoints());

		if (vm.chkUpdateOne()) {
			let newTextOne = vm.newTextOne();
			if (newTextOne == "BIO 1570") {
				vm.bio1570Grade(vm.newGradeTextOne());
			} else {
				vm.bio1570Grade("N/A");
			}

			if (newTextOne == "BIO 2710") {
				vm.bio2710Grade(vm.newGradeTextOne());
			} else {
				vm.bio2710Grade("N/A");
			}
		} else {
			let textOne = vm.textOne();
			if (textOne == "BIO 1570") {
				vm.bio1570Grade(vm.gradeTextOne());
			} else {
				vm.bio1570Grade("N/A");
			}

			if (textOne == "BIO 2710") {
				vm.bio2710Grade(vm.gradeTextOne());
			} else {
				vm.bio2710Grade("N/A");
			}
		}

		if (vm.chkUpdateTwo()) {
			vm.bio2630Grade(vm.newGradeTextTwo());
		} else {
			vm.bio2630Grade(vm.gradeTextTwo());
		}

		if (vm.chkUpdateThree()) {
			vm.bio2640Grade(vm.newGradeTextThree());
		} else {
			vm.bio2640Grade(vm.gradeTextThree());
		}

		if (vm.chkUpdateFour()) {
			vm.eng1510Grade(vm.newGradeTextFour());
		} else {
			vm.eng1510Grade(vm.gradeTextFour());
		}

		if (vm.chkUpdateFive()) {
			let newTextFive = vm.newTextFive();
			if (newTextFive == "ENG 1520") {
				vm.eng1520Grade(vm.newGradeTextFive());
			} else {
				vm.eng1520Grade("N/A");
			}

			if (newTextFive == "ENG 2200") {
				vm.eng2200Grade(vm.newGradeTextFive());
			} else {
				vm.eng2200Grade("N/A");
			}
		} else {
			let textFive = vm.textFive();
			if (textFive == "ENG 1520") {
				vm.eng1520Grade(vm.gradeTextFive());
			} else {
				vm.eng1520Grade("N/A");
			}

			if (textFive == "ENG 2200") {
				vm.eng2200Grade(vm.gradeTextFive());
			} else {
				vm.eng2200Grade("N/A");
			}
		}

		if (vm.chkUpdateSix()) {
			vm.psy2510Grade(vm.newGradeTextSix());
		} else {
			vm.psy2510Grade(vm.gradeTextSix());
		}

		if (vm.chkUpdateSeven()) {
			vm.fineArtHumGrade(vm.newGradeTextSeven());
		} else {
			vm.fineArtHumGrade(vm.gradeTextSeven());
		}

		if (
			vm.chkUpdateOne() ||
			vm.chkUpdateTwo() ||
			vm.chkUpdateThree() ||
			vm.chkUpdateFour() ||
			vm.chkUpdateFive() ||
			vm.chkUpdateSix() ||
			vm.chkUpdateSeven()
		) {
			vm.gradeMetricsTotalPoints(vm.newGradeMetricsTotal());
		} else {
			vm.gradeMetricsTotalPoints(vm.gradeMetrics());
		}

		//Get the selected value from Experience
		const selectedExperience = $(
			'input[name="chkHealthCare"]:checked',
		).val();
		vm.selectedExperience(selectedExperience);

		if (vm.chkPointsExpOverride()) {
			vm.experienceTotalPoints(vm.newTotalPointsExperience());
		} else {
			vm.experienceTotalPoints(vm.totalPointsExperience());
		}

		if (
			vm.chkHesiScoreOverride() ||
			vm.chkPointsExpOverride() ||
			vm.chkPointsOtherOverride() ||
			vm.chkUpdateOne() ||
			vm.chkUpdateTwo() ||
			vm.chkUpdateThree() ||
			vm.chkUpdateFour() ||
			vm.chkUpdateFive() ||
			vm.chkUpdateSix() ||
			vm.chkUpdateSeven()
		) {
			vm.grandTotalPoints(vm.adjustedGrandTotal());
		} else {
			vm.grandTotalPoints(vm.totalPoints());
		}
	}

	$(document).on("change", 'input[name="chkHealthCare"]', function () {
		let maxPoints = 0;
		const selected = $(this).val();

		if (selected.length) {
			maxPoints = pointsFromExperience(selected);
		}

		//let newSelection = vm.chkPointsExpOverride();
		if (vm.chkPointsExpOverride()) {
			vm.newTotalPointsExperience(maxPoints);
		} else {
			vm.totalPointsExperience(maxPoints);
		}
	});

	//Helper functions

	// ============================= TRANSFORM DATE FORMAT TO MM/DD/YYYY =============================================
	function transformDateValue(dateString) {
		if (!dateString) return "00/00/0000";

		var match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (!match) {
			return "00/00/0000";
		}

		var year = match[1],
			month = match[2],
			day = match[3];

		return month + "/" + day + "/" + year;
	}

	// ============================= GENERATE FORM ID =============================================

	function generateFormID() {
		const characters =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let id = "";

		for (let i = 0; i < 10; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length);
			id += characters[randomIndex];
		}

		return id;
	}

	// ============================= END GENERATE FORM ID =========================================

	// ===================== GET ACADEMIC YEAR FROM CURRENT DATE ==================================

	function getAcademicYear() {
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth(); // January is 0, December is 11

		// Academic year starts in August (month 7)
		if (month >= 7) {
			// August or later
			return `${year}-${String(year + 1).slice(-2)}`;
		} else {
			// Before August
			return `${year - 1}-${String(year).slice(-2)}`;
		}
	}
	// =================== END GET ACADEMIC YEAR FROM CURRENT DATE ================================

	// ============================= VALIDATE CHECKBOXES UNDER "OTHER" SECTION =============================================
	function validateChkOtherBeforeApprove() {
		const atLeastOneChecked =
			$("input[type=checkbox][id^='chkOther']:checked").length > 0;

		if (!atLeastOneChecked) {
			alert(
				"Please select at least one option under 'Other' before approving.",
			);
			return false; // prevent approval logic
		}

		return true; // proceed with approval
	}
	// ============================= END VALIDATE CHECKBOXES UNDER "OTHER" SECTION =============================================

	// ============================= VALIDATE CHECKBOXES UNDER "EXPERIENCE" SECTION =============================================
	function validateChkExperienceBeforeApprove() {
		const atLeastOneChecked =
			$("input[type=checkbox][id^='chkExp']:checked").length > 0;

		if (!atLeastOneChecked) {
			alert(
				"Please select at least one option under 'Experience' before approving.",
			);
			$("input[type=checkbox][id^='chkExp']").addClass("highlight-error");
			return false;
		}

		$("input[type=checkbox][id^='chkExp']").removeClass("highlight-error");
		return true;
	}
	// ============================= END VALIDATE CHECKBOXES UNDER "EXPERIENCE" SECTION =============================================

	return vm;
});
