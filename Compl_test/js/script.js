function templatePost(data) {
    var postID = data.id;
    var postTitle = data.title;
    var postURL = "https://www.reddit.com/" + data.url;
    var postAuthor = data.author,
        postText = data.text,
        authorURL = 'https://www.reddit.com/u/' + postAuthor,
        postThumbnail = data.thumbnail;

    if (postText.length > 0){
        postText += "<br /><br />;"
    }

    var template = '<div id="' + postID + '" style="background-color: white; color: grey; border-radius: 6px; font-weight: 600; padding: 8px; margin: 10px; text-align: left;">';
    if(postThumbnail.length > 0){
        template += '<div class="row"><div class="col-sm-2">';
        template += '<img src="' + postThumbnail + '" width="100%" height="auto"></div>';
        template += '<div class="col-sm-10">';
    }


    template += '' +
        /*'<div id="' + postID + '" class="singlePost">' +*/
        '<a href="' + postURL + '" target="_blank">' + postTitle + '</a><br />' +
        'by<a href="' +authorURL + '" target="_blank">' + postAuthor + '</a><br />' +
        '' + postText + '' +
        '</div>';

    if(postThumbnail.length > 0){
        template += "</div></div>";
    }
    template += "</div>";
    return template;


}

$.get("php/page.php", {'subreddit' : 'dog'}, function(data){

    data = JSON.parse(data);
    var allPosts = data.data.children;
    var numPosts = allPosts.length;
    var post = '';
    for(var postLoop = 0; postLoop < numPosts; postLoop++){

        post = allPosts[postLoop].data;
        var postAuthor = post.author;
        var postText = post.selftext,
            postTitle = post.title,
            postURL = post.permalink,
            postID = post.id,
            postThumbnail = post.thumbnail;

        if(postThumbnail == 'self'){
            postThumbnail = '';
        } else if(postThumbnail == 'image'){
            postThumbnail = post.url;
        } else if(postThumbnail == 'default'){
            postThumbnail = '';
        }

        var postData = {
            "id": postID,
            "title": postTitle,
            "author": postAuthor,
            "url": postURL,
            "text": postText,
            "thumbnail": postThumbnail
        };

        console.log(postData);


        var postHTML = templatePost(postData);

        if(postLoop == 0){
            $("#results").html('');
        }

        $("#results").append(postHTML);
    }
});