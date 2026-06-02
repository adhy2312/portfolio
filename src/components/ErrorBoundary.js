import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("OS KERNEL PANIC:", error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      this.handleReboot();
    }
  };

  handleReboot = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          background: '#fff',
          fontFamily: 'var(--font-mono, monospace)'
        }}>
          <div style={{
            background: 'var(--accent-brutal-pink, #f472b6)',
            border: 'var(--border-heavy, 4px solid #000)',
            boxShadow: '8px 8px 0px #000',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', marginBottom: '1rem', color: '#000' }}>System Error</h1>
            <p style={{ fontSize: '1rem', color: '#000', fontWeight: 'bold', marginBottom: '2rem' }}>
              Something went wrong. The application has crashed.
            </p>
            <div style={{
              background: '#fff',
              border: '2px solid #000',
              padding: '1rem',
              marginBottom: '2rem',
              overflowX: 'auto',
              color: '#000',
              fontSize: '0.85rem'
            }}>
              {this.state.error && this.state.error.toString()}
            </div>
            <button 
              onClick={this.handleReboot}
              style={{
                background: 'var(--accent-brutal-blue, #38bdf8)',
                border: '2px solid #000',
                padding: '10px 20px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '4px 4px 0px #000',
                textTransform: 'uppercase'
              }}
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
