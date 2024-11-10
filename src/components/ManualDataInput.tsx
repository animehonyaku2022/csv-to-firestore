import React, { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const ManualDataInput: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setStatus('error');
      setErrorMessage('Name is required');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      await addDoc(collection(db, 'uploadedData'), {
        ...formData,
        timestamp: new Date().toISOString()
      });
      setStatus('success');
      setFormData({ name: '', description: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to upload data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Manual Data Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter name"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Enter description"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors
              ${isSubmitting ? 
                'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit
              </>
            )}
          </button>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Data uploaded successfully</span>
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 mt-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ManualDataInput;