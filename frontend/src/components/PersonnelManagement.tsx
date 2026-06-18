import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Modal, 
  TextField, 
} from '@mui/material';
import { 
  DataGrid, 
  type GridColDef, 
  GridActionsCellItem
} from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axiosClient from '../api/axiosClient';
import { useNotification } from './useNotification';

interface Personnel {
  id: number;
  firstName: string;
  lastName: string;
  title: string;
  fullName: string;
}

const PersonnelManagement = () => {
  const { showError, showSuccess } = useNotification();
  const [personnels, setPersonnels] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', title: '' });

  const fetchPersonnels = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/personnels', { params: { companyId: 'COMPANY-ABC-123' } });
      
      const raw = response.data ?? response.data.data ?? [];
      const normalized: Personnel[] = raw.map((p: Record<string, unknown>) => ({
        id: p.id ?? p.Id,
        firstName: p.firstName ?? p.FirstName ?? '',
        lastName: p.lastName ?? p.LastName ?? '',
        title: p.title ?? p.Title ?? '',
        fullName: p.fullName ?? p.FullName ?? ''
      }));

      setPersonnels(normalized);
    } catch (error) {
      showError('Personeller yüklenirken hata oluştu.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get('/personnels', { params: { companyId: 'COMPANY-ABC-123' } });
        if (active) {
          const raw = response.data ?? response.data.data ?? [];
          const normalized: Personnel[] = raw.map((p: Record<string, unknown>) => ({
            id: (p.id ?? p.Id) as number,
            firstName: (p.firstName ?? p.FirstName ?? '') as string,
            lastName: (p.lastName ?? p.LastName ?? '') as string,
            title: (p.title ?? p.Title ?? '') as string,
            fullName: (p.fullName ?? p.FullName ?? '') as string
          }));
          setPersonnels(normalized);
        }
      } catch (error) {
        if (active) showError('Personeller yüklenirken hata oluştu.');
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [showError]);

  const handleOpenAdd = () => {
    setFormData({ firstName: '', lastName: '', title: '' });
    setSelectedPersonnel(null);
    setOpenAddModal(true);
  };

  const handleOpenEdit = (personnel: Personnel) => {
    setFormData({ firstName: personnel.firstName, lastName: personnel.lastName, title: personnel.title });
    setSelectedPersonnel(personnel);
    setOpenAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showError('Lütfen ad ve soyad alanlarını doldurun.');
      return;
    }

    try {
      if (selectedPersonnel) {
        await axiosClient.post('/personnels/update', {
          id: selectedPersonnel.id,
          companyId: 'COMPANY-ABC-123',
          firstName: formData.firstName,
          lastName: formData.lastName,
          title: formData.title
        });
        showSuccess('Personel başarıyla güncellendi.');
      } else {
        await axiosClient.post('/personnels/create', {
          companyId: 'COMPANY-ABC-123',
          firstName: formData.firstName,
          lastName: formData.lastName,
          title: formData.title
        });
        showSuccess('Personel başarıyla eklendi.');
      }
      setOpenAddModal(false);
      fetchPersonnels();
    } catch (error: unknown) {
      const e = error as { response?: { data?: { Message?: string } } };
      showError(e.response?.data?.Message ?? 'Kaydetme işlemi başarısız.');
    }
  };

  const handleDelete = async () => {
    if (!selectedPersonnel) return;
    try {
      await axiosClient.post('/personnels/delete', {
        id: selectedPersonnel.id,
        companyId: 'COMPANY-ABC-123'
      });
      showSuccess('Personel başarıyla silindi.');
      setOpenDeleteModal(false);
      fetchPersonnels();
    } catch {
      showError('Personel silinirken hata oluştu.');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'firstName', headerName: 'Ad', width: 150 },
    { field: 'lastName', headerName: 'Soyad', width: 150 },
    { field: 'title', headerName: 'Unvan', flex: 1 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'İşlemler',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon color="primary" />}
          label="Düzenle"
          onClick={() => handleOpenEdit(params.row as Personnel)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon color="error" />}
          label="Sil"
          onClick={() => {
            setSelectedPersonnel(params.row as Personnel);
            setOpenDeleteModal(true);
          }}
        />,
      ],
    },
  ];

  const modalStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    outline: 'none'
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Personel Yönetimi</Typography>
        <Button variant="contained" onClick={handleOpenAdd} color="primary" sx={{ px: 3 }}>
          + Yeni Personel
        </Button>
      </Box>

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={personnels}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          sx={{
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            borderRadius: 2,
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
          }}
        />
      </div>

      {/* --- Ekle / Düzenle Modal --- */}
      <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            {selectedPersonnel ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
          </Typography>
          <TextField 
            fullWidth 
            label="Ad" 
            value={formData.firstName} 
            onChange={e => setFormData({...formData, firstName: e.target.value})} 
            sx={{ mb: 2 }} 
          />
          <TextField 
            fullWidth 
            label="Soyad" 
            value={formData.lastName} 
            onChange={e => setFormData({...formData, lastName: e.target.value})} 
            sx={{ mb: 2 }} 
          />
          <TextField 
            fullWidth 
            label="Unvan" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            sx={{ mb: 3 }} 
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setOpenAddModal(false)} variant="outlined">İptal</Button>
            <Button onClick={handleSave} variant="contained">Kaydet</Button>
          </Box>
        </Box>
      </Modal>

      {/* --- Silme Onay Modalı --- */}
      <Modal open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'error.main' }}>
            Personeli Sil
          </Typography>
          <Typography sx={{ mb: 3 }}>
            <strong>{selectedPersonnel?.fullName}</strong> adlı personeli silmek istediğinize emin misiniz?
            Bu işlem geri alınamaz.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setOpenDeleteModal(false)} variant="outlined">İptal</Button>
            <Button onClick={handleDelete} variant="contained" color="error">Sil</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default PersonnelManagement;
