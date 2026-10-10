'use client'

export const dynamic = 'force-dynamic'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            padding: '16px 24px',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Something went wrong
        </div>

        <div style={{ padding: '24px' }}>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '14px',
              color: '#374151',
              fontFamily: 'monospace',
              backgroundColor: '#f3f4f6',
              padding: '12px',
              borderRadius: '8px',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={reset}
              style={{
                flex: 1,
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#ffffff',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                flex: 1,
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}