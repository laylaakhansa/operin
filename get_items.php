<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include 'koneksi.php';

// Mengambil data barang sekaligus nama jurusannya
$sql = "SELECT i.*, m.major_name 
        FROM items i 
        LEFT JOIN majors m ON i.major_id = m.major_id 
        ORDER BY i.created_at DESC";

$result = mysqli_query($conn, $sql);

if (!$result) {
    echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
    exit;
}

$items = [];
while ($row = mysqli_fetch_assoc($result)) {
    $items[] = [
        'id'          => (int)$row['item_id'],
        'title'       => $row['title'],
        'major'       => $row['major_name'] ?? 'Umum', // Menggunakan nama jurusan teks asli
        'type'        => $row['scheme'],
        'price'       => ($row['price'] == 0) ? 'Rp0' : 'Rp' . number_format($row['price'], 0, ',', '.'),
        'size'        => $row['size'],
        'condition'   => $row['conditions'],
        'minus'       => $row['minus_notes'],
        'barterFor'   => $row['barter_target'] ?? '',
        'cod'         => $row['cod_location'],
        'seller'      => 'Siswa',
        'sellerGrade' => '',
        'sellerPhone' => '',
        'photoUrl'    => $row['photo_url'],
        'icon'        => $row['icon_emoji'] ?? '📦',
        'isBooked'    => ($row['status'] !== 'Available')
    ];
}

echo json_encode($items);
?>