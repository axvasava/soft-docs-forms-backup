    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_HR_Payroll';

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
            'name': 'Action Type',
            'formatOutput': function (document) {
                return String(document.ActionType || '');
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
            'name': 'Bargaining Unit',
            'formatOutput': function (document) {
                return String(document.BargainingUnit || '');
            }
        },
        {
            'name': 'Employee Name',
            'formatOutput': function (document) {
                return String(document.EmployeeLName + ', ' + document.EmployeeFName || '');
            }
        }, 
             {
            'name': 'Employee ID',
            'formatOutput': function (document) {
                return String(document.ID || '');
            }
        },
        
        
            {
              'name': 'Pay Date',
              'formatOutput': function (document) {
                 if(document.PayDate){
                     var friendlyDate = new Date(document.PayDate);
                     var options = {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                    };                    
                     return friendlyDate.toLocaleDateString('en-US',options);
                }
                else if(document.PPEDate){
                    var friendlyDate = new Date(document.PPEDate);
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
        
        
		      //  {
        //     'name': 'Pay Date',
        //     'formatOutput': function (document) {
        //         if(document.PayDate){
        //             var friendlyDate = new Date(document.PayDate);
        //             var options = {
        //                 year: "numeric",
        //                 month: "2-digit",
        //                 day: "2-digit"
        //             };                    
        //             return friendlyDate.toLocaleDateString('en-US',options);
        //         }
        //         else {
        //             return '';
        //         }
        //     }
        // },
        {
            'name': 'Notes',
            'formatOutput': function (document) {
                return String(document.Notes || '');
            }
        },
    //    {
      //      'name': 'HR Review Status',
        //    'formatOutput': function (document) {
          //      return String(document.HRReviewStatus || '');
            //}
        //},
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
            title: 'HR to Review',
            documents: [],
            docTypeArray: [
                'HR Adjunct Instructor Observation Report',
                'HR Detroit Tax Form',
                'HR Direct Deposit',
                'HR EAF',
                'HR Employee Change of Information Request',
                'HR Exit Checklist',
                'HR Federal Tax Form',
                'HR Facilitator Form',
                'HR Income WH Orders',
                'HR Load Documents',
                'HR Offer Letter',
                'HR ORS Information',
                'HR Payroll Report',
                'HR Pontiac Tax Form',
                'HR Ret. Choice ORP/MPSERS',
                'HR State Tax Form',
                'HR Stipend',
                'HR Visa/Foreign Documents'
            ],

            exportable: true,
            columns: baseColumns,
        },
		{
            title: 'HR Hold',
            documents: [],
            docTypeArray: [
                'HR Adjunct Instructor Observation Report',
                'HR Detroit Tax Form',
                'HR Direct Deposit',
                'HR EAF',
                'HR Employee Change of Information Request',
                'HR Exit Checklist',
                'HR Federal Tax Form',
                'HR Facilitator Form',
                'HR Income WH Orders',
                'HR Load Documents',
                'HR Offer Letter',
                'HR ORS Information',
                'HR Payroll Report',
                'HR Pontiac Tax Form',
                'HR Ret. Choice ORP/MPSERS',
                'HR State Tax Form',
                'HR Stipend',
                'HR Visa/Foreign Documents'
            ],

            exportable: true,
            columns: baseColumns,
        },
                {
            title: 'Payroll Processing',
            documents: [],
            docTypeArray: [
                'HR Adjunct Instructor Observation Report',
                'HR Detroit Tax Form',
                'HR Direct Deposit',
                'HR EAF',
                'HR Employee Change of Information Request',
                'HR Exit Checklist',
                'HR Federal Tax Form',
                'HR Facilitator Form',
                'HR Income WH Orders',
                'HR Load Documents',
                'HR Offer Letter',
                'HR ORS Information',
                'HR Payroll Report',
                'HR Pontiac Tax Form',
                'HR Ret. Choice ORP/MPSERS',
                'HR State Tax Form',
                'HR Stipend',
                'HR Visa/Foreign Documents'
            ],

            exportable: true,
            columns: baseColumns,
        },
        {
            title: 'Payroll Hold',
            documents: [],
            docTypeArray: [
                'HR Adjunct Instructor Observation Report',
                'HR Detroit Tax Form',
                'HR Direct Deposit',
                'HR EAF',
                'HR Employee Change of Information Request',
                'HR Exit Checklist',
                'HR Federal Tax Form',
                'HR Facilitator Form',
                'HR Income WH Orders',
                'HR Load Documents',
                'HR Offer Letter',
                'HR ORS Information',
                'HR Payroll Report',
                'HR Pontiac Tax Form',
                'HR Ret. Choice ORP/MPSERS',
                'HR State Tax Form',
                'HR Stipend',
                'HR Visa/Foreign Documents'
            ],

            exportable: true,
            columns: baseColumns,
        }

    ]