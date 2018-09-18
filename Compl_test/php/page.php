<?php

if (isset($_GET['subreddit'])){
    $sub = $_GET['subreddit'];
    echo $sub;
} else {
    echo 'no sub found';
}
$data = file_get_contents("http://reddit.com/.json");
echo $data;

?>