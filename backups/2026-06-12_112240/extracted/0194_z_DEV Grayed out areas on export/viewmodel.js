define(['jquery',
    'knockout',
    'vmBase',
    'integration',
    'notify',
    'user',
    'template/autosize.min',
    'template/jquery.maskedinput',
    './liveViewModel.js',
    'package',
    'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js'
], function viewmodel($, ko, vm, integration, notify, user, autosize, maskedinput, liveVM, pkg) {

    $('.maskphone').mask('(999)999-9999? ext:9999');
    $('.maskzip').mask('99999?-9999');
    $('.maskssn').mask('999-99-9999');

//=========== ADD OBSERVABLE ARRAYS ===========
   
    vm.addObservableArray('personsPositionsList');
    vm.addObservableArray('dates')
    vm.addObservableArray('filteredDates')
    
//========= END ADD OBSERVABLE ARRAYS =========

//=========== HIDE SECTIONS ON FORM ORIGINATION ===========

        $('.onBehalf').hide();
        $('.self').hide();
        $('.supSig').hide();
        $('.bugManSig').hide();
        $('.ecMemSig').hide();
        $('.over5000').hide()
        $('.developer').hide();

//========= END HIDE SECTIONS ON FORM ORIGINATION =========

// //========= GLOBAL VAR =====================
//         var currentYear = new Date().getFullYear();

// //========= END GLOBAL VAR =================
    vm.onLoad = function onLoad(source, inputValues) {

    };
    
    vm.setDefaults = function setDefaults(source, inputValues) {
        
        
        
        
        // integration.first("FS_Get_Mileage_Rate_by_Year", {mileageYear: currentYear}).then(data =>{ 
        //     console.log("Mileage Rate By Year:", data)
        //     vm.mileageRate(data.Rate);
            
        // });
        // integration.first("FS_Get_Mileage_Rate_by_Year", {mileageYear: 2025}).then(data => vm.mileageRate(data.Rate))
        // integration.first("FS_Get_Per_Diem_Rates_by_Year", {fiscYear: '2025-2026'}).then(data => {
        //     const { breakfast, lunch, dinner } = data
        //     vm.breakfastRate(breakfast)
        //     vm.lunchRate(lunch)
        //     vm.dinnerRate(dinner)
        // })
        
        //Collecting meal rates dynamically based on the FY
         ko.computed(() => {
          (vm.expenseRow() || []).forEach(row => {
            if (row.__fyWire) return;
        
            function updatePerDiemForRow() {
              const fy = getRowFiscalYear(row);
              if (!fy) {
                //  clear rates or just log
                vm.breakfastRate(undefined); vm.lunchRate(undefined); vm.dinnerRate(undefined);
                return;
              }
              fetchMealPerDiemByFiscalYear(fy)
                .then(data => {
                  if (!data) return;
                  const { breakfast, lunch, dinner } = data;
                  console.log(`PerDiem payload for FY ${fy}:`, data);
                  console.log(`FY ${fy} - Breakfast: ${breakfast}`);
                  console.log(`FY ${fy} - Lunch: ${lunch}`);
                  console.log(`FY ${fy} - Dinner: ${dinner}`);
                  
                  vm.breakfastRate(breakfast);
                  vm.lunchRate(lunch);
                  vm.dinnerRate(dinner);
                })
                .catch(err => {
                  console.error(`PerDiem fetch failed for FY ${fy}`, err);
                  notify('error', `Could not load per-diem for ${fy}`);
                });
            }
        
            // Subscribe to BOTH fields (either may be used by the row)
            if (row.mealDate && row.mealDate.subscribe) {
              row.mealDate.subscribe(updatePerDiemForRow);
            }
            if (row.mealDateChosen && row.mealDateChosen.subscribe) {
              row.mealDateChosen.subscribe(updatePerDiemForRow);
            }
        
            // Initial pass (handles pre-filled values)
            updatePerDiemForRow();
        
            row.__fyWire = true;
          });
        });


        
        if (pkg.isAtStep("Start")) vm.start("Y")
        else vm.start("N")

        vm.selfOrElse.subscribe((newValue) => {
            vm.employeeSearch('');
            vm.employeeName('');
            vm.employeeID('');
            vm.campus('');
            vm.department('');
            if (newValue) {
                if (newValue == 'Yes') {
                    $('.onBehalf').show();
                    $('.other').show();
                    $('.yourself').hide();
                    $('.self').hide();
                } else if (newValue == 'No') {
                    $('.onBehalf').hide();
                    $('.other').hide();
                    $('.yourself').show(); 
                    $('.self').show();
                    //vm.employeeName(user.DisplayName);
                    vm.employeeID(user.ErpId);
                } 
            } else {
                $('.onBehalf').hide();
                $('.yourself').hide();
                $('.other').hide();
                $('.self').hide();
            }
        });


        vm.employeeID.subscribe((newValue) => {
            if (newValue) {
                runEmployeeEthosCall(newValue);                 
            } else {
                vm.employeeName('');
                vm.campus('');
                vm.department('');
            }
         
        });
        
          //IF USER OPENS UP THE FORM IN DRAFTS, WILL STILL BE ABLE TO CLICK ON JOB TITLE AND POPULATE INFO
        if(user.isInDrafts && vm.selfOrElse() == 'No'){
            console.log("User is in Drafts", user.isInDrafts);
            runEmployeeEthosCall(vm.employeeID());  
        }
        
        if(!pkg.isAtStep('Start')) {
            makeAutoCompleteReadOnly('jobTitle');
        }
        
        vm.employeeSearch.subscribe(newVal => {
            if (newVal && newVal !== '') {
                if (newVal.length < 7) {
                    vm.employeeSearch(newVal.padStart(7, "0"));
                }
            }
        });


        vm.supervisorGUID.subscribe(function(NewValue) {
            if (NewValue != 'No Supervisor GUID') { 
                integration.all('Web_Ethos_Get_Person_by_GUID', {
		            personGUID: vm.supervisorGUID()
	            }).then(function (supervisorData) {
	            
	            console.log('supervisorData', supervisorData);
	            vm.supervisorSelect(getPreferredName(supervisorData.names));
	            vm.supervisorEmail(getPrimaryEmail(supervisorData.emails));
            	});
            }
            else{
                vm.supervisorSelect('No Supervisor Found');
                vm.supervisorEmail('No Supervisor Found');
            }
        });


//================== SHOW SIGNATURE ROWS AT APPROPRIATE STEPS =======================

        if (pkg.isAtStep('ConditionalActorEmployee') || pkg.isAtStep('Start')) {
            $('.self').show();
        }
        
        if (pkg.isAtStep('ConditionalActorSupervisor') || pkg.isAtStep('WFFSBudgetManager') || pkg.isAtStep('ConditionalActorExecutiveCouncilMember') || pkg.isAtStep('EndDeclined') || pkg.isAtStep('EndDeclined')) {
            $('.supSig').show();
            $('.self').show();
        }

        if (pkg.isAtStep('WFFSBudgetManager') || (pkg.isAtStep('ConditionalActorExecutiveCouncilMember') && vm.grantRelated() == 'Yes') || (pkg.isAtStep('EndDeclined') && vm.grantRelated() == 'Yes') || (pkg.isAtStep('EndDeclined') && vm.grantRelated() == 'Yes')) {
            $('.bugManSig').show();
        }        

        if (pkg.isAtStep('ConditionalActorExecutiveCouncilMember') || (pkg.isAtStep('EndDeclined') && vm.over5000() == 'Yes') || (pkg.isAtStep('EndDeclined') && vm.over5000() == 'Yes')) {
            $('.ecMemSig').show();
        }           

//================ END SHOW SIGNATURE ROWS AT APPROPRIATE STEPS =====================

//================== SIGNATURES =======================
        vm.employeeSign.subscribe((newValue) => {
            if (newValue) {
                vm.employeeSignDate(Extenders.utils.formatDate(new Date()));
            } else {
                vm.employeeSignDate('');
            }
        });
        
        vm.supDeanSign.subscribe((newValue) => {
            if (newValue) {
                vm.supDeanSignDate(Extenders.utils.formatDate(new Date()));
            } else {
                vm.supDeanSignDate('');
            }
        });

        vm.budManSign.subscribe((newValue) => {
            if (newValue) {
                vm.budManSignDate(Extenders.utils.formatDate(new Date()));
            } else {
                vm.budManSignDate('');
            }
        });
        
        
        vm.execCounSign.subscribe((newValue) => {
            if (newValue) {
                vm.execCounSignDate(Extenders.utils.formatDate(new Date()));
            } else {
                vm.execCounSignDate('');
            }
        });
//================ END SIGNATURES =====================


//=========== GET MILEAGE YEAR FROM TO DATE ===========
        vm.toDate.subscribe(newValue => {
            if (newValue) {
                let yearArray = newValue.split('/');
                vm.mileageYear(yearArray[2]);
            } else {
                vm.mileageYear('');
            }
        });
//========= END GET MILEAGE YEAR FROM TO DATE =========

//=========== GET MILEAGE RATE FROM MILEAGE YEAR ===========
        vm.mileageYear.subscribe(newValue => {
            if (newValue) {
                integration.first('FS_Get_Mileage_Rate_by_Year', {
                    mileageYear: newValue
                }).then(rateData => {
                    vm.mileageRate(rateData.Rate);
                    console.log("RATE DATA", rateData)
                });
            } else {
                vm.mileageRate('');
            }
        });
//========= END GET MILEAGE RATE FROM MILEAGE YEAR =========


//=========== CHECK IF TOTAL EXPENSES ARE OVER 5000 ===========
        // vm.expenseTotal.subscribe(newValue => {
        //     if (newValue) {
        //         if (newValue > 5000) {
        //             vm.over5000('Yes');
        //         } else {
        //             vm.over5000('No');
        //         }
        //     } else {
        //         vm.over5000('No');
        //     }
        // });

//======= END CHECK IF TOTAL EXPENSES ARE OVER 5000 ===========

        if (user.isInLibrary) {

            vm.over5000('No');

        } else {


        }
    };

//============ AFTERLOAD ================
    vm.afterLoad = function afterLoad() {
        
         setExportMode(pkg.isAtStep('End'));

        if (!pkg.isAtStep("Start")) {
            $("#supervisorSelect").css("pointer-events", "none");
            $("#supervisorSelect").prop("readonly", true);
            $("#supervisorSelect").css("background-color", "#e9ecef")
            
            $("#secondApproverSearch").css("pointer-events", "none");
            $("#secondApproverSearch").prop("readonly", true);
            $("#secondApproverSearch").css("background-color", "#e9ecef")
            
        }



//============ CHECK VALID GL ACCOUNT CODE IN DYNAMIC LIST ===================
        ko.computed(() => {
            vm.accountRow.forEach(rowData => {
                validateAccountNumberInDynamicList(rowData, 'glNum', 'glDescription');
            });
        });
//===========END CHECK VALID GL ACCOUNT CODE IN DYNAMIC LIST =================
       
        ko.computed(() => {
            vm.expenseRow.forEach((rowData, id) => {
                if (rowData.expenseDescription()) {
                    if (rowData.expenseDescription() == 'Personal Car Miles') {
                        rowData.mileageRateExp(vm.mileageRate());
                        rowData.estimatedCost(rowData.estimatedCostMiles());
                    } else if (rowData.expenseDescription() == 'Meals (including tips)') {
                        let totalEstimate;
                        if (rowData.estimatedCost()) {
                            const rowTotal = parseInt(rowData.estimatedCost())
                            if (rowData.mealSelect()) {
                                if (rowData.mealSelect() == 'Breakfast') totalEstimate = parseInt(vm.breakfastRate())
                                if (rowData.mealSelect() == 'Lunch') totalEstimate = parseInt(vm.lunchRate())
                                if (rowData.mealSelect() == 'Dinner') totalEstimate = parseInt(vm.dinnerRate())
                            }
                            if ( rowTotal > totalEstimate ) {
                               
                                notify('error', `Estimate for this row of meals should not exceed the per diem rate of ${totalEstimate}`)
                                rowData.estimatedCost(0.00)
                            }
                        }
                        
                        
                        const $mealDateSelect = $(`#expenseRow__${id}__mealDate`); // target the meals dropdown on each row
                        // if there's no date specified, initialize dropdown with options
                        if (pkg.isAtStep("Start") && !rowData.mealDate()) {
                            $mealDateSelect.empty()
                            $mealDateSelect.append($('<option></option>'))
                            vm.dates.forEach(date => {
                                $mealDateSelect.append($('<option>', {
                                  value: date,
                                  text: date
                                }));
                            })
                        } else if (pkg.isAtStep("Start") && rowData.mealDate()) rowData.mealDateChosen(rowData.mealDate())
                    } else {
                        rowData.numberOfMiles(0);
                        // rowData.mealDateChosen(rowData.mealDate())
                    }
                }
            });
        });
        
        ko.computed(() => {
            if (pkg.isAtStep("Start") && vm.fromDate() && vm.toDate()) {
                vm.dates([])
                const mealDates = generateDateRange(vm.fromDate(), vm.toDate()) 
                vm.dates(mealDates)
            }
        })
        
        ko.computed(() => {
            if (vm.expenseTotal()) {
                vm.expenseTotal() > 5000 ? vm.over5000('Yes') : vm.over5000('No')
            }
        })
        
        ko.computed(() => {
            if (vm.over5000()) vm.over5000() === 'Yes' ? $('.over5000').show() : $('.over5000').hide()
        })


                
//============ UPDATING MEAL OPTIONS BASED ON DATE SELECTED ===================   
        // Wire per-row listeners once and keep options in sync
        ko.computed(() => {
          (vm.expenseRow() || []).forEach((row, idx) => {
            if (row.__mealsWired) return; // ensure we subscribe just once per row
        
            if (row.mealDate && row.mealDate.subscribe) {
              row.mealDate.subscribe(() => refreshAllMealOptions());
            }
            if (row.mealSelect && row.mealSelect.subscribe) {
              row.mealSelect.subscribe(() => refreshAllMealOptions());
            }
        
            row.__mealsWired = true;
          });
        
          // Initial sync whenever rows list changes
          refreshAllMealOptions();
        });
        
        
        $('#addExpense').on('click', function () {
          // Let dynamicList add the DOM, then refresh
          setTimeout(refreshAllMealOptions, 0);
        });
        $(document).on('click', '.remove-expense-row', function () {
          setTimeout(refreshAllMealOptions, 0);
        });
        
        
        
    ko.computed(() => {
        let total = 0
        vm.expenseRow.forEach(row => {
            if (row.estimatedCost()) {
                console.log("estimatedCost raw:", row.estimatedCost());
                let formatted = formatAsDollar(row.estimatedCost());
                console.log("FORMATTED NUMBER", formatted);
                // const rawNumber = parseInt(formatted.replace(",", ''))  --> When we use parseInt, we round the numbers so instead of parseInt, we need to use parseFloat
                const rawNumber = parseFloat(formatted.replace(/,/g, ''));
                total += rawNumber;
                row.estimatedCost(formatted);
            }
        })

        let formattedTotal = formatAsDollar(total)
        vm.expenseTotal(formattedTotal)
    })

    ko.computed(() => {
        let total = 0
        vm.accountRow.forEach(row => {
            if (row.glAmount()) {
                
                let formatted = formatAsDollar(row.glAmount());
                console.log("FORMATTED NUMBER GL", formatted);
                // const rawNumber = parseInt(formatted.replace(",", ''))  --> When we use parseInt, we round the numbers so instead of parseInt, we need to use parseFloat
                const rawNumber = parseFloat(formatted.replace(/,/g, ''));
                total += rawNumber;
                row.glAmount(formatted);
            }
        })

        let formattedTotal = formatAsDollar(total)
        vm.accountTotal(formattedTotal)
    })

        liveVM.afterLoadEditsForVM();


        autosize($('textarea'));
        
       
    };
//========= END AFTERLOAD ================

    vm.onSubmit = function onSubmit(form) {
        if (vm.expenseTotal() !== vm.accountTotal()) throw new Error("Please ensure your total amounts for Expenses and Account match")
    };

    vm.onApprove = function onApprove(form) {
        //  This method is called when the Approve button is clicked and before calling beforeRequired.
        vm.accountRow.forEach(row => {
            if (!row.glNum()) throw new Error("Please supply a GL number before approval")
        })
        vm.approvalStatus('Approved')
    };

    vm.onDecline = function onDecline(form) {
        //  This method is called when the Decline button is clicked and before calling beforeRequired.
        vm.approvalStatus('Declined')
    };

    vm.beforeRequired = function beforeRequired(form) {
        //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.
        
    };

    vm.afterRequired = function afterRequired(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.
        
        Extenders.utils.verifyDynamicListRequired(vm, ['accountRow']);
        if (form.attachmentCount < 1) {
            throw new Error("Please ensure you have all the necessary documents attached before submitting");
        } else {
            return true;
        }
    };

     vm.onOptOut = function onOptOut(form) {
       //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    vm.onESignSubmit = function onESignSubmit(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };

//=================== HELPER FUNCTIONS =======================


// ===== LOGIC TO OBTAIN FISCAL YEAR BASED ON MEAL DATE SELECTION ========
// FY: July 1 – June 30
function getFiscalYearLabel(dateStr) {
  const [mm, dd, yyyy] = String(dateStr || '').split('/').map(v => parseInt(v, 10));
  if (!yyyy || !mm) return '';
  const fyStart = (mm >= 7) ? yyyy : (yyyy - 1);
  const fyEnd   = fyStart + 1;
  return fyStart + '-' + fyEnd; // "2024-2025"
}

// Prefer mealDateChosen, fall back to mealDate
function getRowFiscalYear(row) {
  const dateStr =
    (row.mealDateChosen && row.mealDateChosen()) ||
    (row.mealDate && row.mealDate()) ||
    '';
  return getFiscalYearLabel(dateStr);
}

// Cached API call
const perDiemCache = new Map();
function fetchMealPerDiemByFiscalYear(fiscYear) {
  if (!fiscYear) return Promise.resolve(null);
  if (perDiemCache.has(fiscYear)) return Promise.resolve(perDiemCache.get(fiscYear));
  return integration.first("FS_Get_Per_Diem_Rates_by_Year", { fiscYear })
    .then(data => {
      perDiemCache.set(fiscYear, data);
      return data;
    });
}
// ===== ENDLOGIC TO OBTAIN FISCAL YEAR BASED ON MEAL DATE SELECTION ========

// function formatAsDollar(value, locale = 'en-US'){
//           // normalize input
//           const n = Number(String(value).replace(/,/g, '').trim());
//           if (!Number.isFinite(n)) return '';
        
//           // truncate toward zero at 2 decimals (no rounding)
//         //   const truncated = Math.trunc(n * 100) / 100;
//           const truncated = Math.round(n * 100) / 100;

        
//           // add separators and always show 2 decimals
//           return truncated.toLocaleString(locale, {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//           });

// }
 function formatAsDollar(value, options = {}) {
        const {
            decimals = 2,     // number of decimal places to keep
            showDollar = false // whether to prefix with "$"
        } = options;
    
        if (value === undefined || value === null || value === "") return (showDollar ? "$0.00" : "0.00");
    
        // Convert to string and keep "-" if negative
        value = value.toString();
    
        // Extract negative flag and clean value
        const isNegative = value.includes("-");
        value = value.replace(/[^0-9.]/g, ""); // remove everything except digits and dot
    
        // Split into whole and decimal parts
        let parts = value.split(".");
    
        // Format whole number with commas
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
        // Ensure decimal part exists and is limited to the chosen number of decimals
        if (parts[1]) {
            parts[1] = parts[1].substring(0, decimals).padEnd(decimals, "0");
        } else {
            parts[1] = "0".repeat(decimals);
        }
    
        let formatted = parts.join(".");
    
        // Add negative sign if needed
        if (isNegative && parts[0] !== "") {
            formatted = "-" + formatted;
        }
    
        // Add dollar sign if requested
        if (showDollar) {
            formatted = `$${formatted}`;
        }
    
        return formatted;
    }


// ===== LOGIC TO REFRESH MEAL OPTIONS ========
// Meals-per-date helpers
function normalizeDateStr(s) { return String(s || '').trim(); }

function buildUsedMealsMap() {
  // Map(dateString => Set of meals used on that date)
  const map = new Map();
  (vm.expenseRow() || []).forEach(row => {
    const d = normalizeDateStr(row.mealDate && row.mealDate());
    const m = row.mealSelect && row.mealSelect();
    if (!d || !m) return;
    if (!map.has(d)) map.set(d, new Set());
    map.get(d).add(m);
  });
  return map;
}

function refreshAllMealOptions() {
  const usedMap = buildUsedMealsMap();

  (vm.expenseRow() || []).forEach((row, idx) => {
    const date = normalizeDateStr(row.mealDate && row.mealDate());
    const $select = $(`#expenseRow__${idx}__mealSelect`);
    if (!$select.length) return;

    const current = row.mealSelect && row.mealSelect();

    // Reset options first
    $select.find('option').prop('disabled', false).show();

    if (!date) return; // no date → no restriction

    // Meals already used on this date
    const used = new Set(usedMap.get(date) || []);
    // Do not block this row from keeping its own current selection
    if (current) used.delete(current);

    // Hide/disable used options
    used.forEach(val => {
      $select.find(`option[value="${val}"]`).prop('disabled', true).hide();
    });

     // 'used' ALREADY EXCLUDES THIS ROW'S CURRENT SELECTION (see used.delete(current) above)
    if (date && current && used.has(current)) {
      row.mealSelect('');
      notify('error', `“${current}” is already selected for ${date} in another row.`);
    }
  });
}

// ===== END LOGIC TO REFRESH MEAL OPTIONS ========

$('#employeeSearchButton').click(function () { //Update time Entries
if (vm.employeeSearch()) {
    vm.employeeID(vm.employeeSearch());
} else {
    notify('error', 'You must enter an Employee ID to search.');
        vm.employeeID('');
}
});

function validateAccountNumberInDynamicList(dynamicListRow, accountNumber, accountNumberDesc) {

// if a value exists in the account field ...
if (dynamicListRow[accountNumber]()) {
    // ... AND the description is empty ...
    if (!dynamicListRow[accountNumberDesc]()) {
        // ... then check the integration for validating the account number AND populate the account number desc
        integration.all('Web_Ethos_Validate_Accounting_Strings_by_GLAccountNumber',{
            GLAccountNumber: dynamicListRow[accountNumber]()
        }).then(function (validateAcctString) {
            console.log('validateAcctString',validateAcctString);
            dynamicListRow[accountNumberDesc](validateAcctString['description']);
            //dynamicListRow[accountNumber].readOnly = true;
            notify('success','Account number valid');
        }).catch(function (error) {
            //console.error('An error occurred:', error.message);
            dynamicListRow[accountNumber](undefined);
            dynamicListRow[accountNumberDesc](undefined);
            notify('error','Account number not valid');
        });
    }
    else {
        
    }
}
else {
    // if account number was removed...
    // ... then clear out the desc
    dynamicListRow[accountNumberDesc](undefined);
}

}

function runEmployeeEthosCall(idSearch) {
   console.log('running function') 
    // GET PERSON FROM COLLEAGUE ID
    integration.first('Web_Ethos_Get_Persons_by_Colleague_ID',{
        personID: idSearch
    }).then(function(personResults){
        
        if (personResults) {
    
            console.log('Person Results', personResults);
            vm.employeeName(getPreferredFirstName(personResults.names) + ' ' + getPreferredLastName(personResults.names));
            vm.employeeEmail(getPrimaryEmail(personResults.emails))
           
            console.log(personResults.id)
           
              integration.all('Web_Ethos_Get_active_institution_jobs_by_Person_GUID',{
                  personGUID: personResults.id
              }).then(function (allInstJob) {
                  
                  console.log('allInstJob',allInstJob);   
            

                            // GET PERSON POSITIONS
                            // loop through allInstJob
                            // Create an array to store promises
                            const promises = [];
                            vm.personsPositionsList([]); // clear out local array 
                            
                            //Get all Employee positions

                            allInstJob.forEach(function (job) {
                                // Extract the supervisor ID
                                
                              
                                //const supervisorID = job.supervisors[0].supervisor.id;
                                  let supervisorID = 'No Supervisor GUID' ;
                                  if (job.supervisors){
                                     if (job.supervisors[0].supervisor.id) {
                                         supervisorID = job.supervisors[0].supervisor.id;
                                     }
                                  }
                            
                                // Push promises into the array
                                const positionPromise = integration.first('Web_Ethos_Get_institution_positions_by_Position_GUID', {
                                    positionGUID: job.position.id,
       
                                });
                            
                                promises.push(positionPromise.then(function (personPositions) {
                                    return integration.first('Web_Ethos_Get_Campus_Sites_by_GUID', {
                                        campusGUID: personPositions.campus.id
                                    }).then(function (personPosCampus) {
                                        // Return the combined data including supervisor ID
                                        return { personPositions, personPosCampus, supervisorID };
                                    });
                                }));
                            });

                            
                            // Wait for all promises to resolve
                            Promise.all(promises)
                                .then(function (results) {
                                    // Handle the combined data here
                                  //console.log('Person-Position-Campus promise results', results);
                                    // You can access individual results like results[0].personPositions, results[0].personPosCampus, etc.
                                    $('.loading').hide();
                                    //console.log('results',results)
                                    results.forEach(function (resultData) {
                                        
                                        vm.personsPositionsList.push({
                                            positionTitle: resultData.personPositions.title,
                                            campusTitle: resultData.personPosCampus.title,
                                            positionDepartmentGUID: resultData.personPositions.departments[0].id,
                                            supervisorGUID: resultData.supervisorID
                                        });
                                        
                                    });

                                    integration.first('Web_Ethos_Get_Employment_Department_by_GUID', {
                                        deptGUID: vm.personsPositionsList()[0].positionDepartmentGUID
                                    }).then((deptResults) => {
                                        //console.log('Dept Results: ', deptResults);
                                        vm.department(deptResults.title);
                                    });                                          
                                    
                                    vm.personsPositionsList.sort(function(a, b) {
                                        // Compare positionTitle
                                        if (a.positionTitle < b.positionTitle) return -1;
                                        if (a.positionTitle > b.positionTitle) return 1;
                                    
                                        // If positionTitles are equal, compare positionCode
                                        if (a.positionCode < b.positionCode) return -1;
                                        if (a.positionCode > b.positionCode) return 1;
                                    
                                        // If positionCodes are also equal, compare campusTitle
                                        if (a.campusTitle < b.campusTitle) return -1;
                                        if (a.campusTitle > b.campusTitle) return 1;
                                    
                                        // Objects are considered equal in all criteria
                                        return 0;
                                    });
                            
                                    
                                    console.log('vm.personsPositionsList()',vm.personsPositionsList());
                                    
                                })
                                .catch(function (error) {
                                    // Handle errors here
                                    console.error('Error occurred:', error);
                                });
                                    
                        });  
        
        }
        else {
            notify('error','Person not found');
            vm.employeeName('');
            vm.campus('');
            vm.department('');
            $('.loading').hide();
        }
    });
}

//function to sort through all names and return the preferred name
function getPreferredName(myArray) {
  // Loop through the array
  for (let i = 0; i < myArray.length; i++) {
    // Check if the current object's preference is "preferred"
    if (myArray[i].preference === "preferred") {
      // Return the fullName attribute value from the matching object
      return myArray[i].fullName;
    }
  }
  // Return null if no match is found
  return null;
}

//function to sort through all names and return the preferred name
function getPreferredLastName(myArray) {
  // Loop through the array
  for (let i = 0; i < myArray.length; i++) {
    // Check if the current object's preference is "preferred"
    if (myArray[i].preference === "preferred") {
      // Return the fullName attribute value from the matching object
      return myArray[i].lastName;
    }
  }
  // Return null if no match is found
  return null;
}

//function to sort through all names and return the preferred name
function getPreferredFirstName(myArray) {
  // Loop through the array
  for (let i = 0; i < myArray.length; i++) {
    // Check if the current object's preference is "preferred"
    if (myArray[i].preference === "preferred") {
      // Return the fullName attribute value from the matching object
      return myArray[i].firstName;
    }
  }
  // Return null if no match is found
  return null;
}

//function to sort through all names and return the pimary email address
function getPrimaryEmail(myArray) {
  // Loop through the array
  for (let i = 0; i < myArray.length; i++) {
    // Check if the current object's preference is "preferred"
    if (myArray[i].preference === "primary") {
      // Return the fullName attribute value from the matching object
      return myArray[i].address;
    }
  }
  // Return null if no match is found
  return null;
}

function generateDateRange(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const dateArray = [];

  // Normalize time to midnight
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
    const formatted = formatDateMMDDYYYY(dt);
    dateArray.push(formatted);
  }

  return dateArray;
}

function formatDateMMDDYYYY(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatWithCommas(number) {
    return number.toLocaleString('en-US');
}

// function makeAutoCompleteReadOnly(elementID) {
//     $(`#${elementID}`)
//         .prop('readonly', true)
//         .attr({
//             tabindex: '-1',
//             'aria-disabled': 'true'
//         })
//         .css({
//             'pointer-events': 'none',
//             'background-color': '#f5f5f5',
//             'color': '#555'
//         });
// }

function makeAutoCompleteReadOnly(elementId) {
  const $el = $(`#${elementId}`);
  $el
    .prop('readonly', true)
    .attr({ tabindex: '-1', 'aria-disabled': 'true' })
    .addClass('is-autocomplete-readonly');
}

function setExportMode(isEnabled) {
  $('body').toggleClass('is-export-mode', Boolean(isEnabled));
}

    return vm;
});
