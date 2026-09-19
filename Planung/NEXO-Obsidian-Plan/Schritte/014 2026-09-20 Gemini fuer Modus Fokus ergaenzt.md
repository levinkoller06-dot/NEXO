# Schritt 014 – Gemini für den Modus Fokus ergänzt

Datum: 20.09.2026 · Art: Umsetzung

## Auftrag
Nutzer wollte zusätzlich zu OpenAI auch Google Gemini anbinden, und zwar so, dass Gemini antwortet, wenn der Betriebsmodus **Fokus** aktiv ist. Der zuerst genannte Schlüssel ("AQ.Ab8RN6JM...") sah nicht wie ein gültiger Gemini-API-Key aus (echte Keys beginnen mit `AIzaSy...`); der Nutzer hat danach den korrekten Key nachgereicht.

## Sicherheitshinweis
Auch dieser Key wurde im Klartext in den Chat eingefügt statt direkt in eine lokale Datei. Wie beim OpenAI-Key in Schritt 013 gilt er damit als potenziell offengelegt. Er wurde ausschließlich in die lokale, nicht committete `Server/.env` eingetragen.

## Änderungen
- `Code/Server/server.js`:
  - Neue Konstante `MODE_PROVIDER` ordnet jedem Betriebsmodus einen Anbieter zu: `standby: 'openai'`, `focus: 'gemini'`, `energy: 'openai'`.
  - Neue Funktion `callGemini()`: ruft die Google Generative Language API auf (`generativelanguage.googleapis.com`), bildet den bisherigen Nachrichtenverlauf auf das Gemini-Format ab (`assistant` → `model`-Rolle), nutzt denselben NEXO-Systemprompt wie OpenAI.
  - `handleChat()` liest jetzt zusätzlich ein `mode`-Feld aus der Anfrage und wählt darüber den Anbieter; unbekannte/fehlende Modi fallen auf `standby` zurück.
  - `/api/health` zeigt jetzt Status und Modell beider Anbieter sowie die Modus-Zuordnung.
  - Ursprünglich `gemini-2.0-flash` als Standardmodell gewählt; die echte API meldete beim Testen, dass dieses Modell nicht mehr verfügbar ist, und empfahl `gemini-3.6-flash` – das wird jetzt als Standard verwendet.
- `Code/Server/.env.example` und `Server/.env`: `GEMINI_API_KEY` und `GEMINI_MODEL` ergänzt.
- `Code/App/conversation.js`: schickt jetzt den aktuellen Betriebsmodus (`mode`, geteilte Variable aus `app.js`) bei jeder Anfrage mit; zeigt nach einer Antwort an, welcher Anbieter tatsächlich geantwortet hat (`OpenAI verbunden` / `Gemini verbunden`).
- Doku aktualisiert: `Code/App/README.md`, `Code/STATUS.md`.

## Was NEXO jetzt kann
Im Modus Fokus beantwortet Gemini das Gespräch, in Bereit und Energie weiterhin OpenAI. Welcher Anbieter geantwortet hat, wird im HUD sichtbar.

## Was noch fehlt
- Kein echter Sprachbefehl-Wechsel zwischen Anbietern, nur die feste Kopplung an den Betriebsmodus.
- OpenAI-Konto hat weiterhin kein Guthaben (siehe Schritt 013); im Modus Fokus ist das Gespräch dank Gemini davon unabhängig nutzbar, in Bereit/Energie weiterhin nicht.
- Kein Test der echten Sprach-Ein-/Ausgabe im Browser.

## Prüfung
- `node --check Code/Server/server.js` und `Code/App/conversation.js` erfolgreich.
- Per `curl` geprüft (kein Browser nötig):
  - `/api/health` zeigt beide Anbieter korrekt (`hasKey: true` für beide) und die richtige Modus-Zuordnung.
  - `mode:"focus"` beantwortet eine echte Testfrage erfolgreich über Gemini.
  - Mehrfach-Dialog-Test über drei Nachrichten (Nutzer nennt eine Zahl, Assistent bestätigt, Nutzer fragt danach) bestätigt: Gemini erinnert sich korrekt an den Kontext innerhalb der Anfrage.
  - `mode:"standby"` versucht weiterhin OpenAI und bekommt dort weiterhin den erwarteten "kein Guthaben"-Fehler (bestätigt, dass die Modus-Weiche funktioniert, nicht dass OpenAI selbst nutzbar ist).
- Kein Test der Sprach-Ein-/Ausgabe im echten Browser.

## Betroffene Dateien
- `Code/Server/server.js`
- `Code/Server/.env.example`
- `Code/Server/.env` (lokal, nicht committet)
- `Code/App/conversation.js`
- `Code/App/README.md`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Nutzer testet das Gespräch im Modus Fokus im echten Browser mit echtem Mikrofon (sollte jetzt auch ohne OpenAI-Guthaben funktionieren, da Gemini antwortet).
