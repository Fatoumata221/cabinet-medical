import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import SignaturePad from '../../components/doctor/SignaturePad';
import { ArrowLeft, User, Edit, Signature, Check, AlertCircle, Trash2 } from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    specialite: '',
    signature_url: null
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) throw error;
      
      setUserData({
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        telephone: data.telephone || '',
        specialite: data.specialite || '',
        signature_url: data.signature_url || null
      });
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showMessage('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('users')
        .update({
          nom: userData.nom,
          prenom: userData.prenom,
          telephone: userData.telephone,
          specialite: userData.specialite
        })
        .eq('email', user.email);

      if (error) throw error;
      
      showMessage('success', 'Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSignature = async (signatureBlob) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Créer un nom de fichier unique
      const fileName = `signature-${user.id}-${Date.now()}.png`;
      
      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, signatureBlob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Erreur upload:', uploadError);
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('signatures')
        .getPublicUrl(fileName);

      // Mettre à jour le profil avec l'URL de la signature
      const { error: updateError } = await supabase
        .from('users')
        .update({ signature_url: publicUrl })
        .eq('email', user.email);

      if (updateError) throw updateError;

      setUserData(prev => ({ ...prev, signature_url: publicUrl }));
      setShowSignaturePad(false);
      showMessage('success', 'Signature enregistrée avec succès ! Elle apparaîtra automatiquement sur vos ordonnances et certificats.');
    } catch (error) {
      console.error('Erreur signature:', error);
      
      if (error.message?.includes('Bucket not found')) {
        showMessage('error', 'Le bucket "signatures" n\'existe pas. Veuillez le créer dans Supabase Storage (voir documentation).');
      } else {
        showMessage('error', 'Erreur lors de l\'enregistrement de la signature: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSignature = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre signature ?')) {
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Supprimer l'URL de la base de données
      const { error } = await supabase
        .from('users')
        .update({ signature_url: null })
        .eq('email', user.email);

      if (error) throw error;
      
      setUserData(prev => ({ ...prev, signature_url: null }));
      showMessage('success', 'Signature supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      showMessage('error', 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/doctor')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">⚙️ Paramètres</h1>
                <p className="text-sm text-gray-600">Gérez votre profil et vos préférences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="text-green-600 flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Informations personnelles */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <User className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={userData.prenom}
                  onChange={(e) => setUserData(prev => ({ ...prev, prenom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={userData.nom}
                  onChange={(e) => setUserData(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (non modifiable)
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={userData.telephone}
                  onChange={(e) => setUserData(prev => ({ ...prev, telephone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialité
                </label>
                <input
                  type="text"
                  value={userData.specialite}
                  onChange={(e) => setUserData(prev => ({ ...prev, specialite: e.target.value }))}
                  placeholder="Ex: Médecin généraliste"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Signature className="text-blue-600" size={24} />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">Ma signature</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Apparaît automatiquement sur les ordonnances et certificats
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {userData.signature_url ? (
              <div>
                <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 mb-4">
                  <p className="text-sm text-gray-600 mb-3 text-center">Signature actuelle :</p>
                  <div className="flex justify-center">
                    <img
                      src={userData.signature_url}
                      alt="Ma signature"
                      className="max-w-xs max-h-32 object-contain"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit size={18} />
                    Modifier ma signature
                  </button>
                  
                  <button
                    onClick={handleDeleteSignature}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                  <Signature className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-600 mb-2">Aucune signature enregistrée</p>
                  <p className="text-sm text-gray-500">
                    Créez votre signature pour qu'elle apparaisse automatiquement sur tous vos documents médicaux
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                  >
                    <Signature size={20} />
                    Créer ma signature
                  </button>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ À propos de la signature :</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Signez avec votre souris, trackpad ou écran tactile</li>
                <li>• Votre signature apparaîtra automatiquement sur les ordonnances et certificats</li>
                <li>• Format PNG transparent pour un rendu professionnel</li>
                <li>• Vous pouvez la modifier ou supprimer à tout moment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Signature Pad */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSaveSignature}
          onCancel={() => setShowSignaturePad(false)}
          currentSignature={userData.signature_url}
        />
      )}
    </div>
  );
};

export default SettingsPage;

