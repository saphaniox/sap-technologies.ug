import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const SITE_URL = "https://saptechug.com";
const ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const coreKeywords = [
  "SAPTech Uganda",
  "technology company Uganda",
  "IT services Kampala",
  "web design Uganda",
  "custom software Uganda",
  "IoT projects Uganda",
  "smart home systems Uganda",
  "electrical engineering Uganda",
  "graphics design Uganda",
  "cloud services Uganda",
  "cybersecurity Uganda"
].join(", ");

const routes = [
  {
    path: "/",
    title: "SAPTech Uganda | Web Design, Software, IoT & Engineering",
    description: "SAPTech Uganda provides web design, custom software, mobile apps, IoT projects, electrical designs, lithium battery power solutions, graphics, cloud, cybersecurity, and digital transformation for clients in Uganda and worldwide.",
    keywords: `${coreKeywords}, web design worldwide, custom software worldwide`,
    image: "/images/logo.png"
  },
  {
    path: "/about",
    title: "About SAPTech Uganda | Engineering & Technology Team",
    description: "Learn about SAPTech Uganda, a Ndejje, Kampala technology and engineering team building websites, software, IoT systems, electrical designs, branding, and digital tools for businesses and communities.",
    keywords: `${coreKeywords}, about SAPTech Uganda, technology team Uganda, engineering company Kampala, Ndejje Kampala technology`,
    image: "/images/me.jpg"
  },
  {
    path: "/services",
    title: "Services | Web, Software, IoT & Engineering Worldwide",
    description: "Explore SAPTech Uganda services: website design, ecommerce sites, custom software, mobile apps, cloud, cybersecurity, IoT automation, smart homes, electrical designs, lithium battery power, graphics, and branding.",
    keywords: `${coreKeywords}, ecommerce website Uganda, business website Uganda, IoT services Uganda, Arduino projects Uganda`,
    image: "/images/WEB-DESIGN.jpg"
  },
  {
    path: "/portfolio",
    title: "Projects & Portfolio | SAPTech Uganda",
    description: "View SAPTech Uganda projects including ecommerce platforms, business websites, school management systems, inventory systems, restaurant ordering apps, IoT dashboards, mobile apps, and branding work.",
    keywords: `${coreKeywords}, SAPTech Uganda projects, technology portfolio Uganda, software projects Kampala`,
    image: "/images/ecommerce-platform.jpg"
  },
  {
    path: "/products",
    title: "Technology Products | SAPTech Uganda",
    description: "Browse SAPTech Uganda technology products, electronics, software tools, power solutions, IoT devices, and digital business systems available for order or custom build.",
    keywords: `${coreKeywords}, SAPTech Uganda products, technology products Uganda, electronics products Uganda, IoT devices Uganda`,
    image: "/images/sap-business-management.png"
  },
  {
    path: "/software",
    title: "Software Apps & Business Systems | SAPTech Uganda",
    description: "Explore SAPTech Uganda software apps, custom web applications, business management systems, ecommerce tools, school systems, inventory systems, dashboards, and digital business platforms.",
    keywords: `${coreKeywords}, software apps Uganda, business management software, school management system Uganda, inventory management system`,
    image: "/images/software.jpg"
  },
  {
    path: "/iot",
    title: "IoT Projects, Automation & Smart Systems | SAPTech Uganda",
    description: "Explore SAPTech Uganda IoT projects, smart home systems, security systems, farm monitoring, industrial automation, Arduino, Raspberry Pi, ESP32, sensors, and connected devices.",
    keywords: `${coreKeywords}, Internet of Things Uganda, smart home systems Uganda, automation projects Uganda, sensor networks Uganda`,
    image: "/images/ioT.jpg"
  },
  {
    path: "/gallery",
    title: "Gallery | SAPTech Uganda Projects, Services & Team",
    description: "View photos from SAPTech Uganda projects, services, events, team moments, office work, and technology activities across software, IoT, design, and engineering.",
    keywords: `${coreKeywords}, SAPTech Uganda gallery, SAPTech photos, technology projects Uganda`,
    image: "/images/banner2.jpg"
  },
  {
    path: "/awards",
    title: "SAPTech Awards 2026 | SAPTech Uganda",
    description: "Explore SAPTech Awards 2026 nominations, categories, votes, and technology excellence recognition from SAPTech Uganda.",
    keywords: `${coreKeywords}, SAPTech Awards 2026, technology awards Uganda, engineering awards Uganda`,
    image: "/images/logo.png"
  },
  {
    path: "/careers",
    title: "Careers | Join SAPTech Uganda",
    description: "Explore open career opportunities at SAPTech Uganda and apply to join a team building websites, software, IoT systems, engineering solutions, and digital tools.",
    keywords: `${coreKeywords}, SAPTech Uganda careers, technology jobs Uganda, software jobs Kampala, engineering jobs Uganda`,
    image: "/images/logo.png"
  },
  {
    path: "/partners",
    title: "Partners | SAPTech Uganda",
    description: "Meet SAPTech Uganda partners and collaborators supporting technology, engineering, software, IoT, electronics, education, and digital business growth in Uganda.",
    keywords: `${coreKeywords}, SAPTech Uganda partners, technology partners Uganda, business partners Kampala`,
    image: "/images/logo.png"
  },
  {
    path: "/companies",
    title: "Platforms & Companies | SAPTech Uganda",
    description: "Explore SAPTech Uganda platforms, connected companies, and technology initiatives across software, engineering, IoT, products, education, and digital services.",
    keywords: `${coreKeywords}, SAPTech Uganda platforms, Uganda technology platforms, digital platforms Uganda`,
    image: "/images/logo.png"
  },
  {
    path: "/testimonials",
    title: "Testimonials | SAPTech Uganda",
    description: "Read client feedback and testimonials from people and organizations working with SAPTech Uganda on websites, software, engineering, IoT, products, and digital projects.",
    keywords: `${coreKeywords}, SAPTech Uganda testimonials, SAPTech reviews, technology company reviews Uganda`,
    image: "/images/testimonial-jk.jpg"
  },
  {
    path: "/contact",
    title: "Contact SAPTech Uganda",
    description: "Contact SAPTech Uganda in Ndejje, Kampala for web design, software development, mobile apps, IoT systems, electrical engineering, graphics, cloud, cybersecurity, power solutions, and digital transformation projects.",
    keywords: `${coreKeywords}, contact SAPTech Uganda, SAPTech Kampala, Ndejje Kampala technology, software developer Uganda contact`,
    image: "/images/logo.png"
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | SAPTech Uganda",
    description: "Read the SAPTech Uganda privacy policy, including how we handle contact information, cookies, analytics, Google AdSense advertising, and user data.",
    keywords: "SAPTech Uganda privacy policy, SAPTech cookies, SAPTech AdSense privacy",
    image: "/images/logo.png"
  },
  {
    path: "/terms-of-service",
    title: "Terms of Service | SAPTech Uganda",
    description: "Read SAPTech Uganda terms of service for website use, technology services, software projects, engineering work, payments, intellectual property, and support.",
    keywords: "SAPTech Uganda terms of service, SAPTech service terms, technology services terms",
    image: "/images/logo.png"
  }
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const absoluteUrl = (routePath) => `${SITE_URL}${routePath === "/" ? "" : routePath}`;
const absoluteAsset = (assetPath) => `${SITE_URL}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;

const upsertMeta = (html, selector, tag) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta\\s+[^>]*${escapedSelector}[^>]*>`, "i");
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
};

const upsertLink = (html, rel, tag) => {
  const regex = new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*>`, "i");
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
};

const renderPageHtml = (template, route) => {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const keywords = escapeHtml(route.keywords);
  const url = absoluteUrl(route.path);
  const image = absoluteAsset(route.image);

  let html = template.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
  html = upsertMeta(html, 'name="title"', `<meta name="title" content="${title}" />`);
  html = upsertMeta(html, 'name="description"', `<meta name="description" content="${description}" />`);
  html = upsertMeta(html, 'name="keywords"', `<meta name="keywords" content="${keywords}" />`);
  html = upsertMeta(html, 'name="robots"', `<meta name="robots" content="${ROBOTS}" />`);
  html = upsertLink(html, "canonical", `<link rel="canonical" href="${url}" />`);
  html = upsertMeta(html, 'property="og:url"', `<meta property="og:url" content="${url}" />`);
  html = upsertMeta(html, 'property="og:title"', `<meta property="og:title" content="${title}" />`);
  html = upsertMeta(html, 'property="og:description"', `<meta property="og:description" content="${description}" />`);
  html = upsertMeta(html, 'property="og:image"', `<meta property="og:image" content="${image}" />`);
  html = upsertMeta(html, 'name="twitter:url"', `<meta name="twitter:url" content="${url}" />`);
  html = upsertMeta(html, 'name="twitter:title"', `<meta name="twitter:title" content="${title}" />`);
  html = upsertMeta(html, 'name="twitter:description"', `<meta name="twitter:description" content="${description}" />`);
  html = upsertMeta(html, 'name="twitter:image"', `<meta name="twitter:image" content="${image}" />`);

  return html;
};

const writeRouteFile = async (route, html) => {
  if (route.path === "/") {
    await writeFile(path.join(distDir, "index.html"), html, "utf8");
    return;
  }

  const routeDir = path.join(distDir, route.path.replace(/^\//, ""));
  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, "index.html"), html, "utf8");
};

const template = await readFile(path.join(distDir, "index.html"), "utf8");

await Promise.all(
  routes.map(async (route) => {
    const html = renderPageHtml(template, route);
    await writeRouteFile(route, html);
  })
);

console.log(`Prerendered ${routes.length} indexable route HTML files.`);
