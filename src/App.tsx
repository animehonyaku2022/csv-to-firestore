import React from 'react';
import CSVUploader from './components/CSVUploader';
import FirebaseStatus from './components/FirebaseStatus';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Data Uploader
          </h1>
          <p className="text-gray-600 mb-4">
            Upload data via CSV file or paste CSV content
          </p>
          <FirebaseStatus />
        </div>

        <CSVUploader />
      </div>
    </div>
  );
}

export default App;