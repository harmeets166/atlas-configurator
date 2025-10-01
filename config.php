<?php
// config.php - Database Configuration
$host = 'localhost';
$dbname = 'split_camera_config';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed.']));
}

date_default_timezone_set('UTC');
?>