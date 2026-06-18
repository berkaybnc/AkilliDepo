import axios from 'axios';

// Helper to convert PascalCase to camelCase
const toCamelCase = (str: string) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
};

// Helper to convert camelCase to PascalCase
const toPascalCase = (str: string) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const convertKeys = (obj: unknown, converter: (key: string) => string): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeys(item, converter));
  }

  const record = obj as Record<string, unknown>;
  return Object.keys(record).reduce((acc, key) => {
    const newKey = converter(key);
    acc[newKey] = convertKeys(record[key], converter);
    return acc;
  }, {} as Record<string, unknown>);
};

const axiosClient = axios.create({
  baseURL: 'http://localhost:5055/api',
});

// Request Interceptor: Convert outgoing payload to PascalCase (Rule 6)
axiosClient.interceptors.request.use(config => {
  if (config.data) {
    config.data = convertKeys(config.data, toPascalCase);
  }
  // Convert query params to PascalCase if they exist
  if (config.params) {
    config.params = convertKeys(config.params, toPascalCase);
  }
  return config;
});

// Response Interceptor: Convert incoming payload to camelCase (Rule 6)
axiosClient.interceptors.response.use(response => {
  if (response.data) {
    response.data = convertKeys(response.data, toCamelCase);
  }
  return response;
});

// --- MOCK API MODU ---
// Backend çalışmadığı için arayüzü gösterebilmek adına geçici Mock API.
/* eslint-disable @typescript-eslint/no-explicit-any */

interface MockProduct {
  id: number;
  name: string;
  sku: string;
  description: string;
  categoryId: number;
  totalStock: number;
  companyId: string;
  zoneId?: number; // Ürünün varsayılan rafı
}

// localStorage ile kalıcı veri saklama
const STORAGE_KEY = 'smartwarehouse_mock_db';
const COUNTER_KEY = 'smartwarehouse_mock_counter';

const loadDatabase = (): MockProduct[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  // Varsayılan olarak boş başla — kullanıcı kendi ürünlerini ekler
  return [];
};

const saveDatabase = (db: MockProduct[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* ignore */ }
};

const loadCounter = (): number => {
  const val = localStorage.getItem(COUNTER_KEY);
  return val ? parseInt(val, 10) : 3;
};

const saveCounter = (val: number) => {
  try { localStorage.setItem(COUNTER_KEY, String(val)); } catch { /* ignore */ }
};

let mockIdCounter = loadCounter();
let mockDatabase: MockProduct[] = loadDatabase();

// --- ZONES localStorage persistence ---
interface MockZone {
  id: number;
  name: string;
  description: string;
  companyId: string;
  color?: string;
  capacity?: number; // 0 veya undefined = limitsiz
}
const ZONES_KEY = 'smartwarehouse_mock_zones';
const ZONES_COUNTER_KEY = 'smartwarehouse_zones_counter';

const DEFAULT_ZONES: MockZone[] = [
  { id: 1, name: 'A Rafı', description: 'Kuzey Depo', companyId: 'COMPANY-ABC-123', color: '#3f51b5', capacity: 500 },
  { id: 2, name: 'B Rafı', description: 'Güney Depo', companyId: 'COMPANY-ABC-123', color: '#9c27b0', capacity: 300 },
];

const loadZones = (): MockZone[] => {
  try {
    const stored = localStorage.getItem(ZONES_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_ZONES;
};
const saveZones = (z: MockZone[]) => {
  try { localStorage.setItem(ZONES_KEY, JSON.stringify(z)); } catch { /* ignore */ }
};
const loadZoneCounter = (): number => {
  const val = localStorage.getItem(ZONES_COUNTER_KEY);
  return val ? parseInt(val, 10) : 3;
};
const saveZoneCounter = (v: number) => {
  try { localStorage.setItem(ZONES_COUNTER_KEY, String(v)); } catch { /* ignore */ }
};

let mockZones: MockZone[] = loadZones();
let mockZoneCounter = loadZoneCounter();

// Yardımcı: Axios interceptor'larından etkilenmiş dondurulmuş objelere dokunmamak için
// her zaman derin kopya (deep clone) döndürür.
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Günlük hareket logu (oturum bazlı — sayfa yenilenince sıfırlanır, gerçek sistemde DB'den gelir)
const TODAY = new Date().toDateString();
const MOVEMENTS_KEY = `smartwarehouse_movements_${TODAY}`;

interface MovementLog { type: number; quantity: number; }
const loadMovements = (): MovementLog[] => {
  try { const s = localStorage.getItem(MOVEMENTS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
};
const saveMovement = (m: MovementLog) => {
  const all = loadMovements();
  try { localStorage.setItem(MOVEMENTS_KEY, JSON.stringify([...all, m])); } catch { /* ignore */ }
};

const mockAxiosClient = {
  get: async (_url?: string, _config?: unknown): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Dashboard istatistikleri
        if (_url?.includes('/dashboard/stats')) {
          const movements = loadMovements();
          const dailyIn = movements.filter(m => m.type === 1).reduce((s, m) => s + m.quantity, 0);
          const dailyOut = movements.filter(m => m.type === 2).reduce((s, m) => s + m.quantity, 0);
          const CRITICAL_THRESHOLD = 10;
          const criticalCount = mockDatabase.filter(p => p.totalStock <= CRITICAL_THRESHOLD && p.totalStock >= 0).length;
          resolve({
            data: {
              totalProducts: mockDatabase.length,
              dailyIn,
              dailyOut,
              criticalStock: criticalCount,
            }
          });
          return;
        }

        // Ürünleri zona göre filtrele: /products?zoneId=X
        if (_url?.includes('/products')) {
          const params = (_config as any)?.params;
          const zoneFilter = params?.zoneId ? Number(params.zoneId) : null;
          const filtered = zoneFilter
            ? mockDatabase.filter(p => p.zoneId === zoneFilter)
            : mockDatabase;
          resolve({
            data: {
              success: true,
              data: deepClone(filtered),
              totalCount: filtered.length,
              page: 1,
              pageSize: 25,
              totalPages: 1,
            }
          });
          return;
        }

        if (_url?.includes('/zones')) {
          resolve({ data: deepClone(mockZones) });
          return;
        }

        resolve({
          data: {
            success: true,
            data: deepClone(mockDatabase),
            totalCount: mockDatabase.length,
            page: 1,
            pageSize: 25,
            totalPages: 1,
          }
        });
      }, 300);
    });
  },
  post: async (url: string, data?: { id?: number; [key: string]: unknown }): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (url.includes('/inventorymovements/create')) {
            const type = data?.type as number;
            const qty = Number(data?.quantity);
            const pId = data?.productId as number;
            const targetZoneId = data?.zoneId as number;
            const idx = mockDatabase.findIndex(p => p.id === pId);
            if (idx !== -1) {
              if (type === 1) {
                // Stok Girişi — önce rafın kapasitesini kontrol et
                if (targetZoneId) {
                  const zone = mockZones.find(z => z.id === Number(targetZoneId));
                  if (zone?.capacity && zone.capacity > 0) {
                    // Bu raftaki mevcut toplam stoku hesapla
                    const currentZoneStock = mockDatabase
                      .filter(p => p.zoneId === zone.id)
                      .reduce((sum, p) => sum + p.totalStock, 0);
                    if (currentZoneStock + qty > zone.capacity) {
                      const remaining = zone.capacity - currentZoneStock;
                      reject({
                        response: {
                          data: {
                            message: remaining <= 0
                              ? `"${zone.name}" rafı dolu! Kapasite: ${zone.capacity} adet. Mevcut stok: ${currentZoneStock} adet.`
                              : `"${zone.name}" rafına en fazla ${remaining} adet daha ekleyebilirsiniz. (Kapasite: ${zone.capacity}, Mevcut: ${currentZoneStock})`
                          }
                        }
                      });
                      return;
                    }
                  }
                }
                mockDatabase[idx].totalStock += qty;
                saveMovement({ type: 1, quantity: qty });
              } else if (type === 2) {
                // Stok Çıkışı
                if (mockDatabase[idx].totalStock < qty) {
                  reject({ response: { data: { message: 'Yetersiz stok!' } } });
                  return;
                }
                mockDatabase[idx].totalStock -= qty;
                saveMovement({ type: 2, quantity: qty });
              } else if (type === 3) {
                // Raflar Arası Transfer: stok değişmez, ürünün rafı güncellenir
                const targetZoneId = data?.zoneId as number;
                if (targetZoneId) {
                  mockDatabase[idx].zoneId = Number(targetZoneId);
                }
              }
              saveDatabase(mockDatabase);
            }
          } else if (url.includes('/zones/update') && data) {
            const idx = mockZones.findIndex(z => z.id === data.id);
            if (idx !== -1) {
              mockZones[idx] = {
                ...mockZones[idx],
                name: String(data.name ?? mockZones[idx].name),
                description: String(data.description ?? mockZones[idx].description),
                capacity: data.capacity !== undefined ? Number(data.capacity) : mockZones[idx].capacity,
              };
              saveZones(mockZones);
            }
          } else if (url.includes('/zones/create')) {
            const ZONE_COLORS = ['#3f51b5','#9c27b0','#e91e63','#f44336','#ff9800','#4caf50','#00bcd4','#795548'];
            const newZone: MockZone = {
              id: mockZoneCounter++,
              name: String(data?.name ?? 'Yeni Raf'),
              description: String(data?.description ?? ''),
              companyId: String(data?.companyId ?? 'COMPANY-ABC-123'),
              color: ZONE_COLORS[mockZones.length % ZONE_COLORS.length],
              capacity: data?.capacity ? Number(data.capacity) : 0,
            };
            mockZones = [...mockZones, newZone];
            saveZones(mockZones);
            saveZoneCounter(mockZoneCounter);
          } else if (url.includes('/zones/delete') && data) {
            mockZones = mockZones.filter(z => z.id !== data.id);
            saveZones(mockZones);
          } else if (url.includes('/create')) {
            const newProduct: MockProduct = {
              id: mockIdCounter++,
              name: String(data?.name ?? ''),
              sku: String(data?.sku ?? ''),
              description: String(data?.description ?? ''),
              categoryId: Number(data?.categoryId ?? 1),
              totalStock: 0,
              companyId: String(data?.companyId ?? 'COMPANY-ABC-123'),
              zoneId: data?.zoneId ? Number(data.zoneId) : undefined,
            };
            mockDatabase = [...mockDatabase, newProduct];
            saveDatabase(mockDatabase);
            saveCounter(mockIdCounter);
          } else if (url.includes('/delete') && data) {
            mockDatabase = mockDatabase.filter(p => p.id !== data.id);
            saveDatabase(mockDatabase);
          } else if (url.includes('/update') && data) {
            const index = mockDatabase.findIndex(p => p.id === data.id);
            if (index !== -1) {
              mockDatabase[index] = { ...mockDatabase[index], ...data } as MockProduct;
              saveDatabase(mockDatabase);
            }
          }
          resolve({ data: { success: true } });
        } catch (e) {
          reject(e);
        }
      }, 400);
    });
  }
};

// Gerçek backend çalışmadığı için MOCK modunu dışa aktarıyoruz.
// Backend çalıştığında bu satırı: export default axiosClient; ile değiştirin.
export default mockAxiosClient;
