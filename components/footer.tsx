import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-accent">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-primary mb-4">BarberHub</h3>
            <p className="text-foreground text-sm opacity-75">Premium barbershop rewards program</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/services" className="text-foreground opacity-75 hover:text-primary transition">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/rewards" className="text-foreground opacity-75 hover:text-primary transition">
                  Rewards
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-foreground opacity-75 hover:text-primary transition">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-foreground opacity-75 hover:text-primary transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-foreground opacity-75 hover:text-primary transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-foreground opacity-75 hover:text-primary transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-foreground opacity-75 hover:text-primary transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-foreground opacity-75 hover:text-primary transition">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-accent pt-8 text-center text-sm text-foreground opacity-75">
          <p>&copy; 2025 BarberHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
