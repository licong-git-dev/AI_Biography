import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // 打到控制台，方便本地调试
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  reload = (): void => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 p-6 text-neutral-100">
          <div className="w-full max-w-lg rounded-lg border border-red-800/60 bg-red-950/20 p-6 shadow-2xl">
            <div className="mb-2 text-lg font-semibold text-red-200">
              出了一个错
            </div>
            <div className="mb-4 text-xs text-neutral-400">
              页面某处抛了异常，其它数据应该还在 localStorage 里。
            </div>
            <pre className="scrollbar-thin mb-4 max-h-60 overflow-y-auto whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-950 p-3 font-mono text-[11px] leading-relaxed text-red-300">
              {this.state.error.name}: {this.state.error.message}
              {this.state.error.stack ? '\n\n' + this.state.error.stack : ''}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={this.reset}
                className="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-600"
                type="button"
              >
                尝试继续（清本次错误）
              </button>
              <button
                onClick={this.reload}
                className="rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
                type="button"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
