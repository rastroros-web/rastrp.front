import type { Metadata } from "next";
import { BRAND, INSTAGRAM_URL, WHATSAPP_DISPLAY } from "@/data/brand";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://rastro.com.ar";

export const SITE_NAME = `${BRAND.name} | ${BRAND.tagline}`;

export const DEFAULT_DESCRIPTION = `${BRAND.bio}. Tienda online de zapatillas Nike, Adidas, Vans y más. 25% OFF por transferencia, 3 cuotas sin interés y envíos a todo el país. WhatsApp ${WHATSAPP_DISPLAY}.`;

export const DEFAULT_KEYWORDS = [
  "zapatillas",
  "zapatillas Argentina",
  "zapatillas online",
  "Nike",
  "Adidas",
  "Vans",
  "New Balance",
  "Puma",
  "Converse",
  "calzado",
  "tienda de zapatillas",
  "Rastro",
  "rastro rosario",
  "mega sale zapatillas",
  "zapatillas baratas",
];

export const DEFAULT_OG_IMAGE = "/assets/logo/rastro-logo.webp";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt = SITE_NAME,
  keywords,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : undefined;

  return {
    title,
    description,
    keywords: keywords ?? DEFAULT_KEYWORDS,
    alternates: {
      canonical,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url: canonical,
      siteName: BRAND.name,
      title,
      description,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: imageAlt,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${BRAND.name}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name, url: SITE_URL }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: "shopping",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "es-AR": SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: BRAND.name,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND.name,
  url: SITE_URL,
  logo: absoluteUrl(DEFAULT_OG_IMAGE),
  description: BRAND.bio,
  sameAs: [INSTAGRAM_URL],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: `+54-${WHATSAPP_DISPLAY.replace(/\s/g, "-")}`,
    contactType: "customer service",
    areaServed: "AR",
    availableLanguage: ["Spanish"],
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: "es-AR",
  publisher: {
    "@type": "Organization",
    name: BRAND.name,
    logo: absoluteUrl(DEFAULT_OG_IMAGE),
  },
};

type ProductJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  brand: string;
  image?: string;
  price: number;
  currency?: string;
  inStock: boolean;
};

export function productJsonLd({
  name,
  description,
  slug,
  brand,
  image,
  price,
  currency = "ARS",
  inStock,
}: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image ? absoluteUrl(image) : undefined,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/productos/${slug}`),
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: BRAND.name,
      },
    },
  };
}
