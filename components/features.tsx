export default function Features() {
  const features = [
    {
      icon: "🎯",
      title: "Earn Points",
      description: "Get 1 point for every dollar spent on our premium services",
    },
    {
      icon: "🎁",
      title: "Exclusive Rewards",
      description: "Redeem points for discounts, free services, and special offers",
    },
    {
      icon: "⭐",
      title: "VIP Status",
      description: "Unlock premium benefits and priority booking as you climb tiers",
    },
    {
      icon: "📱",
      title: "Easy Tracking",
      description: "Monitor your points and rewards in real-time through our app",
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-primary mb-16 text-balance">
          Why Choose BarberHub?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg border border-accent hover:border-primary transition shadow-sm hover:shadow-md"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
              <p className="text-foreground opacity-75">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
