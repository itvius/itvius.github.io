
$(document).ready(function(){
    /*show();
    setInterval('show()',1000);*/
    $('#contactform').submit(function(e){
        e.preventDefault();

        var formData = {
            name : $('#name').val(),
            email: $('#email').val(),
            text: $('#text').val(),
            /*file: $('#file').val()*/

        };

        var file_data = $('#file').prop('file')[];

        var form_data = new FormData();
        form_data.append('file', file_data);

        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });

        $.ajax({
            type: 'POST',
            url: '/grocery',
            dataType: 'json',
            data: formData,
            contentType: false,
            processData: false,

            success: function(result) {
                $('#forms').html(result.form);
            }
        });
    });
});