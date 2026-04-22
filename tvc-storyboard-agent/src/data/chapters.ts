import type { Chapter } from '../types';

interface ChapterMeta {
  number: number;
  title: string;
  filename: string;
}

const CHAPTER_META: ChapterMeta[] = [
  { number: 1, title: '西山脚下', filename: '第一章_西山脚下.md' },
  { number: 2, title: '两个家', filename: '第二章_两个家.md' },
  { number: 3, title: '少年心事', filename: '第三章_少年心事.md' },
  { number: 4, title: '转学记', filename: '第四章_转学记.md' },
  { number: 5, title: '台上台下', filename: '第五章_台上台下.md' },
  { number: 6, title: '大学江湖', filename: '第六章_大学江湖.md' },
  { number: 7, title: '告别与追问', filename: '第七章_告别与追问.md' },
  { number: 8, title: '遇见她', filename: '第八章_遇见她.md' },
  { number: 9, title: '然然', filename: '第九章_然然.md' },
];

export async function loadChapters(): Promise<Chapter[]> {
  const results = await Promise.all(
    CHAPTER_META.map(async (meta) => {
      const url = `/data/chapters/${encodeURIComponent(meta.filename)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load ${meta.filename}: ${res.status}`);
      }
      const content = await res.text();
      return {
        id: `ch-${meta.number}`,
        number: meta.number,
        title: meta.title,
        filename: meta.filename,
        content,
        wordCount: content.length,
      } satisfies Chapter;
    })
  );
  return results;
}

export { CHAPTER_META };
