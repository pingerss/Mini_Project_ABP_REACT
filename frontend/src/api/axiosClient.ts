import axios from 'axios';

// Cổng mặc định của MiniLms.HttpApi.Host (kiểm tra trong Properties/launchSettings.json)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:44350';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Tự động chạy TRƯỚC KHI mọi request rời khỏi trình duyệt
axiosClient.interceptors.request.use(
  (config) => {
    // WHY: Tự động đọc JWT Access Token trong localStorage và đính kèm vào Header Authorization
    // để ta không phải truyền token thủ công ở từng trang React.
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Tự động chạy KHI NHẬN KẾT QUẢ trả về từ Backend ABP
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu Backend trả về 401 (Chưa đăng nhập hoặc Token đã hết hạn)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_name');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;