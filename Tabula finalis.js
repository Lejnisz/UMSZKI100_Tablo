// ===== KONFIGURÁCIÓ =====
const JSON_URL = 'tabloAdatok.json';

// ===== DOM ELEMENTEK REFERENCIÁI =====
const galeriaGrid = document.getElementById('galeriaGrid');
const keresoInput = document.getElementById('keresoInput');
const evSelect = document.getElementById('evSelect');
const kategoriaGombok = document.querySelectorAll('.category-btn');
const talalatokSzama = document.getElementById('talalatokSzama');
const aktivSzurokSav = document.getElementById('aktivSzurokSav');
const clearAllFilters = document.getElementById('clearAllFilters');
const lightbox = document.getElementById('lightbox');
const lightboxZaras = document.getElementById('lightboxZaras');
const lightboxElementek = {
    kep: document.getElementById('lightboxKep'),
    cim: document.getElementById('lightboxCim'),
    ev: document.getElementById('lightboxEv'),
    kategoria: document.getElementById('lightboxKategoria'),
    osztaly: document.getElementById('lightboxOsztaly'),
    osztalyfonok: document.getElementById('lightboxOsztalyfonok'),
    leiras: document.getElementById('lightboxLeiras')
};

// ===== ÁLLAPOTKEZELÉS =====
let tabloAdatok = []; // Adatok itt lesznek betöltve
let aktualisKereses = '';
let aktualisEvSzuro = 'all';
let aktualisKategoriaSzuro = 'all';

// ===== ADATOK BETÖLTÉSE JSON-BÓL =====
async function adatokBetoltese() {
    try {
        const response = await fetch(JSON_URL);
        if (!response.ok) {
            throw new Error(`HTTP hiba: ${response.status}`);
        }
        tabloAdatok = await response.json();
        galeriaMegjelenitese(tabloAdatok);
        talalatokFrissitese(tabloAdatok.length);
        aktivSzurokFrissitese();
    } catch (error) {
        console.error('Hiba az adatok betöltésekor:', error);
        galeriaGrid.innerHTML = `
            <li class="no-results">
                <p>Hiba történt az adatok betöltésekor!</p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">Kérjük, ellenőrizze, hogy a tabloAdatok.json fájl elérhető.</p>
                <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--accent-orange);">Hiba: ${error.message}</p>
            </li>
        `;
    }
}

// ===== ESEMÉNYKEZELŐK BEÁLLÍTÁSA =====
function esemenyKezelokBeallitasa() {
    // Keresés: valós idejű szűrés
    keresoInput.addEventListener('input', (esemeny) => {
        aktualisKereses = esemeny.target.value.toLowerCase().trim();
        szurokAlkalmazasa();
    });

    // Évszám dropdown változás
    evSelect.addEventListener('change', (esemeny) => {
        aktualisEvSzuro = esemeny.target.value;
        szurokAlkalmazasa();
        aktivSzurokFrissitese();
    });

    // Kategória gombok kattintása
    kategoriaGombok.forEach((gomb) => {
        gomb.addEventListener('click', () => {
            // Aktív gomb frissítése
            kategoriaGombok.forEach((g) => {
                g.classList.remove('active');
                g.setAttribute('aria-selected', 'false');
            });
            gomb.classList.add('active');
            gomb.setAttribute('aria-selected', 'true');

            // Szűrés alkalmazása
            aktualisKategoriaSzuro = gomb.dataset.kategoria;
            szurokAlkalmazasa();
            aktivSzurokFrissitese();
        });
    });

    // Lightbox zárás gomb
    lightboxZaras.addEventListener('click', lightboxBezár);

    // Lightbox zárás ESC billentyűvel
    document.addEventListener('keydown', (esemeny) => {
        if (esemeny.key === 'Escape' && lightbox.classList.contains('active')) {
            lightboxBezár();
        }
    });

    // Lightbox zárás kattintással a háttérre
    lightbox.addEventListener('click', (esemeny) => {
        if (esemeny.target === lightbox) {
            lightboxBezár();
        }
    });

    // Galéria kártya kattintás (delegált)
    galeriaGrid.addEventListener('click', (esemeny) => {
        const kartya = esemeny.target.closest('.tablo-card');
        if (kartya) {
            const azonosito = parseInt(kartya.dataset.azonosito);
            const tablo = tabloAdatok.find((t) => t.azonosito === azonosito);
            if (tablo) lightboxMegnyitasa(tablo);
        }
    });
}

// ===== GALÉRIA MEGJELENÍTÉSE =====
function galeriaMegjelenitese(adatok) {
    // Üres állapot kezelése
    if (adatok.length === 0) {
        galeriaGrid.innerHTML = `
            <li class="no-results">
                <p>🔍 Nem található tablókép a megadott keresési feltételekkel.</p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">Próbálj más kulcsszót vagy kategóriát!</p>
            </li>
        `;
        return;
    }

    // Kártyák generálása
    galeriaGrid.innerHTML = adatok.map((tablo) => `
        <li class="tablo-card" 
            data-azonosito="${tablo.azonosito}" 
            data-kategoria="${tablo.kategoria}" 
            data-ev="${tablo.ev}" 
            tabindex="0" 
            role="button" 
            aria-label="${tablo.cim} - Megtekintés">
            <div class="tablo-kep" style="background-image: url('${tablo.kepUrl.trim()}')" aria-hidden="true"></div>
            <div class="tablo-info">
                <h3 class="tablo-cim">${tablo.cim}</h3>
                <div class="tablo-meta">
                    <span>📅 ${tablo.ev}</span>
                    <span class="tablo-kategoria">${tablo.kategoriaMegnevezes}</span>
                </div>
                <p class="tablo-leiras">${tablo.leiras}</p>
                <span class="view-btn">Részletek</span>
            </div>
        </li>
    `).join('');
}

// ===== SZŰRÉS ALKALMAZÁSA =====
function szurokAlkalmazasa() {
    const szurtAdatok = tabloAdatok.filter((tablo) => {
        
        const egyezikEv = aktualisEvSzuro === 'all' || tablo.ev === aktualisEvSzuro;

        
        const egyezikKategoria = aktualisKategoriaSzuro === 'all' || tablo.kategoria === aktualisKategoriaSzuro;
        const egyezikKereses = !aktualisKereses || 
                              tablo.cim.toLowerCase().includes(aktualisKereses) ||
                              tablo.leiras.toLowerCase().includes(aktualisKereses) ||
                              tablo.osztaly.toLowerCase().includes(aktualisKereses) ||
                              (tablo.osztalyfonok && tablo.osztalyfonok.toLowerCase().includes(aktualisKereses));

        
        return egyezikEv && egyezikKategoria && egyezikKereses;
    });

    galeriaMegjelenitese(szurtAdatok);
    talalatokFrissitese(szurtAdatok.length);
    aktivSzurokFrissitese();
}

// ===== TALÁLATOK SZÁMÁNAK FRISSÍTÉSE =====
function talalatokFrissitese(szam) {
    talalatokSzama.textContent = `${szam} tablókép`;
}

// ===== AKTÍV SZŰRŐK FRISSÍTÉSE =====
function aktivSzurokFrissitese() {
    const aktivSzurok = [];

    if (aktualisEvSzuro !== 'all') {
        aktivSzurok.push({ tipus: 'Év', ertek: aktualisEvSzuro });
    }

    if (aktualisKategoriaSzuro !== 'all') {
        const kategoriaNev = Array.from(kategoriaGombok).find(
            g => g.dataset.kategoria === aktualisKategoriaSzuro
        )?.textContent || aktualisKategoriaSzuro;
        aktivSzurok.push({ tipus: 'Kategória', ertek: kategoriaNev });
    }

    if (aktualisKereses) {
        aktivSzurok.push({ tipus: 'Keresés', ertek: aktualisKereses });
    }
}

// ===== LIGHTBOX MEGNYITÁSA =====
function lightboxMegnyitasa(tablo) {
    // Tartalom betöltése
    lightboxElementek.cim.textContent = tablo.cim;
    lightboxElementek.ev.textContent = `📅 ${tablo.ev}`;
    lightboxElementek.kategoria.textContent = `🏷️ ${tablo.kategoriaMegnevezes}`;
    lightboxElementek.osztaly.textContent = `👥 ${tablo.osztaly}`;
    lightboxElementek.osztalyfonok.textContent = `👨‍🏫 ${tablo.osztalyfonok || 'Nincs adat'}`;
    lightboxElementek.leiras.textContent = tablo.leiras;

    // Kép betöltése
    const kepImg = document.getElementById('lightboxKepImg');
    if (kepImg) {
        const highResUrl = tablo.kepUrlHigh.trim()
        
        kepImg.src = highResUrl;
        kepImg.alt = tablo.cim;
        kepImg.style.display = 'block';
    }

    // Placeholder eltüntetése
    if (lightboxElementek.kep) {
        lightboxElementek.kep.classList.add('has-image');
        const highResUrl = tablo.kepUrlHigh.trim()
        lightboxElementek.kep.style.backgroundImage = `url('${highResUrl}')`;
        lightboxElementek.kep.style.backgroundSize = 'cover';
        lightboxElementek.kep.style.backgroundPosition = 'center';
        lightboxElementek.kep.textContent = '';
    }

    // Lightbox animált megjelenítése
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Fókusz a bezáró gombra
    setTimeout(() => {
        if (lightboxZaras) lightboxZaras.focus();
    }, 300);
}

// ===== LIGHTBOX BEZÁRÁSA =====
function lightboxBezár() {
    // Lightbox elrejtése
    lightbox.classList.remove('active');

    // Scroll visszaállítása
    document.body.style.overflow = '';

    // ép resetelése
    const kepImg = document.getElementById('lightboxKepImg');
    if (kepImg) {
        kepImg.src = '';
        kepImg.style.display = 'none';
    }

    // Placeholder visszaállítása
    if (lightboxElementek.kep) {
        lightboxElementek.kep.classList.remove('has-image');
    }

    // Fókusz vissza a galériára
    setTimeout(() => {
        if (galeriaGrid && galeriaGrid.firstElementChild) {
            galeriaGrid.firstElementChild.focus();
        }
    }, 300);
}

// ===== INDÍTÁS =====
document.addEventListener('DOMContentLoaded', () => {
    adatokBetoltese();
    esemenyKezelokBeallitasa();
});
