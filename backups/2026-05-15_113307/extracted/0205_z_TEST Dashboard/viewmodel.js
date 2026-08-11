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
    'jquery.tablesorter.min.js'
], function viewmodel($, ko, vm, user, integration, notify) {

    require(['jquery.tablesorter.widgets.js']);
    window.parent.$('.hsplitter, .bottom_panel').hide();
    window.parent.$('.top_panel').height('100%');

    var contentData = [];

    var tableShow = ['New/Needs AP Review', 'Ready to Voucher', 'Needs Controller Review', 'Hold'];   // default table to show on initial load. must match the config title.
    var displayTable = [];

    // convert tableShow with replaceSpecialCharacters
    let tempTableShow = [];
    tableShow.forEach(tableTitle => {
        tempTableShow.push(replaceSpecialCharacters(tableTitle));
    });
    tableShow = tempTableShow;

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

        integration.all(integrationName).then(function (contentData) {
            //now that the documents have been modified with the appropriate indicators from the view, call the splitAndDraw function to build table

            console.log('contentData');

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

        let mappedDocuments = documents.reduce(function (mappedDocs, doc) {
            let found = mappedDocs.find(function (mappedDoc) {
                return mappedDoc.DocumentID == doc.DocumentID;
            });

            if (found) {
                if (doc.InvoiceNumber && !found.InvoiceNumbers.includes(doc.InvoiceNumber)) {
                    found.InvoiceNumbers.push(doc.InvoiceNumber);
                }
            } else {
                let newDoc = Object.assign({}, doc);
                newDoc.InvoiceNumbers = doc.InvoiceNumber ? [doc.InvoiceNumber] : [];
                mappedDocs.push(newDoc);
            }

            return mappedDocs;
        }, []);

        mappedDocuments.forEach(function (doc) {
            doc.InvoiceNumber = doc.InvoiceNumbers.join(', ');
            delete doc.InvoiceNumbers;
        });

        documents = mappedDocuments;

        // loop through entire integration result
        documents.forEach(function (doc, index) {
            documentConfig.forEach(function (configObj) {
                if (configObj.title == 'New/Needs AP Review' && doc.APCheckStatus == 'New') {
                    pushDocument(configObj, doc);
                }
                else if (configObj.title == 'Needs Controller Review' && doc.APCheckStatus == 'Needs Controller Approval') {
                    pushDocument(configObj, doc);
                }
                else if (configObj.title == 'Ready to Voucher' && doc.APCheckStatus == 'Ready to Voucher') {
                    pushDocument(configObj, doc);
                }
                else if (configObj.title == 'Hold' && doc.APCheckStatus == 'Hold') {
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
        console.log('VendorNumber sample:', config.documents[0]?.VendorNumber);
        console.log('Keys sample:', Object.keys(config.documents[0] || {}));

        stats.documentCount = config.documents.length;
        const vendorValues = config.documents
            .map(d => String(d.VendorLookup || '').trim())
            .filter(Boolean);

        stats.vendorCount = new Set(vendorValues).size;


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
                let td = $(row).find('td').get(1); // UPDATE this to the column number for Student ID or Vendor Number. First column is 0
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
        const vendorValues = data
            .map(d => String(d.VendorLookup || '').trim())
            .filter(Boolean);

        stats.vendorCount = new Set(vendorValues).size;

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
