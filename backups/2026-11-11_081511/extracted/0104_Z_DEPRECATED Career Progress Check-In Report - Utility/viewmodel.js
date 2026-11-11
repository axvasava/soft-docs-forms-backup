$('.container').addClass('container-fluid').removeClass('container');
define(['jquery',
    'knockout',
    'vmBase',
    'integration',
    'notify',
    'user',
    './liveViewModel.js',
    'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js',
    'template/fbAddOn',
], function viewmodel($, ko, vm, integration, notify, user, liveVM) {
    var GROUP = {
        
    };
    
    vm.addObservable('careerCheckInData');

    vm.onLoad = function onLoad(source, inputValues) {
    };
    
    vm.setDefaults = function setDefaults(source, inputValues) {
        return integration.all('Etrieve_Integration_Get_Career_Progress_Check_In_Report_Data').then(function(response) {
            
            // response.forEach(function(row) {
            //     row.reissue = function() {
            //         integration.update('TravelRequests', {
            //             id: row.id,
            //             Status: 'Reissue'
            //         });
            //     }
            // });
            
            vm.careerCheckInData(response);
        });
    };

    vm.afterLoad = function afterLoad() {
        
    };


    vm.onSubmit = function onSubmit(form) {

    };

    vm.onApprove = function onApprove(form) {
    };

    vm.onDecline = function onDecline(form) {

    };

    vm.beforeRequired = function beforeRequired(form) {
        
        
    };

    vm.afterRequired = function afterRequired(form) {
        if(user.isInLibrary || user.isInDrafts) {

        }
    };
    
    vm.exportAll = function() {
        var csvFile = '';
        
        var search = vm.search() || '';
        search = search.toUpperCase();
        var foundRequests = vm.careerCheckInData().filter(function(row) {
            var found = false;
            
            if(search) {
                Object.keys(row).forEach(function(key) {
                    if(key == 'reissue') {
                        
                    } else {
                        var val = noComma(row[key]) || '';
                        found = found || val.toUpperCase().indexOf(search) >= 0;
                    }
                });
            } else {
                found = true;
            }
            return found;
        })
        
        foundRequests.forEach(function(row, index) {
            if(index === 0) {
                Object.keys(row).forEach(function(key) {
                    if(key == 'reissue') {
                        
                    } else {
                        csvFile += key;
                        csvFile += ',';
                    }
                });
                csvFile += '\n';
            }
            
            
            Object.keys(row).forEach(function(key) {
                if(key == 'reissue') {
                    
                } else {
                    csvFile += noComma(row[key]);
                    csvFile += ',';
                }
            });
            csvFile += '\n';
        });
        
        var filename = 'Career Progress Check-In Report.csv';
        exportToCsv(filename, csvFile);
        
    };
    
    function exportToCsv(filename, csvFile) {
        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
    
    function noComma(str) {
        str = str ? str : '';
        var cleanStr = ( (str+'') || '').replace (/,/g, '');
        return cleanStr;
    }
    

    vm.filter = function() {
        var search = $(vm.search.element).val()
        search = search.toUpperCase();
        
        var $tr = $('#careerCheckInBody tr');
        
        $tr.each(function(index, row) {
            var found;
            $(row).find('td').each(function(index, td) {
                var val = $(td).text() || '';
                
                found = found || val.toUpperCase().indexOf(search) >= 0;
            });
            
            if(found){            
                $(row).show();
            } else {
                $(row).hide();
            }
        });
    }

    
    return vm;
});
