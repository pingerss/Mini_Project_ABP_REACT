import axios from 'axios';
import axiosClient, { API_BASE_URL } from './axiosClient';

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Giải mã phần Payload của chuỗi JWT để lấy danh sách Role (không cần cài thêm thư viện)
 */
export function getRolesFromToken(token: string | null): string[] {
  if (!token) return [];
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return [];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    const roleClaim =
      payload.role ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (!roleClaim) return [];
    return Array.isArray(roleClaim) ? roleClaim : [roleClaim];
  } catch {
    return [];
  }
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('client_id', 'MiniLms_App');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('scope', 'MiniLms offline_access');

    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/connect/token`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user_name', username);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }

    return response.data;
  },

  async getCurrentUserProfile() {
    const response = await axiosClient.get('/api/account/my-profile');
    return response.data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const formData = new URLSearchParams();
        formData.append('client_id', 'MiniLms_App');
        formData.append('token', refreshToken);
        formData.append('token_type_hint', 'refresh_token');
        await axios.post(`${API_BASE_URL}/connect/revocation`, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch {
        // Bỏ qua lỗi mạng khi revoke để vẫn xóa phiên ở trình duyệt
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_name');
  },
};
