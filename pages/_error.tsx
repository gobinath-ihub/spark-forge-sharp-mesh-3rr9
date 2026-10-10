import React from 'react'

export const dynamic = 'force-dynamic'

export default function Error({ statusCode }: { statusCode: number }) {
  return (
    <html>
      <head>
        <title>{statusCode === 404 ? '404 - Page Not Found' : 'Error'}</title>
      </head>
      <body>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 700, margin: 0 }}>{statusCode}</h1>
            <p style={{ fontSize: '16px', color: '#666', marginTop: '8px' }}>
              {statusCode === 404 ? 'Page not found' : 'An error occurred'}
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}