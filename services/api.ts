import { supabase, isSupabaseConfigured } from './supabase';
import { User, Client, Commission, AuditLog, Notice, ClientStatus, Department, CommissionStatus } from '../types';

// =============================================
// CONVERSORES: Banco → App
// =============================================

const dbToUser = (row: any): User => ({
  id: row.id,
  username: row.username,
  password: row.password,
  name: row.name,
  role: row.role,
  department: row.department,
  avatarInitials: row.avatar_initials,
});

const dbToClient = (row: any): Client => ({
  id: row.id,
  name: row.name,
  status: row.status as ClientStatus,
  responsibleDepartment: row.responsible_department as Department,
  responsibleUserId: row.responsible_user_id,
  responsibleUserName: row.responsible_user_name,
  note: row.note,
  lastContactDate: row.last_contact_date,
  birthDate: row.birth_date,
  gpsDueDate: row.gps_due_date,
  cpf: row.cpf,
  govPassword: row.gov_password,
  contractSignatureDate: row.contract_signature_date,
  phoneNumber: row.phone_number,
  expectedBirthDate: row.expected_birth_date,
  hasKidsUnder5: row.has_kids_under_5,
  workStatus: row.work_status,
  hasLawyer: row.has_lawyer,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const dbToCommission = (row: any): Commission => ({
  id: row.id,
  lawyerName: row.lawyer_name,
  lawyerId: row.lawyer_id,
  department: row.department as Department,
  clientName: row.client_name,
  caseType: row.case_type,
  caseValue: Number(row.case_value),
  commissionPercentage: Number(row.commission_percentage),
  commissionValue: Number(row.commission_value),
  status: row.status as CommissionStatus,
  date: row.date,
  contractDate: row.contract_date,
  observations: row.observations,
  observationHistory: row.observation_history ? JSON.parse(row.observation_history) : undefined,
  approvedById: row.approved_by_id,
  approvedAt: row.approved_at,
  updatedAt: row.updated_at,
  noCommission: row.no_commission,
  leadPhoneNumber: row.lead_phone_number,
  leadExpectedBirthDate: row.lead_expected_birth_date,
  leadHasKidsUnder5: row.lead_has_kids_under_5,
  leadWorkStatus: row.lead_work_status,
  leadHasLawyer: row.lead_has_lawyer,
});

const dbToAuditLog = (row: any): AuditLog => ({
  id: row.id,
  actorId: row.actor_id,
  actorName: row.actor_name,
  action: row.action,
  targetType: row.target_type,
  targetId: row.target_id,
  details: row.details,
  timestamp: row.timestamp,
});

const dbToNotice = (row: any): Notice => ({
  id: row.id,
  title: row.title,
  message: row.message,
  visibleToRoles: row.visible_to_roles,
  visibleToDepartments: row.visible_to_departments,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

// =============================================
// API DE USUÁRIOS
// =============================================

export const usersApi = {
  async getAll(): Promise<User[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) throw error;
    return (data || []).map(dbToUser);
  },

  async getByCredentials(username: string, password: string): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    if (error || !data) return null;
    return dbToUser(data);
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: user.username,
        password: user.password,
        name: user.name,
        role: user.role,
        department: user.department,
        avatar_initials: user.avatarInitials,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToUser(data);
  },

  async update(id: string, user: Partial<User>): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        username: user.username,
        password: user.password,
        name: user.name,
        role: user.role,
        department: user.department,
        avatar_initials: user.avatarInitials,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },
};

// =============================================
// API DE CLIENTES
// =============================================

export const clientsApi = {
  async getAll(): Promise<Client[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) throw error;
    return (data || []).map(dbToClient);
  },

  async create(client: Omit<Client, 'id'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        status: client.status || 'Lead',
        responsible_department: client.responsibleDepartment || 'Comercial',
        responsible_user_id: client.responsibleUserId,
        responsible_user_name: client.responsibleUserName,
        note: client.note,
        last_contact_date: client.lastContactDate,
        birth_date: client.birthDate,
        gps_due_date: client.gpsDueDate,
        cpf: client.cpf,
        gov_password: client.govPassword,
        contract_signature_date: client.contractSignatureDate,
        phone_number: client.phoneNumber,
        expected_birth_date: client.expectedBirthDate,
        has_kids_under_5: client.hasKidsUnder5,
        work_status: client.workStatus,
        has_lawyer: client.hasLawyer,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToClient(data);
  },

  async update(id: string, client: Partial<Client>): Promise<void> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (client.name !== undefined) updateData.name = client.name;
    if (client.status !== undefined) updateData.status = client.status;
    if (client.responsibleDepartment !== undefined) updateData.responsible_department = client.responsibleDepartment;
    if (client.responsibleUserId !== undefined) updateData.responsible_user_id = client.responsibleUserId;
    if (client.responsibleUserName !== undefined) updateData.responsible_user_name = client.responsibleUserName;
    if (client.note !== undefined) updateData.note = client.note;
    if (client.lastContactDate !== undefined) updateData.last_contact_date = client.lastContactDate;
    if (client.birthDate !== undefined) updateData.birth_date = client.birthDate;
    if (client.gpsDueDate !== undefined) updateData.gps_due_date = client.gpsDueDate;
    if (client.cpf !== undefined) updateData.cpf = client.cpf;
    if (client.govPassword !== undefined) updateData.gov_password = client.govPassword;
    if (client.contractSignatureDate !== undefined) updateData.contract_signature_date = client.contractSignatureDate;
    if (client.phoneNumber !== undefined) updateData.phone_number = client.phoneNumber;
    if (client.expectedBirthDate !== undefined) updateData.expected_birth_date = client.expectedBirthDate;
    if (client.hasKidsUnder5 !== undefined) updateData.has_kids_under_5 = client.hasKidsUnder5;
    if (client.workStatus !== undefined) updateData.work_status = client.workStatus;
    if (client.hasLawyer !== undefined) updateData.has_lawyer = client.hasLawyer;

    const { error } = await supabase.from('clients').update(updateData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  async findByName(name: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('name', name)
      .single();
    if (error || !data) return null;
    return dbToClient(data);
  },
};

// =============================================
// API DE COMISSÕES
// =============================================

export const commissionsApi = {
  async getAll(): Promise<Commission[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .order('contract_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(dbToCommission);
  },

  async create(commission: Omit<Commission, 'id'>): Promise<Commission> {
    const { data, error } = await supabase
      .from('commissions')
      .insert({
        lawyer_name: commission.lawyerName,
        lawyer_id: commission.lawyerId,
        department: commission.department,
        client_name: commission.clientName,
        case_type: commission.caseType,
        case_value: commission.caseValue,
        commission_percentage: commission.commissionPercentage,
        commission_value: commission.commissionValue,
        status: commission.status,
        date: commission.date,
        contract_date: commission.contractDate,
        observations: commission.observations,
        observation_history: commission.observationHistory ? JSON.stringify(commission.observationHistory) : null,
        no_commission: commission.noCommission,
        lead_phone_number: commission.leadPhoneNumber,
        lead_expected_birth_date: commission.leadExpectedBirthDate,
        lead_has_kids_under_5: commission.leadHasKidsUnder5,
        lead_work_status: commission.leadWorkStatus,
        lead_has_lawyer: commission.leadHasLawyer,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToCommission(data);
  },

  async update(id: string, commission: Partial<Commission>): Promise<void> {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (commission.clientName !== undefined) updateData.client_name = commission.clientName;
    if (commission.contractDate !== undefined) updateData.contract_date = commission.contractDate;
    if (commission.observations !== undefined) updateData.observations = commission.observations;
    if (commission.observationHistory !== undefined) updateData.observation_history = JSON.stringify(commission.observationHistory);
    if (commission.status !== undefined) updateData.status = commission.status;
    if (commission.commissionValue !== undefined) updateData.commission_value = commission.commissionValue;
    if (commission.approvedById !== undefined) updateData.approved_by_id = commission.approvedById;
    if (commission.approvedAt !== undefined) updateData.approved_at = commission.approvedAt;

    const { error } = await supabase.from('commissions').update(updateData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('commissions').delete().eq('id', id);
    if (error) throw error;
  },
};

// =============================================
// API DE AUDITORIA
// =============================================

export const auditApi = {
  async getAll(limit = 500): Promise<AuditLog[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(dbToAuditLog);
  },

  async create(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: log.actorId,
      actor_name: log.actorName,
      action: log.action,
      target_type: log.targetType,
      target_id: log.targetId,
      details: log.details,
    });
    if (error) console.error('Erro ao salvar log:', error);
  },
};

// =============================================
// API DE AVISOS
// =============================================

export const noticesApi = {
  async getAll(): Promise<Notice[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(dbToNotice);
  },

  async create(notice: Omit<Notice, 'id' | 'createdAt'>): Promise<Notice> {
    const { data, error } = await supabase
      .from('notices')
      .insert({
        title: notice.title,
        message: notice.message,
        visible_to_roles: notice.visibleToRoles,
        visible_to_departments: notice.visibleToDepartments,
        created_by: notice.createdBy,
      })
      .select()
      .single();
    if (error) throw error;
    return dbToNotice(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) throw error;
  },
};

// =============================================
// API DE CONFIGURAÇÕES
// =============================================

export const settingsApi = {
  async getMonthlyGoal(): Promise<number> {
    if (!isSupabaseConfigured()) return 0;
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'monthly_contract_goal')
      .single();
    if (error || !data) return 0;
    return Number(data.value) || 0;
  },

  async setMonthlyGoal(value: number): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'monthly_contract_goal', value: String(value), updated_at: new Date().toISOString() });
    if (error) throw error;
  },
};
