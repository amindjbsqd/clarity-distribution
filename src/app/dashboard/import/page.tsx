'use client';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { Download, Upload, Check } from 'lucide-react';

export default function ImportPage() {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {['Download Template', 'Upload File', 'Preview & Validate', 'Confirm Import'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
            <span className={`text-sm font-medium ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            {i < 3 && <div className={`w-8 h-0.5 ${i < step ? 'bg-red-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <Download className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Download Excel Template</h3>
          <p className="text-sm text-gray-500 mb-6">Download the template, fill in your product data, then upload.</p>
          <div className="flex justify-center gap-3">
            <Button><Download className="w-4 h-4" />Download Template</Button>
            <Button variant="secondary" onClick={() => setStep(1)}>I have a file →</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-red-400 transition cursor-pointer" onClick={() => setStep(2)}>
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-sm font-semibold text-gray-700">Drop your Excel file here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600" />
            <div><p className="text-sm font-semibold text-emerald-800">File parsed successfully</p><p className="text-xs text-emerald-600">Ready for validation</p></div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Confirm Import</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-600" /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Import Complete!</h3>
          <p className="text-sm text-gray-500 mb-6">Products imported successfully.</p>
          <Button onClick={() => setStep(0)}>Import More</Button>
        </div>
      )}
    </div>
  );
}
