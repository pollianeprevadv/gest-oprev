import React, { useState } from 'react';
import { User, Commission, CommissionStatus, UserRole, Department, ObservationEntry } from '../types';
import { Save, FileText, Calendar, User as UserIcon, Plus, ArrowLeft, Search, CalendarDays, Edit2, Shield, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface CommissionEntryProps {
    user: User;
    commissions: Commission[];
    onAddCommission: (commission: Commission) => void;
    onUpdateCommission: (commission: Commission) => void;
    clientSuggestions: string[];
    onAddClient: (name: string) => void;
    onDeleteCommission: (id: string) => void;
}

export const CommissionEntry: React.FC<CommissionEntryProps> = ({ user, commissions, onAddCommission, onUpdateCommission, clientSuggestions, onAddClient, onDeleteCommission }) => {
    const currentDate = new Date();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedDay, setSelectedDay] = useState(0); // 0 = todos os dias do mês
  const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<Department>(user.department);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        clientName: '',
        contractDate: '',
        newObservation: '', // Nova observação a ser adicionada
        status: CommissionStatus.PENDING as CommissionStatus,
        // Dados do Lead
        leadPhoneNumber: '',
        leadExpectedBirthDate: '',
        leadHasKidsUnder5: '' as '' | 'sim' | 'nao',
        leadWorkStatus: '',
        leadHasLawyer: '' as '' | 'sim' | 'nao',
    });

  // Estado para controlar observações expandidas na listagem
  const [expandedObservations, setExpandedObservations] = useState<string | null>(null);
  
  const [successMessage, setSuccessMessage] = useState('');

    // PERMISSIONS CHECK
        const isCollaborator = user.role === UserRole.COLLABORATOR;
        const isManager = user.role === UserRole.MANAGER;
        const isManagerOrAdmin = isManager || user.role === UserRole.ADMIN;
        const isGeneral = user.department === Department.GENERAL;
        const canCreate = isCollaborator || isManager; // Gestor também pode lançar

  // 1. Filtrar comissões
  // Se for Colaborador: vê apenas as suas
  // Se for Gestor/Admin: vê TODAS (incluindo de outros departamentos)
    const visibleCommissions = (() => {
        if (isCollaborator) {
            return commissions.filter(c => (c.lawyerId ? c.lawyerId === user.id : c.lawyerName === user.name));
        }
        // Gestor e Admin veem todas as comissões de todos os departamentos
        if (isManagerOrAdmin || isGeneral) return commissions;
        return commissions;
    })();

  // 2. Aplicar filtros de Mês, Ano e Busca
  const filteredCommissions = visibleCommissions.filter(item => {
    const itemDate = new Date(item.contractDate);
    
    // Verifica Mês e Ano (considerando timezone local para evitar erros de dia)
    const matchesMonth = itemDate.getMonth() === selectedMonth;
    const matchesYear = itemDate.getFullYear() === selectedYear;
        const matchesDay = selectedDay === 0 ? true : itemDate.getDate() === selectedDay;
    
    // Verifica busca por nome do cliente ou advogado
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        item.clientName.toLowerCase().includes(searchLower) ||
        item.lawyerName.toLowerCase().includes(searchLower);

        return matchesMonth && matchesYear && matchesDay && matchesSearch;
  });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

    const showLawyerColumn = !isCollaborator;
        const totalColumns = 4 + (showLawyerColumn ? 1 : 0) + ((isManagerOrAdmin || isCollaborator) ? 1 : 0);

    const editingCommission = editingId ? commissions.find(c => c.id === editingId) : undefined;
    const statusLockedForNonAdmin = editingCommission?.status === CommissionStatus.PAID && user.role !== UserRole.ADMIN;

    const days = [0, ...Array.from({ length: 31 }, (_, i) => i + 1)];

  // Gera lista dos últimos 5 anos
  const years = Array.from({length: 5}, (_, i) => currentDate.getFullYear() - i);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

    const canEditCommission = (commission: Commission) => {
        const isOwn = commission.lawyerId ? commission.lawyerId === user.id : commission.lawyerName === user.name;
        const isSameDay = new Date(commission.contractDate).toDateString() === new Date().toDateString();
        if (isManagerOrAdmin) return true;
        return isCollaborator && isOwn && isSameDay;
    };

    const handleEditClick = (commission: Commission) => {
    if (!canEditCommission(commission)) return;
    setFormData({
        clientName: commission.clientName,
        contractDate: commission.contractDate,
        newObservation: '', // Campo limpo para nova observação
        status: commission.status,
        leadPhoneNumber: commission.leadPhoneNumber || '',
        leadExpectedBirthDate: commission.leadExpectedBirthDate || '',
        leadHasKidsUnder5: commission.leadHasKidsUnder5 === undefined ? '' : commission.leadHasKidsUnder5 ? 'sim' : 'nao',
        leadWorkStatus: commission.leadWorkStatus || '',
        leadHasLawyer: commission.leadHasLawyer === undefined ? '' : commission.leadHasLawyer ? 'sim' : 'nao',
    });
    setEditingId(commission.id);
    setIsFormOpen(true);
  };

  const handleNewClick = () => {
    setFormData({
        clientName: '',
        contractDate: '',
        newObservation: '',
        status: CommissionStatus.PENDING,
        leadPhoneNumber: '',
        leadExpectedBirthDate: '',
        leadHasKidsUnder5: '',
        leadWorkStatus: '',
        leadHasLawyer: '',
    });
    setEditingId(null);
    setIsFormOpen(true);
        setSelectedDepartment(user.department);
  };

  // Função auxiliar para formatar observações do histórico
  const formatObservationHistory = (commission: Commission): string => {
    const history = commission.observationHistory || [];
    if (history.length === 0 && commission.observations) {
      return commission.observations; // Compatibilidade com dados antigos
    }
    if (history.length === 0) return '-';
    return history.map(obs => `[${obs.department}] ${obs.text}`).join(' | ');
  };

  // Função para obter o número de observações
  const getObservationCount = (commission: Commission): number => {
    const history = commission.observationHistory || [];
    if (history.length === 0 && commission.observations) return 1;
    return history.length;
  };

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const originalCommission = editingId ? commissions.find(c => c.id === editingId) : undefined;
    const canEditExisting = originalCommission ? canEditCommission(originalCommission) : false;

    // Criar nova entrada de observação se houver texto
    const createObservationEntry = (): ObservationEntry | null => {
      if (!formData.newObservation.trim()) return null;
      return {
        id: Math.random().toString(36).substr(2, 9),
        text: formData.newObservation.trim(),
        authorId: user.id,
        authorName: user.name,
        department: user.department,
        createdAt: new Date().toISOString(),
      };
    };

    if (editingId && canEditExisting) {
        // UPDATE EXISTING
        if (originalCommission) {
            const nextStatus = (() => {
                if (originalCommission.status === CommissionStatus.PAID && user.role !== UserRole.ADMIN) return originalCommission.status;
                if (!isManagerOrAdmin) return originalCommission.status;
                return formData.status;
            })();

            // Preparar histórico de observações
            let observationHistory = [...(originalCommission.observationHistory || [])];
            
            // Migrar observação legada para o histórico se necessário
            if (originalCommission.observations && observationHistory.length === 0) {
              observationHistory.push({
                id: 'legacy',
                text: originalCommission.observations,
                authorId: originalCommission.lawyerId || '',
                authorName: originalCommission.lawyerName,
                department: originalCommission.department,
                createdAt: originalCommission.date,
              });
            }

            // Adicionar nova observação ao histórico
            const newObsEntry = createObservationEntry();
            if (newObsEntry) {
              observationHistory.push(newObsEntry);
            }

            const updatedCommission: Commission = {
                ...originalCommission,
                clientName: formData.clientName,
                contractDate: formData.contractDate,
                observationHistory: observationHistory,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
                leadPhoneNumber: formData.leadPhoneNumber || originalCommission.leadPhoneNumber,
                leadExpectedBirthDate: formData.leadExpectedBirthDate || originalCommission.leadExpectedBirthDate,
                leadHasKidsUnder5: formData.leadHasKidsUnder5 === '' ? originalCommission.leadHasKidsUnder5 : formData.leadHasKidsUnder5 === 'sim',
                leadWorkStatus: formData.leadWorkStatus || originalCommission.leadWorkStatus,
                leadHasLawyer: formData.leadHasLawyer === '' ? originalCommission.leadHasLawyer : formData.leadHasLawyer === 'sim',
                // Keep existing financial fields untouched
            };
            onUpdateCommission(updatedCommission);
            onAddClient(formData.clientName);
            setSuccessMessage('Lançamento atualizado com sucesso!');
        }
    } else if (canCreate) {
        // CREATE NEW
        const newObsEntry = createObservationEntry();
        const initialHistory: ObservationEntry[] = newObsEntry ? [newObsEntry] : [];

        const newCommission: Commission = {
            id: Math.random().toString(36).substr(2, 9),
            lawyerName: user.name,
            lawyerId: user.id,
            department: selectedDepartment,
            clientName: formData.clientName,
            caseType: '-',
            caseValue: 0,
            commissionPercentage: 0,
            commissionValue: 0,
            status: CommissionStatus.PENDING, 
            date: new Date().toISOString(),
            contractDate: formData.contractDate,
            observationHistory: initialHistory,
            noCommission: isManager,
            leadPhoneNumber: formData.leadPhoneNumber,
            leadExpectedBirthDate: formData.leadExpectedBirthDate,
            leadHasKidsUnder5: formData.leadHasKidsUnder5 === '' ? undefined : formData.leadHasKidsUnder5 === 'sim',
            leadWorkStatus: formData.leadWorkStatus,
            leadHasLawyer: formData.leadHasLawyer === '' ? undefined : formData.leadHasLawyer === 'sim',
        };
        onAddCommission(newCommission);
        onAddClient(formData.clientName);
        setSuccessMessage('Lançamento realizado com sucesso! Aguardando análise do financeiro.');
    }
    
    // Reset form and show success
    setTimeout(() => {
        setSuccessMessage('');
        setIsFormOpen(false); 
        // Opcional: Ajustar o filtro
        if (formData.contractDate) {
            const newDate = new Date(formData.contractDate);
            setSelectedMonth(newDate.getMonth());
            setSelectedYear(newDate.getFullYear());
        }
        // Reset form data
        setFormData({
            clientName: '',
            contractDate: '',
            newObservation: '',
            status: CommissionStatus.PENDING,
            leadPhoneNumber: '',
            leadExpectedBirthDate: '',
            leadHasKidsUnder5: '',
            leadWorkStatus: '',
            leadHasLawyer: '',
        });
        setEditingId(null);
    }, 1500);
  };


  if (!isFormOpen) {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-navy-900">
                    {canCreate ? 'Meus Lançamentos' : 'Conferência de Comissões'}
                </h2>
                <p className="text-gray-500 text-xs md:text-sm">
                    {canCreate 
                        ? 'Gerencie suas comissões por competência.' 
                        : 'Acompanhe e valide os lançamentos.'}
                </p>
                </div>
                
                {/* Only Show "Novo Lançamento" if user is Collaborator */}
                {canCreate && (
                    <button 
                    onClick={handleNewClick}
                    className="flex items-center justify-center space-x-2 bg-gold-500 text-navy-900 px-4 py-2.5 rounded-lg hover:bg-gold-400 transition-colors shadow-md font-medium text-sm w-full sm:w-auto"
                    >
                    <Plus size={18} />
                    <span>Novo Lançamento</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Barra de Filtros */}
                <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3">
                    
                    {/* Seletores de Data */}
                    <div className="flex flex-wrap items-center gap-2 w-full">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 md:px-3 py-1.5 md:py-2 shadow-sm">
                            <CalendarDays size={16} className="text-navy-900 mr-1 md:mr-2 hidden sm:block" />
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent border-none text-xs md:text-sm text-gray-700 font-medium focus:ring-0 cursor-pointer pr-6 md:pr-8"
                            >
                                {months.map((m, index) => (
                                    <option key={index} value={index}>{m.substring(0, 3)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 md:px-3 py-1.5 md:py-2 shadow-sm">
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent border-none text-xs md:text-sm text-gray-700 font-medium focus:ring-0 cursor-pointer"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 md:px-3 py-1.5 md:py-2 shadow-sm">
                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(Number(e.target.value))}
                                className="bg-transparent border-none text-xs md:text-sm text-gray-700 font-medium focus:ring-0 cursor-pointer"
                            >
                                {days.map(day => (
                                    <option key={day} value={day}>{day === 0 ? 'Todos' : `Dia ${day}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Busca */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={canCreate ? "Buscar..." : "Buscar cliente ou advogado..."}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 w-full bg-white shadow-sm"
                        />
                    </div>
                </div>

                {/* Tabela - Versão Desktop */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                        <tr>
                        <th className="px-6 py-4 tracking-wider">Data</th>
                        {/* Show Lawyer Name Column if not collaborator */}
                        {showLawyerColumn && <th className="px-6 py-4 tracking-wider">Advogado</th>}
                        <th className="px-6 py-4 tracking-wider">Cliente</th>
                        <th className="px-6 py-4 tracking-wider">Status</th>
                        <th className="px-6 py-4 tracking-wider">Observações</th>
                        {(isManagerOrAdmin || isCollaborator) && <th className="px-6 py-4 tracking-wider text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredCommissions.length > 0 ? (
                            filteredCommissions.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-navy-900 font-medium">
                                    {new Date(item.contractDate).toLocaleDateString('pt-BR')}
                                </td>
                                {showLawyerColumn && (
                                    <td className="px-6 py-4 text-navy-900">
                                        {item.lawyerName}
                                    </td>
                                )}
                                <td className="px-6 py-4 font-medium">{item.clientName}</td>
                                <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${item.status === CommissionStatus.PAID ? 'bg-green-100 text-green-800' : ''}
                                    ${item.status === CommissionStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : ''}
                                    ${item.status === CommissionStatus.CANCELED ? 'bg-red-100 text-red-800' : ''}
                                `}>
                                    {item.status}
                                </span>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                    {getObservationCount(item) > 0 ? (
                                      <button
                                        onClick={() => setExpandedObservations(expandedObservations === item.id ? null : item.id)}
                                        className="flex items-center gap-1 text-navy-900 hover:text-gold-600 text-xs"
                                      >
                                        <MessageSquare size={14} />
                                        <span>{getObservationCount(item)} obs.</span>
                                        {expandedObservations === item.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                      </button>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                    {expandedObservations === item.id && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs space-y-2 max-h-40 overflow-y-auto">
                                        {(item.observationHistory && item.observationHistory.length > 0) ? (
                                          item.observationHistory.map((obs, idx) => (
                                            <div key={obs.id || idx} className="border-l-2 border-gold-500 pl-2">
                                              <div className="flex items-center gap-2 text-gray-500">
                                                <span className="font-medium text-navy-900">{obs.authorName}</span>
                                                <span className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">{obs.department}</span>
                                                <span>{new Date(obs.createdAt).toLocaleDateString('pt-BR')}</span>
                                              </div>
                                              <p className="text-gray-700 mt-0.5">{obs.text}</p>
                                            </div>
                                          ))
                                        ) : item.observations ? (
                                          <div className="border-l-2 border-gray-300 pl-2">
                                            <div className="text-gray-500 text-[10px]">(Observação legada)</div>
                                            <p className="text-gray-700">{item.observations}</p>
                                          </div>
                                        ) : null}
                                      </div>
                                    )}
                                </td>
                                {(isManagerOrAdmin || isCollaborator) && (
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {canEditCommission(item) && (
                                            <button 
                                                onClick={() => handleEditClick(item)}
                                                className="text-navy-900 hover:text-gold-600 transition-colors p-1"
                                                title="Editar Lançamento"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                        {isManagerOrAdmin && (
                                            <button
                                                onClick={() => {
                                                    if (confirm('Deseja remover este lançamento?')) {
                                                        onDeleteCommission(item.id);
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-700 transition-colors p-1"
                                                title="Excluir Lançamento"
                                            >
                                                <Shield size={16} />
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={totalColumns} className="px-6 py-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <FileText className="h-10 w-10 text-gray-300 mb-2" />
                                        <p>Nenhum lançamento encontrado em {months[selectedMonth]} de {selectedYear}.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>

                {/* Lista de Cards - Versão Mobile */}
                <div className="md:hidden">
                    {filteredCommissions.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {filteredCommissions.map((item) => (
                                <div key={item.id} className="p-4 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-navy-900">{item.clientName}</div>
                                            {showLawyerColumn && (
                                                <div className="text-xs text-gray-500">{item.lawyerName}</div>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                            ${item.status === CommissionStatus.PAID ? 'bg-green-100 text-green-800' : ''}
                                            ${item.status === CommissionStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${item.status === CommissionStatus.CANCELED ? 'bg-red-100 text-red-800' : ''}
                                        `}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{new Date(item.contractDate).toLocaleDateString('pt-BR')}</span>
                                        {(isManagerOrAdmin || isCollaborator) && (
                                            <div className="flex items-center space-x-3">
                                                {canEditCommission(item) && (
                                                    <button 
                                                        onClick={() => handleEditClick(item)}
                                                        className="text-navy-900 hover:text-gold-600 transition-colors p-1"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                                {isManagerOrAdmin && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Deseja remover este lançamento?')) {
                                                                onDeleteCommission(item.id);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-700 transition-colors p-1"
                                                    >
                                                        <Shield size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {getObservationCount(item) > 0 && (
                                      <div>
                                        <button
                                          onClick={() => setExpandedObservations(expandedObservations === item.id ? null : item.id)}
                                          className="flex items-center gap-1 text-navy-900 hover:text-gold-600 text-xs"
                                        >
                                          <MessageSquare size={14} />
                                          <span>{getObservationCount(item)} observações</span>
                                          {expandedObservations === item.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                        {expandedObservations === item.id && (
                                          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs space-y-2 max-h-40 overflow-y-auto">
                                            {(item.observationHistory && item.observationHistory.length > 0) ? (
                                              item.observationHistory.map((obs, idx) => (
                                                <div key={obs.id || idx} className="border-l-2 border-gold-500 pl-2">
                                                  <div className="flex flex-wrap items-center gap-1 text-gray-500">
                                                    <span className="font-medium text-navy-900">{obs.authorName}</span>
                                                    <span className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">{obs.department}</span>
                                                    <span className="text-[10px]">{new Date(obs.createdAt).toLocaleDateString('pt-BR')}</span>
                                                  </div>
                                                  <p className="text-gray-700 mt-0.5">{obs.text}</p>
                                                </div>
                                              ))
                                            ) : item.observations ? (
                                              <div className="border-l-2 border-gray-300 pl-2">
                                                <div className="text-gray-500 text-[10px]">(Observação legada)</div>
                                                <p className="text-gray-700">{item.observations}</p>
                                              </div>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">Nenhum lançamento em {months[selectedMonth]}/{selectedYear}</p>
                        </div>
                    )}
                </div>
                
                <div className="bg-gray-50 px-4 md:px-6 py-3 border-t border-gray-100 text-xs text-gray-500 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span>{filteredCommissions.length} registros</span>
                    <span>{selectedDay === 0 ? 'Todos os dias' : `Dia ${selectedDay}`} · {months[selectedMonth]}/{selectedYear}</span>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div>
            <button 
                onClick={() => setIsFormOpen(false)}
                className="flex items-center text-gray-500 hover:text-navy-900 transition-colors mb-2 text-sm"
            >
                <ArrowLeft size={16} className="mr-1" />
                Voltar
            </button>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-navy-900">
                {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <p className="text-gray-500 text-xs md:text-sm">
                {editingId 
                    ? 'Altere as informações conforme necessário.' 
                    : 'Registre os detalhes do novo contrato.'}
            </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center shadow-sm">
           <span className="font-medium mr-2">Sucesso:</span> {successMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border-t-4 border-gold-500 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 md:space-y-8">
          
             {/* Section: Dados do Contrato */}
          <div className="space-y-4">
             <h3 className="text-xs md:text-sm font-semibold text-gold-600 uppercase tracking-wider border-b border-gray-100 pb-2">Informações do Contrato</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                                        <div className="relative">
                                                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                <input
                                                        type="text"
                                                        name="clientName"
                                                        required
                                                        value={formData.clientName}
                                                        onChange={handleChange}
                                                        list={user.department === Department.CONTROLLERSHIP ? 'client-options' : undefined}
                                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                                                        placeholder="Ex: Construtora ABC Ltda"
                                                />
                                                {user.department === Department.CONTROLLERSHIP && (
                                                    <datalist id="client-options">
                                                        {clientSuggestions.map(name => (
                                                            <option key={name} value={name} />
                                                        ))}
                                                    </datalist>
                                                )}
                                        </div>
                                        {user.department === Department.CONTROLLERSHIP && (
                                            <p className="text-xs text-gray-500 mt-1">Sugestões trazem clientes já lançados pelo Comercial.</p>
                                        )}
                                </div>

                                {/* Gestor/Admin criando: escolher departamento */}
                                {canCreate && !isCollaborator && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value as Department)}
                                            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                                        >
                                            {Object.values(Department).map(dep => (
                                                <option key={dep} value={dep}>{dep}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Selecione Comercial para entrar no gráfico competitivo.</p>
                                    </div>
                                )}

                                {/* Campos financeiros removidos do fluxo atual */}

                                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {user.department === Department.CONTROLLERSHIP ? 'Data de Recebimento da Certidão' : 'Data de Assinatura'}
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            type="date"
                            name="contractDate"
                            required
                            value={formData.contractDate}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                        />
                    </div>
                </div>

                {/* Status Field - ONLY FOR EDITORS (Admin/Manager) */}
                {isManagerOrAdmin && editingId && (
                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-navy-900 mb-1 flex items-center">
                            <Shield size={14} className="mr-1 text-gold-600"/>
                            Status da Comissão (Área Administrativa)
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={statusLockedForNonAdmin}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value={CommissionStatus.PENDING}>Pendente</option>
                            <option value={CommissionStatus.PAID}>Pago</option>
                            <option value={CommissionStatus.CANCELED}>Cancelado</option>
                        </select>
                        {statusLockedForNonAdmin && (
                            <p className="text-xs text-gray-500 mt-1">Somente o administrador pode alterar um lançamento já marcado como pago.</p>
                        )}
                    </div>
                )}
             </div>
          </div>

          {/* Section: Dados do Lead - Apenas para Comercial */}
          {user.department === Department.COMMERCIAL && (
          <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gold-600 uppercase tracking-wider border-b border-gray-100 pb-2">Dados do Lead</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Telefone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de telefone</label>
                    <input
                        type="text"
                        name="leadPhoneNumber"
                        value={formData.leadPhoneNumber}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                        placeholder="(00) 00000-0000"
                    />
                </div>

                {/* Data prevista nascimento */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data prevista para o nascimento</label>
                    <input
                        type="date"
                        name="leadExpectedBirthDate"
                        value={formData.leadExpectedBirthDate}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                    />
                </div>

                {/* Filhos menores de 5 anos */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filhos menores de 5 anos?</label>
                    <select
                        name="leadHasKidsUnder5"
                        value={formData.leadHasKidsUnder5}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                    >
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                    </select>
                </div>

                {/* Situação Funcional */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situação Funcional</label>
                    <input
                        type="text"
                        name="leadWorkStatus"
                        value={formData.leadWorkStatus}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                        placeholder="Ex: CLT, Autônomo, Desempregado"
                    />
                </div>

                {/* Possui advogado */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Possui advogado?</label>
                    <select
                        name="leadHasLawyer"
                        value={formData.leadHasLawyer}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                    >
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                    </select>
                </div>
             </div>
          </div>
          )}

          {/* Section: Observações */}
          <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gold-600 uppercase tracking-wider border-b border-gray-100 pb-2">Observações</h3>
             
             {/* Histórico de observações (somente ao editar) */}
             {editingId && (() => {
               const editingCommission = commissions.find(c => c.id === editingId);
               const history = editingCommission?.observationHistory || [];
               const hasLegacy = !history.length && editingCommission?.observations;
               
               if (history.length === 0 && !hasLegacy) return null;
               
               return (
                 <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-3 max-h-48 overflow-y-auto">
                   <div className="text-xs font-medium text-gray-600 uppercase">Histórico de Observações</div>
                   {history.length > 0 ? (
                     history.map((obs, idx) => (
                       <div key={obs.id || idx} className="border-l-3 border-gold-500 pl-3 py-1 bg-white rounded-r-lg shadow-sm">
                         <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                           <span className="font-semibold text-navy-900">{obs.authorName}</span>
                           <span className="px-1.5 py-0.5 bg-gold-100 text-gold-800 rounded text-[10px] font-medium">{obs.department}</span>
                           <span>{new Date(obs.createdAt).toLocaleString('pt-BR')}</span>
                         </div>
                         <p className="text-sm text-gray-700 mt-1">{obs.text}</p>
                       </div>
                     ))
                   ) : hasLegacy ? (
                     <div className="border-l-3 border-gray-300 pl-3 py-1 bg-white rounded-r-lg shadow-sm">
                       <div className="text-xs text-gray-500">(Observação anterior)</div>
                       <p className="text-sm text-gray-700 mt-1">{editingCommission?.observations}</p>
                     </div>
                   ) : null}
                 </div>
               );
             })()}

             {/* Campo para nova observação */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingId ? 'Adicionar Nova Observação' : 'Observação'}
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </label>
                <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                        name="newObservation"
                        rows={3}
                        value={formData.newObservation}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                        placeholder={editingId 
                          ? `Adicionar observação como ${user.department}...` 
                          : "Detalhes adicionais sobre o contrato..."}
                    />
                </div>
                {editingId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sua observação será adicionada ao histórico como <strong>{user.department}</strong>. As observações anteriores serão mantidas.
                  </p>
                )}
             </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
             <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all text-sm md:text-base"
            >
                Cancelar
            </button>
            <button
                type="submit"
                className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-navy-900 text-white font-medium rounded-lg hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all shadow-lg flex items-center justify-center space-x-2 text-sm md:text-base"
            >
                <Save size={18} />
                <span>{editingId ? 'Salvar' : 'Salvar Lançamento'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};