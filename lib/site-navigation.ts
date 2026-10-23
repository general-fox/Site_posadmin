export const HOME_NAVIGATION = [
  { id: "about", href: "/#about", label: "О нас" },
  { id: "pricing", href: "/#pricing", label: "Сопровождение" },
  { id: "launch", href: "/#launch", label: "Проект" },
  { id: "products", href: "/#products", label: "Продукты" },
  { id: "contact", href: "/#contact", label: "Контакты" },
] as const;

export const PRODUCT_NAVIGATION = [
  { href: "/#rezebra", label: "ReZebra", description: "Бронирование столов" },
  { href: "/#flexbonusb", label: "FlexBonusb", description: "Лояльность гостей" },
  { href: "/#foxcontrol", label: "Fox Control", description: "Контроль операций" },
] as const;
