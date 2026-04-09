import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react';
import documentUploadService from '../services/documentUploadService';

/**
 * Composant d'upload de documents avec interface utilisateur
 */
const DocumentUploader = ({ 
  bucketName = 'documents', 
  folder = null,
  onUploadSuccess = () => {},
  onUploadError = () => {},
  multiple = false,
  maxFiles = 5
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Gestion de la sélection de fichiers
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (!multiple && selectedFiles.length > 1) {
      alert('Veuillez sélectionner un seul fichier');
      return;
    }

    if (selectedFiles.length > maxFiles) {
      alert(`Vous ne pouvez sélectionner que ${maxFiles} fichiers maximum`);
      return;
    }

    // Validation des fichiers
    const validFiles = [];
    for (const file of selectedFiles) {
      try {
        documentUploadService.validateFile(file);
        validFiles.push({
          file,
          id: Math.random().toString(36).substring(2, 15),
          status: 'pending',
          progress: 0
        });
      } catch (error) {
        alert(`Erreur avec le fichier ${file.name}: ${error.message}`);
      }
    }

    setFiles(validFiles);
  };

  // Gestion du drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Simuler la sélection de fichiers
    const event = {
      target: {
        files: droppedFiles
      }
    };
    
    handleFileSelect(event);
  };

  // Upload des fichiers
  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      
      // Mise à jour du statut
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading' }
          : f
      ));

      try {
        // Upload du fichier
        const result = await documentUploadService.uploadFile(
          bucketName, 
          fileItem.file, 
          {
            folder,
            onProgress: (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [fileItem.id]: progress
              }));
            }
          }
        );

        if (result.success) {
          // Succès
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'success', result: result.data }
              : f
          ));

          setUploadedFiles(prev => [...prev, {
            ...fileItem,
            result: result.data
          }]);

          onUploadSuccess(result.data);
          results.push({ success: true, file: fileItem.file.name, data: result.data });
        } else {
          throw new Error(result.error);
        }

      } catch (error) {
        // Erreur
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));

        onUploadError(error.message);
        results.push({ success: false, file: fileItem.file.name, error: error.message });
      }
    }

    setUploading(false);
    
    // Résumé des uploads
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    if (successCount > 0) {
      alert(`${successCount} fichier(s) uploadé(s) avec succès`);
    }
    
    if (errorCount > 0) {
      alert(`${errorCount} fichier(s) ont échoué`);
    }
  };

  // Suppression d'un fichier de la liste
  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Téléchargement d'un fichier uploadé
  const downloadFile = async (fileData) => {
    try {
      const blob = await documentUploadService.downloadFile(bucketName, fileData.path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(`Erreur lors du téléchargement: ${error.message}`);
    }
  };

  // Suppression d'un fichier uploadé
  const deleteUploadedFile = async (fileData) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      const result = await documentUploadService.deleteFile(bucketName, fileData.path);
      if (result.success) {
        setUploadedFiles(prev => prev.filter(f => f.result.path !== fileData.path));
        alert('Fichier supprimé avec succès');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      alert(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  // Formatage de la taille de fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Icône selon le statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        Upload de Documents
      </h3>

      {/* Zone de drop */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          Glissez-déposez vos fichiers ici ou
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          disabled={uploading}
        >
          Sélectionner des fichiers
        </button>
        <p className="text-sm text-gray-500 mt-2">
          {multiple ? `Maximum ${maxFiles} fichiers` : 'Un seul fichier'} - 
          PDF, Images, Documents (max 50MB)
        </p>
      </div>

      {/* Input caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
      />

      {/* Liste des fichiers sélectionnés */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-3 text-gray-800">
            Fichiers sélectionnés ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((fileItem) => (
              <div key={fileItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(fileItem.status)}
                  <div>
                    <p className="font-medium text-gray-800">{fileItem.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(fileItem.file.size)}
                      {fileItem.status === 'error' && (
                        <span className="text-red-500 ml-2">- {fileItem.error}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {fileItem.status === 'pending' && (
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Bouton d'upload */}
          <div className="mt-4">
            <button
              onClick={handleUpload}
              disabled={uploading || files.every(f => f.status !== 'pending')}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Upload en cours...' : 'Uploader les fichiers'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des fichiers uploadés */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-medium mb-3 text-gray-800">
            Fichiers uploadés ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((fileItem, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-800">{fileItem.result.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(fileItem.result.fileSize)} - 
                      Uploadé le {new Date(fileItem.result.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadFile(fileItem.result)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Télécharger"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteUploadedFile(fileItem.result)}
                    className="text-red-500 hover:text-red-700"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
