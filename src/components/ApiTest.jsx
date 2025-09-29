import React, { useState } from 'react';
import { testApiConnection } from '../services/subscriptionService';

const ApiTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
      isAuthenticated: !!token,
      tokenLocation: token ? (localStorage.getItem('authToken') ? 'localStorage' : 'sessionStorage') : 'none'
    };
  });

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = await testApiConnection();
      setTestResult({
        success: result.ok,
        message: result.message,
        status: result.status,
        data: result.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message,
        status: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>API Connection Test</h2>
      <button 
        onClick={runTest}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: isLoading ? 'wait' : 'pointer'
        }}
      >
        {isLoading ? 'Testing...' : 'Test API Connection'}
      </button>

      {testResult && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            borderRadius: '4px',
            backgroundColor: testResult.success ? '#e6ffe6' : '#ffe6e6',
            border: `1px solid ${testResult.success ? '#00cc00' : '#ff0000'}`
          }}
        >
          <strong>Test Result:</strong> {testResult.message}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <p><strong>Authentication Status:</strong></p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>• Authenticated: {authStatus.isAuthenticated ? 'Yes' : 'No'}</li>
            <li>• Token Location: {authStatus.tokenLocation}</li>
          </ul>
        </div>
        <p><strong>Note:</strong> Check the browser console for detailed test results.</p>
      </div>
    </div>
  );
};

export default ApiTest;
