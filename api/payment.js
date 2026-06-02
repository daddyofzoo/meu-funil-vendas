// api/payment.js
const axios = require('axios');

export default async function handler(req, res) {
    // 1. Verificar se o método é POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Extrair os dados enviados pelo front-end (index.html)
    const { client_id, amount, phone, reference, wallet_id, method } = req.body;

    // 3. Buscar o client_secret das Variáveis de Ambiente da Vercel
    const client_secret = process.env.CLIENT_SECRET;
    
    // Validação rápida
    if (!client_secret) {
        console.error("Erro: CLIENT_SECRET não configurado na Vercel.");
        return res.status(500).json({ success: false, message: "Erro de configuração do servidor." });
    }

    // Usar o novo domínio da API
    const baseURL = 'https://mpesaemolatech.com';

    try {
        // 4. Obter o token de acesso com as credenciais (seguro aqui no backend)
        const tokenRes = await axios.post(`${baseURL}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: client_id,
            client_secret: client_secret
        });
        const accessToken = tokenRes.data.access_token;

        // 5. Preparar a requisição de pagamento para a E2Payments
        const paymentPayload = {
            client_id: client_id,
            amount: amount,
            phone: phone,
            reference: reference
        };
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        const endpoint = `${baseURL}/v1/c2b/mpesa-payment/${wallet_id}`;
        const paymentRes = await axios.post(endpoint, paymentPayload, { headers });

        // 6. Tudo correto? Retornar sucesso para o front-end
        res.status(200).json({ success: true, data: paymentRes.data });
        
    } catch (error) {
        // 7. Em caso de erro, log detalhado e retornar mensagem amigável
        console.error('Erro na função de pagamento:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || 'Falha ao processar o pagamento. Tente novamente.' 
        });
    }
}