// SEO Component for dynamic meta tags
import { useEffect } from 'react';

const toAbsoluteUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${window.location.origin}${path}`;
};

const SEO = ({ 
  title = "SAPTech Uganda | Web Design, Software, IoT & Engineering",
  description = "SAPTech Uganda offers engineering and technology services for clients in Uganda and worldwide, including web design, software development, IoT systems, electrical designs, graphics, cloud, cybersecurity, and digital transformation.",
  keywords = "SAPTech Uganda, technology company Uganda, web design worldwide, web design Uganda, software development worldwide, software development Uganda, IoT projects Uganda, electrical engineering Uganda",
  ogImage = "/images/logo.png",
  url,
  ogType = "website",
  canonicalUrl,
  robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  structuredData = null
}) => {
  useEffect(() => {
    const resolvedUrl = toAbsoluteUrl(url) || window.location.href;
    const resolvedCanonical = toAbsoluteUrl(canonicalUrl) || resolvedUrl;
    const resolvedOgImage = toAbsoluteUrl(ogImage);

    // Update page title
    document.title = title;

    // Update meta description
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    updateMetaTag('name', 'robots', robots);

    // Update Open Graph tags
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', resolvedUrl);
    updateMetaTag('property', 'og:image', resolvedOgImage);

    // Update Twitter Card tags
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', resolvedOgImage);

    // Keep canonical URL aligned with route
    updateLinkTag('canonical', resolvedCanonical);

    // Inject route-level structured data if provided
    updateStructuredData(structuredData);
  }, [title, description, keywords, ogImage, url, ogType, canonicalUrl, robots, structuredData]);

  return null;
};

// Helper function to update meta tags
const updateMetaTag = (attribute, key, content) => {
  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  
  if (element) {
    element.setAttribute('content', content);
  } else {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
};

const updateLinkTag = (rel, href) => {
  let element = document.querySelector(`link[rel="${rel}"]`);

  if (element) {
    element.setAttribute('href', href);
  } else {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    element.setAttribute('href', href);
    document.head.appendChild(element);
  }
};

const updateStructuredData = (structuredData) => {
  const existing = document.getElementById('dynamic-structured-data');

  if (!structuredData) {
    if (existing) existing.remove();
    return;
  }

  const script = existing || document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'dynamic-structured-data';
  script.textContent = JSON.stringify(structuredData);

  if (!existing) {
    document.head.appendChild(script);
  }
};

export default SEO;

