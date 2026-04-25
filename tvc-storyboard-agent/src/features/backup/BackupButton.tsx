import React, { useRef, useState } from 'react';
import { Database, Download, Package, Upload } from 'lucide-react';
import {
  useCharacterStore,
  useChatStore,
  useEpisodeStore,
  useLibraryStore,
  useShotStore,
} from '../../stores';
import {
  buildBackup,
  downloadBackup,
  parseBackup,
} from './backupService';
import {
  buildIpPackage,
  mergeIpPackage,
  parseIpPackage,
} from './ipPackageService';
import { toast } from '../../stores/toastStore';

const BackupButton: React.FC = () => {
  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.add);
  const episodes = useEpisodeStore((s) => s.episodes);
  const shots = useShotStore((s) => s.shots);
  const chatMessages = useChatStore((s) => s.messages);
  const libraryHooks = useLibraryStore((s) => s.hooks);
  const libraryStyles = useLibraryStore((s) => s.styles);
  const addLibraryHook = useLibraryStore((s) => s.addHook);
  const addLibraryStyle = useLibraryStore((s) => s.addStyle);

  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ipFileInputRef = useRef<HTMLInputElement>(null);

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
      if (fileInputRef.current) fileInputRef.current.value = '';
      setOpen(false);
    }
  };

  const handleIpExport = () => {
    const name = prompt('IP 包名称？', '李聪传');
    if (name === null) return;
    const strip = confirm(
      '是否移除所有 base64 参考图 / 缩略图（推荐）？\n\n点击「确定」= 去掉图（文件小，收件人需重新生成参考图）\n点击「取消」= 保留图（文件可能几 MB）'
    );
    try {
      const pkg = buildIpPackage({
        name,
        characters,
        libraryHooks,
        libraryStyles,
        stripReferenceImages: strip,
      });
      const blob = new Blob([JSON.stringify(pkg, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ip-package-${name.replace(/[\\/:*?"<>|]/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(
        `IP 包已导出：${pkg.characters.length} 角色 / ${pkg.libraryHooks.length} 金句 / ${pkg.libraryStyles.length} 风格模板`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
    setOpen(false);
  };

  const handleIpImportClick = () => {
    ipFileInputRef.current?.click();
  };

  const handleIpFile = async (file: File) => {
    try {
      const text = await file.text();
      const pkg = parseIpPackage(text);
      if (
        !confirm(
          `导入 IP 包「${pkg.name}」？\n\n• ${pkg.characters.length} 角色（id 冲突的会跳过，不覆盖）\n• ${pkg.libraryHooks.length} 金句（追加到库）\n• ${pkg.libraryStyles.length} 风格模板（追加到库）\n\n不会影响集数 / 镜头 / 章节。继续？`
        )
      ) {
        return;
      }
      const result = mergeIpPackage({
        pkg,
        existingCharacters: characters,
        addCharacter,
        addHook: addLibraryHook,
        addStyle: addLibraryStyle,
      });
      toast.success(
        `IP 包已合并：新增 ${result.charactersAdded} 角色（${result.charactersSkipped} 跳过）· ${result.hooksAdded} 金句 · ${result.stylesAdded} 风格`,
        6000
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      if (ipFileInputRef.current) ipFileInputRef.current.value = '';
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:border-neutral-700 hover:text-neutral-100"
        type="button"
        title="项目备份 / IP 包导入导出"
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
          <div className="absolute right-0 top-full z-40 mt-1 w-60 rounded-lg border border-neutral-800 bg-neutral-950 p-1 shadow-xl">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
              项目备份（全量）
            </div>
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
              onClick={() => fileInputRef.current?.click()}
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

            <div className="my-1 border-t border-neutral-800" />
            <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
              跨项目 IP 包（窄集）
            </div>
            <button
              onClick={handleIpExport}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-900"
              type="button"
            >
              <Package size={11} className="text-sky-400" />
              <div>
                <div>导出 IP 包</div>
                <div className="text-[10px] text-neutral-500">
                  角色基线 + 金句 + 风格模板
                </div>
              </div>
            </button>
            <button
              onClick={handleIpImportClick}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-900"
              type="button"
            >
              <Upload size={11} className="text-sky-400" />
              <div>
                <div>导入 IP 包</div>
                <div className="text-[10px] text-neutral-500">
                  追加到当前项目（不覆盖）
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
      <input
        ref={ipFileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleIpFile(f);
        }}
      />
    </div>
  );
};

export default BackupButton;
