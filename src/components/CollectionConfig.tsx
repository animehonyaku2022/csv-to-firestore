import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';

interface CollectionSettings {
  collectionName: string;
  requiredFields: string[];
}

interface CollectionConfigProps {
  settings: CollectionSettings;
  onUpdate: (settings: CollectionSettings) => void;
  onClose: () => void;
}

const CollectionConfig: React.FC<CollectionConfigProps> = ({
  settings,
  onUpdate,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<CollectionSettings>({ ...settings });
  const [newField, setNewField] = useState('');
  const [draggedField, setDraggedField] = useState<string | null>(null);

  const handleSave = () => {
    if (localSettings.collectionName.trim() && localSettings.requiredFields.length > 0) {
      onUpdate(localSettings);
      onClose();
    }
  };

  const addField = () => {
    if (newField.trim() && !localSettings.requiredFields.includes(newField.trim())) {
      setLocalSettings(prev => ({
        ...prev,
        requiredFields: [...prev.requiredFields, newField.trim()]
      }));
      setNewField('');
    }
  };

  const removeField = (field: string) => {
    setLocalSettings(prev => ({
      ...prev,
      requiredFields: prev.requiredFields.filter(f => f !== field)
    }));
  };

  const handleDragStart = (field: string) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    if (!draggedField || draggedField === targetField) return;

    const fields = [...localSettings.requiredFields];
    const draggedIndex = fields.indexOf(draggedField);
    const targetIndex = fields.indexOf(targetField);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item
    fields.splice(draggedIndex, 1);
    // Insert at new position
    fields.splice(targetIndex, 0, draggedField);

    setLocalSettings(prev => ({
      ...prev,
      requiredFields: fields
    }));
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  const moveField = (field: string, direction: 'up' | 'down') => {
    const fields = [...localSettings.requiredFields];
    const currentIndex = fields.indexOf(field);
    
    if (direction === 'up' && currentIndex > 0) {
      [fields[currentIndex], fields[currentIndex - 1]] = [fields[currentIndex - 1], fields[currentIndex]];
    } else if (direction === 'down' && currentIndex < fields.length - 1) {
      [fields[currentIndex], fields[currentIndex + 1]] = [fields[currentIndex + 1], fields[currentIndex]];
    }

    setLocalSettings(prev => ({
      ...prev,
      requiredFields: fields
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Collection Configuration</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection Name
            </label>
            <input
              type="text"
              value={localSettings.collectionName}
              onChange={(e) => setLocalSettings(prev => ({
                ...prev,
                collectionName: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter collection name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Fields (drag to reorder)
            </label>
            <div className="space-y-2">
              {localSettings.requiredFields.map((field, index) => (
                <div
                  key={field}
                  draggable
                  onDragStart={() => handleDragStart(field)}
                  onDragOver={(e) => handleDragOver(e, field)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between bg-gray-50 px-3 py-2 rounded cursor-move
                    ${draggedField === field ? 'opacity-50' : ''}
                    ${draggedField && draggedField !== field ? 'border-t-2 border-blue-300' : ''}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span>{field}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveField(field, 'up')}
                      disabled={index === 0}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveField(field, 'down')}
                      disabled={index === localSettings.requiredFields.length - 1}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeField(field)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add new field"
                onKeyPress={(e) => e.key === 'Enter' && addField()}
              />
              <button
                onClick={addField}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionConfig;