<?php
// ================================================================================================
// File: backend/api/endpoints/invitations.php
// Deskripsi: API lengkap untuk CRUD (Create, Read, Update, Delete) data undangan.
// Versi ini telah diperbaiki sepenuhnya untuk mengatasi semua error.
// ================================================================================================

global $conn;

// Cek sesi admin untuk semua operasi kecuali GET publik
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
     if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Akses ditolak. Silakan login.']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$request_parts = explode('/', $_GET['request']);
$id = $request_parts[1] ?? null;

// Fungsi bantuan untuk membersihkan slug
function createSlug($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    if (empty($text)) {
        return 'n-a-' . uniqid();
    }
    return $text;
}

switch ($method) {
    case 'GET':
        if ($id) {
            // Mengambil detail satu undangan untuk form edit
            try {
                $response = ['invitation' => null, 'couple' => null, 'events' => [], 'stories' => [], 'galleries' => [], 'gifts' => []];

                $stmt = $conn->prepare("SELECT * FROM invitations WHERE id = :id AND user_id = :user_id");
                $stmt->execute([':id' => $id, ':user_id' => $_SESSION['user_id']]);
                $response['invitation'] = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if(!$response['invitation']) {
                    http_response_code(404);
                    echo json_encode(['status' => 'error', 'message' => 'Undangan tidak ditemukan atau Anda tidak memiliki hak akses.']);
                    exit;
                }
                $response['invitation']['section_order'] = json_decode($response['invitation']['section_order']);

                // Ambil data dari tabel-tabel terkait
                $stmt_couple = $conn->prepare("SELECT * FROM couples WHERE invitation_id = :id");
                $stmt_couple->execute([':id' => $id]);
                $response['couple'] = $stmt_couple->fetch(PDO::FETCH_ASSOC);

                $stmt_events = $conn->prepare("SELECT * FROM events WHERE invitation_id = :id");
                $stmt_events->execute([':id' => $id]);
                $response['events'] = $stmt_events->fetchAll(PDO::FETCH_ASSOC);

                $stmt_stories = $conn->prepare("SELECT * FROM stories WHERE invitation_id = :id");
                $stmt_stories->execute([':id' => $id]);
                $response['stories'] = $stmt_stories->fetchAll(PDO::FETCH_ASSOC);

                $stmt_galleries = $conn->prepare("SELECT * FROM galleries WHERE invitation_id = :id");
                $stmt_galleries->execute([':id' => $id]);
                $response['galleries'] = $stmt_galleries->fetchAll(PDO::FETCH_ASSOC);

                $stmt_gifts = $conn->prepare("SELECT * FROM gifts WHERE invitation_id = :id");
                $stmt_gifts->execute([':id' => $id]);
                $response['gifts'] = $stmt_gifts->fetchAll(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode(['status' => 'success', 'data' => $response]);

            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
        } else {
            // Mengambil daftar semua undangan untuk dashboard
            try {
                $stmt = $conn->prepare("SELECT i.id, i.invitation_title, c.groom_name, c.bride_name, i.slug FROM invitations i LEFT JOIN couples c ON i.id = c.invitation_id WHERE i.user_id = :user_id ORDER BY i.created_at DESC");
                $stmt->bindParam(':user_id', $_SESSION['user_id']);
                $stmt->execute();
                $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                http_response_code(200);
                echo json_encode(['status' => 'success', 'data' => $invitations]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        // LOGIKA YANG BENAR UNTUK MEMBUAT UNDANGAN BARU
        $data = json_decode(file_get_contents("php://input"), true);
        
        $conn->beginTransaction();
        try {
            $slug = createSlug($data['couple']['groom_name'] . '-dan-' . $data['couple']['bride_name']) . '-' . uniqid();
            $template_id_input = $data['invitation']['template_id'] ?? null;
            $template_id_to_insert = (is_numeric($template_id_input) && $template_id_input > 0) ? (int)$template_id_input : null;

            $stmt = $conn->prepare("INSERT INTO invitations (user_id, slug, invitation_title, cover_image, background_music, template_id, section_order) VALUES (:user_id, :slug, :title, :cover, :music, :template_id, :order)");
            $stmt->execute([
                ':user_id' => $_SESSION['user_id'],
                ':slug' => $slug,
                ':title' => $data['invitation']['invitation_title'],
                ':cover' => $data['invitation']['cover_image'] ?? null,
                ':music' => $data['invitation']['background_music'] ?? null,
                ':template_id' => $template_id_to_insert,
                ':order' => json_encode($data['invitation']['section_order'])
            ]);
            $invitation_id = $conn->lastInsertId();

            if (!$invitation_id) throw new Exception("Gagal membuat entri di tabel invitations.");

            $stmt = $conn->prepare("INSERT INTO couples (invitation_id, groom_name, groom_father, groom_mother, groom_photo, bride_name, bride_father, bride_mother, bride_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$invitation_id, $data['couple']['groom_name'], $data['couple']['groom_father'], $data['couple']['groom_mother'], $data['couple']['groom_photo'] ?? null, $data['couple']['bride_name'], $data['couple']['bride_father'], $data['couple']['bride_mother'], $data['couple']['bride_photo'] ?? null]);

            if (!empty($data['events'])) {
                $stmt_events = $conn->prepare("INSERT INTO events (invitation_id, event_name, event_date, start_time, end_time, location_name, address, maps_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['events'] as $event) {$stmt_events->execute([$invitation_id, $event['event_name'], $event['event_date'], $event['start_time'], $event['end_time'] ?? null, $event['location_name'], $event['address'] ?? '', $event['maps_url'] ?? null]); }
            }
            if (!empty($data['stories'])) {
                $stmt_stories = $conn->prepare("INSERT INTO stories (invitation_id, story_year, story_title, story_description) VALUES (?, ?, ?, ?)");
                foreach ($data['stories'] as $story) { $stmt_stories->execute([$invitation_id, $story['story_year'], $story['story_title'], $story['story_description']]); }
            }
            if (!empty($data['galleries'])) {
                $stmt_galleries = $conn->prepare("INSERT INTO galleries (invitation_id, media_type, media_url) VALUES (?, ?, ?)");
                foreach ($data['galleries'] as $gallery) { $stmt_galleries->execute([$invitation_id, $gallery['media_type'], $gallery['media_url']]); }
            }
            if (!empty($data['gifts'])) {
                $stmt_gifts = $conn->prepare("INSERT INTO gifts (invitation_id, bank_name, account_number, account_holder_name) VALUES (?, ?, ?, ?)");
                foreach ($data['gifts'] as $gift) { $stmt_gifts->execute([$invitation_id, $gift['bank_name'], $gift['account_number'], $gift['account_holder_name']]); }
            }

            $conn->commit();
            http_response_code(201);
            echo json_encode(['status' => 'success', 'message' => 'Undangan berhasil dibuat.', 'id' => $invitation_id]);

        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Gagal membuat undangan: ' . $e->getMessage()]);
        }
        break;

    case 'PUT':
        // LOGIKA YANG BENAR UNTUK MEMPERBARUI UNDANGAN
        if (!$id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID Undangan diperlukan.']);
            exit;
        }
        $data = json_decode(file_get_contents("php://input"), true);

        $conn->beginTransaction();
        try {
            $template_id_input = $data['invitation']['template_id'] ?? null;
            $template_id_to_insert = (is_numeric($template_id_input) && $template_id_input > 0) ? (int)$template_id_input : null;

            $stmt = $conn->prepare("UPDATE invitations SET invitation_title = :title, cover_image = :cover, background_music = :music, template_id = :template_id, section_order = :order WHERE id = :id AND user_id = :user_id");
            $stmt->execute([
                ':title' => $data['invitation']['invitation_title'],
                ':cover' => $data['invitation']['cover_image'] ?? null,
                ':music' => $data['invitation']['background_music'] ?? null,
                ':template_id' => $template_id_to_insert,
                ':order' => json_encode($data['invitation']['section_order']),
                ':id' => $id,
                ':user_id' => $_SESSION['user_id']
            ]);

            $stmt = $conn->prepare("UPDATE couples SET groom_name=?, groom_father=?, groom_mother=?, groom_photo=?, bride_name=?, bride_father=?, bride_mother=?, bride_photo=? WHERE invitation_id = ?");
            $stmt->execute([$data['couple']['groom_name'], $data['couple']['groom_father'], $data['couple']['groom_mother'], $data['couple']['groom_photo'] ?? null, $data['couple']['bride_name'], $data['couple']['bride_father'], $data['couple']['bride_mother'], $data['couple']['bride_photo'] ?? null, $id]);

            $tables_to_reset = ['events', 'stories', 'galleries', 'gifts'];
            foreach ($tables_to_reset as $table) {
                $stmt_delete = $conn->prepare("DELETE FROM $table WHERE invitation_id = ?");
                $stmt_delete->execute([$id]);
            }
            
            if (!empty($data['events'])) {
                $stmt_events = $conn->prepare("INSERT INTO events (invitation_id, event_name, event_date, start_time, end_time, location_name, address, maps_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['events'] as $event) { $stmt_events->execute([$id, $event['event_name'], $event['event_date'], $event['start_time'], $event['end_time'] ?? null, $event['location_name'], $event['address'] ?? '', $event['maps_url'] ?? null]); }
            }
            if (!empty($data['stories'])) {
                $stmt_stories = $conn->prepare("INSERT INTO stories (invitation_id, story_year, story_title, story_description) VALUES (?, ?, ?, ?)");
                foreach ($data['stories'] as $story) { $stmt_stories->execute([$id, $story['story_year'], $story['story_title'], $story['story_description']]); }
            }
            if (!empty($data['galleries'])) {
                $stmt_galleries = $conn->prepare("INSERT INTO galleries (invitation_id, media_type, media_url) VALUES (?, ?, ?)");
                foreach ($data['galleries'] as $gallery) { $stmt_galleries->execute([$id, $gallery['media_type'], $gallery['media_url']]); }
            }
            if (!empty($data['gifts'])) {
                $stmt_gifts = $conn->prepare("INSERT INTO gifts (invitation_id, bank_name, account_number, account_holder_name) VALUES (?, ?, ?, ?)");
                foreach ($data['gifts'] as $gift) { $stmt_gifts->execute([$id, $gift['bank_name'], $gift['account_number'], $gift['account_holder_name']]); }
            }
            
            $conn->commit();
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Undangan berhasil diperbarui.']);

        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui undangan: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID Undangan diperlukan.']);
            exit;
        }
        try {
            $stmt = $conn->prepare("DELETE FROM invitations WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $_SESSION['user_id']]);
            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(['status' => 'success', 'message' => 'Undangan berhasil dihapus.']);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Undangan tidak ditemukan atau Anda tidak punya hak akses.']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method tidak diizinkan.']);
        break;
}
?>
