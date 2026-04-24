import React, { useState } from 'react';
import { MessageSquare, Trash2, UserCircle } from 'lucide-react';
import type { Comment } from '../types';

const AUTHOR_KEY = 'licong-me';

function readCurrentAuthor(): string {
  if (typeof window === 'undefined') return '我';
  return window.localStorage.getItem(AUTHOR_KEY) ?? '我';
}

function writeCurrentAuthor(name: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = name.trim() || '我';
  window.localStorage.setItem(AUTHOR_KEY, trimmed);
}

interface Props {
  assignee?: string;
  comments: Comment[];
  onAssigneeChange: (name: string | undefined) => void;
  onAddComment: (comment: Comment) => void;
  onRemoveComment: (id: string) => void;
}

const CommentsSection: React.FC<Props> = ({
  assignee,
  comments,
  onAssigneeChange,
  onAddComment,
  onRemoveComment,
}) => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState(readCurrentAuthor());
  const [editingAuthor, setEditingAuthor] = useState(false);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    writeCurrentAuthor(author);
    onAddComment({
      id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      text: trimmed,
      author: author.trim() || '我',
      createdAt: Date.now(),
    });
    setText('');
  };

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-200">
          <MessageSquare size={12} /> 批注 & 指派
        </span>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <UserCircle size={11} />
          <span>指派：</span>
          <input
            type="text"
            value={assignee ?? ''}
            onChange={(e) =>
              onAssigneeChange(e.target.value.trim() || undefined)
            }
            placeholder="未指派"
            className="w-20 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[11px] text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {comments.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {comments
            .slice()
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((c) => (
              <div
                key={c.id}
                className="group rounded border border-neutral-800/60 bg-neutral-900/60 p-2"
              >
                <div className="mb-0.5 flex items-center gap-2 text-[10px] text-neutral-500">
                  <span className="font-medium text-neutral-300">
                    {c.author}
                  </span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                  <button
                    onClick={() => onRemoveComment(c.id)}
                    className="ml-auto rounded p-0.5 opacity-0 transition hover:bg-red-950/40 hover:text-red-400 group-hover:opacity-100"
                    type="button"
                    title="删除"
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-[11px] text-neutral-200">
                  {c.text}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="space-y-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="留一条批注 / 生产笔记（Ctrl+Enter 提交）"
          rows={2}
          className="w-full resize-none rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-[11px] text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[10px] text-neutral-500">
            {editingAuthor ? (
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                onBlur={() => {
                  writeCurrentAuthor(author);
                  setEditingAuthor(false);
                }}
                autoFocus
                className="w-20 rounded border border-neutral-700 bg-neutral-900 px-1.5 py-0.5 text-[10px] text-neutral-100 focus:border-neutral-500 focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setEditingAuthor(true)}
                className="hover:text-neutral-300"
                type="button"
                title="修改本机作者名"
              >
                以「{author}」身份留言（点击改名）
              </button>
            )}
          </div>
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="rounded bg-sky-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;
