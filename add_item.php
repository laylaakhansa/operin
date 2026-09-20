<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include 'koneksi.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['title'])) {
    $title       = mysqli_real_escape_string($conn, $data['title']);
    $major_name  = mysqli_real_escape_string($conn, $data['major']);
    $scheme      = mysqli_real_escape_string($conn, $data['type']);
    $price_clean = (int)preg_replace('/[^0-9]/', '', $data['price']);
    $size        = mysqli_real_escape_string($conn, $data['size']);
    $condition   = mysqli_real_escape_string($conn, $data['condition']);
    $minus       = mysqli_real_escape_string($conn, $data['minus']);
    $barter      = mysqli_real_escape_string($conn, $data['barterFor'] ?? '');
    $cod         = mysqli_real_escape_string($conn, $data['cod']);

    $major_query = mysqli_query($conn, "SELECT major_id FROM majors WHERE major_name = '$major_name' LIMIT 1");
    $major_row = mysqli_fetch_assoc($major_query);
    $major_id = $major_row ? $major_row['major_id'] : 1;

    $user_query = mysqli_query($conn, "SELECT user_id FROM users LIMIT 1");
    $user_row = mysqli_fetch_assoc($user_query);
    $seller_id = $user_row ? $user_row['user_id'] : 1;

    $query = "INSERT INTO items (seller_id, major_id, title, scheme, price, size, conditions, minus_notes, barter_target, cod_location, status) 
              VALUES ('$seller_id', '$major_id', '$title', '$scheme', '$price_clean', '$size', '$condition', '$minus', '$barter', '$cod', 'Available')";

    if (mysqli_query($conn, $query)) {
        echo json_encode(['status' => 'success', 'message' => 'Barang berhasil disimpan!']);
    } else {
        echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap']);
}
?>