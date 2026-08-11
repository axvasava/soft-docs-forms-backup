    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_AP_Reimbursement';

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
            'name': 'Vendor Number',
            'formatOutput': function (document) {
                return String(document.ID || '');
            }
        },
                {
            'name': 'Vendor Name',
            'formatOutput': function (document) {
                return String(document.VendorName || '');
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
            'name': 'Voucher Number',
            'formatOutput': function (document) {
                return String(document.VoucherNumber || '');
            }
        },
		{
            'name': 'Start Date',
            'formatOutput': function (document) {
                if(document.StartDate){
                    var friendlyDate = new Date(document.StartDate);
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
            'name': 'End Date',
            'formatOutput': function (document) {
                if(document.EndDate){
                    var friendlyDate = new Date(document.EndDate);
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
             'name': 'Reimbursement Status',
             'formatOutput': function (document) {
                 return String(document.ReimbursementStatus || '');
             }
         },

          {
            'name': 'Notes',
            'formatOutput': function (document) {
                return String(document.Notes || '');
            }
        },
    ];
    var baseColumns2 = [{  //alternate column for rationale
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
            'name': 'Vendor Number',
            'formatOutput': function (document) {
                return String(document.ID || '');
            }
        },
                {
            'name': 'Vendor Name',
            'formatOutput': function (document) {
                return String(document.VendorName || '');
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
    //   {
    //         'name': 'Voucher Number',
    //         'formatOutput': function (document) {
    //             return String(document.VoucherNumber || '');
    //         }
    //     },
		{
            'name': 'Start Date',
            'formatOutput': function (document) {
                if(document.StartDate){
                    var friendlyDate = new Date(document.StartDate);
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
            'name': 'End Date',
            'formatOutput': function (document) {
                if(document.EndDate){
                    var friendlyDate = new Date(document.EndDate);
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
             'name': 'Rationale Status',
             'formatOutput': function (document) {
                 return String(document.RationaleStatus || '');
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
            title: 'Travel Reimbursements',
            documents: [],
            docTypeArray: [
                'AP Travel Reimbursements'
            ],

            exportable: true,
            columns: baseColumns,
        },

        {
            title: 'Mileage and Expense',
            documents: [],
            docTypeArray: [
                'AP Mileage and Expense',
            ],

            exportable: true,
            columns: baseColumns,
        },
        		{
            title: 'Travel Rationale',
            documents: [],
            docTypeArray: [
                'AP Travel Rationale',
            ],

            exportable: true,
            columns: baseColumns2,
        }
    ]