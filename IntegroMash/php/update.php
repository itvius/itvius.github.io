<?php
include 'W:\home\localhost\www\connect.php';
$obj = $_REQUEST['body'];
$object = json_decode($obj,false);
$id = $object->id;
$surname = $object->surname;
$subject = $object->subject;
$rating = $object->rating;
$stmt = $pdo->query("UPDATE current_estimate SET `user_id` = '{$surname}', `subject_id` = '{$subject}', `rating_id` = '{$rating}' WHERE `id` = '{$id}'");