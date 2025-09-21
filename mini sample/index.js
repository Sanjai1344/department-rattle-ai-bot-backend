import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app1';
import './index.css'; // Add if you have global styles

// Error boundary component for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#f8f9fa'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
            🚫 Something went wrong
          </h1>
          <p style={{ color: '#6c757d', textAlign: 'center', maxWidth: '500px' }}>
            The application encountered an unexpected error. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Reload Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', maxWidth: '800px' }}>
              <summary style={{ cursor: 'pointer', color: '#dc3545' }}>
                View Error Details (Development Mode)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#495057'
              }}>
                {this.state.error && this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Get the root element with error checking
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element with id "root" not found in the DOM');
}

// Create root and render with error boundary
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Optional: Add performance monitoring (uncomment if needed)
// import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
// getCLS(console.log);
// getFID(console.log);
// getFCP(console.log);
// getLCP(console.log);
// getTTFB(console.log);

// Optional: Service worker registration (uncomment if you have one)
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }