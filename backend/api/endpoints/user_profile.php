<?php
// =================================================================================
// File: backend/api/endpoints/user_profile.php
// Deskripsi: API untuk mengelola data profil pengguna (termasuk sosial media).
// =================================================================================

global $conn;

// Pastikan admin sudah login untuk mengakses profilnya
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Akses ditolak. Silakan login.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Mengambil data profil pengguna yang sedang login
        try {
            $stmt = $conn->prepare("SELECT username, whatsapp_number, instagram_username, blog_url FROM users WHERE id = :id");
            $stmt->bindParam(':id', $user_id);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                http_response_code(200);
                echo json_encode(['status' => 'success', 'data' => $user]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Pengguna tidak ditemukan.']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Memperbarui data profil pengguna
        $data = json_decode(file_get_contents("php://input"));
        
        $whatsapp = $data->whatsapp_number ?? null;
        $instagram = $data->instagram_username ?? null;
        $blog = $data->blog_url ?? null;

        try {
            $stmt = $conn->prepare("UPDATE users SET whatsapp_number = :whatsapp, instagram_username = :instagram, blog_url = :blog WHERE id = :id");
            $stmt->bindParam(':whatsapp', $whatsapp);
            $stmt->bindParam(':instagram', $instagram);
            $stmt->bindParam(':blog', $blog);
            $stmt->bindParam(':id', $user_id);
            $stmt->execute();
            
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Profil berhasil diperbarui.']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui profil: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
        break;
}
?>
