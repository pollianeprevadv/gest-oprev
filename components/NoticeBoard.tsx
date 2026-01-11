import React, { useMemo, useState } from 'react';
import { Notice, User, UserRole, Department } from '../types';
import { Plus, Trash2, Search } from 'lucide-react';

interface NoticeBoardProps {
  notices: Notice[];
  currentUser: User;
  onAdd: (notice: Omit<Notice, 'id' | 'createdAt' | 'createdBy'>) => void;
  onDelete: (id: string) => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ notices, currentUser, onAdd, onDelete }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [visibleRoles, setVisibleRoles] = useState<UserRole[]>([UserRole.ADMIN, UserRole.MANAGER, UserRole.COLLABORATOR]);
  const [visibleDepartments, setVisibleDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState('');

  const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

  const filtered = useMemo(
    () => notices
      .filter(n => {
        const roles = Array.isArray(n.visibleToRoles) && n.visibleToRoles.length > 0
          ? n.visibleToRoles
          : [UserRole.ADMIN, UserRole.MANAGER, UserRole.COLLABORATOR];
        return roles.includes(currentUser.role);
      })
      .filter(n => !n.visibleToDepartments || n.visibleToDepartments.length === 0 || n.visibleToDepartments.includes(currentUser.department))
      .filter(n => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      }),
    [notices, currentUser.role, currentUser.department, query]
  );

  const toggleRole = (role: UserRole) => {
    setVisibleRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    onAdd({ title: title.trim(), message: message.trim(), visibleToRoles: visibleRoles, visibleToDepartments: visibleDepartments });
    setTitle('');
    setMessage('');
    setVisibleRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.COLLABORATOR]);
    setVisibleDepartments([]);
    setIsFormOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif font-semibold text-navy-900">Quadro de Avisos</h3>
          <p className="text-sm text-gray-500">Gestores/Admin podem publicar avisos e escolher quem vê.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center space-x-2 px-3 py-2 bg-gold-500 text-navy-900 rounded-md hover:bg-gold-400 text-sm font-medium"
          >
            <Plus size={16} />
            <span>Novo Aviso</span>
          </button>
        )}
      </div>

      {canManage && isFormOpen && (
        <form onSubmit={submit} className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do aviso"
            className="w-full border border-gray-200 rounded-md p-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mensagem"
            rows={3}
            className="w-full border border-gray-200 rounded-md p-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
          />
          <div className="flex items-center flex-wrap gap-3 text-sm text-gray-700">
            {[UserRole.ADMIN, UserRole.MANAGER, UserRole.COLLABORATOR].map(role => (
              <label key={role} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={visibleRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded"
                />
                <span>{role}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center flex-wrap gap-3 text-sm text-gray-700">
            {Object.values(Department).map(dep => (
              <label key={dep} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={visibleDepartments.includes(dep)}
                  onChange={() => setVisibleDepartments(prev => prev.includes(dep) ? prev.filter(d => d !== dep) : [...prev, dep])}
                  className="h-4 w-4 text-gold-500 focus:ring-gold-500 border-gray-300 rounded"
                />
                <span>{dep}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-navy-900 text-white rounded-md text-sm font-medium hover:bg-navy-800"
            >
              Publicar
            </button>
          </div>
        </form>
      )}

      <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-2">
        <Search size={16} className="text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar avisos..."
          className="w-full border border-gray-200 rounded-md p-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
        />
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">Nenhum aviso disponível.</div>
        ) : (
          filtered.map(notice => (
            <div key={notice.id} className="p-4 space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-navy-900">{notice.title}</h4>
                  <p className="text-xs text-gray-500">{notice.createdBy || '—'} · {new Date(notice.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                {canManage && (
                  <button
                    onClick={() => onDelete(notice.id)}
                    className="text-red-500 hover:text-red-600"
                    title="Excluir aviso"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{notice.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
