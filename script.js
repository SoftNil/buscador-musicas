let bands = [];
let actions = [];
let currentPage = 1;
let totalPages = 1;
let currentLetter = 'all';
let currentSearchArtist = '';
let currentSearchMusic = '';
let currentLimit = parseInt(document.getElementById('limitSelect').value);

const toast = document.getElementById('toast');
const loader = document.getElementById('loader');
const inputRecebe = document.getElementById("texto");

const actionColors = ["success", "warning", "danger", "info"];
const actionIcons = ["fa-plus", "fa-arrows-left-right", "fa-trash", "fa-magnifying-glass"];
const actionTexto = ["Adicionar", "Trocar", "Remover", "Pesquisar"];

let apiURL;
let usePHP = false;

async function detectAPI() {
    try {
        const res = await fetch('bands.json', { method: 'HEAD' });
        if (res.ok) apiURL = 'bands.json';
        else { apiURL = 'get_bands.php'; usePHP = true; }
    } catch(err) { apiURL = 'get_bands.php'; usePHP = true; }
}


 function enviar() {
            var txt = document.getElementById("texto").value;
            var apelido = document.getElementById("Username").value;
            if (apelido == ''){
             alert('Digite um apelido');
            }
     if (txt == ''){
             alert('Nenhuma musica para enviar');
            }
          if (apelido != '' || txt != ''){
            // Faz o POST para o servidor Lazarus na porta 8989
            fetch("https://nonnihilistic-lita-unpanniered.ngrok-free.dev/enviar", {
   method: "POST",
headers: { "Content-Type": "application/x-www-form-urlencoded" },
body: "mensagem="+encodeURIComponent(apelido)+"!"+encodeURIComponent(apelido)+"@"+encodeURIComponent(apelido)+".tmi.twitch.tv PRIVMSG #"+encodeURIComponent(apelido)+ ':' + encodeURIComponent(txt)
})
               showToast("Musica adicionada a lista");
              document.getElementById("texto").value="";
           /* .then(res => res.text())
            .then(data => document.getElementById("resp").innerText = data)
            .catch(err => document.getElementById("resp").innerText = "Erro: O Lazarus está rodando?");*/
          }
        }

function showToast(message) {
  toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${message}`;
  toast.className = "show toast-slide";
  setTimeout(() => { toast.className = toast.className.replace("show toast-slide", ""); }, 3500);
}

function showLoader(){ loader.style.display = 'block'; }
function hideLoader(){ loader.style.display = 'none'; }

async function pedirMusica(artist, title) {
    const usuario = document.getElementById('Username').value.trim();

    if (!usuario) {
        showToast('Digite seu apelido primeiro.');
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
            showToast(data.error || 'Não foi possível fazer o pedido.');
            return;
        }

        showToast(`Pedido enviado: ${artist} - ${title}`);

    } catch (error) {
        console.error(error);
        showToast('Não foi possível conectar ao servidor de pedidos.');
    }
}

function displayResults(data){
  bands = data.bands;
  actions = data.actions;
  totalPages = data.pagination.total_pages;
  currentPage = data.pagination.current_page;

  const container = document.getElementById('bandsContainer');
  container.innerHTML = '';
  if (bands.length === 0) {
    container.innerHTML = '<p class="text-muted">Nenhum resultado encontrado.</p>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  bands.forEach((band, index) => {
    const card = document.createElement('div');
    card.className = 'accordion-item';
    const collapseId = `collapse${index}`;
    card.innerHTML = `
      <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
          ${band.artist}
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse">
        <div class="accordion-body text-center">
          <ul class="list-group list-group-flush song-list"></ul>
        </div>
      </div>
    `;
    const ul = card.querySelector('ul');
    band.songs.forEach(song => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';

    const buttonsHTML = '<button class="btn btn-sm btn-success btn-pedir"><i class="fas fa-music"></i> Pedir</button>';

      const youtubeBtn = '<button class="btn btn-sm btn-danger btn-youtube"><i class="fab fa-youtube"></i> YouTube</button>;
    

     const btnPedir = li.querySelector('.btn-pedir');
const btnYoutube = li.querySelector('.btn-youtube');

btnPedir.onclick = () => {
    pedirMusica(band.artist, song.title);
};

btnYoutube.onclick = () => {
    const query = encodeURIComponent(`${band.artist} ${song.title}`);
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

function renderPagination() {
  const pag = document.getElementById('pagination');
  pag.innerHTML = '';

  const firstLi = document.createElement('li');
  firstLi.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
  firstLi.innerHTML = `<a class="page-link" href="#">Primeiro</a>`;
  firstLi.onclick = (e) => { e.preventDefault(); if(currentPage>1) loadBands(1,currentLetter); };
  pag.appendChild(firstLi);

  const prevLi = document.createElement('li');
  prevLi.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
  prevLi.innerHTML = `<a class="page-link" href="#">Anterior</a>`;
  prevLi.onclick = (e) => { e.preventDefault(); if(currentPage>1) loadBands(currentPage-1,currentLetter); };
  pag.appendChild(prevLi);

  const maxPages = 5;
  let start = Math.max(1, currentPage - Math.floor(maxPages/2));
  let end = Math.min(totalPages, start + maxPages - 1);
  start = Math.max(1, end - maxPages + 1);

  for(let i=start;i<=end;i++){
    const li = document.createElement('li');
    li.className = 'page-item' + (i===currentPage?' active':'');
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.onclick = (e) => { e.preventDefault(); loadBands(i,currentLetter); };
    pag.appendChild(li);
  }

  const nextLi = document.createElement('li');
  nextLi.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
  nextLi.innerHTML = `<a class="page-link" href="#">Próximo</a>`;
  nextLi.onclick = (e) => { e.preventDefault(); if(currentPage<totalPages) loadBands(currentPage+1,currentLetter); };
  pag.appendChild(nextLi);

  const lastLi = document.createElement('li');
  lastLi.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
  lastLi.innerHTML = `<a class="page-link" href="#">Último</a>`;
  lastLi.onclick = (e) => { e.preventDefault(); if(currentPage<totalPages) loadBands(totalPages,currentLetter); };
  pag.appendChild(lastLi);
}

function filterByLetter(letter){
  currentLetter = letter;
  currentSearchArtist = '';
  currentSearchMusic = '';
  document.getElementById('searchArtist').value='';
  document.getElementById('searchMusic').value='';
  loadBands(1,letter);
}

let debounceTimeout;
function debounceSearch(){
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(()=>{ 
    currentSearchArtist = document.getElementById('searchArtist').value.toLowerCase();
    currentSearchMusic = document.getElementById('searchMusic').value.toLowerCase();
    currentLetter = 'all';
    loadBands(1,'all');
  },300);
}

function changeLimit(){
  currentLimit = parseInt(document.getElementById('limitSelect').value);
  loadBands(1,currentLetter);
}

async function loadBands(page=1, letter='all') {
    showLoader();
    try {
        if (!apiURL) await detectAPI();

        if (usePHP) {
            const res = await fetch(`${apiURL}?page=${page}&letter=${letter}&search_artist=${encodeURIComponent(currentSearchArtist)}&search_music=${encodeURIComponent(currentSearchMusic)}&limit=${currentLimit}`);
            const data = await res.json();
            displayResults(data);
        } else {
            const res = await fetch(apiURL);
            const data = await res.json();
            let bands = data.bands;

            if (letter !== 'all') bands = bands.filter(b => b.artist.toUpperCase().startsWith(letter.toUpperCase()));
            if (currentSearchArtist) bands = bands.filter(b => b.artist.toLowerCase().includes(currentSearchArtist));
            if (currentSearchMusic) bands = bands.filter(b => b.songs.some(song => song.title.toLowerCase().includes(currentSearchMusic)));

            const totalRecords = bands.length;
            const totalPages = Math.ceil(totalRecords / currentLimit);
            const offset = (page-1)*currentLimit;
            const pagedBands = bands.slice(offset, offset + currentLimit);

            displayResults({
                bands: pagedBands,
                actions: data.actions,
                pagination: { current_page: page, total_pages: totalPages, total_records: totalRecords }
            });
        }
    } catch(err){
        document.getElementById('bandsContainer').innerHTML='<p class="text-danger">Erro ao carregar os dados.</p>';
        console.error(err);
    }
    hideLoader();
}

// Inicialização
loadBands();








