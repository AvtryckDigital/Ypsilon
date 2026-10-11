-- Startinnehåll migrerat från den gamla WordPress-sajten (ypsa.se), hämtat oktober 2026.
-- Kör en gång efter att databasschemat är skapat:
--   npm run db:seed:local   (lokalt)
--   npm run db:seed:remote  (produktion)
-- Nyhetsinlägg och bildgalleri migreras separat med scripts/migrate-wordpress.mjs.

-- Inställningar -----------------------------------------------------------------

INSERT OR REPLACE INTO settings (key, value) VALUES
  ('tagline', 'Till glädje och prydnad för Norrlands nation sedan 1962'),
  ('short_description', 'Ypsilon är en damförening vid Norrlands nation i Uppsala. Det ursprungliga upptagningsområdet var Medelpad och Ångermanland (Y-län) men idag består föreningen av glada studentskor från hela Sverige.'),
  ('announcement', ''),
  ('address', 'Ypsilon
Norrlands Nation
Västra Ågatan 14
753 09 Uppsala'),
  ('main_email', 'OverYpsa@ypsa.se'),
  ('bankgiro', '5042-8853'),
  ('swish', '123 156 97 06'),
  ('payment_text', 'Vill du betala en sittning eller kanske ge ett litet bidrag till vår Jubileumsfond? Använd Ypsilons bankgiro och glöm inte att skriva in ditt namn. Väljer du Swish tillkommer ett tillägg på 2 kr.'),
  ('facebook', 'https://www.facebook.com/ypsilonuppsala/'),
  ('instagram', 'https://www.instagram.com/ypsilonuppsala/'),
  ('board_heading', 'Ypsilons styrelse höstterminen 2023'),
  ('board_photo', ''),
  ('board_photo_caption', ''),
  ('hero_image', '/media/galleri/wp/alggasquen-2022-del-2-30ab50ca/0043-alggasquen-2022-58.webp'),
  ('hero_caption', 'Ypsor på Älggasquen'),
  ('hero_focus', 'top'),
  ('matrikel_url', 'https://www-static.ypsa.se/wp-content/uploads/2012/05/MatrikelbladYpsilonv%C3%A5ren2012-v2.pdf');

-- Sidor -----------------------------------------------------------------------

INSERT OR REPLACE INTO pages (slug, title, intro, body) VALUES
('hem', 'Välkommen till Ypsilon',
 'Är du tjej och vill lära känna nya, trevliga människor som gör studentlivet i Uppsala ännu roligare? Då ska du definitivt gå med i damföreningen Ypsilon!',
 'Ypsilon grundades 1962 och är Norrlands nations äldsta damförening. Ursprungligen härstammar föreningen från Medelpad och Ångermanland, men idag består Ypsilon av studentskor från hela Sverige. Så oavsett om du kommer från Västernorrland eller inte, om du vill engagera dig mycket eller lite så är du hjärtligt välkommen till vår förening!'),

('om-ypsilon', 'Vad är Ypsilon?',
 'Är du tjej och vill lära känna nya, trevliga människor som gör studentlivet i Uppsala ännu roligare? Då ska du definitivt gå med i damföreningen Ypsilon!',
 'Ypsilon grundades 1962 och är Norrlands nations äldsta damförening. Ursprungligen härstammar föreningen från Medelpad och Ångermanland men idag består Ypsilon av studentskor från hela Sverige. Så oavsett om du kommer från Västernorrland eller inte, om du vill engagera dig mycket eller lite så är du hjärtligt välkommen till vår förening!

Vi har en mängd olika evenemang under året (läs mer om dem i [Kalendariet](/kalendarium)) och tillsammans med oss kan du lära känna massor av trevligt folk utanför din utbildning. Vi ordnar dessutom Norrlands bästa gasque, **Älggasquen**, varje höst! Vi har också turen att ha två underbara brödraföreningar, [Angermannalaget](http://www.angermannalaget.se/) och [Skvadern](http://skvadern.net/), som vi umgås och har mycket roligt tillsammans med.

Låter detta intressant? Hör av dig till vår recceansvarig, Yngling, på [yngling@ypsa.se](mailto:yngling@ypsa.se) så hjälper hon dig med eventuella frågor. Vi ser fram emot att se dig på någon av Ypsilons aktiviteter under året.

*Say Oh-Ah Ypsilon!*'),

('historia', 'Historia',
 'Ypsilon – Sveriges första kvinnliga studentförening',
 'Hembygdsföreningar har funnits på Norrlands nation sedan tidigt 1900-tal, men då endast för herrar. Tisdagen den 20 mars 1962 bestämde sig därför några västernorrländska studenter att ändra på detta och bildade Ypsilon, den första damföreningen vid Norrlands Nation. Herrarna, som hittills ensamma hade skrålat ikapp i nationens lokaler, fnös förstrött bakom Ypsornas ryggar att kvinnor kan minsann inte driva en hembygdsförening. Det kan vi visst det, sa Ypsorna och gick en kurs i föreningsteknik, skrev stadgar och bildade en styrelse för att driva föreningens verksamhet i stort. Då samtliga herrföreningar som fanns på nationen vid den här tiden hade geografisk anknytning, föll det sig ganska naturligt att även Ypsilon följde detta mönster. Genom att ta in medlemmar från både Medelpad och Ångermanland fick man ett större medlemsunderlag och som körsbäret på glassdrinken även två broderföreningar: Skvadern och Angermannalaget. I dag består föreningen av kvinnor från Malmö i söder till Kiruna i norr, men banden till hembygden i Y-län är fortfarande stark.

## Verksamhetens grund

Vår verksamhet grundar sig på Ypsilons fyra F: Förhandling, Förtäring, Föreläsning och Fadderbarn. Förhandlingen, det vill säga våra Yror och förtäringen står fast även i dag medan föreläsningen har förändrats över tid. Under Ypsilons första år var det vanligt att man bjöd in en gäst till Yrorna som föreläste, underhöll eller spexade på något annat sätt. I dag består nog föreläsningarna snarare av gammelYpsor som återvänder till nationens lokaler för att prata om svunna tider för dem som orkar lyssna. Fadderverksamheten infördes ursprungligen för att ta hand om nya recentiorer och ge dem all den information de behöver för att hitta rätt i studentlivet. Under den första delen av 60-talet hade man även fadderbarn utanför nationen, såsom en fadderYpsa i Rom och en i Berlin. På senare tid har även en insamling upprättats under JulYran, där gåvorna sedan skänks till ett välgörande ändamål. Uppsala kvinnojour och Rädda Barnen är några av de organisationer som fått donationer.

## Seder och traditioner

Under 60 år har många traditioner hunnit komma och gå, men mycket lever också kvar. På vår ettårsdag fick vi en stor och redig ordförandeklubba i present av våra brödrar i Angermannalaget. Klubban försvann under våren 1991 och lämnades senare samma år tillbaka av Birkarlarna i något annorlunda form…

Under åren 1969–1973 byggdes nationshusets nya del och all föreningsverksamhet låg nere. I mars 1974 återuppstod Ypsilon, men under lite nya former. Man beslutade bland annat att föreningen skulle vara öppen för alla kvinnliga nationsmedlemmar, inte bara för de med ursprung från Y-län. Trots de nya invalsreglerna kom givetvis föreningen att ha en fortsatt stark anknytning till hemlänet. Vid uppstarten på 70-talet tog man upp några gamla 60-talstraditioner, så som att vår födelsedag heter JoakimYra då det är Joakim som har namnsdag den 20 mars.'),

('gammal-medlem', 'Gammal medlem?',
 'Är du gammal medlem och vill du vara säker på att vi kan nå dig?',
 'Har du kanske bytt namn, kontaktinfo eller aldrig funnits med i vårt medlemsregister? För att vara säker på att bli anmodad till jubileer och liknande, fyll i vårt matrikelblad och skicka in till [OverYpsa@ypsa.se](mailto:OverYpsa@ypsa.se) eller till:

Ypsilon
Norrlands Nation
Västra Ågatan 14
753 09 Uppsala'),

('kontakt', 'Kontakt',
 'Har du frågor om Ypsilon, vill du bli medlem eller har du något annat på hjärtat? Skriv till oss i formuläret eller kontakta rätt person i styrelsen direkt.',
 ''),

('kalendarium', 'Kalendarium',
 'Här hittar du Ypsilons kommande Yror, sittningar och andra evenemang. Fler datum kommer, så håll utkik!',
 ''),

('styrelsen', 'Styrelsen',
 'Det här är Ypsilons styrelse, som tillsammans driver föreningens verksamhet.',
 ''),

('overypsor', 'ÖverYpsor',
 'Ypsilons ordförande kallas ÖverYpsa. Här är alla som har lett föreningen sedan starten 1962.',
 ''),

('hedersypsor', 'HedersYpsor',
 'Ypsilons hedersmedlemmar har gjort särskilda insatser för föreningen.',
 ''),

('nyheter', 'Nyheter',
 'Hälsningar, rapporter och nyheter från Ypsilon.',
 ''),

('sangbok', 'Sångbok',
 'Ypsilons sånger, samlade på ett ställe. Sök på titel, melodi eller en rad ur texten.',
 ''),

('galleri', 'Galleri',
 'Bilder från Yror, sittningar, Älggasquen och resor genom åren.',
 '');

-- Kontakter -------------------------------------------------------------------
-- Obs: på den gamla sajten angavs ÖverYpsa både som OverYpsa@gmail.com och OverYpsa@ypsa.se,
-- och Yrslant som Yrslant@gmail.com. Kontrollera adresserna i admin innan lansering.

INSERT INTO contacts (role, email, description, sort_order) VALUES
('ÖverYpsa', 'OverYpsa@gmail.com', 'Till ÖverYpsan kan du höra av dig om det mesta.', 1),
('Yrslant', 'Yrslant@gmail.com', 'Om du har frågor angående ekonomi så kan du höra av dig till Yrslant, som är ekonomiansvarig i Ypsilon.', 2),
('Yttra', 'Yttra@ypsa.se', 'Yttra är informationsansvarig och skriver vår föreningsspalt i NV, sätter upp teckningslistor inför Yror och mailar om sittningar och Yror. Är du invald Ypsa och saknar mailutskick om våra event? Hör då av dig till Yttra.', 3),
('Yngling', 'Yngling@ypsa.se', 'Yngling är ansvarig för våra Yngel, alltså nya i föreningen som ännu inte är invalda Ypsor. Är du recce och nyfiken på föreningen kan hon svara på dina frågor och lägga till dig i mailutskicken.', 4);

-- Styrelsen (senast publicerad på den gamla sajten: höstterminen 2023) ----------------

INSERT INTO board_members (role, role_description, name, sort_order) VALUES
('ÖverYpsa', 'Ordförande', 'Albertina Wiksten', 1),
('Yrväder', 'Vice ordförande', 'Elin Pålsson', 2),
('Ypsskaft', 'Sekreterare', 'Linnea Nordström', 3),
('Yrslant', 'Kassör', 'Åsa Ekman', 4),
('Yttror', 'Informationsansvariga', 'Johanna Ericson & Tova Söderlund', 5),
('Yngling', 'Recceansvarig', 'Lovisa Blomgren', 6),
('Yrmakare', 'Dryckesansvarig', 'Signe Fjellström', 7),
('Kalaspingla', 'Matansvarig', 'Martina Magnusson', 8),
('Kalaspingla', 'Matansvarig', 'Ellen Örtstam', 9),
('Kalaspingla', 'Matansvarig', 'Mathilda Tönseth', 10),
('Y-front', 'Fotoansvarig', 'Sofia Voss', 11),
('Yla', 'Sånganförare', 'Hanna Richardsson', 12),
('Yoda', 'Rådgivare', 'Hanna Andersson', 13),
('Ypsa Emerita', 'Traditionsbevarare', 'Ellinore Svensson', 14);

-- ÖverYpsor 1962– ----------------------------------------------------------------

INSERT INTO former_chairs (period, name, note, sort_year, sort_order) VALUES
('1962', 'Ingrid Westin', NULL, 1962, 1),
('1963', 'Berit Olofsson', NULL, 1963, 1),
('1964', 'Ebba Wikander', NULL, 1964, 1),
('1965', 'Eva Håkansson', NULL, 1965, 1),
('1966', 'Ulla Elow', NULL, 1966, 1),
('1966', 'Inez Grote-Haara', NULL, 1966, 2),
('1967–1968', 'Ulla Björklund', NULL, 1967, 1),
('1969', 'Onny Broman', NULL, 1969, 1),
('1969–1973', '–', 'Nya delen av nationshuset byggs och Ypsilons verksamhet är pausad', 1969, 2),
('1974 VT', 'Marie Lundin', NULL, 1974, 1),
('1974 HT–1977', 'Kekke Stadin', NULL, 1974, 2),
('1977', 'Kristina Luthman', NULL, 1977, 3),
('1978', 'Lena Wikström', NULL, 1978, 1),
('1979', 'Kerstin Westin', NULL, 1979, 1),
('1980', 'Maria Jakobsson', NULL, 1980, 1),
('1981–1982', 'Anna Christina Lindberg', NULL, 1981, 1),
('1983', 'Charlotte Sundin', NULL, 1983, 1),
('1984–1985', 'Annika Forsberg', NULL, 1984, 1),
('1986–1987', 'Maria Nässeldahl', NULL, 1986, 1),
('1988', 'Kristina Bovin', NULL, 1988, 1),
('1989', 'Cecilia Näsman', NULL, 1989, 1),
('1990 VT', 'Erika Södersten', NULL, 1990, 1),
('1990 HT', 'Susanne Söderström', NULL, 1990, 2),
('1991', 'Marie Nordin', NULL, 1991, 1),
('1992', 'Kristina Svensson', NULL, 1992, 1),
('1993', 'Eva Åslund', NULL, 1993, 1),
('1994', 'Anna Forslund', NULL, 1994, 1),
('1995', 'Kaisa Humlebo', NULL, 1995, 1),
('1996', 'Anna Breitholtz', NULL, 1996, 1),
('1997', 'Ulriqa Söderström', NULL, 1997, 1),
('1998', 'Matilda Eklund', NULL, 1998, 1),
('1999', 'Kristina Sjöström', NULL, 1999, 1),
('2000', 'Kristina Morén', NULL, 2000, 1),
('2001', 'Anna Engström', NULL, 2001, 1),
('2002', 'Elin Sandin', NULL, 2002, 1),
('2003', 'Leila Boukharta', NULL, 2003, 1),
('2004', 'Karin Sjöblom', NULL, 2004, 1),
('2005', 'Susanna Sjödin', NULL, 2005, 1),
('2006', 'Lisa Klasson', NULL, 2006, 1),
('2007', 'Lisa Lundmark', NULL, 2007, 1),
('2008', 'Sandra Andersson', NULL, 2008, 1),
('2009', 'Emelie Söderholtz', NULL, 2009, 1),
('2010', 'Lina Sundström', NULL, 2010, 1),
('2011', 'Linn Forslund', NULL, 2011, 1),
('2012', 'Linnéa Arnevall', NULL, 2012, 1),
('2013', 'Emilia Eriksson', NULL, 2013, 1),
('2014', 'Gina Grahn', NULL, 2014, 1),
('2015', 'Sofia Hörman', NULL, 2015, 1),
('2016', 'Ellinore Svensson', NULL, 2016, 1),
('2017', 'Emelie Gyllecrantz', NULL, 2017, 1),
('2018', 'Helena Westerlund Johansson', NULL, 2018, 1),
('2019', 'Martina Magnusson', NULL, 2019, 1),
('2020', 'Nora Nilsson', NULL, 2020, 1),
('2021', 'Sara Bergdahl', NULL, 2021, 1),
('2022', 'Karolina Hansson', NULL, 2022, 1),
('2023 VT', 'Hanna Andersson', NULL, 2023, 1),
('2023 HT', 'Albertina Wiksten', NULL, 2023, 2),
('2024', 'Elin Pålsson', NULL, 2024, 1);

-- HedersYpsor ------------------------------------------------------------------

INSERT INTO honorary_members (year, name, motivation) VALUES
(1996, 'Ingrid Westin', 'En av Ypsilons tre grundare samt första ÖverYpsa.'),
(1997, 'Kekke Stadin', 'Satt som ÖverYpsa tre år och höll föreningen vid liv under åren 1974–1977.'),
(2012, 'Dagmar Carlbom', 'En av Ypsilons tre grundare samt första sekreterare.'),
(2012, 'Christina Lago-Lenqvist', 'En av Ypsilons tre grundare samt första kassör.'),
(2015, 'Anna Forslund', 'Var med och grundade Älggasquen i den form den är idag. Anna satt även som ÖverYpsa 1994.'),
(2015, 'Kaisa Humlebo', 'Var med och grundade Älggasquen i den form den är idag. Kaisa satt även som ÖverYpsa 1995.');
