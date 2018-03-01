$(document).ready(function() {

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

	$(".section_mixup li").click(function() {
		$(".section_mixup li").removeClass("active");
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

	$('head','watch').css('min-height', $(window).height());
});

document.body.onload = function() {

	setTimeout(function() {
		var preloader = document.getElementById('page_preloader');
		if(!preloader.classList.contains('done')) {
			preloader.classList.add('done');
		}
	}, 1000);
};

/*var containerEl = document.querySelector('#mixup_grid');

var mixer = mixitup(containerEl, {
	animation: {
		enable:true,
		effects:'scale fade',
		duration:700
	}
});*/