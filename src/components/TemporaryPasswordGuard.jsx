import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle } from 'lucide-react';
import { temporaryAuthService } from '../services/temporaryAuthService';

const TemporaryPasswordGuard = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !currentUser) return;

    // Vérifier la session temporaire réelle
    const tempSession = temporaryAuthService.getTemporarySession();
    const mustReset = !!tempSession?.mustResetPassword;

    // Nettoyer un flag local obsolète si aucune obligation de reset
    const hasFlag = localStorage.getItem('hasTemporaryPassword') === 'true';
    if (hasFlag && !mustReset) {
      try { localStorage.removeItem('hasTemporaryPassword'); } catch (e) {}
    }

    if (mustReset) {
      console.log('🛡️ [TemporaryPasswordGuard] Session temporaire détectée, redirection vers reset-password');
      navigate('/reset-password?temp=true');
    }
  }, [currentUser, isLoading, navigate]);

  // Blocage d'accès uniquement si la session temporaire exige un reset
  const mustResetPassword = useMemo(() => {
    const tempSession = temporaryAuthService.getTemporarySession();
    return !!tempSession?.mustResetPassword;
  }, []);

  if (mustResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-yellow-600" size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Mot de passe temporaire détecté
          </h2>
          
          <div className="flex items-center justify-center space-x-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="text-yellow-600" size={20} />
            <span className="text-sm text-yellow-700">
              Vous devez changer votre mot de passe pour des raisons de sécurité
            </span>
          </div>
          
          <p className="text-gray-600 mb-6">
            Pour accéder à l'application, vous devez d'abord changer votre mot de passe temporaire.
          </p>
          
          <button
            onClick={() => navigate('/reset-password?temp=true')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            Changer mon mot de passe
          </button>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default TemporaryPasswordGuard;
