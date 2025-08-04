 <?php
// ================================================================================================
// File: backend/api/endpoints/upload.php
// Deskripsi: Menangani upload file (gambar sampul, foto mempelai, galeri).
// ================================================================================================

// Cek sesi admin
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Akses ditolak. Silakan login terlebih dahulu.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_FILES['file'])) {
        $file = $_FILES['file'];

        // Validasi error upload
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Terjadi error saat upload file. Kode: ' . $file['error']]);
            exit;
        }

        $uploadDir = __DIR__ . '/../../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Buat nama file yang unik untuk menghindari tumpang tindih
        $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $uniqueName = uniqid('img_', true) . '.' . strtolower($fileExtension);
        $uploadPath = $uploadDir . $uniqueName;

        // Pindahkan file yang di-upload ke folder 'uploads'
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            // Mengembalikan path relatif yang akan disimpan di database
            $relativePath = 'uploads/' . $uniqueName;
            http_response_code(200);
            echo json_encode(['status' => 'success', 'filePath' => $relativePath]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Gagal memindahkan file yang di-upload.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Tidak ada file yang dikirim.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan. Gunakan POST.']);
}
?>
