<?php
header('Content-Type: application/json; charset=utf-8');

include ('config.php');

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    echo json_encode(['error' => $conn->connect_error]);
    exit;
}
$conn->set_charset("utf8mb4");

// Parâmetros
$page   = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$letter = isset($_GET['letter']) ? $_GET['letter'] : 'all';
$artist = isset($_GET['artist']) ? trim($_GET['artist']) : '';
$song   = isset($_GET['song']) ? trim($_GET['song']) : '';
$limit  = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 20;
$offset = ($page - 1) * $limit;

// Filtros
$where = [];
if ($letter && $letter !== 'all') {
    $where[] = "b.artist LIKE '" . $conn->real_escape_string($letter) . "%'";
}
if ($artist) {
    $artist_esc = $conn->real_escape_string($artist);
    $where[] = "b.artist LIKE '%$artist_esc%'";
}
if ($song) {
    $song_esc = $conn->real_escape_string($song);
    $where[] = "s.title LIKE '%$song_esc%'";
}
$whereSQL = $where ? "WHERE " . implode(' AND ', $where) : "";

// Contar total de bandas
$countSQL = "
    SELECT COUNT(DISTINCT b.id) AS total
    FROM bands b
    LEFT JOIN songs s ON b.id = s.band_id
    $whereSQL
";
$res = $conn->query($countSQL);
$totalRecords = $res ? intval($res->fetch_assoc()['total']) : 0;
$totalPages = $limit > 0 ? ceil($totalRecords / $limit) : 1;

// Selecionar artistas e músicas
$sql = "
    SELECT b.id, b.artist, GROUP_CONCAT(s.title SEPARATOR '||') AS songs
    FROM bands b
    LEFT JOIN songs s ON b.id = s.band_id
    $whereSQL
    GROUP BY b.id
    ORDER BY b.artist ASC
    LIMIT $limit OFFSET $offset
";
$result = $conn->query($sql);

$bands = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $songs = [];
        if ($row['songs']) {
            $allSongs = explode('||', $row['songs']);

            // Se filtrou por música, mantém só as músicas que batem com o filtro
            if ($song) {
                $allSongs = array_filter($allSongs, function($title) use ($song) {
                    return stripos($title, $song) !== false;
                });
            }

            $songs = array_map(fn($title) => ['title' => $title], $allSongs);
        }

        // Só adiciona a banda se ainda restar alguma música
        if (!$song || !empty($songs)) {
            $bands[] = [
                'artist' => $row['artist'],
                'songs' => $songs
            ];
        }
    }
}

$actions = ["!musica", "!troca", "!delete", "!pesquisa"];

echo json_encode([
    'bands' => $bands,
    'actions' => $actions,
    'pagination' => [
        'current_page' => $page,
        'total_pages' => $totalPages,
        'total_records' => $totalRecords,
        'limit' => $limit
    ]
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

$conn->close();
?>
