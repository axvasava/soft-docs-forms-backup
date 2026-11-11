    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_SS_Transcript';

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
            'name': 'Transcript Type',
            'formatOutput': function (document) {
                return String(document.TranscriptType || '');
            }
        },
        {
            'name': 'Transcript Status',
            'formatOutput': function (document) {
                return String(document.TranscriptStatus || '');
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
            title: 'REG Transcripts A-E',
            documents: [],
            docTypeArray: [
                'SS Transcripts'
            ],

            exportable: true,
            columns: baseColumns,
        },
        {
            title: 'REG Transcripts F-J',
            documents: [],
            docTypeArray: [
                'SS Transcripts'
            ],

            exportable: true,
            columns: baseColumns,
        },
        {
            title: 'REG Transcripts K-O',
            documents: [],
            docTypeArray: [
                'SS Transcripts'
            ],

            exportable: true,
            columns: baseColumns,
        },
        {
            title: 'REG Transcripts P-T',
            documents: [],
            docTypeArray: [
                'SS Transcripts'
            ],

            exportable: true,
            columns: baseColumns,
        },
        {
            title: 'REG Transcripts U-Z',
            documents: [],
            docTypeArray: [
                'SS Transcripts'
            ],

            exportable: true,
            columns: baseColumns,
        }        
    ]