import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Volume2,
  VolumeX,
  MessageSquare,
  Save,
  CheckCircle,
  AlertCircle,
  User,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // États pour les paramètres
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    soundEnabled: true,
    toastEnabled: true,
    theme: 'light'
  });

  // Charger les paramètres depuis localStorage au démarrage
  useEffect(() => {
    const loadSettings = () => {
      const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
      const soundEnabled = localStorage.getItem('notification_sound_enabled') !== 'false';
      const toastEnabled = localStorage.getItem('toast_enabled') !== 'false';
      const theme = localStorage.getItem('theme') || 'light';

      setSettings({
        notificationsEnabled,
        soundEnabled,
        toastEnabled,
        theme
      });
    };

    loadSettings();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Sauvegarder dans localStorage
      localStorage.setItem('notifications_enabled', settings.notificationsEnabled.toString());
      localStorage.setItem('notification_sound_enabled', settings.soundEnabled.toString());
      localStorage.setItem('toast_enabled', settings.toastEnabled.toString());
      localStorage.setItem('theme', settings.theme);

      showMessage('success', 'Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showMessage('error', 'Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
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
            <Settings className="w-8 h-8 mr-3 text-medical-primary" />
            Paramètres
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos préférences personnelles et notifications
          </p>
        </div>
      </div>

      {/* Section Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-medical-primary" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-4">
          {/* Activer les notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Activer les notifications</p>
                <p className="text-sm text-gray-500">Recevoir des notifications dans l'application</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-medical-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary"></div>
            </label>
          </div>

          {/* Activer le son */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-gray-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">Activer le son</p>
                <p className="text-sm text-gray-500">Jouer un son pour chaque notification</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                disabled={!settings.notificationsEnabled}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-medical-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary ${!settings.notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
            </label>
          </div>

          {/* Activer les toasts */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Activer les toasts</p>
                <p className="text-sm text-gray-500">Afficher des messages toast pour les notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.toastEnabled}
                onChange={(e) => handleSettingChange('toastEnabled', e.target.checked)}
                disabled={!settings.notificationsEnabled}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-medical-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-medical-primary ${!settings.notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Section Apparence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Sun className="w-6 h-6 text-medical-primary" />
          <h2 className="text-xl font-semibold text-gray-900">Apparence</h2>
        </div>

        <div className="space-y-4">
          {/* Thème */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900 mb-3">Thème</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleSettingChange('theme', 'light')}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                  settings.theme === 'light'
                    ? 'border-medical-primary bg-medical-primary bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>Clair</span>
              </button>
              <button
                onClick={() => handleSettingChange('theme', 'dark')}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                  settings.theme === 'dark'
                    ? 'border-medical-primary bg-medical-primary bg-opacity-10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span>Sombre</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Informations utilisateur */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
      >
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-medical-primary" />
          <h2 className="text-xl font-semibold text-gray-900">Informations</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Email</span>
            <span className="font-medium text-gray-900">{currentUser?.email || 'N/A'}</span>
          </div>
          {userProfile && (
            <>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Nom</span>
                <span className="font-medium text-gray-900">
                  {userProfile.prenom} {userProfile.nom}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Rôle</span>
                <span className="font-medium text-gray-900 capitalize">
                  {userProfile.role === 'doctor' ? 'Médecin' : userProfile.role === 'secretary' ? 'Secrétaire' : 'Administrateur'}
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Bouton de sauvegarde */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-medical-primary text-white rounded-lg hover:bg-medical-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
