import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Modal, 
  TextField, 
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip
} from '@mui/material';
import { 
  DataGrid, 
  type GridColDef, 
  type GridPaginationModel,
  GridActionsCellItem
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import axiosClient from '../api/axiosClient';
import { useNotification } from './useNotification';

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  categoryId: number;
  totalStock: number;
  zoneId?: number; // Ürünün varsayılan rafı
}

interface Zone {
  id: number;
  name: string;
  description: string;
}

interface Category {
  id: number;
  name: string;
}

interface Personnel {
  id: number;
  fullName: string;
  title: string;
}

interface MovementHistory {
  id: number;
  type: number;
  quantity: number;
  zoneName: string;
  fromZoneName?: string;
  personnelName: string;
  createdAt: string;
}

interface ProductManagementProps {
  onStatsChange?: () => void;
  isSales?: boolean;
  dashboardFilter?: string | null;
  onClearFilter?: () => void;
}

const ProductManagement = ({ onStatsChange, isSales, dashboardFilter, onClearFilter }: ProductManagementProps) => {
  const { showError, showSuccess } = useNotification();
  const [rows, setRows] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [personnels, setPersonnels] = useState<Personnel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openMovementModal, setOpenMovementModal] = useState(false);
  const [openHistoryModal, setOpenHistoryModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [historyData, setHistoryData] = useState<MovementHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Ürün form state: zoneId dahil
  const [formData, setFormData] = useState({ name: '', sku: '', description: '', categoryId: '', zoneId: '' });
  const [zoneSuggestionText, setZoneSuggestionText] = useState<string | null>(null);

  // Stok hareket state
  const [movementData, setMovementData] = useState({ type: 1, quantity: 1, zoneId: '', fromZoneId: '', personnelName: '' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/products', { 
        params: { 
          companyId: 'COMPANY-ABC-123', 
          page: paginationModel.page + 1, 
          pageSize: paginationModel.pageSize,
          filterType: dashboardFilter 
        } 
      });
      const raw = response.data.data ?? [];

      const normalized: Product[] = raw.map((p: unknown) => {
        const obj = p as Record<string, unknown>;
        const sku =
          (obj['sku'] as string | undefined) ??
          (obj['SKU'] as string | undefined) ??
          (obj['sKU'] as string | undefined) ??
          '';
        const name = (obj['name'] as string | undefined) ?? (obj['Name'] as string | undefined) ?? '';
        const description = (obj['description'] as string | undefined) ?? (obj['Description'] as string | undefined) ?? '';
        const categoryId = (obj['categoryId'] as number | undefined) ?? (obj['CategoryId'] as number | undefined) ?? 0;
        const totalStock = (obj['totalStock'] as number | undefined) ?? (obj['TotalStock'] as number | undefined) ?? 0;
        const zoneId = (obj['zoneId'] as number | undefined) ?? (obj['ZoneId'] as number | undefined) ?? undefined;

        return {
          ...(p as object),
          sku,
          name,
          description,
          categoryId,
          totalStock,
          zoneId
        } as Product;
      });

      setRows(normalized);
      setTotalCount(response.data.totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [paginationModel.page, paginationModel.pageSize, dashboardFilter]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axiosClient.get('/zones', { params: { companyId: 'COMPANY-ABC-123' } });
        setZones(res.data.data || res.data);
      } catch (e) {
        console.error(e);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get('/categories', { params: { companyId: 'COMPANY-ABC-123' } });
        setCategories(res.data.data || res.data);
      } catch (e) {
        console.error(e);
      }
    };
    
    const fetchPersonnels = async () => {
      try {
        const res = await axiosClient.get('/personnels', { params: { companyId: 'COMPANY-ABC-123' } });
        setPersonnels(res.data.data || res.data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchZones();
    fetchCategories();
    fetchPersonnels();
  }, []);

  // Raf adını ID'den bul
  const getZoneName = (zoneId?: number) => {
    if (!zoneId) return null;
    return zones.find(z => z.id === zoneId)?.name ?? null;
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Ürün Adı', flex: 1 },
    { field: 'sku', headerName: 'SKU', width: 120 },
    { 
      field: 'categoryId', 
      headerName: 'Kategori', 
      width: 130,
      renderCell: (p) => {
        const cat = categories.find(c => c.id === p.value);
        return cat ? cat.name : p.value;
      }
    },
    {
      field: 'zoneId',
      headerName: 'Raf',
      width: 120,
      renderCell: (params) => {
        const zoneName = getZoneName(params.value as number);
        return zoneName
          ? <Chip label={zoneName} size="small" color="info" variant="outlined" />
          : <Chip label="Atanmadı" size="small" variant="outlined" sx={{ opacity: 0.4 }} />;
      }
    },
    { field: 'totalStock', headerName: 'Stok', width: 90 },
    { field: 'description', headerName: 'Açıklama', flex: 1 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'İşlemler',
      width: 180,
      getActions: (params) => {
        if (isSales) return [];

        return [
          <GridActionsCellItem
            icon={<SwapHorizIcon color="info" />}
            label="Stok Hareketi"
            onClick={() => {
              const product = params.row as Product;
              setSelectedProduct(product);
              const productZoneId = product.zoneId?.toString() ?? (zones.length > 0 ? zones[0].id.toString() : '');
              setMovementData({ type: 1, quantity: 1, zoneId: productZoneId, fromZoneId: '', personnelName: '' });
              setOpenMovementModal(true);
            }}
          />,
          <GridActionsCellItem
            icon={<HistoryIcon color="secondary" />}
            label="Geçmiş"
            onClick={() => {
              const product = params.row as Product;
              setSelectedProduct(product);
              setOpenHistoryModal(true);
              fetchHistory(product.id);
            }}
          />,
          <GridActionsCellItem
            icon={<EditIcon color="primary" />}
            label="Düzenle"
            onClick={() => handleOpenEdit(params.row as Product)}
          />,
          <GridActionsCellItem
            icon={<DeleteIcon color="error" />}
            label="Sil"
            onClick={() => {
              setSelectedProduct(params.row as Product);
              setOpenDeleteModal(true);
            }}
          />,
        ];
      },
    },
  ];

  const handleOpenEdit = (product: Product) => {
    setFormData({ 
      name: product.name, 
      sku: product.sku, 
      description: product.description, 
      categoryId: product.categoryId.toString(),
      zoneId: product.zoneId ? product.zoneId.toString() : ''
    });
    setSelectedProduct(product);
    setZoneSuggestionText(null);
    setOpenAddModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        companyId: 'COMPANY-ABC-123',
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        categoryId: Number(formData.categoryId) || 1,
        zoneId: formData.zoneId ? parseInt(formData.zoneId) : null
      };

      if (selectedProduct) {
        await axiosClient.post('/products/update', { id: selectedProduct.id, ...payload });
        showSuccess('Ürün başarıyla güncellendi.');
      } else {
        await axiosClient.post('/products/create', payload);
        showSuccess('Ürün başarıyla oluşturuldu.');
      }
      setOpenAddModal(false);
      fetchProducts();
      onStatsChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedProduct) {
        await axiosClient.post('/products/delete', { id: selectedProduct.id, companyId: 'COMPANY-ABC-123' });
      }
      setOpenDeleteModal(false);
      fetchProducts();
      onStatsChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (productId: number) => {
    setHistoryLoading(true);
    try {
      const res = await axiosClient.get('/inventorymovements/history', {
        params: { productId, companyId: 'COMPANY-ABC-123' }
      });
      setHistoryData(res.data || []);
    } catch (e) {
      console.error(e);
      showError('Geçmiş yüklenirken bir hata oluştu.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleMovementSave = async () => {
    if (movementData.type === 3 && movementData.fromZoneId === movementData.zoneId) {
      showError('Kaynak ve hedef raf aynı olamaz!');
      return;
    }
    try {
      if (!selectedProduct) return;

      if (!movementData.zoneId) {
        showError('Hedef raf (Zone) boş olamaz.');
        return;
      }

      if (movementData.type === 3) {
        if (!movementData.fromZoneId) {
          showError('Kaynak raf (FromZoneId) boş olamaz (Transfer için).');
          return;
        }
        if (movementData.fromZoneId === movementData.zoneId) {
          showError('Kaynak ve hedef raf aynı olamaz!');
          return;
        }
      }

      const zoneId = Number.parseInt(movementData.zoneId);
      const fromZoneId = movementData.type === 3 ? Number.parseInt(movementData.fromZoneId) : null;

      if (Number.isNaN(zoneId) || (movementData.type === 3 && fromZoneId !== null && Number.isNaN(fromZoneId))) {
        showError('Raf seçimi geçersiz (ZoneId/FromZoneId).');
        return;
      }

      await axiosClient.post('/inventorymovements/create', {
        companyId: 'COMPANY-ABC-123',
        productId: selectedProduct.id,
        zoneId,
        fromZoneId,
        type: movementData.type,
        quantity: movementData.type === 3 ? selectedProduct.totalStock : movementData.quantity,
        personnelName: movementData.personnelName
      });

      setOpenMovementModal(false);
      fetchProducts();
      onStatsChange?.();
      showSuccess('Stok hareketi başarıyla kaydedildi!');
    } catch (err: unknown) {
      console.error(err);
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      showError(msg ?? 'Stok işlemi başarısız! (Yetersiz stok veya kapasite aşımı olabilir)');
    }
  };

  const modalStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 440,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.1)',
  };

  return (
    <Box sx={{ p: 3, backgroundColor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Ürün Yönetimi
          </Typography>
          {dashboardFilter && (
            <Chip 
              label={`Filtre: ${dashboardFilter === 'critical' ? 'Kritik Stok' : dashboardFilter === 'dailyIn' ? 'Bugünkü Girişler' : 'Bugünkü Çıkışlar'}`} 
              color="warning" 
              onDelete={onClearFilter} 
            />
          )}
        </Box>
        {!isSales && (
          <Button 
            startIcon={<AddIcon />}
            variant="contained" 
            onClick={() => {
              setSelectedProduct(null);
              setFormData({ name: '', sku: '', description: '', categoryId: '', zoneId: '' });
              setZoneSuggestionText(null);
              setOpenAddModal(true);
            }}
          >
            Yeni Ürün Ekle
          </Button>
        )}
      </Box>
      
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={totalCount}
          loading={loading}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
        />
      </div>

      {/* --- Ürün Ekle / Düzenle Modal --- */}
      <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            {selectedProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </Typography>
          <TextField fullWidth label="Ürün Adı" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} sx={{ mb: 2 }} />
          <TextField fullWidth label="SKU" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} sx={{ mb: 2 }} />
          <TextField fullWidth label="Açıklama" multiline rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} sx={{ mb: 2 }} />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={formData.categoryId}
              label="Kategori"
              onChange={async e => {
                const newCat = e.target.value as string;
                setFormData({ ...formData, categoryId: newCat });
                if (newCat) {
                  try {
                    const res = await axiosClient.get('/smart/suggest-zone', { params: { categoryId: newCat, companyId: 'COMPANY-ABC-123' } });
                    if (res.data && res.data.recommendedZoneId) {
                      setFormData(prev => ({ ...prev, zoneId: res.data.recommendedZoneId.toString() }));
                      setZoneSuggestionText(`Akıllı Öneri: ${res.data.reason}`);
                    }
                  } catch (e) {
                    console.error('Raf önerisi alınamadı', e);
                    setZoneSuggestionText(null);
                  }
                }
              }}
            >
              {categories.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
              {categories.length === 0 && (
                <MenuItem disabled value="">Kategori bulunamadı</MenuItem>
              )}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Raf / Depo Bölgesi</InputLabel>
            <Select
              value={formData.zoneId}
              label="Raf / Depo Bölgesi"
              onChange={e => setFormData({...formData, zoneId: e.target.value as string})}
            >
              <MenuItem value=""><em>— Raf Atama (İsteğe Bağlı) —</em></MenuItem>
              {zones.map(z => (
                <MenuItem key={z.id} value={z.id}>
                  {z.name} <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.6 }}>({z.description})</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {zoneSuggestionText && (
             <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 3 }}>
                💡 {zoneSuggestionText}
             </Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="text" onClick={() => setOpenAddModal(false)}>İptal</Button>
            <Button variant="contained" onClick={handleSave}>Kaydet</Button>
          </Box>
        </Box>
      </Modal>

      {/* --- Stok Hareketi Modal --- */}
      <Modal open={openMovementModal} onClose={() => setOpenMovementModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 'bold' }}>
            Stok Hareketi
          </Typography>
          <Typography variant="body2" sx={{ mb: 2.5, opacity: 0.7 }}>
            {selectedProduct?.name} · Mevcut Stok: <strong>{selectedProduct?.totalStock ?? 0}</strong>
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>İşlem Tipi</InputLabel>
            <Select
              value={movementData.type}
              label="İşlem Tipi"
              onChange={e => {
                const newType = Number(e.target.value);
                const currentZone = selectedProduct?.zoneId?.toString() ?? (zones.length > 0 ? zones[0].id.toString() : '');
                const otherZone = zones.find(z => z.id.toString() !== currentZone)?.id.toString() ?? currentZone;

                if (newType === 3) {
                  setMovementData({
                    ...movementData,
                    type: newType,
                    fromZoneId: currentZone,
                    zoneId: otherZone
                  });
                } else {
                  setMovementData({
                    ...movementData,
                    type: newType,
                    fromZoneId: '',
                    zoneId: currentZone
                  });
                }
              }}
            >
              <MenuItem value={1}>📦 Stok Girişi (In)</MenuItem>
              <MenuItem value={2}>📤 Stok Çıkışı (Out)</MenuItem>
              <MenuItem value={3}>🔄 Raflar Arası Transfer</MenuItem>
            </Select>
          </FormControl>


          {movementData.type === 3 && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Kaynak Raf (Nereden)</InputLabel>
              <Select
                value={movementData.fromZoneId}
                label="Kaynak Raf (Nereden)"
                onChange={e => setMovementData({...movementData, fromZoneId: e.target.value as string})}
              >
                {zones.map(z => (
                  <MenuItem key={z.id} value={z.id} disabled={z.id.toString() === movementData.zoneId}>
                    {z.name} — {z.description}
                    {selectedProduct?.zoneId === z.id && (
                      <Chip label="Mevcut Raf" size="small" color="warning" sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{movementData.type === 3 ? 'Hedef Raf (Nereye)' : 'Raf (Zone)'}</InputLabel>
            <Select
              value={movementData.zoneId}
              label={movementData.type === 3 ? 'Hedef Raf (Nereye)' : 'Raf (Zone)'}
              onChange={movementData.type === 3
                ? (e) => setMovementData({ ...movementData, zoneId: e.target.value as string })
                : undefined
              }
              disabled={movementData.type !== 3}
            >
              {zones.map(z => (
                <MenuItem
                  key={z.id}
                  value={z.id}
                  disabled={movementData.type === 3 && z.id.toString() === movementData.fromZoneId}
                >
                  {z.name} — {z.description}
                  {selectedProduct?.zoneId === z.id && movementData.type !== 3 && (
                    <Chip label="Ürünün Rafı" size="small" color="success" sx={{ ml: 1 }} />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>


          {movementData.type !== 3 && (
            <TextField 
              fullWidth 
              type="number" 
              label="Miktar" 
              slotProps={{ htmlInput: { min: 1 } }}
              value={movementData.quantity} 
              onChange={e => setMovementData({...movementData, quantity: Math.max(1, Number(e.target.value))})} 
              sx={{ mb: 2 }} 
            />
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>İşlemi Yapan Personel</InputLabel>
            <Select
              value={movementData.personnelName}
              label="İşlemi Yapan Personel"
              onChange={e => setMovementData({ ...movementData, personnelName: e.target.value as string })}
            >
              {personnels.map(p => (
                <MenuItem key={p.id} value={p.fullName}>
                  {p.fullName} - {p.title}
                </MenuItem>
              ))}
              {personnels.length === 0 && (
                <MenuItem disabled value="">Sistemde kayıtlı personel yok</MenuItem>
              )}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="text" onClick={() => setOpenMovementModal(false)}>İptal</Button>
            <Button
              variant="contained"
              color={movementData.type === 1 ? 'success' : movementData.type === 2 ? 'warning' : 'info'}
              onClick={handleMovementSave}
            >
              {movementData.type === 1 ? 'Girişi Tamamla' : movementData.type === 2 ? 'Çıkışı Tamamla' : 'Transferi Tamamla'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* --- Silme Onay Modal --- */}
      <Modal open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" color="error" sx={{ mb: 1 }}>Silme Onayı</Typography>
          <Typography sx={{ mb: 3, opacity: 0.8 }}>
            <strong>{selectedProduct?.name}</strong> adlı ürün sistemden kaldırılacak (soft-delete). Onaylıyor musunuz?
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="text" onClick={() => setOpenDeleteModal(false)}>İptal</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Evet, Sil</Button>
          </Box>
        </Box>
      </Modal>

      {/* --- Geçmiş Modal --- */}
      <Modal open={openHistoryModal} onClose={() => setOpenHistoryModal(false)}>
        <Box sx={{ ...modalStyle, width: 1000, maxWidth: '95vw' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {selectedProduct?.name} - Stok Hareket Geçmişi
            </Typography>
            <Button onClick={() => setOpenHistoryModal(false)}>Kapat</Button>
          </Box>
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={historyData}
              loading={historyLoading}
              columns={[
                { 
                  field: 'createdAt', 
                  headerName: 'Tarih / Saat', 
                  width: 150,
                  renderCell: (p) => {
                    const date = new Date(p.value);
                    return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  }
                },
                { 
                  field: 'type', 
                  headerName: 'İşlem', 
                  width: 130,
                  renderCell: (p) => {
                    if (p.value === 1) return <Chip label="Giriş (In)" size="small" color="success" />;
                    if (p.value === 2) return <Chip label="Çıkış (Out)" size="small" color="warning" />;
                    if (p.value === 3) return <Chip label="Transfer" size="small" color="info" />;
                    return p.value;
                  }
                },
                { field: 'quantity', headerName: 'Miktar', width: 90 },
                { 
                  field: 'zoneName', 
                  headerName: 'Raf (Hedef)', 
                  width: 130 
                },
                { 
                  field: 'fromZoneName', 
                  headerName: 'Kaynak Raf', 
                  width: 130,
                  renderCell: (p) => p.value || '-'
                },
                { field: 'personnelName', headerName: 'İşlemi Yapan Personel', flex: 1, minWidth: 200 },
              ]}
              disableRowSelectionOnClick
              hideFooter
            />
          </div>
        </Box>
      </Modal>
    </Box>
  );
};

export default ProductManagement;
