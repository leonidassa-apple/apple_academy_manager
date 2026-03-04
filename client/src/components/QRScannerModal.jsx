
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    useEffect(() => {
        if (isOpen) {
            const scanner = new Html5QrcodeScanner(
                'reader',
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, (error) => {
                // Ignore errors
            });

            return () => {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            };
        }
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-[2rem] bg-white shadow-2xl transition-all sm:w-full sm:max-w-lg border border-slate-100">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <Camera size={24} />
                            <h3 className="text-xl font-bold">Escanear QR Code</h3>
                        </div>
                        <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-6">
                        <div id="reader" className="w-full"></div>
                        <p className="mt-4 text-center text-sm text-slate-500 font-medium">
                            Aponte a câmera para o código de barras ou QR code do exemplar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
