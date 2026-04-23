import React, { useEffect, useRef, useState } from 'react';
import {
  useCharacterStore,
  useChapterStore,
  useChatStore,
  useEpisodeStore,
  useShotStore,
  useUIStore,
} from '../../stores';
import type { ChatMessage } from './chatService';
import { streamChatReply } from './chatService';
import { ApiKeyMissingError } from '../../services/geminiClient';
import Spinner from '../../components/Spinner';

const ChatPanel: React.FC = () => {
  const messages = useChatStore((s) => s.messages);
  const append = useChatStore((s) => s.append);
  const appendToLast = useChatStore((s) => s.appendToLast);
  const clear = useChatStore((s) => s.clear);
  const streaming = useChatStore((s) => s.streaming);
  const setStreaming = useChatStore((s) => s.setStreaming);

  const activeCharacterId = useCharacterStore((s) => s.activeId);
  const getCharacter = useCharacterStore((s) => s.getById);
  const activeEpisodeId = useEpisodeStore((s) => s.activeId);
  const getEpisode = useEpisodeStore((s) => s.getById);
  const byEpisode = useShotStore((s) => s.byEpisode);
  const chapters = useChapterStore((s) => s.chapters);

  const openApiKey = useUIStore((s) => s.openApiKeyModal);
  const centerTab = useUIStore((s) => s.centerTab);

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 自动滚到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const buildContext = () => {
    const character = activeCharacterId
      ? (getCharacter(activeCharacterId) ?? null)
      : null;
    const episode = activeEpisodeId
      ? (getEpisode(activeEpisodeId) ?? null)
      : null;
    const episodeShots = activeEpisodeId ? byEpisode(activeEpisodeId) : [];

    // 章节只在 chapters tab 且没有其他上下文时启用第一章预览
    const chapter =
      centerTab === 'chapters' && !character && !episode
        ? (chapters[0] ?? null)
        : null;

    return { character, episode, episodeShots, chapter };
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    setError(null);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    append(userMsg);
    setInput('');

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    append(assistantMsg);
    setStreaming(true);

    try {
      const historyForAI = useChatStore.getState().messages.slice(0, -2); // 不含刚 append 的 user + 空 assistant
      const stream = streamChatReply({
        messages: historyForAI,
        userInput: trimmed,
        context: buildContext(),
      });
      for await (const chunk of stream) {
        appendToLast(chunk);
      }
    } catch (e) {
      if (e instanceof ApiKeyMissingError) {
        setError(e.message);
        openApiKey();
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
      // 把最后那条空 assistant 填成错误占位
      if (useChatStore.getState().messages.slice(-1)[0]?.content === '') {
        appendToLast('（生成失败，请重试）');
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeCharacter = activeCharacterId
    ? getCharacter(activeCharacterId)
    : null;
  const activeEpisode = activeEpisodeId ? getEpisode(activeEpisodeId) : null;

  return (
    <div className="flex h-full flex-col">
      {/* 上下文徽章 */}
      <div className="shrink-0 border-b border-neutral-800 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wide text-neutral-500">
          对话上下文
        </div>
        <div className="mt-0.5 flex flex-wrap gap-1 text-[11px]">
          {activeCharacter && (
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300">
              角色 · {activeCharacter.name}
            </span>
          )}
          {activeEpisode && (
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300">
              EP{String(activeEpisode.episodeNumber).padStart(2, '0')} · 《{activeEpisode.title}》
            </span>
          )}
          {!activeCharacter && !activeEpisode && (
            <span className="text-neutral-600 italic">
              未选中任何对象 · 可问全局性问题
            </span>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div
        ref={listRef}
        className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3 space-y-3"
      >
        {messages.length === 0 && (
          <div className="rounded border border-dashed border-neutral-800 bg-neutral-900/30 p-4 text-center text-[11px] text-neutral-500">
            试试问：
            <ul className="mt-2 space-y-1 text-left">
              <li>· 这一集的开头 3 秒怎么抓人？</li>
              <li>· 这个角色的参考图生成时该强调什么？</li>
              <li>· 第一章适合拆成几集？</li>
              <li>· 怎么给这一集写一个金句字幕？</li>
            </ul>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-sky-900/40 text-sky-100'
                  : 'bg-neutral-900 text-neutral-200'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {m.content || (
                  <span className="text-neutral-500 italic">思考中…</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="shrink-0 border-t border-red-900/40 bg-red-950/30 px-3 py-2 text-[11px] text-red-300">
          {error}
        </div>
      )}

      {/* 输入区 */}
      <div className="shrink-0 border-t border-neutral-800 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={streaming ? '生成中…' : 'Enter 发送 · Shift+Enter 换行'}
          disabled={streaming}
          rows={2}
          className="w-full resize-none rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            onClick={clear}
            disabled={streaming || messages.length === 0}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 disabled:opacity-40"
            type="button"
          >
            清空对话
          </button>
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {streaming && <Spinner size={11} />}
            {streaming ? '生成中' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
