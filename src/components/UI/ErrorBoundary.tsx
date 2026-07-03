import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#06080b',
          color: '#e2dbd0',
          fontFamily: 'Georgia, serif',
          padding: '24px',
          textAlign: 'center',
          gap: '16px',
        }}>
          <div style={{ fontSize: 40, color: '#e8720a' }}>柔道</div>
          <div style={{ fontSize: 16, color: '#e04444' }}>Щось пішло не так</div>
          <pre style={{ fontSize: 11, color: '#52606e', maxWidth: 400, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: '#e8720a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
            }}
          >
            Перезавантажити
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
