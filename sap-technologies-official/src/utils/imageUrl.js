import apiService from '../services/api';

const normalizeImagePath = (imagePath) => {
  if (!imagePath) return null;

  if (typeof imagePath === 'object') {
    return imagePath.url || imagePath.secure_url || imagePath.src || imagePath.path || null;
  }

  return String(imagePath);
};

export const getImageUrl = (imagePath) => {
  const normalizedPath = normalizeImagePath(imagePath);
  if (!normalizedPath) return null;
  
  const pathStr = normalizedPath.trim();
  if (!pathStr) return null;
  
  // If it's already a browser-safe absolute URL, use it directly
  if (
    pathStr.startsWith('http://') ||
    pathStr.startsWith('https://') ||
    pathStr.startsWith('blob:') ||
    pathStr.startsWith('data:')
  ) {
    return pathStr;
  }
  
  // Otherwise, it's a local path - prepend the API base URL
  return `${apiService.baseURL}${pathStr}`;
};

export const getImageUrlWithFallback = (imagePath, placeholder) => {
  return getImageUrl(imagePath) || placeholder;
};

export const isCloudinaryUrl = (path) => {
  return path && typeof path === 'string' && path.includes('cloudinary.com');
};

export const getOptimizedVideoUrl = (videoPath, options = {}) => {
  const url = getImageUrl(videoPath);
  if (!url) return null;

  const uploadMarker = '/video/upload/';
  if (!isCloudinaryUrl(url) || !url.includes(uploadMarker)) {
    return url;
  }

  const markerIndex = url.indexOf(uploadMarker);
  const prefix = url.slice(0, markerIndex + uploadMarker.length);
  const suffix = url.slice(markerIndex + uploadMarker.length);
  const firstSegment = suffix.split('/')[0] || '';

  if (/^(q_|f_|vc_|w_|c_|e_)/.test(firstSegment)) {
    return url;
  }

  const width = Number.isFinite(Number(options.width)) ? Number(options.width) : 1280;
  const quality = options.quality || 'auto:eco';
  const transformation = `q_${quality},f_auto,vc_auto,w_${width},c_limit`;

  return `${prefix}${transformation}/${suffix}`;
};

/**
 * SVG placeholders for missing images
 */
export const PLACEHOLDERS = {
  product: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%236b7280' font-family='Arial' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image Available%3C/text%3E%3C/svg%3E",
  
  avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='Arial' font-size='16' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Photo%3C/text%3E%3C/svg%3E",
  
  logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f9fafb' width='200' height='200'/%3E%3Ctext fill='%236b7280' font-family='Arial' font-size='16' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Logo%3C/text%3E%3C/svg%3E",
  
  software: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23764ba2;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='400' height='300'/%3E%3Ctext fill='white' font-family='Arial' font-size='18' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%92%BB Software%3C/text%3E%3C/svg%3E",
  
  iot: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Cdefs%3E%3ClinearGradient id='iot-grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2310b981;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2306b6d4;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23iot-grad)' width='400' height='300'/%3E%3Ctext fill='white' font-family='Arial' font-size='18' font-weight='bold' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%94%8C IoT Project%3C/text%3E%3C/svg%3E",
  
  error: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23fee2e2' width='400' height='300'/%3E%3Ctext fill='%23dc2626' font-family='Arial' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage Error%3C/text%3E%3C/svg%3E"
};

export default getImageUrl;
