import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // PAYMENT METHOD
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  // ===============================
  // FETCH PRODUCTS
  // ===============================

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((response) => response.json())
      .then((data) => {
        setBackendStatus(data.message);
      })
      .catch(() => {
        setBackendStatus("Backend connection failed");
      });

    fetch("http://localhost:5000/api/products")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products);
        }

        setLoadingProducts(false);
      })
      .catch((error) => {
        console.error("Products fetch error:", error);
        setLoadingProducts(false);
      });
  }, []);

  // ===============================
  // ADD TO CART
  // ===============================

  const addToCart = (product) => {
    setCart((previousCart) => {
      const existingProduct = previousCart.find(
        (item) => item._id === product._id
      );

      if (existingProduct) {
        if (existingProduct.quantity >= product.stock) {
          alert("Itna stock available nahi hai.");
          return previousCart;
        }

        return previousCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...previousCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  // ===============================
  // INCREASE QUANTITY
  // ===============================

  const increaseQuantity = (id) => {
    setCart((previousCart) =>
      previousCart.map((item) => {
        if (item._id === id) {
          if (item.quantity >= item.stock) {
            alert("Available stock se zyada quantity nahi le sakte.");
            return item;
          }

          return {
            ...item,
            quantity: item.quantity + 1,
          };
        }

        return item;
      })
    );
  };

  // ===============================
  // DECREASE QUANTITY
  // ===============================

  const decreaseQuantity = (id) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item._id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ===============================
  // REMOVE FROM CART
  // ===============================

  const removeFromCart = (id) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item._id !== id)
    );
  };

  // ===============================
  // CART TOTAL
  // ===============================

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // ===============================
  // OPEN CHECKOUT
  // ===============================

  const openCheckout = () => {
    if (cart.length === 0) {
      alert("Cart empty hai!");
      return;
    }

    setShowCart(false);
    setShowCheckout(true);
    setOrderMessage("");
    setPaymentMethod("COD");
  };

  // ===============================
  // PLACE ORDER
  // ===============================

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!customerName.trim()) {
      alert("Please customer name enter karein.");
      return;
    }

    if (!phone.trim()) {
      alert("Please mobile number enter karein.");
      return;
    }

    if (phone.trim().length < 10) {
      alert("Please valid mobile number enter karein.");
      return;
    }

    if (!address.trim()) {
      alert("Please delivery address enter karein.");
      return;
    }

    if (cart.length === 0) {
      alert("Cart empty hai!");
      return;
    }

    setPlacingOrder(true);
    setOrderMessage("");

    const orderItems = cart.map((item) => ({
      productId: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            items: orderItems,
            totalAmount: cartTotal,

            // PAYMENT METHOD
            paymentMethod: paymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOrderMessage(
          `Order placed successfully! Order ID: ${data.order._id}`
        );

        setCart([]);
        setCustomerName("");
        setPhone("");
        setAddress("");
        setPaymentMethod("COD");
      } else {
        alert(data.message || "Order place nahi hua.");
      }
    } catch (error) {
      console.error("Order error:", error);

      alert(
        "Order place nahi hua. Backend check karein."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // ===============================
  // UI
  // ===============================

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">
        <div className="logo">
          🛒 Jaldhar Kirana Store
        </div>

        <button
          className="cart-button"
          onClick={() => setShowCart(true)}
        >
          🛒 Cart ({cartItemCount})
        </button>
      </nav>

      {/* ================= HERO ================= */}

      <section className="hero">
        <h1>Jaldhar Kirana Store</h1>

        <p>
          Daily Grocery & Household Products
        </p>

        <p className="backend-status">
          {backendStatus}
        </p>
      </section>

      {/* ================= PRODUCTS ================= */}

      <section className="products-section">
        <h2>Our Products</h2>

        {loadingProducts ? (
          <p>Products loading...</p>
        ) : products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          <div className="products-grid">

            {products.map((product) => (
              <div
                className="product-card"
                key={product._id}
              >

                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                  />
                ) : (
                  <div className="no-image">
                    No Image
                  </div>
                )}

                <h3>{product.name}</h3>

                <p className="category">
                  {product.category}
                </p>

                {product.description && (
                  <p className="description">
                    {product.description}
                  </p>
                )}

                <h3>
                  ₹{product.price}
                </h3>

                <p>
                  Stock: {product.stock}
                </p>

                <button
                  className="add-cart-button"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  {product.stock > 0
                    ? "Add to Cart"
                    : "Out of Stock"}
                </button>

              </div>
            ))}

          </div>
        )}
      </section>

      {/* ================= CART ================= */}

      {showCart && (
        <div className="cart-overlay">

          <div className="cart-panel">

            <div className="cart-header">
              <h2>Your Cart</h2>

              <button
                onClick={() => setShowCart(false)}
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <h3>Your cart is empty 🛒</h3>
                <p>Add some products first.</p>
              </div>
            ) : (
              <>
                <div className="cart-items">

                  {cart.map((item) => (
                    <div
                      className="cart-item"
                      key={item._id}
                    >

                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="cart-image"
                        />
                      )}

                      <div className="cart-item-info">
                        <h3>{item.name}</h3>

                        <p>
                          ₹{item.price}
                        </p>

                        <div className="quantity-controls">

                          <button
                            onClick={() =>
                              decreaseQuantity(item._id)
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(item._id)
                            }
                          >
                            +
                          </button>

                        </div>
                      </div>

                      <button
                        className="delete-button"
                        onClick={() =>
                          removeFromCart(item._id)
                        }
                      >
                        🗑️
                      </button>

                    </div>
                  ))}

                </div>

                <div className="cart-footer">

                  <h2>
                    Total: ₹{cartTotal}
                  </h2>

                  <button
                    className="checkout-button"
                    onClick={openCheckout}
                  >
                    Proceed to Checkout →
                  </button>

                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ================= CHECKOUT ================= */}

      {showCheckout && (
        <div className="checkout-overlay">

          <div className="checkout-panel">

            <div className="checkout-header">
              <h2>Checkout</h2>

              <button
                onClick={() => setShowCheckout(false)}
              >
                ✕
              </button>
            </div>

            {orderMessage ? (
              <div className="order-success">

                <h2>🎉 Order Placed!</h2>

                <p>
                  {orderMessage}
                </p>

                <button
                  onClick={() => {
                    setShowCheckout(false);
                    setOrderMessage("");
                  }}
                >
                  Continue Shopping
                </button>

              </div>
            ) : (
              <>

                <form onSubmit={placeOrder}>

                  <div className="form-group">
                    <label>
                      Customer Name
                    </label>

                    <input
                      type="text"
                      placeholder="Apna naam enter karein"
                      value={customerName}
                      onChange={(e) =>
                        setCustomerName(e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Mobile Number
                    </label>

                    <input
                      type="tel"
                      placeholder="10 digit mobile number"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Delivery Address
                    </label>

                    <textarea
                      placeholder="House no., Village/City, District, PIN"
                      rows="4"
                      value={address}
                      onChange={(e) =>
                        setAddress(e.target.value)
                      }
                    />
                  </div>

                  {/* ================= PAYMENT METHOD ================= */}

                  <div className="form-group">
                    <label>
                      Payment Method
                    </label>

                    <div className="payment-options">

                      <label className="payment-option">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="COD"
                          checked={paymentMethod === "COD"}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value)
                          }
                        />

                        <span>
                          💵 Cash on Delivery
                        </span>
                      </label>

                      <label className="payment-option payment-disabled">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="UPI"
                          disabled
                        />

                        <span>
                          📱 UPI Payment
                          <small>Coming Soon</small>
                        </span>
                      </label>

                    </div>
                  </div>

                  {/* ORDER SUMMARY */}

                  <div className="order-summary">

                    <h3>
                      Order Summary
                    </h3>

                    {cart.map((item) => (
                      <div
                        className="summary-item"
                        key={item._id}
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>

                        <span>
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}

                    <hr />

                    <div className="summary-total">
                      <strong>
                        Total
                      </strong>

                      <strong>
                        ₹{cartTotal}
                      </strong>
                    </div>

                  </div>

                  <button
                    type="submit"
                    className="place-order-button"
                    disabled={placingOrder}
                  >
                    {placingOrder
                      ? "Placing Order..."
                      : "💵 Place COD Order"}
                  </button>

                </form>

              </>
            )}

          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}

      <footer>
        <p>
          © 2026 Jaldhar Kirana Store
        </p>
      </footer>

    </div>
  );
}

export default App;