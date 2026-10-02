export const INSTAGRAM_URL = "https://www.instagram.com/rastro.ros/";
export const INSTAGRAM_HANDLE = "@rastro.ros";

/** Marcas y colecciones del desplegable "Productos" del menú mobile. */
export const SHOP_BRANDS = [
  { label: "Adidas", href: "/adidas" },
  { label: "Nike", href: "/nike" },
  { label: "New Balance", href: "/new-balance" },
  { label: "Vans", href: "/vans" },
  { label: "Birk cuero", href: "/birk-cuero" },
  { label: "Mujer", href: "/mujer" },
  { label: "Hombre", href: "/hombre" },
  { label: "Verano", href: "/summer" },
  { label: "Mega Sale", href: "/mega-sale" },
] as const;

/** WhatsApp Rosario — sin + ni espacios en el link */
export const WHATSAPP_NUMBER = "3413515773";
export const WHATSAPP_DISPLAY = "341 351-5773";
export const WHATSAPP_URL = `https://wa.me/54${WHATSAPP_NUMBER}`;

export function whatsappUrl(text?: string) {
  if (!text?.trim()) return WHATSAPP_URL;
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text.trim())}`;
}

/** Paleta original Rastro */
export const COLORS = {
  ink: "#222222",
  cream: "#F5F4F0",
  white: "#FFFFFF",
  offwhite: "#EFEEEC",
  brand: "#563128",
} as const;

export const BRAND = {
  name: "RASTRO",
  tagline: "Zapatillas",
  bio: "Calzado en tendencia al alcance de todos",
  highlights: [
    "Tienda online",
    "Envíos a todo el país",
    "Puntos de retiro Rosario",
  ],
  posts: 92,
  followers: 1419,
} as const;
