<?php
$servername = "http://192.168.171.210/phpmyadmin/";
$username = "joao.pedro";
$password = "J@ao.P3dro";
$dbname = "bd-givas_company";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Conexão falhou: " . $conn->connect_error);
}

$sql = "SELECT nome FROM usuarios WHERE solicitado = 1";
$result = $conn->query($sql);

$data = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($usuarios);
?>
