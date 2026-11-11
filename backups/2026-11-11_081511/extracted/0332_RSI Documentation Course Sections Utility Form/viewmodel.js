define([
    'jquery',
    'knockout',
    'vmBase',
    'user',
    'integration',
    'notify',
    'jquery-ui',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/lib/jquery.event.drag-2.3.0.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/slick.core.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/plugins/slick.cellrangedecorator.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/plugins/slick.cellrangeselector.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/plugins/slick.cellselectionmodel.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/slick.formatters.js',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/slick.editors.js',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/slick.grid.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/6pac-slickgrid/2.4.34/slick.dataview.min.js',
], function viewmodel($, ko, vm, user, integration, notify) {

    /*
        NOTE: This utility expects all unique identifiers for the listed tables to be the same. 
        Ideally this would be "id" (case sensitive) to easily play nicely with Slick Grid, because
        SlickGrid requires an "id" on every row. If your identity column is not "id", an "id" 
        property will need to be mapped in the beginning of the drawTable function:
            val.id: val.ID
            val.id: val.pkey
            etc
        The update and delete functions will also need to be modified slightly to account for the
        difference in table identity column specification.

        The line numbers of interest in this template are: 
            id mapping: 435
            update: 86
            delete: 482
    */

    function requiredFieldValidator(value) {
        if (value === null || value === undefined || !value.length) {
            return { valid: false, msg: 'This is a required field' };
        } else {
            return { valid: true, msg: null };
        }
    }

    function comparer(a, b) {
        var x = a[sortcol], y = b[sortcol];
        return (x == y ? 0 : (x > y ? 1 : -1));
    }

    function filter(item, args) {
        let searchString = args.searchString || '';
        searchString = searchString.toUpperCase();
        let searchTerms = searchString.split(' ');

        let matches = [];

        searchTerms.map(term => term.trim()).forEach(term => {
            let returnVal = false;
            if (term) {
                Object.keys(item).forEach(key => {
                    if (!returnVal) {
                        let value = String(item[key]).toUpperCase();
                        returnVal = value.indexOf(term) >= 0;
                    }
                });
            } else {
                returnVal = true;
            }

            matches.push(returnVal);
        });

        let finalMatch = true;

        matches.forEach((match) => {
            finalMatch = finalMatch && match;
        });

        return finalMatch;
    };
    
    function deleteRow(args) {
        if (confirm('Are you sure you want to DELETE?') === true) {
            let item = dataView.getItem(args.row);
            integration.delete(vm.table().integrationCodes.DeleteRow,{
                id: item.id // "id" needs to match your identity column of the table(s)
            }).then(function () {
                dataView.beginUpdate();
                dataView.deleteItem(item.id);
                dataView.endUpdate();
                dataView.refresh();
                
                notify('error','Row Removed');
            }).catch(function (){
                notify('error','Unable to Remove');
            });
        }
    }

    window.parent.$('.hsplitter, .bottom_panel').hide();
    window.parent.$('.top_panel').height('100%');

    // default to 1 header row
    vm.addObservable('headerRows', 1);
    vm.addObservable('showColumnOrder', false);
    vm.addObservable('showAddRow', true);
    vm.addObservable('loading', false);
    vm.addObservable('saving', false);
    vm.addObservable('pagesize');

    var grid;
    var dataView = new Slick.Data.DataView({ inlineFilters: true });
    var searchString = '';

    var RSIDocumentationCourseSectionsDataFields = [
        {
            id: 'originatorErpId',
            name: 'Id',
            field: 'originatorErpId',
            width: 100,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'originatorDisplayName',
            name: 'Name',
            field: 'originatorDisplayName',
            width: 100,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'originatorEmail',
            name: 'Email',
            field: 'originatorEmail',
            width: 100,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'courseSection',
            name: 'Section',
            field: 'courseSection',
            width: 100,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'directInstructionOne',
            name: 'Direct Instruction Q1',
            field: 'directInstructionOne',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'directInstructionTwo',
            name: 'Direct Instruction Q2',
            field: 'directInstructionTwo',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'directInstructionThree',
            name: 'Direct Instruction Q3',
            field: 'directInstructionThree',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'directInstructionFour',
            name: 'Direct Instruction Q4',
            field: 'directInstructionFour',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'directInstructionFive',
            name: 'Direct Instruction Q5',
            field: 'directInstructionFive',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'directInstructionSix',
            name: 'Direct Instruction Q6',
            field: 'directInstructionSix',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'directInstructionSeven',
            name: 'Direct Instruction Q7',
            field: 'directInstructionSeven',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'directInstructionEight',
            name: 'Direct Instruction Q8',
            field: 'directInstructionEight',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'studentWorkFeedbackOne',
            name: 'Student Work Feedback Q1',
            field: 'studentWorkFeedbackOne',
            width: 220,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'studentWorkFeedbackTwo',
            name: 'Student Work Feedback Q2',
            field: 'studentWorkFeedbackTwo',
            width: 220,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'studentWorkFeedbackThree',
            name: 'Student Work Feedback Q3',
            field: 'studentWorkFeedbackThree',
            width: 220,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'studentWorkFeedbackFour',
            name: 'Student Work Feedback Q4',
            field: 'studentWorkFeedbackFour',
            width: 220,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'studentWorkFeedbackFive',
            name: 'Student Work Feedback Q5',
            field: 'studentWorkFeedbackFive',
            width: 220,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'studentWorkFeedbackSix',
            name: 'Student Work Feedback Q6',
            field: 'studentWorkFeedbackSix',
            width: 220,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'courseCommunicationOne',
            name: 'Course Comm Q1',
            field: 'courseCommunicationOne',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'courseCommunicationTwo',
            name: 'Course Comm Q2',
            field: 'courseCommunicationTwo',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'courseCommunicationThree',
            name: 'Course Comm Q3',
            field: 'courseCommunicationThree',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'courseCommunicationFour',
            name: 'Course Comm Q4',
            field: 'courseCommunicationFour',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'courseCommunicationFive',
            name: 'Course Comm Q5',
            field: 'courseCommunicationFive',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'courseCommunicationSix',
            name: 'Course Comm Q6',
            field: 'courseCommunicationSix',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'courseCommunicationSeven',
            name: 'Course Comm Q7',
            field: 'courseCommunicationSeven',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'discussionFacilitationOne',
            name: 'Discuss Facilitation Q1',
            field: 'discussionFacilitationOne',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'discussionFacilitationTwo',
            name: 'Discuss Facilitation Q2',
            field: 'discussionFacilitationTwo',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'discussionFacilitationThree',
            name: 'Discuss Facilitation Q3',
            field: 'discussionFacilitationThree',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'discussionFacilitationFour',
            name: 'Discuss Facilitation Q4',
            field: 'discussionFacilitationFour',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationOne',
            name: 'Proactive Comm Q1',
            field: 'proactiveCommunicationOne',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationTwo',
            name: 'Proactive Comm Q2',
            field: 'proactiveCommunicationTwo',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationThree',
            name: 'Proactive Comm Q3',
            field: 'proactiveCommunicationThree',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationFour',
            name: 'Proactive Comm Q4',
            field: 'proactiveCommunicationFour',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationFive',
            name: 'Proactive Comm Q5',
            field: 'proactiveCommunicationFive',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationSix',
            name: 'Proactive Comm Q6',
            field: 'proactiveCommunicationSix',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationSeven',
            name: 'Proactive Comm Q7',
            field: 'proactiveCommunicationSeven',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationEight',
            name: 'Proactive Comm Q8',
            field: 'proactiveCommunicationEight',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'proactiveCommunicationNine',
            name: 'Proactive Comm Q9',
            field: 'proactiveCommunicationNine',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
    ];
    
    vm.tables = [
        {
            name: 'RSI Documentation Course Sections',
            integrationCodes: {
                GetAll:     'RSIDocumentationCourseSections',
                UpdateFld:  'RSIDocumentationCourseSections',
                DeleteRow:  'RSIDocumentationCourseSections',
                AddRow:     'RSIDocumentationCourseSections',
                Truncate:   'RSIDocumentationCourseSections_Truncate'
            },
            data: RSIDocumentationCourseSectionsDataFields
        }
    ];


    vm.addObservableArray('tabledata');
    vm.addObservable('table');

    vm.addsinglerow = function addsinglerow() {
        if (vm.table().data[0].newValue()) {
            vm.saving(true);
            var integrationRow = {};
            vm.table().data.forEach(function (col) {
                var column = col.field;
                var data = col.newValue() || '';
                integrationRow[column] = data;
            });
            integration.add(vm.table().integrationCodes.AddRow, integrationRow).then(function () {
                drawTable();
                vm.saving(false);
                notify('success', 'The data has been loaded.');
                // vm.showAddRow(false);
                clearInputs();
            }).catch(function (err) {
                vm.saving(false);
                notify('error', 'Unable to save new table data.');
            });
        } else {
            notify('error', 'Please enter a value.');
        }
    };

    // Upload Button
    //  - parse uploaded TXT or CSV
    //  - insert based off of column order listed above
    vm.upload = function () {
        var $file = $("#fileUpload");
        var reader, i, j;
        var fileType = $file.val().toLowerCase().substr($file.val().length - 4);
        var rows, cells;
        var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
        if (regex.test($file.val().toLowerCase())) {
            if (typeof (FileReader) != "undefined") {
                if (confirm('This will delete ALL existing rows and replace them with the uploaded file. Are you sure you want to proceed?') === true) {
                    reader = new FileReader();
                    reader.onload = function (e) {
                        rows = e.target.result.split("\n");

                        // Truncate table first
                        integration.delete(vm.table().integrationCodes.Truncate).then(function () {
                            vm.loading(true);
                            // Clear Table
                            $('#canvas').empty();

                            // if(rows.length > 500) {
                            //     alert('This is a lot of data - please be patient and do not leave the page. This could take a minute.');
                            // }

                            // array build in order to push all integrations into it so we can do a Promise on it later.
                            var dataRowsToInsert = [];
                            for (i = Number(vm.headerRows() || 0); i < rows.length; i++) {

                                cells = [];
                                if (fileType == '.txt') {
                                    cells = rows[i].split('\t');
                                } else {
                                    cells = rows[i].split(',');
                                }
                                if (cells.length > 1) {
                                    // place the Integration into variable 'p'
                                    var integrationRow = {};
                                    vm.table().data.forEach(function (col, index, table) {
                                        var column = col.field;
                                        var data = cells[index];
                                        if (index = table.length - 1) {
                                            data = data.replace(/[\n\r]/g, '');
                                            data = data.replace('null', '');
                                            data = data.replace(/\"/g, '');
                                        }
                                        integrationRow[column] = data;
                                    });
                                    
                                    dataRowsToInsert.push(integrationRow);
                                }

                            }
                            
                            // to allow for large data-sets, break up dataRowsToInsert into batches or run in series
                            var allRequestPromises = [];
                            while(dataRowsToInsert.length > 0) {
                                let batch = dataRowsToInsert.splice(0, 100);
                                let responses = [];
                                
                                var batchPromise = batch.reduce(function(promise, item) {
                                    return promise.then(function(result) {
                                        var accountPromise = integration.add(vm.table().integrationCodes.AddRow, item);
                                        return accountPromise.then(function(response){
                                            responses.push(response);
                                        });
                                    });
                                }, Promise.resolve());
                                
                                allRequestPromises.push(batchPromise);
                            }
                            
                            return Promise.all(allRequestPromises).then(function(response) {
                                notify('success', 'Upload Complete');
                                drawTable();
                                vm.loading(false);
                            });
                            
                        }).catch(function () {
                            notify('error', 'Unable to clear tables table for load.');
                        });
                    };
                    reader.readAsText($("#fileUpload")[0].files[0]);
                }
            } else {
                notify('error', "This browser does not support HTML5.");
            }
        } else {
            notify('error', "Please upload a valid CSV. Ensure your file name does not have versioning such as (1).");
        }
    };

    function clearInputs() {
        vm.table().data.forEach(function (col) {
            col.newValue('');
        });
    }

    function drawTable() {
        vm.loading(true);
        if (grid) {
            grid.destroy();
        }

        integration.all(vm.table().integrationCodes.GetAll).then(function (vals) {

            vals.forEach(val => {
                // SlickGrid requires each row to have an "id" column - use the below to map your identity column ("ID", "pkey", etc) to the "id" property.
                // val.id = val.ID,
                val.Remove = ''
            });
            vm.tabledata(vals);

            if (vals.length === 0) {
                notify('warning', "No table data found.");
            }

            /** begin slick *************************/

            var options = {
                editable: true,
                enableAddRow: false,
                enableCellNavigation: true,
                asyncEditorLoading: false,
                autoEdit: false
            };

            dataView = new Slick.Data.DataView({ inlineFilters: true });
            
            var buttonFormat = function (row, cell, value, columnDef, dataContext) {
                return `<div class="text-center"><a class="remove-link" href="#" id="remove-row-${row}">Delete</a></div>`;    
            }
            let removeButtonColumn = {
                id: 'Remove',
                name: 'Delete',
                field: 'Remove',
                width: 100,
                formatter: buttonFormat
            }
            
            grid = new Slick.Grid('#myGrid', dataView, [removeButtonColumn].concat(vm.table().data), options);

            grid.setSelectionModel(new Slick.CellSelectionModel());

            // grid.onAddNewRow.subscribe(function (e, args) {
            //   var item = args.item;
            //   grid.invalidateRow(data.length);
            //   data.push(item);
            //   grid.updateRowCount();
            //   grid.render();
            // });

            grid.onCellChange.subscribe(function (e, args) {
                let id = args.item.id; // "id" needs to match the identity column of the table
                let field = args.column.field;
                let value = args.item[field];

                integration.update(vm.table().integrationCodes.UpdateFld, {
                    id: id,
                    field: field,
                    value: value
                }).then(function () {
                    notify('success', 'Value Updated');
                }).catch(function (err) {
                    notify('error', 'Unable to update value.');
                });
            });

            grid.onSort.subscribe(function (e, args) {
                sortdir = args.sortAsc ? 1 : -1;
                sortcol = args.sortCol.field;
                // using native sort with comparer
                // preferred method but can be very slow in IE with huge datasets
                dataView.sort(comparer, args.sortAsc);
            });
            
            grid.onClick.subscribe(function(e, args) {
                if(e.target.id.startsWith('remove-row-')) {
                    deleteRow(args);
                }
            });

            // wire up model events to drive the grid
            dataView.onRowCountChanged.subscribe(function (e, args) {
                $('#totalRowCount').html(args.itemCount);
                grid.updateRowCount();
                grid.render();
                $('#currentRowCount').html(args.current);
            });

            dataView.onRowsChanged.subscribe(function (e, args) {
                grid.invalidateRows(args.rows);
                grid.render();
            });

            dataView.onPagingInfoChanged.subscribe(function (e, pagingInfo) {
                var isLastPage = pagingInfo.pageNum == pagingInfo.totalPages - 1;
                var enableAddRow = isLastPage || pagingInfo.pageSize == 0;
                var options = grid.getOptions();

                if (options.enableAddRow != enableAddRow) {
                    grid.setOptions({ enableAddRow: enableAddRow });
                }
            });


            // wire up the search textbox to apply the filter to the model
            $('#search').keyup(function (e) {
                Slick.GlobalEditorLock.cancelCurrentEdit();

                // clear on Esc
                if (e.which == 27) {
                    this.value = "";
                }

                searchString = this.value;
                updateFilter();
            });

            function updateFilter() {
                dataView.setFilterArgs({
                    searchString: searchString
                });
                dataView.refresh();
            }


            dataView.beginUpdate();
            dataView.setItems(vals);
            dataView.setFilterArgs({
                searchString: searchString
            });
            dataView.setFilter(filter);
            dataView.endUpdate();


            vm.loading(false);

        }).catch(function (err) {
            console.error(err);
            notify('error', "Unable to load table data. Please refresh and try again.");
            vm.loading(false);
        });
    }


    vm.onLoad = function onLoad(source, inputValues) {
        vm.tables.forEach(function (table) {
            table.data.forEach(function (column) {
                if (!column.newValue) {
                    column.newValue = ko.observable()
                }
            })
        })
    };
    
    vm.setDefaults = function setDefaults(source, inputValues) {
        $('#fileUpload').on('change', function () {
            var display = '';
            var filename = $(this).val();
            filename = filename.substr(filename.lastIndexOf('\\') + 1)
            if (filename) {
                display = filename;
            } else {
                display = 'Choose file'
            }

            $(this).next('.custom-file-label').html(display);
        });
    };

    vm.afterLoad = function afterLoad() {
        vm.table.subscribe(function (table) {
            $('#canvas').empty();
            // vm.showAddRow(false);
            vm.showColumnOrder(false);
            vm.tabledata([]);

            if (table) {
                drawTable();
            }
        });
        
    }

    function getValueAsExcapedString(col, enclosure) {
        enclosure = enclosure || ''; // CSV Enclosure

        if (isNaN(col)) {
            // is not boolean or numeric
            if (!col) {
                // is null or undefined
                col = '';
            } else {
                // is string or object
                col = String(col);
                if (col.length > 0) {
                    // use regex to test for del, enclosure, \r or \n
                    // if(new RegExp( '[' + this.del + this.enclosure + '\r\n]' ).test(col)) {

                    // escape inline enclosure
                    col = col.split(enclosure).join(enclosure + enclosure);

                    // wrap with enclosure
                    col = enclosure + col + enclosure;
                }
            }
        }
        return col;
    };

    vm.downloadData = function (delimiter) {
        delimiter = delimiter || '\t'; // txt Delimiter

        var csv = '';

        let filteredItems = dataView.getFilteredItems();
        // var headers = Object.keys(filteredItems[0]);
        
        // headers.forEach(column => {
        vm.table().data.forEach(column => {
            if(column.field.toLowerCase() == 'id') {
                // ignore ID and id column
                // ID is a primary key from the db
                // id is a placed in the data for slickgrid to work
            } else {
                csv += getValueAsExcapedString(column.field);
                csv += delimiter;
            }
        });
        
        csv += '\n';
        
        filteredItems.forEach(item => {
            vm.table().data.forEach(column => {
                if(column.field.toLowerCase() == 'id') {
                    // ignore ID and id column
                    // ID is a primary key from the db
                    // id is a placed in the data for slickgrid to work
                } else {
                    csv += getValueAsExcapedString(item[column.field]);
                    csv += delimiter;
                }
            });
            csv += '\n';
        });

        var link = document.createElement("a");;
        link.href = 'data:application/octet-stream,' + encodeURIComponent(csv);
        link.download = vm.table().name + '.txt';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return vm;
});