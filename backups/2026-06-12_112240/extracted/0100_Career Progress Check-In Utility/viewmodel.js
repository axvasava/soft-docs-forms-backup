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
            let item = dataView.getItem(args.row)
            integration.delete(vm.table().integrationCodes.DeleteRow,{
                id: item.id // "id" needs to match your identity column of the table(s)
            }).then(function () {
                dataView.beginUpdate();
                dataView.deleteItem(item.id)
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

    var careerProgressDataFields = [
        {
            id: 'EmployeeID',
            name: 'Employee ID',
            field: 'EmployeeID',
            width: 150,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'CheckInYear',
            name: 'Check In Year',
            field: 'CheckInYear',
            width: 150,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'EmployeeLastName',
            name: 'Last Name',
            field: 'EmployeeLastName',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'EmployeeFirstName',
            name: 'First Name',
            field: 'EmployeeFirstName',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'EmployeeMiddleInitial',
            name: 'Middle Initial',
            field: 'EmployeeMiddleInitial',
            width: 125,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'JobTitle',
            name: 'Job Title',
            field: 'JobTitle',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'Campus',
            name: 'Campus',
            field: 'Campus',
            width: 150,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'Department',
            name: 'Department',
            field: 'Department',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'SupervisorName',
            name: 'Supervisor Name',
            field: 'SupervisorName',
            width: 200,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'SupervisorEmail',
            name: 'Supervisor Email',
            field: 'SupervisorEmail',
            width: 250,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'PersonalGoalsCheckIn1',
            name: 'Personal Goals',
            field: 'PersonalGoalsCheckIn1',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'DepartmentGoalsCheckIn1',
            name: 'Department Goals',
            field: 'DepartmentGoalsCheckIn1',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'CollegeWideGoalsCheckIn1',
            name: 'College-Wide Goals',
            field: 'CollegeWideGoalsCheckIn1',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'KeyAccompCheckIn2',
            name: 'Key Accomplishment 2',
            field: 'KeyAccompCheckIn2',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'KeyAccompCheckIn3',
            name: 'Key Accomplishment 3',
            field: 'KeyAccompCheckIn3',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'OppCheckIn2',
            name: 'Opportunity 2',
            field: 'OppCheckIn2',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'OppCheckIn3',
            name: 'Opportunity 3',
            field: 'OppCheckIn3',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'SupMeasuresCheckIn2',
            name: 'Support Measures 2',
            field: 'SupMeasuresCheckIn2',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'SupMeasuresCheckIn3',
            name: 'Support Measures 3',
            field: 'SupMeasuresCheckIn3',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'EmpFeedbackCheckIn1',
            name: 'Employee Feedback 1',
            field: 'EmpFeedbackCheckIn1',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'EmpFeedbackCheckIn2',
            name: 'Employee Feedback 2',
            field: 'EmpFeedbackCheckIn2',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'EmpFeedbackCheckIn3',
            name: 'Employee Feedback 3',
            field: 'EmpFeedbackCheckIn3',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'AddCommentsCheckIn1',
            name: 'Additional Comments 1',
            field: 'AddCommentsCheckIn1',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'AddCommentsCheckIn2',
            name: 'Additional Comments 2',
            field: 'AddCommentsCheckIn2',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'AddCommentsCheckIn3',
            name: 'Additional Comments 3',
            field: 'AddCommentsCheckIn3',
            width: 1000,
            editor: Slick.Editors.Text,
            sortable: true
        }, 
        {
            id: 'CheckInNumber',
            name: 'Check In Number',
            field: 'CheckInNumber',
            width: 150,
            editor: Slick.Editors.Text,
            sortable: true
        },
        {
            id: 'FormCode',
            name: 'Form Code',
            field: 'FormCode',
            width: 150,
            editor: Slick.Editors.Text,
            sortable: true
        } 
    ];


    vm.tables = [
        {
            name: 'Career Progress Check-In Data',
            integrationCodes: {
                GetAll:     'CareerProgressCheckIn',
                UpdateFld:  'CareerProgressCheckIn',
                DeleteRow:  'CareerProgressCheckIn',
                AddRow:     'CareerProgressCheckIn',
                Truncate:   'CareerProgressCheckIn _Truncate'
            },
            data: careerProgressDataFields
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