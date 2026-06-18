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

interface Category {
  id: number;
  name: string;
  description: string;
}

const CategoryManagement = () => {
  const { showError, showSuccess } = useNotification();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/categories', { params: { companyId: 'COMPANY-ABC-123' } });
      
      const raw = response.data.data ?? [];
      const normalized: Category[] = raw.map((c: any) => ({
        id: c.id ?? c.Id,
        name: c.name ?? c.Name ?? '',
        description: c.description ?? c.Description ?? ''
      }));

      setCategories(normalized);
    } catch (error) {
      showError('Kategoriler yüklenirken hata oluştu.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAdd = () => {
    setFormData({ name: '', description: '' });
    setSelectedCategory(null);
    setOpenAddModal(true);
  };

  const handleOpenEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description });
    setSelectedCategory(category);
    setOpenAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Lütfen kategori adını girin.');
      return;
    }

    try {
      if (selectedCategory) {
        await axiosClient.post('/categories/update', {
          id: selectedCategory.id,
          companyId: 'COMPANY-ABC-123',
          name: formData.name,
          description: formData.description
        });
        showSuccess('Kategori başarıyla güncellendi.');
      } else {
        await axiosClient.post('/categories/create', {
          companyId: 'COMPANY-ABC-123',
          name: formData.name,
          description: formData.description
        });
        showSuccess('Kategori başarıyla eklendi.');
      }
      setOpenAddModal(false);
      fetchCategories();
    } catch (error: any) {
      showError(error.response?.data?.Message || 'Kaydetme işlemi başarısız.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      await axiosClient.post('/categories/delete', {
        id: selectedCategory.id,
        companyId: 'COMPANY-ABC-123'
      });
      showSuccess('Kategori başarıyla silindi.');
      setOpenDeleteModal(false);
      fetchCategories();
    } catch (error) {
      showError('Kategori silinirken hata oluştu.');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Kategori Adı', width: 250 },
    { field: 'description', headerName: 'Açıklama', flex: 1 },
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
          onClick={() => handleOpenEdit(params.row as Category)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon color="error" />}
          label="Sil"
          onClick={() => {
            setSelectedCategory(params.row as Category);
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
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Kategori Yönetimi</Typography>
        <Button variant="contained" onClick={handleOpenAdd} color="primary" sx={{ px: 3 }}>
          + Yeni Kategori
        </Button>
      </Box>

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={categories}
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
            {selectedCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
          </Typography>
          <TextField 
            fullWidth 
            label="Kategori Adı" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            sx={{ mb: 2 }} 
          />
          <TextField 
            fullWidth 
            label="Açıklama" 
            multiline
            rows={3}
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
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
            Kategoriyi Sil
          </Typography>
          <Typography sx={{ mb: 3 }}>
            <strong>{selectedCategory?.name}</strong> adlı kategoriyi silmek istediğinize emin misiniz?
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

export default CategoryManagement;
