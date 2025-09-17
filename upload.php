<?php
// Configuração do banco
include ('config.php');

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}

// Verifica se usuário e senha foram enviados
if (!isset($_POST['usuario']) || !isset($_POST['senha'])) {
    die("É necessário informar usuário e senha.");
}

$usuario = $_POST['usuario'];
$senha = $_POST['senha'];

// Consulta no banco
$stmt = $conn->prepare("SELECT * FROM enviar WHERE usuario=? AND senha=? LIMIT 1");
$stmt->bind_param("ss", $usuario, $senha);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die("Usuário ou senha inválidos.");
}

// Se passou na autenticação, verifica se enviou arquivo
if (isset($_FILES['jsonFile']) && $_FILES['jsonFile']['error'] == 0) {
    $jsonContent = file_get_contents($_FILES['jsonFile']['tmp_name']);
    $data = json_decode($jsonContent, true);

    if ($data === null) {
        die("JSON inválido.");
    }

    // Salvar actions
    if (isset($data['actions'])) {
        foreach ($data['actions'] as $action) {
            $stmt = $conn->prepare("INSERT INTO actions (action) VALUES (?)");
            $stmt->bind_param("s", $action);
            $stmt->execute();
        }
    }

    // Salvar bandas e músicas
    if (isset($data['bands'])) {
        foreach ($data['bands'] as $band) {
            $artist = $band['artist'];
            $stmt = $conn->prepare("INSERT INTO bands (artist) VALUES (?)");
            $stmt->bind_param("s", $artist);
            $stmt->execute();
            $band_id = $stmt->insert_id;

            if (isset($band['songs'])) {
                foreach ($band['songs'] as $song) {
                    $title = $song['title'];
                    $stmt2 = $conn->prepare("INSERT INTO songs (band_id, title) VALUES (?, ?)");
                    $stmt2->bind_param("is", $band_id, $title);
                    $stmt2->execute();
                }
            }
        }
    }

    echo "JSON importado com sucesso!";
} else {
    echo "Erro ao enviar o arquivo.";
}

$conn->close();
?>
