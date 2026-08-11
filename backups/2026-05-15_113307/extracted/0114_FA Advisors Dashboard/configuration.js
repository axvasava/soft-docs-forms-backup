    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_FA_Advisors';

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
            'name': 'Student Name',
            'formatOutput': function (document) {
                return String(document.StudentFName + ' ' + document.StudentLName || '');
            }
        },
             {
            'name': 'Student ID',
            'formatOutput': function (document) {
                return String(document.ID || '');
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
            'name': 'Document Type',
            'formatOutput': function (document) {
                return String(document.DocumentType || '');
            }
        },
        {
            'name': 'Academic Year',
            'formatOutput': function (document) {
                return String(document.AcademicYear || '');
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
        },
         {
            'name': 'Notes',
            'formatOutput': function (document) {
                return String(document.Notes || '');
            }
        },
        // {
        //     'name': 'AP Status',
        //     'formatOutput': function (document) {
        //         return String(document.AP_Status || '');
        //     }
        // },
    ];
    
    // BEGIN DOCUMENT TRAY CONFIGURATION //
    var documentConfig = [
        {
            title: 'FA Advisors A-G',
            documents: [],
            docTypeArray: [
                'FA Bankruptcy',
                'FA Driver License',
                'FA GED',
                'FA High School Diploma'
            ],

            exportable: true,
            columns: baseColumns,
        },
  {
            title: 'FA Advisors H-N',
            documents: [],
            docTypeArray: [
                'FA Bankruptcy',
                'FA Driver License',
                'FA GED',
                'FA High School Diploma'
            ],

            exportable: true,
            columns: baseColumns,
        },
  {
            title: 'FA Advisors O-Z',
            documents: [],
            docTypeArray: [
                'FA Bankruptcy',
                'FA Driver License',
                'FA GED',
                'FA High School Diploma'
            ],

            exportable: true,
            columns: baseColumns,
        }

    ]