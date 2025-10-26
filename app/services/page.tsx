import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import ServiceCard from "@/components/service-card"
import ServicesAuthStatus from "@/components/services-auth-status"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function Services() {
  const haircuts = await prisma.haircut.findMany({ orderBy: { createdAt: "desc" } })

  // haircuts come from Prisma and match the Haircut model (title, description, price, pointValue, image)

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />
      <section className="flex-1 py-16 bg-background">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 text-balance">Our Services</h1>
          <p className="text-lg text-muted-foreground mb-12 text-balance">Premium barbershop services with rewards on every visit</p>
          <ServicesAuthStatus />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {haircuts.map((hc) => (
              <ServiceCard key={hc.id} service={hc as any} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
