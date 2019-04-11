var element = document.getElementById('carousel'),
add = document.getElementById('img_add'),
popup = document.getElementById('popup'),
span = document.getElementById('close'),
commentWrap = document.querySelector('button_edit'),
commentArea = document.getElementById('comment'),
urlPath = document.getElementById('urlPath'),
clearDiv = document.getElementById('clear'),
regexps = /https:/gi,
regexp = /http:/gi,
p = 0,
obj = [];

add.onclick = function addd(){
    addDiv(urlPath, commentArea);
};

span.onclick = function() {
    popup.style.display = 'none';
    document.body.style.overflow = '';
};

window.onclick = function(event) {
    if(event.target === popup) {
        popup.style.display = 'none';
        document.body.style.overflow = '';
    }
};

function addDiv(urlPath, commentArea, ident) {
    if(urlPath.value === ''){
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
        };

        var img = document.createElement('img');
        img.className = 'img_css';
        img.src = urlPath.value;

        var comment = document.createElement('p');
        comment.className = 'comment_wrap';
        comment.innerHTML = commentArea.value;

        var editButton = document.createElement('button');
        editButton.className = 'button_edit';
        editButton.innerHTML = 'Редактировать';
        editButton.onclick = function buttonEdit() {
            var editComment = prompt('Введите комментарий', '');
            if (editComment !== null) {
                comment.innerHTML = editComment;
                if (divImg.id === returnObj[divImg.id].id) {
                    returnObj[divImg.id].commentArea = editComment;
                }

                obj[divImg.id].commentArea = returnObj[divImg.id].commentArea;

                var serialObj = JSON.stringify(obj);
                localStorage.setItem('mass_img', serialObj);
            }
        };

        element.insertBefore(divImg, element.firstChild);
        divImg.insertBefore(link, divImg.firstChild);
        link.insertBefore(img, link.firstChild);
        divImg.appendChild(comment);
        divImg.appendChild(editButton);

        addWrap(img.src, comment.innerHTML);

        var returnObj = JSON.parse(localStorage.getItem('mass_img'));

        divImg.id = returnObj[p].id;

        urlPath.value = '';
        commentArea.value = '';
    }
}

function addFromJSON(urlPath, commentArea, ident){
    var divImg = document.createElement('div');
    divImg.className = 'img_wrap ';
    divImg.id = ident;

    var link = document.createElement('a');
    link.className = 'img_link';
    link.href = '#';
    link.onclick = function buttonModal() {
        popup.style.display = 'block';
        document.body.style.overflow = 'hidden';
        document.getElementById('img_modal').src = img.src;
        document.getElementById('m_cont').innerHTML = comment.innerHTML;
        document.getElementById('m_cont').className = 'comment_wrap';
    };

    var img = document.createElement('img');
    img.className = 'img_css';
    img.src = urlPath;

    var comment = document.createElement('p');
    comment.className = 'comment_wrap';
    comment.innerHTML = commentArea;

    var editButton = document.createElement('button');
    editButton.className = 'button_edit';
    editButton.innerHTML = 'Редактировать';
    editButton.onclick = function buttonEdit() {
        var editComment = prompt('Введите комментарий', '');
        if (editComment !== null) {
            comment.innerHTML = editComment;

            var returnObj = JSON.parse(localStorage.getItem('mass_img'));

            if (divImg.id === returnObj[divImg.id].id) {
                returnObj[divImg.id].commentArea = editComment;
            }

            obj[divImg.id].commentArea = returnObj[divImg.id].commentArea;

            var serialObj = JSON.stringify(obj);
            localStorage.setItem('mass_img', serialObj);
        }
    };

    element.insertBefore(divImg, element.firstChild);
    divImg.insertBefore(link, divImg.firstChild);
    link.insertBefore(img, link.firstChild);
    divImg.appendChild(comment);
    divImg.appendChild(editButton);

    addWrap(img.src, comment.innerHTML);

    urlPath.value = '';
    commentArea.value = '';
}

function addWrap(img, comment) {
    for(; p < obj.length; p++){}

        obj.push({
            id: p,
            urlPath: img,
            commentArea: comment
        });

    var serialObj = JSON.stringify(obj);
    localStorage.setItem('mass_img', serialObj);

}

window.onload = function() {
    if (localStorage.length > 0){
        var returnObj = JSON.parse(localStorage.getItem('mass_img'));
        var key = returnObj.forEach(function(item,i,returnObj) {
            addFromJSON(returnObj[i].urlPath, returnObj[i].commentArea, returnObj[i].id);
        });
    }
};

clearDiv.onclick = function() {
    localStorage.clear();
    window.location.reload();
};