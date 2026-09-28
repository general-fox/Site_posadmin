export const HOME_NAVIGATION = [
  { id: "about", href: "/#about", label: "О нас" },
  { id: "pricing", href: "/#pricing", label: "Тарифы" },
  { id: "services", href: "/#services", label: "Услуги" },
  { id: "products", href: "/#products", label: "Продукты" },
  { id: "contact", href: "/#contact", label: "Контакты" },
] as const;

export const SERVICE_NAVIGATION = [
  { href: "/services/soprovozhdenie-r-keeper", label: "Сопровождение r_keeper", description: "Поддержка вашей команды" },
  { href: "/services/avtomatizaciya-restoranov", label: "Автоматизация ресторанов", description: "Запуск и настройка систем" },
  { href: "/services/it-administrirovanie", label: "IT-администрирование", description: "Сеть и инфраструктура" },
  { href: "/services/obsluzhivanie-kkt", label: "Кассовая техника", description: "Настройка и обслуживание ККТ" },
  { href: "/services/egais-markirovka", label: "ЕГАИС и маркировка", description: "Работа с государственными системами" },
  { href: "/services/vyezdnoe-soprovozhdenie", label: "Выездное сопровождение", description: "Инженер на вашем объекте" },
  { href: "/services/integracii", label: "Разработка и интеграции", description: "Связь сервисов и процессов" },
] as const;

export const PRODUCT_NAVIGATION = [
  { href: "/#rezebra", label: "ReZebra", description: "Бронирование столов" },
  { href: "/#flexbonusb", label: "FlexBonusb", description: "Лояльность гостей" },
] as const;
