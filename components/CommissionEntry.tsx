import React, { useState } from 'react';
import { User, Commission, CommissionStatus, UserRole, Department } from '../types';
import { Save, FileText, Calendar, User as UserIcon, Plus, ArrowLeft, Search, CalendarDays, Edit2, Shield } from 'lucide-react';

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
        observations: '',
        status: CommissionStatus.PENDING as CommissionStatus,
        // Dados do Lead
        leadPhoneNumber: '',
        leadExpectedBirthDate: '',
        leadHasKidsUnder5: '' as '' | 'sim' | 'nao',
        leadWorkStatus: '',
        leadHasLawyer: '' as '' | 'sim' | 'nao',
    });
  
  const [successMessage, setSuccessMessage] = useState('');

    // PERMISSIONS CHECK
        const isCollaborator = user.role === UserRole.COLLABORATOR;
        const isManager = user.role === UserRole.MANAGER;
        const isManagerOrAdmin = isManager || user.role === UserRole.ADMIN;
        const isGeneral = user.department === Department.GENERAL;
        const canCreate = isCollaborator || isManager; // Gestor também pode lançar

  // 1. Filtrar comissões
  // Se for Colaborador: vê apenas as suas
  // Se for Gestor/Admin: vê TODAS
    const visibleCommissions = (() => {
        if (isCollaborator) {
            return commissions.filter(c => (c.lawyerId ? c.lawyerId === user.id : c.lawyerName === user.name));
        }
        if (isGeneral) return commissions;
        return commissions.filter(c => c.department === user.department || (c.lawyerId ? c.lawyerId === user.id : c.lawyerName === user.name));
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
        observations: commission.observations || '',
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
        observations: '',
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

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const originalCommission = editingId ? commissions.find(c => c.id === editingId) : undefined;
    const canEditExisting = originalCommission ? canEditCommission(originalCommission) : false;

    if (editingId && canEditExisting) {
        // UPDATE EXISTING
        if (originalCommission) {
            const nextStatus = (() => {
                if (originalCommission.status === CommissionStatus.PAID && user.role !== UserRole.ADMIN) return originalCommission.status;
                if (!isManagerOrAdmin) return originalCommission.status;
                return formData.status;
            })();
            const updatedCommission: Commission = {
                ...originalCommission,
                clientName: formData.clientName,
                contractDate: formData.contractDate,
                observations: formData.observations,
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
            observations: formData.observations,
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
            observations: '',
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                <h2 className="text-2xl font-serif font-semibold text-navy-900">
                    {canCreate ? 'Meus Lançamentos' : 'Conferência de Comissões'}
                </h2>
                <p className="text-gray-500 text-sm">
                    {canCreate 
                        ? 'Gerencie suas comissões por competência.' 
                        : 'Acompanhe e valide os lançamentos dos colaboradores.'}
                </p>
                </div>
                
                {/* Only Show "Novo Lançamento" if user is Collaborator */}
                {canCreate && (
                    <button 
                    onClick={handleNewClick}
                    className="flex items-center justify-center space-x-2 bg-gold-500 text-navy-900 px-4 py-2 rounded-lg hover:bg-gold-400 transition-colors shadow-md font-medium"
                    >
                    <Plus size={18} />
                    <span>Novo Lançamento</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Barra de Filtros */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    
                    {/* Seletores de Data */}
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                            <CalendarDays size={18} className="text-navy-900 mr-2" />
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-transparent border-none text-sm text-gray-700 font-medium focus:ring-0 cursor-pointer pr-8"
                            >
                                {months.map((m, index) => (
                                    <option key={index} value={index}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent border-none text-sm text-gray-700 font-medium focus:ring-0 cursor-pointer"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                            <select
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(Number(e.target.value))}
                                className="bg-transparent border-none text-sm text-gray-700 font-medium focus:ring-0 cursor-pointer"
                            >
                                {days.map(day => (
                                    <option key={day} value={day}>{day === 0 ? 'Todos os dias' : day}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Busca */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={canCreate ? "Buscar cliente..." : "Buscar cliente ou advogado..."}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 w-full bg-white shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
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
                                <td className="px-6 py-4 truncate max-w-xs text-gray-400">
                                    {item.observations || '-'}
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
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                    <span>Mostrando {filteredCommissions.length} registros</span>
                    <span>Competência: {selectedDay === 0 ? 'Todos os dias' : `Dia ${selectedDay}`} · {months[selectedMonth]}/{selectedYear}</span>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
            <button 
                onClick={() => setIsFormOpen(false)}
                className="flex items-center text-gray-500 hover:text-navy-900 transition-colors mb-2 text-sm"
            >
                <ArrowLeft size={16} className="mr-1" />
                Voltar para lista
            </button>
            <h2 className="text-2xl font-serif font-semibold text-navy-900">
                {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <p className="text-gray-500 text-sm">
                {editingId 
                    ? 'Altere as informações abaixo conforme necessário.' 
                    : 'Registre os detalhes do novo contrato para processamento.'}
            </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center shadow-sm">
           <span className="font-medium mr-2">Sucesso:</span> {successMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border-t-4 border-gold-500 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
             {/* Section: Dados do Contrato */}
          <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gold-600 uppercase tracking-wider border-b border-gray-100 pb-2">Informações do Contrato</h3>
             
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
             
             <div>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                        name="observations"
                        rows={4}
                        value={formData.observations}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500 text-gray-900"
                        placeholder="Detalhes adicionais sobre o contrato..."
                    />
                </div>
             </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
             <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
                Cancelar
            </button>
            <button
                type="submit"
                className="px-6 py-3 bg-navy-900 text-white font-medium rounded-lg hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all shadow-lg flex items-center space-x-2"
            >
                <Save size={18} />
                <span>{editingId ? 'Salvar Alterações' : 'Salvar Lançamento'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};