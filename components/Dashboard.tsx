import React, { useState } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Users, 
  TrendingUp, 
  PieChart, 
  LogOut, 
  Search,
  Filter,
  Download,
  Settings,
  ShieldCheck,
  PlusCircle,
  FileText
} from 'lucide-react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { StatCard } from './StatCard';
import { Commission, CommissionStatus, User, UserRole, Department, Client, AuditLog, Notice } from '../types';
import { UserManagement } from './UserManagement';
import { CommissionEntry } from './CommissionEntry';
import { ClientList } from './ClientList';
import { NoticeBoard } from './NoticeBoard';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  // Props for User Management logic passed from App
  allUsers: User[];
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  // New props for Commissions
  commissions: Commission[];
  onAddCommission: (commission: Commission) => void;
  onUpdateCommission: (commission: Commission) => void;
  onDeleteCommission: (id: string) => void;
  clients: Client[];
  onAddClient: (name: string) => void;
  onUpdateClientNote: (id: string, note: string) => void;
  onUpdateClient: (id: string, data: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  auditLogs: AuditLog[];
  notices: Notice[];
  onAddNotice: (notice: Omit<Notice, 'id' | 'createdAt' | 'createdBy'>) => void;
  onDeleteNotice: (id: string) => void;
  monthlyContractGoal: number;
  onUpdateContractGoal: (value: number) => void;
}

type ViewState = 'dashboard' | 'users' | 'entry' | 'clients' | 'audit';

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onLogout,
  allUsers,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  commissions,
  onAddCommission,
  onUpdateCommission,
  onDeleteCommission,
  clients,
  onAddClient,
  onUpdateClientNote,
  onUpdateClient,
  onDeleteClient,
  auditLogs,
  notices,
  onAddNotice,
  onDeleteNotice,
  monthlyContractGoal,
  onUpdateContractGoal
}) => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [chartMonth, setChartMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const filterByScope = (list: Commission[]) => {
    const byDepartment = (commission: Commission) => {
      if (user.department === Department.GENERAL || user.role === UserRole.ADMIN) return true;
      return commission.department === user.department;
    };

    const byUserIfCollaborator = (commission: Commission) => {
      if (user.role !== UserRole.COLLABORATOR) return true;
      return commission.lawyerId === user.id || commission.lawyerName === user.name;
    };

    return list.filter(c => byDepartment(c) && byUserIfCollaborator(c));
  };

  const scopedCommissions = filterByScope(commissions);

  const getCurrentCycleWindow = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    // Ciclo: 21 do mês corrente até 20 do mês subsequente
    if (day >= 21) {
      return {
        start: new Date(year, month, 21, 0, 0, 0),
        end: new Date(year, month + 1, 20, 23, 59, 59),
      };
    }
    return {
      start: new Date(year, month - 1, 21, 0, 0, 0),
      end: new Date(year, month, 20, 23, 59, 59),
    };
  };

  const { start: cycleStart, end: cycleEnd } = getCurrentCycleWindow();
  const cycleCommissions = scopedCommissions.filter(c => {
    const d = new Date(c.contractDate);
    return d >= cycleStart && d <= cycleEnd;
  });

  const getChartWindow = () => {
    const { month, year } = chartMonth;
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end };
  };

  const { start: chartStart, end: chartEnd } = getChartWindow();
  const userNameById = new Map(allUsers.map(u => [u.id, u.name]));
  const resolveLawyerName = (commission: Commission) => {
    const fromId = commission.lawyerId ? userNameById.get(commission.lawyerId) : undefined;
    const raw = fromId || commission.lawyerName || 'Sem nome';
    const cleaned = raw.trim();
    return cleaned.length > 0 ? cleaned : 'Sem nome';
  };

  const chartDataAndParticipants = (() => {
    // Sem filtro por escopo para permitir competição aberta; somente Comercial
    const commercialInWindow = commissions.filter(c => {
      if (c.department !== Department.COMMERCIAL) return false;
      const d = new Date(c.contractDate);
      return d >= chartStart && d <= chartEnd;
    });

    const participantSet = new Set<string>();

    // Aggregate by day and participant (count de contratos fechados)
    const bucket = new Map<string, Map<string, number>>();
    commercialInWindow.forEach(c => {
      const dayKey = new Date(c.contractDate).toISOString().slice(0, 10); // YYYY-MM-DD
      const user = resolveLawyerName(c);
      participantSet.add(user);
      if (!bucket.has(dayKey)) bucket.set(dayKey, new Map());
      const inner = bucket.get(dayKey)!;
      inner.set(user, (inner.get(user) || 0) + 1);
    });

    // Build continuous daily series
    const days = [] as string[];
    const cursor = new Date(chartStart);
    while (cursor <= chartEnd) {
      const key = cursor.toISOString().slice(0, 10);
      days.push(key);
      cursor.setDate(cursor.getDate() + 1);
    }

    const participants = Array.from(participantSet);

    const data = days.map(key => {
      const [yyyy, mm, dd] = key.split('-');
      const inner = bucket.get(key) || new Map();
      const row: Record<string, any> = {
        date: key,
        label: `${dd}/${mm}`,
      };
      participants.forEach(name => {
        row[name] = inner.get(name) || 0;
      });
      return row;
    });

    return { data, participants };
  })();

  const chartData = chartDataAndParticipants.data;
  const chartParticipants = chartDataAndParticipants.participants;
  const colorPalette = ['#C5A065','#0EA5E9','#8B5CF6','#F59E0B','#10B981','#EF4444','#6366F1','#14B8A6','#EC4899'];
  const totalContractsWindow = chartData.reduce((acc, row) => acc + chartParticipants.reduce((s, name) => s + (row as any)[name], 0), 0);

  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate totals
  const totalCommission = cycleCommissions.reduce((acc, curr) => acc + curr.commissionValue, 0);
  const pendingCommission = cycleCommissions
    .filter(c => c.status === CommissionStatus.PENDING)
    .reduce((acc, curr) => acc + curr.commissionValue, 0);
  const paidCommission = cycleCommissions
    .filter(c => c.status === CommissionStatus.PAID)
    .reduce((acc, curr) => acc + curr.commissionValue, 0);
  const totalClosedContracts = cycleCommissions.filter(c => c.status !== CommissionStatus.CANCELED).length;
  const remainingToGoal = Math.max(0, monthlyContractGoal - totalClosedContracts);

  const isAdmin = user.role === UserRole.ADMIN;
  const isManager = user.role === UserRole.MANAGER;
  const canManageUsers = isAdmin; // Only admin manages users
  const isCollaborator = user.role === UserRole.COLLABORATOR;
  const canEditGoal = isAdmin || isManager;
  const [goalDraft, setGoalDraft] = useState<number>(monthlyContractGoal);

  React.useEffect(() => {
    setGoalDraft(monthlyContractGoal);
  }, [monthlyContractGoal]);

  const renderContent = () => {
    if (currentView === 'users' && canManageUsers) {
      return (
        <UserManagement 
          users={allUsers}
          onUpdateUser={onUpdateUser}
          onAddUser={onAddUser}
          onDeleteUser={onDeleteUser}
        />
      );
    }

    if (currentView === 'entry') {
      return (
        <CommissionEntry 
          user={user}
          commissions={commissions}
          onAddCommission={onAddCommission}
          onUpdateCommission={onUpdateCommission}
          onDeleteCommission={onDeleteCommission}
          clientSuggestions={clients.map(c => c.name)}
          onAddClient={onAddClient}
        />
      );
    }

    if (currentView === 'clients') {
      return <ClientList clients={clients} onUpdateClientNote={onUpdateClientNote} onUpdateClient={onUpdateClient} onDeleteClient={onDeleteClient} currentUser={user} />;
    }

    if (currentView === 'audit' && isAdmin) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-navy-900">Auditoria</h2>
              <p className="text-gray-500 text-sm">Últimas ações registradas no sistema.</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between text-sm text-gray-500">
              <span>{auditLogs.length} registros</span>
              <span>Mantemos os 500 mais recentes</span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Ação</th>
                    <th className="px-4 py-3">Alvo</th>
                    <th className="px-4 py-3">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">Nenhum registro ainda.</td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3">{log.actorName || '—'}</td>
                        <td className="px-4 py-3 font-medium text-navy-900">{log.action}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{log.targetType}{log.targetId ? ` · ${log.targetId}` : ''}</td>
                        <td className="px-4 py-3 text-gray-600">{log.details || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {!isCollaborator && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {canEditGoal && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Meta mensal (contratos):</label>
                <input
                  type="number"
                  min={0}
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(Number(e.target.value))}
                  className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-gold-500 focus:border-gold-500"
                />
                <button
                  onClick={() => onUpdateContractGoal(goalDraft)}
                  className="px-3 py-1 text-sm bg-gold-500 text-navy-900 rounded-md font-semibold hover:bg-gold-400"
                >
                  Salvar meta
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard 
            title="Comissão total à pagar" 
            value={formatCurrency(totalCommission)}
            trend="+12.5%"
            isPositive={true}
            icon={<DollarSign className="text-navy-900" size={20} />}
          />
          <StatCard 
            title="Comissões pagas" 
            value={formatCurrency(paidCommission)}
            trend="+5.2%"
            isPositive={true}
            icon={<Briefcase className="text-navy-900" size={20} />}
          />
          <StatCard 
            title="Total de Contratos Fechados" 
            value={`${totalClosedContracts}`}
            icon={<Users className="text-navy-900" size={20} />}
          />
          <StatCard 
            title="Meta Mensal - Contratos Fechados" 
            value={`${monthlyContractGoal}`}
            icon={<TrendingUp className="text-navy-900" size={20} />}
          />
          <StatCard 
            title="Falta para bater a meta" 
            value={`${remainingToGoal}`}
            icon={<PieChart className="text-navy-900" size={20} />}
            isPositive={remainingToGoal === 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-serif font-semibold text-navy-900">Comissões no Período</h2>
                <p className="text-sm text-gray-500">Visão mensal exibindo todos os dias do período selecionado.</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  <span className="font-semibold text-navy-900 mr-1">{totalContractsWindow}</span>
                  contratos no intervalo
                </div>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  <span className="font-semibold text-navy-900 mr-1">{chartParticipants.length}</span>
                  participantes
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <select
                    value={chartMonth.month}
                    onChange={(e) => setChartMonth({ ...chartMonth, month: Number(e.target.value) })}
                    className="border-gray-300 rounded-md text-gray-600 focus:ring-gold-500 focus:border-gold-500 p-2 bg-gray-50"
                  >
                    {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={chartMonth.year}
                    onChange={(e) => setChartMonth({ ...chartMonth, year: Number(e.target.value) })}
                    className="border-gray-300 rounded-md text-gray-600 focus:ring-gold-500 focus:border-gold-500 p-2 bg-gray-50"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5A065" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C5A065" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6B7280', fontSize: 12}} 
                      dy={10}
                  />
                  <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6B7280', fontSize: 12}}
                      tickFormatter={(value) => `${value}`}
                  />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number, name: string, payload) => [`${value} contratos`, `${name} · ${payload?.payload?.date || ''}`]}
                    />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ paddingBottom: 8 }}/>
                  {chartParticipants.map((name, idx) => (
                    <Line 
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={colorPalette[idx % colorPalette.length]}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions / Summary */}
          <div className="bg-navy-900 text-white p-6 rounded-lg shadow-lg flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500 rounded-full blur-[60px] opacity-20 transform translate-x-10 -translate-y-10"></div>
                
                <div>
                  <h2 className="text-xl font-serif font-semibold mb-2 text-gold-500">Resumo Executivo</h2>
                  <p className="text-navy-100 text-sm mb-6">O escritório superou a meta mensal em 15%. A área Civil foi o destaque deste mês.</p>
                  
                  <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-navy-700 pb-2">
                          <span className="text-sm text-gray-300">Meta Mensal</span>
                          <span className="font-semibold">92%</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-navy-700 pb-2">
                          <span className="text-sm text-gray-300">Novos Clientes</span>
                          <span className="font-semibold">+8</span>
                      </div>
                  </div>
                </div>
                
                {/* Only Show "Novo Lançamento" for Collaborators */}
                {isCollaborator ? (
                  <button 
                    onClick={() => setCurrentView('entry')}
                    className="mt-8 w-full py-3 bg-gold-500 text-navy-900 font-semibold rounded hover:bg-gold-400 transition-colors"
                  >
                    Novo Lançamento
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentView('entry')}
                    className="mt-8 w-full py-3 border border-gold-500 text-gold-500 font-semibold rounded hover:bg-navy-800 transition-colors"
                  >
                    Conferir Lançamentos
                  </button>
                )}
          </div>
        </div>
        {!isCollaborator && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-serif font-semibold text-navy-900">Comissões Recentes</h2>
              
              <div className="flex space-x-2">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar advogado ou cliente..." 
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gold-500 w-64"
                    />
                </div>
                <button className="flex items-center space-x-1 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                    <Filter size={16} />
                    <span>Filtrar</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                    <Download size={16} />
                    <span>Exportar</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                  <tr>
                    <th className="px-6 py-4 tracking-wider">Advogado</th>
                    <th className="px-6 py-4 tracking-wider">Cliente</th>
                    <th className="px-6 py-4 tracking-wider">Valor da Causa</th>
                    <th className="px-6 py-4 tracking-wider">Comissão</th>
                    <th className="px-6 py-4 tracking-wider">Status</th>
                    <th className="px-6 py-4 tracking-wider">Data Contrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commissions.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-navy-900">{item.lawyerName}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-navy-900 font-medium">{item.clientName}</span>
                            <span className="text-xs text-gray-400">{item.caseType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{formatCurrency(item.caseValue)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                              <span className="font-semibold text-navy-900">{formatCurrency(item.commissionValue)}</span>
                              <span className="text-xs text-gray-400">{item.commissionPercentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${item.status === CommissionStatus.PAID ? 'bg-green-100 text-green-800' : ''}
                          ${item.status === CommissionStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${item.status === CommissionStatus.CANCELED ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                          {item.contractDate ? new Date(item.contractDate).toLocaleDateString('pt-BR') : '-'}
                          {item.observations && <span title={item.observations} className="ml-2 text-navy-900 cursor-help">*</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <NoticeBoard notices={notices} currentUser={user} onAdd={onAddNotice} onDelete={onDeleteNotice} />
          </div>
          <div className="lg:col-span-1" />
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-white flex flex-col hidden md:flex shadow-xl z-20">
        <div className="p-8 border-b border-navy-800 flex justify-center">
            {/* Small version of logo for sidebar */}
            <div className="text-center">
                <div className="font-serif text-2xl font-bold tracking-tighter text-gold-500 mb-1">S&S</div>
                <div className="text-[10px] tracking-widest uppercase text-gray-400">Advogados</div>
            </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-navy-800 text-gold-500 border-l-4 border-gold-500' : 'text-gray-300 hover:bg-navy-800 hover:text-white'}`}
          >
            <PieChart size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('entry')}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${currentView === 'entry' ? 'bg-navy-800 text-gold-500 border-l-4 border-gold-500' : 'text-gray-300 hover:bg-navy-800 hover:text-white'}`}
          >
            {isCollaborator ? <PlusCircle size={20} /> : <FileText size={20} />}
            <span className="font-medium">{isCollaborator ? 'Meus Lançamentos' : 'Conferência'}</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => setCurrentView('audit')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${currentView === 'audit' ? 'bg-navy-800 text-gold-500 border-l-4 border-gold-500' : 'text-gray-300 hover:bg-navy-800 hover:text-white'}`}
            >
              <ShieldCheck size={20} />
              <span className="font-medium">Auditoria</span>
            </button>
          )}

          {/* Admin Only Menu */}
          {canManageUsers && (
             <button 
                onClick={() => setCurrentView('users')}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${currentView === 'users' ? 'bg-navy-800 text-gold-500 border-l-4 border-gold-500' : 'text-gray-300 hover:bg-navy-800 hover:text-white'}`}
             >
                <ShieldCheck size={20} />
                <span className="font-medium">Usuários</span>
             </button>
          )}

           <button 
            onClick={() => setCurrentView('clients')}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${currentView === 'clients' ? 'bg-navy-800 text-gold-500 border-l-4 border-gold-500' : 'text-gray-300 hover:bg-navy-800 hover:text-white'}`}
           >
            <Users size={20} />
            <span className="font-medium">Clientes</span>
           </button>
        </nav>

        <div className="p-4 border-t border-navy-800">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-gray-400 hover:text-white w-full px-4 py-2 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 z-10 border-b border-gray-200">
          <h1 className="text-xl font-serif text-navy-900 font-semibold">
            {currentView === 'users' ? 'Gestão de Usuários' : 
             currentView === 'entry' ? (isCollaborator ? 'Lançamento de Comissões' : 'Conferência de Comissões') :
             currentView === 'clients' ? 'Clientes' : 'Visão Geral'}
          </h1>
          
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 text-right">
                    <div className="leading-tight">Olá, {user.name.split(' ')[0]}</div>
                    <div className="text-xs text-gold-600 font-medium uppercase tracking-wider">{user.role}</div>
                </span>
             </div>
             <div className="h-8 w-8 rounded-full bg-navy-900 text-gold-500 flex items-center justify-center font-serif border-2 border-gold-500 text-sm">
                {user.avatarInitials}
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};