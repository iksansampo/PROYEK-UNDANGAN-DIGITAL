// ================================================================================================
// File: public-site/js/main.js
// Deskripsi: JavaScript utama untuk halaman undangan publik.
// Versi ini sudah termasuk logika untuk memuat CSS template secara dinamis.
// ================================================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Variabel Global & Elemen DOM ---
    const API_BASE_URL = 'http://localhost/proyek-undangan/backend';
    
    const coverSection = document.getElementById('cover');
    const mainContent = document.getElementById('main-content');
    const openInvitationBtn = document.getElementById('open-invitation-btn');
    const guestNameEl = document.getElementById('guest-name');
    const coverCoupleNamesEl = document.getElementById('cover-couple-names');
    const dynamicSectionsContainer = document.getElementById('dynamic-sections-container');
    const musicControlBtn = document.getElementById('music-control');
    const backgroundMusic = document.getElementById('background-music');

    let invitationData = null;
    let countdownInterval = null;
    let lastRsvpTimestamp = null;
    let rsvpPollingInterval = null;

    // --- Fungsi Utama ---

    /**
     * Mengambil slug undangan dan nama tamu dari URL.
     */
    const getUrlParams = () => {
        const queryParams = new URLSearchParams(window.location.search);
        const slug = queryParams.get('slug'); // Dari .htaccess
        const guestParam = queryParams.get('to'); // ?to=Nama-Tamu-Unik
        return { slug, guestParam };
    };
    
    /**
     * FUNGSI BARU: Memuat file CSS untuk template yang dipilih secara dinamis.
     * @param {string} templateCode - Kode unik template, cth: "elegant".
     */
    const loadTemplateCss = (templateCode) => {
        if (!templateCode) {
            console.log("Tidak ada template dipilih, menggunakan style default.");
            return;
        }

        const head = document.head;
        const link = document.createElement('link');

        link.id = 'dynamic-template-style'; // Beri ID agar bisa dicek/dihapus jika perlu
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = `css/template-${templateCode}.css`; // cth: css/template-elegant.css

        head.appendChild(link);
    };

    /**
     * Mengambil data undangan lengkap dari backend.
     * @param {string} slug - Slug unik undangan.
     */
    // --- GANTI DENGAN FUNGSI BARU INI ---
    const fetchInvitationData = async (slug) => {
        if (!slug) {
            showError('Undangan tidak valid.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/public/${slug}`);
            if (!response.ok) {
                throw new Error('Undangan tidak ditemukan atau terjadi kesalahan server.');
            }
            const result = await response.json();
            if (result.status === 'success') {
                invitationData = result.data;
                document.title = invitationData.invitation.invitation_title;
                
                // === INI PERBAIKAN KUNCINYA ===
                // Kita ambil 'template_code' dari dalam objek 'invitation'
                loadTemplateCss(invitationData.invitation.template_code);
                
                await populatePage();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            showError(error.message);
        }
    };

    /**
     * Menampilkan pesan error di halaman.
     * @param {string} message - Pesan error yang akan ditampilkan.
     */
    const showError = (message) => {
        coverSection.innerHTML = `<div class="cover-content"><h1>Error</h1><p>${message}</p></div>`;
        coverSection.style.opacity = 1;
        coverSection.style.visibility = 'visible';
    };

    /**
     * Mengisi seluruh halaman dengan data yang telah diambil.
     */
    const populatePage = async () => {
        const { guestParam } = getUrlParams();
        
        // 1. Atur Halaman Pembuka (Cover)
        coverCoupleNamesEl.textContent = `${invitationData.couple.groom_name} & ${invitationData.couple.bride_name}`;
        if (invitationData.invitation.cover_image) {
            coverSection.style.backgroundImage = `url(${API_BASE_URL}/${invitationData.invitation.cover_image})`;
        }
// Ganti blok logika nama tamu Anda dengan ini
let guestDisplayName = "Tamu Undangan"; // Teks default

if (guestParam) {
    // Langkah 1: Ganti tanda hubung dengan spasi.
    // Contoh: "andi-prasetyo-57a3" menjadi "andi prasetyo 57a3"
    let name = guestParam.replace(/-/g, ' ');

    // Langkah 2: Hapus kode unik di akhir jika ada.
    // Regex ini mencari spasi yang diikuti oleh kombinasi huruf dan angka di akhir string, lalu menghapusnya.
    name = name.replace(/\s[a-f0-9]+$/i, '');

    // Langkah 3: Ubah formatnya menjadi Judul (Huruf Kapital di Awal Setiap Kata).
    // Contoh: "andi prasetyo" menjadi "Andi Prasetyo"
    guestDisplayName = name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Terapkan nama yang sudah bersih dan rapi ke elemen di halaman cover.
guestNameEl.textContent = guestDisplayName;



    // 2. Render semua seksi sesuai urutan dari admin
    const sectionOrder = invitationData.invitation.section_order || [];
    dynamicSectionsContainer.innerHTML = ''; // Kosongkan container
        
        // Selalu render Hero section pertama kali
        renderHeroSection(); 

        sectionOrder.forEach(sectionId => {
            switch (sectionId) {
                case 'couple': renderCoupleSection(); break;
                case 'events': renderEventsSection(); break;
                case 'stories': renderStoriesSection(); break;
                case 'gallery': renderGallerySection(); break;
                case 'gifts': renderGiftsSection(); break;
            }
        });
        
        // Selalu render RSVP section di akhir
        renderRsvpSection();
        renderFooter();
        
        // Isi nama di form RSVP secara otomatis
        document.getElementById('rsvp-name').value = guestDisplayName;

        // 3. Atur Musik
        if (invitationData.invitation.background_music) {
            backgroundMusic.src = `${API_BASE_URL}/${invitationData.invitation.background_music}`;
        }
    };

    // --- Fungsi Render untuk Setiap Seksi (Tidak ada perubahan di sini) ---

    const renderHeroSection = () => {
        const { invitation, couple } = invitationData;
        const heroHtml = `
            <section id="hero" class="hero-section" style="background-image: url(${API_BASE_URL}/${invitation.cover_image})">
                <div class="hero-content">
                    <p>We Are Getting Married</p>
                    <h1>${couple.groom_name} & ${couple.bride_name}</h1>
                </div>
            </section>
        `;
        dynamicSectionsContainer.insertAdjacentHTML('beforeend', heroHtml);
    };

    // Ganti seluruh fungsi renderCoupleSection Anda dengan kode yang sudah disesuaikan ini.
// Ganti seluruh fungsi renderCoupleSection Anda dengan kode ini.
const renderCoupleSection = () => {
    const { couple } = invitationData;

    // Fungsi bantuan ini tidak perlu diubah, sudah benar.
    const createInstagramLink = (input) => {
        if (!input) {
            return '';
        }
        let username = input.includes('instagram.com') ? input.split('/').pop() : input;
        let url = input.startsWith('http') ? input : `https://${input.includes('instagram.com') ? input : 'instagram.com/' + input}`;
        username = username.replace(/\/$/, "");

        return `<a href="${url}" target="_blank" class="social-icon">
                   <i class="fab fa-instagram"></i>
                   <span>@${username}</span>
               </a>`;
    };

    const groomInstaHtml = createInstagramLink(couple.groom_instagram);
    const brideInstaHtml = createInstagramLink(couple.bride_instagram);

    // --- PERUBAHAN UTAMA HANYA ADA DI DALAM BLOK HTML DI BAWAH INI ---
    const coupleHtml = `
        <section id="couple" class="section">
            <h2 class="section-title">The Couple</h2>
            <p class="section-subtitle">Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:</p>
            <div class="couple-container">
                <div class="couple-profile">
                    <img src="${API_BASE_URL}/${couple.groom_photo}" alt="Mempelai Pria" class="couple-photo">
                    <h3 class="couple-name">${couple.groom_name}</h3>
                    <p class="couple-parents">Putra dari Bapak ${couple.groom_father}<br>& Ibu ${couple.groom_mother}</p>
                    ${groomInstaHtml} <!-- POSISI SUDAH DIPINDAHKAN KE BAWAH NAMA ORANG TUA -->
                </div>
                <span class="couple-separator">&</span>
                <div class="couple-profile">
                    <img src="${API_BASE_URL}/${couple.bride_photo}" alt="Mempelai Wanita" class="couple-photo">
                    <h3 class="couple-name">${couple.bride_name}</h3>
                    <p class="couple-parents">Putri dari Bapak ${couple.bride_father}<br>& Ibu ${couple.bride_mother}</p>
                    ${brideInstaHtml} <!-- POSISI SUDAH DIPINDAHKAN KE BAWAH NAMA ORANG TUA -->
                </div>
            </div>
        </section>
    `;
    
    dynamicSectionsContainer.insertAdjacentHTML('beforeend', coupleHtml);
};


    
    const renderEventsSection = () => {
        const { events } = invitationData;
        if (!events || events.length === 0) return;

        const eventCardsHtml = events.map(event => {
            const eventDate = new Date(event.event_date + 'T' + event.start_time);
            const dateString = eventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeString = eventDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="event-card">
                    <h3>${event.event_name}</h3>
                    <p><i class="fas fa-calendar-alt"></i> ${dateString}</p>
                    <p><i class="fas fa-clock"></i> ${timeString} WIB - Selesai</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.location_name}</p>
                    <a href="${event.maps_url}" target="_blank" class="btn-map">Lihat Peta</a>
                </div>
            `;
        }).join('');

        const eventsHtml = `
            <section id="events" class="section">
                <h2 class="section-title">Save The Date</h2>
                <div class="events-container">${eventCardsHtml}</div>
                <div id="countdown"></div>
            </section>
        `;
        dynamicSectionsContainer.insertAdjacentHTML('beforeend', eventsHtml);
        startCountdown(events[0].event_date);
    };

    const renderStoriesSection = () => {
        const { stories } = invitationData;
        if (!stories || stories.length === 0) return;

        const storyItemsHtml = stories.map((story, index) => `
            <div class="story-item ${index % 2 === 0 ? 'left' : 'right'}">
                <div class="story-content">
                    <h3>${story.story_title} - ${story.story_year}</h3>
                    <p>${story.story_description}</p>
                </div>
            </div>
        `).join('');

        const storiesHtml = `
            <section id="stories" class="section">
                <h2 class="section-title">Our Love Story</h2>
                <div class="story-timeline">${storyItemsHtml}</div>
            </section>
        `;
        dynamicSectionsContainer.insertAdjacentHTML('beforeend', storiesHtml);
    };

    const renderGallerySection = () => {
        const { galleries } = invitationData;
        if (!galleries || galleries.length === 0) return;

        const galleryItemsHtml = galleries.map(item => `
            <div class="gallery-item">
                <img src="${API_BASE_URL}/${item.media_url}" alt="Foto Galeri">
            </div>
        `).join('');

        const galleryHtml = `
            <section id="gallery" class="section">
                <h2 class="section-title">Our Moments</h2>
                <div class="gallery-grid">${galleryItemsHtml}</div>
            </section>
        `;
        dynamicSectionsContainer.insertAdjacentHTML('beforeend', galleryHtml);
    };

    const renderGiftsSection = () => {
        const { gifts } = invitationData;
        if (!gifts || gifts.length === 0) return;

        const giftCardsHtml = gifts.map(gift => `
            <div class="gift-card">
                <h4>${gift.bank_name}</h4>
                <p>${gift.account_number}</p>
                <p>a.n. ${gift.account_holder_name}</p>
                <button class="btn-copy" data-account="${gift.account_number}">Salin Nomor</button>
            </div>
        `).join('');

        const giftsHtml = `
            <section id="gifts" class="section">
                <h2 class="section-title">Wedding Gift</h2>
                <p class="section-subtitle">Doa restu Anda adalah hadiah terindah bagi kami. Namun, jika Anda ingin memberikan tanda kasih, kami dengan senang hati menerimanya.</p>
                ${giftCardsHtml}
            </section>
        `;
        dynamicSectionsContainer.insertAdjacentHTML('beforeend', giftsHtml);
    };

// Ganti seluruh fungsi renderRsvpSection Anda dengan kode di bawah ini.
const renderRsvpSection = () => {
    // 1. Membuat struktur HTML untuk seksi RSVP
    const rsvpHtml = `
        <section id="rsvp" class="section">
            <h2 class="section-title">RSVP & Wishes</h2>
            <p class="section-subtitle">Mohon konfirmasi kehadiran Anda untuk membantu kami mempersiapkan acara ini dengan lebih baik.</p>
            <form id="rsvp-form">
                <div class="form-group">
                    <label for="rsvp-name">Nama Anda</label>
                    <input type="text" id="rsvp-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="rsvp-status">Konfirmasi Kehadiran</label>
                    <select id="rsvp-status" class="form-control" required>
                        <option value="Hadir">Ya, saya akan hadir</option>
                        <option value="Tidak Hadir">Maaf, tidak bisa hadir</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="rsvp-message">Ucapan & Doa</label>
                    <textarea id="rsvp-message" class="form-control" placeholder="Tulis ucapan dan doa Anda di sini..."></textarea>
                </div>
                <button type="submit" class="btn-submit">Kirim Konfirmasi</button>
            </form>
            <h3 style="margin-top: 50px;">Ucapan & Doa</h3>
            <div class="wishes-list-container">
                <div class="wishes-list">
                    <!-- Placeholder ini akan diganti oleh data ucapan -->
                    <p class="placeholder-wish">Memuat ucapan...</p>
                </div>
            </div>
        </section>
    `;
    dynamicSectionsContainer.insertAdjacentHTML('beforeend', rsvpHtml);

    // --- INILAH PERBAIKAN UTAMANYA ---
    // 2. Langsung gunakan data RSVP yang sudah ada dari `invitationData`
    //    Kita tidak perlu lagi melakukan `fetch` kedua kali.
    const wishesList = document.querySelector('.wishes-list');
    const initialWishes = invitationData.rsvps; // Mengambil data dari paket awal

    if (initialWishes && initialWishes.length > 0) {
        // Balik urutan agar yang terlama muncul pertama kali saat load
        renderNewWishes(initialWishes.reverse()); 
    } else {
        // Jika tidak ada ucapan, tampilkan pesan placeholder
        wishesList.querySelector('.placeholder-wish').textContent = 'Jadilah yang pertama mengirim ucapan!';
    }
    
    // 3. Mulai polling untuk ucapan baru setelah data awal ditampilkan
    startRsvpPolling(invitationData.invitation.id);
};

    
         // --- GANTI DENGAN FUNGSI BARU INI ---
    const renderFooter = () => {
        const { invitation, couple } = invitationData;
        
        let socialLinksHtml = '';
        if (invitation.whatsapp_number) {
            socialLinksHtml += `<a href="https://wa.me/${invitation.whatsapp_number}" target="_blank" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
        }
        if (invitation.instagram_username) {
            socialLinksHtml += `<a href="https://instagram.com/${invitation.instagram_username}" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        }
        if (invitation.blog_url) {
            socialLinksHtml += `<a href="${invitation.blog_url}" target="_blank" title="Website/Blog"><i class="fas fa-globe"></i></a>`;
        }

        // --- STRUKTUR HTML BARU UNTUK FOOTER DAN NAVIGASI BAWAH ---
        const footerAndNavHtml = `
            <footer class="main-footer">
                ${socialLinksHtml ? `
                <div class="made-with">
                    <p>Invitation created with <i class="fas fa-heart"></i> by</p>
                    <div class="social-links">
                        ${socialLinksHtml}
                    </div>
                </div>
                ` : ''}
                <div class="copyright">
                    <p>&copy; ${new Date().getFullYear()} ${couple.groom_name} & ${couple.bride_name}</p>
                </div>
            </footer>

            <nav id="bottom-nav" class="bottom-nav">
                <a href="#hero" class="nav-item active">
                    <i class="fas fa-home"></i>
                    <span>Beranda</span>
                </a>
                <a href="#couple" class="nav-item">
                    <i class="fas fa-heart"></i>
                    <span>Mempelai</span>
                </a>
                <a href="#events" class="nav-item">
                    <i class="fas fa-calendar-check"></i>
                    <span>Acara</span>
                </a>
                <a href="#stories" class="nav-item">
                    <i class="fas fa-book-open"></i>
                    <span>Cerita</span>
                </a>
                <a href="#gallery" class="nav-item">
                    <i class="fas fa-images"></i>
                    <span>Galeri</span>
                </a>
                <a href="#gifts" class="nav-item">
                    <i class="fas fa-gift"></i>
                    <span>Amplop</span>
                </a>
                <a href="#rsvp" class="nav-item">
                    <i class="fas fa-envelope-open-text"></i>
                    <span>RSVP</span>
                </a>
            </nav>
        `;
        // Menggunakan insertAdjacentHTML pada body agar nav tidak ikut ter-scroll
        document.body.insertAdjacentHTML('beforeend', footerAndNavHtml);
    };





/**
 * Fungsi baru untuk menampilkan kartu ucapan di halaman TANPA DUPLIKAT.
 * @param {Array} wishes - Array berisi objek ucapan dari server.
 */
const renderNewWishes = (wishes) => {
    const wishesList = document.querySelector('.wishes-list');
    if (!wishesList) return;

    const placeholder = wishesList.querySelector('.placeholder-wish');
    if (placeholder) placeholder.remove();

    wishes.forEach(wish => {
        // --- INI BAGIAN PENTING UNTUK MENCEGAH DUPLIKAT ---
        const wishId = `wish-${wish.id}`;
        if (document.getElementById(wishId)) {
            return; // Jika ucapan dengan ID ini sudah ada, jangan render lagi.
        }
        // ----------------------------------------------------

        const wishCard = document.createElement('div');
        wishCard.className = 'wish-card animate-in';
        wishCard.id = wishId; // Beri ID unik pada elemen kartu
        wishCard.innerHTML = `
            <strong>${wish.guest_name}</strong>
            <p>${wish.message}</p>
            <small>${new Date(wish.submitted_at).toLocaleString('id-ID')}</small>
        `;
        wishesList.appendChild(wishCard);
        lastRsvpTimestamp = wish.submitted_at; // Simpan timestamp terakhir
    });

    // Auto-scroll ke bawah hanya jika ada ucapan baru
    if (wishes.length > 0) {
        wishesList.scrollTop = wishesList.scrollHeight;
    }
};


const startRsvpPolling = (invitationId) => {
    if (rsvpPollingInterval) clearInterval(rsvpPollingInterval);
    rsvpPollingInterval = setInterval(async () => {
        if (!lastRsvpTimestamp) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/rsvps/${invitationId}?latest_timestamp=${lastRsvpTimestamp}`);
            const result = await response.json();
            if (result.status === 'success' && result.data.length > 0) {
                renderNewWishes(result.data);
            }
        } catch (error) { console.error("Polling error:", error); }
    }, 7000);
};

    // --- Fungsi Interaktivitas (Tidak ada perubahan di sini) ---

    const startCountdown = (eventDateStr) => {
        if (countdownInterval) clearInterval(countdownInterval);
        
        const countdownEl = document.getElementById('countdown');
        if (!countdownEl) return;

        const targetDate = new Date(eventDateStr).getTime();

        countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownEl.innerHTML = "<p>Acara telah berlangsung!</p>";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownEl.innerHTML = `
                <div class="countdown-box"><span>${days}</span><p>Hari</p></div>
                <div class="countdown-box"><span>${hours}</span><p>Jam</p></div>
                <div class="countdown-box"><span>${minutes}</span><p>Menit</p></div>
                <div class="countdown-box"><span>${seconds}</span><p>Detik</p></div>
            `;
        }, 1000);
    };

// Ganti seluruh fungsi handleRsvpSubmit Anda dengan kode ini.
const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    const rsvpForm = e.target;
    const submitButton = rsvpForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Mengirim...';

    const rsvpData = {
        invitation_id: invitationData.invitation.id,
        guest_name: document.getElementById('rsvp-name').value,
        attendance_status: document.getElementById('rsvp-status').value,
        message: document.getElementById('rsvp-message').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/rsvps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rsvpData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        // --- INI PERUBAHANNYA ---
        // Ganti alert() dengan notifikasi kustom yang baru kita buat.
        showToastNotification(result.message, 'success');
        
        // Kosongkan form setelah berhasil
        rsvpForm.reset();
        // Isi kembali nama tamu yang sudah ada di cover
        const guestDisplayName = document.getElementById('guest-name').textContent;
        document.getElementById('rsvp-name').value = guestDisplayName; 

    } catch (error) {
        // Tampilkan notifikasi error jika gagal
        showToastNotification('Gagal mengirim RSVP: ' + error.message, 'error');
    } finally {
        // Kembalikan tombol ke keadaan semula
        submitButton.disabled = false;
        submitButton.textContent = 'Kirim Konfirmasi';
    }
};


/**
 * FUNGSI BARU: Menampilkan notifikasi kustom (toast) yang lebih modern.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {string} type - Tipe notifikasi ('success' atau 'error').
 */
const showToastNotification = (message, type = 'success') => {
    // Hapus toast lama jika ada, untuk mencegah tumpukan notifikasi
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) {
        oldToast.remove();
    }

    // Buat elemen div untuk notifikasi
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`; // Kelas untuk styling success/error
    toast.textContent = message;

    // Tambahkan style langsung via JavaScript agar tidak perlu mengubah file CSS
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: type === 'success' ? '#4CAF50' : '#F44336', // Hijau untuk sukses, Merah untuk error
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        zIndex: '1000',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        opacity: '0',
        transition: 'opacity 0.5s, bottom 0.5s',
    });

    // Tambahkan toast ke body
    document.body.appendChild(toast);

    // Animasi muncul
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.bottom = '40px';
    }, 100);

    // Animasi hilang setelah 3 detik
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.bottom = '20px';
        // Hapus elemen dari DOM setelah animasi selesai
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
};



    
    const handleCopyClick = (e) => {
        if (e.target.classList.contains('btn-copy')) {
            const accountNumber = e.target.dataset.account;
            navigator.clipboard.writeText(accountNumber).then(() => {
                e.target.textContent = 'Berhasil Disalin!';
                setTimeout(() => { e.target.textContent = 'Salin Nomor'; }, 2000);
            }).catch(() => {
                alert('Gagal menyalin nomor rekening.');
            });
        }
    };

    const setupScrollAnimations = () => {
        const sections = document.querySelectorAll('.section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => observer.observe(section));
    };
    
        // --- GANTI DENGAN FUNGSI BARU INI ---
    const setupActiveNav = () => {
        // Targetkan item di menu navigasi bawah yang baru
        const navLinks = document.querySelectorAll('.bottom-nav .nav-item');
        const sections = document.querySelectorAll('section[id]');
        
        window.addEventListener('scroll', () => {
            let currentSectionId = '';
            
            // Cari tahu seksi mana yang sedang terlihat di layar
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (window.pageYOffset >= sectionTop - (window.innerHeight / 2)) {
                    currentSectionId = section.getAttribute('id');
                }
            });

            // Perbarui kelas 'active' pada setiap link navigasi
            navLinks.forEach(link => {
                link.classList.remove('active');
                // Cek apakah href dari link mengandung ID seksi yang sedang aktif
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        });
    };


    // --- Event Listeners ---

    openInvitationBtn.addEventListener('click', () => {
        coverSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        document.body.classList.remove('no-scroll');
        
        if (backgroundMusic.src) {
            backgroundMusic.play().catch(e => console.error("Autoplay musik gagal:", e));
            musicControlBtn.classList.remove('hidden');
            musicControlBtn.classList.add('playing');
        }
        
        // Setup animasi dan nav setelah konten utama tampil
        setupScrollAnimations();
        setupActiveNav();
    });

    musicControlBtn.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            musicControlBtn.classList.add('playing');
        } else {
            backgroundMusic.pause();
            musicControlBtn.classList.remove('playing');
        }
    });
    
    // Event delegation untuk form RSVP dan tombol copy
    document.body.addEventListener('submit', e => {
        if (e.target.id === 'rsvp-form') {
            handleRsvpSubmit(e);
        }
    });
    document.body.addEventListener('click', e => {
        handleCopyClick(e);
    });

    // --- Inisialisasi ---
    const { slug } = getUrlParams();
    document.body.classList.add('no-scroll'); // Cegah scroll saat cover aktif
    fetchInvitationData(slug);
});
