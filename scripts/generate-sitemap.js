#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://rotationales.com';

const routes = [
  { url: '/', priority: 1.0, changefreq: 'monthly' },
  { url: '/shop', priority: 0.9, changefreq: 'weekly' },
  { url: '/about', priority: 0.8, changefreq: 'monthly' },
  { url: '/contact', priority: 0.8, changefreq: 'monthly' },
  { url: '/pumps', priority: 0.9, changefreq: 'weekly' },
  { url: '/mechanical-seals', priority: 0.9, changefreq: 'weekly' },
  { url: '/packing', priority: 0.9, changefreq: 'weekly' },
  { url: '/service-repair', priority: 0.9, changefreq: 'weekly' },
  { url: '/cart', priority: 0.3, changefreq: 'daily' },
  { url: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
  { url: '/refund-policy', priority: 0.3, changefreq: 'yearly' },
];

function generateSitemap() {
  const currentDate = new Date().toISOString();
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  routes.forEach(route => {
    sitemap += `
  <url>
    <loc>${DOMAIN}${route.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  });

  sitemap += `
</urlset>`;

  return sitemap;
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml`;
}

// Generate sitemap
const sitemapContent = generateSitemap();
const robotsContent = generateRobotsTxt();

// Write to public directory (assuming it gets built into the output)
const publicDir = path.resolve(__dirname, '../public');
const distDir = path.resolve(__dirname, '../dist');

// Ensure directories exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write files
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent);

// Also write to dist if it exists (for production builds)
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent);
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent);
}

console.log('✅ Sitemap and robots.txt generated successfully!');
console.log(`📍 Sitemap location: ${publicDir}/sitemap.xml`);
console.log(`🤖 Robots.txt location: ${publicDir}/robots.txt`);