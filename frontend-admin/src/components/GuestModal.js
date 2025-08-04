import React, { useState, useEffect, useCallback } from 'react';
import { getGuests, addGuest, deleteGuest, importGuests } from '../services/api';
import * as XLSX from 'xlsx'; // <-- SOLUSI: Menambahkan import ini


function GuestModal({ invitation, onClose }) {
    const [guests, setGuests] = useState([]);
    const [newGuestName, setNewGuestName] = useState('');
    const [importFile, setImportFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
        /**
     * Fungsi untuk membersihkan parameter link dari kode unik.
     * Contoh: "andi-prasetyo-57a3" menjadi "andi-prasetyo"
     */
    const getCleanLinkParam = (param) => {
        if (!param) return '';
        // Menghapus tanda hubung (-) diikuti 4 karakter acak di akhir
        return param.replace(/-[a-f0-9]{4}$/i, '');
    };


     // --- STATE BARU UNTUK FITUR SELEKSI ---
    const [selectedGuests, setSelectedGuests] = useState([]);

    

    // --- TAMBAHKAN KEMBALI BLOK FUNGSI INTI DI SINI ---

const fetchGuests = useCallback(async () => {
    try {
        setLoading(true);
        const response = await getGuests(invitation.id);
        setGuests(response.data.data);
    } catch (err) {
        setError('Gagal memuat daftar tamu.');
    } finally {
        setLoading(false);
    }
}, [invitation.id]);

useEffect(() => {
    fetchGuests();
}, [fetchGuests]);

const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    try {
        await addGuest({ invitation_id: invitation.id, guest_name: newGuestName });
        setNewGuestName('');
        fetchGuests(); // Refresh list
    } catch (err) {
        alert('Gagal menambah tamu.');
    }
};

   // Ganti seluruh fungsi handleImport Anda dengan ini
 const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // --- LOGIKA BARU UNTUK MEMBACA KOLOM YANG BENAR ---
                // Konversi sheet menjadi array of objects.
                // Ini akan menggunakan baris pertama sebagai header (misal: "No", "Nama")
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    alert("File Excel kosong atau tidak memiliki data.");
                    return;
                }

                // Cek apakah header 'Nama' atau 'nama' ada
                const header = Object.keys(jsonData[0]);
                const nameKey = header.find(key => key.toLowerCase() === 'nama');

                if (!nameKey) {
                    alert("Gagal mengimpor: Pastikan file Excel Anda memiliki kolom dengan judul 'Nama'.");
                    return;
                }

                // Ambil hanya nilai dari kolom 'Nama', dan filter data kosong/tidak valid
                const guestList = jsonData
                    .map(row => row[nameKey]) // Ambil data hanya dari kolom 'Nama'
                    .filter(name => name && typeof name === 'string' && name.trim() !== ''); // Filter data yang valid

                if (guestList.length === 0) {
                    alert("Tidak ada nama tamu yang valid ditemukan di kolom 'Nama'.");
                    return;
                }

                // Panggil fungsi API untuk mengirim data yang sudah bersih
                const response = await importGuests(invitation.id, guestList);
                
                alert(response.data.message);
                fetchGuests();
                e.target.value = null;

            } catch (err) {
                console.error("Import Error:", err);
                alert('Gagal memproses file: ' + (err.response?.data?.message || err.message));
            }
        };
        reader.readAsBinaryString(file);
    };




    const handleSelectGuest = (guestId) => {
        setSelectedGuests(prevSelected => {
            if (prevSelected.includes(guestId)) {
                // Jika sudah ada, hapus dari daftar (uncheck)
                return prevSelected.filter(id => id !== guestId);
            } else {
                // Jika belum ada, tambahkan ke daftar (check)
                return [...prevSelected, guestId];
            }
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Jika "Select All" dicentang, pilih semua ID tamu
            const allGuestIds = guests.map(guest => guest.id);
            setSelectedGuests(allGuestIds);
        } else {
            // Jika tidak, kosongkan daftar pilihan
            setSelectedGuests([]);
        }
    };
    
    // --- FUNGSI BARU UNTUK AKSI TERPILIH ---

    // --- PERBAIKAN DIMULAI DI SINI ---

    const handleCopySelected = () => {
        const selectedData = guests.filter(guest => selectedGuests.includes(guest.id));
        if (selectedData.length === 0) {
            alert('Pilih setidaknya satu tamu untuk disalin.');
            return;
        }

        const publicSiteBaseUrl = 'http://localhost/proyek-undangan/public-site/';

        const textToCopy = selectedData.map(guest => {
            // Panggil fungsi pembersih untuk setiap tamu
            const cleanParam = getCleanLinkParam(guest.unique_link_param);
            // Gunakan parameter yang sudah bersih (cleanParam)
            const link = `${publicSiteBaseUrl}?slug=${invitation.slug}&to=${cleanParam}`;
            // Format yang disalin sekarang adalah: Nama Tamu <TAB> Link Bersih
            return `${guest.guest_name}\t${link}`;
        }).join('\n'); // Pisahkan setiap tamu dengan baris baru

        navigator.clipboard.writeText(textToCopy)
            .then(() => alert(`${selectedData.length} link tamu berhasil disalin!`))
            .catch(() => alert('Gagal menyalin.'));
    };


// --- PERBAIKAN SELESAI ---

    const handleDeleteSelected = async () => {
        if (selectedGuests.length === 0) {
            alert('Pilih setidaknya satu tamu untuk dihapus.');
            return;
        }

        if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedGuests.length} tamu yang dipilih?`)) {
            try {
                // Hapus satu per satu
                await Promise.all(selectedGuests.map(guestId => deleteGuest(invitation.id, guestId)));
                alert('Tamu yang dipilih berhasil dihapus.');
                setSelectedGuests([]); // Kosongkan seleksi
                fetchGuests(); // Refresh daftar tamu
            } catch (err) {
                alert('Terjadi kesalahan saat menghapus beberapa tamu.');
            }
        }
    };


        const copyLink = (guest) => {
        // Panggil fungsi pembersih untuk mendapatkan link yang bersih
        const cleanParam = getCleanLinkParam(guest.unique_link_param);

        const publicSiteBaseUrl = 'http://localhost/proyek-undangan/public-site/';
        
        // Gunakan parameter yang sudah bersih (cleanParam)
        const link = `${publicSiteBaseUrl}?slug=${invitation.slug}&to=${cleanParam}`;
        
        navigator.clipboard.writeText(link)
            .then(() => alert(`Link untuk ${guest.guest_name} berhasil disalin!`))
            .catch(() => alert('Gagal menyalin link.'));
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close">X</button>
                <h2>Daftar Tamu untuk: {invitation.invitation_title}</h2>
                
                <div className="grid-2-col">
                    <div className="card">
                        <h3>Tambah Tamu Manual</h3>
                        <form onSubmit={handleAddGuest}>
                            <div className="form-group">
                                <label>Nama Tamu</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={newGuestName}
                                    onChange={(e) => setNewGuestName(e.target.value)}
                                    placeholder="Masukkan nama tamu"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Tambah</button>
                        </form>
                    </div>
                    <div className="card">
    <h3>Impor dari File</h3>
    <div className="form-group">
        <label>Pilih File (.xlsx, .csv)</label>
        <input 
            type="file" 
            className="form-control"
            accept=".xlsx,.csv"
            // Langsung panggil handleImport saat file dipilih
            onChange={handleImport} 
        />
        <small>Impor nama tamu dari file. Pastikan nama ada di kolom pertama.</small>
    </div>
</div>
                </div>

                <div className="card" style={{ marginTop: '20px' }}>
                    <h3>Daftar Tamu ({guests.length})</h3>
                    {loading && <p>Memuat...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {/* --- TOOLBAR AKSI BARU --- */}
                    {selectedGuests.length > 0 && (
                        <div className="action-toolbar">
                            <span>{selectedGuests.length} tamu dipilih</span>
                            <button onClick={handleCopySelected} className="btn btn-secondary">Salin Link Terpilih</button>
                            <button onClick={handleDeleteSelected} className="btn btn-danger">Hapus Terpilih</button>
                        </div>
                    )}
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    {/* --- CHECKBOX SELECT ALL BARU --- */}
                                    <th style={{ width: '5%' }}>
                                        <input 
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={guests.length > 0 && selectedGuests.length === guests.length}
                                        />
                                    </th>
                                    <th>Nama Tamu</th>
                                    <th>Aksi Individual</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guests.map(guest => (
                                    <tr key={guest.id} className={selectedGuests.includes(guest.id) ? 'selected-row' : ''}>
                                        {/* --- CHECKBOX PER BARIS BARU --- */}
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedGuests.includes(guest.id)}
                                                onChange={() => handleSelectGuest(guest.id)}
                                            />
                                        </td>
                                        <td>{guest.guest_name}</td>
                                        <td>
    <button 
        onClick={() => copyLink(guest)} 
        className="btn btn-secondary"
    >
        Salin Link
    </button>
</td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GuestModal;