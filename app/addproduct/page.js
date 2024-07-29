"use client"
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase';
import { addProductToFirestore, addProductsInBulk, uploadImagesAndGetUrls } from '../../stores'; // Import bulk upload function

// Function to generate a unique ID
const generateUniqueID = () => {
  // Generate a random string as a unique ID
  return Math.random().toString(36).substr(2, 9);
};

const AddProductPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [user, setUser] = useState(null);
  const [bulkFile, setBulkFile] = useState(null); // State for storing bulk upload file

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        if (user.uid !== process.env.NEXT_PUBLIC_OWNER_UID) {
          router.push('/');
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleImageChange = async (e) => {
    try {
      const files = e.target.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataURL = await readFileAsDataURL(file);
        setImages(prevImages => [...prevImages, { id: generateUniqueID(), name: file.name, dataURL }]);
      }
    } catch (error) {
      console.error('Error reading image files:', error);
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };
  // addproduct.js

const handleAddProduct = async () => {
  try {
    if (!user) {
      console.error('Error adding product: Unauthorized');
      return;
    }
    if (!name || !price || !description || !category || !subcategory) {
      console.error('Please fill all required fields');
      return;
    }

    let imageUrlsToUse = [];
    if (images.length > 0) {
      imageUrlsToUse = await uploadImagesAndGetUrls(images);
    }

    let collectionName = '';
    const lowerCaseCategory = category.toLowerCase();
    if (lowerCaseCategory === 'men' || lowerCaseCategory === 'women') {
      collectionName = lowerCaseCategory + 's';
    } else {
      console.error('Invalid category');
      return;
    }

    const productData = {
      name,
      price,
      description,
      imageUrls: imageUrlsToUse,
      category,
      subcategory,
      ownerId: user.uid
    };

    const productId = await addProductToFirestore(productData, collectionName);
    console.log('Product added successfully with ID:', productId);
    
    // Optionally, you can update your local state or perform any other actions with the new product ID
  } catch (error) {
    console.error('Error adding product:', error.message);
  }
};

// ... rest of your code

  const handleRemoveImage = (id) => {
    setImages(prevImages => prevImages.filter(image => image.id !== id));
  };

  const handleBulkUpload = async () => {
    try {
      if (!user || !bulkFile) {
        console.error('Error uploading products: Unauthorized or no file selected');
        return;
      }
      console.log('Reading Excel file...');
      const data = await readFileAsBinaryString(bulkFile);
      console.log('Data from Excel file:', data);
      console.log('Parsing Excel data...');
      const products = parseExcelData(data);
      console.log('Parsed products from Excel:', products);

      // Upload images and get their download URLs concurrently
      const productPromises = products.map(async (product) => {
        const imageUrls = [];
        if (product.imageUrls && product.imageUrls.length > 0) {
          for (const imageUrl of product.imageUrls) {
            if (imageUrl.startsWith('http')) {
              // If the URL starts with 'http', assume it's a direct URL
              imageUrls.push(imageUrl);
            } else {
              // Otherwise, treat it as a local filename and generate a URL
              try {
                const response = await fetch(`/path/to/images/${imageUrl}`);
                if (!response.ok) {
                  console.warn(`Error fetching image from "${imageUrl}"`);
                  continue; // Skip to the next image URL in case of fetch error
                }
                const blob = await response.blob();
                const dataURL = URL.createObjectURL(blob);
                imageUrls.push(dataURL);
              } catch (error) {
                console.error(`Error uploading image "${imageUrl}":`, error.message);
              }
            }
          }
        }
        return { ...product, imageUrls };
      });

      const uploadedProducts = await Promise.all(productPromises);
      console.log('Products with uploaded image URLs:', uploadedProducts);

      console.log('Uploading products in bulk...');
      await addProductsInBulk(uploadedProducts);
      console.log('Bulk upload completed successfully');
    } catch (error) {
      console.error('Error uploading products:', error.message);
      throw error; // Re-throw the error for handling in the calling function
    }
  };

  const readFileAsBinaryString = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsBinaryString(file);
    });
  };

  const parseExcelData = (data) => {
    try {
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
      const sheet = workbook.Sheets[sheetName];
      const products = XLSX.utils.sheet_to_json(sheet);

      if (!sheet || !products.length) {
        throw new Error('Empty Excel data or sheet not found');
      }

      const parsedProducts = products.map(product => {
        const trimmedCategory = product.category && typeof product.category === 'string' ? product.category.trim() : 'Uncategorized';
        const ownerId = user.uid || generateUniqueID(); // Use user's ID if available, otherwise generate a random ID

        // Check if the category is valid
        if (trimmedCategory.toLowerCase() !== 'mens' && trimmedCategory.toLowerCase() !== 'womens') {
          console.warn(`Invalid category "${trimmedCategory}". Skipping product.`);
          return null;
        }

        const imageUrls = typeof product.imageUrls === 'string' ? product.imageUrls.split(',').map(url => url.trim()) : product.imageUrls;

        return {
          ...product,
          category: trimmedCategory,
          collectionName: trimmedCategory.toLowerCase(), // Use category name as collection name
          ownerId: ownerId,
          imageUrls: imageUrls || [], // Set imageUrls to an empty array if it's not provided
        };
      }).filter(product => product !== null); // Remove null entries (skipped products)

      return parsedProducts;
    } catch (error) {
      console.error('Error parsing Excel data:', error.message);
      throw error;
    }
  };

  return (
    <div>
      <h2>Add Single Product</h2>
      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input type="file" accept="image/*" onChange={handleImageChange} multiple />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select category</option>
        <option value="men">Men</option>
        <option value="women">Women</option>
      </select>
      {category === 'men' && (
        <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
          <option value="">Select subcategory</option>
          <option value="Jeans">Jeans</option>
          <option value="Shirts">Shirts</option>
          <option value="T-Shirts">T-Shirts</option>
          <option value="Shorts">Shorts</option>
        </select>
      )}
      {category === 'women' && (
        <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
          <option value="">Select subcategory</option>
          <option value="Curve">Curve</option>
          <option value="Cargo">Cargo</option>
          <option value="Jeans">Jeans</option>
          <option value="T-Shirts">T-Shirts</option>
          <option value="Shirts">Shirts</option>
          <option value="skirts">skirts</option>
          <option value="tops">tops</option>

        </select>
      )}
      <div>
        {images.map((image, index) => (
          <div key={image.id} style={{ display: 'inline-block', position: 'relative', marginRight: '10px' }}>
            <img src={image.dataURL} alt={`Product Image ${index + 1}`} style={{ width: '100px', height: '100px' }} />
            <button
              onClick={() => handleRemoveImage(image.id)}
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer'
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>

      <button onClick={handleAddProduct}>Add Product</button>

      <hr />

      <h2>Add Products in Bulk</h2>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setBulkFile(e.target.files[0])} />
      <button onClick={handleBulkUpload}>Upload Products in Bulk</button>
    </div>
  );
};

export default AddProductPage;
