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
        
        integration.all('SS_Get_Approved_SS_Forms_Info', {
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
                        { title: 'Student Name', data: 'StudentName' },
                        { title: 'Student ID', data: 'StudentID' },                        
                        { title: 'Form Type', data: 'SSFormType' },
                        { title: 'Approved By', data: 'ApprovedBy' },

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
