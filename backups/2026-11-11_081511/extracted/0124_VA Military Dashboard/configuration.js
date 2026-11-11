    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_FA_VA_Military';

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
            'name': 'Chapter',
            'formatOutput': function (document) {
                return String(document.Chapter || '');
            }
        },        
        {
            'name': 'Grad Year',
            'formatOutput': function (document) {
                return String(document.GradYear || '');
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
            title: 'FA Military Documents',
            documents: [],
            docTypeArray: [
                'VA Adjustment',
                'VA Application Form 1990',
                'VA Application Form 5490',
                'VA Authorization for 1905 for VA Counselor',
                'VA Book Voucher',
                'VA Certification',
                'VA Champ',
                'VA Change of Place or Program Form 1995',
                'VA Change of Place Train for Dep form 5495',
                'VA Counselor Communications',
                'VA CVTG',
                'VA DD214',
                'VA DD2384-NOBE',
                'VA Debt Email',
                 'VA Debt Letters',
                 'VA Dual Major',
                 'VA Dual Objective Request',
                 'VA Expired VA Benefits',
                 'VA Graduation',
                 'VA Guest Student Request for VA Benefits',
                 'VA LDA Verification',
                 'VA Letter for Children of Veterans Grant',
                 'VA Letter of Eligibility',
                 'VA Mitigating Circumstance',
                 'VA Parent Letter',
                 'VA Payment Receipt',
                 'VA Round Out Documentation',
                 'VA Statement of Intent',
                 'VA Statement of Responsibilities',
                 'VA Student Communications',
                 'VA Student Notes',
                 'VA Termination',
                 'VA Transcripts',
                 'VA Veterans Plan of Study'
                
            ],

            exportable: true,
            columns: baseColumns,
        }
    ]