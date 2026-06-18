import { useEffect, useState } from 'react';
import { Box, Typography, Alert, AlertTitle, Stack, CircularProgress } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import axiosClient from '../api/axiosClient';

interface RestockPrediction {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  averageDailyOutflow: number;
  estimatedDaysRemaining: number;
  isCritical: boolean;
}

const SmartAlerts = () => {
  const [predictions, setPredictions] = useState<RestockPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await axiosClient.get('/smart/restock-predictions', { params: { companyId: 'COMPANY-ABC-123' } });
        setPredictions(res.data ?? []);
      } catch (err) {
        console.error('Failed to fetch restock predictions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2" color="text.secondary">Akıllı sistem verileri analiz ediyor...</Typography>
      </Box>
    );
  }

  if (predictions.length === 0) {
    return (
      <Alert icon={<TipsAndUpdatesIcon fontSize="inherit" />} severity="success" sx={{ mb: 3 }}>
        <AlertTitle>Harika Haber!</AlertTitle>
        Akıllı sistem analizine göre yakın zamanda tükenmesi beklenen kritik bir ürün bulunmuyor.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
        <TipsAndUpdatesIcon sx={{ mr: 1, color: 'warning.main' }} /> Akıllı Sipariş Uyarıları
      </Typography>
      <Stack spacing={2}>
        {predictions.map(p => (
          <Alert 
            key={p.productId} 
            severity={p.isCritical ? "error" : "warning"}
            icon={<WarningAmberIcon fontSize="inherit" />}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: p.isCritical ? 'error.light' : 'warning.light'
            }}
          >
            <AlertTitle sx={{ fontWeight: 'bold' }}>
              {p.productName} ({p.sku}) — {p.isCritical ? 'ACİL SİPARİŞ' : 'SİPARİŞ PLANI YAPIN'}
            </AlertTitle>
            <Typography variant="body2">
              Mevcut Stok: <strong>{p.currentStock}</strong> | Günlük Ortalama Tüketim: <strong>{p.averageDailyOutflow} adet</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Son 30 günlük analizimize göre bu ürün tahmini olarak <strong>{p.estimatedDaysRemaining} gün</strong> içerisinde tamamen tükenecektir.
            </Typography>
          </Alert>
        ))}
      </Stack>
    </Box>
  );
};

export default SmartAlerts;
