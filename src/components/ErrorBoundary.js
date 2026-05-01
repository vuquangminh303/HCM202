import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          color: 'white', 
          fontSize: '18px', 
          textAlign: 'center',
          zIndex: 10000 
        }}>
          <h2>Đã xảy ra lỗi!</h2>
          <p>Vui lòng tải lại trang để tiếp tục.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
