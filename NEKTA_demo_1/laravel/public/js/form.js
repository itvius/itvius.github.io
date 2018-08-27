$('#contactform').on('submit', function(e) {
    e.preventDefault();

    var name = $('#name').val();
    var email = $('#email').val();
    var text = $('#text').val();
    var file = $('#file').val();

    var extension = $('#file').val().split('.').pop().toLowerCase();

    var file_data = $('#file').prop('files')[];
    var supplier_name = $('#supplier_name').val();


    var form_data = new FormData();
    form_data.append('file', file_data);
    form_data.append('supplier_name', supplier_name);



    $.ajax({
        type: 'POST',
        url: '/form',
        data: $('#contactform', form_data),
        contentType: false,
        cache: false,
        processData: false,


        /*data: {name:name,email:email,text:text},*/

        success: function (data) {
            alert("Удача");

        },
        error: function (data) {
            alert('Ошибка');
            console.log(data);
        }
    });

    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

});