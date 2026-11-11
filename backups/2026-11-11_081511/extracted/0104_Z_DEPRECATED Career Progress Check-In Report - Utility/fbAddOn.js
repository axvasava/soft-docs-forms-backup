/**
 * 1.0.0 - Initial Release
 */

 define(
    ['jquery', 'knockout', 'notify', 'https://softdocscdn.etrieve.cloud/extenders/util.js'],
    function ($, ko, notify, utils) {
        ko.bindingHandlers.fbAddOn = {
            version: '1.0.0',
            init(element, options, bindings, viewModel, bindingContext) {
                try {
                    let properties = options() ? options() : {};

                    let type = properties.type ? properties.type : 'prepend';
            
                    let addOnOptions = ko.observable();
                    
                    let snippet = $(element).attr('placeholder');
                    $(element).attr('placeholder', '');
                    
                    if(snippet && type) {
                        addOnOptions({
                        type: type,
                        snippet: snippet
                        });
                        
                        ko.bindingHandlers.addOn.init(element, addOnOptions, bindings, viewModel, bindingContext);
                    } else {
                        throw new Error(`Missing placeholder attribute on ${element.id}`);
                    }

                } catch (error) {
                    console.error(error);
                    if ($('#printError').length > 0) {
                        utils.printError(error, 'Error in addOn extender: ');
                    }
                }
            },

            update(element, properties) {

            }
        };
    });
