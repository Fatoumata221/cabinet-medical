import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import documentUploadService from '../../services/documentUploadService';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import { 
  Upload, 
  X, 
  File, 
  FileImage, 
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader,
  Paperclip,
  Image as ImageIcon,
  FileCheck,
  Sparkles,
  Eye,
  Download
} from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'analyse', label: 'Analyse médicale', icon: FileText },
  { value: 'radio', label: 'Radiographie', icon: FileImage },
  { value: 'echographie', label: 'Échographie', icon: FileImage },
  { value: 'scanner', label: 'Scanner', icon: FileImage },
  { value: 'irm', label: 'IRM', icon: FileImage },
  { value: 'ordonnance_externe', label: 'Ordonnance externe', icon: FileText },
  { value: 'certificat_medical', label: 'Certificat médical', icon: FileText },
  { value: 'compte_rendu', label: 'Compte rendu', icon: FileText },
  { value: 'autre', label: 'Autre', icon: File }
];

const PatientDocumentUploader = ({ 
  patient, 
  onUploadSuccess, 
  onClose,
  consultationId = null 
}) => {
  // Validation et conversion du consultationId
  const validateConsultationId = (id) => {
    if (id === null || id === undefined || id === '') return null;
    
    // Si c'est un UUID, rejeter avec erreur explicite
    if (typeof id === 'string' && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.warn('⚠️ consultationId est un UUID, conversion impossible:', id);
      return null; // Forcer à null au lieu de planter
    }
    
    // Si c'est déjà un nombre, le retourner
    if (typeof id === 'number') {
      return id;
    }
    
    // Essayer de convertir en nombre
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      console.warn('⚠️ consultationId invalide, utilisation de null:', id, typeof id);
      return null;
    }
    
    return numericId;
  };

  // Valider le consultationId reçu
  const safeConsultationId = validateConsultationId(consultationId);
  
  // Log de débogage pour tracer l'origine du consultationId
  console.log('🔍 PatientDocumentUploader - consultationId:', {
    reçu: consultationId,
    type: typeof consultationId,
    validé: safeConsultationId,
    patient: patient?.nom + ' ' + patient?.prenom
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [documentType, setDocumentType] = useState('analyse');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreviews, setFilePreviews] = useState({});
  const fileInputRef = useRef(null);

  // Générer des aperçus pour les images
  const generatePreviews = (files, startIndex = 0) => {
    files.forEach((file, relativeIndex) => {
      const absoluteIndex = startIndex + relativeIndex;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreviews(prev => ({
            ...prev,
            [absoluteIndex]: e.target.result
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validation des fichiers avec le service
    const validFiles = [];
    const newErrors = [];

    files.forEach(file => {
      try {
        // Utiliser la validation du service documentUploadService
        documentUploadService.validateFile(file);
        validFiles.push(file);
      } catch (error) {
        newErrors.push(`${file.name} : ${error.message}`);
      }
    });

    setErrors(newErrors);
    setSelectedFiles(prev => {
      const startIndex = prev.length;
      const newFiles = [...prev, ...validFiles];
      generatePreviews(validFiles, startIndex);
      return newFiles;
    });
  };

  // Fonction pour gérer le drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Vérifier si on quitte vraiment la zone de drop
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (uploading) return;

    const files = Array.from(e.dataTransfer.files);
    
    // Validation des fichiers avec le service
    const validFiles = [];
    const newErrors = [];

    files.forEach(file => {
      try {
        documentUploadService.validateFile(file);
        validFiles.push(file);
      } catch (error) {
        newErrors.push(`${file.name} : ${error.message}`);
      }
    });

    setErrors(newErrors);
    setSelectedFiles(prev => {
      const startIndex = prev.length;
      const newFiles = [...prev, ...validFiles];
      generatePreviews(validFiles, startIndex);
      return newFiles;
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Réindexer les aperçus après suppression
      setFilePreviews(prevPreviews => {
        const reindexed = {};
        Object.keys(prevPreviews).forEach(key => {
          const keyNum = parseInt(key);
          if (keyNum < index) {
            reindexed[key] = prevPreviews[key];
          } else if (keyNum > index) {
            reindexed[keyNum - 1] = prevPreviews[key];
          }
          // keyNum === index est ignoré (fichier supprimé)
        });
        return reindexed;
      });
      return newFiles;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadFile = async (file, onProgress) => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log(`🚀 [${uploadId}] DÉBUT UPLOAD FICHIER`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      patientId: patient.id,
      patientName: `${patient.prenom} ${patient.nom}`,
      documentType: documentType,
      documentDate: documentDate,
      safeConsultationId: safeConsultationId,
      hasNotes: !!notes,
      timestamp: new Date().toISOString()
    });
    
    try {
      console.log(`📁 [${uploadId}] Préparation upload vers bucket 'patient-documents'`);
      console.log(`📂 [${uploadId}] Dossier cible: patient-${patient.id}`);
      
      // Utiliser le service d'upload de documents
      console.log(`⬆️ [${uploadId}] Appel documentUploadService.uploadFile...`);
      const uploadResult = await documentUploadService.uploadFile('patient-documents', file, {
        folder: `patient-${patient.id}`,
        onProgress: (progressData) => {
          console.log(`📊 [${uploadId}] Progression upload: ${progressData.percentage || 0}%`);
          if (onProgress) onProgress(progressData);
        }
      });

      console.log(`📤 [${uploadId}] Résultat upload service:`, {
        success: uploadResult.success,
        path: uploadResult.data?.path,
        publicUrl: uploadResult.data?.publicUrl ? 'URL générée' : 'Pas d\'URL',
        uploadedAt: uploadResult.data?.uploadedAt
      });

      if (!uploadResult.success) {
        console.error(`❌ [${uploadId}] Échec upload service:`, uploadResult.error);
        throw new Error(uploadResult.error);
      }

      console.log(`✅ [${uploadId}] Upload fichier réussi, insertion métadonnées en BDD...`);
      
      // Obtenir l'ID bigint de l'utilisateur depuis la table users
      let userId = null;
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.log(`👤 [${uploadId}] Utilisateur auth connecté:`, {
          authId: authUser?.id,
          email: authUser?.email
        });

        if (authUser?.id) {
          // Récupérer l'ID bigint depuis la table users via auth_id
          const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single();

          if (userError) {
            console.warn(`⚠️ [${uploadId}] Erreur récupération profil utilisateur:`, userError);
            // Fallback: essayer par email
            if (authUser.email) {
              const { data: userByEmail } = await supabase
                .from('users')
                .select('id')
                .eq('email', authUser.email)
                .single();
              if (userByEmail) {
                userId = userByEmail.id;
                console.log(`✅ [${uploadId}] ID utilisateur récupéré via email:`, userId);
              }
            }
          } else if (userProfile?.id) {
            userId = userProfile.id;
            console.log(`✅ [${uploadId}] ID utilisateur récupéré via auth_id:`, userId);
          }
        }
      } catch (error) {
        console.error(`❌ [${uploadId}] Erreur lors de la récupération de l'ID utilisateur:`, error);
      }

      // Vérifier que l'ID utilisateur a été récupéré (scanned_by est NOT NULL)
      if (!userId) {
        const errorMsg = 'Impossible de récupérer l\'ID utilisateur. Vérifiez que votre profil existe dans la table users.';
        console.error(`❌ [${uploadId}] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Construire les données d'insertion (seulement les colonnes qui existent)
      const insertData = {
        patient_id: patient.id,
        type_document: documentType,
        nom_fichier: uploadResult.data.fileName,
        url_fichier: uploadResult.data.path,
        scanned_by: userId, // IMPORTANT: doit être un bigint (ID de users), pas un UUID
        description: notes || null,
        taille_fichier: uploadResult.data.fileSize,
        format_fichier: uploadResult.data.fileType?.split('/')[1] || file.name.split('.').pop().toLowerCase()
      };

      // Ajouter date_document si la colonne existe (peut être ajoutée par migration)
      // Note: Si la colonne n'existe pas, l'insertion échouera avec une erreur claire
      if (documentDate) {
        insertData.date_document = documentDate;
      }

      // Ajouter consultation_id si fourni et si la colonne existe
      if (safeConsultationId) {
        insertData.consultation_id = safeConsultationId;
      }

      console.log(`💾 [${uploadId}] Données à insérer en BDD:`, insertData);

      // Insérer les métadonnées dans la base de données
      const { data: docData, error: dbError } = await supabase
        .from('documents_patients')
        .insert([insertData])
        .select()
        .single();

      if (dbError) {
        console.error(`❌ [${uploadId}] ERREUR INSERTION BDD:`, {
          error: dbError,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
          insertData: insertData,
          uploadPath: uploadResult.data.path
        });
        
        console.log(`🗑️ [${uploadId}] Nettoyage: suppression fichier uploadé...`);
        // En cas d'erreur DB, supprimer le fichier uploadé via le service
        try {
          await documentUploadService.deleteFile('patient-documents', uploadResult.data.path);
          console.log(`✅ [${uploadId}] Fichier supprimé avec succès`);
        } catch (deleteError) {
          console.error(`❌ [${uploadId}] Erreur suppression fichier:`, deleteError);
        }
        
        throw dbError;
      }

      console.log(`✅ [${uploadId}] SUCCÈS COMPLET - Document sauvegardé:`, {
        documentId: docData.id,
        fileName: docData.nom_fichier,
        filePath: docData.url_fichier,
        fileSize: `${(docData.taille_fichier / 1024 / 1024).toFixed(2)} MB`,
        documentType: docData.type_document,
        createdAt: docData.created_at
      });

      const finalResult = { 
        success: true, 
        data: {
          ...docData,
          publicUrl: uploadResult.data.publicUrl,
          uploadedAt: uploadResult.data.uploadedAt
        }
      };

      console.log(`🎉 [${uploadId}] Upload terminé avec succès en ${Date.now() - parseInt(uploadId.split('_')[1])}ms`);
      
      return finalResult;
      
    } catch (error) {
      console.error(`💥 [${uploadId}] ERREUR GLOBALE UPLOAD:`, {
        fileName: file.name,
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      });
      return { success: false, error: error.message };
    }
  };

  const handleUpload = async () => {
    // Empêcher l'upload de radiographies
    if (documentType === 'radio') {
      setErrors(['Le scan de radiographies n\'est pas disponible. Veuillez sélectionner un autre type de document.']);
      return;
    }

    if (selectedFiles.length === 0) {
      setErrors(['Veuillez sélectionner au moins un fichier']);
      return;
    }

    if (!documentDate) {
      setErrors(['Veuillez sélectionner une date pour le document']);
      return;
    }

    setUploading(true);
    setErrors([]);
    const progress = {};
    const uploadErrors = [];
    const uploadedFilesData = [];

    try {
      // Option 1: Upload séquentiel avec progression individuelle
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        progress[i] = 0;
        setUploadProgress({ ...progress });

        // Callback de progression pour ce fichier spécifique
        const onProgress = (progressData) => {
          progress[i] = progressData.percentage || 0;
          setUploadProgress({ ...progress });
        };

        const result = await uploadFile(file, onProgress);
        
        if (result.success) {
          progress[i] = 100;
          setUploadProgress({ ...progress });
          uploadedFilesData.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: result.data.publicUrl || URL.createObjectURL(file),
            documentType: documentType,
            uploadDate: new Date().toLocaleString('fr-FR'),
            dbData: result.data
          });
        } else {
          uploadErrors.push(`${file.name} : ${result.error}`);
        }
      }

      if (uploadErrors.length === 0) {
        setPreviewFiles(uploadedFilesData);
        setShowPreview(true);
      } else {
        setErrors(uploadErrors);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setErrors(['Une erreur est survenue lors de l\'upload']);
    } finally {
      setUploading(false);
    }
  };

  // Fonction alternative pour upload multiple en parallèle
  const handleUploadMultiple = async () => {
    // Empêcher l'upload de radiographies
    if (documentType === 'radio') {
      setErrors(['Le scan de radiographies n\'est pas disponible. Veuillez sélectionner un autre type de document.']);
      return;
    }

    if (selectedFiles.length === 0) {
      setErrors(['Veuillez sélectionner au moins un fichier']);
      return;
    }

    if (!documentDate) {
      setErrors(['Veuillez sélectionner une date pour le document']);
      return;
    }

    setUploading(true);
    setErrors([]);
    
    try {
      // Utiliser le service pour upload multiple
      const results = await documentUploadService.uploadMultipleFiles(
        'patient-documents', 
        selectedFiles, 
        {
          folder: `patient-${patient.id}`,
          onProgress: (progressData) => {
            // Progression globale pour tous les fichiers
            const progress = {};
            for (let i = 0; i < selectedFiles.length; i++) {
              if (i < progressData.currentFile - 1) {
                progress[i] = 100;
              } else if (i === progressData.currentFile - 1) {
                progress[i] = progressData.percentage;
              } else {
                progress[i] = 0;
              }
            }
            setUploadProgress(progress);
          }
        }
      );

      // Traiter les résultats et insérer en base
      const uploadErrors = [];
      const uploadedFilesData = [];
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const file = selectedFiles[i];
        
        if (result.success) {
          // Insérer les métadonnées en base pour chaque fichier
          // Obtenir l'ID bigint de l'utilisateur depuis la table users
          let userId = null;
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser?.id) {
              // Récupérer l'ID bigint depuis la table users via auth_id
              const { data: userProfile } = await supabase
                .from('users')
                .select('id')
                .eq('auth_id', authUser.id)
                .single();

              if (!userProfile?.id && authUser.email) {
                // Fallback: essayer par email
                const { data: userByEmail } = await supabase
                  .from('users')
                  .select('id')
                  .eq('email', authUser.email)
                  .single();
                if (userByEmail) {
                  userId = userByEmail.id;
                }
              } else if (userProfile?.id) {
                userId = userProfile.id;
              }
            }
          } catch (error) {
            console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
          }
          
          // Vérifier que l'ID utilisateur a été récupéré (scanned_by est NOT NULL)
          if (!userId) {
            uploadErrors.push(`${file.name} : Impossible de récupérer l'ID utilisateur. Vérifiez que votre profil existe dans la table users.`);
            continue; // Passer au fichier suivant
          }
          
          // Construire les données d'insertion
          const insertDataMultiple = {
            patient_id: patient.id,
            type_document: documentType,
            nom_fichier: result.data.fileName,
            url_fichier: result.data.path,
            scanned_by: userId, // IMPORTANT: doit être un bigint (ID de users), pas un UUID
            description: notes || null,
            taille_fichier: result.data.fileSize,
            format_fichier: result.data.fileType?.split('/')[1] || file.name.split('.').pop().toLowerCase()
          };

          // Ajouter date_document si fourni
          if (documentDate) {
            insertDataMultiple.date_document = documentDate;
          }

          // Ajouter consultation_id si fourni
          if (safeConsultationId) {
            insertDataMultiple.consultation_id = safeConsultationId;
          }

          const { data: docData, error: dbError } = await supabase
            .from('documents_patients')
            .insert([insertDataMultiple])
            .select()
            .single();

          if (dbError) {
            uploadErrors.push(`${file.name} : Erreur base de données - ${dbError.message}`);
            // Supprimer le fichier uploadé en cas d'erreur DB
            await documentUploadService.deleteFile('patient-documents', result.data.path);
          } else {
            uploadedFilesData.push({
              name: file.name,
              size: file.size,
              type: file.type,
              url: result.data.publicUrl || URL.createObjectURL(file),
              documentType: documentType,
              uploadDate: new Date().toLocaleString('fr-FR'),
              dbData: docData
            });
          }
        } else {
          uploadErrors.push(`${file.name} : ${result.error}`);
        }
      }

      if (uploadErrors.length === 0) {
        setPreviewFiles(uploadedFilesData);
        setShowPreview(true);
      } else {
        setErrors(uploadErrors);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload multiple:', error);
      setErrors(['Une erreur est survenue lors de l\'upload multiple']);
    } finally {
      setUploading(false);
    }
  };

  // Modal d'aperçu des fichiers uploadés
  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-full">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Upload réussi !
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {previewFiles.length} document{previewFiles.length > 1 ? 's' : ''} ajouté{previewFiles.length > 1 ? 's' : ''} au dossier de <span className="font-semibold text-gray-800">{patient.prenom} {patient.nom}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPreview(false);
                onUploadSuccess?.();
                onClose?.();
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="group bg-white rounded-xl border-2 border-gray-200 hover:border-green-300 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
                >
                  {/* Aperçu du fichier */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <>
                        <img 
                          src={file.url} 
                          alt={file.name}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="p-4 bg-white/80 rounded-full mb-3 inline-block">
                          <FileText className="mx-auto text-gray-400" size={40} />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Document PDF</p>
                        <p className="text-xs text-gray-400 mt-1">{file.type}</p>
                      </div>
                    )}
                    {/* Badge de succès */}
                    <div className="absolute top-2 right-2 p-1.5 bg-green-500 rounded-full shadow-lg">
                      <CheckCircle className="text-white" size={16} />
                    </div>
                  </div>
                  
                  {/* Informations du fichier */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 truncate mb-3" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="p-1 bg-blue-100 rounded">
                          {DOCUMENT_TYPES.find(t => t.value === file.documentType)?.icon ? (
                            React.createElement(DOCUMENT_TYPES.find(t => t.value === file.documentType).icon, { size: 14, className: "text-blue-600" })
                          ) : (
                            <File size={14} className="text-blue-600" />
                          )}
                        </div>
                        <span className="font-medium">{DOCUMENT_TYPES.find(t => t.value === file.documentType)?.label || file.documentType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="text-xs">📦 {formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className="text-xs">🕒 {file.uploadDate}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <a
                        href={file.url}
                        download={file.name}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-2.5 px-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        Télécharger
                      </a>
                      {file.type.startsWith('image/') && (
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-3 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Eye size={16} />
                          Voir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-t from-white via-gray-50 to-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowPreview(false);
                onUploadSuccess?.();
                onClose?.();
              }}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <CheckCircle size={20} />
              Terminer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg">
              <Upload className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                Scanner / Importer des documents
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Patient : <span className="font-semibold text-gray-800">{patient.prenom} {patient.nom}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-all duration-200"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Type de document */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileCheck className="text-blue-600" size={18} />
              Type de document *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DOCUMENT_TYPES.filter(type => type.value !== 'radio').map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      // Empêcher la sélection de radiographie
                      if (type.value === 'radio') {
                        unifiedNotificationService.warning('Le scan de radiographies n\'est pas disponible. Veuillez sélectionner un autre type de document.');
                        return;
                      }
                      setDocumentType(type.value);
                    }}
                    className={`flex items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 ${
                      documentType === type.value
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-700 hover:shadow-sm'
                    }`}
                    disabled={uploading}
                  >
                    <Icon size={20} className={documentType === type.value ? 'text-blue-600' : 'text-gray-500'} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>Note: Le scan de radiographies n'est pas disponible dans cette application.</span>
              </p>
            </div>
          </div>

          {/* Date du document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              Date du document *
            </label>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={uploading}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des notes sur ce document..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={uploading}
            />
          </div>

          {/* Zone de sélection de fichiers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichiers *
            </label>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                uploading
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : isDragging
                  ? 'border-blue-500 bg-blue-100 scale-[1.02] shadow-lg shadow-blue-200/50 cursor-pointer'
                  : 'border-blue-300 hover:border-blue-400 cursor-pointer bg-gradient-to-br from-blue-50/50 to-indigo-50/30 hover:from-blue-50 hover:to-indigo-50 hover:shadow-md'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              {/* Animation de fond lors du drag */}
              {isDragging && (
                <div className="absolute inset-0 rounded-xl bg-blue-200/20 animate-pulse" />
              )}
              
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-all duration-300 ${
                  isDragging 
                    ? 'bg-blue-500 scale-110' 
                    : 'bg-blue-100 group-hover:bg-blue-200'
                }`}>
                  {isDragging ? (
                    <Sparkles className="text-white animate-pulse" size={40} />
                  ) : (
                    <Upload className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} 
                      style={{ color: isDragging ? 'white' : '#2563eb' }} 
                      size={40} 
                    />
                  )}
                </div>
                
                <p className="text-gray-800 font-semibold text-lg mb-2">
                  {isDragging ? 'Déposez vos fichiers ici' : 'Cliquez pour sélectionner des fichiers'}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  ou glissez-déposez vos documents ici
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/80 rounded-full text-xs text-gray-600">
                    <ImageIcon size={14} />
                    <span>Images</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/80 rounded-full text-xs text-gray-600">
                    <FileText size={14} />
                    <span>PDF</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Formats acceptés : JPG, PNG, PDF (max 10 MB par fichier)
                </p>
              </div>
            </div>
          </div>

          {/* Liste des fichiers sélectionnés */}
          {selectedFiles.length > 0 && (
            <div className="animate-slide-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <FileCheck className="text-blue-600" size={20} />
                  Fichiers sélectionnés ({selectedFiles.length})
                </h3>
                {selectedFiles.length > 0 && !uploading && (
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setFilePreviews({});
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Tout supprimer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedFiles.map((file, index) => {
                  const isImage = file.type.startsWith('image/');
                  const preview = filePreviews[index];
                  const progress = uploadProgress[index];
                  
                  return (
                    <div
                      key={index}
                      className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md"
                    >
                      {/* Aperçu de l'image */}
                      {isImage && preview ? (
                        <div className="relative h-32 bg-gray-100 overflow-hidden">
                          <img 
                            src={preview} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-xs text-gray-500">{file.name.split('.').pop().toUpperCase()}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Barre de progression */}
                      {progress !== undefined && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                          <div 
                            className="h-full bg-blue-600 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      
                      {/* Contenu */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate mb-1" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatFileSize(file.size)}</span>
                              {isImage && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <ImageIcon size={12} />
                                    Image
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Statut */}
                          {progress !== undefined && (
                            <div className="flex-shrink-0">
                              {progress === 100 ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle size={18} />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Loader className="animate-spin" size={18} />
                                  <span className="text-xs font-medium">{progress}%</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Barre de progression détaillée */}
                        {progress !== undefined && progress < 100 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out relative"
                                style={{ width: `${progress}%` }}
                              >
                                <div className="absolute inset-0 bg-white/30 animate-pulse" />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Bouton supprimer */}
                        {!uploading && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Supprimer"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages d'erreur */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-1">
                    Erreurs détectées
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-gray-50 to-gray-50 border-t border-gray-200 p-6">
          {/* Options d'upload */}
          {selectedFiles.length > 1 && !uploading && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
              <p className="text-sm text-blue-900 font-semibold mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                Mode d'upload pour {selectedFiles.length} fichiers :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <FileCheck className="text-blue-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-900">Séquentiel</p>
                    <p className="text-xs text-blue-700">Un fichier à la fois avec progression détaillée</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-white/60 rounded-lg">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Upload className="text-green-600" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-900">Parallèle</p>
                    <p className="text-xs text-green-700">Tous les fichiers simultanément (plus rapide)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Progression globale */}
          {uploading && selectedFiles.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900">
                  Upload en cours...
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {Object.values(uploadProgress).filter(p => p === 100).length} / {selectedFiles.length}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out relative"
                  style={{ 
                    width: `${(Object.values(uploadProgress).reduce((a, b) => a + (b || 0), 0) / selectedFiles.length)}%` 
                  }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse" />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm hover:shadow"
              disabled={uploading}
            >
              Annuler
            </button>
            
            {selectedFiles.length > 1 ? (
              <>
                <button
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  {uploading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Upload séquentiel...
                    </>
                  ) : (
                    <>
                      <FileCheck size={20} />
                      Upload séquentiel ({selectedFiles.length})
                    </>
                  )}
                </button>
                <button
                  onClick={handleUploadMultiple}
                  disabled={uploading || selectedFiles.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transition-all duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  {uploading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Upload parallèle...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Upload parallèle ({selectedFiles.length})
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition-all duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                {uploading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Télécharger {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDocumentUploader;




