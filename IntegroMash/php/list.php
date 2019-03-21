<?php
include 'W:\home\localhost\www\connect.php';
$stmt = $pdo->query('SELECT `c`.id, `u`.`surname`, `s`.`subject`, `r`.`name` FROM `current_estimate` c, `users` u, `subject` s, `rating` r WHERE `c`.`user_id` = `u`.`id` and `c`.`subject_id` = `s`.`id` and `c`.`rating_id` = `r`.`id`');
	while ($row[] = $stmt->fetch())
	$result = json_encode($row);
	{
		echo $result;
	}