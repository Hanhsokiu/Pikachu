import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('React Error Boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#0a0e1a', color: '#ff4444', fontFamily: 'monospace',
          padding: '40px', minHeight: '100vh', whiteSpace: 'pre-wrap', fontSize: '14px'
        }}>
          <h2 style={{ color: '#ff4444', marginBottom: '20px' }}>⚠️ Lỗi khởi động ứng dụng</h2>
          <p><strong>Tên lỗi:</strong> {this.state.error?.name}</p>
          <p><strong>Thông báo:</strong> {this.state.error?.message}</p>
          <p style={{ marginTop: '20px', color: '#aaa' }}><strong>Stack trace:</strong></p>
          <pre style={{ color: '#ff9800', fontSize: '12px', overflow: 'auto' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
