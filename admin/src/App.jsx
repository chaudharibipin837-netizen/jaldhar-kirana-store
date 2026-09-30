import { useEffect, useState } from "react";
import "./App.css";

const API = "https://jaldhar-kirana-store.onrender.com";

function App() {
  const [activeTab, setActiveTab] = useState("products");

  // ===============================
  // PRODUCT STATES
  // ===============================

  const [products, setProducts] = useState([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productMessage, setProductMessage] = useState("");

  const [editingProductId, setEditingProductId] = useState(null);

  // ===============================
  // ORDER STATES
  // ===============================

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");

  // ===============================
  // LOAD PRODUCTS
  // ===============================

  const loadProducts = async () => {
    try {
      const response = await fetch(`${API}/api/products`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Products loading error:", error);
    }
  };

  // ===============================
  // LOAD ORDERS
  // ===============================

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      setOrderMessage("");

      const response = await fetch(`${API}/api/orders`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setOrderMessage("Orders load nahi ho paaye.");
      }
    } catch (error) {
      console.error("Orders loading error:", error);
      setOrderMessage("Backend se connection nahi ho raha.");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
    }
  }, [activeTab]);

  // ===============================
  // IMAGE SELECT
  // ===============================

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ===============================
  // RESET PRODUCT FORM
  // ===============================

  const resetProductForm = () => {
    setName("");
    setCategory("");
    setPrice("");
    setStock("");
    setDescription("");
    setSelectedImage(null);
    setImagePreview("");
    setEditingProductId(null);
    setProductMessage("");

    const fileInput = document.getElementById("product-image");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ===============================
  // EDIT PRODUCT
  // ===============================

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);

    setName(product.name || "");
    setCategory(product.category || "");
    setPrice(product.price ?? "");
    setStock(product.stock ?? "");
    setDescription(product.description || "");

    setSelectedImage(null);
    setImagePreview(product.image || "");

    setProductMessage(
      "✏️ Product edit mode me hai. Details change karke Save Product dabayein."
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ===============================
  // ADD / UPDATE PRODUCT
  // ===============================

  const handleProductSubmit = async (event) => {
    event.preventDefault();

    setProductMessage("");

    if (!name || !category || !price) {
      setProductMessage(
        "Name, category aur price bharna zaroori hai."
      );
      return;
    }

    try {
      setSaving(true);

      let imageUrl = imagePreview || "";

      // ===============================
      // NEW IMAGE UPLOAD
      // ===============================

      if (selectedImage) {
        setUploading(true);

        const formData = new FormData();
        formData.append("image", selectedImage);

        const uploadResponse = await fetch(`${API}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        setUploading(false);

        if (!uploadData.success) {
          setProductMessage("Image upload failed.");
          return;
        }

        imageUrl = uploadData.imageUrl;
      }

      // ===============================
      // UPDATE EXISTING PRODUCT
      // ===============================

      if (editingProductId) {
        const productResponse = await fetch(
          `${API}/api/products/${editingProductId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              category,
              price: Number(price),
              stock: Number(stock) || 0,
              description,
              image: imageUrl,
            }),
          }
        );

        const productData = await productResponse.json();

        if (!productData.success) {
          setProductMessage(
            productData.message || "Product update nahi hua."
          );
          return;
        }

        setProductMessage(
          "✅ Product successfully update ho gaya!"
        );
      }

      // ===============================
      // ADD NEW PRODUCT
      // ===============================

      else {
        const productResponse = await fetch(
          `${API}/api/products`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              category,
              price: Number(price),
              stock: Number(stock) || 0,
              description,
              image: imageUrl,
            }),
          }
        );

        const productData = await productResponse.json();

        if (!productData.success) {
          setProductMessage(
            productData.message || "Product add nahi hua."
          );
          return;
        }

        setProductMessage(
          "✅ Product successfully add ho gaya!"
        );
      }

      // ===============================
      // RESET FORM
      // ===============================

      setName("");
      setCategory("");
      setPrice("");
      setStock("");
      setDescription("");
      setSelectedImage(null);
      setImagePreview("");
      setEditingProductId(null);

      const fileInput = document.getElementById("product-image");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadProducts();
    } catch (error) {
      console.error("Product save error:", error);

      setProductMessage(
        "Product save karte waqt error aa gaya."
      );
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  // ===============================
  // DELETE PRODUCT
  // ===============================

  const handleDeleteProduct = async (productId, productName) => {
    const confirmDelete = window.confirm(
      `"${productName}" ko delete karna hai?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Product delete nahi hua.");
        return;
      }

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) => product._id !== productId
        )
      );

      if (editingProductId === productId) {
        resetProductForm();
      }

      alert("✅ Product successfully delete ho gaya!");
    } catch (error) {
      console.error("Delete product error:", error);

      alert("Product delete nahi ho paaya.");
    }
  };

  // ===============================
  // UPDATE ORDER STATUS
  // ===============================

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `${API}/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Status update nahi hua.");
        return;
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );
    } catch (error) {
      console.error("Status update error:", error);
      alert("Order status update nahi ho paaya.");
    }
  };

  // ===============================
  // DELETE ORDER
  // ===============================

  const deleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(
      "Kya aap is order ko delete karna chahte hain?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/orders/${orderId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Order delete nahi hua.");
        return;
      }

      setOrders((previousOrders) =>
        previousOrders.filter(
          (order) => order._id !== orderId
        )
      );
    } catch (error) {
      console.error("Delete order error:", error);
      alert("Order delete nahi ho paaya.");
    }
  };

  // ===============================
  // DATE FORMAT
  // ===============================

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ===============================
  // ORDER STATUS CLASS
  // ===============================

  const getStatusClass = (status) => {
    if (status === "Confirmed") {
      return "status-confirmed";
    }

    if (status === "Out for Delivery") {
      return "status-delivery";
    }

    if (status === "Delivered") {
      return "status-delivered";
    }

    if (status === "Cancelled") {
      return "status-cancelled";
    }

    return "status-pending";
  };

  // ===============================
  // JSX
  // ===============================

  return (
    <div className="admin-app">

      {/* HEADER */}

      <header className="admin-header">
        <div>
          <h1>Jaldhar Kirana Store</h1>
          <p>Admin Panel</p>
        </div>

        <div className="admin-status">
          🟢 Backend Connected
        </div>
      </header>

      {/* NAVIGATION */}

      <nav className="admin-nav">

        <button
          className={
            activeTab === "products"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setActiveTab("products")}
        >
          📦 Products
        </button>

        <button
          className={
            activeTab === "orders"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setActiveTab("orders")}
        >
          🛒 Orders

          {orders.length > 0 && (
            <span className="order-count">
              {orders.length}
            </span>
          )}
        </button>

      </nav>

      {/* ===============================
          PRODUCTS TAB
      =============================== */}

      {activeTab === "products" && (
        <main className="admin-container">

          {/* ADD / EDIT PRODUCT */}

          <section className="admin-card">

            <h2>
              {editingProductId
                ? "✏️ Edit Product"
                : "➕ Add New Product"}
            </h2>

            <form onSubmit={handleProductSubmit}>

              <div className="form-grid">

                <div className="form-group">
                  <label>Product Name</label>

                  <input
                    type="text"
                    placeholder="Example: Basmati Rice"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>

                  <input
                    type="text"
                    placeholder="Example: Grocery"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Price ₹</label>

                  <input
                    type="number"
                    placeholder="Example: 120"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Stock</label>

                  <input
                    type="number"
                    placeholder="Example: 50"
                    value={stock}
                    onChange={(e) =>
                      setStock(e.target.value)
                    }
                  />
                </div>

              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  placeholder="Product description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Product Image</label>

                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              {imagePreview && (
                <div className="image-preview">
                  <img
                    src={imagePreview}
                    alt="Product Preview"
                  />
                </div>
              )}

              <button
                type="submit"
                className="save-product-button"
                disabled={saving}
              >
                {uploading
                  ? "Uploading Image..."
                  : saving
                  ? editingProductId
                    ? "Updating Product..."
                    : "Saving Product..."
                  : editingProductId
                  ? "💾 Save Product"
                  : "Add Product"}
              </button>

              {editingProductId && (
                <button
                  type="button"
                  className="cancel-edit-button"
                  onClick={resetProductForm}
                >
                  ❌ Cancel Edit
                </button>
              )}

              {productMessage && (
                <p className="product-message">
                  {productMessage}
                </p>
              )}

            </form>
          </section>

          {/* PRODUCT LIST */}

          <section className="admin-card">

            <div className="section-title">

              <h2>📦 Products</h2>

              <button
                className="refresh-button"
                onClick={loadProducts}
              >
                🔄 Refresh
              </button>

            </div>

            {products.length === 0 ? (
              <p className="empty-message">
                Abhi koi product nahi hai.
              </p>
            ) : (
              <div className="admin-products-grid">

                {products.map((product) => (

                  <div
                    className="admin-product-card"
                    key={product._id}
                  >

                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="admin-product-image"
                      />
                    ) : (
                      <div className="admin-no-image">
                        No Image
                      </div>
                    )}

                    <div className="admin-product-info">

                      <h3>{product.name}</h3>

                      <p className="admin-category">
                        {product.category}
                      </p>

                      <p>
                        💰 ₹{product.price}
                      </p>

                      <p>
                        📦 Stock: {product.stock}
                      </p>

                      {product.description && (
                        <p className="admin-description">
                          {product.description}
                        </p>
                      )}

                      <div className="product-actions">

                        <button
                          className="edit-product-button"
                          onClick={() =>
                            handleEditProduct(product)
                          }
                        >
                          ✏️ Edit
                        </button>

                        <button
                          className="delete-product-button"
                          onClick={() =>
                            handleDeleteProduct(
                              product._id,
                              product.name
                            )
                          }
                        >
                          🗑️ Delete
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </section>

        </main>
      )}

      {/* ===============================
          ORDERS TAB
      =============================== */}

      {activeTab === "orders" && (
        <main className="admin-container">

          <section className="admin-card">

            <div className="section-title">

              <div>
                <h2>🛒 Customer Orders</h2>

                <p className="section-subtitle">
                  Total Orders: {orders.length}
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={loadOrders}
              >
                🔄 Refresh
              </button>

            </div>

            {orderMessage && (
              <p className="order-message">
                {orderMessage}
              </p>
            )}

            {loadingOrders ? (
              <div className="loading">
                Orders loading...
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-orders">

                <div className="empty-orders-icon">
                  🛒
                </div>

                <h3>No Orders Yet</h3>

                <p>
                  Customer order place karega to
                  yahan दिखाई देगा.
                </p>

              </div>
            ) : (
              <div className="orders-list">

                {orders.map((order, index) => (

                  <div
                    className="order-card"
                    key={order._id}
                  >

                    <div className="order-card-header">

                      <div>

                        <h3>
                          Order #{orders.length - index}
                        </h3>

                        <p className="order-id">
                          ID: {order._id}
                        </p>

                      </div>

                      <span
                        className={`status-badge ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>

                    </div>

                    <div className="customer-details">

                      <h4>👤 Customer Details</h4>

                      <p>
                        <strong>Name:</strong>{" "}
                        {order.customerName}
                      </p>

                      <p>
                        <strong>Mobile:</strong>{" "}
                        {order.phone}
                      </p>

                      <p>
                        <strong>Address:</strong>{" "}
                        {order.address}
                      </p>

                      <p>
                        <strong>Order Date:</strong>{" "}
                        {formatDate(order.createdAt)}
                      </p>

                    </div>

                    <div className="order-items">

                      <h4>🛍️ Ordered Products</h4>

                      {order.items &&
                        order.items.map(
                          (item, itemIndex) => (

                            <div
                              className="order-item"
                              key={itemIndex}
                            >

                              <div>

                                <strong>
                                  {item.name}
                                </strong>

                                <span>
                                  × {item.quantity}
                                </span>

                              </div>

                              <strong>
                                ₹
                                {(
                                  Number(item.price || 0) *
                                  Number(item.quantity || 0)
                                ).toFixed(2)}
                              </strong>

                            </div>

                          )
                        )}

                    </div>

                    <div className="order-total">

                      <span>Total Amount</span>

                      <strong>
                        ₹
                        {Number(
                          order.totalAmount || 0
                        ).toFixed(2)}
                      </strong>

                    </div>

                    <div className="order-actions">

                      <label>
                        Change Order Status
                      </label>

                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(
                            order._id,
                            e.target.value
                          )
                        }
                      >

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Confirmed">
                          Confirmed
                        </option>

                        <option value="Out for Delivery">
                          Out for Delivery
                        </option>

                        <option value="Delivered">
                          Delivered
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>

                      </select>

                      <button
                        className="delete-order-button"
                        onClick={() =>
                          deleteOrder(order._id)
                        }
                      >
                        🗑️ Delete Order
                      </button>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </section>

        </main>
      )}

      {/* FOOTER */}

      <footer className="admin-footer">
        Jaldhar Kirana Store © 2026
      </footer>

    </div>
  );
}

export default App;