import Footer from "@/components/Footer"
import Header from "@/components/Header"
import Partners from "@/components/Partners"
import About from "@/components/About"
import Feature from "@/components/Feature"
import Brand from "@/components/Brand"
import GettingStarted from "@/components/GettingStarted"
import FAQ from "@/components/FAQ"
import CTA from "@/components/CTA"

export default function LandingPage() {

  return (
    <main>
      {/* header */}
      <Header />

      {/* Partners Section */}
      <Partners />

      {/* About Section */}
      <About />

      {/* Featured Brands Section */}
      <Feature />
      <Brand />

      {/* Getting Started Section */}
      <GettingStarted />


      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <CTA/>


      {/* Footer */}
      <Footer />
    </main>
  )
}


