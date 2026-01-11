import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase - Substitua pelos valores do seu projeto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase não configurado. Usando localStorage como fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verificar conexão
export const isSupabaseConfigured = () => {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};
