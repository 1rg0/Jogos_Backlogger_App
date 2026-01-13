import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.0.3:5298', 
    timeout: 10000,
});
/* TESTE DE ROTAS
api.interceptors.request.use(request => {
    // Se baseURL ou url forem undefined, usamos uma string vazia ''
    const baseURL = request.baseURL || '';
    const url = request.url || '';
    
    console.log('>>> AXIOS REQUEST:', `${baseURL}${url}`);
    return request;
});*/

export default api;