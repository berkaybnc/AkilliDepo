import { useState } from 'react';
import { Box, Card, Typography, TextField, Button, Alert } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import axiosClient from '../api/axiosClient';

interface LoginProps {
  onLogin: (token: string, role: string, fullName: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axiosClient.post('/auth/login', { username, password }, { params: { companyId: 'COMPANY-ABC-123' } });
      const data = res.data;
      if (data && data.token) {
        onLogin(data.token, data.role, data.fullName);
      } else {
        setError('Giriş başarısız oldu.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { Message?: string } } };
      setError(e.response?.data?.Message ?? 'Giriş sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <InventoryIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Akıllı Depo Giriş</Typography>
          <Typography variant="body2" color="text.secondary">Lütfen bilgilerinizi girerek devam edin.</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Kullanıcı Adı"
            variant="outlined"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            fullWidth
            label="Şifre"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>Test Hesapları:</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Yönetici (Depo): <strong>admin</strong> / 123456</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Mağaza Müdürü: <strong>mudur</strong> / 123456</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Satış Danışmanı: <strong>satici</strong> / 123456</Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default Login;
