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

function showToast(message) {
  toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${message}`;
  toast.className = "show toast-slide";
  setTimeout(() => { toast.className = toast.className.replace("show toast-slide", ""); }, 3500);
}

function showLoader(){ loader.style.display = 'block'; }
function hideLoader(){ loader.style.display = 'none'; }

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

      const buttonsHTML = actions.map((action, idx) => {
        const color = actionColors[idx] || "secondary";
        const icon = actionIcons[idx] || "fa-circle";
        const texto = actionTexto[idx] || action;
        return `<button class="btn btn-sm btn-${color} ${idx+1}"><i class="fas ${icon}"></i> ${texto}</button>`;
      }).join('');

      const youtubeBtn = `<button class="btn btn-sm btn-danger"><i class="fab fa-youtube"></i> YouTube</button>`;
      li.innerHTML = `<span>${song.title}</span><span class="song-buttons">${buttonsHTML} ${youtubeBtn}</span>`;

      const buttons = li.querySelectorAll('button');
      buttons.forEach((btn, i) => {
        if (i < actions.length) {
          btn.onclick = async () => {
            await navigator.clipboard.writeText(`${actions[i]} ${band.artist} - ${song.title}`);
            showToast(`${actions[i]} ${band.artist} - ${song.title}`);
          };
        } else {
          btn.onclick = () => {
            const query = encodeURIComponent(`${band.artist} ${song.title}`);
            window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
          };
        }
      });

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
