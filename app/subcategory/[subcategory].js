import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProductsStart, fetchProductsSuccess, fetchProductsFailure } from '../../redux/slices';
import { fetchProducts } from '../../stores';
import Link from 'next/link';
import withReduxProvider from '../hoc';
import css from '../../style/home.css'

const SubcategoryPage = () => {
  const router = useRouter();
  const { subcategory } = router.query;
  const dispatch = useDispatch();
  const womensProducts = useSelector(state => state.products.women);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!subcategory) return; // Wait until subcategory is available
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching products...');
        dispatch(fetchProductsStart());
        const productsData = await fetchProducts();
        console.log('Products fetched:', productsData);
        const filteredProductsData = {
          category: 'women',
          data: productsData.women.map(product => ({
            ...product,
            createdAt: product.createdAt.toDate().toISOString(),
          })),
        };
        dispatch(fetchProductsSuccess(filteredProductsData));
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products. Please try again.');
        dispatch(fetchProductsFailure(error.message));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch, subcategory]);

  const getFilteredProducts = () => {
    if (!womensProducts || !subcategory) return [];
    
    const subcategoryLower = subcategory.toLowerCase();
    return Object.values(womensProducts)
      .flat()
      .filter(product => product.subcategory.toLowerCase() === subcategoryLower);
  };

  const filteredProducts = getFilteredProducts();

  const handleProductHovers = (index) => {
    setHoverIndex(index);
  };

  const handleProductLeaves = () => {
    setHoverIndex(-1);
  };

  const handleBuyNow = (product) => {
    if (product && product.id) {
      router.push(`/product/${product.id}`);
    } else {
      console.error('Invalid product data:', product);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!subcategory) return <div>Subcategory not found</div>;

  return (
    <div className="main">
      <div className="nav">
        {/* Add your navigation bar here */}
      </div>
      <h1 className="subcategory-title">{subcategory} Products</h1>
      {filteredProducts.length === 0 ? (
        <div>No products found for this subcategory.</div>
      ) : (
        <div className="products">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id || index}
              className="product"
              onMouseEnter={() => handleProductHovers(index)}
              onMouseLeave={() => handleProductLeaves()}
            >
              <div className="product-image-container">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <>
                    <img
                      className="product-image rounded-xl"
                      src={product.imageUrls[0]}
                      alt={product.name}
                      style={{ opacity: hoverIndex === index ? 0 : 1 }}
                    />
                    <img
                      className="product-image rounded-xl"
                      src={product.imageUrls[1] || product.imageUrls[0]}
                      alt={product.name}
                      style={{ opacity: hoverIndex === index ? 1 : 0 }}
                    />
                  </>
                ) : (
                  <div>No image available</div>
                )}
              </div>
              <button
                className="buyNowButton"
                onClick={() => handleBuyNow(product)}
              >
                Buy Now
              </button>
              <div>
                <span>
                  <p className="prodname">{product.name || 'Unnamed Product'}</p>
                </span>
                <span>
                  <p className="prprice">₹ {product.price || 'Price not available'}</p>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link href="/" className="back-button">
        Back to Home
      </Link>
    </div>
  );
};

export default withReduxProvider(SubcategoryPage);
