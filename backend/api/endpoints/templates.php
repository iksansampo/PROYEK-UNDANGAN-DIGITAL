<?php
// ================================================================================================
// File: backend/api/endpoints/templates.php
// Deskripsi: API untuk mengambil daftar template yang tersedia.
// ================================================================================================

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

// Endpoint ini bersifat publik (atau setidaknya bisa diakses oleh admin yang login)
// dan hanya untuk membaca data (GET).
if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT id, template_name, template_code, preview_image FROM templates ORDER BY template_name ASC");
        $stmt->execute();
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(['status' => 'success', 'data' => $templates]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data template: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
}
?>
