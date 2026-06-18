import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  Snackbar, Alert, Slide,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Box
} from '@mui/material';
import type { AlertColor, SlideProps } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { NotificationContext } from './notificationContext';
import type { ConfirmOptions } from './notificationContext';

function SlideUp(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface SnackState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve: (val: boolean) => void;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'info' });
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const show = useCallback((message: string, severity: AlertColor) => {
    setSnack({ open: true, message, severity });
  }, []);

  const showSuccess = useCallback((msg: string) => show(msg, 'success'), [show]);
  const showError   = useCallback((msg: string) => show(msg, 'error'),   [show]);
  const showWarning = useCallback((msg: string) => show(msg, 'warning'), [show]);
  const showInfo    = useCallback((msg: string) => show(msg, 'info'),    [show]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ ...options, open: true, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  const severityColor = confirmState?.severity === 'error' ? '#f44336' : '#ff9800';
  const SeverityIcon  = confirmState?.severity === 'error' ? ErrorIcon : WarningAmberIcon;

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showWarning, showInfo, confirm }}>
      {children}

      {/* Toast Bildirimi */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slots={{ transition: SlideUp }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error:   <ErrorIcon fontSize="inherit" />,
            warning: <WarningAmberIcon fontSize="inherit" />,
            info:    <InfoIcon fontSize="inherit" />,
          }}
          sx={{
            minWidth: 320, borderRadius: 3,
            fontWeight: 600, fontSize: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

      {/* Onay Dialogu */}
      <Dialog
        open={!!confirmState?.open}
        onClose={() => handleClose(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              border: `1px solid ${severityColor}40`,
              boxShadow: `0 0 60px ${severityColor}20`,
              minWidth: 380,
              overflow: 'hidden',
            }
          }
        }}
      >
        {confirmState && (
          <>
            <Box sx={{ px: 3, pt: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SeverityIcon sx={{ color: severityColor, fontSize: 28 }} />
              <DialogTitle sx={{ p: 0, fontWeight: 700, fontSize: 18 }}>
                {confirmState.title}
              </DialogTitle>
            </Box>
            <DialogContent sx={{ px: 3, pt: 1 }}>
              <DialogContentText sx={{ color: 'text.secondary', fontSize: 14 }}>
                {confirmState.message}
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button variant="text" onClick={() => handleClose(false)} sx={{ borderRadius: 20, px: 3 }}>
                {confirmState.cancelLabel ?? 'İptal'}
              </Button>
              <Button
                variant="contained"
                color={confirmState.severity === 'error' ? 'error' : 'warning'}
                onClick={() => handleClose(true)}
                sx={{ borderRadius: 20, px: 3, fontWeight: 700 }}
              >
                {confirmState.confirmLabel ?? 'Onayla'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </NotificationContext.Provider>
  );
}
