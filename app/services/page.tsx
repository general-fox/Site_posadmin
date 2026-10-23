import { permanentRedirect } from "next/navigation";

// Keep existing bookmarks useful after retiring the public service catalogue.
export default function ServicesPage() {
  permanentRedirect("/#launch");
}
