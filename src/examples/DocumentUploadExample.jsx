import React, { useState } from 'react';
import documentUploadService from '../services/documentUploadService';
import DocumentUploader from '../components/DocumentUploader';

/**
 * Exemple d'utilisation du service d'upload de documents
 */
const DocumentUploadExample = () => {
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Exemple 1: Upload simple avec input file
  const handleSimpleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await documentUploadService.uploadFile('documents', file, {
        folder: 'examples',
        onProgress: (progress) => {
          console.log('Progression:', progress);
        }
      });

      setUploadResult(result);
      console.log('Résultat upload:', result);
    } catch (error) {
      console.error('Erreur:', error);
      setUploadResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Exemple 2: Upload multiple avec gestion d'erreurs
  const handleMultipleUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setLoading(true);
    try {
      const results = await documentUploadService.uploadMultipleFiles('documents', files, {
        folder: 'batch-examples',
        onProgress: (progress) => {
          console.log(`Upload ${progress.currentFile}/${progress.totalFiles}: ${progress.fileName} (${progress.percentage}%)`);
        }
      });

      console.log('Résultats uploads multiples:', results);
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      setUploadResult({
        success: true,
        message: `${successCount} fichiers uploadés avec succès, ${errorCount} erreurs`
      });
    } catch (error) {
      console.error('Erreur upload multiple:', error);
      setUploadResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Exemple 3: Téléchargement de fichier
  const handleDownload = async () => {
    if (!uploadResult?.data?.path) {
      alert('Aucun fichier à télécharger');
      return;
    }

    try {
      const blob = await documentUploadService.downloadFile('documents', uploadResult.data.path);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = uploadResult.data.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Téléchargement réussi');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement');
    }
  };

  // Exemple 4: Suppression de fichier
  const handleDelete = async () => {
    if (!uploadResult?.data?.path) {
      alert('Aucun fichier à supprimer');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    try {
      const result = await documentUploadService.deleteFile('documents', uploadResult.data.path);
      
      if (result.success) {
        console.log('Fichier supprimé avec succès');
        setUploadResult(null);
        alert('Fichier supprimé avec succès');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Exemple 5: Listing des fichiers
  const handleListFiles = async () => {
    try {
      const files = await documentUploadService.listFiles('documents', 'examples', {
        limit: 10,
        sortBy: 'created_at',
        order: 'desc'
      });
      
      console.log('Fichiers dans le dossier examples:', files);
      alert(`${files.length} fichiers trouvés (voir console)`);
    } catch (error) {
      console.error('Erreur listing:', error);
      alert('Erreur lors du listing');
    }
  };

  // Callbacks pour le composant DocumentUploader
  const handleUploadSuccess = (fileData) => {
    console.log('Upload réussi via composant:', fileData);
    setUploadResult({ success: true, data: fileData });
  };

  const handleUploadError = (error) => {
    console.error('Erreur upload via composant:', error);
    setUploadResult({ success: false, error });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Exemples d'utilisation du Service d'Upload
      </h1>

      {/* Exemple 1: Upload simple */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">1. Upload Simple</h2>
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleSimpleUpload}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {loading && <p className="text-blue-600">Upload en cours...</p>}
        </div>
      </div>

      {/* Exemple 2: Upload multiple */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">2. Upload Multiple</h2>
        <div className="space-y-4">
          <input
            type="file"
            multiple
            onChange={handleMultipleUpload}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>
      </div>

      {/* Résultat de l'upload */}
      {uploadResult && (
        <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className="font-semibold mb-2">Résultat de l'upload:</h3>
          {uploadResult.success ? (
            <div className="space-y-2">
              <p className="text-green-700">✅ Upload réussi!</p>
              {uploadResult.data && (
                <div className="text-sm text-gray-600">
                  <p><strong>Fichier:</strong> {uploadResult.data.fileName}</p>
                  <p><strong>Taille:</strong> {(uploadResult.data.fileSize / 1024).toFixed(2)} KB</p>
                  <p><strong>Type:</strong> {uploadResult.data.fileType}</p>
                  <p><strong>Chemin:</strong> {uploadResult.data.path}</p>
                  <p><strong>URL:</strong> <a href={uploadResult.data.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Voir le fichier</a></p>
                </div>
              )}
              {uploadResult.message && <p className="text-green-700">{uploadResult.message}</p>}
              
              {/* Actions sur le fichier uploadé */}
              {uploadResult.data && (
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={handleDownload}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Télécharger
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-700">❌ Erreur: {uploadResult.error}</p>
          )}
        </div>
      )}

      {/* Actions supplémentaires */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">3. Actions Supplémentaires</h2>
        <div className="space-x-4">
          <button
            onClick={handleListFiles}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Lister les fichiers
          </button>
        </div>
      </div>

      {/* Composant DocumentUploader */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">4. Composant DocumentUploader</h2>
        <DocumentUploader
          bucketName="documents"
          folder="component-examples"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          multiple={true}
          maxFiles={3}
        />
      </div>

      {/* Code d'exemple */}
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Code d'exemple</h2>
        <pre className="text-sm overflow-x-auto">
          <code>{`
// Import du service
import documentUploadService from '../services/documentUploadService';

// Upload simple
const result = await documentUploadService.uploadFile('documents', file, {
  folder: 'examples',
  onProgress: (progress) => console.log(progress)
});

// Upload multiple
const results = await documentUploadService.uploadMultipleFiles('documents', files);

// Téléchargement
const blob = await documentUploadService.downloadFile('documents', 'path/to/file');

// Suppression
const result = await documentUploadService.deleteFile('documents', 'path/to/file');

// Listing
const files = await documentUploadService.listFiles('documents', 'folder');
          `}</code>
        </pre>
      </div>
    </div>
  );
};

export default DocumentUploadExample;
