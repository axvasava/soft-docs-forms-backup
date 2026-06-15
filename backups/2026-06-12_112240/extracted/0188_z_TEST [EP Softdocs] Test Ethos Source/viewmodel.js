define(['jquery',
    'knockout',
    'vmBase',
    'integration',
    'notify',
    'user',
    'template/autosize.min',
    'template/jquery.maskedinput',
    './liveViewModel.js',
    'package',
    /*-- WARNING: Uncommenting the line of code below will allow you to use Etrieve Extenders on this form.
    Currently, Etrieve Extenders are only compatible with cloud based instances of Etrieve.
    If you are unsure if you can utilize Extenders, please contact your institution's Etrieve Administrator.*/
    'https://softdocscdn.etrieve.cloud/extenders/extenders.min.js'
], function viewmodel($, ko, vm, integration, notify, user, autosize, maskedinput, liveVM, pkg) {


    //This function is used to set the autosize function on textareas with a class of autosizeareas.
    //Uncomment to use.
    //autosize($('.autosizeareas'));


    /*
    These functions are used to set the masking of fields. There are 3 example classes below you can use.
    If you need to add another row, simple copy one of the examples below and edit the class name and the mask
    */
    $('.maskphone').mask('999-999-9999');
    $('.maskzip').mask('99999?-9999');
    $('.maskssn').mask('999-99-9999');
    /*End masking functions*/

    
    vm.onLoad = function onLoad(source, inputValues) {


    };
    
    vm.setDefaults = function setDefaults(source, inputValues) {

	   
	   //integration.all('Web_Ethos_Get_Academic_Periods',{
    //                 //personID: '0799517' //studentSearch
    //             }).then(function(termResults){
    //                 console.log(termResults);
                    
                    // integration.all('NFB_Web_Ethos_Get_Persons_by_Colleague_ID').then(function(customSections){
                    //       console.log('NFB_Web_Ethos_Get_Persons_by_Colleague_ID:', customSections);

                    // });
       //         });
	   // //person GUID 1acc6722-7b65-4c26-82f8-87f1da0300a7
	   // //person ID 1361573
	    
    //     integration.all("Web_Ethos_Get_Student_Programs_by_Student_GUID_V2", {
    //                 studentID: '0799517'
    //             }).then(data => {
    //                 //const program = data.find(prog => prog.enrollmentStatus.status === 'active');
    //                 //const program = data.prog;
    //                 console.log("Program found", data);
                        
    //                 vm.programGUID(program.id);
                    
    //             /*  integration.all('Web_Ethos_Get_Academic_Program_by_program_GUID', {
    //                     programID: program.id
    //                   }).then(function(academicProgram){
    //                       console.log("Academic Program Title:", academicProgram);
    //                       console.log("Academic Program Title:", academicProgram.title);
    //                       vm.studentProgram(academicProgram.title);
    //                   //  vm.programCode(academicProgram.code);
    //                 });*/
    //     });
        
        const studentID = '0477684';
        integration.first('NFB_Web_Ethos_Get_Persons_by_Colleague_ID',{personID: studentID}).then(function(personResults){
                    console.log('Person Results', personResults);
                    
                    if (personResults) {
                      let personGUID = personResults.id;

                    // console.log('personGUID:', personGUID);
                    //   integration.all('Web_Ethos_Section_Registration_by_Registrant',{personGUID: personGUID}).then(function(sectionReg){
                    //       console.log('Registration:', sectionReg);
                       
                    //   sectionReg.forEach(section => {
                    //       //let sectionGUID = sectionReg.section.id;
                       
                    //       integration.all('Web_Ethos_Get_Sections_by_Section_ID',{sectionsGUID: section.section.id}).then(function(courseSection){
                    //          console.log('Section:', courseSection);
                          
                    //       });
                     
                    //   });   
                    //   });
                    } else {
                      notify('error','Person not found');
                      $('.loading').hide();
                    }
                });
     };

    vm.afterLoad = function afterLoad() {
        //  This method is called after setDefaults has been called.

        //  WARNING: It is not recommended to set input values during afterLoad because it is not guaranteed
        //  to save values to the server.

        //Initialize FormBuilder created form specific code
        liveVM.afterLoadEditsForVM();

        /*
        //  This is resizing the textarea's when the form loads incase it is pulling in real data.
        var ta = document.querySelector('.autosizeareas');
        var evt = document.createEvent('Event');
        evt.initEvent('autosize:update', true, false);
        ta.dispatchEvent(evt);
        */
        
  
        autosize($('textarea'));
    };

    //Submitting Lifecycle Callbacks:
    //Parameters:
    //  form.attachmentCount: integer

    //In order to stop the Submitting Lifecycle and prevent this form from moving to the next step in the workflow
    //process, add the following to any of the functions below:
    //    throw new Error('reason placed here will be displayed to the user');

    vm.onSubmit = function onSubmit(form) {
        //  This method is called when the Submit button is clicked and before calling beforeRequired.
        //  This normally occurs in the Forms Library, but may occur in the Inbox when a package is
        //  returned to Originator.

    };

    vm.onApprove = function onApprove(form) {
        //  This method is called when the Approve button is clicked and before calling beforeRequired.

    };

    vm.onDecline = function onDecline(form) {
        //  This method is called when the Decline button is clicked and before calling beforeRequired.

    };

    vm.beforeRequired = function beforeRequired(form) {
        //  This method is called after onSubmit, onApprove or onDecline and before validating the forms required fields.

    };

    vm.afterRequired = function afterRequired(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };

     vm.onOptOut = function onOptOut(form) {
       //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    vm.onESignSubmit = function onESignSubmit(form) {
        //  This method is called after the required inputs on the form have been confirmed to have values.

    };

    return vm;
});
