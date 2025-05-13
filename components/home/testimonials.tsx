import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Parent",
    content:
      "The quality of Fortela's uniforms is exceptional. My kids' uniforms have lasted the entire school year and still look great.",
    rating: 5,
    avatar: "/placeholder.svg",
  },
  {
    id: 2,
    name: "Michael Thompson",
    role: "School Administrator",
    content:
      "We've been partnering with Fortela for our school uniforms for 3 years now. Their service and product quality are consistently excellent.",
    rating: 5,
    avatar: "/placeholder.svg",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Parent",
    content:
      "The online ordering process was simple and the uniforms arrived quickly. The sizing guide was very helpful in getting the right fit for my children.",
    rating: 4,
    avatar: "/placeholder.svg",
  },
]

export default function Testimonials() {
  return (
    <section className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Don't just take our word for it - hear from our satisfied customers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex mb-3">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < testimonial.rating ? "fill-primary text-primary" : "text-muted"}`}
                    />
                  ))}
              </div>

              <p className="text-muted-foreground">{testimonial.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
