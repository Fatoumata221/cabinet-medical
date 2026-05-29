import React from 'react';
import { Eye, Download, Share2, Trash2, Users } from 'lucide-react';

const DocumentRow = ({ doc, selected, onSelect, onView, onDownload, onShare, onDelete, getDocumentIcon, getStatusIcon, getCategoryLabel, getRetentionInfo, getAccessLevelIcon }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-start">
          {getDocumentIcon(doc.type)}
          <div className="ml-2">
            <div className="text-xs font-medium text-gray-900">{doc.name}</div>
            <div className="text-xs text-gray-500">{getCategoryLabel(doc.category)}</div>
            {doc.contains && doc.contains.length > 0 && (
              <div className="text-xs text-gray-400 mt-0.5">
                Contient: {doc.contains.slice(0, 2).join(', ')}
                {doc.contains.length > 2 && ` +${doc.contains.length - 2}`}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {getCategoryLabel(doc.category)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          <Users className="w-3 h-3 text-gray-400 mr-1" />
          <div>
            <span className="text-xs text-gray-900">{doc.patient}</span>
            {doc.subCategory && (
              <div className="text-xs text-gray-500">{doc.subCategory}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-xs text-gray-900">{doc.date}</div>
        {doc.archivedAt && (
          <div className="text-xs text-blue-600">Archivé: {doc.archivedAt}</div>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-900">{doc.size}</td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          {getStatusIcon(doc.status)}
          <span className="ml-1 text-xs text-gray-900 capitalize">{doc.status}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={`text-xs font-medium ${getRetentionInfo(doc.retentionDate, doc.status).color}`}>
          {getRetentionInfo(doc.retentionDate, doc.status).text}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          {getAccessLevelIcon(doc.accessLevel)}
          {doc.shared && <Share2 className="w-3 h-3 text-purple-500 ml-1" />}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-1">
          <button onClick={onView} className="p-1 text-gray-400 hover:text-medical-primary">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDownload} className="p-1 text-gray-400 hover:text-medical-primary">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={onShare} className="p-1 text-gray-400 hover:text-medical-primary">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default DocumentRow;
