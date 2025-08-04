 
<?php
// ================================================================================================
// File: backend/config/database.php
// Deskripsi: File konfigurasi untuk koneksi ke database MySQL.
// ================================================================================================

// Mengatur header untuk response JSON dan kebijakan CORS (Cross-Origin Resource Sharing)
// Ini penting agar React (yang berjalan di domain/port berbeda) bisa berkomunikasi dengan API PHP ini.
header("Access-Control-Allow-Origin: *"); // Izinkan akses dari mana saja. Untuk produksi, ganti '*' dengan domain frontend Anda.
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Tangani preflight request (OPTIONS) yang dikirim browser sebelum request sebenarnya.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Pengaturan Koneksi Database ---
$host = "localhost";      // Biasanya "localhost" atau "127.0.0.1"
$db_name = "digi_db";     // Nama database yang sudah Anda buat
$username = "root";       // Username database Anda (default XAMPP adalah "root")
$password = "";           // Password database Anda (default XAMPP kosong)
$conn = null;

try {
    // Membuat objek koneksi PDO (PHP Data Objects)
    // PDO adalah cara yang lebih aman dan modern untuk berinteraksi dengan database
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
    
    // Mengatur error mode PDO ke exception.
    // Ini berarti jika ada error SQL, PDO akan melempar sebuah exception yang bisa kita tangkap.
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Mengatur mode pengambilan data default ke associative array.
    // Ini membuat hasil query lebih mudah dibaca (e.g., $row['nama_kolom']).
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch(PDOException $exception) {
    // Jika koneksi gagal, hentikan script dan tampilkan pesan error dalam format JSON.
    http_response_code(503); // Service Unavailable
    echo json_encode(
        array("status" => "error", "message" => "Koneksi ke database gagal: " . $exception->getMessage())
    );
    exit(); // Hentikan eksekusi lebih lanjut
}

// Catatan: Variabel $conn sekarang siap digunakan oleh file-file API lainnya
// dengan cara meng-include file ini.
?>
