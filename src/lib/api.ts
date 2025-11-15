const API_BASE_URL = "https://envira-backend-production.up.railway.app";

// Token management
export const getAuthToken = () => localStorage.getItem("envira_token");
export const setAuthToken = (token: string) => localStorage.setItem("envira_token", token);
export const removeAuthToken = () => localStorage.removeItem("envira_token");

// API request helper
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || error.message || "Request failed");
  }

  return response.json();
}

// Auth endpoints
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return response.json();
  },

  register: async (email: string, password: string, name: string) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  },
};

// User endpoints
export const userAPI = {
  getProfile: () => apiRequest("/users/me"),
  getDevices: () => apiRequest("/users/devices"),
  updatePreferences: (preferences: any) =>
    apiRequest("/users/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    }),
};

// Device endpoints
export const deviceAPI = {
  getLatest: (deviceId: string) => apiRequest(`/latest/${deviceId}`),
  getLatestSummary: (deviceId: string) => apiRequest(`/latest/device/${deviceId}/summary`),
  getData: (deviceId: string, limit = 50, hours = 24) =>
    apiRequest(`/devices/${deviceId}/data?limit=${limit}&hours=${hours}`),
};

// Recommendations endpoints
export const recommendationsAPI = {
  getActivities: () => apiRequest("/recommendations/activities"),

  getGeneralRecommendations: (deviceId: string = "esp32-001") =>
    apiRequest("/recommendations/general", {
      method: "POST",
      body: JSON.stringify({ device_id: deviceId }),
    }),
  getActivityRecommendations: (activityName: string, deviceId: string = "esp32-001") =>
    apiRequest("/recommendations/activity", {
      method: "POST",
      body: JSON.stringify({ activity_id: activityName, device_id: deviceId }),
    }),
  
};

// Exercise endpoints
export const exerciseAPI = {
  getAll: (category?: string, difficulty?: string) => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (difficulty) params.append("difficulty", difficulty);
    const query = params.toString();
    return apiRequest(`/exercises${query ? `?${query}` : ""}`);
  },

  getById: (exerciseId: string) => apiRequest(`/exercises/${exerciseId}`),

  startSession: (exerciseId: string) =>
    apiRequest(`/exercises/${exerciseId}/start`, { method: "POST" }),

  getSession: (sessionId: string) => apiRequest(`/exercises/session/${sessionId}`),

  updateStep: (sessionId: string, stepNumber: number) =>
    apiRequest(`/exercises/session/${sessionId}/step`, {
      method: "PUT",
      body: JSON.stringify({ current_step: stepNumber }),
    }),

  completeSession: (sessionId: string, notes?: string) =>
    apiRequest(`/exercises/session/${sessionId}/complete`, { 
      method: "POST",
      body: JSON.stringify({ notes: notes || "" })
    }),

  getHistory: () => apiRequest("/exercises/history/user"),

  getStats: () => apiRequest("/exercises/stats/user"),
};
