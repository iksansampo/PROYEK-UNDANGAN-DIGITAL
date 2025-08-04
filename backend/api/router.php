 <?php

// Izinkan permintaan dari React App Anda
header("Access-Control-Allow-Origin: http://localhost:3000");
// Izinkan metode HTTP yang umum digunakan
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// Izinkan header kustom yang mungkin dikirim oleh Axios
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Jika permintaan adalah OPTIONS (pre-flight check oleh browser), hentikan eksekusi.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}
// ================================================================================================
// File: backend/api/router.php
// Deskripsi: Router utama yang menerima semua request API dan mengarahkannya ke file endpoint yang sesuai.
// ================================================================================================

// Memasukkan file konfigurasi database.
// Ini akan menyediakan variabel $conn untuk digunakan di semua endpoint.
require_once __DIR__ . '/../config/database.php';

// Memulai session untuk menangani autentikasi admin.
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Mengambil path request dari query string yang diatur oleh .htaccess
$request_uri = isset($_GET['request']) ? $_GET['request'] : '';
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', $path);

// Menentukan resource utama yang diminta (cth: 'invitations', 'guests', 'login')
$resource = $path_parts[0] ?? null;

// Routing logic: Arahkan ke file yang sesuai berdasarkan resource
switch ($resource) {
    case 'login':
    case 'logout':
    case 'check-session':
        require __DIR__ . '/endpoints/auth.php';
        break;

        case 'templates': // <-- TAMBAHKAN CASE INI
        require __DIR__ . '/endpoints/templates.php';
        break;

    case 'invitations':
        require __DIR__ . '/endpoints/invitations.php';
        break;

   // Ganti dengan blok case 'guests' yang baru
case 'guests':
    $is_post_method = ($_SERVER['REQUEST_METHOD'] === 'POST');
    $is_import_request = (isset($path_parts[1]) && $path_parts[1] === 'import');

    // Jika ini adalah request POST ke /guests/import
    if ($is_post_method && $is_import_request) {
        require __DIR__ . '/endpoints/guests_import_json.php';
    } else {
        // Untuk request lainnya (GET, POST tambah manual, DELETE)
        require __DIR__ . '/endpoints/guests.php';
    }
    break;


        
    case 'rsvps':
        require __DIR__ . '/endpoints/rsvps.php';
        break;

    case 'upload':
        require __DIR__ . '/endpoints/upload.php';
        break;

        // --- TAMBAHKAN BLOK BARU INI ---
    case 'templates':
        require_once __DIR__ . '/endpoints/templates.php';
        break;

        case 'user-profile':
        require_once __DIR__ . '/endpoints/user_profile.php';
        break;

    // Endpoint khusus untuk halaman publik, tidak memerlukan login
    case 'public':
        require __DIR__ . '/endpoints/public.php';
        break;

// ... (kode switch case Anda) ...
    default:
        // Jika resource tidak ditemukan, kirim response 404 Not Found
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Endpoint tidak ditemukan.']);
        break;
}

// PASTIKAN TIDAK ADA KURUNG KURAWAL '}' LAGI DI BAWAH BARIS INI

