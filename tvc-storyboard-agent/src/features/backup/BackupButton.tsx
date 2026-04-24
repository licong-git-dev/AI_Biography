import React, { useRef, useState } from 'react';
import { Database, Download, Upload } from 'lucide-react';
import {
  useCharacterStore,
  useChatStore,
  useEpisodeStore,
  useShotStore,
} from '../../stores';
import {
  buildBackup,
  downloadBackup,
  parseBackup,
} from './backupService';
import { toast } from '../../stores/toastStore';

const BackupButton: React.FC = () => {
  const characters = useCharacterStore((s) => s.characters);
  const episodes = useEpisodeStore((s) => s.episodes);
  const shots = useShotStore((s) => s.shots);
  const chatMessages = useChatStore((s) => s.messages);

  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const backup = buildBackup({
        appVersion: 'v0.1',
        characters,
        episodes,
        shots,
        chatMessages,
      });
      downloadBackup(backup);
      toast.success(
        `已导出：${characters.length} 角色 / ${episodes.length} 集 / ${shots.length} 镜头`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
    setOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const backup = parseBackup(text);

      if (
        !confirm(
          `将用备份覆盖当前全部状态：\n\n${backup.characters.length} 角色\n${backup.episodes.length} 集\n${backup.shots.length} 镜头\n${backup.chatMessages.length} 对话\n\n导出时间：${new Date(backup.exportedAt).toLocaleString()}\n\n当前未导出的工作将被丢弃。继续？`
        )
      ) {
        return;
      }

      useCharacterStore.setState({
        characters: backup.characters,
        activeId: null,
      });
      useEpisodeStore.setState({
        episodes: backup.episodes,
        activeId: null,
      });
      useShotStore.setState({ shots: backup.shots, activeId: null });
      useChatStore.setState({ messages: backup.chatMessages });

      toast.success(
        `备份已恢复：${backup.characters.length} 角色 / ${backup.episodes.length} 集 / ${backup.shots.length} 镜头`,
        5000
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      // 允许再次选同一个文件
      if (fileInputRef.current) fileInputRef.current.value = '';
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-neutral-100"
        type="button"
        title="项目备份 / 恢复"
      >
        <Database size={11} />
        备份
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-40 mt-1 w-52 rounded-lg border border-neutral-800 bg-neutral-950 p-1 shadow-xl">
            <button
              onClick={handleExport}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-900"
              type="button"
            >
              <Download size={11} className="text-emerald-400" />
              <div>
                <div>导出 JSON 备份</div>
                <div className="text-[10px] text-neutral-500">
                  含角色/集/镜头/对话
                </div>
              </div>
            </button>
            <button
              onClick={handleImportClick}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-900"
              type="button"
            >
              <Upload size={11} className="text-amber-400" />
              <div>
                <div>导入 JSON 备份</div>
                <div className="text-[10px] text-neutral-500">
                  会覆盖当前全部状态
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
};

export default BackupButton;
