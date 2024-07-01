// app/(home)/page.tsx

import { WithAuth } from '../../components/withAuth';
import { Hero } from "./hero";

export default function Home() {
  return (
    <WithAuth>
      <div>
        <section className="w-full bg-palette-background">
          <Hero />
        </section>
      </div>
    </WithAuth>
  );
}