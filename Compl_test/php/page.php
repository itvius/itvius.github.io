<?php

if(isset($_GET['r']) && stelength($_GET['r']) > 0){
    $subreddit = FILTER_VAR(urlcode($_GET['r']), FILTER_SANITIZE_STRING);
} else {
    $subreddit = '';
}


if(isset($_GET['subreddit']) && strlen($_GET['subreddit']) > 0){
    $sub = $_GET['subreddit'];
    $url = "https://reddit.com/r/$sub/.json";
} else {
    $url = "https://reddit.com/.json";
}
$data = file_get_contents($url);
echo $data;
?>