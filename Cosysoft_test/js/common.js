var element = document.getElementById('carousel');
var add = document.getElementById('img_add');
var popup = document.getElementById('popup');
var span = document.getElementById('close');

add.onclick = function () {
    var divImg = document.createElement('div');
    divImg.className = 'img_wrap';

    var link = document.createElement('a');
    link.className = 'img_link';
    link.href = '#';
    link.onclick = function bottonModal() {
        popup.style.display = 'block';
        document.body.style.overflow = 'hidden';
        document.getElementById('img_modal').src = img.src;
        document.getElementById('m_cont').innerHTML = comment.innerHTML;
        var cont = document.querySelector('.modal_cont');
    }

    var img = document.createElement('img');
    img.className = 'img_css';
    img.src = document.getElementById('urlPath').value;

    var comment = document.createElement('p');
    comment.className = 'comment_wrap';
    comment.innerHTML = document.getElementById('comment').value;

    element.insertBefore(divImg, element.firstChild);
    divImg.insertBefore(link, divImg.firstChild);
    link.insertBefore(img, link.firstChild);
    divImg.appendChild(comment);
}

span.onclick = function() {
    popup.style.display = 'none';
    document.body.style.overflow = '';
}

window.onclick = function(event) {
    if(event.target == popup) {
        popup.style.display = 'none';
        document.body.style.overflow = '';
    }
}