import React, { useState } from 'react';
import { Department, User, UserRole } from '../types';
import { Edit2, Trash2, Plus, X, Save, Shield, User as UserIcon } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUser, onAddUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user, password: '' }); // Clear password for security when editing
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingUser({
      username: '',
      password: '',
      name: '',
      role: UserRole.COLLABORATOR,
      department: Department.COMMERCIAL,
      avatarInitials: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Generate initials
    const initials = editingUser.name
      ? editingUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';

    const userToSave = {
      ...editingUser,
      avatarInitials: initials,
    } as User;

    if (userToSave.id) {
      onUpdateUser(userToSave);
    } else {
      onAddUser({ ...userToSave, id: Math.random().toString(36).substr(2, 9) });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-navy-900">Gestão de Usuários</h2>
          <p className="text-gray-500 text-xs md:text-sm">Controle de acesso e perfis do sistema.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center justify-center space-x-2 bg-navy-900 text-white px-4 py-2.5 rounded-lg hover:bg-navy-800 transition-colors shadow-md text-sm w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hidden md:block">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
            <tr>
              <th className="px-6 py-4 tracking-wider">Usuário</th>
              <th className="px-6 py-4 tracking-wider">Cargo / Perfil</th>
              <th className="px-6 py-4 tracking-wider">Departamento</th>
              <th className="px-6 py-4 tracking-wider">Login</th>
              <th className="px-6 py-4 tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-navy-50 text-navy-900 flex items-center justify-center font-serif font-bold border border-navy-100">
                      {user.avatarInitials}
                    </div>
                    <div className="font-medium text-navy-900">{user.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium space-x-1
                    ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : ''}
                    ${user.role === UserRole.MANAGER ? 'bg-gold-500/20 text-navy-900' : ''}
                    ${user.role === UserRole.COLLABORATOR ? 'bg-gray-100 text-gray-800' : ''}
                  `}>
                    {user.role === UserRole.ADMIN && <Shield size={12} className="mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{user.department}</td>
                <td className="px-6 py-4 font-mono text-xs">{user.username}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => handleEditClick(user)}
                    className="text-navy-900 hover:text-gold-600 transition-colors" title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  {user.role !== UserRole.ADMIN && (
                    <button 
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover este usuário?')) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors" title="Remover"
                    >
                        <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-navy-50 text-navy-900 flex items-center justify-center font-serif font-bold border border-navy-100 flex-shrink-0">
                  {user.avatarInitials}
                </div>
                <div>
                  <div className="font-medium text-navy-900">{user.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{user.username}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditClick(user)}
                  className="text-navy-900 hover:text-gold-600 transition-colors p-1"
                >
                  <Edit2 size={18} />
                </button>
                {user.role !== UserRole.ADMIN && (
                  <button 
                    onClick={() => {
                      if (confirm('Tem certeza que deseja remover este usuário?')) {
                        onDeleteUser(user.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : ''}
                ${user.role === UserRole.MANAGER ? 'bg-gold-500/20 text-navy-900' : ''}
                ${user.role === UserRole.COLLABORATOR ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {user.role === UserRole.ADMIN && <Shield size={10} className="mr-1" />}
                {user.role}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{user.department}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border-t-4 border-gold-500 my-4 md:my-0">
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100">
              <h3 className="text-lg md:text-xl font-serif font-semibold text-navy-900">
                {editingUser?.id ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-navy-900 p-1">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                    type="text"
                    required
                    value={editingUser?.name || ''}
                    onChange={(e) => setEditingUser(curr => ({ ...curr!, name: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500"
                    placeholder="Ex: João da Silva"
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário</label>
                  <input
                    type="text"
                    required
                    value={editingUser?.username || ''}
                    onChange={(e) => setEditingUser(curr => ({ ...curr!, username: e.target.value }))}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500"
                    placeholder="login.usuario"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser?.id ? 'Nova Senha (Opcional)' : 'Senha'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser?.id}
                    value={editingUser?.password || ''}
                    onChange={(e) => setEditingUser(curr => ({ ...curr!, password: e.target.value }))}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                <select
                  value={editingUser?.role}
                  onChange={(e) => setEditingUser(curr => ({ ...curr!, role: e.target.value as UserRole }))}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500"
                >
                  <option value={UserRole.COLLABORATOR}>Colaborador</option>
                  <option value={UserRole.MANAGER}>Gestor</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {editingUser?.role === UserRole.ADMIN && 'Acesso total a configurações e gestão de usuários.'}
                  {editingUser?.role === UserRole.MANAGER && 'Acesso completo ao dashboard e relatórios.'}
                  {editingUser?.role === UserRole.COLLABORATOR && 'Acesso restrito a visualização de dados.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select
                  value={editingUser?.department || Department.COMMERCIAL}
                  onChange={(e) => setEditingUser(curr => ({ ...curr!, department: e.target.value as Department }))}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-gold-500 focus:border-gold-500"
                >
                  {Object.values(Department).map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 bg-navy-900 text-white rounded-lg hover:bg-navy-800 flex items-center justify-center space-x-2"
                >
                  <Save size={18} />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};