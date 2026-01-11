import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Commission, User, Department, CommissionStatus, Client, AuditLog, Notice, UserRole, ClientStatus } from './types';
import { initialUsers, mockCommissions } from './services/mockData';
import { isSupabaseConfigured } from './services/supabase';
import { usersApi, clientsApi, commissionsApi, auditApi, noticesApi, settingsApi } from './services/api';

// Keys para localStorage (fallback quando Supabase não está configurado)
const USERS_KEY = 'ss_comm_users';
const COMMISSIONS_KEY = 'ss_comm_entries';
const CLIENTS_KEY = 'ss_comm_clients';
const AUDIT_KEY = 'ss_comm_audit';
const NOTICE_KEY = 'ss_comm_notices';
const GOAL_KEY = 'ss_comm_goal_contracts';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [useSupabase] = useState(() => isSupabaseConfigured());

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
  const [users, setUsers] = useState<User[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [monthlyContractGoal, setMonthlyContractGoal] = useState<number>(0);

  // Função para carregar dados do localStorage (fallback)
  const loadFromLocalStorage = useCallback(() => {
    const normalize = (list: User[]) => list.map(u => ({ ...u, department: u.department || Department.COMMERCIAL }));
    const storedUsers = localStorage.getItem(USERS_KEY);
    setUsers(storedUsers ? normalize(JSON.parse(storedUsers)) : normalize(initialUsers));

    const normalizeComm = (list: Commission[]) => list.map(c => ({ ...c, department: c.department || Department.COMMERCIAL }));
    const storedComm = localStorage.getItem(COMMISSIONS_KEY);
    const commData = storedComm ? normalizeComm(JSON.parse(storedComm)) : normalizeComm(mockCommissions);
    setCommissions(applyCommissionRules(commData));

    const storedClients = localStorage.getItem(CLIENTS_KEY);
    if (storedClients) {
      try {
        const parsed = JSON.parse(storedClients);
        if (Array.isArray(parsed) && parsed.every((v: any) => typeof v === 'string')) {
          setClients((parsed as string[]).map(name => ({ id: name, name, status: ClientStatus.LEAD })));
        } else if (Array.isArray(parsed)) {
          setClients(parsed.map((c: any) => ({
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
          })));
        }
      } catch (err) {
        console.error('Failed to parse clients storage', err);
        const buildFromCommissions = () => Array.from(new Set(mockCommissions.map(c => c.clientName))).map(name => ({ id: name, name, status: ClientStatus.LEAD as ClientStatus }));
        setClients(buildFromCommissions());
      }
    } else {
      const buildFromCommissions = () => Array.from(new Set(mockCommissions.map(c => c.clientName))).map(name => ({ id: name, name, status: ClientStatus.LEAD as ClientStatus }));
      setClients(buildFromCommissions());
    }

    const storedAudit = localStorage.getItem(AUDIT_KEY);
    if (storedAudit) {
      try {
        setAuditLogs(JSON.parse(storedAudit) as AuditLog[]);
      } catch (err) {
        console.error('Failed to parse audit storage', err);
      }
    }

    const storedNotices = localStorage.getItem(NOTICE_KEY);
    if (storedNotices) {
      try {
        setNotices(JSON.parse(storedNotices) as Notice[]);
      } catch (err) {
        console.error('Failed to parse notices storage', err);
      }
    }

    const storedGoal = localStorage.getItem(GOAL_KEY);
    if (storedGoal) {
      const num = Number(storedGoal);
      setMonthlyContractGoal(Number.isFinite(num) ? num : 0);
    }
  }, []);

  // Função para carregar dados do Supabase
  const loadFromSupabase = useCallback(async () => {
    try {
      const [usersData, commissionsData, clientsData, auditData, noticesData, goalData] = await Promise.all([
        usersApi.getAll(),
        commissionsApi.getAll(),
        clientsApi.getAll(),
        auditApi.getAll(),
        noticesApi.getAll(),
        settingsApi.getMonthlyGoal(),
      ]);

      setUsers(usersData.length > 0 ? usersData : initialUsers);
      setCommissions(applyCommissionRules(commissionsData));
      setClients(clientsData);
      setAuditLogs(auditData);
      setNotices(noticesData);
      setMonthlyContractGoal(goalData);
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error);
      // Fallback para localStorage em caso de erro
      loadFromLocalStorage();
    }
  }, [loadFromLocalStorage]);

  // Carregamento inicial
  useEffect(() => {
    const loadData = async () => {
      if (useSupabase) {
        await loadFromSupabase();
      } else {
        loadFromLocalStorage();
      }
      setLoading(false);
    };
    loadData();
  }, [useSupabase, loadFromSupabase, loadFromLocalStorage]);

  // Persist to localStorage (fallback quando Supabase não está configurado)
  useEffect(() => {
    if (!useSupabase && !loading) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }, [users, useSupabase, loading]);

  useEffect(() => {
    if (!useSupabase && !loading) {
      localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(commissions));
    }
  }, [commissions, useSupabase, loading]);

  useEffect(() => {
    if (!useSupabase && !loading) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    }
  }, [clients, useSupabase, loading]);

  useEffect(() => {
    if (!useSupabase && !loading) {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLogs));
    }
  }, [auditLogs, useSupabase, loading]);

  useEffect(() => {
    if (!useSupabase && !loading) {
      localStorage.setItem(NOTICE_KEY, JSON.stringify(notices));
    }
  }, [notices, useSupabase, loading]);

  useEffect(() => {
    if (!useSupabase && !loading) {
      localStorage.setItem(GOAL_KEY, String(monthlyContractGoal));
    }
  }, [monthlyContractGoal, useSupabase, loading]);

  const recordLog = async (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    
    setAuditLogs(prev => [newLog, ...prev].slice(0, 500));
    
    if (useSupabase) {
      try {
        await auditApi.create(entry);
      } catch (error) {
        console.error('Erro ao salvar log:', error);
      }
    }
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    await recordLog({ action: 'login', targetType: 'auth', targetId: user.id, actorId: user.id, actorName: user.name, details: 'Login no sistema' });
  };

  const handleLogout = async () => {
    if (currentUser) {
      await recordLog({ action: 'logout', targetType: 'auth', targetId: currentUser.id, actorId: currentUser.id, actorName: currentUser.name, details: 'Logout do sistema' });
    }
    setCurrentUser(null);
  };

  const handleAddCommission = async (newCommission: Commission) => {
    // Salvar comissão
    if (useSupabase) {
      try {
        const created = await commissionsApi.create(newCommission);
        setCommissions(prev => applyCommissionRules([created, ...prev]));
      } catch (error) {
        console.error('Erro ao criar comissão:', error);
        setCommissions(prev => applyCommissionRules([newCommission, ...prev]));
      }
    } else {
      setCommissions(prev => applyCommissionRules([newCommission, ...prev]));
    }

    // Atualizar ou criar cliente
    const existingClient = clients.find(c => c.name === newCommission.clientName);
    
    if (existingClient) {
      const updatedClientData: Partial<Client> = {
        status: ClientStatus.CONTRACTED,
        responsibleDepartment: Department.CONTROLLERSHIP,
        contractSignatureDate: existingClient.contractSignatureDate || newCommission.contractDate,
        phoneNumber: newCommission.leadPhoneNumber || existingClient.phoneNumber,
        expectedBirthDate: newCommission.leadExpectedBirthDate || existingClient.expectedBirthDate,
        hasKidsUnder5: newCommission.leadHasKidsUnder5 ?? existingClient.hasKidsUnder5,
        workStatus: newCommission.leadWorkStatus || existingClient.workStatus,
        hasLawyer: newCommission.leadHasLawyer ?? existingClient.hasLawyer,
        note: newCommission.observations || existingClient.note,
        updatedAt: new Date().toISOString(),
      };

      setClients(prev => prev.map(c => c.id === existingClient.id ? { ...c, ...updatedClientData } : c));

      if (useSupabase) {
        try {
          await clientsApi.update(existingClient.id, updatedClientData);
        } catch (error) {
          console.error('Erro ao atualizar cliente:', error);
        }
      }
    } else {
      const newClient: Client = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCommission.clientName,
        status: ClientStatus.CONTRACTED,
        responsibleDepartment: Department.CONTROLLERSHIP,
        responsibleUserId: newCommission.lawyerId,
        responsibleUserName: newCommission.lawyerName,
        contractSignatureDate: newCommission.contractDate,
        phoneNumber: newCommission.leadPhoneNumber,
        expectedBirthDate: newCommission.leadExpectedBirthDate,
        hasKidsUnder5: newCommission.leadHasKidsUnder5,
        workStatus: newCommission.leadWorkStatus,
        hasLawyer: newCommission.leadHasLawyer,
        note: newCommission.observations,
        createdAt: new Date().toISOString(),
      };

      if (useSupabase) {
        try {
          const created = await clientsApi.create(newClient);
          setClients(prev => {
            // Evitar duplicação: verificar se já existe pelo nome
            if (prev.some(c => c.name === created.name)) return prev;
            return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
          });
        } catch (error) {
          console.error('Erro ao criar cliente:', error);
          setClients(prev => {
            if (prev.some(c => c.name === newClient.name)) return prev;
            return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
          });
        }
      } else {
        setClients(prev => {
          if (prev.some(c => c.name === newClient.name)) return prev;
          return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    }

    if (currentUser) {
      await recordLog({
        action: 'commission_add',
        targetType: 'commission',
        targetId: newCommission.id,
        actorId: currentUser.id,
        actorName: currentUser.name,
        details: `Cliente ${newCommission.clientName} em ${newCommission.contractDate}`,
      });
    }
  };

  const handleUpdateCommission = async (updatedCommission: Commission) => {
    setCommissions(prev => applyCommissionRules(prev.map(c => c.id === updatedCommission.id ? updatedCommission : c)));
    
    if (useSupabase) {
      try {
        await commissionsApi.update(updatedCommission.id, updatedCommission);
      } catch (error) {
        console.error('Erro ao atualizar comissão:', error);
      }
    }

    // Verificar se precisa criar cliente
    const existingClient = clients.find(c => c.name === updatedCommission.clientName);
    if (!existingClient) {
      const newClient: Client = {
        id: Math.random().toString(36).substr(2, 9),
        name: updatedCommission.clientName,
        status: ClientStatus.CONTRACTED,
        responsibleDepartment: Department.CONTROLLERSHIP,
        contractSignatureDate: updatedCommission.contractDate,
        createdAt: new Date().toISOString(),
      };

      if (useSupabase) {
        try {
          const created = await clientsApi.create(newClient);
          setClients(prev => {
            if (prev.some(c => c.name === created.name)) return prev;
            return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
          });
        } catch (error) {
          console.error('Erro ao criar cliente:', error);
          setClients(prev => {
            if (prev.some(c => c.name === newClient.name)) return prev;
            return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
          });
        }
      } else {
        setClients(prev => {
          if (prev.some(c => c.name === newClient.name)) return prev;
          return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    }

    if (currentUser) {
      await recordLog({
        action: 'commission_update',
        targetType: 'commission',
        targetId: updatedCommission.id,
        actorId: currentUser.id,
        actorName: currentUser.name,
        details: `Status ${updatedCommission.status} · Cliente ${updatedCommission.clientName}`,
      });
    }
  };

  const handleAddClient = async (name: string) => {
    if (clients.some(c => c.name === name)) return;

    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      status: ClientStatus.LEAD,
      responsibleDepartment: Department.COMMERCIAL,
      responsibleUserId: currentUser?.id,
      responsibleUserName: currentUser?.name,
      createdAt: new Date().toISOString(),
    };

    if (useSupabase) {
      try {
        const created = await clientsApi.create(newClient);
        setClients(prev => {
          if (prev.some(c => c.name === created.name)) return prev;
          return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
        });
      } catch (error) {
        console.error('Erro ao criar cliente:', error);
        setClients(prev => {
          if (prev.some(c => c.name === newClient.name)) return prev;
          return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    } else {
      setClients(prev => {
        if (prev.some(c => c.name === newClient.name)) return prev;
        return [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
      });
    }

    if (currentUser) {
      await recordLog({ action: 'client_add', targetType: 'client', targetId: name, actorId: currentUser.id, actorName: currentUser.name, details: `Inclusao de lead ${name}` });
    }
  };

  const handleUpdateClientNote = async (id: string, note: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, note } : c));
    
    if (useSupabase) {
      try {
        await clientsApi.update(id, { note });
      } catch (error) {
        console.error('Erro ao atualizar nota:', error);
      }
    }

    if (currentUser) {
      await recordLog({ action: 'client_note_update', targetType: 'client', targetId: id, actorId: currentUser.id, actorName: currentUser.name, details: `Nota (${note.length} chars)` });
    }
  };

  const handleUpdateClient = async (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    
    if (useSupabase) {
      try {
        await clientsApi.update(id, data);
      } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
      }
    }

    if (currentUser) {
      await recordLog({ action: 'client_update', targetType: 'client', targetId: id, actorId: currentUser.id, actorName: currentUser.name, details: `Atualização de cliente ${data.name || ''}`.trim() });
    }
  };

  const handleDeleteCommission = async (id: string) => {
    setCommissions(prev => applyCommissionRules(prev.filter(c => c.id !== id)));
    
    if (useSupabase) {
      try {
        await commissionsApi.delete(id);
      } catch (error) {
        console.error('Erro ao deletar comissão:', error);
      }
    }

    if (currentUser) {
      await recordLog({ action: 'commission_delete', targetType: 'commission', targetId: id, actorId: currentUser.id, actorName: currentUser.name });
    }
  };

  const handleDeleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    
    if (useSupabase) {
      try {
        await clientsApi.delete(id);
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
      }
    }

    if (currentUser) {
      await recordLog({ action: 'client_delete', targetType: 'client', targetId: id, actorId: currentUser.id, actorName: currentUser.name });
    }
  };

  const handleAddNotice = async (notice: Omit<Notice, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) return;
    
    const entry: Notice = {
      ...notice,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    if (useSupabase) {
      try {
        const created = await noticesApi.create({ ...notice, createdBy: currentUser.name });
        setNotices(prev => [created, ...prev]);
      } catch (error) {
        console.error('Erro ao criar aviso:', error);
        setNotices(prev => [entry, ...prev]);
      }
    } else {
      setNotices(prev => [entry, ...prev]);
    }

    await recordLog({ action: 'notice_add', targetType: 'notice', targetId: entry.id, actorId: currentUser.id, actorName: currentUser.name, details: entry.title });
  };

  const handleDeleteNotice = async (id: string) => {
    if (!currentUser) return;
    
    setNotices(prev => prev.filter(n => n.id !== id));
    
    if (useSupabase) {
      try {
        await noticesApi.delete(id);
      } catch (error) {
        console.error('Erro ao deletar aviso:', error);
      }
    }

    await recordLog({ action: 'notice_delete', targetType: 'notice', targetId: id, actorId: currentUser.id, actorName: currentUser.name });
  };

  const handleUpdateContractGoal = async (value: number) => {
    const safe = Math.max(0, Math.floor(value));
    setMonthlyContractGoal(safe);
    
    if (useSupabase) {
      try {
        await settingsApi.setMonthlyGoal(safe);
      } catch (error) {
        console.error('Erro ao atualizar meta:', error);
      }
    }

    if (currentUser) {
      await recordLog({ action: 'goal_update', targetType: 'goal_contracts', actorId: currentUser.id, actorName: currentUser.name, details: `Meta para ${safe} contratos` });
    }
  };

  // User Management Functions
  const handleUpdateUser = async (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser, password: updatedUser.password || u.password } : u));
    
    if (useSupabase) {
      try {
        await usersApi.update(updatedUser.id, updatedUser);
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
      }
    }

    if (currentUser) {
      await recordLog({ action: 'user_update', targetType: 'user', targetId: updatedUser.id, actorId: currentUser.id, actorName: currentUser.name, details: `Perfil/Departamento de ${updatedUser.name}` });
    }
    
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedUser, password: updatedUser.password || prev.password } : null);
    }
  };

  const handleAddUser = async (newUser: User) => {
    if (useSupabase) {
      try {
        const created = await usersApi.create(newUser);
        setUsers(prev => [...prev, created]);
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        setUsers(prev => [...prev, newUser]);
      }
    } else {
      setUsers(prev => [...prev, newUser]);
    }

    if (currentUser) {
      await recordLog({ action: 'user_add', targetType: 'user', targetId: newUser.id, actorId: currentUser.id, actorName: currentUser.name, details: `Novo usuário ${newUser.name}` });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    if (useSupabase) {
      try {
        await usersApi.delete(userId);
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
      }
    }

    if (currentUser) {
      await recordLog({ action: 'user_delete', targetType: 'user', targetId: userId, actorId: currentUser.id, actorName: currentUser.name });
    }
  };

  // Tela de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

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
