import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

export default http;
