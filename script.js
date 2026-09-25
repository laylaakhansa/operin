// URL Google Apps Script Web App Operin SMKN 8 Jakarta
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqQ6t6Zjc3o1iBtzs0Aa7DYFP7X51yQf2kGKd4MHKohslk-E9zPzBlGchSAXbkDpU/exec";

let allItems = [];
let selectedMajor = '';
let activeDetailItem = null;
let currentUser = JSON.parse(localStorage.getItem('operin_user')) || null;

// --- 1. Custom Glowing Cursor ---
const cursorDot = document.getElementById('cursorDot');
const cursorOutline = document.getElementById('cursorOutline');

window.addEventListener('mousemove', (e) => {
  if (!cursorDot || !cursorOutline) return;
  cursorDot.style.left = `${e.clientX}px`;
  cursorDot.style.top = `${e.clientY}px`;
  cursorOutline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 400, fill: "forwards" });
});

function attachCursorHoverEffect() {
  const targets = document.querySelectorAll('button, input, select, a, .card-item-glass, .team-member-card, .cta-banner-card');
  targets.forEach(t => {
    t.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    t.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// --- 2. Dark / Light Mode Toggle ---
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const target = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', target);
  const btn = document.getElementById('btnThemeToggle');
  if (btn) btn.innerText = target === 'dark' ? '☀️' : '🌓';
  localStorage.setItem('operin_theme', target);
}

const savedTheme = localStorage.getItem('operin_theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  const btn = document.getElementById('btnThemeToggle');
  if (btn) btn.innerText = savedTheme === 'dark' ? '☀️' : '🌓';
}

// --- 3. Manajemen Akun Siswa & Google Sheets ---
function updateAuthButtonUI() {
  const authBtn = document.getElementById('btnGoogleAuth');
  const authText = document.getElementById('authText');
  if (!authBtn || !authText) return;

  if (currentUser) {
    authText.innerText = currentUser.name.split(' ')[0] + ` (${currentUser.grade})`;
    authBtn.style.borderColor = "var(--primary)";
    authBtn.style.color = "var(--primary)";
  } else {
    authText.innerText = "Masuk / Daftar";
    authBtn.style.borderColor = "var(--surface-border)";
    authBtn.style.color = "var(--text-main)";
  }
}

function handleAuthClick() {
  if (!currentUser) {
    openModal('modalAuth');
  } else {
    if (confirm(`Akun aktif: ${currentUser.name} (${currentUser.grade} - ${currentUser.major})\n\nIngin keluar akun?`)) {
      currentUser = null;
      localStorage.removeItem('operin_user');
      updateAuthButtonUI();
    }
  }
}

async function handleRegisterUser(e) {
  e.preventDefault();

  const nameInput = document.getElementById('regName').value.trim();
  const gradeInput = document.getElementById('regGrade').value;
  const majorInput = document.getElementById('regMajor').value;
  const emailInput = document.getElementById('regEmail').value.trim();
  const phoneInput = document.getElementById('regPhone').value.trim();

  if (!nameInput || !phoneInput) {
    alert('Harap lengkapi nama dan nomor WhatsApp aktif!');
    return;
  }

  const userData = {
    action: "register_user",
    name: nameInput,
    grade: gradeInput,
    major: majorInput,
    email: emailInput,
    phone: phoneInput
  };

  // Simpan login langsung di browser
  currentUser = {
    name: userData.name,
    grade: userData.grade,
    major: userData.major,
    email: userData.email,
    phone: userData.phone
  };
  localStorage.setItem('operin_user', JSON.stringify(currentUser));
  updateAuthButtonUI();
  closeModal('modalAuth');
  alert(`Menyimpan profil ${currentUser.name} ke database...`);

  // Kirim data akun ke tab Users di Google Sheets
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    alert(`Profil berhasil tersimpan di Google Sheets Operin!`);
  } catch (err) {
    console.error("Gagal sinkron akun:", err);
  }
}

// --- 4. Memuat & Merender Katalog dari Google Sheets ---
async function loadItems() {
  const grid = document.getElementById('catalogGrid');
  grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">⏳ Memuat katalog perlengkapan dari database...</div>`;

  try {
    const response = await fetch(APPS_SCRIPT_URL);
    if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets");
    allItems = await response.json();
    renderItems();
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px;">
        Gagal memuat katalog dari Google Sheets. Pastikan akses deployment Web App sudah diset ke <b>Anyone</b>.
      </div>`;
  }
}

function setFilterMajor(major) {
  selectedMajor = major;
  document.querySelectorAll('#majorPills .filter-btn-pill').forEach(btn => {
    if ((major === '' && btn.innerText === 'Semua Jurusan') || btn.innerText === major) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderItems();
}

function renderItems() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const scheme = document.getElementById('filterScheme').value;
  const sort = document.getElementById('sortPrice').value;
  const grid = document.getElementById('catalogGrid');

  let filtered = allItems.filter(item => {
    const matchQ = (item.title || "").toLowerCase().includes(q) || (item.cod || "").toLowerCase().includes(q);
    const matchMajor = !selectedMajor || item.major === selectedMajor;
    const matchScheme = !scheme || item.type === scheme;
    return matchQ && matchMajor && matchScheme;
  });

  if (sort === 'lowest') {
    filtered.sort((a, b) => parseInt(String(a.price).replace(/[^0-9]/g, '') || 0) - parseInt(String(b.price).replace(/[^0-9]/g, '') || 0));
  } else if (sort === 'highest') {
    filtered.sort((a, b) => parseInt(String(b.price).replace(/[^0-9]/g, '') || 0) - parseInt(String(a.price).replace(/[^0-9]/g, '') || 0));
  }

  document.getElementById('itemCount').innerText = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    document.getElementById('emptyMsg').style.display = 'block';
    return;
  }

  document.getElementById('emptyMsg').style.display = 'none';
  grid.innerHTML = filtered.map(item => {
    let badgeClass = 'berbayar';
    let badgeText = item.type === 'Barter' ? '🤝 Barter' : (item.type === 'Gratis' ? '🎁 Hibah' : '💰 Jual');

    if (item.type === 'Gratis') badgeClass = 'hibah';
    if (item.type === 'Barter') badgeClass = 'barter';

    const media = item.photoUrl 
      ? `<img src="${item.photoUrl}" alt="${item.title}" class="card-img-cover" loading="lazy">`
      : `<div class="card-emoji-box">📦</div>`;

    return `
      <div class="tilt-card-wrapper" onmousemove="handleTilt(event, this)" onmouseleave="resetTilt(this)">
        <div class="card-item-glass" onclick="openDetail('${item.id}')">
          <div class="card-media-box">
            <span class="badge-interactive-scheme ${badgeClass}">${badgeText}</span>
            <span class="badge-interactive-cond">${item.condition ? item.condition.slice(0, 18) : 'Kondisi Baik'}</span>
            ${media}
          </div>
          <div class="card-body-details">
            <div class="card-major-text">${item.major}</div>
            <div class="card-title-text" title="${item.title}">${item.title}</div>
            <div class="card-price-text">${item.type === 'Barter' ? 'Barter' : item.price}</div>
            <div class="card-cod-row">📍 ${item.cod}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachCursorHoverEffect();
}

// --- 5. 3D Tilt Card Interaction ---
function handleTilt(e, cardWrap) {
  const rect = cardWrap.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = ((y - centerY) / centerY) * -8;
  const rotateY = ((x - centerX) / centerX) * 8;

  cardWrap.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
}

function resetTilt(cardWrap) {
  cardWrap.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
}

// --- 6. Form & Modal Functions ---
function togglePriceFields() {
  const scheme = document.getElementById('itemScheme').value;
  document.getElementById('fieldPrice').style.display = scheme === 'Berbayar' ? 'block' : 'none';
  document.getElementById('fieldBarter').style.display = scheme === 'Barter' ? 'block' : 'none';
}

function openModal(id) { 
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex'; 
}

function closeModal(id) { 
  const el = document.getElementById(id);
  if (el) el.style.display = 'none'; 
}

function openDetail(id) {
  const item = allItems.find(x => String(x.id) === String(id));
  if (!item) return;

  activeDetailItem = item;

  document.getElementById('detTitle').innerText = item.title;
  document.getElementById('detMajor').innerText = item.major;
  document.getElementById('detScheme').innerText = item.type;
  document.getElementById('detPrice').innerText = item.type === 'Barter' ? 'Skema Barter' : item.price;
  document.getElementById('detSize').innerText = item.size || '-';
  document.getElementById('detCondition').innerText = item.condition || 'Kondisi Baik';
  document.getElementById('detMinus').innerText = item.minus || 'Tidak ada';
  document.getElementById('detCod').innerText = '📍 ' + item.cod;

  const mediaBox = document.getElementById('detMediaBox');
  if (item.photoUrl) {
    mediaBox.innerHTML = `<img src="${item.photoUrl}" alt="${item.title}" style="width:100%;height:220px;object-fit:cover;border-radius:14px;">`;
  } else {
    mediaBox.innerHTML = `<div style="height:180px;display:flex;align-items:center;justify-content:center;font-size:4rem;background:rgba(0,0,0,0.03);border-radius:14px;">📦</div>`;
  }

  const barterRow = document.getElementById('detBarterRow');
  if (item.type === 'Barter' && item.barterFor) {
    barterRow.style.display = 'table-row';
    document.getElementById('detBarter').innerText = item.barterFor;
  } else {
    barterRow.style.display = 'none';
  }

  openModal('modalDetail');
}

// --- 7. Tombol Booking & Direct WhatsApp ke Penjual ---
function handleBooking() {
  if (!currentUser) {
    alert('Silakan masuk atau daftar akun siswa terlebih dahulu!');
    openModal('modalAuth');
    return;
  }

  alert(`Alat "${activeDetailItem.title}" berhasil di-booking atas nama ${currentUser.name} (${currentUser.grade} - ${currentUser.major})!\n\nSilakan temui penitip barang di titik COD (${activeDetailItem.cod}) saat jam istirahat.`);
  closeModal('modalDetail');
}

function handleAmbilWA() {
  if (!currentUser) {
    alert('Silakan masuk atau daftar akun siswa terlebih dahulu!');
    openModal('modalAuth');
    return;
  }

  let targetPhone = activeDetailItem.sellerPhone || '083171164721';
  targetPhone = String(targetPhone).replace(/[^0-9]/g, '');
  if (targetPhone.startsWith('0')) {
    targetPhone = '62' + targetPhone.slice(1);
  }

  const skemaText = activeDetailItem.type === 'Barter' 
    ? `Barter (${activeDetailItem.barterFor || '-'})` 
    : (activeDetailItem.type === 'Gratis' ? 'Hibah (Rp0)' : activeDetailItem.price);

  const pesan = `Halo! 👋 Saya melihat perlengkapan yang kamu titipkan di Operin SMKN 8 Jakarta:%0A%0A` +
    `📦 *Barang:* ${activeDetailItem.title}%0A` +
    `🏷️ *Jurusan:* ${activeDetailItem.major}%0A` +
    `💰 *Skema:* ${skemaText}%0A` +
    `📍 *Titik Janjian COD:* ${activeDetailItem.cod}%0A%0A` +
    `*Identitas Saya (Pengambil / Peminat):*%0A` +
    `👤 *Nama:* ${currentUser.name}%0A` +
    `🏫 *Kelas:* ${currentUser.grade} - ${currentUser.major}%0A` +
    `📞 *No. WhatsApp:* ${currentUser.phone}%0A%0A` +
    `Apakah alat praktiknya masih ada? Bisa janjian ketemuan di lokasi COD saat jam istirahat nanti? Terima kasih!`;

  window.open(`https://wa.me/${targetPhone}?text=${pesan}`, '_blank');
  closeModal('modalDetail');
}

// --- 8. Simpan Titip Barang ke Google Sheets ---
async function submitNewItem(e) {
  e.preventDefault();
  if (!currentUser) {
    alert('Kamu harus mendaftar atau masuk akun terlebih dahulu!');
    openModal('modalAuth');
    return;
  }

  const newItemPayload = {
    action: "add_item",
    id: Date.now(),
    title: document.getElementById('itemTitle').value,
    major: document.getElementById('itemMajor').value,
    type: document.getElementById('itemScheme').value,
    price: document.getElementById('itemPrice').value ? 'Rp ' + Number(document.getElementById('itemPrice').value).toLocaleString('id-ID') : 'Rp 0',
    size: document.getElementById('itemSize').value,
    condition: document.getElementById('itemCondition').value,
    minus: document.getElementById('itemMinus').value,
    barterFor: document.getElementById('itemBarter').value,
    cod: document.getElementById('itemCod').value,
    photoUrl: '',
    sellerPhone: currentUser.phone
  };

  alert("Sedang mendaftarkan alat ke database sekolah...");
  closeModal('modalAdd');

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItemPayload)
    });

    alert('Barang praktik berhasil masuk ke database Operin SMKN 8 Jakarta!');
    document.getElementById('itemTitle').value = '';
    
    setTimeout(() => {
      loadItems();
    }, 1200);
  } catch (err) {
    alert('Gagal menghubungi database Google Sheets.');
  }
}

// --- 9. Chat Drawer Assistant ---
function toggleChat() {
  const card = document.getElementById('chatCard');
  if (card) card.style.display = (card.style.display === 'flex') ? 'none' : 'flex';
}

function sendChat() {
  const inp = document.getElementById('chatInput');
  const txt = inp.value.trim();
  if (!txt) return;

  const logs = document.getElementById('chatLogs');
  logs.innerHTML += `<div class="bubble-item user">${txt}</div>`;
  inp.value = '';

  setTimeout(() => {
    let reply = 'Kamu bisa langsung cek alatnya di katalog dan janjian di titik COD resmi SMKN 8 Jakarta!';
    const lower = txt.toLowerCase();
    if (lower.includes('cod') || lower.includes('lokasi')) {
      reply = 'Titik COD resmi SMKN 8 Jakarta: Lab BDP Lt 1 depan gazebo, Lab PAI samping musholla, Lab RPL samping ruang guru, Lab ULW depan lapangan, Lab AKL Lt 2 arah aula, Ki Hajar Dewantara deket BC, atau Resepsionis.';
    }
    logs.innerHTML += `<div class="bubble-item bot">${reply}</div>`;
    logs.scrollTop = logs.scrollHeight;
  }, 500);
}

// Mulai aplikasi
updateAuthButtonUI();
loadItems();
attachCursorHoverEffect();
