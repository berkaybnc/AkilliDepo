import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Modal, TextField, Tooltip,
  Chip, IconButton, LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import axiosClient from '../api/axiosClient';
import { useNotification } from './useNotification';

interface Zone {
  id: number;
  name: string;
  description: string;
  color?: string;
  capacity?: number; // Maks ürün çeşidi limiti (0 veya undefined = limitsiz)
}

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  totalStock: number;
  zoneId?: number;
}

// ─── 3D SVG Raf ─────────────────────────────────────────────
const ShelfBox3D = ({
  zone, productCount, totalStock, isSelected, onClick
}: {
  zone: Zone;
  productCount: number;
  totalStock: number;  // Kapasite karşılaştırması için toplam stok adedi
  isSelected: boolean;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const color = zone.color ?? '#3f51b5';
  const capacity = zone.capacity ?? 0;
  // Kapasite = stok adedi sınırı
  const fillRatio = capacity > 0 ? Math.min(totalStock / capacity, 1) : 0;
  const isFull = capacity > 0 && totalStock >= capacity;
  const nearFull = capacity > 0 && fillRatio >= 0.8 && !isFull;
  const displayColor = isFull ? '#f44336' : nearFull ? '#ff9800' : color;

  const darken = (hex: string, amount = 40) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const scale = isSelected ? 1.08 : hovered ? 1.04 : 1;
  const W = 140, H = 110, D = 40;
  const skewX = D * 0.6, skewY = D * 0.3;

  // Doluluk barı rengi
  const barColor = isFull ? '#ef5350' : nearFull ? '#ffa726' : 'rgba(255,255,255,0.7)';
  const barWidth = capacity > 0 ? fillRatio * (W - 16) : 0;

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        transform: `scale(${scale})`,
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s',
        filter: `drop-shadow(${isSelected ? `0 0 18px ${displayColor}` : hovered ? `0 0 10px ${displayColor}90` : '0 4px 12px #00000066'})`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {/* Ürün sayısı rozeti */}
      {productCount > 0 && (
        <Box sx={{
          position: 'absolute', top: -10, right: -10,
          bgcolor: isFull ? '#f44336' : nearFull ? '#ff9800' : '#ff5722',
          color: '#fff', borderRadius: '50%',
          width: 26, height: 26,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, zIndex: 10,
          boxShadow: `0 0 10px ${isFull ? '#f4433680' : '#ff572280'}`,
        }}>
          {productCount}
        </Box>
      )}

      {/* 3D SVG */}
      <svg width={W + skewX + 20} height={H + skewY + 20} style={{ overflow: 'visible' }}
        viewBox={`-10 -${skewY + 10} ${W + skewX + 20} ${H + skewY + 20}`}>
        <defs>
          <linearGradient id={`g-top-${zone.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={displayColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor={darken(displayColor, 20)} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`g-front-${zone.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={displayColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={darken(displayColor, 60)} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`g-side-${zone.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={darken(displayColor, 30)} stopOpacity="0.9" />
            <stop offset="100%" stopColor={darken(displayColor, 70)} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={`g-bar-${zone.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={barColor} />
            <stop offset="100%" stopColor={isFull ? '#ef9a9a' : nearFull ? '#ffcc80' : 'rgba(255,255,255,0.4)'} />
          </linearGradient>
        </defs>

        {/* Raf seviyeleri */}
        {[0.35, 0.67].map((lvl, i) => (
          <g key={i}>
            <line x1={0} y1={H * lvl} x2={W} y2={H * lvl} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <line x1={W} y1={H * lvl} x2={W + skewX} y2={H * lvl - skewY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </g>
        ))}

        {/* Ön yüz */}
        <rect x={0} y={0} width={W} height={H} fill={`url(#g-front-${zone.id})`} rx="3"
          stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* Sağ yüz */}
        <polygon points={`${W},0 ${W + skewX},-${skewY} ${W + skewX},${H - skewY} ${W},${H}`}
          fill={`url(#g-side-${zone.id})`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Üst yüz */}
        <polygon points={`0,0 ${W},0 ${W + skewX},-${skewY} ${skewX},-${skewY}`}
          fill={`url(#g-top-${zone.id})`} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {/* İsim */}
        <text x={W / 2} y={18} textAnchor="middle" fill="white" fontSize="13" fontWeight="700" opacity={0.95}>
          {zone.name}
        </text>

        {/* Doluluk barı */}
        {capacity > 0 ? (
          <>
            <rect x={8} y={H - 20} width={W - 16} height={9} rx="4" fill="rgba(0,0,0,0.35)" />
            <rect x={8} y={H - 20} width={barWidth} height={9} rx="4" fill={`url(#g-bar-${zone.id})`} />
            <text x={W / 2} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">
              {totalStock}/{capacity} adet
            </text>
          </>
        ) : productCount === 0 ? (
          <text x={W / 2} y={H / 2 + 8} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="12">
            Boş Raf
          </text>
        ) : (
          <text x={W / 2} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10">
            {productCount} çeşit ürün
          </text>
        )}
      </svg>

      {/* Alt etiket */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: displayColor, fontWeight: 700, display: 'block' }}>
          {zone.description}
        </Typography>
        {isFull && (
          <Chip label="RAF DOLU" size="small" color="error" sx={{ height: 16, fontSize: 9, mt: 0.3 }} />
        )}
      </Box>
    </Box>
  );
};

// ─── Raf Detay Modal ─────────────────────────────────────────
const ZoneDetailModal = ({
  zone, products, open, onClose
}: {
  zone: Zone | null;
  products: Product[];
  open: boolean;
  onClose: () => void;
}) => {
  if (!zone) return null;
  const color = zone.color ?? '#3f51b5';
  const capacity = zone.capacity ?? 0;
  const totalStock = products.reduce((s, p) => s + p.totalStock, 0);
  // Kapasite = stok adedi sınırı
  const fillRatio = capacity > 0 ? Math.min(totalStock / capacity, 1) : 0;
  const isFull = capacity > 0 && totalStock >= capacity;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500, maxHeight: '82vh',
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 60px ${color}30`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <Box sx={{
          p: 3, pb: 2,
          background: `linear-gradient(135deg, ${color}22, ${color}08)`,
          borderBottom: `1px solid ${color}30`,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color }}>{zone.name}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{zone.description}</Typography>
            </Box>
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
          </Box>

          {/* Kapasite bar */}
          {capacity > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Doluluk</Typography>
                <Typography variant="caption" sx={{ color: isFull ? 'error.main' : color, fontWeight: 700 }}>
                  {totalStock.toLocaleString('tr-TR')} / {capacity.toLocaleString('tr-TR')} adet {isFull ? '(DOLU)' : ''}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={fillRatio * 100}
                sx={{
                  height: 6, borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: isFull ? 'error.main' : fillRatio >= 0.8 ? 'warning.main' : color,
                    borderRadius: 3,
                  }
                }}
              />
            </Box>
          )}
        </Box>

        {/* Özet chips */}
        <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 1.5, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Chip icon={<InventoryIcon />} label={`${products.length} Ürün Çeşidi`} size="small" sx={{ bgcolor: `${color}22`, color }} />
          <Chip label={`Toplam ${totalStock.toLocaleString('tr-TR')} Adet`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
          {capacity > 0 && !isFull && (
            <Chip label={`${(capacity - totalStock).toLocaleString('tr-TR')} Adet Boş`} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#81c784' }} />
          )}
          {isFull && <Chip icon={<WarningAmberIcon />} label="Stok Kapasitesi Doldu" size="small" color="error" />}
        </Box>

        {/* Ürün listesi */}
        <Box sx={{ overflowY: 'auto', flex: 1, p: 2 }}>
          {products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, opacity: 0.4 }}>
              <InventoryIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography>Bu rafta ürün yok</Typography>
            </Box>
          ) : (
            products.map(p => (
              <Box key={p.id} sx={{
                p: 2, mb: 1.5, borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                '&:hover': { bgcolor: `${color}10`, borderColor: `${color}30` },
                transition: 'all 0.2s',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.3 }}>{p.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>SKU: {p.sku}</Typography>
                    {p.description && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                        {p.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="h5" sx={{ color, fontWeight: 800, lineHeight: 1 }}>
                      {p.totalStock}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>adet</Typography>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Modal>
  );
};

// ─── Raf Ekle / Düzenle Modal ────────────────────────────────────
const ZoneFormModal = ({
  open, onClose, onSave, editZone
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, capacity: number) => void;
  editZone?: Zone | null;
}) => {
  // State'i doğrudan editZone'dan başlat — useEffect yerine başlangıç değerini kullan
  // Parent bileşeni her açılışta farklı bir key verir, bu sayede state sıfırlanır
  const [name, setName] = useState(editZone?.name ?? '');
  const [desc, setDesc] = useState(editZone?.description ?? '');
  const [cap, setCap] = useState(editZone?.capacity ? String(editZone.capacity) : '');

  const isEdit = !!editZone;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, bgcolor: 'background.paper',
        borderRadius: 3, p: 4,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 0 40px rgba(63,81,181,0.3)',
      }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
          {isEdit ? 'Rafı Düzenle' : 'Yeni Raf Ekle'}
        </Typography>

        <TextField
          fullWidth label="Raf Adı" placeholder="Örn: C Rafı"
          value={name} onChange={e => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth label="Bölge / Açıklama" placeholder="Örn: Doğu Kanat"
          value={desc} onChange={e => setDesc(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          type="number"
          label="Stok Kapasitesi (Maks. Toplam Adet)"
          placeholder="Örn: 500 (boş bırakırsanız limitsiz)"
          helperText="Bu rafta en fazla kaç adet stok bulunabilir? Boş = Limitsiz"
          slotProps={{ htmlInput: { min: 0 } }}
          value={cap}
          onChange={e => setCap(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="text" onClick={onClose}>İptal</Button>
          <Button
            variant="contained"
            disabled={!name.trim()}
            onClick={() => {
              onSave(name, desc, cap ? parseInt(cap) : 0);
              setName(''); setDesc(''); setCap('');
            }}
          >
            {isEdit ? 'Güncelle' : 'Raf Oluştur'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// ─── Ana Bileşen ───────────────────────────────────────────────
const WarehouseMap = () => {
  const { showSuccess, confirm } = useNotification();
  const [zones, setZones] = useState<Zone[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    axiosClient.get('/zones', { params: { companyId: 'COMPANY-ABC-123' } })
      .then(res => setZones(res.data.data || res.data))
      .catch(console.error);
  }, [refreshKey]);

  useEffect(() => {
    axiosClient.get('/products', { params: { companyId: 'COMPANY-ABC-123', page: 1, pageSize: 999 } })
      .then(res => setAllProducts(res.data.data || []))
      .catch(console.error);
  }, [refreshKey]);

  const getZoneProducts = (zoneId: number) =>
    allProducts.filter(p => p.zoneId === zoneId);

  const handleZoneClick = (zone: Zone) => {
    setSelectedZone(zone);
    setDetailOpen(true);
  };

  const handleSaveZone = async (name: string, description: string, capacity: number) => {
    if (editingZone) {
      await axiosClient.post('/zones/update', {
        id: editingZone.id,
        companyId: 'COMPANY-ABC-123',
        name, description, capacity,
      });
    } else {
      await axiosClient.post('/zones/create', {
        companyId: 'COMPANY-ABC-123',
        name, description, capacity,
      });
    }
    setFormOpen(false);
    setEditingZone(null);
    setRefreshKey(k => k + 1);
    showSuccess(editingZone ? 'Raf başarıyla güncellendi!' : 'Yeni raf oluşturuldu!');
  };

  const handleEditZone = (zone: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingZone(zone);
    setFormOpen(true);
  };

  const handleDeleteZone = async (zoneId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Rafı Sil',
      message: 'Bu rafı silmek istediğinizden emin misiniz? İçindeki ürünlerin raf bilgisi kaldedilir.',
      confirmLabel: 'Evet, Sil',
      cancelLabel: 'İptal',
      severity: 'error',
    });
    if (!ok) return;
    await axiosClient.post('/zones/delete', { id: zoneId, companyId: 'COMPANY-ABC-123' });
    setRefreshKey(k => k + 1);
    showSuccess('Raf silindi.');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            🏭 Depo Haritası
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Raflara tıklayarak içindeki ürünleri görüntüleyin · ✏️ Düzenle · 🗑️ Sil
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditingZone(null); setFormOpen(true); }}
          sx={{ borderRadius: 20, px: 3 }}
        >
          Raf Ekle
        </Button>
      </Box>

      {/* Depo zemini */}
      <Box sx={{
        position: 'relative',
        background: 'linear-gradient(160deg, rgba(15,20,40,0.8) 0%, rgba(25,30,55,0.9) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 3, p: 5, minHeight: 420,
        overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(63,81,181,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(63,81,181,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }
      }}>
        <Typography variant="caption" sx={{
          position: 'absolute', bottom: 16, left: 16,
          color: 'text.disabled', letterSpacing: 2, textTransform: 'uppercase', fontSize: 10
        }}>
          Depo Zemini — {zones.length} Raf · {allProducts.length} Ürün
        </Typography>

        {zones.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 2, opacity: 0.5 }}>
            <Typography variant="h1">🏗️</Typography>
            <Typography>Henüz raf eklenmemiş</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'flex-end', pt: 3 }}>
            {zones.map(zone => {
              const zoneProducts = getZoneProducts(zone.id);
              return (
                <Box key={zone.id} sx={{ position: 'relative' }}>
                  <ShelfBox3D
                    zone={zone}
                    productCount={zoneProducts.length}
                    totalStock={zoneProducts.reduce((s, p) => s + p.totalStock, 0)}
                    isSelected={selectedZone?.id === zone.id}
                    onClick={() => handleZoneClick(zone)}
                  />

                  {/* Düzenle butonu */}
                  <Tooltip title="Rafı Düzenle">
                    <IconButton
                      size="small"
                      onClick={e => handleEditZone(zone, e)}
                      sx={{
                        position: 'absolute', top: -8, right: 16,
                        bgcolor: 'rgba(33,150,243,0.15)', color: '#42a5f5',
                        width: 22, height: 22, opacity: 0,
                        '&:hover': { bgcolor: 'rgba(33,150,243,0.3)' },
                        '.MuiBox-root:hover &': { opacity: 1 },
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <EditIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>

                  {/* Sil butonu */}
                  <Tooltip title="Rafı Sil">
                    <IconButton
                      size="small"
                      onClick={e => handleDeleteZone(zone.id, e)}
                      sx={{
                        position: 'absolute', top: -8, left: -8,
                        bgcolor: 'rgba(244,67,54,0.15)', color: '#f44336',
                        width: 22, height: 22, opacity: 0,
                        '&:hover': { bgcolor: 'rgba(244,67,54,0.3)' },
                        '.MuiBox-root:hover &': { opacity: 1 },
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Detay Modal */}
      <ZoneDetailModal
        zone={selectedZone}
        products={selectedZone ? getZoneProducts(selectedZone.id) : []}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Raf Ekle / Düzenle Modal — key ile state sıfırlanır */}
      <ZoneFormModal
        key={editingZone ? `edit-${editingZone.id}` : `add-${formOpen}`}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingZone(null); }}
        onSave={handleSaveZone}
        editZone={editingZone}
      />
    </Box>
  );
};

export default WarehouseMap;
