import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Camera, 
  Save, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  Shield,
  Calendar,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { currentUser, userProfile, getUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    specialite: '',
    role: '',
    photo_url: '',
    adresse: '',
    ville: '',
    code_postal: '',
    date_naissance: '',
    username: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (currentUser && userProfile) {
      loadProfileData();
    } else if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, userProfile]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      if (userProfile) {
        setProfileData({
          nom: userProfile.nom || '',
          prenom: userProfile.prenom || '',
          email: userProfile.email || '',
          telephone: userProfile.telephone || '',
          specialite: userProfile.specialite || '',
          role: userProfile.role || '',
          photo_url: userProfile.photo_url || '',
          adresse: userProfile.adresse || '',
          ville: userProfile.ville || '',
          code_postal: userProfile.code_postal || '',
          date_naissance: userProfile.date_naissance || '',
          username: userProfile.username || ''
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      showMessage('error', 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Créer un nom unique pour le fichier
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Uploader vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        // Fallback: convertir en base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result;
          await updateProfilePhoto(base64String);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      await updateProfilePhoto(publicUrl);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      showMessage('error', 'Erreur lors de l\'upload de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateProfilePhoto = async (photoUrl) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ photo_url: photoUrl })
        .eq('id', userProfile.id);

      if (error) throw error;

      // Mettre à jour le state local
      setProfileData(prev => ({ ...prev, photo_url: photoUrl }));
      
      // Recharger le profil depuis la base de données
      if (getUserProfile) {
        await getUserProfile(true);
      } else {
        // Fallback: recharger manuellement
        const { data: updatedProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userProfile.id)
          .single();
        
        if (updatedProfile) {
          setProfileData(prev => ({
            ...prev,
            photo_url: updatedProfile.photo_url || photoUrl
          }));
        }
      }
      
      showMessage('success', 'Photo de profil mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo:', error);
      showMessage('error', 'Erreur lors de la mise à jour de la photo');
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData.nom || !profileData.prenom) {
      showMessage('error', 'Le nom et le prénom sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          nom: profileData.nom,
          prenom: profileData.prenom,
          telephone: profileData.telephone,
          specialite: profileData.specialite,
          adresse: profileData.adresse,
          ville: profileData.ville,
          code_postal: profileData.code_postal,
          date_naissance: profileData.date_naissance || null
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      // Recharger le profil depuis la base de données
      if (getUserProfile) {
        await getUserProfile(true);
      } else {
        // Fallback: recharger manuellement
        const { data: updatedProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userProfile.id)
          .single();
        
        if (updatedProfile) {
          setProfileData({
            nom: updatedProfile.nom || '',
            prenom: updatedProfile.prenom || '',
            email: updatedProfile.email || '',
            telephone: updatedProfile.telephone || '',
            specialite: updatedProfile.specialite || '',
            role: updatedProfile.role || '',
            photo_url: updatedProfile.photo_url || '',
            adresse: updatedProfile.adresse || '',
            ville: updatedProfile.ville || '',
            code_postal: updatedProfile.code_postal || '',
            date_naissance: updatedProfile.date_naissance || '',
            username: updatedProfile.username || ''
          });
        }
      }
      
      showMessage('success', 'Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showMessage('error', 'Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showMessage('error', 'Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSaving(true);
    try {
      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        showMessage('error', 'Mot de passe actuel incorrect');
        setSaving(false);
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      showMessage('success', 'Mot de passe modifié avec succès !');
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      showMessage('error', 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roles = {
      'admin': 'Administrateur',
      'doctor': 'Médecin',
      'secretary': 'Secrétaire'
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Message de notification */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center space-x-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <User className="w-8 h-8 mr-3 text-medical-primary" />
            Mon Profil
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos informations personnelles et professionnelles
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Photo et infos rapides */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            {/* Photo de profil */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-medical-primary mx-auto">
                  {profileData.photo_url ? (
                    <img
                      src={profileData.photo_url}
                      alt="Photo de profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-medical-primary to-medical-secondary flex items-center justify-center">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 p-2 bg-medical-primary text-white rounded-full hover:bg-medical-primary/90 transition-colors shadow-lg"
                  title="Changer la photo"
                >
                  {uploadingPhoto ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mt-4">
                {profileData.prenom} {profileData.nom}
              </h2>
              <p className="text-gray-600">{getRoleDisplayName(profileData.role)}</p>
              {profileData.specialite && (
                <p className="text-sm text-gray-500 mt-1">{profileData.specialite}</p>
              )}
            </div>

            {/* Informations rapides */}
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{profileData.email}</span>
              </div>
              {profileData.telephone && (
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{profileData.telephone}</span>
                </div>
              )}
              {profileData.username && (
                <div className="flex items-center space-x-3 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">@{profileData.username}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Colonne droite - Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations personnelles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-medical-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={profileData.prenom}
                  onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={profileData.nom}
                  onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={profileData.telephone}
                  onChange={(e) => setProfileData({ ...profileData, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                />
              </div>

              {profileData.role === 'doctor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spécialité
                  </label>
                  <input
                    type="text"
                    value={profileData.specialite}
                    onChange={(e) => setProfileData({ ...profileData, specialite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    placeholder="Ex: Médecine générale"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={profileData.date_naissance}
                  onChange={(e) => setProfileData({ ...profileData, date_naissance: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center px-6 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Changement de mot de passe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-medical-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Sécurité</h2>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-medical-primary hover:text-medical-primary/80 text-sm font-medium"
                >
                  Changer le mot de passe
                </button>
              )}
            </div>

            {showPasswordForm && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Modification...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Modifier le mot de passe
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;









