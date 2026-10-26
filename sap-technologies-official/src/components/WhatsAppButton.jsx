import React, { useState } from "react";
import "../styles/WhatsAppButton.css";

const WHATSAPP_NUMBER = "256706564628";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello SAPTech Uganda! I'd like to inquire about your services."
);

const WhatsAppButton = () => {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* WhatsApp SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="currentColor"
        className="whatsapp-icon"
        aria-hidden="true"
      >
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.469 2.027 7.77L0 32l8.451-2.002A15.934 15.934 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.283 13.283 0 0 1-6.775-1.848l-.485-.288-5.017 1.187 1.208-4.894-.318-.502A13.289 13.289 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.281-9.986c-.398-.2-2.354-1.162-2.72-1.295-.365-.133-.631-.2-.896.2-.267.398-1.029 1.295-1.262 1.562-.232.267-.465.3-.863.1-.398-.2-1.68-.62-3.2-1.976-1.183-1.056-1.98-2.36-2.213-2.758-.232-.4-.025-.615.175-.814.179-.178.398-.465.597-.697.2-.232.266-.399.399-.665.133-.267.067-.5-.033-.698-.1-.2-.896-2.16-1.228-2.96-.323-.777-.651-.672-.896-.683l-.763-.013c-.267 0-.698.1-1.064.5-.365.398-1.395 1.363-1.395 3.323s1.429 3.856 1.628 4.122c.2.267 2.812 4.294 6.815 6.023.953.412 1.696.658 2.275.842.956.304 1.826.261 2.514.158.767-.114 2.354-.963 2.687-1.893.333-.93.333-1.728.233-1.893-.1-.167-.365-.267-.763-.467z" />
      </svg>
      {hovered && (
        <span className="whatsapp-tooltip">Chat with us</span>
      )}
    </a>
  );
};

export default WhatsAppButton;
