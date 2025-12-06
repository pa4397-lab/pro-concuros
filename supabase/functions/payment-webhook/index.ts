// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions/deploy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'

// Declare Deno for TypeScript to recognize it in environments without Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if (topic === 'payment' && id) {
      // 1. Verificar status no Mercado Pago
      const client = new MercadoPagoConfig({ accessToken: Deno.env.get('MP_ACCESS_TOKEN') || '' });
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: id });

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference;

        if (userId) {
          // 2. Atualizar Banco de Dados Supabase
          // Necessário usar a SERVICE_ROLE_KEY para ignorar RLS e escrever na tabela profiles
          const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          )

          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_pro: true })
            .eq('id', userId)

          if (error) {
            console.error('Falha ao atualizar usuário:', error)
            return new Response(JSON.stringify({ error: 'Database update failed' }), { status: 500 })
          }

          console.log(`Usuário ${userId} atualizado para PRO com sucesso.`)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})