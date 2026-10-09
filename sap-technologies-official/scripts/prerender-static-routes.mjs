import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const SITE_URL = "https://saptechug.com";
const ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const coreKeywords = [
  "Saptech Uganda",
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
    title: "Saptech Uganda | Engineering & Technology Solutions",
    description: "Saptech Uganda builds practical websites, software, IoT systems, electrical designs, branding, cloud, cybersecurity, and power solutions for businesses, schools, startups, homes, and organizations.",
    keywords: `${coreKeywords}, engineering and technology solutions`,
    image: "/images/logo.png"
  },
  {
    path: "/about",
    title: "About Saptech Uganda | Engineering & Technology Team",
    description: "Learn about Saptech Uganda, a Ndejje, Kampala technology and engineering team building websites, software, IoT systems, electrical designs, branding, and digital tools for businesses and communities.",
    keywords: `${coreKeywords}, about Saptech Uganda, technology team Uganda, engineering company Kampala, Ndejje Kampala technology`,
    image: "/images/me.jpg"
  },
  {
    path: "/services",
    title: "Services | Web, Software, IoT & Engineering",
    description: "Explore Saptech Uganda services: website design, ecommerce sites, custom software, mobile apps, cloud, cybersecurity, IoT automation, smart homes, electrical designs, lithium battery power, graphics, and branding.",
    keywords: `${coreKeywords}, ecommerce website Uganda, business website Uganda, IoT services Uganda, Arduino projects Uganda`,
    image: "/images/WEB-DESIGN.jpg"
  },
  {
    path: "/portfolio",
    title: "Projects & Portfolio | Saptech Uganda",
    description: "View Saptech Uganda projects including ecommerce platforms, business websites, school management systems, inventory systems, restaurant ordering apps, IoT dashboards, mobile apps, and branding work.",
    keywords: `${coreKeywords}, Saptech Uganda projects, technology portfolio Uganda, software projects Kampala`,
    image: "/images/ecommerce-platform.jpg"
  },
  {
    path: "/products",
    title: "Technology Products | Saptech Uganda",
    description: "Browse Saptech Uganda technology products, electronics, software tools, power solutions, IoT devices, and digital business systems available for order or custom build.",
    keywords: `${coreKeywords}, Saptech Uganda products, technology products Uganda, electronics products Uganda, IoT devices Uganda`,
    image: "/images/sap-business-management.png"
  },
  {
    path: "/software",
    title: "Software Apps & Business Systems | Saptech Uganda",
    description: "Explore Saptech Uganda software apps, custom web applications, business management systems, ecommerce tools, school systems, inventory systems, dashboards, and digital business platforms.",
    keywords: `${coreKeywords}, software apps Uganda, business management software, school management system Uganda, inventory management system`,
    image: "/images/software.jpg"
  },
  {
    path: "/iot",
    title: "IoT Projects, Automation & Smart Systems | Saptech Uganda",
    description: "Explore Saptech Uganda IoT projects, smart home systems, security systems, farm monitoring, industrial automation, Arduino, Raspberry Pi, ESP32, sensors, and connected devices.",
    keywords: `${coreKeywords}, Internet of Things Uganda, smart home systems Uganda, automation projects Uganda, sensor networks Uganda`,
    image: "/images/ioT.jpg"
  },
  {
    path: "/insights",
    title: "Insights | Practical Technology Guides from Saptech Uganda",
    description: "Read practical Saptech Uganda guides on planning websites, choosing custom software, using IoT systems, and making better engineering and technology decisions for real organizations.",
    keywords: `${coreKeywords}, technology guides Uganda, website planning Uganda, custom software advice Uganda, IoT automation advice`,
    image: "/images/logo.png"
  },
  {
    path: "/gallery",
    title: "Gallery | Saptech Uganda Projects, Services & Team",
    description: "View photos from Saptech Uganda projects, services, events, team moments, office work, and technology activities across software, IoT, design, and engineering.",
    keywords: `${coreKeywords}, Saptech Uganda gallery, Saptech photos, technology projects Uganda`,
    image: "/images/banner2.jpg"
  },
  {
    path: "/awards",
    title: "Saptech Awards 2026 | Saptech Uganda",
    description: "Explore Saptech Awards 2026 nominations, categories, votes, and technology excellence recognition from Saptech Uganda.",
    keywords: `${coreKeywords}, Saptech Awards 2026, technology awards Uganda, engineering awards Uganda`,
    image: "/images/logo.png"
  },
  {
    path: "/careers",
    title: "Careers | Join Saptech Uganda",
    description: "Explore open career opportunities at Saptech Uganda and apply to join a team building websites, software, IoT systems, engineering solutions, and digital tools.",
    keywords: `${coreKeywords}, Saptech Uganda careers, technology jobs Uganda, software jobs Kampala, engineering jobs Uganda`,
    image: "/images/logo.png"
  },
  {
    path: "/team",
    title: "Our Team | Saptech Uganda",
    description: "Meet the people behind Saptech Uganda. Our team brings together software development, engineering, automation, and creative design to build practical technology with people in mind.",
    keywords: `${coreKeywords}, Saptech Uganda team, technology team Kampala, software developers Uganda, engineering and design team`,
    image: "/images/me.jpg"
  },
  {
    path: "/partners",
    title: "Partners | Saptech Uganda",
    description: "Meet Saptech Uganda partners and collaborators supporting technology, engineering, software, IoT, electronics, education, and digital business growth in Uganda.",
    keywords: `${coreKeywords}, Saptech Uganda partners, technology partners Uganda, business partners Kampala`,
    image: "/images/logo.png"
  },
  {
    path: "/companies",
    title: "Platforms & Companies | Saptech Uganda",
    description: "Explore Saptech Uganda platforms, connected companies, and technology initiatives across software, engineering, IoT, products, education, and digital services.",
    keywords: `${coreKeywords}, Saptech Uganda platforms, Uganda technology platforms, digital platforms Uganda`,
    image: "/images/logo.png"
  },
  {
    path: "/testimonials",
    title: "Testimonials | Saptech Uganda",
    description: "Read client feedback and testimonials from people and organizations working with Saptech Uganda on websites, software, engineering, IoT, products, and digital projects.",
    keywords: `${coreKeywords}, Saptech Uganda testimonials, Saptech reviews, technology company reviews Uganda`,
    image: "/images/testimonial-jk.jpg"
  },
  {
    path: "/contact",
    title: "Contact Saptech Uganda",
    description: "Contact Saptech Uganda in Ndejje, Kampala for web design, software development, mobile apps, IoT systems, electrical engineering, graphics, cloud, cybersecurity, power solutions, and digital transformation projects.",
    keywords: `${coreKeywords}, contact Saptech Uganda, Saptech Kampala, Ndejje Kampala technology, software developer Uganda contact`,
    image: "/images/logo.png"
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy | Saptech Uganda",
    description: "Read the Saptech Uganda privacy policy, including how we handle contact information, cookies, analytics, advertising partners, and user data.",
    keywords: "Saptech Uganda privacy policy, Saptech cookies, Saptech advertising privacy",
    image: "/images/logo.png"
  },
  {
    path: "/terms-of-service",
    title: "Terms of Service | Saptech Uganda",
    description: "Read Saptech Uganda terms of service for website use, technology services, software projects, engineering work, payments, intellectual property, and support.",
    keywords: "Saptech Uganda terms of service, Saptech service terms, technology services terms",
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
