<?php
// File: backend/api/endpoints/rsvps.php
// Deskripsi: Versi final yang menggabungkan logika untuk Publik (Live), Admin (Lihat/Ekspor), dan Pengiriman RSVP.

global $conn;
$method = $_SERVER['REQUEST_METHOD'];

// --- LOGIKA UNTUK METHOD POST (Saat Tamu Mengirim RSVP) ---
if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['invitation_id']) || !isset($data['guest_name']) || !isset($data['attendance_status'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Data RSVP tidak lengkap.']);
        exit;
    }

    try {
        $stmt = $conn->prepare("INSERT INTO rsvps (invitation_id, guest_name, attendance_status, message) VALUES (:inv_id, :g_name, :a_status, :msg)");
        $stmt->execute([
            ':inv_id' => $data['invitation_id'],
            ':g_name' => $data['guest_name'],
            ':a_status' => $data['attendance_status'],
            ':msg' => $data['message'] ?? null
        ]);
        
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Terima kasih atas konfirmasinya!']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan RSVP: ' . $e->getMessage()]);
    }
    exit;
}


// --- LOGIKA UNTUK METHOD GET (Bisa untuk Publik atau Admin) ---
if ($method == 'GET') {
    $request_parts = explode('/', $_GET['request'] ?? '');
    $invitation_id = $request_parts[1] ?? null;

    // Cek apakah ini adalah request dari admin yang sudah login
    if (isset($_SESSION['user_id'])) {
        // Logika untuk mengambil semua RSVP untuk ditampilkan di modal Admin
        try {
            $stmt = $conn->prepare("SELECT id, guest_name, attendance_status, message, submitted_at FROM rsvps WHERE invitation_id = :id ORDER BY submitted_at DESC");
            $stmt->bindParam(':id', $invitation_id);
            $stmt->execute();
            $rsvps = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $recap = ['Hadir' => 0, 'Tidak Hadir' => 0, 'Ragu' => 0];
            foreach ($rsvps as $rsvp) {
                if (isset($recap[$rsvp['attendance_status']])) {
                    $recap[$rsvp['attendance_status']]++;
                }
            }
            http_response_code(200);
            echo json_encode(['status' => 'success', 'data' => $rsvps, 'recap' => $recap]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    // Jika bukan dari admin, maka ini adalah request dari halaman publik untuk Live RSVP
    $latest_timestamp = $_GET['latest_timestamp'] ?? null;
    try {
        if ($latest_timestamp) {
            $sql = "SELECT id, guest_name, message, submitted_at FROM rsvps WHERE invitation_id = :id AND attendance_status = 'Hadir' AND submitted_at > :ts ORDER BY submitted_at ASC";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':ts', $latest_timestamp);
        } else {
            $sql = "SELECT id, guest_name, message, submitted_at FROM rsvps WHERE invitation_id = :id AND attendance_status = 'Hadir' ORDER BY submitted_at DESC LIMIT 50";
            $stmt = $conn->prepare($sql);
        }
        $stmt->bindParam(':id', $invitation_id, PDO::PARAM_INT);
        $stmt->execute();
        $rsvps = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$latest_timestamp && count($rsvps) > 0) {
            $rsvps = array_reverse($rsvps);
        }
        http_response_code(200);
        echo json_encode(['status' => 'success', 'data' => $rsvps]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// Jika method tidak diizinkan
http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
?>
