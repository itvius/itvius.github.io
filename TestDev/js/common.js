$(document).ready(function() {

    $(document).on("scroll", onScroll);
    var menu = document.querySelectorAll('.top_mnu, .bottom_mnu');

    $(menu).on('click', 'a', function (e) {
        e.preventDefault();

        var id = $(this).attr('href'),
            top = $(id).offset().top;
        $('html, body').animate({scrollTop: top - 60},
            700, 'swing', function () {
                $(document).on("scroll", onScroll);
            });
    });

    function onScroll(event){
        var scrollPosition = $(document).scrollTop()+90;
        $('.top_mnu a').each(function () {
            var currentLink = $(this);
            var refElement = $(currentLink.attr("href"));
            if (refElement.position().top <= scrollPosition && refElement.position().top + refElement.height() > scrollPosition) {
                $('.top_mnu ul li a').removeClass("active");
                currentLink.addClass("active");
            }
        });
    };

});

document.body.onload = function() {

    setTimeout(function() {
        var preloader = document.getElementById('page_preloader');
        if(!preloader.classList.contains('done')) {
            preloader.classList.add('done');
        }
    }, 300);
};