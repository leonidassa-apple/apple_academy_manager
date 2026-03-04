
import React from 'react';
import { X, Printer, Download, Barcode } from 'lucide-react';

const QRDisplayModal = ({ isOpen, onClose, data, title }) => {
    if (!isOpen) return null;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir QR Code - ${title}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                        img { width: 300px; height: 300px; border: 1px solid #eee; }
                        h2 { margin-top: 20px; }
                        p { color: #666; }
                    </style>
                </head>
                <body>
                    <img src="${qrUrl}" />
                    <h2>${title}</h2>
                    <p>Código: ${data}</p>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 z-[110] overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-[2.5rem] bg-white shadow-2xl transition-all sm:w-full sm:max-w-md border border-slate-100">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex justify-between items-center text-white text-center">
                        <div className="flex-1">
                            <h3 className="text-xl font-black">QR Code do Exemplar</h3>
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">{title}</p>
                        </div>
                        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors absolute top-4 right-4">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-10 flex flex-col items-center">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner mb-8">
                            <img src={qrUrl} alt="QR Code" className="w-48 h-48 border-4 border-white rounded-2xl shadow-sm" />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl w-full mb-8 flex items-center justify-center gap-3 border border-slate-100">
                            <Barcode size={24} className="text-slate-400" />
                            <span className="font-mono font-black text-slate-800 tracking-tighter">{data}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest shadow-sm active:scale-95"
                            >
                                <Printer size={18} />
                                Imprimir
                            </button>
                            <a
                                href={qrUrl}
                                download={`qr_${data}.png`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95"
                            >
                                <Download size={18} />
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRDisplayModal;
