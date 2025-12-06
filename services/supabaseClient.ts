
import { createClient } from '@supabase/supabase-js';

// Extraído da sua string de conexão: egibvxyvxddwwsijptry
const PROJECT_URL = 'https://egibvxyvxddwwsijptry.supabase.co';

// Chave fornecida pelo usuário
const PROJECT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaWJ2eHl2eGRkd3dzaWpwdHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODY0NzcsImV4cCI6MjA3OTc2MjQ3N30.F8gWdmbDivjcwmOnQ2V_y6gbscVoRPrIO-jry4LFbgI';

// Tenta pegar das variáveis de ambiente (Netlify/Vercel/Local), senão usa a URL direta do seu projeto.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || PROJECT_URL;

// A CHAVE ANON É OBRIGATÓRIA.
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || PROJECT_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('ERRO CRÍTICO: VITE_SUPABASE_ANON_KEY não encontrada. O login não funcionará.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
