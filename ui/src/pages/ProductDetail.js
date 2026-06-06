// src/pages/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function ProductDetail() {
  const { productId } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        setBook(data);
        setLoading(false);
      });
  }, [productId]);

  const addToCart = () => {
    fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId: productId,
        quantity: quantity
      })
    })
    .then(response => response.json())
    .then(data => {
      // Here we're directly using the data returned from the server
      if (data.success) {
        alert(`added to cart!`);
      } else {
        alert('Error adding to cart: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(error => {
      alert('Error: ' + error.message);
    });
  };

  if (loading) {
    return <div className="loading">Loading book details...</div>;
  }

  if (!book) {
    return <div className="not-found">Book not found</div>;
  }

  return (
    <div className="product-detail">
      <div className="book-image">
        <img src={book.imageUrl} alt={book.name} />
      </div>
      <div className="book-details">
        <h1>{book.name}</h1>
        <h2>by {book.author}</h2>
        <p className="price">${book.price.toFixed(2)}</p>

        <div className="book-description">
          <h3>Description</h3>
          <p>{book.description}</p>
        </div>

        <div className="book-meta">
          <div className="meta-item">
            <span>Category:</span>
            <Link to={`/category/${book.categoryId}`}>{book.category}</Link>
          </div>
          <div className="meta-item">
            <span>Pages:</span> {book.pages}
          </div>
          <div className="meta-item">
            <span>Published:</span> {book.published}
          </div>
        </div>

        <div className="purchase-options">
          <div className="quantity-selector">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>
          <button onClick={addToCart} className="add-to-cart">Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
