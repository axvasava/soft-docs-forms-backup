define([
    'jquery',
    'knockout',
    'vmBase',
    'integration',
    'notify',
    'user',
    'package',
    'https://cdn.datatables.net/2.0.1/js/dataTables.min.js',  // DataTables
    'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js',
    'template/dynamicSort', //REG Transcript Dashboard
    'template/configuration', //REG Transcript Dashboard
    'jquery-ui', //REG Transcript Dashboard
    'jquery.tablesorter.min.js' //REG Transcript Dashboard
], function viewmodel($, ko, vm, integration, notify, user, pkg, DataTable) {
    let table;

    /*
        REG Transcript Request Dashboard Uses the following files:
                index.html
                styles.css
                viewmodel.js
    
        REG Transcript Database Uses the following files:
            index.html
            viewmodel.js
            autosize.min.js
            bootstrap.min.css
            css.css
            configuration.js
            dynamicSort.js
            jquery-ui.min.css
            jquery.maskedinput.js
            jquery.tablesorter.min.js
            jquery.tablesorter.widgets.js
            loading.css
            theme.default.css
    */
   
    vm.onLoad = function onLoad(source, inputValues) {
        // This function is called when the viewmodel is loaded
        
        $('#refreshBtn').click(); //REG Transcript Dashboard
    };
    
    vm.setDefaults = function setDefaults(source, inputValues) {
        // Set default values for the viewmodel
        //disableActionBar();
    };

    vm.afterLoad = function afterLoad() {
        // This function is called after the viewmodel is loaded and the page has fully loaded
        
        integration.all('Dashboard_Transcript_Request', {

        }).then(function (data) {
            console.log('table', data);
            // Check if data is valid
            
            if (data && data.length > 0) {
            
            //This creates the search row at the top of the dashboard
            const $filterRow = $('#myTable thead tr.filters').empty();
            $('#myTable thead tr:first th').each(function () {
              $filterRow.append('<th></th>');
            });
            
            
          //Initialize DataTable
                table = $('#myTable').DataTable({
                    
                    data: data,
                    columns: [
                        
                        { title: 'Document Link', data: 'url', render: function (data, type, row, meta) {
                            if (type === 'display') {data = '<a href="' + data + '" target="_blank" class="doc-button">View Document</a>';}
                            
                              return data;
                            }
                        },
                        { title: 'Document Type', data: 'DocumentType' },
                        { title: 'Document Date', data: 'DocumentDate' },
                        { title: 'Student ID', data: 'StudentID' },
                        { title: 'Student Name', data: 'StudentName' },
                        { title: 'NIS Student Name', data: 'NISStudentName' },
                        { title: 'Academic Year', data: 'AcademicYear' },
                        { title: 'Review Status', data: 'ReviewStatus' },
                        
                    ],
                    
                    //"pageLength": -1, // # of Entries per page (-1 will show all)
                    //"lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]], // Options for # Entries Dropdown
                    lengthChange: false,
                    info: false,
                    searching: true, //enable searching, but hide the global box by removing 'f' from
                    dom: 't', //only show the table; no filter box, no length, no info, no paging
                    orderCellsTop: true,
                    paging: false,
                    responsive: true,

                    initComplete: function () {
                        const api = this.api();
                    
                        // Scope strictly to the original header inside this table container
                        const $container = $(api.table().container());
                        const $thead = $container.find('thead');
                        const $filterCells = $thead.find('tr.filters th');
                    
                        api.columns().every(function (colIdx) {
                          const title = $(this.header()).text().trim();
                    
                          // Example: skip filter for first column (links)
                          if (colIdx === 0) { $filterCells.eq(colIdx).empty(); return; }
                    
                          //This is the single text box on each column
                          $filterCells.eq(colIdx).html(
                            '<input type="text" style="width:100%; box-sizing:border-box; color:black">'
                          );
                    
                          $filterCells.eq(colIdx).find('input')
                            .off('keyup change')
                            .on('keyup change', function () {
                              api.column(colIdx).search(this.value, false, true).draw();
                            });
                        });
                      }

    

                });
               
               //This code will collapse the table
               $('.header').click(function(){
                  $(this).toggleClass('expand').nextUntil('tr.header').slideToggle(100);
                });
                
                const renderStats = () => {
                  if (!$('#docStats').length) return; // safety: target must exist
                
                  // Use filtered rows
                  const rowsIdx = table.rows({ search: 'applied' }).indexes();
                
                  // Documents = # filtered rows
                  const documents = rowsIdx.length;
                
                  // Students = distinct StudentID among filtered rows
                  const docTypes = new Set();
                  rowsIdx.each((rowIdx) => {
                    const d = table.row(rowIdx).data();
                    if (d && d.DocumentType != null && d.DocumentType !== '') {
                      docTypes.add(String(d.DocumentType));
                    }
                  });
                
                  $('#docStats').text(`Students: ${docTypes.size} | Documents: ${documents} | `);
                };
                
                // Bind AFTER table is created so we don’t miss 'init'
                table.on('init.dt draw.dt search.dt', renderStats);
                
                // Call once in case init already ran before we attached handlers
                renderStats();

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
            // Set the search bar value to ""
            //table.search('').draw();
            table.draw();
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
    
    // Used for Widening Columns { title: 'Employee Type' + nbsp(40), data: 'EmployeeType'}
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
   
   
    
    /****************** REG TRANSCRIPT DASHBOARD *******************
    ***************************************************************/
    require(['jquery.tablesorter.widgets.js']);
    window.parent.$('.hsplitter, .bottom_panel').hide();
    window.parent.$('.top_panel').height('100%');    
    
    var contentData = [];
    
    var tableShow = ['REG Transcripts A-E', 'REG Transcripts F-J', 'REG Transcripts K-O', 'REG Transcripts P-T', 'REG Transcripts U-Z' ];
    var displayTable = [];

    
    // Refresh Button - call integration
    $('#refreshBtn').click(function () {

        // Get tables showing and mark as true
        var $rows = $('#tableCanvas').children('.tablesorter');
        displayTable = [];
        $.each($rows, function (i, row) {
            displayTable.push($(row).css('display') === 'table' ? true : false);
        });

        // clear table
        clearTable();
        
        // show loading spinner
        $('.loading').show();
    
        integration.all('Dashboard_SS_Transcript').then(function(contentData) {
            //now that the documents have been modified with the appropriate indicators from the view, call the splitAndDraw function to build table
            splitAndDraw(contentData);
        });
    });

    function clearTable() {
        // Clear Table
        var $table = $('#tableCanvas');
        $table.empty();

        // Clear full stats
        $('#fullStats').empty();
        
        //wipe documents stored in config object
        documentConfig.forEach(function (configObj) {
            configObj.documents = [];
        });        

    }
    
    function pushDocument(config, doc) {
       config.documents.push(doc);
    }

    function splitAndDraw(documents) {
        
        clearTable();

        // loop through entire integration result
        documents.forEach(function (doc, index) {
            
            // loop through the configuration js array
            documentConfig.forEach(function(configObj) {
                //push documents into the appropriate container (by doc type);
                if(configObj.docTypeArray.includes(doc.DocumentType) === true){
                    // pushDocument(configObj, doc);
                    
                     if(doc.StudentLName.match(/^[A-E]{1}/)){
                             if(configObj.title ===  'REG Transcripts A-E'){
                                 configObj.documents.push(doc);             
                             }
                      }
                     else if(doc.StudentLName.match(/^[F-J]{1}/)){
                             if(configObj.title ===  'REG Transcripts F-J'){
                                 configObj.documents.push(doc);             
                             }
                      }
                      else if(doc.StudentLName.match(/^[K-O]{1}/)){
                             if(configObj.title ===  'REG Transcripts K-O'){
                                 configObj.documents.push(doc);             
                             }
                      } 
                      else if(doc.StudentLName.match(/^[P-T]{1}/)){
                             if(configObj.title ===  'REG Transcripts P-T'){
                                 configObj.documents.push(doc);             
                             }
                      } 
                     else if(doc.StudentLName.match(/^[U-Z]{1}/)){
                             if(configObj.title ===  'REG Transcripts U-Z'){
                                 configObj.documents.push(doc);             
                             }
                      }      
                    else {
                        pushDocument(configObj, doc);
                    }                    
                }
            });
        });



        documentConfig.forEach(function (configObj, index) {
            drawTable(configObj, index);
        });

        buildFullStats(documents);
        $('.loading').hide();
        
    }

    function drawTable(config, index) {

        let note = config.title || '';

        // get rid of index parameter.
        if (displayTable[index]) {
            tableShow.push(note);
        }

        var $table = $('#tableCanvas');
        var stats = {
            tableName: note.replace(/ /g, ''),
            studentCountLbl: 'students:',
            studentCount: 0,
            documentCountLbl: 'Documents:',
            documentCount: 0,
        };

        // Populate Table
       var $theader = $('<thead>');
        var $theaderRow = $('<tr>');

        config.columns.forEach(function (column) {
            $theaderRow.append($('<th>').text(column.name));
        });

        if (config.extendedColumns) {
            config.extendedColumns.forEach(function (column) {
                $theaderRow.append($('<th>').text(column.name));
            });
        }

        $theader.append($theaderRow);

        // Body
        var $tbody = $('<tbody>');
        var $tbodyRow;

        // loop through data
        config.documents.forEach(function (doc) {
            $tbodyRow = $('<tr>');

            //let contentUrl = doc.url;
            
            config.columns.forEach(function (column) {
                $tbodyRow.append(
                    $('<td>')
                        .html(column.formatOutput(doc))
                        //.click(function () { window.open(contentUrl); })
                        //.addClass('section')
                );
            });
            
            if (config.extendedColumns) {
                config.extendedColumns.forEach(function (column) {
                    $tbodyRow.append(
                        $('<td>')
                            .html(column.formatOutput(doc))
                            //.click(function () { window.open(contentUrl); })
                            //.addClass('section')
                    );
                });
            }

            $tbody.append($tbodyRow);

        });
        // count documents
        stats.documentCount = config.documents.length;
        stats.studentCount = new Set(config.documents.map( doc => doc.StudentLookup)).size;


        // Build Stat Row *****************************************************************
        var $statRow = $('<div class="row">')
            .data('statNote', note)
            .addClass('section');
        $statRow.append(
            $('<div class="col-xs-6 note">')
                .text(note)
                .click(function () {
                    $(this).parent().next().toggle(0, function () {
                        if (tableShow.indexOf(note) >= 0) {
                            // remove note from tableShow array
                            tableShow = $.grep(tableShow, function (value) {
                                return value != note;
                            });
                        }
                        else {
                            tableShow.push(note); // add note to tableShow array
                        }
                    });
                })
        );
        $statRow.append(
            $('<div class="col-xs-5 stats">')
                .html(
                    `${stats.studentCountLbl} <span id="${stats.tableName}studentCount"><strong>${stats.studentCount}</strong></span> | 
                     ${stats.documentCountLbl} <span id="${stats.tableName}DocumentCount"><strong>${stats.documentCount}</strong></span> | 
                    `)
                .click(function () {
                    $(this).parent().next().toggle(0, function () {
                        if (tableShow.indexOf(note) >= 0) {
                            // remove note from tableShow array
                            tableShow = $.grep(tableShow, function (value) {
                                return value != note;
                            });
                        }
                        else {
                            tableShow.push(note); // add note to tableShow array
                        }
                    });
                })
        );

        $table.append($statRow);

        if (config.exportable) {
            generateCSVButton($statRow, note);
        }

        // Build Table ********************************************************************
        var showTable = ((tableShow.indexOf(note) >= 0) ? true : false);

        $table.append($('<table>', {
            id: 'dataTable',
            style: 'margin-bottom:30px;',
            "data-note": note,
        })
            .append($theader)
            .append($tbody));

        $('#dataTable ').tablesorter({
            widgets: ['filter', 'stickyHeaders'],
            widgetOptions: {
                // include child row content while filtering, if true
                filter_childRows: true
            },
            theme: 'default',
        });

        $('[data-note="' + note + '"]').toggle(showTable);

        // fires after a filter event ends on a table column, allowing dynamic updating of statistics
        $('#dataTable[data-note="' + note + '"]').on('filterEnd sortEnd', function () {
            let note = this.getAttribute('data-note');

            // strip spaces to use as an ID prefix for student and document counts
            note = note.replace(/ /g, '');

            let visibleRows = $(this).find('tr').not('.filtered, .tablesorter-headerRow, .tablesorter-ignoreRow');

            let studentNumbers = visibleRows.toArray().map(function (row) {
                let td = $(row).find('td').get(3) // UPDATE this to the column number for Student ID or student Number. First column is 0
                return $(td).html()
            });

            // a Set cannot have multiple entries - this serves as an easy filter to count students.
            let studentCount = (new Set(studentNumbers)).size;

            $(`#${note}studentCount strong`).html(studentCount);
            $(`#${note}DocumentCount strong`).html(visibleRows.length);
        });
    }

    function generateCSVButton(parent, note) {

        let filename = note.replace(/ /g, '');
        filename = filename.replace(/\//g, '');
        parent.append(
            $(
                $('<div class="col-xs-1">').html(
                    '<a id="' + filename + 'TBL">' +
                    '<button type="button" class="btn btn-sm btn-warning">Export</button>' +
                    '</a>'
                )
            )
        );

        $('#' + filename + 'TBL').hover(function () {
            var dataString = '';
            $('table[data-note="' + note + '"]').find('tr:not([class]):not([style])').each(function (i, el) {
                $(el).find('td').each(function (y, txt) {
                    dataString += $(txt).text();
                    dataString += '\t';
                });
                dataString += '\r\n';
            });
            $(this).attr('href', 'data:application/octet-stream,' + encodeURIComponent(dataString))
                .attr('download', filename + 'TXT.txt'); // attr download sets the file name
        });
    }

    function buildFullStats(data) {
        var stats = {
            studentCountLbl: 'Students:',
            studentCount: 0,
            documentCountLbl: 'Documents:',
            documentCount: 0,
        };

        // sort data by ID
        data.sort(dynamicSortMultiple('DocumentDate'));
        
        stats.documentCount = data.length;
        stats.studentCount = new Set(data.map( doc => doc.StudentLookup)).size;

        $('#fullStats')
            .css('font-weight', 'bold')
            .text(
                'Total: ' +
                stats.studentCountLbl + ' ' +
                stats.studentCount + ' | ' +
                stats.documentCountLbl + ' ' +
                stats.documentCount
            );
    }
    
    function removeDuplicateIDs(array) {
      return array.filter((a, b) => array.indexOf(a) === b);
    }


    //Possibly needed? To make case specific checks on documents
    checkForStatusUpdates = function(doc){
        //using the doc object we are able to pass in parameters to an integration source
    };
    
    
    /*    END                         */
    

   
    return vm;
});




