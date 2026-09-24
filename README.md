# Webseite der Freiwilligen Feuerwehr Leopoldsdorf

Öffentliche Webseite mit Einsatzberichten, Terminen, Mannschaft und Fuhrpark – und ein interner Bereich, in dem bis zu einer Handvoll Redakteurinnen und Redakteure alles selbst pflegen. Eine einzige App, ein Docker-Container, eine SQLite-Datei.

## Was die Seite kann

**Öffentlich**

- Startseite mit Leitspruch, letztem Einsatz, angehefteten Hinweisen, aktuellen Beiträgen, Einsatzstatistik und den nächsten Terminen
- Tätigkeiten: Einsätze, Übungen, Jugend, Allgemeines und Archiv, filterbar nach Jahr
- Einsatzberichte mit Einsatzdaten (Nummer, Alarmzeit, Ort, Einsatzart B/T/S, eingesetzte Fahrzeuge)
- Einsatzstatistik pro Jahr, berechnet aus den veröffentlichten Berichten (Brandsicherheitswachen zählen nicht)
- Termine mit Kalender-Abo (`/termine.ics`) und Einzeltermin zum Speichern im Handy
- Kommando, Mannschaft (mit Dienstgrad-Abzeichen) und Fuhrpark mit Fahrzeugseiten
- Bürgerservice-Seiten, Über uns, Impressum, Datenschutz – alles im Admin bearbeitbar
- Bildergalerie mit Vollbild, Teilen per WhatsApp, Facebook, E-Mail oder Link
- Handytauglich, Notruf 122 immer im Kopf der Seite, keine Cookies, keine Fremddienste

**Intern (`/admin`)**

- Anmeldung mit Passwort **und** Code aus einer Authenticator-App (Pflicht für alle)
- Sperre nach mehreren Fehlversuchen
- Rollen: **Admin** (alles) und **Redakteur** (Inhalte, keine Benutzer/Einstellungen)
- Beiträge mit Texteditor, Titelbild und Galerie; Entwürfe mit Vorschau
- Termine, Mitglieder (mit Datenschutz-Schaltern), Fahrzeuge, Textseiten, Einsatzarten
- Mediathek: Handyfotos werden verkleinert, als WebP gespeichert, Standortdaten entfernt; PDF-Dokumente lassen sich hochladen und im Text verlinken
- Dashboard mit Seitenaufrufen (ohne Cookies und ohne IP), Entwürfen, letzten Änderungen
- Tägliche Sicherung, Download als Archiv
- Hell/Dunkel, auf dem Handy wie eine App auf den Startbildschirm legbar

## Technik

| Teil | Wahl |
|---|---|
| App | SvelteKit 2 / Svelte 5, TypeScript, Node 24 |
| Datenbank | SQLite (libsql) mit Drizzle ORM, Migrationen in `drizzle/` |
| Bilder | sharp → WebP in 400/800/1600/2400 px |
| Editor | Tiptap |
| Oberfläche | Tailwind 4 + eigene Styles, Schrift Archivo (lokal eingebunden) |
| Betrieb | Docker + Caddy (automatisches HTTPS), GitHub Actions |

## Lokal entwickeln

```bash
npm install
npm run dev
```

Die Seite läuft dann unter <http://localhost:5180>, der Admin unter <http://localhost:5180/admin>.
Beim ersten Start wird ein Admin angelegt: Benutzer `admin`, Passwort `feuerwehr-admin` (nur in der Entwicklung).
Die Authenticator-App wird auch lokal eingerichtet – einfach den QR-Code mit dem Handy scannen.

Daten liegen in `data/` (Datenbank, `uploads/`, `backups/`) und sind nicht im Git.

| Befehl | Zweck |
|---|---|
| `npm run check` | Typprüfung |
| `npm test` | Tests |
| `npm run build` | Produktions-Build nach `build/` |
| `npm run db:generate` | nach Änderungen an `src/lib/server/db/schema.ts` eine Migration erzeugen |
| `npm run zugang -- liste` | Notfall-Zugang, siehe unten |

**Datenbank ändern:** `schema.ts` anpassen → `npm run db:generate -- --name kurze-beschreibung` → die neue Datei in `drizzle/` mit einchecken. Migrationen laufen beim Start automatisch.

## Auf den Server bringen

### 1. Server

Ein kleiner vServer reicht (z. B. Hetzner CX22 oder netcup, 2 vCPU / 4 GB RAM, um 5 € im Monat), Serverstandort in der EU, Ubuntu 24.04.

```bash
# als root auf dem neuen Server
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

Beim Hoster einen **Auftragsverarbeitungsvertrag** (AVV) abschließen – bei Hetzner und netcup ist das ein Klick in der Kundenoberfläche. Die Datenschutzerklärung verweist darauf.

### 2. Domain

Beim Domain-Anbieter einen **A-Eintrag** (und bei IPv6 einen AAAA-Eintrag) auf die IP des Servers setzen.
Solange es noch keine Domain gibt, funktioniert zum Testen `<IP mit Bindestrichen>.sslip.io`, z. B. `203-0-113-10.sslip.io`.

### 3. Dateien auf den Server

```bash
# als deploy
sudo mkdir -p /opt/ff-leopoldsdorf && sudo chown deploy /opt/ff-leopoldsdorf
cd /opt/ff-leopoldsdorf
# docker-compose.yml, Caddyfile und .env.example aus dem Repository hierher kopieren
cp .env.example .env
nano .env   # DOMAIN und APP_IMAGE eintragen
docker compose pull && docker compose up -d
docker compose logs app   # hier steht das Passwort des ersten Admins
```

Danach `https://<domain>/admin` öffnen, mit `admin` und dem Passwort aus dem Log anmelden, eigenes Passwort festlegen und die Authenticator-App koppeln.

### 4. Automatisch ausrollen mit GitHub

1. Der Code liegt unter <https://github.com/mstreicher98/FF-Leopoldsdorf-Webseite>.
2. Bei jedem Push auf `main` prüft GitHub Actions den Code, baut das Image und legt es unter `ghcr.io/mstreicher98/ff-leopoldsdorf-webseite` ab.
3. **Image abrufbar machen:** Entweder das Paket unter GitHub → Packages → ff-leopoldsdorf-webseite → Package settings auf *Public* stellen (es enthält keine Geheimnisse) oder am Server einmal `docker login ghcr.io` mit einem Personal Access Token (Recht `read:packages`) ausführen.
4. **Automatisches Aktualisieren:** Am eigenen Rechner einen eigenen Schlüssel erzeugen (`ssh-keygen -t ed25519 -f deploy_key`), den öffentlichen Teil am Server in `/home/deploy/.ssh/authorized_keys` eintragen und im Repository unter *Settings → Secrets and variables → Actions* anlegen:
   - `DEPLOY_HOST` – IP oder Domain des Servers
   - `DEPLOY_USER` – `deploy`
   - `DEPLOY_SSH_KEY` – Inhalt der Datei `deploy_key` (privater Teil)
   - `DEPLOY_PATH` – nur nötig, wenn nicht `/opt/ff-leopoldsdorf`

Ohne diese Secrets wird nur das Image gebaut; aktualisiert wird dann am Server mit `docker compose pull && docker compose up -d`.

## Inhalte der bisherigen WordPress-Seite übernehmen

`scripts/import-wordpress.mjs` holt über die öffentliche WordPress-Schnittstelle von ff-leopoldsdorf.net:

- **Beiträge** (Einsätze, Übungen, Jugend, Allgemeines) mit Titelbild, Bildergalerie und verlinkten PDFs. Bei Einsätzen werden Nummer, Einsatzart, Alarmzeit und Einsatzort aus Titel und erster Zeile gelesen („95/26 – T1 Bergung-PKW“, „🕰️: 19.09.2026, 22:02 Uhr 📍: …“).
- **Kommando und Mannschaft** mit Fotos, Dienstgraden und Funktionen
- **Fuhrpark** inklusive Datenblättern und historischer Fahrzeuge
- **Termine** von der Seite „Veranstaltungen“
- **Seiten:** Über uns (aus „unser Auftrag“), Sicherheitszentrum, Sachgebiete, Feuerwehrjugend, Bürgerservice
- **Weiterleitungen** von allen alten Adressen (z. B. `/2026/09/20/95-26-t1-bergung-pkw/`) auf die neuen – wichtig, falls die Domain ff-leopoldsdorf.net später auf die neue Seite zeigt

Nicht übernommen werden Beiträge der Kategorie „Intern“, Testbeiträge und das WordPress-Impressum (die neue Seite hat ein eigenes). Eingebettete Videos werden zu Links, weil die Seite keine Fremddienste einbettet.

```bash
node scripts/import-wordpress.mjs --probe   # nur prüfen, was übernommen würde
node scripts/import-wordpress.mjs           # übernehmen (dauert wegen der Bilder eine Weile)
```

Am Server: `docker compose exec app node scripts/import-wordpress.mjs`. Das Skript merkt sich, was schon übernommen wurde – nach einem Abbruch einfach neu starten. Heruntergeladene Originale liegen danach in `import-cache/` im Daten-Volume und können gelöscht werden.

## Sicherungen

- Jede Nacht ab 2 Uhr: `backups/<Zeitstempel>/` im Daten-Volume mit `feuerwehr.db` und allen Bildern (als harte Links – unveränderte Bilder belegen keinen zusätzlichen Platz). Die letzten 14 bleiben.
- Im Admin unter *Einstellungen*: „Jetzt sichern“ und Download als `.tar`.
- **Die Sicherungen liegen am selben Server.** Fällt der Server aus, sind sie mit weg. Deshalb ab und zu (z. B. einmal im Monat) eine Sicherung herunterladen und an einem anderen Ort aufbewahren.

**Wiederherstellen:**

```bash
cd /opt/ff-leopoldsdorf
docker compose stop app
# Archiv entpacken, dann Datenbank und Bilder ins Volume kopieren:
tar -xf ff-leopoldsdorf-sicherung-<stand>.tar
docker run --rm -v ff-leopoldsdorf_ff-data:/data -v "$PWD/<stand>":/backup alpine \
  sh -c "rm -f /data/feuerwehr.db-wal /data/feuerwehr.db-shm && cp /backup/feuerwehr.db /data/ && cp -a /backup/uploads/. /data/uploads/ && chown -R 1000:1000 /data"
docker compose start app
```

(Der Volume-Name beginnt mit dem Ordnernamen – `docker volume ls` zeigt ihn.)

## Notfall: niemand kommt mehr hinein

Handy mit der Authenticator-App weg und kein zweiter Admin da? Am Server:

```bash
cd /opt/ff-leopoldsdorf
docker compose exec app node scripts/zugang.mjs liste
docker compose exec app node scripts/zugang.mjs zuruecksetzen admin
```

Das erzeugt ein neues vorläufiges Passwort, setzt die Zwei-Faktor-Anmeldung zurück und meldet alle Geräte ab. Beim nächsten Login wird beides neu eingerichtet.

**Tipp:** Mindestens zwei Personen sollten Admin sein.

## Datenschutz und Recht

- **Impressum und Datenschutzerklärung** sind als Vorlage nach österreichischem Recht angelegt (Offenlegung nach § 25 MedienG, DSGVO, DSG, TKG 2021). Bitte vor dem Start prüfen lassen, z. B. über den NÖ Landesfeuerwehrverband, und bei Bedarf einen Datenschutzbeauftragten ergänzen.
- **Mitglieder:** Namen und Fotos nur mit Einwilligung veröffentlichen, bei Jugendlichen mit Einwilligung der Eltern. Bei neuen Jugendmitgliedern sind „Auf der Webseite zeigen“ und „Foto freigegeben“ standardmäßig aus.
- **Einsatzberichte:** keine Namen von Betroffenen, keine erkennbaren Gesichter von Verletzten, keine lesbaren Kennzeichen.
- **Keine Cookies** im öffentlichen Teil, keine eingebetteten Fremddienste, Schrift lokal. Der Aufrufzähler speichert nur „Seite + Tag + Anzahl“. Darum braucht die Seite kein Cookie-Banner.
- Die Grafiken auf „Rettungsgasse“ (ASFINAG) und „Richtig löschen“ (Bundesministerium für Inneres) stammen aus dem Prototyp – vor dem Start klären, ob die Nutzung erlaubt ist, oder durch eigene Bilder ersetzen.

## Projektaufbau

```
src/
  routes/
    (site)/              öffentliche Seiten
    admin/(auth)/        Anmeldung, Code-Eingabe, Ersteinrichtung
    admin/(panel)/       interner Bereich
    admin/api/medien/    Bild-Upload und Mediathek
    medien/[file]        ausgelieferte Bilder
    termine.ics          Kalender-Abo
  lib/
    server/              Datenbank, Anmeldung, 2FA, Bilder, Sicherung, Statistik
    components/site/     Bausteine der Webseite
    components/admin/    Bausteine des internen Bereichs
    dienstgrade.ts       NÖ-Dienstgrade (Abzeichen in static/dienstgrade)
    einsatz.ts           Einsatzarten-Gruppen und Vorbelegung
drizzle/                 Datenbank-Migrationen
scripts/zugang.mjs       Notfall-Zugang
static/                  Banner, Wappen, Abzeichen, Icons
```
