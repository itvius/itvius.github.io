<?php
include 'W:\home\localhost\www\connect.php';
$stmt = $pdo->query('SELECT * FROM subject');
	while ($row[] = $stmt->fetch())
	$result = json_encode($row);
	{
		echo $result;
	}