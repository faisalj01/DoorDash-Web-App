// Simple wrapper around fetch
const ApiClient = {
  get: async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    return res.json();
  },
};

export default ApiClient;
