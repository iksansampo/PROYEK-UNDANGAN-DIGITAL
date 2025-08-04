import React, { useState, useEffect, useCallback } from 'react';
import { getRsvps, exportRsvps } from '../services/api';
import fileDownload from 'js-file-download';

function RsvpModal({ invitation, onClose }) {
    const [rsvps, setRsvps] = useState([]);
    const [recap, setRecap] = useState({ Hadir: 0, 'Tidak Hadir': 0, Ragu: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRsvps = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getRsvps(invitation.id);
            setRsvps(response.data.data);
            setRecap(response.data.recap);
        } catch (err) {
            setError('Gagal memuat data RSVP.');
        } finally {
            setLoading(false);
        }
    }, [invitation.id]);

    useEffect(() => {
        fetchRsvps();
    }, [fetchRsvps]);

    const handleExport = async (format) => {
        try {
            const response = await exportRsvps(invitation.id, format);
            fileDownload(response.data, `rsvp_export_${invitation.id}.${format}`);
        } catch (err) {
            alert(`Gagal mengekspor data ke .${format}`);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close">X</button>
                <h2>Daftar RSVP: {invitation.invitation_title}</h2>

                <div className="card">
                    <h3>Rekapitulasi</h3>
                    <p>
                        <strong>Hadir:</strong> {recap.Hadir} | 
                        <strong> Tidak Hadir:</strong> {recap['Tidak Hadir']} | 
                        <strong> Total:</strong> {rsvps.length}
                    </p>
                    <button onClick={() => handleExport('csv')} className="btn btn-secondary">Ekspor .csv</button>
                    <button onClick={() => handleExport('txt')} className="btn btn-secondary">Ekspor .txt</button>
                </div>

                <div className="card" style={{ marginTop: '20px' }}>
                    <h3>Daftar Ucapan & Doa</h3>
                    {loading && <p>Memuat...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Kehadiran</th>
                                    <th>Pesan</th>
                                    <th>Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rsvps.map((rsvp, index) => (
                                    <tr key={index}>
                                        <td>{rsvp.guest_name}</td>
                                        <td>{rsvp.attendance_status}</td>
                                        <td>{rsvp.message}</td>
                                        <td>{new Date(rsvp.submitted_at).toLocaleString('id-ID')}</td>
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

export default RsvpModal;
