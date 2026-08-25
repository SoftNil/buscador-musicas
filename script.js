let bands = [];
let currentPage = 1;
let totalPages = 1;
let currentLetter = 'all';
let currentSearchArtist = '';
let currentSearchMusic = '';
let currentLimit = parseInt(document.getElementById('limitSelect').value);

const toast = document.getElementById('toast');
const loader = document.getElementById('loader');

const BANDS_URL = 'bands.json';

// ============================================================
// TOAST / LOADER
// ============================================================

function showToast(message) {
    toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${message}`;
    toast.className = 'show toast-slide';

    setTimeout(() => {
        toast.className = toast.className.replace(
            'show toast-slide',
            ''
        );
    }, 3500);
}

function showLoader() {
    loader.style.display = 'block';
}

function hideLoader() {
    loader.style.display = 'none';
}

// ============================================================
// PEDIDO DE MÚSICA
// ============================================================

async function pedirMusica(artist, title) {

    const usuario = document
        .getElementById('Username')
        .value
        .trim();

    if (!usuario) {
        showToast('Digite seu apelido primeiro.');
        document.getElementById('Username').focus();
        return;
    }

    try {

        const response = await fetch(
            'http://127.0.0.1:18000/api/plugins/music_requests/request',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    usuario: usuario,
                    artist: artist,
                    title: title
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
            showToast(
                data.error ||
                'Não foi possível fazer o pedido.'
            );
            return;
        }

        showToast(
            `Pedido enviado: ${artist} - ${title}`
        );

    } catch (error) {

        console.error(
            'Erro ao enviar pedido:',
            error
        );

        showToast(
            'Não foi possível conectar ao servidor de pedidos.'
        );
    }
}

// ============================================================
// EXIBIR RESULTADOS
// ============================================================

function displayResults(data) {

    bands = data.bands || [];

    totalPages =
        data.pagination.total_pages || 1;

    currentPage =
        data.pagination.current_page || 1;

    const container =
        document.getElementById('bandsContainer');

    container.innerHTML = '';

    if (bands.length === 0) {

        container.innerHTML =
            '<p class="text-muted">Nenhum resultado encontrado.</p>';

        document.getElementById(
            'pagination'
        ).innerHTML = '';

        return;
    }

    bands.forEach((band, index) => {

        const card =
            document.createElement('div');

        card.className =
            'accordion-item';

        const collapseId =
            `collapse${index}`;

        card.innerHTML = `
            <h2 class="accordion-header">

                <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#${collapseId}">

                    ${band.artist}

                </button>

            </h2>

            <div
                id="${collapseId}"
                class="accordion-collapse collapse">

                <div class="accordion-body text-center">

                    <ul
                        class="list-group list-group-flush song-list">
                    </ul>

                </div>

            </div>
        `;

        const ul =
            card.querySelector('.song-list');

        // --------------------------------------------------------
        // MÚSICAS DO ARTISTA
        // --------------------------------------------------------

        band.songs.forEach(song => {

            const li =
                document.createElement('li');

            li.className =
                'list-group-item d-flex justify-content-between align-items-center';

            // Botão PEDIR
            const pedirBtn = `
                <button
                    class="btn btn-sm btn-success btn-pedir">
                    <i class="fas fa-music"></i>
                    Pedir
                </button>
            `;

            // Botão YOUTUBE
            const youtubeBtn = `
                <button
                    class="btn btn-sm btn-danger btn-youtube">
                    <i class="fab fa-youtube"></i>
                    YouTube
                </button>
            `;

            li.innerHTML = `
                <span>${song.title}</span>

                <span class="song-buttons">
                    ${pedirBtn}
                    ${youtubeBtn}
                </span>
            `;

            // ----------------------------------------------------
            // EVENTO PEDIR
            // ----------------------------------------------------

            const btnPedir =
                li.querySelector('.btn-pedir');

            btnPedir.onclick = () => {

                pedirMusica(
                    band.artist,
                    song.title
                );

            };

            // ----------------------------------------------------
            // EVENTO YOUTUBE
            // ----------------------------------------------------

            const btnYoutube =
                li.querySelector('.btn-youtube');

            btnYoutube.onclick = () => {

                const query =
                    encodeURIComponent(
                        `${band.artist} ${song.title}`
                    );

                window.open(
                    `https://www.youtube.com/results?search_query=${query}`,
                    '_blank'
                );

            };

            ul.appendChild(li);

        });

        container.appendChild(card);

    });

    renderPagination();
}

// ============================================================
// PAGINAÇÃO
// ============================================================

function renderPagination() {

    const pag =
        document.getElementById('pagination');

    pag.innerHTML = '';

    // PRIMEIRO
    const firstLi =
        document.createElement('li');

    firstLi.className =
        'page-item' +
        (currentPage === 1
            ? ' disabled'
            : '');

    firstLi.innerHTML =
        `<a class="page-link" href="#">Primeiro</a>`;

    firstLi.onclick = (e) => {

        e.preventDefault();

        if (currentPage > 1) {
            loadBands(
                1,
                currentLetter
            );
        }

    };

    pag.appendChild(firstLi);

    // ANTERIOR
    const prevLi =
        document.createElement('li');

    prevLi.className =
        'page-item' +
        (currentPage === 1
            ? ' disabled'
            : '');

    prevLi.innerHTML =
        `<a class="page-link" href="#">Anterior</a>`;

    prevLi.onclick = (e) => {

        e.preventDefault();

        if (currentPage > 1) {

            loadBands(
                currentPage - 1,
                currentLetter
            );

        }

    };

    pag.appendChild(prevLi);

    // NÚMEROS
    const maxPages = 5;

    let start =
        Math.max(
            1,
            currentPage -
            Math.floor(maxPages / 2)
        );

    let end =
        Math.min(
            totalPages,
            start + maxPages - 1
        );

    start =
        Math.max(
            1,
            end - maxPages + 1
        );

    for (
        let i = start;
        i <= end;
        i++
    ) {

        const li =
            document.createElement('li');

        li.className =
            'page-item' +
            (i === currentPage
                ? ' active'
                : '');

        li.innerHTML =
            `<a class="page-link" href="#">${i}</a>`;

        li.onclick = (e) => {

            e.preventDefault();

            loadBands(
                i,
                currentLetter
            );

        };

        pag.appendChild(li);
    }

    // PRÓXIMO
    const nextLi =
        document.createElement('li');

    nextLi.className =
        'page-item' +
        (currentPage === totalPages
            ? ' disabled'
            : '');

    nextLi.innerHTML =
        `<a class="page-link" href="#">Próximo</a>`;

    nextLi.onclick = (e) => {

        e.preventDefault();

        if (currentPage < totalPages) {

            loadBands(
                currentPage + 1,
                currentLetter
            );

        }

    };

    pag.appendChild(nextLi);

    // ÚLTIMO
    const lastLi =
        document.createElement('li');

    lastLi.className =
        'page-item' +
        (currentPage === totalPages
            ? ' disabled'
            : '');

    lastLi.innerHTML =
        `<a class="page-link" href="#">Último</a>`;

    lastLi.onclick = (e) => {

        e.preventDefault();

        if (currentPage < totalPages) {

            loadBands(
                totalPages,
                currentLetter
            );

        }

    };

    pag.appendChild(lastLi);
}

// ============================================================
// FILTRO POR LETRA
// ============================================================

function filterByLetter(letter) {

    currentLetter = letter;

    currentSearchArtist = '';
    currentSearchMusic = '';

    document.getElementById(
        'searchArtist'
    ).value = '';

    document.getElementById(
        'searchMusic'
    ).value = '';

    loadBands(
        1,
        letter
    );
}

// ============================================================
// PESQUISA
// ============================================================

let debounceTimeout;

function debounceSearch() {

    clearTimeout(
        debounceTimeout
    );

    debounceTimeout =
        setTimeout(() => {

            currentSearchArtist =
                document
                    .getElementById('searchArtist')
                    .value
                    .toLowerCase()
                    .trim();

            currentSearchMusic =
                document
                    .getElementById('searchMusic')
                    .value
                    .toLowerCase()
                    .trim();

            currentLetter = 'all';

            loadBands(
                1,
                'all'
            );

        }, 300);
}

// ============================================================
// QUANTIDADE POR PÁGINA
// ============================================================

function changeLimit() {

    currentLimit =
        parseInt(
            document
                .getElementById('limitSelect')
                .value
        );

    loadBands(
        1,
        currentLetter
    );
}

// ============================================================
// CARREGAR BANDS.JSON
// ============================================================

async function loadBands(
    page = 1,
    letter = 'all'
) {

    showLoader();

    try {

        const response =
            await fetch(
                `${BANDS_URL}?t=${Date.now()}`
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const data =
            await response.json();

        let filteredBands =
            data.bands || [];

        // --------------------------------------------------------
        // FILTRO POR LETRA
        // --------------------------------------------------------

        if (letter !== 'all') {

            filteredBands =
                filteredBands.filter(
                    band =>
                        band.artist
                            .toUpperCase()
                            .startsWith(
                                letter.toUpperCase()
                            )
                );

        }

        // --------------------------------------------------------
        // PESQUISA ARTISTA
        // --------------------------------------------------------

        if (currentSearchArtist) {

            filteredBands =
                filteredBands.filter(
                    band =>
                        band.artist
                            .toLowerCase()
                            .includes(
                                currentSearchArtist
                            )
                );

        }

        // --------------------------------------------------------
        // PESQUISA MÚSICA
        // --------------------------------------------------------

        if (currentSearchMusic) {

            filteredBands =
                filteredBands.filter(
                    band =>
                        band.songs.some(
                            song =>
                                song.title
                                    .toLowerCase()
                                    .includes(
                                        currentSearchMusic
                                    )
                        )
                );

        }

        // --------------------------------------------------------
        // PAGINAÇÃO
        // --------------------------------------------------------

        const totalRecords =
            filteredBands.length;

        totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalRecords /
                    currentLimit
                )
            );

        currentPage =
            Math.min(
                page,
                totalPages
            );

        const offset =
            (currentPage - 1) *
            currentLimit;

        const pagedBands =
            filteredBands.slice(
                offset,
                offset + currentLimit
            );

        displayResults({

            bands: pagedBands,

            pagination: {
                current_page:
                    currentPage,

                total_pages:
                    totalPages,

                total_records:
                    totalRecords
            }

        });

    } catch (error) {

        console.error(
            'Erro ao carregar bands.json:',
            error
        );

        document.getElementById(
            'bandsContainer'
        ).innerHTML = `
            <p class="text-danger">
                Erro ao carregar o arquivo bands.json.
            </p>
        `;

    } finally {

        hideLoader();

    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

loadBands();