<?php
// ================================================================================================
// File: backend/api/endpoints/auth.php
// Deskripsi: Menangani login, logout, dan pengecekan sesi admin.
// ================================================================================================

// Variabel $conn dan $resource didapat dari router.php yang meng-include file ini.
global $conn, $resource;

// Mendapatkan method request (POST, GET, etc.)
$method = $_SERVER['REQUEST_METHOD'];

// Routing logic berdasarkan resource yang sudah ditentukan oleh router.php
switch ($resource) {
    case 'login':
        if ($method == 'POST') {
            $data = json_decode(file_get_contents("php://input"));

            if (!isset($data->username) || !isset($data->password)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Username dan password harus diisi.']);
                exit;
            }

            try {
                $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = :username");
                $stmt->bindParam(':username', $data->username);
                $stmt->execute();

                if ($stmt->rowCount() > 0) {
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    if (password_verify($data->password, $user['password'])) {
                        // Regenerate session ID untuk keamanan
                        session_regenerate_id(true);
                        $_SESSION['user_id'] = $user['id'];
                        $_SESSION['username'] = $user['username'];
                        http_response_code(200);
                        echo json_encode(['status' => 'success', 'message' => 'Login berhasil.']);
                    } else {
                        http_response_code(401);
                        echo json_encode(['status' => 'error', 'message' => 'Username atau Password salah.']);
                    }
                } else {
                    http_response_code(401); // Gunakan 401 untuk username tidak ditemukan juga
                    echo json_encode(['status' => 'error', 'message' => 'Username atau Password salah.']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            http_response_code(405); // Method Not Allowed
            echo json_encode(['status' => 'error', 'message' => 'Method GET tidak diizinkan untuk /login.']);
        }
        break;

    case 'logout':
        if ($method == 'POST') {
            session_unset();
            session_destroy();
            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Logout berhasil.']);
        } else {
             http_response_code(405);
             echo json_encode(['status' => 'error', 'message' => 'Method GET tidak diizinkan untuk /logout.']);
        }
        break;

    case 'check-session':
        if ($method == 'GET') {
            if (isset($_SESSION['user_id'])) {
                http_response_code(200);
                echo json_encode(['status' => 'success', 'loggedIn' => true, 'username' => $_SESSION['username']]);
            } else {
                http_response_code(200);
                echo json_encode(['status' => 'success', 'loggedIn' => false]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method POST tidak diizinkan untuk /check-session.']);
        }
        break;

    default:
        // Ini seharusnya tidak terjadi karena sudah ditangani router, tapi sebagai fallback
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Endpoint auth tidak valid.']);
        break;
}

// Tidak ada kurung kurawal penutup '}' di akhir file
?>
