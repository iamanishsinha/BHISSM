import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BHISSM ErrorBoundary] Uncaught rendering exception:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSession = () => {
    try {
      localStorage.removeItem('bhissm_token');
      localStorage.removeItem('bhissm_user');
    } catch {
      // ignore
    }
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bhissm-bg flex flex-col items-center justify-center p-6 text-bhissm-dark font-sans antialiased">
          <div className="w-full max-w-lg card p-6 bg-white border-2 border-red-300 shadow-lg space-y-4">
            {/* Header Identity */}
            <div className="flex items-center gap-3 border-b border-red-100 pb-3">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-lg tracking-tight shrink-0 shadow-sm">
                BH
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-red-800 uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded">
                    DIAGNOSTICS & RESILIENCE
                  </span>
                </div>
                <h1 className="text-lg font-black text-bhissm-dark mt-0.5">
                  BHISSM Operational Safeguard
                </h1>
              </div>
            </div>

            {/* Error Body */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">A client rendering interruption was intercepted.</p>
                  <p className="text-[11px] text-red-800/90 mt-0.5">
                    {this.state.error?.message || 'An unexpected state discrepancy occurred while rendering the console.'}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-bhissm-secondary leading-relaxed">
                The session state has been preserved. You can refresh the dashboard or reset your authentication cache to restore full operational telemetry.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-bhissm-border">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto btn-primary flex-1 flex items-center justify-center gap-2 text-xs py-2.5 font-mono font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Portal</span>
              </button>

              <button
                onClick={this.handleResetSession}
                className="w-full sm:w-auto btn-outline flex-1 flex items-center justify-center gap-2 text-xs py-2.5 font-mono text-red-800 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reset &amp; Sign In</span>
              </button>
            </div>

            {/* Technical Trace Toggle */}
            {this.state.errorInfo && (
              <details className="text-[10px] font-mono text-bhissm-secondary/80 pt-1">
                <summary className="cursor-pointer hover:underline text-bhissm-secondary">
                  Technical Stack Trace
                </summary>
                <pre className="p-2 mt-1.5 rounded bg-stone-100 overflow-x-auto max-h-32 text-[9px] text-stone-800">
                  {this.state.error?.stack || this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
