import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f2f2f2" }}>
          <div className="text-center p-8 max-w-md">
            <AlertTriangle size={48} style={{ color: "#c62828" }} className="mx-auto mb-4" />
            <h1 className="serif-display text-xl mb-2" style={{ color: "#263238" }}>页面出错了</h1>
            <p className="text-sm mb-6" style={{ color: "#78909C" }}>
              抱歉，页面发生了意外错误。请刷新重试，或联系管理员。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#263238", borderRadius: "2px" }}
            >
              刷新页面
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-6 text-left text-xs p-4 overflow-auto" style={{ backgroundColor: "#fff", color: "#c62828", maxHeight: "200px" }}>
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
