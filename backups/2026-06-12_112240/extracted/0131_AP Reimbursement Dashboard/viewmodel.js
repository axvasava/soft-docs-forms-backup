/* jshint maxerr: 1000 */
define([
    'jquery',
    'knockout',
    'vmBase',
    'user',
    'integration',
    'notify',
    'template/dynamicSort',
    'template/configuration',
    'jquery-ui',
    'jquery.tablesorter.min.js',
    'template/floating-controls'
], function viewmodel($, ko, vm, user, integration, notify) {

    require(['jquery.tablesorter.widgets.js']);
    window.parent.$('.hsplitter, .bottom_panel').hide();
    window.parent.$('.top_panel').height('100%');

    var contentData = [];

    var tableShow = ['Travel Rationale', 'Travel Reimbursements', 'Mileage and Expense'];   // default table to show on initial load. must match the config title.
    var displayTable = [];

    // convert tableShow with replaceSpecialCharacters
    let tempTableShow = [];
    tableShow.forEach(tableTitle => {
        tempTableShow.push(replaceSpecialCharacters(tableTitle));
    });
    tableShow = tempTableShow;

    // Refresh Button - call integration
    $('#refreshBtn').click(function () {
        setFloatingButtonsLoadingState(true);
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

        integration.all(integrationName).then(function (contentData) {
            //now that the documents have been modified with the appropriate indicators from the view, call the splitAndDraw function to build table

            console.log('contentData');

            splitAndDraw(contentData);
        }).catch(function (err) {
            console.log(err);
        })
            .finally(function () {
                $('.loading').hide();
                setFloatingButtonsLoadingState(false);
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


        /* START MULTI-VALUE CODE *********************************/
        // Comment out below if multivalues are not needed
        /* let mappedDocuments = documents.reduce((mappedDocs, doc, index, documents) => {
             
             let found = mappedDocs.find(mappedDoc => {
                 return mappedDoc.DocumentID == doc.DocumentID;
             });
             
             // Handling Multi-value key fields (if-applicable)
              if(found) {
                  found.InvoiceNum.push(doc.InvoiceNum);
                  //found.VoucherNum.push(doc.VoucherNum);
                  //found.PONum.push(doc.PONum);
                  
                  found.InvoiceNum = [...new Set(found.InvoiceNum)];
                  //found.VoucherNum = [...new Set(found.VoucherNum)];
                  //found.PONum = [...new Set(found.PONum)];
                  
              } else {
                  doc.InvoiceNum = [doc.InvoiceNum];
                  //doc.VoucherNum = [doc.VoucherNum];
                  //doc.PONum = [doc.PONum];
                  mappedDocs.push(doc);
             }
             
             return mappedDocs;
         }, []);
         
         documentConfig[0].documents = mappedDocuments;
         /* END MULTI-VALUE CODE ***********************/


        // loop through entire integration result
        documents.forEach(function (doc, index) {

            // loop through the configuration js array
            documentConfig.forEach(function (configObj) {
                //push documents into the appropriate container (by doc type);
                if (configObj.docTypeArray.includes(doc.DocumentType) === true) {
                    pushDocument(configObj, doc);
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
        let noteID = replaceSpecialCharacters(note);

        // get rid of index parameter.
        if (displayTable[index]) {
            tableShow.push(noteID);
        }

        var $table = $('#tableCanvas');
        var stats = {
            tableName: note.replace(/ /g, ''),
            vendorCountLbl: 'Vendors:',
            vendorCount: 0,
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
        stats.vendorCount = new Set(config.documents.map(doc => doc.VendorLookup)).size;


        // Build Stat Row *****************************************************************
        var $statRow = $('<div class="row">')
            .data('statNote', noteID)
            .addClass('section');
        $statRow.append(
            $('<div class="col-xs-6 note">')
                .text(note)
                .click(function () {
                    $(this).parent().next().toggle(0, function () {
                        if (tableShow.indexOf(noteID) >= 0) {
                            // remove note from tableShow array
                            tableShow = $.grep(tableShow, function (value) {
                                return value != noteID;
                            });
                        }
                        else {
                            tableShow.push(noteID); // add note to tableShow array
                        }
                    });
                })
        );
        $statRow.append(
            $('<div class="col-xs-5 stats">')
                .html(
                    `${stats.vendorCountLbl} <span id="${stats.tableName}vendorCount"><strong>${stats.vendorCount}</strong></span> | 
                     ${stats.documentCountLbl} <span id="${stats.tableName}DocumentCount"><strong>${stats.documentCount}</strong></span> | 
                    `)
                .click(function () {
                    $(this).parent().next().toggle(0, function () {
                        if (tableShow.indexOf(noteID) >= 0) {
                            // remove note from tableShow array
                            tableShow = $.grep(tableShow, function (value) {
                                return value != noteID;
                            });
                        }
                        else {
                            tableShow.push(noteID); // add note to tableShow array
                        }
                    });

                })
        );

        $table.append($statRow);

        if (config.exportable) {
            generateCSVButton($statRow, noteID);
        }

        // Build Table ********************************************************************
        var showTable = ((tableShow.indexOf(noteID) >= 0) ? true : false);

        $table.append($('<table>', {
            id: 'dataTable',
            style: 'margin-bottom:30px;',
            "data-note": noteID,
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

        $('[data-note="' + noteID + '"]').toggle(showTable);

        // fires after a filter event ends on a table column, allowing dynamic updating of statistics
        $('#dataTable[data-note="' + noteID + '"]').on('filterEnd sortEnd', function () {
            let note = this.getAttribute('data-note');

            // strip spaces to use as an ID prefix for student and document counts
            //note = note.replace(/ /g, '');

            let visibleRows = $(this).find('tr').not('.filtered, .tablesorter-headerRow, .tablesorter-ignoreRow');

            let vendorNumbers = visibleRows.toArray().map(function (row) {
                let td = $(row).find('td').get(3); // UPDATE this to the column number for Student ID or Vendor Number. First column is 0
                return $(td).html();
            });

            // a Set cannot have multiple entries - this serves as an easy filter to count students.
            let vendorCount = (new Set(vendorNumbers)).size;

            $(`#${note}vendorCount strong`).html(vendorCount);
            $(`#${note}DocumentCount strong`).html(visibleRows.length);
        });
    }

    function generateCSVButton(parent, note) {

        let filename = replaceSpecialCharacters(note);

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
            vendorCountLbl: 'Students:',
            vendorCount: 0,
            documentCountLbl: 'Documents:',
            documentCount: 0,
        };

        // sort data by ID
        data.sort(dynamicSortMultiple('DocumentDate'));

        stats.documentCount = data.length;
        stats.vendorCount = new Set(data.map(doc => doc.VendorLookup)).size;

        $('#fullStats')
            .css('font-weight', 'bold')
            .text(
                'Total: ' +
                stats.vendorCountLbl + ' ' +
                stats.vendorCount + ' | ' +
                stats.documentCountLbl + ' ' +
                stats.documentCount
            );
    }


    vm.onLoad = function onLoad(source, inputValues) {
        ensureFloatingControls();
        $('#refreshBtn').hide();
        $('#refreshBtn').click();
    };

    vm.setDefaults = function setDefaults(source, inputValues) {
    };

    vm.afterLoad = function afterLoad() {
    };

    function removeDuplicateIDs(array) {
        return array.filter((a, b) => array.indexOf(a) === b);
    }


    //Possibly needed? To make case specific checks on documents
    checkForStatusUpdates = function (doc) {
        //using the doc object we are able to pass in parameters to an integration source
    };

    function replaceSpecialCharacters(inputString) {
        // Replace all special characters (except letters and numbers) with an underscore
        return inputString.replace(/[^a-zA-Z0-9]/g, '_');
    }

    return vm;

});
