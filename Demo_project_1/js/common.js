$(document).ready(function() {

	$(".sandwich, .menu_item").click(function() {
		$(".sandwich").toggleClass("active");
	});

	$(".mnu_top ul a").click(function() {
		$(".mnu_top").fadeOut(600);
		$(".sandwich").toggleClass("active");
		$(".top_text").css("opacity", "1");
	}).append("<span>");

	$(".toggle_mnu").click(function() {
		if ($(".mnu_top").is(":visible")) {
			$(".top_text").css("opacity", "1");
			$(".mnu_top").fadeOut(600);
		} else {
			$(".top_text").css("opacity", ".1");
			$(".mnu_top").fadeIn(600);
		};
	});

	$(document).on("scroll", onScroll);

	var menu = document.querySelectorAll('.top_mnu, .mnu_top');

	$(menu).on('click','a', function (e) {
		e.preventDefault();

		var id  = $(this).attr('href'),
		top = $(id).offset().top;
		$('html, body').animate({scrollTop: top-60}, 
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
	
	$("#header").on("click","button",  function (event) {
		event.preventDefault();
		var id  = $(this).attr('href'),
		top = $(id).offset().top;
		$('body,html').animate({scrollTop: top - 60}, 900);
	});

	var containerEl = document.querySelector('#mixup_grid')

	var mixer = mixitup(containerEl, {
		selectors: {
			target: '.mix'
		},
		controls: {
			enable: true
		},
		animation: {
			enable: true,
			effects: 'fade scale',
			duration: 400
		}
	});

	$(".section_mixup li" || ".top_mnu li a").click(function() {
		$(".section_mixup li" || ".top_mnu li a").removeClass("active");
		$(this).addClass("active");
	});

	$(".popup").magnificPopup({type:"image"});
	$(".popup_content").magnificPopup({
		type:"inline",
		midClick: true
	});

	$(".portfolio_item").each(function(i) {
		$(this).find("a").attr("href", "#work_" + i);
		$(this).find(".podrt_descr").attr("id", "work_" + i);
	});
});

document.body.onload = function() {

	setTimeout(function() {
		var preloader = document.getElementById('page_preloader');
		if(!preloader.classList.contains('done')) {
			preloader.classList.add('done');
		}
	}, 300);
};