import axios from 'axios';

const API_URL = 'http://localhost:3001';

export const jsonService = {
  // Articles
  async getArticles() {
    const response = await axios.get(`${API_URL}/articles`);
    return response.data;
  },
  async getArticle(id) {
    const response = await axios.get(`${API_URL}/articles/${id}`);
    return response.data;
  },
  async addArticle(article) {
    const response = await axios.post(`${API_URL}/articles`, article);
    return response.data;
  },
  async updateArticle(id, article) {
    const response = await axios.put(`${API_URL}/articles/${id}`, article);
    return response.data;
  },
  async deleteArticle(id) {
    await axios.delete(`${API_URL}/articles/${id}`);
  },
  // Categories
  async getCategories() {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  },
  async getCategory(id) {
    const response = await axios.get(`${API_URL}/categories/${id}`);
    return response.data;
  },
  async addCategory(category) {
    const response = await axios.post(`${API_URL}/categories`, category);
    return response.data;
  },
  async updateCategory(id, category) {
    const response = await axios.put(`${API_URL}/categories/${id}`, category);
    return response.data;
  },
  async deleteCategory(id) {
    await axios.delete(`${API_URL}/categories/${id}`);
  },
};