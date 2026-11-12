const API_URL = 'https://forex-api-dgo5.onrender.com';
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    // Parse the error into a readable string
    let errorMessage = 'Something went wrong';
    
    if (data.error) {
      if (typeof data.error === 'string') {
        errorMessage = data.error;
      } else if (Array.isArray(data.error)) {
        // Handle Zod array errors
        errorMessage = data.error.map((e: any) => e.message || JSON.stringify(e)).join(', ');
      } else {
        errorMessage = JSON.stringify(data.error);
      }
    }
    
    throw new Error(errorMessage);
  }
  
  return data;
}