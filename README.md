# Ypsilon – hemsida och admin

Ny hemsida för damföreningen Ypsilon vid Norrlands nation, med eget admin där styrelsen
ändrar allt innehåll. Ersätter den gamla WordPress-sajten på ypsa.se.

Allt körs på Cloudflare, precis som Skvadern:

| Del | Tjänst |
| --- | --- |
| Sajten (Next.js 16 via OpenNext) | Cloudflare Workers |
| Databas (innehåll och admin-konton) | Cloudflare D1 |
| Bilder och filer | Cloudflare R2 |
| Kontaktformuläret | Web3Forms (skickar mejl) |
| Publicering | GitHub Actions vid push till `master` |

Allt ryms i Cloudflares gratisnivå: 10 GB i R2, 5 GB i D1 och 100 000 anrop per dag.

## Innehåll

**Publika sidor:** startsida, Vad är Ypsilon?, Historia, Kalendarium (med kalenderprenumeration),
Nyheter, Sångbok med sökning, Galleri med bildvisare, Styrelsen, ÖverYpsor, HedersYpsor,
Kontakt med formulär och Gammal medlem?.

**Admin (`/admin`):** nyheter, kalendarium, sångbok, galleri med uppladdning av många bilder samtidigt,
styrelsen, ÖverYpsor, HedersYpsor, kontakter, alla sidtexter, inställningar (sidfot, Swish,
bankgiro, sociala medier) och administratörskonton. Bilder förminskas i webbläsaren innan de laddas upp.

Gamla WordPress-adresser, till exempel `/about` och `/2023/10/inlaggets-namn`, skickas vidare till
motsvarande nya sida.

## Kom igång lokalt

Kräver Node 24.

```bash
npm install
npm run db:migrate:local          # skapar tabellerna i en lokal databas
npm run db:seed:local             # texter, styrelse, ÖverYpsor m.m. från gamla sajten
npm run admin:create -- din@epost.se   # skapar ett admin-konto och skriver ut lösenordet
npm run dev                       # http://localhost:3000
```

Den lokala databasen och bildlagringen ligger i `.wrangler/state/` och skapas automatiskt.

För att testa kontaktformuläret lokalt, skapa filen `.env.local` med innehållet i `.env.example`.

### Förhandsgranska som Cloudflare Worker

```bash
npm run preview
```

Bygger sajten exakt som i produktion och kör den i Cloudflares lokala miljö.

## Sätta upp Cloudflare (en gång)

1. **Logga in:** `npx wrangler login`
2. **Skapa databasen:** `npx wrangler d1 create ypsilon-db`. Klistra in `database_id` som skrivs ut i `wrangler.jsonc`.
3. **Skapa bildlagringen:** `npx wrangler r2 bucket create ypsilon-media`
4. **Skapa tabellerna och startinnehållet:**
   ```bash
   npm run db:migrate:remote
   npm run db:seed:remote
   npm run admin:create -- namn@exempel.se --remote
   ```
5. **Web3Forms:** skapa en nyckel på [web3forms.com](https://web3forms.com) med den adress formuläret ska skickas till.
6. **GitHub:** lägg in följande under *Settings → Secrets and variables → Actions*:

   | Namn | Typ | Värde |
   | --- | --- | --- |
   | `CLOUDFLARE_API_TOKEN` | Secret | API-token med behörigheten *Edit Cloudflare Workers* samt D1 och R2 |
   | `CLOUDFLARE_ACCOUNT_ID` | Secret | Kontots id från Cloudflares översikt |
   | `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` | Secret | Nyckeln från Web3Forms |
   | `NEXT_PUBLIC_SITE_URL` | Variable | `https://www.ypsa.se` |

7. **Publicera:** pusha till `master`. GitHub Actions kontrollerar koden, uppdaterar databasen,
   bygger och publicerar.
8. **Domän:** koppla `ypsa.se` och `www.ypsa.se` till workern under *Workers → ypsilon-web → Settings → Domains*,
   först när migreringen nedan är klar.

## Flytta innehåll från WordPress

Nyheter och bildgalleri hämtas från den gamla sajten med ett skript. Kör det innan domänen flyttas,
eftersom skriptet läser från ypsa.se.

```bash
npm run migrate -- --dry-run                 # förhandsgranska nyheterna, inget sparas
npm run migrate -- --remote --only=posts     # alla 96 nyheter
npm run migrate -- --remote --only=extras    # matrikelblad och styrelsebild
npm run migrate -- --remote --only=gallery   # alla 227 album, cirka 9 400 bilder
```

- Galleriet tar flera timmar. Varje bild sparas som original i full upplösning plus tre visningsversioner i WebP
  (640, 1 400 och 2 800 px breda). Webbläsaren väljer rätt storlek, och originalet kan laddas ner från bildvisaren.
  Ett test med 469 bilder tog 1,2 MB per bild, så hela galleriet blir uppskattningsvis 10–15 GB.
  Det som överstiger R2:s 10 GB gratis kostar omkring 0,015 dollar per GB och månad.
- När migreringen är klar finns allt i R2 och D1. Inget på den nya sajten pekar mot WordPress, så den gamla sajten
  och dess webbhotell kan sägas upp. Gamla adresser som `/about` och `/2023/10/inlagg` skickas vidare av den nya sajten.
- Skriptet kan avbrytas med Ctrl+C och köras igen. Klara bilder och album hoppas över.
- Använd `--limit=3` för att bara ta de tre senaste albumen och `--force` för att göra om album.
- De flesta bilder i de gamla nyhetsinläggen finns inte längre på den gamla servern. De visas inte heller
  på den gamla sajten i dag och tas bort ur inläggen.

## Skötsel

- **Bilder på sajten:** startsidans stora bild och bilden vid "Om oss" väljs under *Inställningar → Startsidans bilder*.
  Om inget är valt används automatiskt bilder från de senaste albumen, så sajten uppdateras av sig själv när nya album läggs upp.
  Varje sida kan också få en egen bild i sidhuvudet under *Sidor och texter*.

- **Ny styrelse:** lägg till de nya som administratörer under *Administratörer*, uppdatera *Styrelsen*,
  rubriken under *Inställningar* och lägg till den nya ÖverYpsan under *ÖverYpsor*.
- **Bilder:** alla uppladdade bilder utom galleriets sparas under *Bilder* i admin och kan väljas i alla bildfält,
  tillsammans med albumbilderna. En bild raderas bara när någon raderar den där, och bara om den inte används.
  Efter första publiceringen med biblioteket: klicka på *Hämta äldre bilder* så kommer tidigare uppladdningar med.
- **Glömt lösenord:** en annan administratör kan sätta ett nytt under *Administratörer*. Om ingen kan logga in:
  `npm run admin:create -- namn@exempel.se --remote` byter lösenordet på ett befintligt konto.
- **Ändra databasen:** lägg en ny fil i `migrations/`, till exempel `0003_ny_kolumn.sql`. Den körs
  automatiskt vid nästa publicering.
- **Säkerhetskopia:** `npx wrangler d1 export ypsilon-db --remote --output=backup.sql`

## Struktur

```
migrations/            Databasschemat (D1)
seed/innehall.sql      Startinnehåll från gamla sajten
scripts/               Skapa admin-konto, migrera från WordPress
src/app/(site)/        Publika sidor
src/app/admin/         Admin
src/lib/admin/         Konfiguration av innehållstyperna i admin (fält, listor, kontroller)
src/lib/               Databas, inloggning, datumhantering
public/brand/          Vapnet och bandet från den grafiska profilen
```

En ny innehållstyp i admin läggs till i `src/lib/admin/entities.ts`. Lista, formulär, sparning och
borttagning byggs automatiskt utifrån fältbeskrivningen.

> Next.js är låst till 16.3.x. Version 16.4 skapar en fil som OpenNext för Cloudflare ännu inte stöder.
> Uppgradera Next.js först när `@opennextjs/cloudflare` har stöd för det.
