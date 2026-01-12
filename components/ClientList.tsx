import React, { useMemo, useState } from 'react';
import { Search, Users, Edit3, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { Client, User, UserRole, Department, ClientStatus } from '../types';

interface ClientListProps {
  clients: Client[];
  onUpdateClientNote: (id: string, note: string) => void;
  onUpdateClient: (id: string, data: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  currentUser: User;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onUpdateClientNote,
  onUpdateClient,
  onDeleteClient,
  currentUser,
}) => {
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClientStatus | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<Department | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Draft fields
  const [draftNote, setDraftNote] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftStatus, setDraftStatus] = useState<ClientStatus>(ClientStatus.LEAD);
  const [draftResponsibleDepartment, setDraftResponsibleDepartment] = useState<Department>(Department.COMMERCIAL);
  const [draftLastContact, setDraftLastContact] = useState('');
  const [draftBirthDate, setDraftBirthDate] = useState('');
  const [draftGpsDueDate, setDraftGpsDueDate] = useState('');
  const [draftCpf, setDraftCpf] = useState('');
  const [draftGovPassword, setDraftGovPassword] = useState('');
  const [draftContractSignatureDate, setDraftContractSignatureDate] = useState('');
  const [draftPhoneNumber, setDraftPhoneNumber] = useState('');
  const [draftExpectedBirthDate, setDraftExpectedBirthDate] = useState('');
  const [draftHasKidsUnder5, setDraftHasKidsUnder5] = useState('');
  const [draftWorkStatus, setDraftWorkStatus] = useState('');
  const [draftHasLawyer, setDraftHasLawyer] = useState('');

  // Apenas Gestor e Admin podem editar clientes
  const canEditClients =
    currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;
  const canDeleteClients =
    currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

  const filtered = useMemo(() => {
    let result = clients;
    
    // Filtro por texto
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    
    // Filtro por status
    if (filterStatus !== 'all') {
      result = result.filter((c) => (c.status || ClientStatus.LEAD) === filterStatus);
    }
    
    // Filtro por departamento responsável
    if (filterDepartment !== 'all') {
      result = result.filter((c) => (c.responsibleDepartment || Department.COMMERCIAL) === filterDepartment);
    }
    
    return result;
  }, [clients, query, filterStatus, filterDepartment]);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status?: ClientStatus) => {
    switch (status) {
      case ClientStatus.LEAD: return 'bg-blue-100 text-blue-800';
      case ClientStatus.CONTRACTED: return 'bg-yellow-100 text-yellow-800';
      case ClientStatus.IN_PROGRESS: return 'bg-purple-100 text-purple-800';
      case ClientStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case ClientStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setDraftNote(client.note || '');
    setDraftName(client.name);
    setDraftStatus(client.status || ClientStatus.LEAD);
    setDraftResponsibleDepartment(client.responsibleDepartment || Department.COMMERCIAL);
    setDraftLastContact(client.lastContactDate || '');
    setDraftBirthDate(client.birthDate || '');
    setDraftGpsDueDate(client.gpsDueDate || '');
    setDraftCpf(client.cpf || '');
    setDraftGovPassword(client.govPassword || '');
    setDraftContractSignatureDate(client.contractSignatureDate || '');
    setDraftPhoneNumber(client.phoneNumber || '');
    setDraftExpectedBirthDate(client.expectedBirthDate || '');
    setDraftHasKidsUnder5(
      client.hasKidsUnder5 === undefined ? '' : client.hasKidsUnder5 ? 'sim' : 'nao'
    );
    setDraftWorkStatus(client.workStatus || '');
    setDraftHasLawyer(
      client.hasLawyer === undefined ? '' : client.hasLawyer ? 'sim' : 'nao'
    );
    setExpandedId(client.id);
  };

  const saveEdit = () => {
    if (!editingId) return;
    onUpdateClient(editingId, {
      name: draftName,
      status: draftStatus,
      responsibleDepartment: draftResponsibleDepartment,
      lastContactDate: draftLastContact,
      birthDate: draftBirthDate,
      gpsDueDate: draftGpsDueDate,
      cpf: draftCpf.trim(),
      govPassword: draftGovPassword,
      contractSignatureDate: draftContractSignatureDate,
      phoneNumber: draftPhoneNumber,
      expectedBirthDate: draftExpectedBirthDate,
      hasKidsUnder5: draftHasKidsUnder5 === '' ? undefined : draftHasKidsUnder5 === 'sim',
      workStatus: draftWorkStatus,
      hasLawyer: draftHasLawyer === '' ? undefined : draftHasLawyer === 'sim',
      updatedAt: new Date().toISOString(),
    });
    onUpdateClientNote(editingId, draftNote);
    setEditingId(null);
    setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-navy-900">Clientes</h2>
          <p className="text-gray-500 text-xs md:text-sm">Clique no nome para abrir os detalhes.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-3 md:p-4 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2 text-gray-600 text-xs md:text-sm">
              <Users size={16} />
              <span>{filtered.length} de {clients.length} clientes</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cliente..."
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 w-full"
              />
            </div>
          </div>
          
          {/* Filtros por Status e Departamento */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ClientStatus | 'all')}
              className="px-2 md:px-3 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-gold-500 flex-1 sm:flex-none"
            >
              <option value="all">Todos Status</option>
              {Object.values(ClientStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value as Department | 'all')}
              className="px-2 md:px-3 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-gold-500 flex-1 sm:flex-none"
            >
              <option value="all">Todos Dept.</option>
              {Object.values(Department).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum cliente encontrado.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((client) => {
                const isEditing = editingId === client.id;
                const isExpanded = expandedId === client.id;

                return (
                  <li key={client.id} className="px-3 md:px-5 py-3 md:py-4 text-sm text-navy-900">
                    {/* Header row */}
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <button
                        onClick={() => toggleExpand(client.id)}
                        className="flex items-start sm:items-center gap-2 font-medium text-sm md:text-base text-left hover:text-gold-700 flex-1 min-w-0"
                      >
                        <span className="flex-shrink-0 mt-0.5 sm:mt-0">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                        <span className="truncate">{client.name}</span>
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${getStatusColor(client.status)}`}>
                            {client.status || 'Lead'}
                          </span>
                          {client.responsibleDepartment && (
                            <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-gray-100 text-gray-600 hidden sm:inline-flex">
                              {client.responsibleDepartment}
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                        {canEditClients && !isEditing && (
                          <button
                            onClick={() => startEdit(client)}
                            className="text-navy-900 hover:text-gold-600 text-xs flex items-center space-x-1 p-1"
                          >
                            <Edit3 size={14} />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                        )}
                        {canEditClients && isEditing && (
                          <button
                            onClick={saveEdit}
                            className="text-green-700 hover:text-green-800 text-xs flex items-center space-x-1 p-1"
                          >
                            <Save size={14} />
                            <span className="hidden sm:inline">Salvar</span>
                          </button>
                        )}
                        {canDeleteClients && !isEditing && (
                          <button
                            onClick={() => {
                              if (confirm('Excluir este cliente do catálogo?')) {
                                onDeleteClient(client.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-xs p-1"
                          >
                            <span className="hidden sm:inline">Remover</span>
                            <span className="sm:hidden">×</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-xs text-gray-700">
                        {/* Status */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Status</div>
                          {isEditing ? (
                            <select
                              value={draftStatus}
                              onChange={(e) => setDraftStatus(e.target.value as ClientStatus)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            >
                              {Object.values(ClientStatus).map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-gray-600">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                                {client.status || 'Lead'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Departamento Responsável */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Departamento Responsável</div>
                          {isEditing ? (
                            <select
                              value={draftResponsibleDepartment}
                              onChange={(e) => setDraftResponsibleDepartment(e.target.value as Department)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            >
                              {Object.values(Department).map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-gray-600">{client.responsibleDepartment || 'Comercial'}</div>
                          )}
                        </div>

                        {/* Nome */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Nome do Cliente</div>
                          {isEditing ? (
                            <input
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            />
                          ) : (
                            <div className="text-gray-600">{client.name}</div>
                          )}
                        </div>

                        {/* Telefone */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Número de telefone</div>
                          {isEditing ? (
                            <input
                              value={draftPhoneNumber}
                              onChange={(e) => setDraftPhoneNumber(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              placeholder="(00) 00000-0000"
                            />
                          ) : (
                            <div className="text-gray-600">{client.phoneNumber || '—'}</div>
                          )}
                        </div>

                        {/* Data prevista nascimento */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Data prevista para o nascimento</div>
                          {isEditing ? (
                            <input
                              type="date"
                              value={draftExpectedBirthDate}
                              onChange={(e) => setDraftExpectedBirthDate(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            />
                          ) : (
                            <div className="text-gray-600">{formatDate(client.expectedBirthDate)}</div>
                          )}
                        </div>

                        {/* Filhos menores 5 anos */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Filhos menores de 5 anos?</div>
                          {isEditing ? (
                            <select
                              value={draftHasKidsUnder5}
                              onChange={(e) => setDraftHasKidsUnder5(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            >
                              <option value="">Selecione</option>
                              <option value="sim">Sim</option>
                              <option value="nao">Não</option>
                            </select>
                          ) : (
                            <div className="text-gray-600">
                              {client.hasKidsUnder5 === undefined
                                ? '—'
                                : client.hasKidsUnder5
                                ? 'Sim'
                                : 'Não'}
                            </div>
                          )}
                        </div>

                        {/* Situação Funcional */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Situação Funcional</div>
                          {isEditing ? (
                            <input
                              value={draftWorkStatus}
                              onChange={(e) => setDraftWorkStatus(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              placeholder="Ex: CLT, Autônomo"
                            />
                          ) : (
                            <div className="text-gray-600">{client.workStatus || '—'}</div>
                          )}
                        </div>

                        {/* Possui advogado */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Possui advogado?</div>
                          {isEditing ? (
                            <select
                              value={draftHasLawyer}
                              onChange={(e) => setDraftHasLawyer(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            >
                              <option value="">Selecione</option>
                              <option value="sim">Sim</option>
                              <option value="nao">Não</option>
                            </select>
                          ) : (
                            <div className="text-gray-600">
                              {client.hasLawyer === undefined
                                ? '—'
                                : client.hasLawyer
                                ? 'Sim'
                                : 'Não'}
                            </div>
                          )}
                        </div>

                        {/* Data de Nascimento */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Data de Nascimento</div>
                          {isEditing ? (
                            <input
                              type="date"
                              value={draftBirthDate}
                              onChange={(e) => setDraftBirthDate(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            />
                          ) : (
                            <div className="text-gray-600">{formatDate(client.birthDate)}</div>
                          )}
                        </div>

                        {/* Data limite GPS */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Data limite pagar GPS</div>
                          {isEditing ? (
                            <input
                              type="date"
                              value={draftGpsDueDate}
                              onChange={(e) => setDraftGpsDueDate(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            />
                          ) : (
                            <div className="text-gray-600">{formatDate(client.gpsDueDate)}</div>
                          )}
                        </div>

                        {/* CPF */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">CPF</div>
                          {isEditing ? (
                            <input
                              value={draftCpf}
                              onChange={(e) => setDraftCpf(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              placeholder="000.000.000-00"
                            />
                          ) : (
                            <div className="text-gray-600">{client.cpf || '—'}</div>
                          )}
                        </div>

                        {/* Senha gov.br */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Senha gov.br</div>
                          {isEditing ? (
                            <input
                              value={draftGovPassword}
                              onChange={(e) => setDraftGovPassword(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              placeholder="Senha de acesso"
                            />
                          ) : (
                            <div className="text-gray-600">{client.govPassword || '—'}</div>
                          )}
                        </div>

                        {/* Data Assinatura Contrato */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Data da Assinatura do Contrato</div>
                          {isEditing ? (
                            <input
                              type="date"
                              value={draftContractSignatureDate}
                              onChange={(e) => setDraftContractSignatureDate(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            />
                          ) : (
                            <div className="text-gray-600">{formatDate(client.contractSignatureDate)}</div>
                          )}
                        </div>

                        {/* Última conversa */}
                        <div className="space-y-1">
                          <div className="font-semibold text-navy-900">Última conversa</div>
                          {isEditing ? (
                            <input
                              type="date"
                              value={draftLastContact}
                              onChange={(e) => setDraftLastContact(e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            />
                          ) : (
                            <div className="text-gray-600">{formatDate(client.lastContactDate)}</div>
                          )}
                        </div>

                        {/* Observações */}
                        <div className="sm:col-span-2 md:col-span-3 space-y-1">
                          <div className="font-semibold text-navy-900">Providência/Observações</div>
                          {isEditing ? (
                            <textarea
                              value={draftNote}
                              onChange={(e) => setDraftNote(e.target.value)}
                              className="w-full border border-gray-200 rounded-md p-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              rows={3}
                              placeholder="Observação do cliente"
                            />
                          ) : (
                            <div className="text-gray-600">{client.note || 'Sem observações'}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
