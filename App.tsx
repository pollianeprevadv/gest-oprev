import React, { useEffect, useState, useMemo } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Commission, User, Department, CommissionStatus, Client, AuditLog, Notice, UserRole, ClientStatus } from './types';
import { initialUsers, mockCommissions } from './services/mockData';

const USERS_KEY = 'ss_comm_users';
const COMMISSIONS_KEY = 'ss_comm_entries';
const CLIENTS_KEY = 'ss_comm_clients';
const AUDIT_KEY = 'ss_comm_audit';
const NOTICE_KEY = 'ss_comm_notices';
const GOAL_KEY = 'ss_comm_goal_contracts';

const App: React.FC = () => {
  // Commission rule: apuração diária para departamento Comercial
  const applyCommissionRules = (list: Commission[]): Commission[] => {
    // Comercial: cálculo marginal por colaborador/dia (1-5: R$10, 6-10: R$15, >10: R$20)
    const countByKey = new Map<string, number>();

    const getCommercialValue = (index: number) => {
      if (index <= 5) return 10;
      if (index <= 10) return 15;
      return 20;
    };

    return list.map(c => {
      if (c.noCommission) return { ...c, commissionValue: 0, commissionPercentage: 0 };
      if (c.status === CommissionStatus.CANCELED) return { ...c, commissionValue: 0 };

      if (c.department === Department.COMMERCIAL) {
        const key = `${c.lawyerId || c.lawyerName}|${c.contractDate}`;
        const nextIndex = (countByKey.get(key) || 0) + 1;
        countByKey.set(key, nextIndex);
        const value = getCommercialValue(nextIndex);
        return { ...c, commissionValue: value, commissionPercentage: 0 };
      }

      if (c.department === Department.CONTROLLERSHIP) {
        // Controladoria: R$10 por certidão recebida no dia
        return { ...c, commissionValue: 10, commissionPercentage: 0 };
      }

      return { ...c };
    });
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const normalize = (list: User[]) => list.map(u => ({ ...u, department: u.department || Department.COMMERCIAL }));
    if (typeof window === 'undefined') return normalize(initialUsers);
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? normalize(JSON.parse(stored)) : normalize(initialUsers);
  });
  
  // Manage commissions state here so updates persist and reflect in dashboard
  const [commissions, setCommissions] = useState<Commission[]>(() => {
    const normalize = (list: Commission[]) => list.map(c => ({ ...c, department: c.department || Department.COMMERCIAL }));
    if (typeof window === 'undefined') return normalize(mockCommissions);
    const stored = localStorage.getItem(COMMISSIONS_KEY);
    const data = stored ? normalize(JSON.parse(stored)) : normalize(mockCommissions);
    return applyCommissionRules(data);
  });

  const initialClients = useMemo((): Client[] => {
    const buildFromCommissions = () => Array.from(new Set(mockCommissions.map(c => c.clientName))).map(name => ({ id: name, name }));

    if (typeof window === 'undefined') return buildFromCommissions();

    const stored = localStorage.getItem(CLIENTS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migration: if stored as array of strings, convert
        if (Array.isArray(parsed) && parsed.every((v: any) => typeof v === 'string')) {
          return (parsed as string[]).map(name => ({ id: name, name }));
        }
        if (Array.isArray(parsed)) {
          return parsed.map((c: any) => ({
            id: c.id || c.name,
            name: c.name,
            status: c.status || ClientStatus.LEAD,
            responsibleDepartment: c.responsibleDepartment,
            responsibleUserId: c.responsibleUserId,
            responsibleUserName: c.responsibleUserName,
            note: c.note,
            lastContactDate: c.lastContactDate,
            birthDate: c.birthDate,
            gpsDueDate: c.gpsDueDate,
            cpf: c.cpf,
            govPassword: c.govPassword,
            contractSignatureDate: c.contractSignatureDate,
            phoneNumber: c.phoneNumber,
            expectedBirthDate: c.expectedBirthDate,
            hasKidsUnder5: c.hasKidsUnder5,
            workStatus: c.workStatus,
            hasLawyer: c.hasLawyer,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }));
        }
      } catch (err) {
        console.error('Failed to parse clients storage', err);
      }
    }
    return buildFromCommissions();
  }, []);

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(AUDIT_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as AuditLog[];
      } catch (err) {
        console.error('Failed to parse audit storage', err);
      }
    }
    return [];
  });
  const [notices, setNotices] = useState<Notice[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(NOTICE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as Notice[];
      } catch (err) {
        console.error('Failed to parse notices storage', err);
      }
    }
    return [];
  });
  const [monthlyContractGoal, setMonthlyContractGoal] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(GOAL_KEY);
    if (stored) {
      const num = Number(stored);
      return Number.isFinite(num) ? num : 0;
    }
    return 0;
  });

  // Persist to localStorage for simple front-end hosting (replace with API in production)
  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(commissions));
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(NOTICE_KEY, JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, String(monthlyContractGoal));
  }, [monthlyContractGoal]);

  const recordLog = (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    setAuditLogs(prev => [
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...prev,
    ].slice(0, 500));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    recordLog({ action: 'login', targetType: 'auth', targetId: user.id, actorId: user.id, actorName: user.name, details: 'Login no sistema' });
  };

  const handleLogout = () => {
    if (currentUser) {
      recordLog({ action: 'logout', targetType: 'auth', targetId: currentUser.id, actorId: currentUser.id, actorName: currentUser.name, details: 'Logout do sistema' });
    }
    setCurrentUser(null);
  };

  const handleAddCommission = (newCommission: Commission) => {
    setCommissions(prev => applyCommissionRules([newCommission, ...prev]));
    setClients(prev => {
      const existing = prev.find(c => c.name === newCommission.clientName);
      if (existing) {
        // Se já existe, atualiza para CONTRATADO, move para Controladoria e atualiza dados do lead
        return prev.map(c => c.id === existing.id ? {
          ...c,
          status: ClientStatus.CONTRACTED,
          responsibleDepartment: Department.CONTROLLERSHIP,
          contractSignatureDate: c.contractSignatureDate || newCommission.contractDate,
          // Atualiza dados do lead se fornecidos
          phoneNumber: newCommission.leadPhoneNumber || c.phoneNumber,
          expectedBirthDate: newCommission.leadExpectedBirthDate || c.expectedBirthDate,
          hasKidsUnder5: newCommission.leadHasKidsUnder5 ?? c.hasKidsUnder5,
          workStatus: newCommission.leadWorkStatus || c.workStatus,
          hasLawyer: newCommission.leadHasLawyer ?? c.hasLawyer,
          note: newCommission.observations || c.note,
          updatedAt: new Date().toISOString(),
        } : c);
      }
      // Novo cliente já entra como CONTRATADO (veio do comercial com contrato fechado)
      const newClient: Client = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCommission.clientName,
        status: ClientStatus.CONTRACTED,
        responsibleDepartment: Department.CONTROLLERSHIP,
        responsibleUserId: newCommission.lawyerId,
        responsibleUserName: newCommission.lawyerName,
        contractSignatureDate: newCommission.contractDate,
        // Dados do Lead coletados pelo comercial
        phoneNumber: newCommission.leadPhoneNumber,
        expectedBirthDate: newCommission.leadExpectedBirthDate,
        hasKidsUnder5: newCommission.leadHasKidsUnder5,
        workStatus: newCommission.leadWorkStatus,
        hasLawyer: newCommission.leadHasLawyer,
        note: newCommission.observations,
        createdAt: new Date().toISOString(),
      };
      return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
    });
    if (currentUser) {
      recordLog({
        action: 'commission_add',
        targetType: 'commission',
        targetId: newCommission.id,
        actorId: currentUser.id,
        actorName: currentUser.name,
        details: `Cliente ${newCommission.clientName} em ${newCommission.contractDate}`,
      });
    }
  };

  const handleUpdateCommission = (updatedCommission: Commission) => {
    setCommissions(prev => applyCommissionRules(prev.map(c => c.id === updatedCommission.id ? updatedCommission : c)));
    setClients(prev => {
      const existing = prev.find(c => c.name === updatedCommission.clientName);
      if (existing) return prev;
      const newClient: Client = {
        id: Math.random().toString(36).substr(2, 9),
        name: updatedCommission.clientName,
        status: ClientStatus.CONTRACTED,
        responsibleDepartment: Department.CONTROLLERSHIP,
        contractSignatureDate: updatedCommission.contractDate,
        createdAt: new Date().toISOString(),
      };
      return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
    });
    if (currentUser) {
      recordLog({
        action: 'commission_update',
        targetType: 'commission',
        targetId: updatedCommission.id,
        actorId: currentUser.id,
        actorName: currentUser.name,
        details: `Status ${updatedCommission.status} · Cliente ${updatedCommission.clientName}`,
      });
    }
  };

  const handleAddClient = (name: string) => {
    let added = false;
    setClients(prev => {
      if (prev.some(c => c.name === name)) return prev;
      added = true;
      const newClient: Client = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        status: ClientStatus.LEAD,
        responsibleDepartment: Department.COMMERCIAL,
        responsibleUserId: currentUser?.id,
        responsibleUserName: currentUser?.name,
        createdAt: new Date().toISOString(),
      };
      return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
    });
    if (added && currentUser) {
      recordLog({ action: 'client_add', targetType: 'client', targetId: name, actorId: currentUser.id, actorName: currentUser.name, details: `Inclusao de lead ${name}` });
    }
  };

  const handleUpdateClientNote = (id: string, note: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, note } : c));
    if (currentUser) {
      recordLog({ action: 'client_note_update', targetType: 'client', targetId: id, actorId: currentUser.id, actorName: currentUser.name, details: `Nota (${note.length} chars)` });
    }
  };

  const handleUpdateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    if (currentUser) {
      recordLog({ action: 'client_update', targetType: 'client', targetId: id, actorId: currentUser.id, actorName: currentUser.name, details: `Atualização de cliente ${data.name || ''}`.trim() });
    }
  };

  const handleDeleteCommission = (id: string) => {
    setCommissions(prev => applyCommissionRules(prev.filter(c => c.id !== id)));
    if (currentUser) {
      recordLog({ action: 'commission_delete', targetType: 'commission', targetId: id, actorId: currentUser.id, actorName: currentUser.name });
    }
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (currentUser) {
      recordLog({ action: 'client_delete', targetType: 'client', targetId: id, actorId: currentUser.id, actorName: currentUser.name });
    }
  };

  const handleAddNotice = (notice: Omit<Notice, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) return;
    const entry: Notice = {
      ...notice,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };
    setNotices(prev => [entry, ...prev]);
    recordLog({ action: 'notice_add', targetType: 'notice', targetId: entry.id, actorId: currentUser.id, actorName: currentUser.name, details: entry.title });
  };

  const handleDeleteNotice = (id: string) => {
    if (!currentUser) return;
    setNotices(prev => prev.filter(n => n.id !== id));
    recordLog({ action: 'notice_delete', targetType: 'notice', targetId: id, actorId: currentUser.id, actorName: currentUser.name });
  };

  const handleUpdateContractGoal = (value: number) => {
    const safe = Math.max(0, Math.floor(value));
    setMonthlyContractGoal(safe);
    if (currentUser) {
      recordLog({ action: 'goal_update', targetType: 'goal_contracts', actorId: currentUser.id, actorName: currentUser.name, details: `Meta para ${safe} contratos` });
    }
  };

  // User Management Functions
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser, password: updatedUser.password || u.password } : u));
    if (currentUser) {
      recordLog({ action: 'user_update', targetType: 'user', targetId: updatedUser.id, actorId: currentUser.id, actorName: currentUser.name, details: `Perfil/Departamento de ${updatedUser.name}` });
    }
    
    if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(prev => prev ? { ...prev, ...updatedUser, password: updatedUser.password || prev.password } : null);
    }
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    if (currentUser) {
      recordLog({ action: 'user_add', targetType: 'user', targetId: newUser.id, actorId: currentUser.id, actorName: currentUser.name, details: `Novo usuário ${newUser.name}` });
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser) {
      recordLog({ action: 'user_delete', targetType: 'user', targetId: userId, actorId: currentUser.id, actorName: currentUser.name });
    }
  };

  return (
    <>
      {currentUser ? (
        <Dashboard 
            user={currentUser} 
            onLogout={handleLogout}
            allUsers={users}
            onUpdateUser={handleUpdateUser}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            commissions={commissions}
            onAddCommission={handleAddCommission}
            onUpdateCommission={handleUpdateCommission}
            onDeleteCommission={handleDeleteCommission}
          clients={clients}
          onAddClient={handleAddClient}
            onUpdateClientNote={handleUpdateClientNote}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            notices={notices}
            onAddNotice={handleAddNotice}
            onDeleteNotice={handleDeleteNotice}
            auditLogs={auditLogs}
            monthlyContractGoal={monthlyContractGoal}
            onUpdateContractGoal={handleUpdateContractGoal}
        />
      ) : (
        <Login onLogin={handleLogin} users={users} />
      )}
    </>
  );
};

export default App;