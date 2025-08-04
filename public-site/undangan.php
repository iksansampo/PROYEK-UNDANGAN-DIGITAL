<?php
// ================================================================================================
// File: public-site/undangan.php
// Deskripsi: Entry point untuk halaman undangan publik.
// Bertugas menyisipkan meta tag Open Graph secara dinamis untuk social media preview.
// ================================================================================================

// --- PENGATURAN DASAR ---
// URL dasar ke folder backend Anda. Sesuaikan jika perlu.
$backend_base_url = 'http://' . $_SERVER['HTTP_HOST'] . '/proyek-undangan/backend';
// URL dasar ke halaman undangan saat ini.
$current_page_url = 'http' . (isset($_SERVER['HTTPS']) ? 's' : '') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

// --- DATA DEFAULT JIKA UNDANGAN TIDAK DITEMUKAN ---
$og_title = "Undangan Digital Eksklusif";
$og_description = "Buka undangan untuk melihat detail acara.";
$og_image = $backend_base_url . '/uploads/previews/default_cover.jpg'; // Siapkan gambar default jika perlu

// Ambil slug dari URL yang di-rewrite oleh .htaccess
$slug = isset($_GET['slug']) ? htmlspecialchars($_GET['slug']) : '';

if (!empty($slug)) {
    // Buat URL API untuk mengambil data undangan
    $api_url = $backend_base_url . '/api/public/' . $slug;

    // Ambil data dari API. @file_get_contents digunakan untuk menekan warning jika API gagal.
    // Pastikan 'allow_url_fopen' aktif di php.ini Anda.
    $json_data = @file_get_contents($api_url);

    if ($json_data !== false) {
        $data = json_decode($json_data, true);

        // Jika API berhasil dan data ditemukan
        if (isset($data['status']) && $data['status'] === 'success' && !empty($data['data'])) {
            $invitation = $data['data']['invitation'];
            $couple = $data['data']['couple'];

            // Ganti data default dengan data dari API
            $og_title = htmlspecialchars($invitation['invitation_title']);
            $og_description = "Undangan Pernikahan dari " . htmlspecialchars($couple['groom_name']) . " & " . htmlspecialchars($couple['bride_name']);
            
            if (!empty($invitation['cover_image'])) {
                $og_image = $backend_base_url . '/' . htmlspecialchars($invitation['cover_image']);
            }
        }
    }
}

// --- BUAT BLOK META TAG ---
// Ini adalah blok HTML yang akan disisipkan ke placeholder di index.html
$meta_tags_html = '
    <meta property="og:title" content="' . $og_title . '">
    <meta property="og:description" content="' . $og_description . '">
    <meta property="og:image" content="' . $og_image . '">
    <meta property="og:url" content="' . $current_page_url . '">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
';

// Baca konten file index.html
$html_template = file_get_contents('index.html');

// Ganti placeholder dengan blok meta tag yang sudah dibuat
$final_html = str_replace('<!-- META_TAGS_PLACEHOLDER -->', $meta_tags_html, $html_template);

// Tampilkan HTML final ke browser
echo $final_html;

?>
