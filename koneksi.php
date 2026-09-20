<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "operin"; // disesuaikan dengan database yang ada 5 tabelnya tadi

$conn = mysqli_connect($host, $user, $pass, $db);

if (!$conn) {
    die(json_encode(["status" => "error", "message" => mysqli_connect_error()]));
}
?>