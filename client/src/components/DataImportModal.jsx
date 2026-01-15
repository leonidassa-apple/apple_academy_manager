import { useState, useRef } from 'react';
import { X, Upload, FileUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function DataImportModal({ isOpen, onClose, endpoint, onSuccess, title, helpText }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '', details: {} }
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setStatus({
                    type: 'success',
                    message: data.message,
                    details: data.detalhes
                });
                if (onSuccess) onSuccess();
                // Clear file after success
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setStatus({
                    type: 'error',
                    message: data.message || 'Erro na importação.'
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            setStatus({
                type: 'error',
                message: 'Erro ao conectar com o servidor.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setStatus(null);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">{title || 'Importar Dados'}</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {helpText && (
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
                            {helpText}
                        </div>
                    )}

                    <div className="flex flex-col items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileUp className="w-8 h-8 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Clique para escolher</span> ou arraste o arquivo
                                </p>
                                <p className="text-xs text-gray-500">CSV ou Excel (.xlsx)</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {file && (
                        <div className="flex items-center p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                            <span className="truncate flex-1 font-medium text-gray-700">{file.name}</span>
                            <button
                                onClick={() => {
                                    setFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                    setStatus(null);
                                }}
                                className="text-red-500 hover:text-red-700 ml-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {status && (
                        <div className={`p-4 rounded-md text-sm flex items-start ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            {status.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                            <div>
                                <p className="font-semibold">{status.message}</p>
                                {status.details && (
                                    <ul className="mt-1 list-disc list-inside text-xs opacity-90">
                                        <li>Total processado: {status.details.total_linhas}</li>
                                        <li>Sucessos: {status.details.sucessos}</li>
                                        {status.details.erros && status.details.erros.length > 0 && (
                                            <li className="mt-1">
                                                Erros:
                                                <div className="max-h-20 overflow-y-auto mt-1 pl-2 font-mono bg-white bg-opacity-50 rounded p-1">
                                                    {status.details.erros.map((err, idx) => (
                                                        <div key={idx} className="block">{err}</div>
                                                    ))}
                                                </div>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {loading ? 'Importando...' : 'Iniciar Importação'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
