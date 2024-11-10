import React, { useState, useRef, useEffect } from 'react';
import { Database, Plus, X, Trash2, AlertCircle, Clipboard } from 'lucide-react';
import { firebaseManager, type FirebaseConfig } from '../lib/firebase';

interface FirebaseConfigProps {
  onConfigChange: (configId: string) => void;
  currentConfigId: string;
}

interface NewDatabaseConfig {
  id: string;
  name: string;
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const FirebaseConfig: React.FC<FirebaseConfigProps> = ({
  onConfigChange,
  currentConfigId
}) => {
  const [configs, setConfigs] = useState(firebaseManager.getConfigs());
  const [showAddNew, setShowAddNew] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPasteConfig, setShowPasteConfig] = useState(false);
  const [pastedConfig, setPastedConfig] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const [newConfig, setNewConfig] = useState<NewDatabaseConfig>({
    id: '',
    name: '',
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowAddNew(false);
        setShowDeleteConfirm(null);
        setShowPasteConfig(false);
      }
    };

    if (showAddNew || showDeleteConfirm || showPasteConfig) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddNew, showDeleteConfirm, showPasteConfig]);

  const handleAddNew = () => {
    const config: FirebaseConfig = {
      id: newConfig.id,
      name: newConfig.name,
      config: {
        apiKey: newConfig.apiKey,
        authDomain: newConfig.authDomain,
        projectId: newConfig.projectId,
        storageBucket: newConfig.storageBucket,
        messagingSenderId: newConfig.messagingSenderId,
        appId: newConfig.appId,
        measurementId: newConfig.measurementId
      }
    };

    const updatedConfigs = firebaseManager.addConfig(config);
    setConfigs(updatedConfigs);
    setShowAddNew(false);
    onConfigChange(config.id);
    setNewConfig({
      id: '',
      name: '',
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: ''
    });
  };

  const handleDelete = (configId: string) => {
    if (configs.length <= 1) {
      alert('Cannot delete the last database configuration');
      return;
    }

    const updatedConfigs = firebaseManager.removeConfig(configId);
    setConfigs(updatedConfigs);
    setShowDeleteConfirm(null);

    if (configId === currentConfigId) {
      onConfigChange(updatedConfigs[0].id);
    }
  };

  const handlePasteConfig = () => {
    try {
      const configText = pastedConfig.trim();
      const configObj = {};
      
      configText.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && trimmedLine !== '{' && trimmedLine !== '}') {
          const [key, value] = trimmedLine.split(':').map(part => part.trim());
          const cleanKey = key.replace(/["',]/g, '');
          const cleanValue = value.replace(/["',]/g, '');
          configObj[cleanKey] = cleanValue;
        }
      });

      const projectId = configObj['projectId'];
      if (!projectId) {
        throw new Error('Project ID not found in configuration');
      }

      setNewConfig({
        id: projectId,
        name: projectId.split('-')[0].charAt(0).toUpperCase() + projectId.split('-')[0].slice(1),
        apiKey: configObj['apiKey'] || '',
        authDomain: configObj['authDomain'] || '',
        projectId: projectId,
        storageBucket: configObj['storageBucket'] || '',
        messagingSenderId: configObj['messagingSenderId'] || '',
        appId: configObj['appId'] || '',
        measurementId: configObj['measurementId'] || ''
      });

      setShowPasteConfig(false);
    } catch (error) {
      alert('Invalid configuration format. Please check the pasted content.');
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-gray-600" />
        <select
          value={currentConfigId}
          onChange={(e) => onConfigChange(e.target.value)}
          className="form-select text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
        >
          {configs.map((config: FirebaseConfig) => (
            <option key={config.id} value={config.id}>
              {config.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAddNew(true)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          title="Add new database"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowDeleteConfirm(currentConfigId)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors text-red-500"
          title="Delete current database"
          disabled={configs.length <= 1}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showAddNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            style={{ maxHeight: '90vh' }}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg z-10">
              <h2 className="text-xl font-semibold">Add New Database</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPasteConfig(true)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Paste configuration"
                >
                  <Clipboard className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowAddNew(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database ID
                </label>
                <input
                  type="text"
                  value={newConfig.id}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., my-app"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., My App"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  value={newConfig.apiKey}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Firebase API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={newConfig.authDomain}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, authDomain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-app.firebaseapp.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={newConfig.projectId}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-app-id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Bucket
                </label>
                <input
                  type="text"
                  value={newConfig.storageBucket}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, storageBucket: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your-app.appspot.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Messaging Sender ID
                </label>
                <input
                  type="text"
                  value={newConfig.messagingSenderId}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, messagingSenderId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  value={newConfig.appId}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, appId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1:123456789:web:abc123def456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Measurement ID (optional)
                </label>
                <input
                  type="text"
                  value={newConfig.measurementId || ''}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, measurementId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="G-ABC123DEF4"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-lg">
              <button
                onClick={() => setShowAddNew(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNew}
                disabled={!newConfig.id || !newConfig.name || !newConfig.apiKey}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
              >
                Add Database
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasteConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Paste Firebase Configuration</h2>
              <button
                onClick={() => setShowPasteConfig(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={pastedConfig}
                onChange={(e) => setPastedConfig(e.target.value)}
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste your Firebase configuration here..."
              />
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowPasteConfig(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteConfig}
                disabled={!pastedConfig.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
              >
                Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Delete Database</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this database configuration? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseConfig;