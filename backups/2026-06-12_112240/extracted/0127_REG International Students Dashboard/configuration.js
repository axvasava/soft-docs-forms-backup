    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_SS_Intl_Student';

    var baseColumns = [{
        'name': 'Document Link',
        'formatOutput': function(document) {
            var $div = $('<div id="actions' + document.DocumentID + '" class="text-center text-nowrap"></div>');
            var $viewDocBtn = $('<button type="button" class="btn btn-sm btn-success" >View Document</button>');
                $viewDocBtn.click(function() {
                    window.open(contentURL + document.url);
                });
                return $div.append($viewDocBtn);     
            }
        },
        {
            'name': 'Document Type',
            'formatOutput': function (document) {
                return String(document.DocumentType || '');
            }
        },        
        {
            'name': 'Document Date',
            'formatOutput': function (document) {
                if(document.DocumentDate){
                    var friendlyDate = new Date(document.DocumentDate);
                    var options = {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                    };                    
                    return friendlyDate.toLocaleDateString('en-US',options);
                }
                else {
                    return '';
                }
            }
        },
        {
            'name': 'Student ID',
            'formatOutput': function (document) {
                return String(document.ID || '');
            }
        },
        {
            'name': 'Student Name',
            'formatOutput': function (document) {
                return String(document.StudentFName + ' ' + document.StudentLName || '');
            }
        },
        {
            'name': 'AcademicYear',
            'formatOutput': function (document) {
                return String(document.AcademicYear || '');
            }
        },
        {
            'name': 'Review Status',
            'formatOutput': function (document) {
                return String(document.ReviewStatus || '');
            }
        }
    ];
    
    // BEGIN DOCUMENT TRAY CONFIGURATION //
    var documentConfig = [
        {
            title: 'International Student Documents',
            documents: [],
            docTypeArray: [
                 'SS F-1 Bank Statement',
                 'SS F-1 Change of Status',
                 'SS F-1 Communications',
                 "SS F-1 Continuing I-20\'s",
                 'SS F-1 CPT',
                 'SS F-1 Economic Hardship',
                 'SS F-1 Exit',
                 'SS F-1 Extensions',
                 'SS F-1 I-20',
                 'SS F-1 I-94 Form',
                 'SS F-1 IBT TOEFL',
                 'SS F-1 IELTS',
                 'SS F-1 Information Form',
                 'SS F-1 LFT Approvals',
                 'SS F-1 MTELP',
                 'SS F-1 OPT',
                 'SS F-1 Passport ID page',
                 'SS F-1 Reinstatement',
                 "SS F-1 RFE\'s",
                 'SS F-1 Statement of Finances',
                 'SS F-1 Visa',
                 'SS International Student Non-I20',

            ],

            exportable: true,
            columns: baseColumns,
        }
    ]