<?php
header("Access-Control-Allow-Origin: *");
header('Content-type: application/json');
header('Access-Control-Allow-Methods: POST, GET, DELETE, PUT, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type: application/json');
$host = 'localhost'; // адрес сервера
$database = 'integro'; // имя базы данных
$user = 'root'; // имя пользователя
$password = ''; // пароль
$charset = 'utf8';

$dsn = "mysql:host=$host;dbname=$database;charset=$charset";

	$pdo = new PDO($dsn, $user, $password)
	or die("Ошибка " . mysqli_error($pdo));