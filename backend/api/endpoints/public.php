<?php
// ================================================================================================
// File: backend/api/endpoints/public.php
// Deskripsi: Endpoint publik untuk mengambil semua data undangan berdasarkan slug.
// VERSI DIPERBAIKI: Menggabungkan query untuk mengambil template_code secara langsung.
// ================================================================================================

// Memastikan header JSON dan mengizinkan akses dari mana saja (CORS)
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Memasukkan file router yang berisi koneksi database
require_once __DIR__ . '/../router.php'; // Pastikan path ini benar

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Mengambil slug dari path URL, contoh: /api/public/nama-slug
    $request_uri = trim($_SERVER['REQUEST_URI'], '/');
    $parts = explode('/', $request_uri);
    // Asumsi struktur URL adalah .../backend/api/public/slug-undangan
    $slug = end($parts);

    if (!$slug) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Slug undangan tidak disediakan.']);
        exit;
    }

    try {
        // --- PERBAIKAN KUNCI ADA DI QUERY INI ---
        // Kita menggunakan LEFT JOIN ke tabel `templates` untuk langsung mendapatkan `template_code`
        // Ini lebih efisien daripada melakukan 2x query ke database.
        $stmt_invitation = $conn->prepare("
            SELECT 
                i.id, 
                i.user_id, 
                i.invitation_title, 
                i.cover_image, 
                i.background_music, 
                i.section_order,
                t.template_code, -- Langsung ambil template_code dari tabel templates
                u.whatsapp_number, 
                u.instagram_username, 
                u.blog_url
            FROM invitations i
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN templates t ON i.template_id = t.id -- Join tabel templates berdasarkan ID
            WHERE i.slug = :slug
        ");
        $stmt_invitation->bindParam(':slug', $slug);
        $stmt_invitation->execute();
        $invitation_data = $stmt_invitation->fetch(PDO::FETCH_ASSOC);

        if (!$invitation_data) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Undangan tidak ditemukan.']);
            exit;
        }
        
        $id = $invitation_data['id'];
        
        // Decode urutan seksi dari JSON string ke array PHP
        if ($invitation_data['section_order']) {
            $invitation_data['section_order'] = json_decode($invitation_data['section_order']);
        }

        // Siapkan struktur response lengkap
        // Semua query ini aman karena $id didapat dari database, bukan input user langsung
        $response = [
            'invitation' => $invitation_data, // invitation_data sekarang sudah berisi 'template_code'
            'couple' => $conn->query("SELECT * FROM couples WHERE invitation_id = $id")->fetch(PDO::FETCH_ASSOC) ?: null,
            'events' => $conn->query("SELECT * FROM events WHERE invitation_id = $id ORDER BY event_date, start_time ASC")->fetchAll(PDO::FETCH_ASSOC),
            'stories' => $conn->query("SELECT * FROM stories WHERE invitation_id = $id ORDER BY story_year ASC")->fetchAll(PDO::FETCH_ASSOC),
            'galleries' => $conn->query("SELECT * FROM galleries WHERE invitation_id = $id")->fetchAll(PDO::FETCH_ASSOC),
            'gifts' => $conn->query("SELECT * FROM gifts WHERE invitation_id = $id")->fetchAll(PDO::FETCH_ASSOC),
            'rsvps' => $conn->query("SELECT id, guest_name, message, submitted_at FROM rsvps WHERE invitation_id = $id AND attendance_status = 'Hadir' ORDER BY submitted_at DESC LIMIT 50")->fetchAll(PDO::FETCH_ASSOC)
        ];

        http_response_code(200);
        echo json_encode(['status' => 'success', 'data' => $response]);

    } catch (PDOException $e) {
        http_response_code(500);
        // Jangan tampilkan error detail di produksi, cukup log saja
        // error_log('Database Error: ' . $e->getMessage()); 
        echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan pada server.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
}
?>
