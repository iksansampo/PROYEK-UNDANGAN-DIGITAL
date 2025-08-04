<?php
// =================================================================
// File: generate_hash.php
// Deskripsi: Skrip sekali pakai untuk membuat hash password yang benar.
// =================================================================

// Password yang ingin Anda enkripsi
$plain_password = 'admin123';

// Membuat hash menggunakan algoritma default dan teraman
$hashed_password = password_hash($plain_password, PASSWORD_DEFAULT);

// Menampilkan hasilnya di layar agar bisa disalin
echo "<h1>Password Hash Generator</h1>";
echo "<p>Gunakan hash di bawah ini untuk memperbarui database Anda.</p>";
echo "<hr>";
echo "<p><b>Password Asli:</b> " . htmlspecialchars($plain_password) . "</p>";
echo "<p><b>Hash yang Dihasilkan:</b></p>";
echo "<pre style='background-color:#f0f0f0; padding:10px; border:1px solid #ccc; word-wrap:break-word;'>" . htmlspecialchars($hashed_password) . "</pre>";

?>
