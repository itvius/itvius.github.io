<?php
include 'W:\home\localhost\www\connect.php';
$obj = $_REQUEST['body'];
$object = json_decode($obj,false);
$surname = $object->surname;
$subject = $object->subject;
$rating = $object->rating;
$stmt = $pdo->query("INSERT INTO current_estimate (`user_id`, `subject_id`, `rating_id`) VALUES ('{$surname}', '{$subject}', '{$rating}')");