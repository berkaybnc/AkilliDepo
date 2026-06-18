import { createContext } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'warning' | 'error';
}

export interface NotificationContextValue {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  showWarning: (msg: string) => void;
  showInfo: (msg: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);
