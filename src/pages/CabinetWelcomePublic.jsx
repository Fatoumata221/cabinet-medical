import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Stethoscope, Shield, Calculator, Award, Lock } from 'lucide-react';

const CabinetWelcomePublic = () => {
  const { tenantId } = useParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [cabinet, setCabinet] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tenantId) loadCabinetAndUsers();
  }, [tenantId]);

  const loadCabinetAndUsers = async () => {
    const { data: cabinetData } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    setCabinet(cabinetData);

    const { data: usersData } = await supabase
      .rpc('get_quick_login_users', { p_tenant_id: tenantId });
    setUsers(usersData || []);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor': return <Stethoscope size={24} />;
      case 'admin': return <Shield size={24} />;
      case 'caissier': return <Calculator size={24} />;
      case 'accounting': return <Award size={24} />;
      default: return <User size={24} />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor': return 'bg-green-500';
      case 'secretary': return 'bg-blue-500';
      case 'admin': return 'bg-purple-500';
      case 'caissier': return 'bg-orange-500';
      case 'accounting': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'doctor': return 'Médecin';
      case 'secretary': return 'Secrétaire';
      case 'admin': return 'Administrateur';
      case 'caissier': return 'Caissier';
      case 'accounting': return 'Comptabilité';
      default: return role;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await login(selectedUser.username, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError('Mot de passe incorrect');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-6">
      
      <div className="text-center mb-8">
        {cabinet?.logo_url && (
          <img src={cabinet.logo_url} alt="Logo" className="h-24 object-contain mx-auto mb-4" />
        )}
        <h1 className="text-3xl font-bold text-gray-800">{cabinet?.name}</h1>
        <p className="text-gray-500 mt-1">Connectez-vous en tant que...</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {users.map((user) => (
          <button
            key={user.username}
            onClick={() => { setSelectedUser(user); setPassword(''); setError(''); }}
            className={`flex flex-col items-center p-4 bg-white rounded-xl shadow hover:shadow-md transition-all border-2 ${
              selectedUser?.username === user.username ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <div className={`w-14 h-14 rounded-full ${getRoleColor(user.role)} text-white flex items-center justify-center mb-2`}>
              {getRoleIcon(user.role)}
            </div>
            <p className="font-medium text-gray-800 text-sm text-center">{user.prenom} {user.nom}</p>
            <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
          </button>
        ))}
      </div>

      {selectedUser && (
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-full ${getRoleColor(selectedUser.role)} text-white flex items-center justify-center`}>
              {getRoleIcon(selectedUser.role)}
            </div>
            <div>
              <p className="font-semibold">{selectedUser.prenom} {selectedUser.nom}</p>
              <p className="text-xs text-gray-500">{getRoleLabel(selectedUser.role)}</p>
            </div>
          </div>
          <form onSubmit={handleLogin}>
            <div className="relative mb-3">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => navigate('/login')}
        className="mt-6 text-sm text-gray-400 hover:text-gray-600"
      >
        ← Retour à la page de connexion
      </button>
    </div>
  );
};

export default CabinetWelcomePublic;