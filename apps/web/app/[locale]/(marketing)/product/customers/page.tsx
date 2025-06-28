import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = constructMetadata({
  title: "Customers",
  description: "See how businesses are succeeding with Cenety",
});

export default async function CustomersPage() {
  const t = await getTranslations("Footer");

  const testimonials = [
    {
      name: "John Doe",
      title: "Full Stack Developer",
      company: "TechStart Inc.",
      quote:
        "The next-saas-stripe-starter repo has truly revolutionized my development workflow. With its comprehensive features and seamless integration with Stripe, I've been able to build and deploy projects faster than ever before.",
      avatar: "/testimonials/john-doe.jpg",
      initials: "JD",
    },
    {
      name: "Alice Smith",
      title: "UI/UX Designer",
      company: "CreativeWorks",
      quote:
        "Thanks to next-saas-stripe-starter, I've been able to create modern and attractive user interfaces in record time. The starter kit provides a solid foundation for building sleek and intuitive designs.",
      avatar: "/testimonials/alice-smith.jpg",
      initials: "AS",
    },
    {
      name: "David Johnson",
      title: "DevOps Engineer",
      company: "CloudSphere",
      quote:
        "Thanks to Cenety, I was able to streamline our entire deployment process and get payments up and running in no time. The documentation is top-notch and the support team is incredibly responsive.",
      avatar: "/testimonials/david-johnson.jpg",
      initials: "DJ",
    },
    {
      name: "Michael Wilson",
      title: "Project Manager",
      company: "AgileTeam",
      quote:
        "I'm impressed by the quality of code and clear documentation of Cenety. It allowed our team to launch our SaaS product 40% faster than estimated. Kudos to the team!",
      avatar: "/testimonials/michael-wilson.jpg",
      initials: "MW",
    },
    {
      name: "Sophia Garcia",
      title: "Data Analyst",
      company: "InsightMetrics",
      quote:
        "Cenety provided me with the tools I needed to efficiently manage user data and integrate analytics. The pre-built components saved us countless hours of development time.",
      avatar: "/testimonials/sophia-garcia.jpg",
      initials: "SG",
    },
    {
      name: "James Taylor",
      title: "CTO",
      company: "InnovateTech",
      quote:
        "After evaluating several SaaS starter kits, we chose Cenety for its modern tech stack, clean architecture, and excellent documentation. It was the right decision - we launched in half the time.",
      avatar: "/testimonials/james-taylor.jpg",
      initials: "JT",
    },
  ];

  const caseStudies = [
    {
      name: "AgileTeam",
      industry: "Project Management",
      challenge: "Needed a scalable SaaS platform with integrated payments",
      solution: "Built custom dashboard using Cenety in just 4 weeks",
      results: "40% faster development, 25% increased customer satisfaction",
    },
    {
      name: "InnovateTech",
      industry: "Enterprise Software",
      challenge: "Complex billing requirements and user authentication",
      solution:
        "Leveraged Cenety's flexible Stripe integration and auth system",
      results: "Reduced development time by 60%, launched ahead of schedule",
    },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Our Customers</h1>
        <p className="text-xl text-muted-foreground">
          See how companies of all sizes are succeeding with Cenety
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Customer Testimonials</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="size-12">
                    <AvatarImage
                      src={testimonial.avatar}
                      alt={testimonial.name}
                    />
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {testimonial.name}
                    </CardTitle>
                    <CardDescription>{testimonial.title}</CardDescription>
                    <CardDescription>{testimonial.company}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grow">
                <p className="text-muted-foreground">
                  &quot;{testimonial.quote}&quot;
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Case Studies</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {caseStudies.map((study, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{study.name}</CardTitle>
                  <Badge variant="outline">{study.industry}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Challenge</h3>
                  <p className="text-muted-foreground">{study.challenge}</p>
                </div>
                <div>
                  <h3 className="font-medium">Solution</h3>
                  <p className="text-muted-foreground">{study.solution}</p>
                </div>
                <div>
                  <h3 className="font-medium">Results</h3>
                  <p className="text-muted-foreground">{study.results}</p>
                </div>
              </CardContent>
              <CardFooter>
                <a
                  href="#"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Read full case study →
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-muted p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">
          Ready to join our customer success stories?
        </h2>
        <p className="mb-6">
          Start building your next project with Cenety today and experience the
          difference.
        </p>
        <a
          href="#"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
