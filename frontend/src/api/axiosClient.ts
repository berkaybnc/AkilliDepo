import axios from 'axios';

const toCamelCase = (str: string) => {
  if (!str || typeof str !== 'string') return str;
  if (str === 'SKU') return 'sku';
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

// Request Interceptor: Convert outgoing payload to PascalCase
axiosClient.interceptors.request.use(config => {
  if (config.data) {
    config.data = convertKeys(config.data, toPascalCase);
  }

  if (config.params) {
    config.params = convertKeys(config.params, toPascalCase);
  }

  return config;
});

// Response Interceptor: Convert incoming payload PascalCase keys -> camelCase
axiosClient.interceptors.response.use(response => {
  if (!response.data) return response;

  // Backend: wrapper object usually looks like:
  // { success: true, data: [...], totalCount, page, pageSize, totalPages }
  const d = response.data as unknown;

  if (typeof d === 'object' && d !== null) {
    let shouldConvert = false;

    if (Array.isArray(d)) {
      if (d.length > 0 && typeof d[0] === 'object' && d[0] !== null) {
        shouldConvert = Object.keys(d[0]).some(k => /^[A-Z]/.test(k));
      }
    } else {
      const record = d as Record<string, unknown>;
      const keys = Object.keys(record);
      const looksLikeApiWrapper = ['data', 'totalCount', 'page', 'pageSize', 'totalPages', 'success'].some(k => k in record);
      const hasPascalCaseKeys = keys.some(k => /^[A-Z]/.test(k));
      shouldConvert = looksLikeApiWrapper || hasPascalCaseKeys;
    }

    if (shouldConvert) {
      response.data = convertKeys(response.data, toCamelCase) as typeof response.data;
    }
  }

  return response;
});

export default axiosClient;

