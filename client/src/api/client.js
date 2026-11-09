import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getApiErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message === "Network Error") {
    return "Cannot reach the API. Is the backend running?";
  }

  return fallback;
};

export const getComponents = async () => {
  const response = await api.get("/api/components");
  return response.data;
};

export const getComponent = async (id) => {
  const response = await api.get(`/api/components/${id}`);
  return response.data;
};

export const createComponent = async (payload) => {
  const response = await api.post("/api/components", payload);
  return response.data;
};

export const updateComponent = async (id, payload) => {
  const response = await api.put(`/api/components/${id}`, payload);
  return response.data;
};

export const deleteComponent = async (id) => {
  const response = await api.delete(`/api/components/${id}`);
  return response.data;
};
