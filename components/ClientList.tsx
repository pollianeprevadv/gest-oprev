import React, { useMemo, useState } from 'react';
import { Search, Users, Edit3, Save } from 'lucide-react';
import { Client, User, UserRole } from '../types';

interface ClientListProps {
  clients: Client[];
  onUpdateClientNote: (id: string, note: string) => void;
  onUpdateClient: (id: string, data: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  currentUser: User;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, onUpdateClientNote, onUpdateClient, onDeleteClient, currentUser }) => {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftLastContact, setDraftLastContact] = useState('');

  const canEditNotes = currentUser.role !== UserRole.COLLABORATOR;
  const canDeleteClients = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, query]);

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setDraftNote(client.note || '');
    setDraftName(client.name);
    setDraftLastContact(client.lastContactDate || '');
  };

  const saveEdit = () => {
    if (!editingId) return;
    // Update name and last contact together
    onUpdateClient(editingId, { name: draftName, lastContactDate: draftLastContact });
    onUpdateClientNote(editingId, draftNote);
    setEditingId(null);
    setDraftNote('');
    setDraftName('');
    setDraftLastContact('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-navy-900">Clientes</h2>
          <p className="text-gray-500 text-sm">Catálogo único de clientes do escritório.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <Users size={16} />
            <span>{clients.length} clientes cadastrados</span>
          </div>
          <div className="relative w-full md:w-64">
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

        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum cliente encontrado.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((client) => {
                const isEditing = editingId === client.id;
                return (
                  <li key={client.id} className="px-5 py-4 text-sm text-navy-900 hover:bg-gray-50">
                    <div className="flex flex-col space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          {isEditing ? (
                            <input
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                              className="w-full border border-gray-200 rounded-md p-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                              placeholder="Nome do cliente"
                            />
                          ) : (
                            <div className="font-medium text-base">{client.name}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-600">
                          <span className="font-medium text-navy-900">Última conversa:</span>
                          {isEditing ? (
                            <input
                              type="date"
                              value={draftLastContact}
                              onChange={(e) => setDraftLastContact(e.target.value)}
                              className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            />
                          ) : (
                            <span>{client.lastContactDate ? new Date(client.lastContactDate).toLocaleDateString('pt-BR') : '—'}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {canEditNotes ? (
                            isEditing ? (
                              <button
                                onClick={saveEdit}
                                className="text-green-700 hover:text-green-800 text-xs flex items-center space-x-1"
                              >
                                <Save size={14} />
                                <span>Salvar</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(client)}
                                  className="text-navy-900 hover:text-gold-600 text-xs flex items-center space-x-1"
                                >
                                  <Edit3 size={14} />
                                  <span>Editar</span>
                                </button>
                                {canDeleteClients && (
                                  <button
                                    onClick={() => {
                                      if (confirm('Excluir este cliente do catálogo?')) {
                                        onDeleteClient(client.id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700 text-xs"
                                  >
                                    Remover
                                  </button>
                                )}
                              </>
                            )
                          ) : (
                            <span className="text-gray-400 text-xs">Visualização</span>
                          )}
                        </div>
                      </div>

                      <div className="text-gray-600 text-xs md:text-sm">
                        {isEditing ? (
                          <textarea
                            value={draftNote}
                            onChange={(e) => setDraftNote(e.target.value)}
                            className="w-full border border-gray-200 rounded-md p-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                            rows={2}
                            placeholder="Observação do cliente"
                          />
                        ) : (
                          <span className="block text-gray-500">{client.note || 'Sem observações'}</span>
                        )}
                      </div>
                    </div>
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
