import { useState, useEffect } from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
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

const ProductManagement = ({ onStatsChange }: { onStatsChange?: () => void }) => {
  const { showError, showSuccess } = useNotification();
  const [rows, setRows] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openMovementModal, setOpenMovementModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Ürün form state: zoneId dahil
  const [formData, setFormData] = useState({ name: '', sku: '', description: '', categoryId: 1, zoneId: '' });
  // Stok hareket state
  const [movementData, setMovementData] = useState({ type: 1, quantity: 1, zoneId: '', fromZoneId: '', referenceNumber: '' });

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get('/products', { 
          params: { companyId: 'COMPANY-ABC-123', page: paginationModel.page + 1, pageSize: paginationModel.pageSize } 
        });
        if (active) {
          const raw = response.data.data ?? [];
          // Backend DTO alan adları PascalCase olabiliyor (SKU gibi). DataGrid kolonları lower-case bekliyor.
          console.log('RAW products[0]=', raw[0]);
          console.log('RAW products[0] keys=', raw[0] ? Object.keys(raw[0]) : []);

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

          console.log('NORMALIZED products[0]=', normalized[0]);
          console.log('NORMALIZED products[0].sku=', normalized[0]?.sku);
          setRows(normalized);
          setTotalCount(response.data.totalCount);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProducts();
    return () => { active = false; };
  }, [paginationModel]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axiosClient.get('/zones', { params: { companyId: 'COMPANY-ABC-123' } });
        setZones(res.data.data || res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchZones();
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
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<SwapHorizIcon color="info" />}
          label="Stok Hareketi"
          onClick={() => {
            const product = params.row as Product;
            setSelectedProduct(product);

            // In/Out için: raf (zoneId) üründen otomatik gelsin ve değişmesin.
            const productZoneId = product.zoneId?.toString() ?? (zones.length > 0 ? zones[0].id.toString() : '');

            setMovementData({
              type: 1,
              quantity: 1,
              zoneId: productZoneId,
              fromZoneId: '',
              referenceNumber: ''
            });

            setOpenMovementModal(true);
          }}
        />,

        <GridActionsCellItem
          icon={<EditIcon color="primary" />}
          label="Düzenle"
          onClick={() => {
            const product = params.row as Product;
            setSelectedProduct(product);
            setFormData({
              name: product.name,
              sku: product.sku,
              description: product.description,
              categoryId: product.categoryId,
              zoneId: product.zoneId?.toString() ?? ''
            });
            setOpenAddModal(true);
          }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon color="error" />}
          label="Sil"
          onClick={() => {
            setSelectedProduct(params.row as Product);
            setOpenDeleteModal(true);
          }}
        />,
      ],
    },
  ];

  const handleSave = async () => {
    try {
      const payload = {
        companyId: 'COMPANY-ABC-123',
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        categoryId: formData.categoryId,
        zoneId: formData.zoneId ? parseInt(formData.zoneId) : null
      };

      if (selectedProduct) {
        await axiosClient.post('/products/update', { id: selectedProduct.id, ...payload });
      } else {
        await axiosClient.post('/products/create', payload);
      }
      setOpenAddModal(false);
      setPaginationModel({ ...paginationModel });
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
      setPaginationModel({ ...paginationModel });
      onStatsChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMovementSave = async () => {
    if (movementData.type === 3 && movementData.fromZoneId === movementData.zoneId) {
      showError('Kaynak ve hedef raf aynı olamaz!');
      return;
    }
    try {
      if (!selectedProduct) return;

      // UI validasyonu (özellikle transfer tipinde)
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
        quantity: movementData.quantity,
        referenceNumber: movementData.referenceNumber
      });

      setOpenMovementModal(false);
      setPaginationModel({ ...paginationModel });
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
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Ürün Yönetimi</Typography>
        <Button 
          variant="contained" 
          onClick={() => {
            setSelectedProduct(null);
            setFormData({ name: '', sku: '', description: '', categoryId: 1, zoneId: '' });
            setOpenAddModal(true);
          }}
        >
          Yeni Ürün Ekle
        </Button>
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
          
          {/* Raf Seçimi */}
          <FormControl fullWidth sx={{ mb: 3 }}>
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

                // In/Out: hedef raf = ürünün mevcut rafı (zoneId değişmesin)
                const currentZone = selectedProduct?.zoneId?.toString() ?? (zones.length > 0 ? zones[0].id.toString() : '');
                const otherZone = zones.find(z => z.id.toString() !== currentZone)?.id.toString() ?? currentZone;

                if (newType === 3) {
                  // Transfer: kaynak raf = ürünün mevcut rafı, hedef raf = diğer raf
                  setMovementData({
                    ...movementData,
                    type: newType,
                    fromZoneId: currentZone,
                    zoneId: otherZone
                  });
                } else {
                  // Transfer dışı: fromZoneId boş, zoneId ürün rafı kalsın
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


          {/* Transfer: Kaynak Raf */}
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

          {/* Hedef Raf (Transfer için "Nereye", diğerleri için normal "Raf") */}
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

          <TextField 
            fullWidth 
            label="Referans No (Fatura / İrsaliye)" 
            placeholder="Ör: FAT-2025-001"
            helperText="İsteğe bağlı — bu harekete ait belge numarasını girin."
            value={movementData.referenceNumber} 
            onChange={e => setMovementData({...movementData, referenceNumber: e.target.value})} 
            sx={{ mb: 3 }} 
          />

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
    </Box>
  );
};

export default ProductManagement;
