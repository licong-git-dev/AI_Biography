import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

type ValidationState = 'idle' | 'validating' | 'success' | 'error';

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('gemini_api_key') || '';
      setApiKey(savedKey);
      setValidationState('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  const validateAndSave = async () => {
    if (!apiKey.trim()) {
      setValidationState('error');
      setErrorMessage('API Key 不能为空');
      return;
    }

    setValidationState('validating');
    setErrorMessage('');

    try {
      const isValid = await validateApiKey(apiKey.trim());

      if (isValid) {
        setValidationState('success');
        localStorage.setItem('gemini_api_key', apiKey.trim());
        onSave(apiKey.trim());

        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setValidationState('error');
        setErrorMessage('API Key 无效，请检查后重试');
      }
    } catch (error) {
      setValidationState('error');
      setErrorMessage('验证失败，请检查网络连接后重试');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#111111] rounded-3xl border border-[#2a2a2a] w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#222222]">
          <h2 className="text-lg font-semibold text-white">API Key 配置</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setValidationState('idle');
                  setErrorMessage('');
                }}
                placeholder="输入你的 Gemini API Key"
                className={`w-full px-4 py-3.5 pr-12 bg-[#0a0a0a] border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${
                  validationState === 'error'
                    ? 'border-red-500/50 focus:ring-red-500/30'
                    : validationState === 'success'
                    ? 'border-[#00FF88]/50 focus:ring-[#00FF88]/30'
                    : 'border-[#2a2a2a] focus:ring-[#00FF88]/30 focus:border-[#00FF88]/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error Message */}
            {validationState === 'error' && errorMessage && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {validationState === 'success' && (
              <div className="flex items-center gap-2 text-[#00FF88] text-sm">
                <CheckCircle size={14} />
                <span>验证成功</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            onClick={validateAndSave}
            disabled={validationState === 'validating' || validationState === 'success'}
            className="w-full py-3.5 px-4 bg-[#00FF88] hover:bg-[#00DD77] disabled:bg-[#00FF88]/30 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {validationState === 'validating' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                验证中...
              </>
            ) : validationState === 'success' ? (
              <>
                <CheckCircle size={18} />
                已保存
              </>
            ) : (
              '验证并保存'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// API Key validation function
async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    return response.ok;
  } catch (error) {
    console.error('API Key validation error:', error);
    return false;
  }
}

export default ApiKeyModal;
