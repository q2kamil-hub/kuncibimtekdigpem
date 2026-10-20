/* ============================================================
   Bank Soal & Jawaban — script.js
   - Ambil data dari soal.xml (fetch, sekali saat load)
   - Pencarian real-time: min. 3 karakter, debounce 100 ms
   - Substring utuh, case-insensitive, normalisasi spasi
   - Maks. 5 hasil, prioritas cocok di awal soal
   ============================================================ */

const MIN_KARAKTER = 3;
const DEBOUNCE_MS = 100;
const MAKS_HASIL = 5;

let semuaSoal = []; // array { pertanyaan, jawaban }

const inputCari  = document.getElementById("inputCari");
const infoHasil  = document.getElementById("infoHasil");
const areaHasil  = document.getElementById("areaHasil");

/* ---------- Util ---------- */

// Normalisasi teks: lowercase + rapikan spasi/enter berlebih
function normalisasi(teks) {
  return (teks || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Escape HTML agar aman saat ditampilkan
function escapeHtml(teks) {
  return (teks || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- Muat XML ---------- */

async function muatSoal() {
  try {
    const resp = await fetch("soal.xml");
    if (!resp.ok) throw new Error("Gagal memuat soal.xml (" + resp.status + ")");

    const teksXml = await resp.text();
    const parser  = new DOMParser();
    const doc     = parser.parseFromString(teksXml, "application/xml");

    // Cek error parsing
    if (doc.querySelector("parsererror")) {
      throw new Error("soal.xml tidak valid.");
    }

    const items = doc.querySelectorAll("item");
    semuaSoal = Array.from(items).map((item) => ({
      pertanyaan: item.querySelector("pertanyaan")?.textContent || "",
      jawaban:    item.querySelector("jawaban")?.textContent    || "",
    }));

    infoHasil.textContent = "";
    areaHasil.innerHTML   = `<p class="pesan">Ketik minimal ${MIN_KARAKTER} karakter untuk mulai mencari.</p>`;
  } catch (err) {
    console.error(err);
    infoHasil.textContent = "";
    areaHasil.innerHTML   = `<p class="pesan">Gagal memuat data soal: ${escapeHtml(err.message)}</p>`;
  }
}

/* ---------- Pencarian ---------- */

function cariSoal(kueri) {
  const q = normalisasi(kueri);
  if (q.length < MIN_KARAKTER) return null;

  // Cocokkan substring utuh (case-insensitive)
  const hasil = semuaSoal
    .map((soal) => {
      const p = normalisasi(soal.pertanyaan);
      const idx = p.indexOf(q);
      return { soal, idx };
    })
    .filter((h) => h.idx !== -1)
    // Prioritas: cocok di awal soal (idx kecil) lebih dulu
    .sort((a, b) => a.idx - b.idx);

  return hasil;
}

/* ---------- Render ---------- */

function renderHasil(kueri) {
  const hasil = cariSoal(kueri);

  // Belum cukup karakter
  if (hasil === null) {
    infoHasil.textContent = "";
    if (normalisasi(kueri).length === 0) {
      areaHasil.innerHTML = `<p class="pesan">Ketik minimal ${MIN_KARAKTER} karakter untuk mulai mencari.</p>`;
    } else {
      areaHasil.innerHTML = `<p class="pesan">Ketik minimal ${MIN_KARAKTER} karakter (sekarang ${normalisasi(kueri).length}).</p>`;
    }
    return;
  }

  // Tidak ada hasil
  if (hasil.length === 0) {
    infoHasil.textContent = "";
    areaHasil.innerHTML   = `<p class="pesan">Tidak ditemukan soal yang cocok.</p>`;
    return;
  }

  // Batasi maksimal hasil
  const tampil = hasil.slice(0, MAKS_HASIL);

  infoHasil.textContent =
    hasil.length > MAKS_HASIL
      ? `Menampilkan ${tampil.length} dari ${hasil.length} hasil.`
      : `Ditemukan ${hasil.length} hasil.`;

  areaHasil.innerHTML = tampil
    .map(
      (h) => `
      <div class="kartu">
        <p class="pertanyaan">${escapeHtml(h.soal.pertanyaan)}</p>
        <p class="jawaban"><span class="label-jawaban">Jawaban:</span> ${escapeHtml(h.soal.jawaban)}</p>
      </div>`
    )
    .join("");
}

/* ---------- Debounce ---------- */

let timerDebounce = null;

function onInput() {
  clearTimeout(timerDebounce);
  timerDebounce = setTimeout(() => {
    renderHasil(inputCari.value);
  }, DEBOUNCE_MS);
}

/* ---------- Inisialisasi ---------- */

inputCari.addEventListener("input", onInput);
muatSoal();