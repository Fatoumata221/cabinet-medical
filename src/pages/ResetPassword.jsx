import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Key,
  Shield,
  User
} from 'lucide-react';
import { resetPassword, verifyOtp, updatePassword, supabase, createAuthAccountForUser } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
  const [step, setStep] = useState(1); // 1: username, 2: code, 3: nouveau mot de passe
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState(''); // Stocker l'email récupéré depuis le username
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Vérifier si on arrive depuis un lien de réinitialisation ou avec un mot de passe temporaire
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const tempPassword = searchParams.get('temp');
    
    if (token && type === 'recovery') {
      // On est arrivé depuis un lien de réinitialisation
      setStep(3); // Aller directement à l'étape de nouveau mot de passe
      setSuccess('Lien de réinitialisation détecté. Vous pouvez maintenant créer un nouveau mot de passe.');
    } else if (tempPassword === 'true') {
      // L'utilisateur vient de se connecter avec un mot de passe temporaire
      setStep(3); // Aller directement à l'étape de nouveau mot de passe
      setSuccess('Vous devez changer votre mot de passe temporaire pour des raisons de sécurité.');
    }
  }, [searchParams]);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Récupérer l'email depuis le username pour l'afficher dans l'étape suivante
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .eq('actif', true)
        .maybeSingle();
      
      if (userData?.email) {
        setUserEmail(userData.email);
      }
      
      const result = await resetPassword(username);
      if (result.error) {
        setError(result.error.message || 'Erreur lors de l\'envoi de l\'email');
      } else {
        setSuccess('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.');
        setStep(2);
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'envoi de l\'email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Récupérer l'email depuis le username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, username, role, auth_id')
        .eq('username', username)
        .eq('actif', true)
        .maybeSingle();
      
      if (userError || !userData || !userData.email) {
        setError('Nom d\'utilisateur non trouvé');
        setIsLoading(false);
        return;
      }
      
      const userEmail = userData.email;
      console.log('🔑 [handleCodeSubmit] Vérification du code:', { username, email: userEmail, code });
      
      // Code de test pour le développement (valide pour tous)
      const testCode = '123456';
      
      if (code === testCode) {
        console.log('✅ [handleCodeSubmit] Code de test accepté, vérification de l\'existence du compte...');
        
        console.log('👤 [handleCodeSubmit] Vérification compte:', { 
          found: !!userData, 
          error: userError?.message,
          user: userData 
        });
        
        // Vérifier si l'utilisateur a un auth_id (lien avec Supabase Auth)
        if (!userData.auth_id) {
          console.log('⚠️ [handleCodeSubmit] Utilisateur sans auth_id - création d\'un compte auth nécessaire');
          
          // Proposer de créer un compte d'authentification
          const createAuth = window.confirm(
            'Ce compte n\'est pas configuré pour la réinitialisation de mot de passe.\n\n' +
            'Voulez-vous créer un compte d\'authentification maintenant ?\n\n' +
            'Un mot de passe temporaire sera créé que vous pourrez modifier ensuite.'
          );
          
          if (createAuth) {
            console.log('🔄 [handleCodeSubmit] Création du compte d\'authentification...');
            setIsLoading(true);
            
            const result = await createAuthAccountForUser(userEmail);
            
            if (result.success) {
              setSuccess('Compte d\'authentification créé ! Vous pouvez maintenant continuer.');
              setStep(3); // Aller directement à l'étape de nouveau mot de passe
            } else {
              setError('Erreur lors de la création du compte d\'authentification: ' + result.error);
            }
            
            setIsLoading(false);
            return;
          } else {
            setError('Réinitialisation annulée. Contactez l\'administrateur pour configurer votre compte.');
            return;
          }
        }
        
        console.log('✅ [handleCodeSubmit] Compte trouvé avec auth_id, passage à l\'étape 3');
        setSuccess('Code vérifié avec succès !');
        setStep(3);
      } else {
        console.log('🔄 [handleCodeSubmit] Tentative de vérification OTP normale');
        // Essayer la vérification OTP normale
        const result = await verifyOtp(userEmail, code, 'recovery');
        console.log('📋 [handleCodeSubmit] Résultat OTP:', { success: !result.error, error: result.error?.message });
        
        if (result.error) {
          setError(result.error.message || 'Code invalide');
        } else {
          setSuccess('Code vérifié avec succès !');
          setStep(3);
        }
      }
    } catch (err) {
      console.log('💥 [handleCodeSubmit] Erreur:', err);
      setError('Code invalide ou expiré');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Récupérer l'email depuis le username
    let userEmail = null;
    if (username) {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .eq('actif', true)
        .maybeSingle();
      userEmail = userData?.email || null;
    }

    console.log('🔐 [handlePasswordSubmit] Début de la soumission du mot de passe');
    console.log('📋 [handlePasswordSubmit] Données:', { 
      username,
      email: userEmail, 
      newPasswordLength: newPassword.length,
      passwordsMatch: newPassword === confirmPassword 
    });

    if (newPassword !== confirmPassword) {
      console.log('❌ [handlePasswordSubmit] Les mots de passe ne correspondent pas');
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      console.log('❌ [handlePasswordSubmit] Mot de passe trop court');
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 [handlePasswordSubmit] Appel de updatePassword...');
      const result = await updatePassword(newPassword, userEmail);
      
      console.log('📊 [handlePasswordSubmit] Résultat updatePassword:', { 
        success: !result.error, 
        error: result.error?.message 
      });
      
      if (result.error) {
        if (result.error.message.includes('Session d\'authentification manquante')) {
          console.log('🔄 [handlePasswordSubmit] Session expirée, retour à l\'étape 1');
          setError('Session expirée. Veuillez redémarrer le processus de réinitialisation depuis le début.');
          setStep(1); // Retourner à l'étape 1
        } else {
          console.log('❌ [handlePasswordSubmit] Autre erreur:', result.error.message);
          setError(result.error.message || 'Erreur lors de la mise à jour du mot de passe');
        }
      } else {
        console.log('✅ [handlePasswordSubmit] Mot de passe mis à jour avec succès');
        
        // Supprimer le flag du mot de passe temporaire
        localStorage.removeItem('hasTemporaryPassword');
        
        setSuccess('Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.log('💥 [handlePasswordSubmit] Erreur inattendue:', err);
      setError('Une erreur est survenue lors de la mise à jour du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      setSuccess('');
    } else {
      navigate('/login');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 0.2, duration: 0.5 }
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step >= stepNumber 
              ? 'bg-medical-primary text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {stepNumber}
          </div>
          {stepNumber < 3 && (
            <div className={`w-16 h-1 mx-2 ${
              step > stepNumber ? 'bg-medical-primary' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleUsernameSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-medical-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-medical-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Réinitialiser votre mot de passe
              </h2>
              <p className="text-gray-600">
                Entrez votre nom d'utilisateur pour recevoir un code de réinitialisation
              </p>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent transition-all duration-200"
                  placeholder="nom.utilisateur"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-medical-primary hover:bg-medical-primary/90 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer le code'}
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-medical-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="text-medical-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Vérification du code
              </h2>
              <p className="text-gray-600">
                Entrez le code de 6 chiffres envoyé à <strong>{userEmail || 'votre email'}</strong>
              </p>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              {/* Code de test pour le développement */}
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Mode développement :</strong> Utilisez le code <code className="bg-yellow-100 px-2 py-1 rounded">123456</code> pour tous les tests
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-medical-primary hover:bg-medical-primary/90 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              {isLoading ? 'Vérification...' : 'Vérifier le code'}
            </button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-medical-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-medical-primary" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Nouveau mot de passe
              </h2>
              <p className="text-gray-600">
                Créez un nouveau mot de passe sécurisé
              </p>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent transition-all duration-200"
                  placeholder="Votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent transition-all duration-200"
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full bg-medical-primary hover:bg-medical-primary/90 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-primary via-medical-secondary to-medical-accent flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Bouton retour */}
        <motion.button
          onClick={goBack}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </motion.button>

        {/* Formulaire */}
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Indicateur d'étapes */}
          {renderStepIndicator()}

          {/* Contenu de l'étape */}
          {renderStepContent()}

          {/* Messages d'erreur et de succès */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-sm text-red-700">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-sm text-green-700">{success}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-white/60 text-sm">
            © 2024 Cabinet Médical. Tous droits réservés.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
