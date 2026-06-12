    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_AP_Secure';

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
            'name': 'Vendor ID',
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
            'name': 'Effective Date',
            'formatOutput': function (document) {
                if(document.EffectiveDate){
                    var friendlyDate = new Date(document.EffectiveDate);
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
   
        
        
        // {
        //     'name': 'Invoice Number',
        //     'formatOutput': function (document) {
        //         if(document.InvoiceNumber && document.InvoiceNumber.length > 0) {
        //             document.InvoiceNumber = document.InvoiceNumber.join(', ');
        //         }
        //         return String(document.InvoiceNumber || '');
        //     }
        // },
        // {
        //     'name': 'PO Number',
        //     'formatOutput': function (document) {
        //         return String(document.PO_Number || '');
        //     }
        // },
        {
            'name': 'AP Secure Status',
            'formatOutput': function (document) {
                return String(document.APSecureStatus || '');
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
            title: 'AP Secure - W9s',
            documents: [],
            docTypeArray: [
                'AP W9'
                
            ],

            exportable: true,
            columns: baseColumns,
        },
        
        {
            title: 'AP Secure - Vendor Direct Deposits',
            documents: [],
            docTypeArray: [
                'AP Vendor Direct Deposit'
                
            ],

            exportable: true,
            columns: baseColumns,
        }
    ]