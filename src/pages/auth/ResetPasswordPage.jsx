import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { temporaryAuthService } from '../../services/temporaryAuthService';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  // Récupérer les informations utilisateur depuis la session temporaire
  useEffect(() => {
    const checkTemporarySession = async () => {
      const session = temporaryAuthService.getTemporarySession();
      if (!session || !session.mustResetPassword) {
        // Rediriger vers login si pas de session temporaire valide
        navigate('/login', { 
          state: { 
            message: 'Veuillez vous connecter avec votre mot de passe temporaire' 
          }
        });
        return;
      }

      setUserInfo({
        email: session.profile.email,
        nom: session.profile.nom,
        prenom: session.profile.prenom
      });
    };

    checkTemporarySession();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Nettoyer les messages d'erreur lors de la saisie
    if (error) setError('');
  };

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 6) {
      errors.push('Au moins 6 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Un chiffre');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { newPassword, confirmPassword } = formData;

      // Validations
      if (!newPassword || !confirmPassword) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        throw new Error(`Le mot de passe doit contenir : ${passwordErrors.join(', ')}`);
      }

      // Réinitialiser le mot de passe
      const result = await temporaryAuthService.resetPassword(
        userInfo.email,
        newPassword,
        confirmPassword
      );

      if (result.success) {
        setSuccess('Mot de passe réinitialisé avec succès !');
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          // Nettoyer toute trace de session/flag temporaire côté client
          try { localStorage.removeItem('hasTemporaryPassword'); } catch (e) {}
          try { temporaryAuthService.clearTemporarySession(); } catch (e) {}
          navigate('/login', {
            state: {
              message: 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
              email: userInfo.email
            }
          });
        }, 2000);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      setError(error.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const { newPassword } = formData;
    if (!newPassword) return { score: 0, label: '', color: '' };

    const errors = validatePassword(newPassword);
    const score = Math.max(0, 4 - errors.length);
    
    const levels = [
      { score: 0, label: 'Très faible', color: 'bg-red-500' },
      { score: 1, label: 'Faible', color: 'bg-orange-500' },
      { score: 2, label: 'Moyen', color: 'bg-yellow-500' },
      { score: 3, label: 'Bon', color: 'bg-blue-500' },
      { score: 4, label: 'Excellent', color: 'bg-green-500' }
    ];

    return levels[score];
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Réinitialisation du mot de passe
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Bonjour <span className="font-medium">{userInfo.prenom} {userInfo.nom}</span>
          </p>
          <p className="text-sm text-gray-500">
            Veuillez définir votre nouveau mot de passe
          </p>
        </div>

        {/* Formulaire */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            
            {/* Email (lecture seule) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={userInfo.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Indicateur de force du mot de passe */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Validation correspondance */}
              {formData.confirmPassword && (
                <div className="mt-1">
                  {formData.newPassword === formData.confirmPassword ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Les mots de passe correspondent
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Les mots de passe ne correspondent pas
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages d'erreur et succès */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading || formData.newPassword !== formData.confirmPassword}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Réinitialisation...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Réinitialiser le mot de passe
                </>
              )}
            </button>
          </div>

          {/* Conseils de sécurité */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Conseils pour un mot de passe sécurisé :
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Au moins 6 caractères (8+ recommandés)</li>
              <li>• Mélange de majuscules et minuscules</li>
              <li>• Au moins un chiffre</li>
              <li>• Évitez les informations personnelles</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
