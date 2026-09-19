# Kostenplan

## Günstigste sinnvolle Variante

### Einmalig

- Bestehender Gaming-PC und vorhandenes Handy
- Optional ein gutes USB-Mikrofon oder Headset

### Laufend vor der Telefonie

- Lokales Modell über Ollama: keine Tokengebühr
- Lokale Spracherkennung und Sprachausgabe: keine API-Gebühr
- Obsidian-Dateien und SQLite: keine Gebühr
- Privates Gerätenetz: je nach Anbieter und persönlichem Tarif möglicherweise kostenlos
- Strom des PCs: abhängig von Hardware und Nutzungsdauer

### Laufend mit Telefonie

- Telefonnummer: bei Twilio für eine deutsche lokale Nummer laut Preisseite derzeit 1,35 US-Dollar pro Monat
- Mobilfunkanruf aus dem EWR nach Deutschland: laut Preisseite derzeit 0,042 US-Dollar pro Minute; andere Routen können deutlich teurer sein
- Sprach-KI: zusätzlich je nach gewähltem Sprach- und Transkriptionsmodell
- Kleiner öffentlicher Webhook-Dienst: typischerweise wenige Euro pro Monat oder zunächst ein kostenloses Kontingent

Preise ändern sich. Vor der Umsetzung müssen Ziel- und Absenderland auf der Anbieter-Seite geprüft werden.

## Kostenstrategie

1. **Push vor Anruf:** Anruf nur, wenn die dringende Push-Nachricht nicht bestätigt wurde.
2. **Lokal für Routine:** Befehle, Terminlogik und Standarddialoge laufen lokal.
3. **Cloud nur bei Bedarf:** Schwierige Fragen können optional an ein günstiges kleines Modell gehen.
4. **Harte Limits:** Tages- und Monatsbudget für Cloud und Telefonie.
5. **Kurze Anrufe:** Termin nennen, Rückfrage erlauben, danach beenden.

## Drei Betriebsstufen

### Null-Euro-Prototyp

PC-App, lokale KI, lokale Sprache, Obsidian und Kalenderabfrage. Handy zunächst über das Heimnetz oder ein privates Gerätenetz. Keine echte Telefonie.

### Günstiger Alltagsbetrieb

Lokale KI plus kleiner Webhook-Dienst, Push-Nachrichten und seltene Telefonanrufe. Erwartete Fixkosten liegen hauptsächlich beim öffentlichen Dienst und eventuell der Telefonnummer.

### Komfortbetrieb

Natürlichere Cloud-Stimme, leistungsfähiger Cloud-Fallback und dauerhafte Erreichbarkeit. Die Kosten steigen mit Gesprächsdauer und Nutzung.

## Modellkosten richtig vergleichen

Ein kleines Textmodell ist für Werkzeugauswahl oft sehr günstig. Live-Sprache wird zusätzlich nach Audio oder Sitzungsdauer abgerechnet. Die OpenAI-Dokumentation listet zum Beispiel GPT-4o mini mit 0,15 US-Dollar Eingabe und 0,60 US-Dollar Ausgabe je einer Million Text-Token. Für eine fertige Live-Sprachsitzung nennt sie bei GPT-Live 1 derzeit 0,05 US-Dollar pro Minute zuzüglich Backend- und Werkzeugkosten. Das ist eine mögliche Cloud-Option, aber nicht die billigste Grundarchitektur: lokal ausgeführte Sprache verursacht keine API-Rechnung.

