let slideIndexAccountant = 1;
let slideIndexThank = 1;
showSlides(1, 'both');

function plusSlide(param) {
    if (param === 'thank') {
        showSlides(slideIndexThank += 1, param);
    } else {
        showSlides(slideIndexAccountant += 1, param);
    }
}

function minusSlide(param) {
    if (param === 'thank') {
        showSlides(slideIndexThank -= 1, param);
    } else {
        showSlides(slideIndexAccountant -= 1, param);
    }
}

function currentSlide(n, param) {
    if (param === 'thank') {
        showSlides(slideIndexThank = n, param);
    } else {
        showSlides(slideIndexAccountant = n, param);
    }
}

function showSlides(n, param) {
    let i;
    let slides;
    let dots;
    if (param === 'thank') {
        slides = document.getElementsByClassName("thank-slide");
        dots = document.getElementsByClassName("slider-dots_item");
        if (n > slides.length) {
            slideIndexThank = 1
        } else if (n < 1) {
            slideIndexThank = slides.length
        }

        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        for (i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }

        slides[slideIndexThank - 1].style.display = "block";
        dots[slideIndexThank - 1].className += " active";
    } else if (param === 'accountant') {
        slides = document.getElementsByClassName("accountant-slide");
        dots = document.getElementsByClassName("accountant-slider-dots_item");
        if (n > slides.length) {
            slideIndexAccountant = 1
        } else if (n < 1) {
            slideIndexAccountant = slides.length
        }

        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        for (i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }

        slides[slideIndexAccountant - 1].style.display = "block";
        dots[slideIndexAccountant - 1].className += " active";
    } else if (param === 'both') {
        let dotsThank = document.getElementsByClassName("slider-dots_item");
        let dotsAccountant = document.getElementsByClassName("accountant-slider-dots_item");
        dotsThank[0].className += " active";
        dotsAccountant[0].className += " active";
    }
}
