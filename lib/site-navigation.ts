export const HOME_NAVIGATION = [
  { id: "pricing", href: "/#pricing", label: "Сопровождение" },
  { id: "launch", href: "/#launch", label: "Проект" },
  { id: "products", href: "/#products", label: "Продукты" },
  { id: "about", href: "/#about", label: "О нас" },
  { id: "contact", href: "/#contact", label: "Контакты" },
] as const;

export const SITE_PRODUCTS = {
  rezebra: { name: "Rezebra", category: "Система бронирования" },
  flexbonus: { name: "Flexbonus", category: "Система лояльности" },
  foxControl: { name: "Fox Control", category: "Система аналитики" },
} as const;

export const PRODUCT_NAVIGATION = [
  { href: "/#flexbonusb", label: SITE_PRODUCTS.flexbonus.name, description: "Лояльность гостей" },
  { href: "/#rezebra", label: SITE_PRODUCTS.rezebra.name, description: "Бронирование столов" },
  { href: "/#foxcontrol", label: SITE_PRODUCTS.foxControl.name, description: "Контроль операций" },
] as const;
