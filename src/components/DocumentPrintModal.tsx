import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, Printer, QrCode, ShieldCheck, X } from 'lucide-react';
import QRCode from 'qrcode';
import type { ClearanceRequest } from '../types';

interface DocumentPrintModalProps {
  request: ClearanceRequest | null;
  onClose: () => void;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({ request, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!request) return;

    const verifyUrl = `${window.location.origin}/?verify=${request.referenceNumber}`;
    const payloadText = JSON.stringify({
      ref: request.referenceNumber,
      doc: request.documentType,
      name: request.residentName,
      hash: request.cryptoHash || 'PENDING-SIG',
      verify: verifyUrl
    });

    QRCode.toDataURL(payloadText, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 180,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(setQrDataUrl).catch(console.error);
  }, [request]);

  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  const getDocTitle = () => {
    switch (request.documentType) {
      case 'barangay_clearance': return 'BARANGAY CLEARANCE';
      case 'certificate_of_indigency': return 'CERTIFICATE OF INDIGENCY';
      case 'certificate_of_residency': return 'CERTIFICATE OF RESIDENCY';
      case 'business_permit': return 'BARANGAY BUSINESS CLEARANCE';
      default: return 'BARANGAY CERTIFICATION';
    }
  };

  const formattedDate = new Date(request.signedAt || request.submittedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-white/80 my-8 overflow-hidden print:m-0 print:p-0 print:shadow-none print:w-full print:max-w-none print:border-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/95 border-b border-white/10 text-white backdrop-blur-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-2xl text-blue-400 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white">Official Philippine Barangay Document</h3>
              <p className="text-xs text-slate-300 font-mono">Ref: {request.referenceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Container (A4 Proportional Print View) */}
        <div className="p-8 sm:p-12 bg-white text-slate-900 font-serif leading-relaxed relative min-h-[900px]">
          {/* Subtle Security Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <div className="text-center font-sans">
              <div className="text-9xl font-black">SECURE</div>
              <div className="text-7xl font-bold tracking-widest mt-2">BARANGAY E-PORTAL</div>
              <div className="text-5xl font-mono mt-4">IAS VERIFIED</div>
            </div>
          </div>

          {/* Double Security Border */}
          <div className="border-4 border-slate-900 p-1 rounded-sm">
            <div className="border border-slate-700 p-8 sm:p-10 relative">
              {/* Official Header */}
              <div className="text-center border-b-2 border-slate-900 pb-6 relative">
                {/* Official Barangay Emblem & Municipal Seals */}
                <div className="flex items-center justify-center gap-6 mb-3">
                  <div className="w-16 h-16 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center p-0.5 shadow-xs shrink-0 overflow-hidden">
                    <img
                      src="/brgy_seal.jpg"
                      alt="Barangay Cabucbucan Official Seal"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs uppercase tracking-widest font-sans font-medium text-slate-700">Republic of the Philippines</p>
                    <p className="text-xs uppercase tracking-wider font-sans font-medium text-slate-700">Province of Nueva Ecija • Municipality of Rizal</p>
                    <h2 className="text-base font-bold uppercase tracking-wider text-slate-950 font-sans">Barangay Cabucbucan</h2>
                    <p className="text-xs italic font-sans text-blue-900 font-semibold">Office of the Punong Barangay</p>
                  </div>
                  <div className="w-16 h-16 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center p-0.5 shadow-xs shrink-0 overflow-hidden">
                    <img
                      src="/brgy_seal.jpg"
                      alt="Barangay Cabucbucan Municipal Seal"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-slate-950 uppercase font-sans">
                    {getDocTitle()}
                  </h1>
                  <p className="text-xs font-mono font-sans text-slate-500 mt-1">Control No: {request.referenceNumber}</p>
                </div>
              </div>

              {/* Document Body */}
              <div className="py-8 space-y-6 text-sm sm:text-base leading-relaxed text-slate-800">
                <p className="font-semibold font-sans uppercase text-xs tracking-wider text-slate-700">
                  TO WHOM IT MAY CONCERN:
                </p>

                {request.documentType === 'barangay_clearance' && (
                  <>
                    <p className="indent-8 text-justify">
                      This is to certify that <strong className="font-bold uppercase tracking-wide text-slate-950">{request.residentName}</strong>, of legal age, Filipino, is a bona fide resident of <strong className="font-semibold">{request.residentAddress}</strong>, covered under the jurisdiction of Barangay Cabucbucan, Municipality of Rizal, Province of Nueva Ecija.
                    </p>
                    <p className="indent-8 text-justify">
                      Based on the official blotter records and registry of this Barangay as of <strong className="font-semibold">{formattedDate}</strong>, the aforementioned individual is a person of good moral character, a peace-loving and law-abiding citizen, with <strong className="font-semibold text-slate-950">NO DEROGATORY RECORD</strong> or pending complaint filed against them before the Lupong Tagapamayapa.
                    </p>
                    <p className="indent-8 text-justify">
                      This Clearance is hereby issued upon the request of the interested party for the purpose of: <strong className="font-bold underline uppercase text-slate-950">{request.purpose}</strong> and for whatever legal purposes it may serve.
                    </p>
                  </>
                )}

                {request.documentType === 'certificate_of_indigency' && (
                  <>
                    <p className="indent-8 text-justify">
                      This is to certify that <strong className="font-bold uppercase tracking-wide text-slate-950">{request.residentName}</strong>, of legal age, is a bona fide resident of <strong className="font-semibold">{request.residentAddress}</strong>, Barangay Cabucbucan, Rizal, Nueva Ecija.
                    </p>
                    <p className="indent-8 text-justify">
                      It is further certified that the said individual and their family belong to the <strong className="font-semibold text-slate-950">INDIGENT / LOW-INCOME BRACKET</strong> of this community with an estimated monthly family income of <strong className="font-semibold">₱{(request.monthlyIncome || 8000).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>, and is therefore eligible for social assistance.
                    </p>
                    <p className="indent-8 text-justify">
                      This Certificate of Indigency is issued for the specific purpose of applying for: <strong className="font-bold underline uppercase text-slate-950">{request.purpose}</strong> (Assistance Type: {request.assistanceType || 'Government / Medical Aid'}).
                    </p>
                  </>
                )}

                {request.documentType === 'certificate_of_residency' && (
                  <>
                    <p className="indent-8 text-justify">
                      This is to certify that <strong className="font-bold uppercase tracking-wide text-slate-950">{request.residentName}</strong> is a permanent resident of <strong className="font-semibold">{request.residentAddress}</strong> in Barangay Cabucbucan, Municipality of Rizal, Nueva Ecija.
                    </p>
                    <p className="indent-8 text-justify">
                      Our records confirm continuous residency in good standing. Issued for the purpose of: <strong className="font-bold underline uppercase text-slate-950">{request.purpose}</strong>.
                    </p>
                  </>
                )}

                {request.documentType === 'business_permit' && (
                  <>
                    <p className="indent-8 text-justify">
                      This is to certify that the business establishment known as <strong className="font-bold uppercase text-slate-950">{request.businessName || 'COMMERCIAL ENTERPRISE'}</strong>, operated by <strong className="font-bold uppercase">{request.residentName}</strong>, located at <strong className="font-semibold">{request.businessAddress || request.residentAddress}</strong>, has complied with all Barangay documentary requirements and local ordinances of Barangay Cabucbucan.
                    </p>
                    <p className="indent-8 text-justify">
                      Nature of Business: <strong className="font-semibold">{request.businessNature || 'General Merchandise / Retail'}</strong>. Purpose: <strong className="font-bold underline uppercase">{request.purpose}</strong>.
                    </p>
                  </>
                )}

                <p className="indent-8 text-justify">
                  Given and signed this <strong className="font-semibold">{formattedDate}</strong> at the Office of the Punong Barangay, Barangay Cabucbucan, Municipality of Rizal, Province of Nueva Ecija, Philippines.
                </p>
              </div>

              {/* Signatures & Official Cryptographic Seals */}
              <div className="pt-8 mt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                {/* Left: Applicant Signature & Thumbmark box */}
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border border-slate-400 rounded flex flex-col items-center justify-center p-1 text-[9px] text-slate-500 bg-slate-50 text-center">
                      <span>RIGHT THUMB MARK</span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-44 border-b border-slate-900 pb-1 text-center font-semibold text-slate-900">
                        {request.residentName}
                      </div>
                      <p className="text-[10px] text-slate-500 text-center uppercase">Signature of Applicant</p>
                      <p className="text-[9px] font-mono text-slate-500">ID Ref: {request.idAttachmentName || 'PhilSys ID'}</p>
                      <p className="text-[9px] font-mono text-slate-500">O.R. No: {request.orNumber || 'OR-CAB-2026-8812'}</p>
                      <p className="text-[9px] font-mono text-slate-500">Fee: ₱{request.feeAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Punong Barangay Official Seal & Digital Signature */}
                <div className="text-center font-sans space-y-1 relative">
                  {request.cryptoHash ? (
                    <div className="relative inline-block mb-1">
                      {/* Realistic Electronic Signature Vector */}
                      <div className="relative h-14 w-48 mx-auto -mb-4 z-10 pointer-events-none select-none flex items-center justify-center">
                        <svg viewBox="0 0 200 60" className="w-full h-full text-blue-900 drop-shadow-xs" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          {/* Stylized C. Laugo Cursive Signature */}
                          <path d="M 20 42 C 25 15, 38 10, 42 28 C 45 42, 50 48, 56 35 C 60 26, 64 38, 70 32 C 76 26, 82 40, 90 25 C 100 8, 115 12, 110 38 C 105 52, 95 56, 125 36 C 145 22, 160 30, 185 20" />
                          <path d="M 40 30 Q 120 48 180 34" strokeWidth="1.8" strokeDasharray="180" />
                          <path d="M 30 18 L 48 44" strokeWidth="2" />
                          <path d="M 128 20 C 132 10, 142 12, 140 28 Q 142 42 152 35" strokeWidth="2" />
                        </svg>
                      </div>

                      <div className="p-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-[10px] font-medium inline-flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold">DIGITALLY SIGNED & VERIFIED (HMAC-SHA256)</span>
                      </div>
                      <p className="font-mono text-[9px] text-emerald-700 mt-0.5">Key: {request.digitalSignatureFingerprint || 'KEY-FP-NE-CABUCBUCAN-01'}</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="h-10 flex items-center justify-center text-slate-300 font-sans text-xs italic">
                        [ Official Signatory Placeholder ]
                      </div>
                      <p className="text-xs text-amber-700 font-medium italic">Signature Pending Punong Barangay Digital Seal</p>
                    </div>
                  )}

                  <div className="pt-2 border-t-2 border-slate-900 w-56 mx-auto">
                    <h3 className="font-bold text-sm uppercase text-slate-950 tracking-wide">
                      {request.signedByOfficialName || 'HON. CORNELIO LAUGO'}
                    </h3>
                    <p className="text-xs font-semibold text-blue-900">Punong Barangay</p>
                    <p className="text-[10px] text-slate-500">Barangay Cabucbucan, Rizal, N.E.</p>
                  </div>
                </div>
              </div>

              {/* Cryptographic Verification Footer & Verifiable QR */}
              <div className="mt-8 pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs bg-slate-50 p-4 rounded-lg">
                <div className="space-y-1 text-left flex-1">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>IAS CRYPTOGRAPHIC INTEGRITY PROOF (ANTI-FORGERY)</span>
                  </div>
                  <p className="text-[10px] text-slate-600">
                    Scan the QR code to validate document authenticity against the immutable Barangay database.
                  </p>
                  <p className="text-[9px] font-mono text-slate-700 break-all bg-white p-1.5 rounded border border-slate-200">
                    <strong className="text-slate-900">SHA-256 HASH:</strong> {request.cryptoHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </p>
                </div>

                {qrDataUrl && (
                  <div className="flex flex-col items-center bg-white p-2 rounded border border-slate-300 shadow-sm shrink-0">
                    <img src={qrDataUrl} alt="Document Verification QR" className="w-24 h-24" />
                    <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase font-semibold">VERIFY AUTHENTICITY</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
