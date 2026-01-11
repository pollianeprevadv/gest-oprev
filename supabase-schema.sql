-- =============================================
-- SCRIPT SQL PARA CRIAR TABELAS NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Administrador', 'Gestor', 'Colaborador')),
  department TEXT NOT NULL CHECK (department IN ('Comercial', 'Controladoria', 'Operacional', 'Manutenção', 'Sucesso do Cliente', 'Financeiro', 'Geral')),
  avatar_initials TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Lead' CHECK (status IN ('Lead', 'Contratado', 'Em Andamento', 'Concluído', 'Cancelado')),
  responsible_department TEXT DEFAULT 'Comercial',
  responsible_user_id UUID REFERENCES users(id),
  responsible_user_name TEXT,
  note TEXT,
  last_contact_date DATE,
  birth_date DATE,
  gps_due_date DATE,
  cpf TEXT,
  gov_password TEXT,
  contract_signature_date DATE,
  phone_number TEXT,
  expected_birth_date DATE,
  has_kids_under_5 BOOLEAN,
  work_status TEXT,
  has_lawyer BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Comissões
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_name TEXT NOT NULL,
  lawyer_id UUID REFERENCES users(id),
  department TEXT NOT NULL,
  client_name TEXT NOT NULL,
  case_type TEXT DEFAULT '-',
  case_value DECIMAL(15,2) DEFAULT 0,
  commission_percentage DECIMAL(5,2) DEFAULT 0,
  commission_value DECIMAL(15,2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Pendente', 'Pago', 'Cancelado')),
  date TIMESTAMPTZ DEFAULT NOW(),
  contract_date DATE NOT NULL,
  observations TEXT,
  approved_by_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  no_commission BOOLEAN DEFAULT FALSE,
  -- Dados do Lead
  lead_phone_number TEXT,
  lead_expected_birth_date DATE,
  lead_has_kids_under_5 BOOLEAN,
  lead_work_status TEXT,
  lead_has_lawyer BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  actor_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Avisos
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  visible_to_roles TEXT[] NOT NULL,
  visible_to_departments TEXT[],
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INSERIR USUÁRIOS INICIAIS
-- =============================================

INSERT INTO users (id, username, password, name, role, department, avatar_initials) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', '123', 'Dr. Augusto Seabra', 'Administrador', 'Geral', 'AS'),
  ('00000000-0000-0000-0000-000000000002', 'gestor', '123', 'Mariana Sousa', 'Gestor', 'Controladoria', 'MS'),
  ('00000000-0000-0000-0000-000000000003', 'colaborador', '123', 'Pedro Santos', 'Colaborador', 'Comercial', 'PS'),
  ('00000000-0000-0000-0000-000000000004', 'carlos', '123', 'Dr. Carlos Mendez', 'Colaborador', 'Sucesso do Cliente', 'CM')
ON CONFLICT (id) DO NOTHING;

-- Inserir meta inicial
INSERT INTO settings (key, value) VALUES ('monthly_contract_goal', '0')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (para simplificar - em produção, usar auth do Supabase)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for commissions" ON commissions FOR ALL USING (true);
CREATE POLICY "Allow all for audit_logs" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all for notices" ON notices FOR ALL USING (true);
CREATE POLICY "Allow all for settings" ON settings FOR ALL USING (true);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_department ON clients(responsible_department);
CREATE INDEX IF NOT EXISTS idx_commissions_date ON commissions(contract_date);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_department ON commissions(department);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
