$('#contactform').on('submit', function(e) {
    e.preventDefault();

    var name = $('#name').val();
    var email = $('#email').val();
    var text = $('#text').val();
    /*var file = $('#file').val();*/



    $.ajax({
        type: 'POST',
        url: '/form',
        data: $('#contactform').serialize(),


        /*data: {name:name,email:email,text:text},*/

        success: function show() {
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