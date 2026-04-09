import React from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';

const DragDropDemo = ({ onClose }) => {
    return (
        <div className="absolute inset-0 z-10">
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-6 relative">
                    <button onClick={onClose} className="absolute -top-4 -right-4 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                        <X size={16} className="text-gray-600" />
                    </button>
                    <div className="relative">
                        <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                            <div className="w-16 h-16 bg-blue-200 rounded-xl flex items-center justify-center animate-bounce">
                                <Plus size={32} className="text-blue-600" />
                            </div>
                        </div>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <ChevronDown size={20} className="text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700">Glissez pour créer un rendez-vous</h3>
                        <p className="text-sm text-gray-500 max-w-md">Cliquez et glissez sur les créneaux horaires pour sélectionner une durée et créer un nouveau rendez-vous.</p>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
        </div>
    );
};

export default DragDropDemo;
