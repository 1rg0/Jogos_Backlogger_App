import axios from 'axios';

export const API_URL = 'http://192.168.0.3:5298';

const api = axios.create({
    baseURL: API_URL, 
    timeout: 10000,
});
/* TESTE DE ROTAS
api.interceptors.request.use(request => {
    const baseURL = request.baseURL || '';
    const url = request.url || '';
    
    console.log('AXIOS REQUEST:', `${baseURL}${url}`);
    return request;
});*/

export default api;