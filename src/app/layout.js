import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://hornza.com"),
  title: {
    default: "Hornza - East Africa's Verified Property Marketplace | Rent, Buy & Furnished Stays",
    template: "%s | Hornza",
  },
  description:
    "East Africa's trusted property marketplace. Rent apartments, buy homes, or book furnished stays — all video-verified. No broker fees, direct owner contact. Browse properties in Nairobi, Mombasa, Dar es Salaam, and across East Africa.",
  keywords: [
    "East Africa property marketplace",
    "rent apartment Nairobi",
    "houses for rent Kenya",
    "buy property East Africa",
    "furnished apartment Nairobi",
    "Nairobi rentals",
    "Eastleigh apartments",
    "Mombasa property",
    "Dar es Salaam rentals",
    "Kampala property",
    "verified properties East Africa",
    "no broker fees",
    "Airbnb East Africa",
    "short stay Nairobi",
    "property for sale Kenya",
    "bedsitter Nairobi",
    "rental marketplace Africa",
    "property Kenya Uganda Tanzania",
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
    url: "https://hornza.com",
    siteName: "Hornza",
    title: "Hornza - East Africa's Verified Property Marketplace | Rent, Buy & Furnished Stays",
    description:
      "East Africa's trusted property marketplace. Rent apartments, buy homes, or book furnished stays — all video-verified. No broker fees, direct owner contact.",
    images: [
      {
        url: "/android-chrome-512x512.png",
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
    images: ["/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64 32x32 24x24 16x16" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
              url: "https://hornza.com",
              logo: "https://hornza.com/android-chrome-512x512.png",
              image: "https://hornza.com/android-chrome-512x512.png",
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
                { "@type": "City", name: "Mombasa" },
                { "@type": "City", name: "Dar es Salaam" },
                { "@type": "City", name: "Kampala" },
              ],
              sameAs: ["https://www.instagram.com/hornza"],
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
              url: "https://hornza.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://hornza.com/properties?search={search_term_string}",
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
