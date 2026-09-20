let allItems = [];
let selectedMajor = '';
let activeDetailItem = null; // Menampung data barang yang sedang aktif dibuka di modal detail
let currentUser = JSON.parse(localStorage.getItem('operin_user')) || null;

// --- 1. Custom Glowing Cursor Follower ---
const cursorDot = document.getElementById('cursorDot');
const cursorOutline = document.getElementById('cursorOutline');

window.addEventListener('mousemove', (e) => {
  const posX = e.clientX;
  const posY = e.clientY;

  cursorDot.style.left = `${posX}px`;
  cursorDot.style.top = `${posY}px`;

  cursorOutline.animate({
    left: `${posX}px`,
    top: `${posY}px`
  }, { duration: 400, fill: "forwards" });
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
  document.getElementById('btnThemeToggle').innerText = target === 'dark' ? '☀️' : '🌓';
  localStorage.setItem('operin_theme', target);
}

const savedTheme = localStorage.getItem('operin_theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('btnThemeToggle').innerText = savedTheme === 'dark' ? '☀️' : '🌓';
}

// --- 3. Auth UI Management ---
function updateAuthButtonUI() {
  const authBtn = document.getElementById('btnGoogleAuth');
  const authText = document.getElementById('authText');
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

function handleRegisterUser(e) {
  e.preventDefault();
  currentUser = {
    name: document.getElementById('regName').value.trim(),
    grade: document.getElementById('regGrade').value,
    major: document.getElementById('regMajor').value,
    email: document.getElementById('regEmail').value.trim(),
    phone: document.getElementById('regPhone').value.trim()
  };
  localStorage.setItem('operin_user', JSON.stringify(currentUser));
  updateAuthButtonUI();
  closeModal('modalAuth');
  alert(`Profil berhasil didaftarkan!\nSelamat datang di Operin SMKN 8 Jakarta, ${currentUser.name}.`);
}

// --- 4. Database Fetching & Rendering ---
async function loadItems() {
  try {
    const response = await fetch('get_items.php');
    allItems = await response.json();
    renderItems();
  } catch (err) {
    document.getElementById('catalogGrid').innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 40px;">
        Gagal tersambung ke database MySQL. Pastikan XAMPP Apache & MySQL aktif.
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
    const matchQ = item.title.toLowerCase().includes(q) || item.cod.toLowerCase().includes(q);
    const matchMajor = !selectedMajor || item.major === selectedMajor;
    const matchScheme = !scheme || item.type === scheme;
    return matchQ && matchMajor && matchScheme;
  });

  if (sort === 'lowest') {
    filtered.sort((a, b) => parseInt(a.price.replace(/[^0-9]/g, '') || 0) - parseInt(b.price.replace(/[^0-9]/g, '') || 0));
  } else if (sort === 'highest') {
    filtered.sort((a, b) => parseInt(b.price.replace(/[^0-9]/g, '') || 0) - parseInt(a.price.replace(/[^0-9]/g, '') || 0));
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
      : `<div class="card-emoji-box">${item.icon || '📦'}</div>`;

    return `
      <div class="tilt-card-wrapper" onmousemove="handleTilt(event, this)" onmouseleave="resetTilt(this)">
        <div class="card-item-glass" onclick="openDetail(${item.id})">
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

// --- 5. 3D Tilt Physics Engine ---
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

// --- 6. Form, Modal & Detail Handlers ---
function togglePriceFields() {
  const scheme = document.getElementById('itemScheme').value;
  document.getElementById('fieldPrice').style.display = scheme === 'Berbayar' ? 'block' : 'none';
  document.getElementById('fieldBarter').style.display = scheme === 'Barter' ? 'block' : 'none';
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function openDetail(id) {
  const item = allItems.find(x => x.id === id);
  if (!item) return;

  activeDetailItem = item; // Simpan barang yang sedang dilihat untuk keperluan booking / WhatsApp

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
    mediaBox.innerHTML = `<div style="height:180px;display:flex;align-items:center;justify-content:center;font-size:4rem;background:rgba(0,0,0,0.03);border-radius:14px;">${item.icon || '📦'}</div>`;
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

// --- 7. Handler Tombol Booking & Direct WhatsApp ke Penjual ---
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

  // Gunakan nomor HP penjual yang tersimpan di database, jika kosong fallback ke no Operin
  let targetPhone = activeDetailItem.sellerPhone || '083171164721';
  
  // Format nomor telepon menjadi standar internasional WhatsApp (628...)
  targetPhone = targetPhone.replace(/[^0-9]/g, '');
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

  // Buka chat WhatsApp langsung ke nomor penitip/penjual
  window.open(`https://wa.me/${targetPhone}?text=${pesan}`, '_blank');
  closeModal('modalDetail');
}

// --- 8. Submit Titip Barang Baru (Sertakan sellerPhone otomatis) ---
async function submitNewItem(e) {
  e.preventDefault();
  if (!currentUser) {
    alert('Kamu harus mendaftar atau masuk akun terlebih dahulu!');
    openModal('modalAuth');
    return;
  }

  const payload = {
    title: document.getElementById('itemTitle').value,
    major: document.getElementById('itemMajor').value,
    type: document.getElementById('itemScheme').value,
    price: document.getElementById('itemPrice').value || '0',
    size: document.getElementById('itemSize').value,
    condition: document.getElementById('itemCondition').value,
    minus: document.getElementById('itemMinus').value,
    barterFor: document.getElementById('itemBarter').value,
    cod: document.getElementById('itemCod').value,
    sellerPhone: currentUser.phone // Mengirim nomor WA aktif siswa yang sedang login
  };

  try {
    const res = await fetch('add_item.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === 'success') {
      alert('Barang praktik berhasil didaftarkan di katalog Operin SMKN 8 Jakarta!');
      closeModal('modalAdd');
      document.getElementById('itemTitle').value = '';
      loadItems();
    } else {
      alert('Gagal menyimpan: ' + result.message);
    }
  } catch (err) {
    alert('Terjadi kesalahan saat menghubungi server.');
  }
}

// --- 9. Chat Assistant Drawer ---
function toggleChat() {
  const card = document.getElementById('chatCard');
  card.style.display = (card.style.display === 'flex') ? 'none' : 'flex';
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

// Inisialisasi awal
updateAuthButtonUI();
loadItems();
attachCursorHoverEffect();