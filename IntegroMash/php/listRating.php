<?php
include 'W:\home\localhost\www\connect.php';
$stmt = $pdo->query('SELECT * FROM rating');
	while ($row[] = $stmt->fetch())
	$result = json_encode($row);
	{
		echo $result;
	}