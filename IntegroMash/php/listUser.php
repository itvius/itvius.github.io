<?php
include 'W:\home\localhost\www\connect.php';
$stmt = $pdo->query('SELECT * FROM `users` u');
	while ($row[] = $stmt->fetch())
	$result = json_encode($row);
	{
		echo $result;
	}