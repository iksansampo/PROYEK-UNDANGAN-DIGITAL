import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInvitation, updateInvitation, uploadFile, getTemplates } from '../services/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
    
    

const defaultSections = [
    { id: 'couple', name: 'Data Mempelai' },
    { id: 'events', name: 'Data Acara' },
    { id: 'stories', name: 'Cerita Cinta' },
    { id: 'gallery', name: 'Galeri' },
    { id: 'gifts', name: 'Amplop Digital' },
];

function InvitationForm({ initialData, invitationId, isCreating }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        invitation: { invitation_title: '', cover_image: '', background_music: '', template_id: 'null', section_order: defaultSections.map(s => s.id) },
        couple: { groom_name: '', groom_father: '', groom_mother: '', groom_photo: '', bride_name: '', bride_father: '', bride_mother: '', bride_photo: '' },
        events: [{ event_name: 'Akad Nikah', event_date: '', start_time: '', end_time: '', location_name: '', address: '', maps_url: '' }],
        stories: [{ story_year: '', story_title: '', story_description: '' }],
        galleries: [],
        gifts: [{ bank_name: '', account_number: '', account_holder_name: '' }]
    });
    const [sections, setSections] = useState(defaultSections);

        // TAMBAHKAN STATE BARU UNTUK MENYIMPAN TEMPLATE
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // EFEK BARU UNTUK MENGAMBIL DATA TEMPLATE
    useEffect(() => {
        getTemplates()
            .then(response => {
                setTemplates(response.data.data);
                setLoadingTemplates(false);
            })
            .catch(error => {
                console.error("Gagal mengambil template:", error);
                alert("Gagal memuat daftar template.");
                setLoadingTemplates(false);
            });
    }, []);


    useEffect(() => {
        if (initialData) {
            // Memastikan semua bagian data ada untuk menghindari error
            const populatedData = {
                invitation: initialData.invitation || formData.invitation,
                couple: initialData.couple || formData.couple,
                events: initialData.events?.length > 0 ? initialData.events : formData.events,
                stories: initialData.stories?.length > 0 ? initialData.stories : formData.stories,
                galleries: initialData.galleries || formData.galleries,
                gifts: initialData.gifts?.length > 0 ? initialData.gifts : formData.gifts,
            };
            setFormData(populatedData);
            
            // Mengatur urutan seksi berdasarkan data dari DB
            const orderedSections = initialData.invitation.section_order.map(id => 
                defaultSections.find(s => s.id === id)
            ).filter(Boolean); // Filter jika ada id yang tidak valid
            setSections(orderedSections);
        }
    }, [initialData]);

    const handleInputChange = (section, index, e) => {
        const { name, value } = e.target;
        const updatedSection = [...formData[section]];
        updatedSection[index][name] = value;
        setFormData({ ...formData, [section]: updatedSection });
    };
    
    const handleSimpleChange = (section, e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [section]: { ...formData[section], [name]: value } });
    };

    const handleFileChange = async (section, name, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const response = await uploadFile(uploadData);
            setFormData({ ...formData, [section]: { ...formData[section], [name]: response.data.filePath } });
            alert('File berhasil di-upload!');
        } catch (error) {
            alert('Gagal upload file.');
        }
    };
    
    const handleGalleryFilesChange = async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        const uploadPromises = Array.from(files).map(async file => {
            const uploadData = new FormData();
            uploadData.append('file', file);
            const response = await uploadFile(uploadData);
            // Asumsi semua adalah foto untuk saat ini
            return { media_type: 'photo', media_url: response.data.filePath };
        });

        try {
            const newGalleryItems = await Promise.all(uploadPromises);
            setFormData(prev => ({ ...prev, galleries: [...prev.galleries, ...newGalleryItems] }));
            alert(`${files.length} file galeri berhasil di-upload!`);
        } catch (error) {
            alert('Gagal upload beberapa file galeri.');
        }
    };

    const addItem = (section, newItem) => {
        setFormData({ ...formData, [section]: [...formData[section], newItem] });
    };

    const removeItem = (section, index) => {
        const updatedSection = formData[section].filter((_, i) => i !== index);
        setFormData({ ...formData, [section]: updatedSection });
    };
    
    const handleOnDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(sections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setSections(items);
        setFormData(prev => ({
            ...prev,
            invitation: { ...prev.invitation, section_order: items.map(s => s.id) }
        }));
    };

        // Fungsi baru untuk memilih template
    const handleTemplateSelect = (templateId) => {
        setFormData(prev => ({
            ...prev,
            invitation: { ...prev.invitation, template_id: templateId }
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isCreating) {
                await createInvitation(formData);
                alert('Undangan berhasil dibuat!');
            } else {
                await updateInvitation(invitationId, formData);
                alert('Undangan berhasil diperbarui!');
            }
            navigate('/dashboard');
        } catch (error) {
            alert('Terjadi kesalahan: ' + (error.response?.data?.message || error.message));
        }
    };
    
    const renderSection = (sectionId) => {
        switch(sectionId) {
            case 'couple':
                return (
                    <div className="card">
                        <h3>Data Mempelai</h3>
                        <div className="grid-2-col">
                            <div>
                                <h4>Mempelai Pria</h4>
                                <div className="form-group">
                                    <label>Nama Mempelai Pria</label>
                                    <input type="text" name="groom_name" value={formData.couple.groom_name} onChange={(e) => handleSimpleChange('couple', e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Nama Ayah</label>
                                    <input type="text" name="groom_father" value={formData.couple.groom_father} onChange={(e) => handleSimpleChange('couple', e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Nama Ibu</label>
                                    <input type="text" name="groom_mother" value={formData.couple.groom_mother} onChange={(e) => handleSimpleChange('couple', e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Foto Mempelai Pria</label>
                                    <input type="file" name="groom_photo" onChange={(e) => handleFileChange('couple', 'groom_photo', e)} className="form-control" />
                                    {formData.couple.groom_photo && <img src={`http://localhost/proyek-undangan/backend/${formData.couple.groom_photo}`} alt="Groom" width="100" />}
                                </div>
                            </div>
                            <div>
                                <h4>Mempelai Wanita</h4>
                                <div className="form-group">
                                    <label>Nama Mempelai Wanita</label>
                                    <input type="text" name="bride_name" value={formData.couple.bride_name} onChange={(e) => handleSimpleChange('couple', e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Nama Ayah</label>
                                    <input type="text" name="bride_father" value={formData.couple.bride_father} onChange={(e) => handleSimpleChange('couple', e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Nama Ibu</label>
                                    <input type="text" name="bride_mother" value={formData.couple.bride_mother} onChange={(e) => handleSimpleChange('couple', e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Foto Mempelai Wanita</label>
                                    <input type="file" name="bride_photo" onChange={(e) => handleFileChange('couple', 'bride_photo', e)} className="form-control" />
                                    {formData.couple.bride_photo && <img src={`http://localhost/proyek-undangan/backend/${formData.couple.bride_photo}`} alt="Bride" width="100" />}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'events':
                return (
                    <div className="card">
                        <h3>Data Acara</h3>
                        {formData.events.map((event, index) => (
                            <div key={index} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                                <div className="form-group">
                                    <label>Nama Acara</label>
                                    <input type="text" name="event_name" value={event.event_name} onChange={(e) => handleInputChange('events', index, e)} className="form-control" />
                                </div>
                                <div className="grid-2-col">
                                    <div className="form-group">
                                        <label>Tanggal</label>
                                        <input type="date" name="event_date" value={event.event_date} onChange={(e) => handleInputChange('events', index, e)} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Waktu Mulai</label>
                                        <input type="time" name="start_time" value={event.start_time} onChange={(e) => handleInputChange('events', index, e)} className="form-control" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Lokasi</label>
                                    <input type="text" name="location_name" value={event.location_name} onChange={(e) => handleInputChange('events', index, e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Link Google Maps</label>
                                    <input type="text" name="maps_url" value={event.maps_url} onChange={(e) => handleInputChange('events', index, e)} className="form-control" />
                                </div>
                                <button type="button" onClick={() => removeItem('events', index)} className="btn btn-danger">Hapus Acara</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addItem('events', { event_name: 'Resepsi', event_date: '', start_time: '', end_time: '', location_name: '', address: '', maps_url: '' })} className="btn btn-secondary">+ Tambah Acara</button>
                    </div>
                );
            case 'stories':
                 return (
                    <div className="card">
                        <h3>Cerita Cinta</h3>
                        {formData.stories.map((story, index) => (
                            <div key={index} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                                <div className="grid-2-col">
                                    <div className="form-group">
                                        <label>Tahun/Tanggal</label>
                                        <input type="text" name="story_year" value={story.story_year} onChange={(e) => handleInputChange('stories', index, e)} className="form-control" />
                                    </div>
                                    <div className="form-group">
                                        <label>Judul Cerita</label>
                                        <input type="text" name="story_title" value={story.story_title} onChange={(e) => handleInputChange('stories', index, e)} className="form-control" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Deskripsi</label>
                                    <textarea name="story_description" value={story.story_description} onChange={(e) => handleInputChange('stories', index, e)} className="form-control" rows="3"></textarea>
                                </div>
                                <button type="button" onClick={() => removeItem('stories', index)} className="btn btn-danger">Hapus Cerita</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addItem('stories', { story_year: '', story_title: '', story_description: '' })} className="btn btn-secondary">+ Tambah Cerita</button>
                    </div>
                );
            case 'gallery':
                return (
                    <div className="card">
                        <h3>Galeri Foto & Video</h3>
                        <div className="form-group">
                            <label>Upload Foto (Bisa Pilih Banyak)</label>
                            <input type="file" multiple onChange={handleGalleryFilesChange} className="form-control" accept="image/*" />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {formData.galleries.map((item, index) => (
                                <div key={index} style={{ position: 'relative' }}>
                                    <img src={`http://localhost/proyek-undangan/backend/${item.media_url}`} alt={`Gallery ${index}`} width="150" style={{ borderRadius: '5px' }} />
                                    <button type="button" onClick={() => removeItem('galleries', index)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>X</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'gifts':
                return (
                    <div className="card">
                        <h3>Amplop Digital</h3>
                        {formData.gifts.map((gift, index) => (
                            <div key={index} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                                <div className="form-group">
                                    <label>Nama Bank</label>
                                    <input type="text" name="bank_name" value={gift.bank_name} onChange={(e) => handleInputChange('gifts', index, e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Nomor Rekening</label>
                                    <input type="text" name="account_number" value={gift.account_number} onChange={(e) => handleInputChange('gifts', index, e)} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Nama Pemilik Rekening</label>
                                    <input type="text" name="account_holder_name" value={gift.account_holder_name} onChange={(e) => handleInputChange('gifts', index, e)} className="form-control" />
                                </div>
                                <button type="button" onClick={() => removeItem('gifts', index)} className="btn btn-danger">Hapus Rekening</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addItem('gifts', { bank_name: '', account_number: '', account_holder_name: '' })} className="btn btn-secondary">+ Tambah Rekening</button>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            {/* General Settings */}
            <div className="card">
                <h3>Pengaturan Umum</h3>
                <div className="form-group">
                    <label>Judul Undangan</label>
                    <input type="text" name="invitation_title" value={formData.invitation.invitation_title} onChange={(e) => handleSimpleChange('invitation', e)} className="form-control" />
                </div>
                <div className="form-group">
                    <label>Foto Sampul (Cover)</label>
                    <input type="file" name="cover_image" onChange={(e) => handleFileChange('invitation', 'cover_image', e)} className="form-control" />
                     {formData.invitation.cover_image && <img src={`http://localhost/proyek-undangan/backend/${formData.invitation.cover_image}`} alt="Cover" width="200" />}
                </div>
                <div className="form-group">
                    <label>Musik Latar</label>
                    <input type="file" name="background_music" onChange={(e) => handleFileChange('invitation', 'background_music', e)} className="form-control" accept="audio/*" />
                    {formData.invitation.background_music && <p>File musik terpilih: {formData.invitation.background_music}</p>}
                </div>
                                <div className="form-group">
                    <label>Pilih Desain Template</label>
                    {loadingTemplates ? (
                        <p>Memuat template...</p>
                    ) : (
                        <div className="template-selector">
                            {templates.map(template => (
                                <div 
                                    key={template.id} 
                                    className={`template-card ${formData.invitation.template_id === template.id ? 'selected' : ''}`}
                                    onClick={() => handleTemplateSelect(template.id)}
                                >
                                    <img src={`http://localhost/proyek-undangan/backend/${template.preview_image}`} alt={template.template_name} />
                                    <p>{template.template_name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Draggable Sections */}
            <h2>Atur Tata Letak Undangan (Geser untuk Mengubah Urutan)</h2>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="sections">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {sections.map(({ id, name }, index) => (
                                <Draggable key={id} draggableId={id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                            <div className="draggable-section">
                                                <strong>{name}</strong>
                                                <span>☰</span>
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <hr style={{margin: '30px 0'}}/>
            
            {/* Render sections based on the new order */}
            {sections.map(section => (
                <div key={section.id}>
                    {renderSection(section.id)}
                </div>
            ))}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', padding: '15px', fontSize: '18px', marginTop: '20px' }}>
                {isCreating ? 'Simpan Undangan Baru' : 'Simpan Perubahan'}
            </button>
        </form>
    );
}

export default InvitationForm;