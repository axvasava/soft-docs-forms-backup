define(['jquery', 'vmBase', 'jquery-ui', 'template/jquery.maskedinput'], 
function ($, vm) {
     var formVM = { }; 
     vm.addBootstrapClassesAfterRender = function() {
         $('.row').addClass('form-group form-group-sm');
         $('input:not(:checkbox):not(:radio):not(:button):not(:submit),textarea,select').addClass('form-control');
     };
     vm.addBootstrapClassesAfterRender();
     window.updateBootstrapClassesAfterDL = vm.addBootstrapClassesAfterRender;
     //This timeout seems related to dynamic rows... Not sure, but mark for inspection for removal 
     setTimeout(function() {
         try {
             if (typeof formVM.loadSaved != 'undefined') {
                 console.log(formVM.loadSaved);
                 formVM.loadSaved();
             }
         } catch (e) {
             console.log(e);
         }
     }, 2000);
     window.formVM = formVM;
     $('.datepicker').datepicker({    changeMonth: true,    changeYear: true}).mask('99/99/9999');
     jQuery.extend(vm, window.formVM);
     return {
         formVM:formVM,
         afterLoadEditsForVM: function(){
             
         }
     }
});