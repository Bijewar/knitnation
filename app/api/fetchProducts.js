// services/fetchProducts.js

/**
 * Fetch all products
 * @returns {Promise<Array>} List of all products
 */
export async function fetchAllProducts() {
  const response = await fetch('/api/products');
  if (!response.ok) {
      throw new Error('Failed to fetch all products');
  }
  const data = await response.json();
  return data;
}

/**
* Fetch products for the men's category
* @returns {Promise<Array>} List of men's products
*/
export async function fetchMenProducts() {
  const response = await fetch('/api/men');
  if (!response.ok) {
      throw new Error('Failed to fetch men products');
  }
  const data = await response.json();
  return data;
}

/**
* Fetch products for the women's category
* @returns {Promise<Array>} List of women's products
*/
export async function fetchWomenProducts() {
  const response = await fetch('/api/women');
  if (!response.ok) {
      throw new Error('Failed to fetch women products');
  }
  const data = await response.json();
  return data;
}

/**
* Fetch a specific product by its ID
* @param {string} id - Product ID
* @returns {Promise<Object>} Product details
*/
export async function getProductById(id) {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) {
      throw new Error(`Failed to fetch product with ID: ${id}`);
  }
  const data = await response.json();
  return data;
}
