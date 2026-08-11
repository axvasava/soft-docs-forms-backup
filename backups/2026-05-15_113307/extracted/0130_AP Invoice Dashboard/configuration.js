    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_Invoice_Approval';

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
            'name': 'Invoice Date',
            'formatOutput': function (document) {
                if(document.InvoiceDate){
                    var friendlyDate = new Date(document.InvoiceDate);
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
            'name': 'PO/BPO Number',
            'formatOutput': function (document) {
                return String(document.PONumber || '');
            }
        },
{
            'name': 'Voucher Number',
            'formatOutput': function (document) {
                return String(document.VoucherNumber || '');
            }
        },
        //     {
        //      'name': 'Invoice Amount',
        //      'formatOutput': function (document) {
        //          return String(document.Amount || '');
        //      }
        //  },
        
        {
            'name': 'Invoice Amount',
            'formatOutput': function (document) {
                const rawAmount = document.Amount;

            // Try to convert to a number
                const amount = parseFloat(rawAmount);
        
            // Check if it's a valid number
                if (!isNaN(amount)) {
                    //return new Intl.NumberFormat('en-US', {
                    const formattedAmount = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(amount);
                    if (amount < 0) {
                        // Return formatted amount wrapped in red color span
                        return `<span style="color: red;">${formattedAmount}</span>`;
                    } else {
                        return formattedAmount;
                    }
                }
                return '';
            }
        },
        

//         {
//              'name': 'Invoice Amount',
//              'formatOutput': function (document) {
//                   const rawAmount = document.Amount;
//                   const amount = parseFloat(rawAmount);

//               if (!isNaN(amount)) {
//                     const formatted = new Intl.NumberFormat('en-US', {
//                     style: 'currency',
//                     currency: 'USD',
//                     minimumFractionDigits: 2,
//                     maximumFractionDigits: 2
//                     }).format(amount);
//             if (amount < 0) {
//                 return `<span style="color: red;">${formatted}</span>`;
//             }
//             return formatted;
//         }
//                 return '';
//     }
// },





            {
             'name': 'Invoice Number',
             'formatOutput': function (document) {
                 return String(document.InvoiceNumber || '');
             }
         },
          {
             'name': 'Invoice Status',
             'formatOutput': function (document) {
                 return String(document.InvoiceStatus || '');
             }
         },
         {
            'name': 'Notes',
            'formatOutput': function (document) {
                return String(document.Notes || '');
            }
        },
    ];
    
    //Invoice Received
    // BEGIN DOCUMENT TRAY CONFIGURATION //
    var documentConfig = [
        {
            title: 'Invoice Hold',
            documents: [],
            docTypeArray: [
                'AP Invoices'
            ],

            exportable: true,
            columns: baseColumns,
        },
        {
            title: 'Ready to Voucher',
            documents: [],
            docTypeArray: [
                'AP Invoices'
            ],

            exportable: true,
            columns: baseColumns,
        },

        /* {
            title: 'Invoice Received',
            documents: [],
            docTypeArray: [
                'AP Invoices'
            ],

            exportable: true,
            columns: baseColumns,
        },*/
    ]