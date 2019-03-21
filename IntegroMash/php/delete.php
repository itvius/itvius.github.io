<?php
include 'W:\home\localhost\www\connect.php';
/*print_r($_GET);
print_r($_POST);
print_r($_REQUEST);*/
$id = $_REQUEST['id'];
$stmt = $pdo->query("DELETE FROM current_estimate WHERE `id` = '{$id}'");
while ($row[] = $stmt->fetch())
	$result = json_encode($row);
	{
		echo $result;
	}