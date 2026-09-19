# Schritt 013 – Cloud-Core und erstes Sprachgespräch

Datum: 20.09.2026 · Art: Umsetzung

## Auftrag
Nutzer wollte nach Abschluss der Kopfform-Arbeit den nächsten sinnvollen Schritt angehen: den Cloud-KI-Kern. In der Planung festgelegt: lokaler Hintergrund-Prozess hält den API-Key (nicht der Browser direkt), erste Fähigkeit ist ein echtes Sprachgespräch per Mikrofon und Tonausgabe mit live mitgeschriebenem Verlauf im HUD, mit Gesprächsgedächtnis innerhalb der Sitzung.

Ursprünglich war Claude (Anthropic) als erster Anbieter vorgesehen. Der Nutzer hatte aber bereits einen OpenAI-Key zur Hand und wollte damit starten.

## Sicherheitsvorfall während der Planung
Der Nutzer hat einen echten OpenAI-API-Key im Klartext in den Chat eingefügt. Das wurde ihm sofort gemeldet mit der Empfehlung, den Key bei platform.openai.com zu widerrufen und einen neuen zu erstellen, da ein im Chat eingefügter Key als kompromittiert gelten sollte. Der Nutzer hat sich bewusst entschieden, den bestehenden Key trotzdem zu verwenden ("nein baue den ein"). Der Key wurde ausschließlich in die lokale, nicht committete `Server/.env` geschrieben, nie in eine Datei, die ins Repository gelangt.

## Änderungen
- **Neu `Code/Server/server.js`**: kleiner Node-HTTP-Server ohne externe Abhängigkeiten.
  - Liest `OPENAI_API_KEY`, `OPENAI_MODEL` (Standard `gpt-4o-mini`) und `PORT` (Standard 4790) aus `Server/.env` (eigener, minimaler `.env`-Parser, keine npm-Abhängigkeit).
  - Liefert die statischen Dateien aus `Code/App` aus (die Oberfläche läuft jetzt same-origin über den Server statt über `file://`).
  - `POST /api/chat`: nimmt den bisherigen Nachrichtenverlauf entgegen, ergänzt einen NEXO-Systemprompt, ruft die OpenAI Chat-Completions-API auf, gibt die Antwort oder eine verständliche Fehlermeldung zurück.
  - `GET /api/health`: einfacher Status-Check (ob ein Key gefunden wurde, welches Modell konfiguriert ist).
  - Bindet ausdrücklich nur an `127.0.0.1` (nicht an alle Netzwerkschnittstellen), damit der Prozess mit dem bezahlten API-Key nicht aus dem lokalen Netzwerk erreichbar ist.
- **Neu `Code/Server/.env.example`**: Vorlage zum Kopieren nach `.env`.
- **`Code/NEXO starten.cmd`**: startet jetzt zuerst den Server (minimiertes Fenster), wartet kurz, öffnet dann Edge auf `http://localhost:4790/` statt auf die lokale Datei.
- **Neu `Code/App/conversation.js`**: 
  - Nutzt die Web-Speech-API des Browsers für Spracherkennung (kontinuierlich, mit Zwischenergebnissen) und Sprachausgabe.
  - Schickt den erkannten Text an `/api/chat`, hängt Frage und Antwort an einen sitzungsinternen Gesprächsverlauf an (kein Speichern über Neustart hinaus).
  - Pausiert die Spracherkennung während NEXO spricht (verhindert, dass sich NEXO selbst zuhört) und setzt sie danach fort, falls das Gespräch noch aktiv ist.
  - Steuert die vorhandene `speaking`-Variable aus `app.js` an, damit die Mund-Animation synchron zur echten Sprachausgabe läuft.
  - Bei fehlender Browser-Unterstützung wird der Mikrofon-Knopf deaktiviert und ein Hinweis angezeigt, statt stillschweigend nichts zu tun.
- **`Code/App/index.html`**: neuer Mikrofon-Knopf, neues "GESPRÄCH"-Panel mit live mitgeschriebenem Verlauf, Status-Anzeigen für Mikrofon und KI-Modell-Verbindung, aktualisierter Datenschutz-Hinweistext (vorher "keine Cloud-Verbindung", stimmt jetzt nicht mehr).
- **`Code/App/style.css`**: Styling für das neue Gesprächs-Panel (scrollbarer Verlauf, unterschiedliche Randfarbe für Nutzer- und NEXO-Beiträge).
- Doku aktualisiert: `Code/README.md`, `Code/App/README.md` (Einrichtungsanleitung für den API-Key), `Code/AGENTS.md` (neuer Server-Baustein), `Code/STATUS.md`.

## Was NEXO jetzt kann
Mit hinterlegtem, gültigem OpenAI-Key: Mikrofon-Knopf drücken, sprechen, NEXO antwortet per Sprachausgabe mit synchroner Mund-Animation, der Verlauf erscheint live im HUD. Ohne gültiges Guthaben (aktueller Zustand) läuft alles andere normal, das Gespräch selbst schlägt mit einer sichtbaren Fehlermeldung fehl statt stillschweigend nichts zu tun.

## Was noch fehlt
- Kein Wechsel zwischen KI-Anbietern (nur OpenAI fest verdrahtet).
- Kein Gedächtnis über die laufende Sitzung hinaus, keine Anbindung an Obsidian/Kalender.
- Aktuell hat das verwendete OpenAI-Konto kein Guthaben (siehe Prüfung) – das eigentliche Gespräch ist damit noch nicht Ende-zu-Ende nutzbar, bis der Nutzer das behebt.
- Kein Test mit echtem Mikrofon/Browser-Berechtigung in dieser Sitzung.

## Prüfung
- `node --check Code/Server/server.js`, `Code/App/conversation.js`, `Code/App/app.js`, `Code/App/head.js` erfolgreich.
- `git check-ignore Code/Server/.env` bestätigt: die Datei mit dem echten Key wird von Git ignoriert; `git add Code/Server` (Trockenlauf) hätte nur `server.js` und `.env.example` hinzugefügt.
- Server lokal gestartet und per `curl` geprüft (kein Browser nötig, keine Zusatzkosten): `/api/health` liefert `{"ok":true,"hasKey":true,"model":"gpt-4o-mini"}`, `GET /` liefert die Oberfläche mit Status 200, `POST /api/chat` erreicht OpenAI erfolgreich und gibt dessen Fehlermeldung ("no credits remaining") korrekt weiter statt selbst zu einem unklaren Fehler zu führen. Server danach wieder beendet.
- Kein Test der echten Sprach-Ein-/Ausgabe im Browser (Mikrofon-Hardware, Browser-Berechtigungsdialog, tatsächliche Web-Speech-API) – das kann nur der Nutzer selbst durchführen.

## Betroffene Dateien
- `Code/Server/server.js` (neu)
- `Code/Server/.env.example` (neu)
- `Code/Server/.env` (neu, lokal, nicht committet)
- `Code/NEXO starten.cmd`
- `Code/App/conversation.js` (neu)
- `Code/App/index.html`
- `Code/App/style.css`
- `Code/README.md`, `Code/App/README.md`, `Code/AGENTS.md`, `Code/STATUS.md`

## Nächster möglicher Schritt
Nutzer hinterlegt Guthaben/Zahlungsmethode bei platform.openai.com, testet dann das echte Gespräch im Browser (Mikrofon-Berechtigung, Spracherkennung, Sprachausgabe, Mund-Synchronität, Mitschrift). Rückmeldung dazu abwarten, bevor weitere Cloud-Core-Funktionen (Anbieterwechsel, dauerhaftes Gedächtnis) geplant werden.
