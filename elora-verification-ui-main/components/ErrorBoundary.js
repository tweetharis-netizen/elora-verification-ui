import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Dashboard Error Boundary Caught:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-8 font-sans">
                    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-10 border border-red-100">
                        <h2 className="text-3xl font-black text-red-600 mb-4">Dashboard Crash Detected</h2>
                        <p className="text-slate-600 mb-6 font-medium">
                            We caught an unexpected error in the dashboard.
                        </p>

                        <div className="bg-slate-900 rounded-xl p-6 overflow-auto max-h-96 mb-6">
                            <code className="text-red-300 font-mono text-xs block whitespace-pre-wrap">
                                {this.state.error && this.state.error.toString()}
                            </code>
                            {this.state.errorInfo && (
                                <code className="text-slate-500 font-mono text-[10px] block whitespace-pre-wrap mt-4 border-t border-slate-700 pt-4">
                                    {this.state.errorInfo.componentStack}
                                </code>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
