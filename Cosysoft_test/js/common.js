var element = document.getElementById('carousel'),
add = document.getElementById('img_add'),
popup = document.getElementById('popup'),
span = document.getElementById('close'),
commentWrap = document.querySelector('button_edit'),
urlPath = document.getElementById('urlPath'),
regexps = /https:/gi,
regexp = /http:/gi;

add.onclick = function () {
    console.log(urlPath.value);
    if(urlPath.value == ''){
        urlPath.value = 'Введите URL изображения';
        urlPath.style.border = '1px solid red';
    } else if (!urlPath.value.match(regexps) && !urlPath.value.match(regexp)) {
        urlPath.value = 'Вы всё ещё не ввели URL изображения';
        urlPath.style.border = '1px solid red';
    } else {
        urlPath.style.border = '';
        var divImg = document.createElement('div');
        divImg.className = 'img_wrap';

        var link = document.createElement('a');
        link.className = 'img_link';
        link.href = '#';
        link.onclick = function buttonModal() {
            popup.style.display = 'block';
            document.body.style.overflow = 'hidden';
            document.getElementById('img_modal').src = img.src;
            document.getElementById('m_cont').innerHTML = comment.innerHTML;
            document.getElementById('m_cont').className = 'comment_wrap';
        }

        var img = document.createElement('img');
        img.className = 'img_css';
        img.src = urlPath.value;

        var comment = document.createElement('p');
        comment.className = 'comment_wrap';
        comment.innerHTML = document.getElementById('comment').value;

        var editButton = document.createElement('button');
        editButton.className = 'button_edit';
        editButton.innerHTML = 'Редактировать';
        editButton.onclick = function buttonEdit() {
            var editComment = prompt('Введите комментарий', '');
            if (editComment !== null) {
                comment.innerHTML = editComment;
            }
        }

        element.insertBefore(divImg, element.firstChild);
        divImg.insertBefore(link, divImg.firstChild);
        link.insertBefore(img, link.firstChild);
        divImg.appendChild(comment);
        divImg.appendChild(editButton);

        urlPath.value = '';
        document.getElementById('comment').value = '';

    }
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