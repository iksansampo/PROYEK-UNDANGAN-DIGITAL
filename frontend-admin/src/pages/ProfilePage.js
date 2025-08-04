import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Pastikan path ini benar

function ProfilePage() {
    const [profile, setProfile] = useState({
        whatsapp_number: '',
        instagram_username: '',
        blog_url: ''
    });
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Ambil data profil saat komponen dimuat
        api.get('/user-profile')
            .then(response => {
                setProfile(response.data.data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error("Gagal memuat profil:", error);
                setIsLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prevProfile => ({
            ...prevProfile,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFeedback('Menyimpan...');
        api.post('/user-profile', profile)
            .then(response => {
                setFeedback('Profil berhasil diperbarui!');
            })
            .catch(error => {
                setFeedback('Gagal menyimpan profil. Coba lagi.');
                console.error("Gagal menyimpan profil:", error);
            });
    };

    if (isLoading) {
        return <div>Memuat profil...</div>;
    }

    return (
        <div className="container">
            <h1>Pengaturan Profil & Sosial Media</h1>
            <p>Link yang Anda isi di sini akan muncul di bagian bawah setiap undangan yang Anda buat.</p>
            
            <form onSubmit={handleSubmit} className="card">
                <div className="form-group">
                    <label htmlFor="whatsapp_number">Nomor WhatsApp</label>
                    <input
                        type="text"
                        id="whatsapp_number"
                        name="whatsapp_number"
                        value={profile.whatsapp_number || ''}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Contoh: 6281234567890 (tanpa + atau 0 di depan)"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="instagram_username">Username Instagram</label>
                    <input
                        type="text"
                        id="instagram_username"
                        name="instagram_username"
                        value={profile.instagram_username || ''}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Contoh: nama_anda (tanpa @)"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="blog_url">URL Website atau Blog</label>
                    <input
                        type="url"
                        id="blog_url"
                        name="blog_url"
                        value={profile.blog_url || ''}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Contoh: https://www.websiteanda.com"
                    />
                </div>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
                {feedback && <p style={{ marginTop: '1rem' }}>{feedback}</p>}
            </form>
        </div>
    );
}

export default ProfilePage;
