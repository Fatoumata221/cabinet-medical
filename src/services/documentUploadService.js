import { supabase } from '../lib/supabase';

/**
 * Service d'upload de documents vers Supabase Storage
 */
class DocumentUploadService {
  /**
   * Upload un fichier vers un bucket Supabase
   * @param {string} bucketName - Nom du bucket Supabase
   * @param {File} file - Fichier à uploader
   * @param {Object} options - Options d'upload
   * @param {string} options.folder - Dossier de destination (optionnel)
   * @param {string} options.fileName - Nom personnalisé du fichier (optionnel)
   * @param {boolean} options.upsert - Remplacer si le fichier existe (défaut: false)
   * @param {Function} options.onProgress - Callback de progression (optionnel)
   * @returns {Promise<Object>} Résultat de l'upload avec URL publique
   */
  async uploadFile(bucketName, file, options = {}) {
    try {
      // Validation des paramètres
      if (!bucketName) {
        throw new Error('Le nom du bucket est requis');
      }
      
      if (!file) {
        throw new Error('Le fichier est requis');
      }

      // Validation du fichier
      this.validateFile(file);

      // Construction du chemin du fichier
      const filePath = this.buildFilePath(file, options);

      // Configuration de l'upload
      const uploadOptions = {
        cacheControl: '3600',
        upsert: options.upsert || false
      };

      // Upload du fichier
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, uploadOptions);

      if (error) {
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
      }

      // Récupération de l'URL publique
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Erreur upload document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple fichiers
   * @param {string} bucketName - Nom du bucket
   * @param {FileList|Array} files - Liste des fichiers
   * @param {Object} options - Options d'upload
   * @returns {Promise<Array>} Résultats des uploads
   */
  async uploadMultipleFiles(bucketName, files, options = {}) {
    const results = [];
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      // Callback de progression globale
      if (options.onProgress) {
        options.onProgress({
          currentFile: i + 1,
          totalFiles: fileArray.length,
          fileName: file.name,
          percentage: Math.round(((i + 1) / fileArray.length) * 100)
        });
      }

      const result = await this.uploadFile(bucketName, file, {
        ...options,
        folder: options.folder ? `${options.folder}/${i + 1}` : undefined
      });

      results.push({
        file: file.name,
        ...result
      });
    }

    return results;
  }

  /**
   * Supprime un fichier du bucket
   * @param {string} bucketName - Nom du bucket
   * @param {string} filePath - Chemin du fichier à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteFile(bucketName, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('Erreur suppression document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupère l'URL publique d'un fichier
   * @param {string} bucketName - Nom du bucket
   * @param {string} filePath - Chemin du fichier
   * @returns {string} URL publique
   */
  getPublicUrl(bucketName, filePath) {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Télécharge un fichier
   * @param {string} bucketName - Nom du bucket
   * @param {string} filePath - Chemin du fichier
   * @returns {Promise<Blob>} Contenu du fichier
   */
  async downloadFile(bucketName, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        throw new Error(`Erreur lors du téléchargement: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('Erreur téléchargement document:', error);
      throw error;
    }
  }

  /**
   * Liste les fichiers d'un dossier
   * @param {string} bucketName - Nom du bucket
   * @param {string} folder - Dossier à lister (optionnel)
   * @param {Object} options - Options de listage
   * @returns {Promise<Array>} Liste des fichiers
   */
  async listFiles(bucketName, folder = '', options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folder, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: { column: options.sortBy || 'name', order: options.order || 'asc' }
        });

      if (error) {
        throw new Error(`Erreur lors du listage: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('Erreur listage documents:', error);
      throw error;
    }
  }

  /**
   * Valide un fichier avant upload
   * @param {File} file - Fichier à valider
   * @throws {Error} Si le fichier n'est pas valide
   */
  validateFile(file) {
    // Taille maximale (50MB par défaut)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`Le fichier est trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`);
    }

    // Types de fichiers autorisés
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'text/html'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé: ${file.type}`);
    }
  }

  /**
   * Construit le chemin du fichier
   * @param {File} file - Fichier
   * @param {Object} options - Options
   * @returns {string} Chemin du fichier
   */
  buildFilePath(file, options) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    
    // Nom du fichier (personnalisé ou original avec timestamp)
    const fileName = options.fileName || 
      `${timestamp}_${randomId}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Chemin complet avec dossier optionnel
    return options.folder ? `${options.folder}/${fileName}` : fileName;
  }

  /**
   * Génère une URL signée pour un accès temporaire
   * @param {string} bucketName - Nom du bucket
   * @param {string} filePath - Chemin du fichier
   * @param {number} expiresIn - Durée d'expiration en secondes (défaut: 3600)
   * @returns {Promise<string>} URL signée
   */
  async createSignedUrl(bucketName, filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Erreur création URL signée: ${error.message}`);
      }

      return data.signedUrl;

    } catch (error) {
      console.error('Erreur création URL signée:', error);
      throw error;
    }
  }
}

// Instance singleton
const documentUploadService = new DocumentUploadService();

export default documentUploadService;

// Export des méthodes individuelles pour faciliter l'utilisation
export const {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getPublicUrl,
  downloadFile,
  listFiles,
  createSignedUrl
} = documentUploadService;
