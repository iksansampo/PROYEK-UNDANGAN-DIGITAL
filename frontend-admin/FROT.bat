@echo off
setlocal
chcp 65001 > nul

:: =================================================================
:: SKRIP UNTUK MENATA ULANG FOLDER 'src' PADA PROYEK REACT
:: =================================================================
:: Jalankan skrip ini dari dalam folder 'frontend-admin'

echo.
echo  Memulai penataan ulang folder 'src'...
echo  ======================================
echo.

:: Cek apakah folder 'src' ada
if not exist "src" (
    echo [ERROR] Folder 'src' tidak ditemukan.
    echo Pastikan Anda menjalankan skrip ini dari dalam folder 'frontend-admin'.
    goto :eof
)

:: Masuk ke folder src
cd src

:: 1. Hapus file-file default yang tidak diperlukan
echo -- Menghapus file-file default...
if exist "App.test.js" del "App.test.js"
if exist "logo.svg" del "logo.svg"
if exist "reportWebVitals.js" del "reportWebVitals.js"
if exist "setupTests.js" del "setupTests.js"
echo [OK] File default telah dihapus.
echo.

:: 2. Buat struktur folder baru
echo -- Membuat folder-folder baru...
if not exist "components" mkdir components
if not exist "pages" mkdir pages
if not exist "services" mkdir services
echo [OK] Folder 'components', 'pages', dan 'services' siap.
echo.

:: 3. Buat file-file komponen
echo -- Membuat file-file di dalam 'components'...
type nul > "components\GuestModal.js"
type nul > "components\InvitationForm.js"
type nul > "components\RsvpModal.js"
echo [OK] File komponen berhasil dibuat.
echo.

:: 4. Buat file-file halaman
echo -- Membuat file-file di dalam 'pages'...
type nul > "pages\DashboardPage.js"
type nul > "pages\EditInvitationPage.js"
type nul > "pages\LoginPage.js"
echo [OK] File halaman berhasil dibuat.
echo.

:: 5. Buat file service
echo -- Membuat file di dalam 'services'...
type nul > "services\api.js"
echo [OK] File service berhasil dibuat.
echo.

echo  ======================================
echo  Struktur folder 'src' berhasil dibuat sesuai keinginan Anda!
echo.

pause
endlocal
