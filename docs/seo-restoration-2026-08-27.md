# Vitalora SEO-restauratie — 27 augustus 2026

## Doel

De bestaande SEO-waarde behouden, oude gezondheidscontent inhoudelijk opnieuw opbouwen en technische signalen weer betrouwbaar maken. Historische zoekvolumes helpen bij prioritering; actuele Search Console-prestaties, backlinks en zoekintentie bepalen uiteindelijk of een URL blijft, wordt samengevoegd of verdwijnt.

## Vastgestelde technische problemen

- Iedere onbekende route viel terug op `post.html` en gaf daardoor een zachte 404 met HTTP 200.
- `/sitemap.xml` en `/robots.txt` kwamen eveneens in die blogopvangroute terecht en waren geen geldige crawlbestanden.
- `/api/blog-feed` gaf bij een ontbrekende of niet-bereikbare database HTTP 500.
- De blogindex bevatte geen serverleesbare artikelkaarten en gebruikte een externe stockfoto-fallback.
- Oude artikelen bevatten onbewezen gezondheidsclaims en een niet-verifieerbare auteurskwalificatie.
- Meerdere korte alias-URL’s concurreerden met de historische canonical uit de spreadsheet.

## Hersteld in fase 1

- De algemene blogcatch-all is verwijderd; onbekende URL’s krijgen een echte 404-pagina met `noindex`.
- `robots.txt` en `sitemap.xml` zijn statische, geldige bestanden.
- Dertien artikelen staan serverleesbaar op de blogindex en hebben elk een expliciete route.
- Canonicals, meta descriptions, Open Graph, grote afbeeldingspreview en `BlogPosting`-structured data zijn toegevoegd.
- De API gebruikt de statische feed als veilige fallback en zet vernieuwde artikelen boven eventuele verouderde databaserijen.
- Vier alias-URL’s sturen permanent door naar de historische canonical.
- Tien prioriteitsartikelen zijn volledig herschreven en hebben ieder een uniek, warm, onderwerp-specifiek Image 2-beeld.
- De auteur is voortaan eerlijk `Vitalora Redactie`; medische en voedingsclaims krijgen bron, grens en praktisch handelingsperspectief.

## Vernieuwde prioriteits-URL’s

1. `/vlierbessensap-gezond`
2. `/is-zuiveringszout-hetzelfde-als-baking-soda`
3. `/kruisbloemige-groenten`
4. `/broccolikiemen`
5. `/is-waterkers-gezond`
6. `/afvallen-met-eiwitpoeder`
7. `/is-oligofructose-slecht`
8. `/chlorella-en-spirulina`
9. `/lichaam-ontzuren-onzin`
10. `/olijven-met-knoflook`

## Historische zoekwoordbron

De spreadsheet `Blogonderwerpen`, tab `2025`, bereik `K1:O1000` bevat 58 Vitalora-regels. Tien zijn vernieuwd, 46 blijven bewust behouden tot de GSC-audit en twee hebben een foutieve historische koppeling:

- `Waar is gember goed voor?` wijst naar `/waar-zit-glyfosaat-in/`.
- `Ghee gezond` wijst naar `/histamine-betekenis/`.

De volledige herleidbare inventaris staat in `data/seo/historical-keywords.json`. De volumes zijn circa twee jaar oud en mogen niet als actuele vraag worden gepresenteerd.

## Beslisregel voor de resterende URL’s

- **Behouden en herschrijven:** relevante impressies/klikken, backlinks of een duidelijke unieke zoekintentie.
- **Samenvoegen en 301:** overlap met een sterker artikel, mits onderwerp en intentie werkelijk overeenkomen.
- **410 of 404:** geen waarde, geen backlinks, geen zinvolle intentie en geen passend alternatief.
- **Nooit blind redirecten naar de homepage:** dat maskeert verwijderde inhoud en helpt de gebruiker niet.
- **Medische YMYL-onderwerpen:** alleen publiceren na zwaardere broncontrole, duidelijke grenzen en zo nodig inhoudelijke review door een gekwalificeerde professional.

## Volgende batches na Search Console

1. Hoge historische vraag met brede voedingsintentie: gember, insuline en afvallen, zilverkaars, tuinkers en bottenbouillon.
2. Darm- en voedselintenties: nachtschade, edelgistvlokken, gluten, borrelende darmen en kokos/yoghurt.
3. Medisch gevoelige onderwerpen: diabetes, Wegener, endometriose, lage bloeddruk, pregnenolon en medicatie-gerelateerde pagina’s.
4. Lage-waarde of fout gekoppelde pagina’s: samenvoegen, corrigeren of gecontroleerd verwijderen op basis van actuele data.

## Publicatiepoort

Een batch gaat pas live wanneer tests groen zijn, de blogindex en minimaal één artikel op desktop en mobiel visueel kloppen, redirects en 404-status zijn gecontroleerd en productie dezelfde commit draait als `origin/main`.
