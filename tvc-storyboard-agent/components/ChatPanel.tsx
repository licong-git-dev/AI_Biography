import React, { useRef, useEffect, useState } from 'react';
import { Message, DynamicOption, SavedModel } from '../types';
import { Send, Plus, Users, Pencil, ChevronRight, ChevronUp } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: DynamicOption[];
  onOptionClick: (opt: DynamicOption) => void;
  isProcessing: boolean;
  onSettingsClick: () => void;
  width?: number;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  recentModels?: SavedModel[];
  onModelSelect?: (model: SavedModel) => void;
  onOpenModelLibrary?: () => void;
  isModelsExpanded?: boolean;
  onModelsExpandedChange?: (expanded: boolean) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  input,
  setInput,
  onSend,
  onUpload,
  options,
  onOptionClick,
  isProcessing,
  onSettingsClick,
  width = 420,
  projectName = 'Untitled Project',
  onProjectNameChange,
  recentModels = [],
  onModelSelect,
  onOpenModelLibrary,
  isModelsExpanded: externalIsModelsExpanded,
  onModelsExpandedChange
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(projectName);
  const [internalIsModelsExpanded, setInternalIsModelsExpanded] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 使用外部控制的状态（如果提供），否则使用内部状态
  const isModelsExpanded = externalIsModelsExpanded ?? internalIsModelsExpanded;
  const setIsModelsExpanded = (expanded: boolean) => {
    if (onModelsExpandedChange) {
      onModelsExpandedChange(expanded);
    } else {
      setInternalIsModelsExpanded(expanded);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, options]);

  useEffect(() => {
    setEditedName(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // max 120px (~5 lines)
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleNameSubmit = () => {
    const trimmed = editedName.trim();
    if (trimmed && onProjectNameChange) {
      onProjectNameChange(trimmed);
    } else {
      setEditedName(projectName);
    }
    setIsEditingName(false);
  };

  return (
    <div
      className="flex flex-col bg-[#0d0d0d] text-white z-20 flex-shrink-0 rounded-3xl overflow-hidden"
      style={{ width: `${width}px`, height: 'calc(100% - 24px)', marginTop: '12px', marginBottom: '12px', marginLeft: '12px' }}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setEditedName(projectName);
                  setIsEditingName(false);
                }
              }}
              className="text-xl font-semibold text-white bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1 focus:outline-none focus:border-[#00FF88]"
            />
          ) : (
            <>
              <h1 className="text-xl font-semibold text-white">{projectName}</h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1.5 bg-[#333] hover:bg-[#444] rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <Pencil size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Badge */}
      <div className="px-5 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] rounded-full border border-[#2a2a2a]">
          <span className="text-lg">👑</span>
          <span className="text-sm font-medium text-white">Art Director</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 space-y-5 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'assistant' ? (
              <div className="space-y-3 bg-[#111111] rounded-2xl p-4 border border-[#1a1a1a] border-l-2 border-l-[#00FF88]/40">
                <div className="text-[15px] leading-relaxed text-gray-200 whitespace-pre-wrap">
                  {msg.content}
                  {msg.isStreaming && (
                    <span className="inline-block w-[2px] h-[1.1em] bg-[#00FF88] ml-[2px] align-middle animate-cursor-blink" />
                  )}
                </div>
                {msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="attachment"
                        className="w-40 h-40 object-cover rounded-2xl border border-[#2a2a2a]"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-end">
                <div className="max-w-[85%]">
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3 rounded-2xl text-[15px] text-gray-200 whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 justify-end">
                      {msg.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="attachment"
                          className="w-32 h-32 object-cover rounded-2xl border border-[#2a2a2a]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Dynamic Options */}
      {options.length > 0 && (
        <div className="px-5 py-4">
          <div className="flex flex-col gap-2">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onOptionClick(opt)}
                disabled={isProcessing}
                className="w-full bg-[#00DD77] hover:bg-[#00CC66] disabled:opacity-50 text-black font-medium py-2.5 px-5 rounded-xl transition-all active:scale-[0.98] text-sm"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-5 pt-2">
        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] overflow-hidden">
          {/* Input Field */}
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="描述产品或粘贴脚本内容..."
              className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-[15px] resize-none overflow-y-auto scrollbar-hide"
              style={{ minHeight: '24px', maxHeight: '120px' }}
              rows={1}
              disabled={isProcessing}
            />
          </div>

          {/* Recent Models - Expandable */}
          {isModelsExpanded && recentModels.length > 0 && (
            <div className="px-4 pb-3 border-t border-[#222222] pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">最近模特</span>
                <button
                  onClick={onOpenModelLibrary}
                  className="text-purple-400 text-xs hover:text-purple-300 transition-colors flex items-center gap-0.5"
                >
                  全部 <ChevronRight size={12} />
                </button>
              </div>
              <div className="flex gap-2">
                {recentModels.slice(0, 3).map(model => (
                  <button
                    key={model.id}
                    onClick={() => onModelSelect?.(model)}
                    className="w-32 h-32 rounded-lg overflow-hidden border border-[#333] hover:border-purple-500/50 transition-all group relative"
                    title={model.name}
                  >
                    {/* v3.8: 新布局左侧 1/4 是主形象，backgroundSize 400% 使左 1/4 填满缩略图 */}
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${model.refImage})`,
                        backgroundSize: '400%',
                        backgroundPosition: '0% 15%',
                      }}
                    />
                    <div className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-[#252525] rounded-lg text-gray-400 hover:text-white transition-colors"
                title="添加"
              >
                <Plus size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.txt,.pdf,.doc,.docx"
                className="hidden"
                onChange={onUpload}
              />

              <button
                onClick={() => {
                  if (recentModels.length > 0) {
                    setIsModelsExpanded(!isModelsExpanded);
                  } else {
                    onOpenModelLibrary?.();
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm ${
                  isModelsExpanded
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400'
                }`}
              >
                <Users size={16} />
                模特库
                {recentModels.length > 0 && (
                  <ChevronUp
                    size={14}
                    className={`transition-transform ${isModelsExpanded ? '' : 'rotate-180'}`}
                  />
                )}
              </button>
            </div>

            <button
              onClick={onSend}
              disabled={!input.trim() || isProcessing}
              className="p-2.5 bg-[#00FF88] hover:bg-[#00DD77] text-black rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
