import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvitationById } from '../services/api';
import InvitationForm from '../components/InvitationForm';
    
    

function EditInvitationPage() {
    const { id } = useParams(); // Mendapatkan ID dari URL, jika ada
    const navigate = useNavigate();
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const isCreating = !id; // Mode 'create' jika tidak ada ID

    useEffect(() => {
        if (!isCreating) {
            getInvitationById(id)
                .then(response => {
                    setInitialData(response.data.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Gagal mengambil data undangan:", error);
                    alert('Gagal mengambil data undangan.');
                    navigate('/dashboard');
                });
        } else {
            setLoading(false);
        }
    }, [id, isCreating, navigate]);

    if (loading) {
        return <div className="container"><h2>Memuat data form...</h2></div>;
    }

    return (
        <div className="container">
            <h1>{isCreating ? 'Buat Undangan Baru' : 'Edit Undangan'}</h1>
            <InvitationForm initialData={initialData} invitationId={id} isCreating={isCreating} />
        </div>
    );
}

export default EditInvitationPage;