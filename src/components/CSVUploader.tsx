import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileWarning, CheckCircle, AlertCircle, FileText, Settings, Eye } from 'lucide-react';
import Papa from 'papaparse';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { firebaseManager } from '../lib/firebase';
import DataReview from './DataReview';
import CollectionConfig from './CollectionConfig';
import FirebaseConfig from './FirebaseConfig';

interface CSVData {
  [key: string]: any;
}

interface CollectionSettings {
  collectionName: string;
  requiredFields: string[];
}

const CSVUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [parsedData, setParsedData] = useState<CSVData[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [currentConfigId, setCurrentConfigId] = useState(firebaseManager.getConfigs()[0].id);
  const [collectionSettings, setCollectionSettings] = useState<CollectionSettings>({
    collectionName: 'vocabulary',
    requiredFields: ['category', 'word', 'kanji', 'romaji', 'english', 'part_of_speech', 'jlpt_level']
  });

  useEffect(() => {
    if (parsedData.length > 0) {
      const validationError = validateData(parsedData);
      if (validationError) {
        setError(validationError);
        setParsedData([]);
      } else {
        setError(null);
      }
    }
  }, [collectionSettings]);

  const handleConfigChange = async (configId: string) => {
    try {
      setCurrentConfigId(configId);
      await firebaseManager.switchConfig(configId);
      setError(null);
    } catch (err) {
      setError('Failed to switch Firebase configuration');
    }
  };

  const validateData = (data: CSVData[]): string | null => {
    if (data.length === 0) return 'CSV data is empty';
    if (data.length > 10000) return 'CSV data too large (max 10,000 rows)';
    
    const firstRow = data[0];
    
    for (const field of collectionSettings.requiredFields) {
      if (!(field in firstRow)) {
        return `Missing required field: ${field}`;
      }
    }
    
    return null;
  };

  const processData = (data: CSVData[]): CSVData[] => {
    return data.map(row => {
      const processedRow: CSVData = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };
      
      for (const field of collectionSettings.requiredFields) {
        if (field in row) {
          processedRow[field] = row[field];
        }
      }
      
      for (const field in row) {
        if (!processedRow.hasOwnProperty(field)) {
          processedRow[field] = row[field];
        }
      }
      
      return processedRow;
    });
  };

  const parseCSV = async (input: File | string): Promise<CSVData[]> => {
    return new Promise((resolve, reject) => {
      const config = {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<CSVData>) => {
          if (results.errors.length > 0) {
            reject(new Error('Error parsing CSV data'));
          } else {
            resolve(results.data);
          }
        },
        error: (error: Papa.ParseError) => {
          reject(error);
        }
      };

      if (typeof input === 'string') {
        Papa.parse(input, config);
      } else {
        Papa.parse(input, config);
      }
    });
  };

  const uploadToFirestore = async (data: CSVData[]): Promise<void> => {
    const BATCH_SIZE = 500;
    const db = firebaseManager.getCurrentDb();
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const currentBatch = data.slice(i, i + BATCH_SIZE);
      
      currentBatch.forEach((item) => {
        const docRef = doc(collection(db, collectionSettings.collectionName));
        batch.set(docRef, item);
      });
      
      await batch.commit();
      const currentProgress = Math.min(((i + BATCH_SIZE) / data.length) * 100, 100);
      setProgress(currentProgress);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setPastedText('');
      setError(null);
      setSuccess(false);
      try {
        const data = await parseCSV(file);
        const validationError = validateData(data);
        if (validationError) {
          throw new Error(validationError);
        }
        setParsedData(data);
        setShowReview(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing CSV file');
        setParsedData([]);
      }
    } else {
      setError('Please select a valid CSV file');
      setSelectedFile(null);
      setParsedData([]);
    }
  };

  const handleTextChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setPastedText(text);
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    
    if (text.trim()) {
      try {
        const data = await parseCSV(text);
        const validationError = validateData(data);
        if (validationError) {
          throw new Error(validationError);
        }
        setParsedData(data);
        setShowReview(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing CSV content');
        setParsedData([]);
      }
    } else {
      setParsedData([]);
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    
    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);
      
      const validationError = validateData(parsedData);
      
      if (validationError) {
        throw new Error(validationError);
      }
      
      const processedData = processData(parsedData);
      await uploadToFirestore(processedData);
      setSuccess(true);
      setSelectedFile(null);
      setPastedText('');
      setParsedData([]);
      setShowReview(false);
      
      const fileInput = document.getElementById('csvInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setPastedText('');
      setError(null);
      setSuccess(false);
      try {
        const data = await parseCSV(file);
        const validationError = validateData(data);
        if (validationError) {
          throw new Error(validationError);
        }
        setParsedData(data);
        setShowReview(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing CSV file');
        setParsedData([]);
      }
    } else {
      setError('Please drop a valid CSV file');
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <FirebaseConfig
          onConfigChange={handleConfigChange}
          currentConfigId={currentConfigId}
        />
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configure Collection
        </button>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isUploading ? 'border-blue-400 bg-blue-50' : 
          error ? 'border-red-400 bg-red-50' :
          success ? 'border-green-400 bg-green-50' :
          'border-gray-300 hover:border-blue-400 bg-white'}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csvInput"
          disabled={isUploading}
        />
        
        <label
          htmlFor="csvInput"
          className="flex flex-col items-center cursor-pointer"
        >
          {error ? (
            <FileWarning className="w-12 h-12 text-red-500 mb-4" />
          ) : success ? (
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          ) : (
            <Upload className="w-12 h-12 text-blue-500 mb-4" />
          )}
          
          <span className="text-lg font-medium mb-2">
            {selectedFile ? selectedFile.name : 'Choose a CSV file or drag it here'}
          </span>
          
          <span className="text-sm text-gray-500">
            Collection: {collectionSettings.collectionName}
            <br />
            Required fields: {collectionSettings.requiredFields.join(', ')}
          </span>
        </label>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Or paste CSV content</h2>
        </div>
        <textarea
          value={pastedText}
          onChange={handleTextChange}
          placeholder="Paste your CSV content here..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isUploading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {isUploading && (
        <div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 mt-2">
            Uploading... {Math.round(progress)}%
          </span>
        </div>
      )}

      {parsedData.length > 0 && !isUploading && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowReview(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Review Data ({parsedData.length} rows)
          </button>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={parsedData.length === 0 || isUploading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
          ${parsedData.length === 0 || isUploading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'}`}
      >
        {isUploading ? 'Uploading...' : 'Upload to Database'}
      </button>

      {showReview && (
        <DataReview
          data={parsedData}
          onClose={() => setShowReview(false)}
          onDataUpdate={setParsedData}
        />
      )}

      {showConfig && (
        <CollectionConfig
          settings={collectionSettings}
          onUpdate={(newSettings) => {
            setCollectionSettings(newSettings);
            setShowConfig(false);
          }}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
};

export default CSVUploader;