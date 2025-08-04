 <?php
// ================================================================================================
// File: backend/api/endpoints/guests.php
// Deskripsi: API untuk mengelola tamu (tambah, hapus, impor, lihat).
// ================================================================================================

global $conn;

// Cek sesi admin
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Akses ditolak. Silakan login.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$request_parts = explode('/', $_GET['request']);
$invitation_id = $request_parts[1] ?? null;
$guest_id = $request_parts[2] ?? null;

// Fungsi bantuan untuk membuat parameter link unik
// --- PERBAIKAN DIMULAI DI SINI ---

// Ganti fungsi lama Anda (jika ada) dengan yang ini.
// Atau pastikan logika pembuatan $unique_link_param menggunakan cara ini.
function createCleanLinkParam($name) {
    // Menghapus karakter selain huruf, angka, dan spasi
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9\s&]+/', '', $name)));
    // Mengganti spasi atau simbol '&' dengan tanda hubung
    $slug = preg_replace('/[\s&]+/', '-', $slug);
    return $slug;
}



// --- PERBAIKAN SELESAI ---


switch ($method) {
    case 'GET':
        if (!$invitation_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID Undangan diperlukan.']);
            exit;
        }
        try {
            $stmt = $conn->prepare("SELECT id, guest_name, unique_link_param FROM guests WHERE invitation_id = :id ORDER BY guest_name ASC");
            $stmt->bindParam(':id', $invitation_id);
            $stmt->execute();
            $guests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode(['status' => 'success', 'data' => $guests]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Cek apakah ini request impor file
        if (isset($_POST['action']) && $_POST['action'] == 'import') {
             if (!isset($_POST['invitation_id']) || !isset($_FILES['file'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap untuk impor.']);
                exit;
            }
            
            $inv_id = $_POST['invitation_id'];
            $file = $_FILES['file'];
            $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowed_ext = ['txt', 'csv']; // .xlsx memerlukan library khusus

            if (!in_array($file_ext, $allowed_ext)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Format file tidak didukung. Gunakan .txt atau .csv.']);
                exit;
            }

            $names = file($file['tmp_name'], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($file_ext == 'csv') {
                // Asumsi CSV hanya satu kolom nama
                $csv_data = array_map('str_getcsv', $names);
                $names = array_column($csv_data, 0);
            }

            $conn->beginTransaction();
            try {
                $stmt = $conn->prepare("INSERT INTO guests (invitation_id, guest_name, unique_link_param) VALUES (?, ?, ?)");
                foreach ($names as $name) {
                    $name = trim($name);
                    if (!empty($name)) {
                        $stmt->execute([$inv_id, $name, createUniqueLinkParam($name)]);
                    }
                }
                $conn->commit();
                http_response_code(200);
                echo json_encode(['status' => 'success', 'message' => count($names) . ' tamu berhasil diimpor.']);
            } catch (Exception $e) {
                $conn->rollBack();
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Gagal impor tamu: ' . $e->getMessage()]);
            }
            exit;
        }

        // Proses tambah tamu manual
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->invitation_id) || !isset($data->guest_name)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap.']);
            exit;
        }

        try {
            $stmt = $conn->prepare("INSERT INTO guests (invitation_id, guest_name, unique_link_param) VALUES (?, ?, ?)");
            $unique_param = createCleanLinkParam($data->guest_name);
            $stmt->execute([$data->invitation_id, $data->guest_name, $unique_param]);
            $new_guest_id = $conn->lastInsertId();

            http_response_code(201);
            echo json_encode([
                'status' => 'success', 
                'message' => 'Tamu berhasil ditambahkan.',
                'data' => [
                    'id' => $new_guest_id,
                    'guest_name' => $data->guest_name,
                    'unique_link_param' => $unique_param
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (!$invitation_id || !$guest_id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ID Undangan dan ID Tamu diperlukan.']);
            exit;
        }
        try {
            $stmt = $conn->prepare("DELETE FROM guests WHERE id = ? AND invitation_id = ?");
            $stmt->execute([$guest_id, $invitation_id]);
            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(['status' => 'success', 'message' => 'Tamu berhasil dihapus.']);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Tamu tidak ditemukan.']);
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

