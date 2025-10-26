import Link from "next/link"

export default function Hero() {
  return (
    <section className="py-20 md:py-32 bg-linear-to-b from-background to-white">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6 text-balance">Premium Barbershop Rewards</h1>
          <p className="text-lg md:text-xl text-foreground mb-8 text-balance">
            Earn points with every visit and unlock exclusive rewards. Join our community of satisfied customers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
            >
              Get Started
            </Link>
            <Link
              href="/services"
              className="px-8 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition"
            >
              View Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
