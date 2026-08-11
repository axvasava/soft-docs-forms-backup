define([
    'jquery',
    'knockout',
    'vmBase',
    'integration',
    'notify',
    'user',
    'package',
    'https://cdn.datatables.net/2.0.1/js/dataTables.min.js',  // DataTables
    'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js'
], function viewmodel($, ko, vm, integration, notify, user, pkg, DataTable) {
    let table;

    vm.onLoad = function onLoad(source, inputValues) {
        // This function is called when the viewmodel is loaded
    };
    
    vm.setDefaults = function setDefaults(source, inputValues) {
        // Set default values for the viewmodel
    };

    vm.afterLoad = function afterLoad() {
        // This function is called after the viewmodel is loaded and the page has fully loaded
        
        integration.all('DEIJ_Get_Basic_Needs_Info', {
            // Any Parameters Here
            // ID: user.ErpId
        }).then(function (data) {
            console.log('table', data);
            // Check if data is valid
            if (data && data.length > 0) {
                // Initialize DataTable
                table = $('#myTable').DataTable({
                    data: data,
                    "pageLength": 25, // # of Entries per page (-1 will show all)
                    "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]], // Options for # Entries Dropdown
                    columns: [
                        { title: 'Submission Date', data: 'SubmissionDate' },
                        { title: 'Preferred Pronouns', data: 'PreferredPronouns' },                        
                        { title: 'Email Contact Method', data: 'EmailContactMethod' },
                        { title: 'Phone Contact Method', data: 'PhoneContactMethod' },
                        { title: 'Meeting Location', data: 'MeetingLocation' },
                        { title: 'Mon Morning Start', data: 'MondayMorningStart' },
                        { title: 'Mon Morning End', data: 'MondayMorningEnd' },
                        { title: 'Mon Afternoon Start', data: 'MondayAfternoonStart' },
                        { title: 'Mon Afternoon End', data: 'MondayAfternoonEnd' },
                        { title: 'Tues Morning Start', data: 'TuesdayMorningStart' },
                        { title: 'Tues Morning End', data: 'TuesdayMorningEnd' },
                        { title: 'Tues Afternoon Start', data: 'TuesdayAfternoonStart' },
                        { title: 'Tues Afternoon End', data: 'TuesdayAfternoonEnd' },
                        { title: 'Wed Morning Start', data: 'WednesdayMorningStart' },
                        { title: 'Wed Morning End', data: 'WednesdayMorningEnd' },
                        { title: 'Wed Afternoon Start', data: 'WednesdayAfternoonStart' },
                        { title: 'Wed Afternoon End', data: 'WednesdayAfternoonEnd' },
                        { title: 'Thur Morning Start', data: 'ThursdayMorningStart' },
                        { title: 'Thur Morning End', data: 'ThursdayMorningEnd' },
                        { title: 'Thur Afternoon Start', data: 'ThursdayAfternoonStart' },
                        { title: 'Thur Afternoon End', data: 'ThursdayAfternoonEnd' },
                        { title: 'Fri Morning Start', data: 'FridayMorningStart' },
                        { title: 'Fri Morning End', data: 'FridayMorningEnd' },
                        { title: 'Fri Afternoon Start', data: 'FridayAfternoonStart' },
                        { title: 'Fri Afternoon End', data: 'FridayAfternoonEnd' },
                        { title: 'How Did You Hear', data: 'HowDidYouHear' },
                        { title: 'Other How Did You Hear', data: 'OtherHowDidYouHear' },
                        { title: 'Currently Enrolled', data: 'CurrentlyEnrolled' },
                        { title: 'Your Enrollment', data: 'YourEnrollment' },
                        { title: 'Completed FAFSA ', data: 'CompletedFAFSA' },
                        { title: 'Currently Working ', data: 'CurrentlyWorking' },
                        { title: 'International Student ', data: 'InternationalStudent' },
                        { title: 'At Least 20 Hours ', data: 'AtLeast20Hours' },
                        { title: 'Perkins Loan', data: 'PerkinsLoanCheck' },
                        { title: 'Usure About Aid', data: 'UnsureAboutAidCheck' },
                        { title: 'Gender', data: 'Gender' },
                        { title: 'Other Gender', data: 'SpecifyOtherGender' },
                        { title: 'Marital Status', data: 'MaritalStatus' },
                        { title: 'Ethnicity ', data: 'Ethnicity' },
                        { title: 'County of Residence ', data: 'CountyOfResidence' },
                        { title: 'Primary Language ', data: 'PrimaryLanguage' },
                        { title: 'Other Primary Language ', data: 'OtherPrimaryLanguage' },
                        { title: 'Food Program', data: 'FoodProgramCheck' },
                        { title: 'Medical Program', data: 'MedicalProgramCheck' },
                        { title: 'Child Daycare Program', data: 'ChildDaycareProgramCheck' },
                        { title: 'Cash Program', data: 'CashProgramCheck' },
                        { title: 'State Emg Rel Program', data: 'StateEmergencyReliefProgramCheck' },
                        { title: 'Veh Repair Program', data: 'VehicleRepairProgramCheck' },
                        { title: 'Applied or Active Case', data: 'AppliedActiveCase' },
                        { title: 'Accomodation Request', data: 'AccomodationRequest' },
                        { title: 'Other Accomodation Request', data: 'OtherAccomodationRequest' },
                        // {
                        //     title: 'Document Link',
                        //     data: 'url',
                        //     render: function (data, type, row, meta) {
                        //           if (type === 'display') {
                        //             data = '<a href="' + data + '" target="_blank">Document Link</a>';
                        //         }
                        //         return data;
                        //     }
                        // },
                        // { // Formatting Dates
                        //     title: 'Document Date', 
                        //     data: 'DocumentDate',
                        //     render: function(data, type, row) {
                        //         if (type === 'display' || type === 'filter') {
                        //             var options = { year: '2-digit', month: '2-digit', day: '2-digit' };
                        //             return new Intl.DateTimeFormat('en-US', options).format(new Date(data));
                        //         }
                        //         return data;
                        //     }
                        // },
                        // { // Formatting Money
                        //     title: 'Amount', 
                        //     data: 'Amount',
                        //     className: 'formatMoney',
                        //     render: function(data, type, row) {
                        //         if (type === 'display' || type === 'filter') {
                        //             return '$' + parseFloat(data).toFixed(2);
                        //         }
                        //         return data;
                        //     }
                        // },
                        // { // Formatting URLs
                        //     title: 'URL',
                        //     data: 'URL',
                        //     render: function (data, type, row, meta) {
                        //           if (type === 'display') {
                        //             data = '<a href="' + data + '" target="_blank">Document Link</a>';
                        //         }
                        //         return data;
                        //     }
                        // },
                    ]
                });
                console.log('DataTable initialized successfully.');
            } else {
                console.error('Data is invalid or empty.');
            }
        }).catch(function (error) {
            console.error('Error fetching or initializing DataTable:', error);
        });
   
    // Add event listener to the download CSV button
    $('#downloadCSV').on('click', function () {
        // Initialize empty CSV string
        var csv = '';

        // Get table headers
        var headers = [];
        $('#myTable thead th').each(function () {
            headers.push($(this).text().trim());
        });
        csv += headers.join(',') + '\n';

        // Get table data
        $('#myTable tbody tr').each(function () {
            var rowData = [];
            $(this).find('td').each(function () {
                rowData.push($(this).text().trim());
            });
            csv += rowData.join(',') + '\n';
        });

        // Create a Blob from the CSV data
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

        // Create a temporary anchor element to trigger the download
        var link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection
            var url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'table_data.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
    
    // Add event listener to the category buttons
        $('#Pending').on('click', function () {
            // Set the search bar value to "Pending"
            table.search('Pending').draw();
        });
        $('#ReadyForPayment').on('click', function () {
            // Set the search bar value to "ReadyForPayment"
            table.search('Ready For Payment').draw();
        });
        $('#ClearFilter').on('click', function () {
            // Set the search bar value to "ReadyForPayment"
            table.search('').draw();
        });
    
    };

    // Add event listener to the download Excel button
    $('#downloadXLS').on('click', function () {
        // Initialize an array to hold the table data
        var data = [];
    
        // Get table headers
        var headers = [];
        $('#myTable thead th').each(function () {
            headers.push($(this).text().trim());
        });
        data.push(headers);
    
        // Get table data
        $('#myTable tbody tr').each(function () {
            var rowData = [];
            $(this).find('td').each(function () {
                rowData.push($(this).text().trim());
            });
            data.push(rowData);
        });
    
        // Create a new workbook and add the data
        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
        // Generate Excel file and trigger download
        XLSX.writeFile(wb, 'data.xlsx');
    });
    
    return vm;
});
