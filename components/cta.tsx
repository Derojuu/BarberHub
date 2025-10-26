import Link from "next/link"

export default function CTA() {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Ready to Start Earning?</h2>
        <p className="text-lg mb-8 opacity-90 text-balance">
          Join thousands of customers enjoying premium barbershop rewards
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-opacity-90 transition"
        >
          Create Your Account
        </Link>
      </div>
    </section>
  )
}
