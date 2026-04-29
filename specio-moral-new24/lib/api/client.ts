const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Token management
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
}

export function getUser(): any {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// Generic fetch wrapper with auth
async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - redirect to login
  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  return response;
}

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }

      // Store token and user info
      setToken(data.data.accessToken);
      setUser(data.data.user);

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Registration failed' };
      }

      return { success: true, data: result.data, message: result.data || result.message };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/verify-email?token=${token}`);
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Verification failed' };
      return { success: true, message: data.data || data.message };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async resendVerification(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to resend' };
      return { success: true, message: data.data || data.message };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  logout(): void {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },
};

// Verification API
export const verificationApi = {
  async verify(code: string, location?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/verification/verify', {
        method: 'POST',
        body: JSON.stringify({ code, location }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Verification failed' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getHistory(page = 0, size = 10): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/verification/history?page=${page}&size=${size}`);

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch history' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/verification/stats');

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch stats' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/verification/${id}`);

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch verification' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getBrands(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/verification/brands');

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch brands' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async reportFailed(attemptedCode: string, reportedBrandId?: string, location?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/verification/report-failed', {
        method: 'POST',
        body: JSON.stringify({ attemptedCode, reportedBrandId, location }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to report' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },
};

// Brand API
export const brandApi = {
  async login(email: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/brand/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }

      // Store token and user/brand info
      setToken(data.data.accessToken);
      setUser({ ...data.data.user, brand: data.data.brand });

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] Brand login API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },

  async register(data: {
    brandName: string;
    description?: string;
    websiteUrl?: string;
    supportEmail?: string;
    supportPhone?: string;
    contactFirstName: string;
    contactLastName: string;
    contactPhone?: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/brand/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Registration failed' };
      }

      return { success: true, data: result.data, message: result.data || result.message };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getDashboard(brandId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/brand/${brandId}/dashboard`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch dashboard' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] getDashboard API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },

  async generateCodes(brandId: string, request: {
    quantity: number;
    productId?: string;
    newProduct?: {
      name: string;
      description?: string;
      modelNumber?: string;
      category?: string;
    };
    hasSpecialOffer?: boolean;
    specialOfferDescription?: string;
    specialOfferDiscountPercent?: number;
    specialOfferValidUntil?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/brand/${brandId}/codes/generate`, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to generate codes' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] generateCodes API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },

  async getProducts(brandId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/brand/${brandId}/products`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch products' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] getProducts API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },

  async createProduct(brandId: string, product: {
    name: string;
    description?: string;
    modelNumber?: string;
    category?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/brand/${brandId}/products`, {
        method: 'POST',
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to create product' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] createProduct API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },

  async enableSpecialOffer(brandId: string, request: {
    batchId?: string;
    productId?: string;
    description: string;
    discountPercent?: number;
    validUntil?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/brand/${brandId}/special-offer`, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to enable special offer' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getCodes(brandId: string, filters?: {
    productId?: string;
    batchId?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (filters?.productId) params.append('productId', filters.productId);
      if (filters?.batchId) params.append('batchId', filters.batchId);
      if (filters?.status) params.append('status', filters.status);
      params.append('page', String(filters?.page || 0));
      params.append('size', String(filters?.size || 50));

      const response = await fetchWithAuth(`/v1/brand/${brandId}/codes?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch codes' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] getCodes API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },

  async enableSpecialOfferForCodes(brandId: string, request: {
    selectionMode: 'individual' | 'random';
    codeIds?: string[];
    randomCount?: number;
    productId?: string;
    batchId?: string;
    description: string;
    discountPercent?: number;
    validUntil?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/brand/${brandId}/special-offer/codes`, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to enable special offer' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] enableSpecialOfferForCodes API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },

  async getVerificationReport(brandId: string, filters?: {
    status?: string;
    location?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.location) params.append('location', filters.location);

      const response = await fetchWithAuth(`/v1/brand/${brandId}/verification-report?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch verification report' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] getVerificationReport API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },

  async resetPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/brand/reset-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to reset password' };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getBilling(brandId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/brand/${brandId}/billing`);
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to fetch billing' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async getCodeDetails(brandId: string, code: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/brand/${brandId}/codes/${encodeURIComponent(code)}/details`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch code details' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.log('[v0] getCodeDetails API failed:', error);
      return { success: false, error: 'Network error. Please check your backend connection.' };
    }
  },
};

// Admin API
export const adminApi = {
  async login(username: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }
      setToken(data.data.accessToken);
      setUser(data.data.user);
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async resetPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/admin/reset-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to reset password' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async getUsers(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/admin/users');
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to fetch users' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async getUserStats(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/admin/users/${userId}/stats`);
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to fetch user stats' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async getUserVerifications(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/admin/users/${userId}/verifications`);
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to fetch verifications' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async getBrands(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/admin/brands');
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to fetch brands' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async getBrandBilling(brandId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/admin/brands/${brandId}/billing`);
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to fetch billing' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async markBillingPaid(billingId: string, paid: boolean): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/admin/billing/${billingId}/mark-paid`, {
        method: 'PUT',
        body: JSON.stringify({ paid }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to update billing' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async getBrandReport(brandId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/admin/brands/${brandId}/report`);
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to fetch report' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async resetUserPassword(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to reset password' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async resetBrandPassword(brandId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/admin/brands/${brandId}/reset-password`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to reset password' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },

  async toggleBrandActive(brandId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth(`/v1/admin/brands/${brandId}/toggle-active`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to toggle brand status' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error.' };
    }
  },
};

// User API
export const userApi = {
  async getProfile(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/users/me');

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to fetch profile' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to update profile' };
      }

      // Update stored user
      setUser(data.data);

      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async downloadData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/users/me/data');
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.message || 'Failed to download data' };
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetchWithAuth('/v1/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to change password' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },
};
