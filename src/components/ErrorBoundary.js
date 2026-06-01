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
        <div className="error-boundary-os">
          <div className="error-content">
            <h1 className="glitch" data-text="Windows">Windows</h1>
            <p className="error-msg">
              A fatal exception 0E has occurred at 0028:C0011E36 in UXD AdhyOS(01) + 00001614.<br />
              The current application will be terminated.<br /><br />
              *  Press ESC or click the link below to terminate the current application.<br />
              *  Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.
            </p>
            <div className="error-log">
              Fatal Error: {this.state.error && this.state.error.toString()}
            </div>
            <button className="reboot-btn" onClick={this.handleReboot}>
              Press ESC or click here to continue _
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
