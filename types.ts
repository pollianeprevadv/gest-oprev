export enum CommissionStatus {
  PENDING = 'Pendente',
  PAID = 'Pago',
  CANCELED = 'Cancelado',
}

export enum UserRole {
  ADMIN = 'Administrador',
  MANAGER = 'Gestor',
  COLLABORATOR = 'Colaborador',
}

export enum Department {
  COMMERCIAL = 'Comercial',
  CONTROLLERSHIP = 'Controladoria',
  OPERATIONS = 'Operacional',
  MAINTENANCE = 'Manutenção',
  CUSTOMER_SUCCESS = 'Sucesso do Cliente',
  FINANCE = 'Financeiro',
  GENERAL = 'Geral',
}

export enum ClientStatus {
  LEAD = 'Lead',
  CONTRACTED = 'Contratado',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado',
}

export interface Commission {
  id: string;
  lawyerName: string;
  lawyerId?: string;
  department: Department;
  clientName: string;
  caseType: string;
  caseValue: number;
  commissionPercentage: number;
  commissionValue: number;
  status: CommissionStatus;
  date: string;         // Data do registro no sistema
  contractDate: string; // Data da assinatura do contrato
  observations?: string;
  approvedById?: string;
  approvedAt?: string;
  updatedAt?: string;
  noCommission?: boolean; // Flag: lançamento sem comissão (ex: gestor lançando para a casa)
  // Dados do Lead coletados pelo comercial
  leadPhoneNumber?: string;
  leadExpectedBirthDate?: string;
  leadHasKidsUnder5?: boolean;
  leadWorkStatus?: string;
  leadHasLawyer?: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string; // Opcional na interface de exibição, obrigatório no backend real
  role: UserRole;
  department: Department;
  name: string;
  avatarInitials: string;
}

export interface DashboardStats {
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  totalDeals: number;
}

export interface Client {
  id: string;
  name: string;
  status?: ClientStatus; // Estágio no fluxo: Lead → Contratado → Em Andamento → Concluído
  responsibleDepartment?: Department; // Departamento atual responsável
  responsibleUserId?: string; // Colaborador responsável
  responsibleUserName?: string;
  note?: string;
  lastContactDate?: string;
  birthDate?: string;
  gpsDueDate?: string;
  cpf?: string;
  govPassword?: string;
  contractSignatureDate?: string;
  phoneNumber?: string;
  expectedBirthDate?: string;
  hasKidsUnder5?: boolean;
  workStatus?: string;
  hasLawyer?: boolean;
  createdAt?: string; // Data de cadastro
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  timestamp: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  visibleToRoles: UserRole[];
  visibleToDepartments?: Department[];
  createdBy?: string;
  createdAt: string;
}