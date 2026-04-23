/**
 * 清掉 LLM 可能包裹的 ```json / ``` fence 或前后多余空白。
 */
export function cleanJson(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}
