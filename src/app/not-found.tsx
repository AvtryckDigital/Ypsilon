import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ButtonLink, Container, Ornament } from "@/components/ui";

export const metadata = { title: "Sidan finns inte" };

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="py-24 text-center sm:py-32">
          <p className="eyebrow">Fel 404</p>
          <h1 className="mt-4 text-5xl text-warm sm:text-6xl">Sidan finns inte</h1>
          <Ornament className="mt-5 justify-center" />
          <p className="mx-auto mt-6 max-w-md text-lg text-warm-muted">
            Sidan kan ha flyttats när hemsidan byggdes om. Prova att börja från startsidan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Till startsidan</ButtonLink>
            <ButtonLink href="/kontakt" variant="outline">Kontakta oss</ButtonLink>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
