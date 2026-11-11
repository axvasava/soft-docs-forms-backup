    // Configurations for this report
    var contentURL = 'https://oaklandcccontent.etrieve.cloud' ;
    var integrationName = 'Dashboard_AP_Check_Validation';

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
            'name': 'Voucher Number',
            'formatOutput': function (document) {
                return String(document.VoucherNumber || '');
            }
        },
        // {
        //     'name': 'Invoice Amount',
        //     'formatOutput': function (document) {
        //         return String(document.Amount || '');
        //     }
        // },
        
        {
             'name': 'Invoice Amount',
             'formatOutput': function (document)
                    {
                  const rawAmount = document.Amount;
                  const amount = parseFloat(rawAmount);

                     if (!isNaN(amount))
                            {
                            const formatted = new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                            }).format(amount);
                    if (amount < 0)
                        {
                         return `<span style="color: red;">${formatted}</span>`;
                          }
                     return formatted;
                    }
                     return '';
                    }
        },
        
        
                {
            'name': 'Invoice Number',
            'formatOutput': function (document) {
                return String(document.InvoiceNumber || '');
            }
        },
        /* {
             'name': 'Check Validation Status',
             'formatOutput': function (document) {
                 return String(document.CheckValidationStatus || '');
             }
         },*/
         {
             'name': 'Status',
             'formatOutput': function (document) {
                 return String(document.InvoiceStatus || document.CheckRequestStatus || document.ReimbursementStatus || '');
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
            title: 'Check Validation',
            documents: [],
            docTypeArray: [
                'AP Check Requests',
                'AP Credit Memo',
                'AP Invoices',
                'AP Mileage and Expense',
				'AP Prepaid Travel Forms',
				'AP Travel Reimbursements'
            ],

            exportable: true,
            columns: baseColumns,
        }
    ];