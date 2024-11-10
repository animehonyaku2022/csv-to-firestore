import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Edit2, Save, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface DataReviewProps {
  data: any[];
  onClose: () => void;
  onDataUpdate: (data: any[]) => void;
}

const DataReview: React.FC<DataReviewProps> = ({ data, onClose, onDataUpdate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const itemsPerPage = 10;

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const currentData = data.slice(startIndex, endIndex);

  const handleEdit = (index: number) => {
    setEditingRow(index);
    setEditedData({ ...data[startIndex + index] });
  };

  const handleSave = (index: number) => {
    const newData = [...data];
    newData[startIndex + index] = editedData;
    onDataUpdate(newData);
    setEditingRow(null);
    setEditedData(null);
  };

  const handleDelete = (index: number) => {
    const newData = [...data];
    newData.splice(startIndex + index, 1);
    onDataUpdate(newData);
  };

  const handleInputChange = (column: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const actualIndex = startIndex + index;
    const newData = [...data];
    if (direction === 'up' && actualIndex > 0) {
      [newData[actualIndex], newData[actualIndex - 1]] = [newData[actualIndex - 1], newData[actualIndex]];
      onDataUpdate(newData);
      if (index === 0 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } else if (direction === 'down' && actualIndex < data.length - 1) {
      [newData[actualIndex], newData[actualIndex + 1]] = [newData[actualIndex + 1], newData[actualIndex]];
      onDataUpdate(newData);
      if (index === itemsPerPage - 1 && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Data Review</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 border-b">Actions</th>
                {columns.map(column => (
                  <th
                    key={column}
                    className="p-3 text-left text-sm font-semibold text-gray-600 border-b"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-3 border-b">
                    <div className="flex gap-2">
                      {editingRow === index ? (
                        <button
                          onClick={() => handleSave(index)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveRow(index, 'up')}
                        disabled={startIndex + index === 0}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveRow(index, 'down')}
                        disabled={startIndex + index === data.length - 1}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  {columns.map(column => (
                    <td key={column} className="p-3 border-b">
                      {editingRow === index ? (
                        <input
                          type="text"
                          value={editedData[column]}
                          onChange={(e) => handleInputChange(column, e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      ) : (
                        row[column]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {data.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataReview;