import { Commission, CommissionStatus, Department, User, UserRole } from '../types';

export const mockCommissions: Commission[] = [
  {
    id: '1',
    lawyerName: 'Dr. Roberto Silva',
    lawyerId: '1',
    department: Department.COMMERCIAL,
    clientName: 'Construtora Horizonte',
    caseType: 'Civil - Contratual',
    caseValue: 150000,
    commissionPercentage: 10,
    commissionValue: 15000,
    status: CommissionStatus.PAID,
    date: '2026-01-05',
    contractDate: '2026-01-03',
    observations: 'Pagamento realizado via TED.'
  },
  {
    id: '2',
    lawyerName: 'Dra. Amanda Costa',
    lawyerId: '2',
    department: Department.OPERATIONS,
    clientName: 'Indústrias MetalSul',
    caseType: 'Trabalhista - Coletivo',
    caseValue: 85000,
    commissionPercentage: 8,
    commissionValue: 6800,
    status: CommissionStatus.PENDING,
    date: '2026-01-08',
    contractDate: '2026-01-06',
    observations: 'Aguardando compensação da primeira parcela.'
  },
  {
    id: '3',
    lawyerName: 'Dr. Carlos Mendez',
    lawyerId: '4',
    department: Department.CUSTOMER_SUCCESS,
    clientName: 'Família Souza',
    caseType: 'Inventário',
    caseValue: 2500000,
    commissionPercentage: 5,
    commissionValue: 125000,
    status: CommissionStatus.PENDING,
    date: '2026-01-10',
    contractDate: '2026-01-08',
  },
  {
    id: '4',
    lawyerName: 'Dra. Amanda Costa',
    lawyerId: '2',
    department: Department.OPERATIONS,
    clientName: 'Tech Startups SA',
    caseType: 'Propriedade Intelectual',
    caseValue: 45000,
    commissionPercentage: 12,
    commissionValue: 5400,
    status: CommissionStatus.PAID,
    date: '2026-01-02',
    contractDate: '2025-12-28',
    observations: 'Registro de marca internacional.'
  },
  {
    id: '5',
    lawyerName: 'Dr. Roberto Silva',
    lawyerId: '1',
    department: Department.COMMERCIAL,
    clientName: 'Banco Invest',
    caseType: 'Tributário',
    caseValue: 320000,
    commissionPercentage: 7,
    commissionValue: 22400,
    status: CommissionStatus.CANCELED,
    date: '2025-12-20',
    contractDate: '2025-12-15',
    observations: 'Cliente desistiu do processo.'
  },
];

export const monthlyData = [
  { name: 'Jan', value: 45000 },
  { name: 'Fev', value: 52000 },
  { name: 'Mar', value: 48000 },
  { name: 'Abr', value: 61000 },
  { name: 'Mai', value: 55000 },
  { name: 'Jun', value: 78000 },
];

export const initialUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: '123',
    name: 'Dr. Augusto Seabra',
    role: UserRole.ADMIN,
    department: Department.GENERAL,
    avatarInitials: 'AS'
  },
  {
    id: '2',
    username: 'gestor',
    password: '123',
    name: 'Mariana Sousa',
    role: UserRole.MANAGER,
    department: Department.CONTROLLERSHIP,
    avatarInitials: 'MS'
  },
  {
    id: '3',
    username: 'colaborador',
    password: '123',
    name: 'Pedro Santos',
    role: UserRole.COLLABORATOR,
    department: Department.COMMERCIAL,
    avatarInitials: 'PS'
  },
  {
    id: '4',
    username: 'carlos',
    password: '123',
    name: 'Dr. Carlos Mendez',
    role: UserRole.COLLABORATOR,
    department: Department.CUSTOMER_SUCCESS,
    avatarInitials: 'CM'
  }
];