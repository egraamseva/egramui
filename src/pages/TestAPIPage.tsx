import { useEffect } from 'react';
import { panchayatAPI, authAPI } from '../services/api';

export function TestAPIPage() {
  useEffect(() => {
    console.log('=== API Test Page ===');
    console.log('panchayatAPI:', panchayatAPI);
    console.log('panchayatAPI keys:', Object.keys(panchayatAPI));
    console.log('panchayatAPI.register:', panchayatAPI.register);
    console.log('typeof panchayatAPI.register:', typeof panchayatAPI.register);
    
    console.log('\nauthAPI:', authAPI);
    console.log('authAPI keys:', Object.keys(authAPI));
    console.log('authAPI.register:', authAPI.register);
    console.log('typeof authAPI.register:', typeof authAPI.register);
  }, []);

  const testRegister = async () => {
    try {
      console.log('Testing panchayatAPI.register...');
      const result = await panchayatAPI.register({
        email: 'test@example.com',
        sachivName: 'Test User',
        subdomain: 'narkhed',
        password: 'Password@123',
        phone: '1234567890',
      });
      console.log('Success:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      <p className="mb-4">Check the browser console for API details</p>
      <button
        onClick={testRegister}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test panchayatAPI.register()
      </button>
    </div>
  );
}

