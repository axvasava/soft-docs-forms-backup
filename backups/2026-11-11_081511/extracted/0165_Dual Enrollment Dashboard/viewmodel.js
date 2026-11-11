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
        disableActionBar();
    };

    vm.afterLoad = function afterLoad() {
        // This function is called after the viewmodel is loaded and the page has fully loaded
        
        integration.all('Dashboard_Dual_Enrollment', {
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
                    "order": [
                            [1, 'desc'], // Export Date column
                            [2, 'asc']   // Student Name column
                        ],
                    initComplete: function () {
                        let api = this.api();
                    
                        // Create second header row for filters
                        $('#myTable thead').append('<tr class="filter-row"></tr>');
                        let filterRow = $('#myTable thead tr.filter-row');
                    
                        api.columns().every(function () {
                            let column = this;
                    
                            // Create <th> with input
                            let th = $('<th></th>');
                            let input = $('<input type="text" placeholder="Search">')
                                .css({
                                    width: '100%',
                                    padding: '4px 6px',
                                    'box-sizing': 'border-box'
                                })
                                .on('keyup change', function () {
                                    column.search(this.value).draw();
                                });
                    
                            th.append(input);
                            filterRow.append(th);
                        });
                    },
                    columns: [
                                            {
                        title: 'Form Link',
                        data: 'url',
                        render: function (data, type, row, meta) {
                            if (type === 'display') {
                              return `
                                    <button 
                                        class="view-doc-btn btn btn-info btn-sm""
                                        onclick="window.open('${data}', '_blank')"
                                    >
                                        View Document
                                    </button>
                                `;
                    
                            }
                            return data; // for sorting / export
                        }

                        },
                         {
                            title: 'Export Date',
                            data: 'SortDate',
                            render: function (data, type, row) {
                                if (type === 'display') {
                                    return row.DocumentDate;   // pretty format
                                }
                                return data ? new Date(data).getTime() : 0;  // numeric timestamp for sorting
                            }
                        },
                        { title: 'Student Name', data: 'StudentName', width: "120px"},
                        { title: 'Student ID', data: 'StudentID' },
                        { title: 'Institution', data: 'Institution', width: "100px" },
                        { title: 'Academic Year', data: 'AcademicYear' },
                        { title: 'Sponsorship Type', data: 'SponsorshipType' },
                        { title: 'Program', data: 'earlySchool', width: "90px"},
                        
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
    
    // Create a string of &nbsp;
    function nbsp(num) {
        let nbspStr = ''; // Initialize the string
        for (let i = 0; i < num; i++) {
            nbspStr += '&nbsp;'; // Append &nbsp;
        }
        //console.log(nbspStr);   
        return nbspStr; // Return the generated string
    }
    
    // Disables Attachments, Download, and Print Buttons in the Action Bar
    function disableActionBar(){
        setTimeout(function(){   
            window.parent.$(".description:contains('Attachments')").parent().prop('disabled', true).addClass('disabled');
            window.parent.$(".description:contains('Download')").parent().prop('disabled', true).addClass('disabled');
            window.parent.$(".description:contains('Print')").parent().prop('disabled', true).addClass('disabled');
        }, 100);    
    }
    
    return vm;
});
