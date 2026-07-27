import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://www.hornza.org"),
  title: {
    default: "Hornza - East Africa's Verified Property Marketplace | Rent, Buy & Furnished Stays",
    template: "%s | Hornza",
  },
  description:
    "East Africa's trusted property marketplace. Rent apartments, buy homes, or book furnished stays — all video-verified. No broker fees, direct owner contact. Browse properties in Nairobi, Eastleigh, Mombasa, Mogadishu, Dar es Salaam, and across East Africa. Guri kiro Nairobi iyo Muqdisho.",
  keywords: [
    // ── Core brand ──
    "East Africa property marketplace",
    "verified properties East Africa",
    "rental marketplace Africa",
    "no broker fees",
    "video verified apartments",

    // ── Eastleigh (primary market) ──
    "Eastleigh apartments",
    "apartments in Eastleigh Nairobi",
    "rent house Eastleigh",
    "bedsitter Eastleigh",
    "1 bedroom apartment Eastleigh",
    "2 bedroom apartment Eastleigh",
    "3 bedroom apartment Eastleigh",
    "furnished apartment Eastleigh",
    "Eastleigh Section 1 apartments",
    "Eastleigh Section 2 apartments",
    "Eastleigh Section 3 apartments",
    "Eastleigh Section 7 apartments",
    "California Eastleigh apartments",
    "cheap apartments Eastleigh Nairobi",
    "rental scam Eastleigh",

    // ── Nairobi ──
    "rent apartment Nairobi",
    "houses for rent Kenya",
    "Nairobi rentals",
    "furnished apartment Nairobi",
    "short stay Nairobi",
    "bedsitter Nairobi",
    "cheap bedsitter Nairobi",
    "apartments near me Nairobi",
    "Airbnb Nairobi",
    "South C apartments Nairobi",
    "Pangani apartments Nairobi",

    // ── Kenya ──
    "buy property East Africa",
    "property for sale Kenya",
    "Mombasa property",
    "Mombasa apartments for rent",

    // ── Somalia / Mogadishu ──
    "apartments Mogadishu",
    "rent house Mogadishu",
    "property for sale Mogadishu",
    "furnished apartments Mogadishu",
    "Mogadishu real estate",
    "guri kiro Muqdisho",
    "kiro guri Mogadishu",

    // ── East Africa expansion ──
    "Dar es Salaam rentals",
    "Kampala property",
    "property Kenya Uganda Tanzania",
    "Airbnb East Africa",
    "property marketplace Somalia",
    "East Africa real estate",

    // ── Somali language keywords ──
    "guri kiro Nairobi",
    "guri kiro Eastleigh",
    "guryo iib ah Nairobi",
    "guryo kiro ah Eastleigh",
    "bedsitter kiro Nairobi",
    "aqar Nairobi",
    "guri la kireeyay Nairobi",
    "kiro guryo Muqdisho",
    "guryo iib ah Muqdisho",
    "suuq guryaha East Africa",
  ],
  authors: [{ name: "Hornza" }],
  creator: "Hornza",
  publisher: "Hornza",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://www.hornza.org",
    siteName: "Hornza",
    title: "Hornza - East Africa's Verified Property Marketplace | Rent, Buy & Furnished Stays",
    description:
      "East Africa's trusted property marketplace. Rent apartments, buy homes, or book furnished stays — all video-verified. No broker fees, direct owner contact.",
    images: [
      {
        url: "/herobcg.png",
        width: 512,
        height: 512,
        alt: "Hornza Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hornza - East Africa's Verified Property Marketplace | Rent, Buy & Furnished Stays",
    description:
      "East Africa's trusted property marketplace. Rent apartments, buy homes, or book furnished stays — all video-verified. No broker fees, direct owner contact.",
    images: ["/herobcg.png"],
  },
  icons: {
    icon: [],
  },
  manifest: "/manifest.json",
  other: {
    "geo.region": "KE-110",
    "geo.placename": "Nairobi, Kenya",
    "geo.position": "-1.286389;36.817223",
    ICBM: "-1.286389, 36.817223",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              name: "Hornza",
              description:
                "East Africa's trusted video-verified property marketplace. Rent apartments, buy homes, or book furnished stays. Direct connections between property owners and tenants without broker fees.",
              url: "https://www.hornza.org",
              logo: "https://www.hornza.org/herobcg.png",
              image: "https://www.hornza.org/herobcg.png",
              telephone: "+254790958286",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Al-amin Building, 3rd Floor, Jam Street",
                addressLocality: "Eastleigh",
                addressRegion: "Nairobi",
                postalCode: "00100",
                addressCountry: "KE",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "-1.286389",
                longitude: "36.817223",
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "09:00",
                  closes: "18:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Saturday",
                  opens: "10:00",
                  closes: "16:00",
                },
              ],
              priceRange: "KES 1,000",
              areaServed: [
                { "@type": "City", name: "Nairobi" },
                { "@type": "City", name: "Eastleigh" },
                { "@type": "City", name: "Mombasa" },
                { "@type": "City", name: "Mogadishu" },
                { "@type": "City", name: "Dar es Salaam" },
                { "@type": "City", name: "Kampala" },
              ],
              sameAs: [
                "https://www.instagram.com/hornza_1/",
                "https://www.youtube.com/@Hornza_1",
                "https://www.tiktok.com/@hornza1",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Hornza",
              url: "https://www.hornza.org",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://www.hornza.org/properties?search={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background flex flex-col font-body antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
