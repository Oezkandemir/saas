import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Pages",
  description: "Browse all available pages",
});

export default async function PagesPage() {
  return (
    <div className="w-full py-6 lg:py-12">
      <div className="space-y-4 mb-8">
        <h1 className="inline-block font-heading text-4xl lg:text-5xl">
          Pages
        </h1>
        <p className="text-xl text-muted-foreground">
          Browse all available pages
        </p>
      </div>
      <hr className="my-4" />
      <div className="text-center py-12">
        <p className="text-muted-foreground">No pages available.</p>
      </div>
    </div>
  );
}
