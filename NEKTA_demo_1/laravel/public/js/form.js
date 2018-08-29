/*
jQuery(document).ready(function(){
    jQuery('#ajaxSubmit').on('submit', function(e){
        e.preventDefault();
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="_token"]').attr('content')
            }
        });
        jQuery.ajax({
            url: "{{ url('/grocery/post') }}",
            method: 'post',
            data: {
                name: jQuery('#name').val(),
                type: jQuery('#email').val(),
                price: jQuery('#text').val()
            },
            success: function(result){
                console.log(result);
            }});
    });
});*/



/*$(document).ready(function() {*/
    /*$('#contactform').on('submit', function (e) {
        e.preventDefault();

        var name = $('#name').val();
        var email = $('#email').val();
        var text = $('#text').val();
        /!*var file = $('#file').val();*!/

        /!*var extension = $('#file').val().split('.').pop().toLowerCase();

        var file_data = $('#file').prop('file')[];

        /!*var file_data = $('#file').val();*!/

        var form_data = new FormData();
        form_data.append('file', file_data);*!/

        $.ajax({
            type: 'POST',
            url: '/form',
            /!*data: $('#contactform'/!*, file_data*!/),*!/
            data: $('#contactform').serialize(),
            contentType: false,
            cache: false,
            processData: false,

            success: function () {
                alert('Ура');
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
    });*/
/*})*/

/*
    $('#contactform').on('submit', function(e) {
        e.preventDefault();

        var name = $('#name').val();
        var email = $('#email').val();
        var text = $('#text').val();
        var file = $('#file').val();

       /!* var extension = $('#file').val().split('.').pop().toLowerCase();*!/

        var file_data = $('#file')/!*.prop('files')[]*!/;

        var form_data = new FormData();
        form_data.append('file', file_data);

        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });

        $.ajax({
            type: 'POST',
            url: 'form',
            data: $('#contactform', form_data).serialize(),
            contentType: false,
            processData: false,
            dataType: 'json',

            /!*data: {
                _token : $('meta[name="csrf-token"]').attr('content'),
                contactform:$('#contactform').serialize()
            },*!/

            /!*data: {name:name,email:email,text:text},*!/

            success: function (data) {
                alert("Удача");
                console.log(data);
            },
            error: function(data) {
                alert('Ошибка');
                console.log(data);
            }
        });
    });*/