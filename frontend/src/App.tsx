import { useState, useEffect } from 'react';
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
  Skeleton,
  Button
} from '@mui/material';
import CountUp from 'react-countup';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
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
import Login from './components/Login';
import ViewListIcon from '@mui/icons-material/ViewList';
import PeopleIcon from '@mui/icons-material/People';
import axiosClient from './api/axiosClient';

interface DashboardStats {
  totalProducts: number;
  dailyIn: number;
  dailyOut: number;
  criticalStock: number;
  movementTrends?: { dateLabel: string; in: number; out: number }[];
}

// ─── StatCard bileşeni App dışında tanımlanmalı ─────────────
const StatCard = ({
  icon, label, value, color = '#1976d2', prefix = '', suffix = '', trendData, dataKey, onClick
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  color?: string;
  prefix?: string;
  suffix?: string;
  trendData?: { dateLabel: string; in: number; out: number }[];
  dataKey?: string;
  onClick?: () => void;
}) => (
  <Card 
    onClick={onClick}
    sx={{ 
      position: 'relative',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      border: `1px solid ${color}50`,
      background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)`,
      backdropFilter: 'blur(10px)',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 24px ${color}40`,
        borderColor: color
      } : {}
    }}
  >
    <CardContent sx={{ position: 'relative', zIndex: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography color="text.secondary" sx={{ ml: 1, mb: 0, fontWeight: 500 }}>{label}</Typography>
      </Box>
      {value === undefined ? (
        <Skeleton variant="text" width={80} height={56} />
      ) : (
        <Typography variant="h4" sx={{ color, fontWeight: 'bold' }}>
          {prefix}<CountUp end={value} duration={2} separator="." />{suffix}
        </Typography>
      )}
    </CardContent>
    {/* Arka Plan Sparkline */}
    {trendData && trendData.length > 0 && dataKey && (
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', opacity: 0.2, zIndex: 1, pointerEvents: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    )}
  </Card>
);

// ─── Ana Uygulama ────────────────────────────────────────────
function App() {
  const [companyId] = useState('COMPANY-ABC-123');
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsKey, setStatsKey] = useState(0);
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  
  
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [fullName, setFullName] = useState<string | null>(localStorage.getItem('fullName'));

  const handleLogin = (newToken: string, newRole: string, newFullName: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('fullName', newFullName);
    setToken(newToken);
    setRole(newRole);
    setFullName(newFullName);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    setToken(null);
    setRole(null);
    setFullName(null);
    setTab(0);
  };

  useEffect(() => {
    if (!token) return;
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
  }, [companyId, statsKey, tab, token]);

  // Stok hareketi yapıldığında istatistikleri otomatik güncelle
  useEffect(() => {
    const onRefresh = () => setStatsKey(k => k + 1);
    window.addEventListener('stats-refresh', onRefresh);
    return () => window.removeEventListener('stats-refresh', onRefresh);
  }, []);

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const isSales = role === 'SatisDanismani';
  const isManager = role === 'MagazaMuduru';

  return (
    <Box sx={{ flexGrow: 1 }} className="animate-fade-in">
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Toolbar>
          <InventoryIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
            AKILLI DEPO
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hoş geldin, <strong>{fullName}</strong> ({role === 'DepoGorevlisi' ? 'Depo Görevlisi' : role === 'MagazaMuduru' ? 'Mağaza Müdürü' : 'Satış Danışmanı'})
            </Typography>
            <Button variant="outlined" color="inherit" size="small" onClick={handleLogout} sx={{ textTransform: 'none' }}>
              Çıkış Yap
            </Button>
          </Box>
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
          {!isSales && <Tab icon={<MapIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Depo Haritası" />}
          {!isSales && <Tab icon={<ViewListIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Kategori Yönetimi" />}
          {isManager && <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Personel Yönetimi" />}
        </Tabs>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<InventoryIcon color="primary" />}
              label="Toplam Ürün"
              value={stats?.totalProducts}
              color="#1976d2"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<AddShoppingCartIcon color="success" />}
              label="Bugünkü Giriş"
              value={stats?.dailyIn}
              prefix="+"
              color="#2e7d32"
              trendData={stats?.movementTrends}
              dataKey="in"
              onClick={() => {
                setDashboardFilter('dailyIn');
                setTab(0);
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<LocalShippingIcon color="info" />}
              label="Bugünkü Çıkış"
              value={stats?.dailyOut}
              prefix="-"
              color="#0288d1"
              trendData={stats?.movementTrends}
              dataKey="out"
              onClick={() => {
                setDashboardFilter('dailyOut');
                setTab(0);
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              icon={<WarningAmberIcon color="secondary" />}
              label="Kritik Stok (≤10)"
              value={stats?.criticalStock}
              color="rgb(236, 72, 153)"
              onClick={() => {
                setDashboardFilter('critical');
                setTab(0);
              }}
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
                  <ProductManagement 
                    onStatsChange={() => setStatsKey(k => k + 1)} 
                    isSales={isSales} 
                    dashboardFilter={dashboardFilter}
                    onClearFilter={() => setDashboardFilter(null)}
                  />
                </Box>
              )}
              {tab === 1 && !isSales && (
                <Box sx={{ p: 2 }}>
                  <WarehouseMap />
                </Box>
              )}
              {tab === 2 && !isSales && (
                <Box sx={{ p: 2 }}>
                  <CategoryManagement />
                </Box>
              )}
              {tab === 3 && isManager && (
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
