/** Public company contacts shared by the website and downloadable calculations. */
export const SITE_CONTACTS = {
  phone: "8 (800) 600-40-36",
  phoneHref: "tel:88006004036",
  telegramUrl: "https://t.me/posadmin_request_bot",
  managerHours: "По будням с 10:00 до 19:00 МСК",
  offices: [
    {
      city: "Люберцы",
      region: "Московская область",
      street: "Октябрьский проспект, д. 1",
      mapQuery: "Московская область, Люберцы, Октябрьский проспект, 1",
    },
    {
      city: "Новороссийск",
      region: "Краснодарский край",
      street: "ул. Видова, д. 4, офис 7",
      mapQuery: "Краснодарский край, Новороссийск, улица Видова, 4",
    },
  ],
} as const;
