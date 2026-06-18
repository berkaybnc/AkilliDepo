import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  Skeleton
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MapIcon from '@mui/icons-material/Map';
import CategoryIcon from '@mui/icons-material/Category';
import ProductManagement from './components/ProductManagement';
import WarehouseMap from './components/WarehouseMap';
import CategoryManagement from './components/CategoryManagement';
import PersonnelManagement from './components/PersonnelManagement';
import SmartAlerts from './components/SmartAlerts';
import ViewListIcon from '@mui/icons-material/ViewList';
import PeopleIcon from '@mui/icons-material/People';
import axiosClient from './api/axiosClient';

interface DashboardStats {
  totalProducts: number;
  dailyIn: number;
  dailyOut: number;
  criticalStock: number;
}

// ─── StatCard bileşeni App dışında tanımlanmalı ─────────────
const StatCard = ({
  icon, label, value, color, prefix = '', suffix = ''
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  color?: string;
  prefix?: string;
  suffix?: string;
}) => (
  <Card sx={color ? { border: `1px solid ${color}50` } : {}}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography color="text.secondary" gutterBottom sx={{ ml: 1, mb: 0 }}>{label}</Typography>
      </Box>
      {value === undefined ? (
        <Skeleton variant="text" width={80} height={56} />
      ) : (
        <Typography variant="h4" sx={color ? { color } : {}}>
          {prefix}{value.toLocaleString('tr-TR')}{suffix}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ─── Ana Uygulama ────────────────────────────────────────────
function App() {
  const [companyId] = useState('COMPANY-ABC-123');
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsKey, setStatsKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    const loadStats = async () => {
      try {
        const res = await axiosClient.get('/dashboard/stats', { params: { companyId } });
        if (!ignore) setStats(res.data);
      } catch (e) {
        console.error('Stats fetch error:', e);
      }
    };
    void loadStats();
    return () => { ignore = true; };
  }, [companyId, statsKey, tab]);

  // Stok hareketi yapıldığında istatistikleri otomatik güncelle
  useEffect(() => {
    const onRefresh = () => setStatsKey(k => k + 1);
    window.addEventListener('stats-refresh', onRefresh);
    return () => window.removeEventListener('stats-refresh', onRefresh);
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-in">
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Toolbar>
          <InventoryIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
            AKILLI DEPO
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {companyId}
          </Typography>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
          }}
        >
          <Tab icon={<CategoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ürün Yönetimi" />
          <Tab icon={<MapIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Depo Haritası" />
          <Tab icon={<ViewListIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Kategori Yönetimi" />
          <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Personel Yönetimi" />
        </Tabs>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<InventoryIcon color="primary" />}
              label="Toplam Ürün"
              value={stats?.totalProducts}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<AddShoppingCartIcon color="success" />}
              label="Bugünkü Giriş"
              value={stats?.dailyIn}
              prefix="+"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<LocalShippingIcon color="info" />}
              label="Bugünkü Çıkış"
              value={stats?.dailyOut}
              prefix="-"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<WarningAmberIcon color="secondary" />}
              label="Kritik Stok (≤10)"
              value={stats?.criticalStock}
              color="rgb(236, 72, 153)"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ mt: 2 }}>
              <SmartAlerts />
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card sx={{ mt: 1 }}>
              {tab === 0 && (
                <Box sx={{ p: 2 }}>
                  <ProductManagement onStatsChange={() => setStatsKey(k => k + 1)} />
                </Box>
              )}
              {tab === 1 && (
                <WarehouseMap />
              )}
              {tab === 2 && (
                <Box sx={{ p: 2 }}>
                  <CategoryManagement />
                </Box>
              )}
              {tab === 3 && (
                <Box sx={{ p: 2 }}>
                  <PersonnelManagement />
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
