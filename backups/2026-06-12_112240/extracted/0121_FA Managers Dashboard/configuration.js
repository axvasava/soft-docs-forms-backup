    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_FA_Managers';

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
        },
        {
            'name': 'Notes',
            'formatOutput': function (document) {
                return String(document.Notes || '');
            }
        },
    ];
    
    // BEGIN DOCUMENT TRAY CONFIGURATION //
    var documentConfig = [
        {
            title: 'FA Loan and Certification Documents',
            documents: [],
            docTypeArray: [
                'FA PLUS Loan Request Form',
                'FA Loan Reaffirmations',
                'FA Cert of Parental Non-Support'
            ],

            exportable: true,
            columns: baseColumns,
        }
    ]