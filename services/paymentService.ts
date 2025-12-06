
import { supabase } from './supabaseClient';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

// Inicializa o SDK do Mercado Pago (Opcional se formos usar apenas Redirect, mas mantido para futuro)
const MP_PUBLIC_KEY = (import.meta as any).env?.VITE_MP_PUBLIC_KEY || process.env.VITE_MP_PUBLIC_KEY || 'TEST-00000000-0000-0000-0000-000000000000';

export const initMercadoPago = () => {
    if (window.MercadoPago) {
        new window.MercadoPago(MP_PUBLIC_KEY);
    }
};

interface CreatePreferenceResponse {
    init_point: string;
    preferenceId: string;
}

export const createPreference = async (planType: 'monthly' | 'annual', userId: string, email: string): Promise<CreatePreferenceResponse> => {
    try {
        console.log(`Iniciando checkout para ${planType} - Usuário: ${userId}`);

        // Chama a Edge Function 'create-preference' hospedada no Supabase
        const { data, error } = await supabase.functions.invoke('create-preference', {
            body: { 
                planType, 
                userId,
                email,
                origin: window.location.origin // Passa a origem para configurar o redirect de volta
            }
        });

        if (error) {
            console.error('Erro na Edge Function:', error);
            throw new Error('Falha ao comunicar com servidor de pagamento.');
        }

        if (!data?.init_point) {
            throw new Error('Link de pagamento não retornado.');
        }
        
        return {
            init_point: data.init_point,
            preferenceId: data.id
        };

    } catch (error) {
        console.error('Erro ao criar preferência de pagamento:', error);
        throw error;
    }
};

// Função para checar se o usuário voltou do Mercado Pago com sucesso
export const checkPaymentCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const paymentId = urlParams.get('payment_id');
    const merchantOrder = urlParams.get('merchant_order_id');

    if (status === 'approved') {
        return {
            success: true,
            paymentId,
            merchantOrder
        };
    }
    
    if (status === 'failure' || status === 'null') {
        return {
            success: false,
            error: 'Pagamento não concluído ou rejeitado.'
        };
    }

    return null; // Não é um callback de pagamento
};
