import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvitations, deleteInvitation, logout } from '../services/api';
import GuestModal from '../components/GuestModal';
import RsvpModal from '../components/RsvpModal';

function DashboardPage() {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [isGuestModalOpen, setGuestModalOpen] = useState(false);
    const [isRsvpModalOpen, setRsvpModalOpen] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState(null);

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            setLoading(true);
            const response = await getInvitations();
            setInvitations(response.data.data);
            setError('');
        } catch (err) {
            setError('Gagal memuat data undangan.');
        } finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus undangan ini? Semua data terkait akan hilang.')) {
            try {
                await deleteInvitation(id);
                fetchInvitations(); // Refresh list
            } catch (err) {
                alert('Gagal menghapus undangan.');
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            sessionStorage.removeItem('isAuthenticated');
            navigate('/');
        } catch (error) {
            alert('Gagal logout.');
        }
    };

    const openGuestModal = (invitation) => {
        setSelectedInvitation(invitation);
        setGuestModalOpen(true);
    };
    
    const openRsvpModal = (invitation) => {
        setSelectedInvitation(invitation);
        setRsvpModalOpen(true);
    };

    return (
        <div className="container">
            <button onClick={handleLogout} className="btn btn-logout">Logout</button>
            <h1>Dashboard Admin</h1>
            
            <div className="card">
                <h2>Manajemen Undangan</h2>
                <Link to="/create" className="btn btn-primary">+ Buat Undangan Baru</Link>
            </div>

            <div className="card">
                <h2>Daftar Undangan Tersimpan</h2>
                {loading && <p>Memuat...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Judul</th>
                                <th>Mempelai</th>
                                <th>Link</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invitations.map(inv => (
                                <tr key={inv.id}>
                                    <td>{inv.id}</td>
                                    <td>{inv.invitation_title}</td>
                                    <td>{inv.groom_name} & {inv.bride_name}</td>
                                    <td><a href={`/undangan/${inv.slug}`} target="_blank" rel="noopener noreferrer">{inv.slug}</a></td>
                                    <td>
                                        <button onClick={() => openGuestModal(inv)} className="btn btn-secondary">Tamu</button>
                                        <button onClick={() => openRsvpModal(inv)} className="btn btn-warning">RSVP</button>
                                        <Link to={`/edit/${inv.id}`} className="btn btn-primary">Edit</Link>
                                        <button onClick={() => handleDelete(inv.id)} className="btn btn-danger">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isGuestModalOpen && (
                <GuestModal 
                    invitation={selectedInvitation} 
                    onClose={() => setGuestModalOpen(false)} 
                />
            )}

            {isRsvpModalOpen && (
                <RsvpModal 
                    invitation={selectedInvitation}
                    onClose={() => setRsvpModalOpen(false)}
                />
            )}
        </div>
    );
}

export default DashboardPage;
