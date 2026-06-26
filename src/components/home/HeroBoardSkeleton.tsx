import { Container, Skeleton } from "@/components/ui";

export function HeroBoardSkeleton() {
  return (
    <section className="hero-stage hero-stage--f1 relative min-h-[clamp(28rem,78vh,52rem)] overflow-hidden">
      <div className="hero-stage-beam" aria-hidden="true" />
      <div className="hero-stage-fade" aria-hidden="true" />
      <Container wide className="relative py-16 lg:py-20">
        <Skeleton className="h-4 w-48" />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <Skeleton className="h-16 w-full max-w-md" />
            <Skeleton className="mt-4 h-6 w-40" />
          </div>
          <Skeleton className="mx-auto aspect-square w-full max-w-xs rounded-full" />
        </div>
      </Container>
    </section>
  );
}
