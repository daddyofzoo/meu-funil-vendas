const axios = require('axios');

module.exports = async (req, res) => {
    // Permitir CORS para desenvolvimento (opcional)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log('🔵 Iniciando função de pagamento. Body recebido:', req.body);

    const { client_id, amount, phone, reference, wallet_id, method } = req.body;

    // Validação básica
    if (!client_id || !amount || !phone || !reference || !wallet_id) {
        console.error('❌ Campos faltando:', { client_id, amount, phone, reference, wallet_id });
        return res.status(400).json({ success: false, message: 'Dados incompletos. Verifique os campos.' });
    }

    const client_secret = process.env.CLIENT_SECRET;
    console.log('🔑 CLIENT_SECRET presente?', client_secret ? 'Sim' : 'NÃO!');

    if (!client_secret) {
        console.error('❌ CLIENT_SECRET não configurado nas variáveis de ambiente da Vercel.');
        return res.status(500).json({ success: false, message: 'Erro de configuração do servidor. Contacte o suporte.' });
    }

    const baseURL = 'https://mpesaemolatech.com';

    try {
        // 1. Gerar token
        console.log('🟢 Solicitando token de acesso...');
        const tokenRes = await axios.post(`${baseURL}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: client_id,
            client_secret: client_secret
        });
        const accessToken = tokenRes.data.access_token;
        console.log('✅ Token obtido com sucesso.');

        // 2. Fazer pagamento
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
        console.log(`🟢 Chamando endpoint: ${endpoint} com payload:`, paymentPayload);

        const paymentRes = await axios.post(endpoint, paymentPayload, { headers });
        console.log('✅ Pagamento bem-sucedido:', paymentRes.data);

        return res.status(200).json({ success: true, data: paymentRes.data });

    } catch (error) {
        console.error('❌ Erro na função:');
        if (error.response) {
            console.error('Resposta da API:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Sem resposta da API:', error.request);
        } else {
            console.error('Erro geral:', error.message);
        }
        return res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Erro interno ao processar pagamento.'
        });
    }
};
