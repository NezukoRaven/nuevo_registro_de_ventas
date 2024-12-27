// apiConfig.js
interface ApiConfig {
    baseUrl: string | null;
    urls: string[];
    getApiUrl: (endpoint: string, urls?: string[]) => Promise<string>;
    endpoints: { [key: string]: string };
}

const apiConfig: ApiConfig = {
    baseUrl: null,
    urls: [
        'http://localhost:3001',
        'http://34.136.163.22:3001',
    ],
    getApiUrl: async (endpoint, urls = apiConfig.urls) => {
        // Si ya se determinó una URL válida, usarla
        if (apiConfig.baseUrl) {
            return apiConfig.baseUrl;
        }

        // Si no quedan URLs por probar, lanzar un error
        if (urls.length === 0) {
            console.error('Error al conectar con la API: Ninguna URL es válida');
            throw new Error('Error al conectar con la API');
        }

        const url = urls[0]; // Tomar la primera URL de la lista

        try {
            await fetch(`${url}${endpoint}`); // Solo verificar si la petición es exitosa
            apiConfig.baseUrl = url; // Guardar la URL que funciona
            return url;
        } catch (error) {
            // Probar la siguiente URL recursivamente
            return apiConfig.getApiUrl(endpoint, urls.slice(1));
        }
    },
    endpoints: {
        form1: '/api/sales',
        form2: '/api/sales_mama',
        products: '/api/products',
    }
};

export default apiConfig;