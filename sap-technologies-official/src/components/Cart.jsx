import React, { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import apiService from "../services/api";
import { getImageUrl, PLACEHOLDERS } from "../utils/imageUrl";
import "../styles/Cart.css";

const WHATSAPP_NUMBER = "256706564628";
const BUSINESS_EMAIL = "sales@saptechug.com";

const formatPrice = (price) => {
  if (!price || price.type === "contact-for-price" || !price.amount) return "Contact for price";
  const amt = parseFloat(price.amount).toLocaleString("en-US");
  const tag = price.type === "negotiable" ? " (Negotiable)" : "";
  return `${price.currency} ${amt}${tag}`;
};

const EMPTY_FORM = { customerName: "", customerEmail: "", customerPhone: "", preferredContact: "email", message: "" };

const getCartProductImage = (product) => {
  const firstImage = Array.isArray(product?.images) ? product.images[0] : null;
  const rawImage = typeof firstImage === "string" ? firstImage : firstImage?.url;
  return getImageUrl(rawImage || product?.image) || PLACEHOLDERS.product;
};

const Cart = () => {
  const { cartItems, cartCount, isCartOpen, closeCart, removeFromCart, updateQuantity, clearCart } = useCart();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Fetch current user once on mount and pre-fill the form
  useEffect(() => {
    apiService.getCurrentUser()
      .then((user) => {
        if (user) {
          setLoggedInUser(user);
          setForm((prev) => ({
            ...prev,
            customerName: user.name || prev.customerName,
            customerEmail: user.email || prev.customerEmail,
            customerPhone: user.phone || prev.customerPhone,
          }));
        }
      })
      .catch(() => {/* not logged in; that is fine */});
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.customerName.trim()) return "Please enter your name.";
    if (!form.customerEmail.trim()) return "Please enter your email.";
    if (!/^\S+@\S+\.\S+$/.test(form.customerEmail)) return "Please enter a valid email address.";
    return null;
  };

  /* ---------- 1. Submit order to database ---------- */
  const handleSubmitDB = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSending(true);
    setError("");
    try {
      await apiService.submitCartInquiry({
        items: cartItems.map((i) => ({
          productId: i.product._id,
          productName: i.product.name,
          quantity: i.quantity,
          price: i.product.price
        })),
        ...form
      });
      setSent(true);
      clearCart();
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  /* ---------- 2. Send order via WhatsApp ---------- */
  const handleWhatsApp = () => {
    const err = validate();
    if (err) { setError(err); return; }

    const itemLines = cartItems
      .map((i, idx) => `${idx + 1}. ${i.product.name} (Qty: ${i.quantity}) - ${formatPrice(i.product.price)}`)
      .join("\n");

    const text = [
      "Hello SAPTech Uganda! I'd like to send an order request for the following products:",
      "",
      itemLines,
      "",
      "My details:",
      `Name: ${form.customerName}`,
      `Email: ${form.customerEmail}`,
      form.customerPhone ? `Phone: ${form.customerPhone}` : null,
      form.message ? `\nMessage: ${form.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
  };

  /* ---------- 3. Send order via Email ---------- */
  const handleEmail = () => {
    const err = validate();
    if (err) { setError(err); return; }

    const itemLines = cartItems
      .map((i, idx) => `${idx + 1}. ${i.product.name} (Qty: ${i.quantity}) - ${formatPrice(i.product.price)}`)
      .join("\n");

    const subject = encodeURIComponent(`Product Order from ${form.customerName}`);
    const body = encodeURIComponent(
      [
        `Hello SAPTech Uganda,`,
        ``,
        `I would like to order the following products:`,
        ``,
        itemLines,
        ``,
        `My Details:`,
        `Name: ${form.customerName}`,
        `Email: ${form.customerEmail}`,
        form.customerPhone ? `Phone: ${form.customerPhone}` : null,
        form.message ? `\nAdditional Message:\n${form.message}` : null,
        ``,
        `Please get back to me with availability and next steps.`,
        `Thank you!`,
      ]
        .filter((l) => l !== null)
        .join("\n")
    );

    window.open(`mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`, "_blank");
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="cart-backdrop" onClick={closeCart} aria-hidden="true" />

      {/* Drawer */}
      <aside className="cart-drawer" role="dialog" aria-label="Shopping cart">
        {/* Header */}
        <div className="cart-header">
          <h2 className="cart-title">
            <span className="cart-title-icon">Order</span>
            Your Order Cart
            {cartCount > 0 && <span className="cart-header-count">{cartCount}</span>}
          </h2>
          <button
            type="button"
            className="cart-close"
            onClick={closeCart}
            aria-label="Close cart and return to products"
            title="Close cart"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {sent ? (
          /* ---- Success State ---- */
          <div className="cart-success">
            <div className="cart-success-icon">OK</div>
            <h3>Order Sent!</h3>
            <p>We&apos;ve received your order request and will get back to you within 24-48 hours.</p>
            <button
              className="cart-success-close"
              onClick={() => { setSent(false); setForm(EMPTY_FORM); closeCart(); }}
            >
              Close
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          /* ---- Empty Cart ---- */
          <div className="cart-empty">
            <div className="cart-empty-icon">Cart</div>
            <p>Your cart is empty.</p>
            <p className="cart-empty-hint">Browse our products and click <strong>Add to Cart</strong> to get started.</p>
            <button className="cart-browse-btn" onClick={closeCart}>Browse Products</button>
          </div>
        ) : (
          /* ---- Cart Items + Form ---- */
          <div className="cart-body">
            {/* Item list */}
            <div className="cart-items">
              {cartItems.map(({ product, quantity }) => (
                <div key={product._id} className="cart-item">
                  <img
                    src={getCartProductImage(product)}
                    alt={product.name}
                    className="cart-item-img"
                    onError={(e) => { e.currentTarget.src = PLACEHOLDERS.product; }}
                  />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{product.name}</p>
                    <p className="cart-item-price">{formatPrice(product.price)}</p>
                    <div className="cart-item-qty">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                        aria-label="Decrease quantity"
                      >-</button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => updateQuantity(product._id, e.target.value)}
                        className="qty-input"
                        aria-label={`Quantity for ${product.name}`}
                      />
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(product._id)}
                    aria-label={`Remove ${product.name}`}
                    title="Remove"
                  >Remove</button>
                </div>
              ))}
            </div>

            <button className="cart-clear-btn" onClick={clearCart}>Clear cart</button>

            {/* Contact Form */}
            <div className="cart-form">
              <h3 className="cart-form-title">Your Details</h3>

              {loggedInUser && (
                <div className="cart-autofill-badge">
                  <span>OK</span>
                  <span>Signed in as <strong>{loggedInUser.name}</strong> - details pre-filled</span>
                </div>
              )}

              {error && <div className="cart-error">{error}</div>}

              <div className="cart-field">
                <label htmlFor="cart-name">Name <span className="req">*</span></label>
                <input
                  type="text"
                  id="cart-name"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="e.g. John Kizito"
                  readOnly={!!loggedInUser?.name}
                  className={loggedInUser?.name ? "prefilled" : ""}
                />
              </div>

              <div className="cart-field">
                <label htmlFor="cart-email">Email <span className="req">*</span></label>
                <input
                  type="email"
                  id="cart-email"
                  name="customerEmail"
                  value={form.customerEmail}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  readOnly={!!loggedInUser?.email}
                  className={loggedInUser?.email ? "prefilled" : ""}
                />
              </div>

              <div className="cart-field">
                <label htmlFor="cart-phone">Phone <span className="opt">(optional)</span></label>
                <input
                  type="tel"
                  id="cart-phone"
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="+256 700 000 000"
                />
              </div>

              <div className="cart-field">
                <label htmlFor="cart-contact">Preferred Contact <span className="opt">(optional)</span></label>
                <select id="cart-contact" name="preferredContact" value={form.preferredContact} onChange={handleChange}>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="cart-field">
                <label htmlFor="cart-message">Message <span className="opt">(optional)</span></label>
                <textarea
                  id="cart-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any specific requirements, delivery details, etc."
                  maxLength="1000"
                />
              </div>

              {/* Send Options */}
              <div className="cart-send-title">Send your order via:</div>
              <div className="cart-send-options">
                <button
                  className="send-btn send-db"
                  onClick={handleSubmitDB}
                  disabled={sending}
                  title="Save your order request; we will contact you within 24-48 hrs"
                >
                  {sending ? (
                    <><span className="cart-spinner" />Sending...</>
                  ) : (
                    <>Send Order</>
                  )}
                </button>

                <button
                  className="send-btn send-whatsapp"
                  onClick={handleWhatsApp}
                  title="Open WhatsApp with your order details pre-filled"
                >
                  <svg viewBox="0 0 32 32" fill="currentColor" width="18" height="18" aria-hidden="true">
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.469 2.027 7.77L0 32l8.451-2.002A15.934 15.934 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm7.281 19.347c-.398-.2-2.354-1.162-2.72-1.295-.365-.133-.631-.2-.896.2-.267.398-1.029 1.295-1.262 1.562-.232.267-.465.3-.863.1-.398-.2-1.68-.62-3.2-1.976-1.183-1.056-1.98-2.36-2.213-2.758-.232-.4-.025-.615.175-.814.179-.178.398-.465.597-.697.2-.232.266-.399.399-.665.133-.267.067-.5-.033-.698-.1-.2-.896-2.16-1.228-2.96-.323-.777-.651-.672-.896-.683l-.763-.013c-.267 0-.698.1-1.064.5-.365.398-1.395 1.363-1.395 3.323s1.429 3.856 1.628 4.122c.2.267 2.812 4.294 6.815 6.023.953.412 1.696.658 2.275.842.956.304 1.826.261 2.514.158.767-.114 2.354-.963 2.687-1.893.333-.93.333-1.728.233-1.893-.1-.167-.365-.267-.763-.467z"/>
                  </svg>
                  WhatsApp
                </button>

                <button
                  className="send-btn send-email"
                  onClick={handleEmail}
                  title="Open your email client with your order pre-filled"
                >
                  Email Us
                </button>
              </div>

              <p className="cart-privacy">Your information is only used to respond to your order.</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Cart;
