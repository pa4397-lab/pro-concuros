// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions/deploy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Preference } from 'npm:mercadopago'

// Declare Deno for TypeScript to recognize it in environments without Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { planType, userId, email, origin } = await req.json()
    
    // ATENÇÃO: Configure o MP_ACCESS_TOKEN nos secrets do seu projeto Supabase
    // Comando: supabase secrets set MP_ACCESS_TOKEN=seu_token
    const client = new MercadoPagoConfig({ accessToken: Deno.env.get('MP_ACCESS_TOKEN') || '' });
    const preference = new Preference(client);

    const price = planType === 'annual' ? 298.80 : 29.90;
    const title = planType === 'annual' ? 'PRO CONCURSOS - Plano Anual' : 'PRO CONCURSOS - Plano Mensal';

    const body = {
      items: [
        {
          id: planType,
          title: title,
          quantity: 1,
          unit_price: price,
          currency_id: 'BRL',
          description: `Assinatura ${planType} do PRO CONCURSOS`
        }
      ],
      payer: {
        email: email
      },
      back_urls: {
        success: `${origin}/?status=approved`,
        failure: `${origin}/?status=failure`,
        pending: `${origin}/?status=pending`
      },
      auto_return: 'approved',
      external_reference: userId, // Importante: Enviamos o ID do usuário para identificar no webhook
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook` // URL do Webhook
    };

    const result = await preference.create({ body });

    return new Response(
      JSON.stringify({ init_point: result.init_point, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})