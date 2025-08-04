<?php
// ================================================================================================
// File: backend/api/endpoints/public.php
// Deskripsi: Endpoint publik untuk mengambil semua data undangan berdasarkan slug.
// Versi Final - Perbaikan untuk memastikan output selalu JSON yang valid.
// ================================================================================================

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $request_parts = explode('/', $_GET['request']);
    $slug = $request_parts[1] ?? null;

    if (!$slug) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Slug undangan tidak ditemukan.']);
        exit;
    }

    try {
        // Query ini menggabungkan semua pengambilan data utama dalam satu langkah berdasarkan SLUG
        $stmt_main = $conn->prepare("
            SELECT 
                i.id, i.user_id, i.invitation_title, i.cover_image, i.background_music, i.section_order,
                t.template_code,
                u.whatsapp_number, 
                u.instagram_username, 
                u.blog_url
            FROM invitations i
            LEFT JOIN templates t ON i.template_id = t.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE i.slug = :slug
        ");
        $stmt_main->bindParam(':slug', $slug);
        $stmt_main->execute();
        $invitation_data = $stmt_main->fetch(PDO::FETCH_ASSOC);

        // Jika data undangan utama tidak ditemukan, hentikan proses
        if (!$invitation_data) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Undangan tidak ditemukan.']);
            exit;
        }
        
        // Ambil ID dari hasil query untuk digunakan mengambil data lainnya
        $id = $invitation_data['id'];
        
        // Ubah string JSON section_order menjadi array PHP
        if ($invitation_data['section_order']) {
            $invitation_data['section_order'] = json_decode($invitation_data['section_order']);
        }

        // Siapkan struktur response
        $response = [
            'invitation' => $invitation_data,
            'couple' => null, 
            'events' => [], 
            'stories' => [], 
            'galleries' => [], 
            'gifts' => [], 
            'rsvps' => []
        ];

        // Ambil data-data terkait lainnya
        $stmt = $conn->prepare("SELECT * FROM couples WHERE invitation_id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $response['couple'] = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $conn->prepare("SELECT * FROM events WHERE invitation_id = :id ORDER BY event_date, start_time ASC");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $response['events'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $conn->prepare("SELECT * FROM stories WHERE invitation_id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $response['stories'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $conn->prepare("SELECT * FROM galleries WHERE invitation_id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $response['galleries'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $conn->prepare("SELECT * FROM gifts WHERE invitation_id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $response['gifts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $conn->prepare("SELECT id, guest_name, message, submitted_at FROM rsvps WHERE invitation_id = :id AND attendance_status = 'Hadir' ORDER BY submitted_at DESC LIMIT 50");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $response['rsvps'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Kirim response final sebagai JSON
        http_response_code(200);
        echo json_encode(['status' => 'success', 'data' => $response]);

    } catch (PDOException $e) {
        // Jika ada error database, kirim sebagai JSON yang valid
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database Error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
}
?>
