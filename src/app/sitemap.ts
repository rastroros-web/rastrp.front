import type { MetadataRoute } from "next";
import { catalog } from "@/data/catalog";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/productos",
  "/mega-sale",
  "/liquidacion",
  "/nike",
  "/adidas",
  "/vans",
  "/new-balance",
  "/puma",
  "/converse",
  "/samba",
  "/summer",
  "/promo",
  "/nuevos-ingresos",
  "/ultimos-pares",
  "/talles-altos",
  "/talles-bajos",
  "/favoritos",
  "/quienes-somos",
  "/contacto",
  "/faq",
  "/envios",
  "/puntos-de-retiro",
  "/guia-de-talles",
  "/cambios",
  "/terminos",
  "/privacidad",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/productos" ? 0.9 : 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = catalog.map((product) => ({
    url: `${SITE_URL}/productos/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
