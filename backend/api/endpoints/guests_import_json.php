<?php
// ================================================================================================
// File: backend/api/endpoints/guests_import_json.php
// Deskripsi: Menangani impor tamu dari data JSON yang diproses dari file Excel di frontend.
// ================================================================================================

global $conn;

// Cek sesi admin
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Akses ditolak. Silakan login.']);
    exit;
}

// Fungsi bantuan untuk membuat parameter link unik
// Ganti dengan fungsi yang lebih sederhana ini
function createCleanLinkParam($name) {
    // Menghapus karakter selain huruf, angka, dan spasi
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9\s&]+/', '', $name)));
    // Mengganti spasi atau simbol '&' dengan tanda hubung
    $slug = preg_replace('/[\s&]+/', '-', $slug);
    return $slug;
}





if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Ganti dengan validasi dan pengambilan data yang sudah disesuaikan
if (!isset($data['invitation_id']) || !isset($data['guests']) || !is_array($data['guests'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap. Key "invitation_id" dan "guests" (array) dibutuhkan.']);
    exit;
}

$inv_id = $data['invitation_id'];
$guest_list = $data['guests'];

    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare("INSERT INTO guests (invitation_id, guest_name, unique_link_param) VALUES (?, ?, ?)");
        $importedCount = 0;
        foreach ($guest_list as $name) {
            $name = trim($name);
            if (!empty($name)) {
                $stmt->execute([$inv_id, $name, createCleanLinkParam($name)]);
                $importedCount++;
            }
        }
        $conn->commit();
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => $importedCount . ' tamu berhasil diimpor.']);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal impor tamu: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
}
?>
