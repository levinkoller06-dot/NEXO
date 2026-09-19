# Schritt 017 – Erste, eng begrenzte PC-Steuerung durch die KI

Datum: 20.09.2026 · Art: Umsetzung

## Auftrag
Nutzer wollte, dass NEXO Aktionen auf dem Computer ausführen kann, z. B. Apps öffnen oder im Browser suchen. Da dies laut den Projekt-Leitprinzipien ("klar begrenzte Werkzeuge statt uneingeschränktem PC-Zugriff", "sichtbare Bestätigungen für kritische Aktionen") sicherheitsrelevant ist, wurden vor der Umsetzung Rückfragen gestellt statt sofort loszubauen. Ergebnis der Rückfragen:
- Umfang: sowohl Programme öffnen als auch Browser-Suche/Website öffnen.
- Bestätigung: keine – diese beiden Aktionen gelten als reversibel und risikoarm genug, um direkt ausgeführt zu werden; sie erscheinen im Aktivitätslog.

## Änderungen
- `Code/Server/server.js`:
  - Neue feste Zuordnung `ALLOWED_APPS` (kurzer Name → tatsächliche .exe): `editor`→notepad.exe, `rechner`→calc.exe, `explorer`→explorer.exe, `taskmanager`→taskmgr.exe, `paint`→mspaint.exe. Es gibt keinen Weg, ein Programm außerhalb dieser Liste zu starten.
  - Neue Funktion `executeTool(name, args)`: führt `open_app` (nur aus der festen Liste, per `child_process.spawn`, kein Shell-String) oder `web_search` (öffnet eine Google-Suche über `explorer.exe <url>`, ebenfalls ohne Shell-Interpretation, um Befehls-Injection über die Sucheingabe auszuschließen) aus.
  - `callOpenAI()` und `callGemini()` bekommen jetzt echtes Function-/Tool-Calling: Werkzeuge werden in der Anfrage mitgeschickt; ruft das Modell ein Werkzeug auf, wird es lokal ausgeführt und das Ergebnis in einer zweiten Anfrage an dasselbe Modell zurückgegeben, damit die KI eine passende Sprachantwort formulieren kann ("Ich habe den Taschenrechner geöffnet.").
  - `/api/chat`-Antwort enthält jetzt zusätzlich `toolLog` (welche Werkzeuge mit welchem Ergebnis ausgeführt wurden), `/api/health` listet die erlaubten Programme.
- `Code/App/conversation.js`: schreibt jede ausgeführte (oder fehlgeschlagene) Aktion aus `toolLog` ins Aktivitätslog des HUD.
- Doku aktualisiert: `Code/README.md`, `Code/STATUS.md`.

## Beim echten Testen gefundene und behobene Probleme
Reine Code-Prüfung hätte diese nicht gefunden, da es sich um tatsächliches Verhalten der Gemini-API handelt, nicht um Programmierfehler im eigentlichen Sinn:
1. Die Rolle für eine Werkzeug-Antwort in der Konversation heißt bei der aktuellen Gemini-API `"user"`, nicht das in älterer Dokumentation genannte `"function"` – die API lehnte die Anfrage sonst mit einer klaren Fehlermeldung ab, die die gültigen Rollen auflistete.
2. Das Modell (`gemini-3.6-flash`, ein "Thinking"-Modell) hängt seinem Funktionsaufruf ein `thoughtSignature`-Feld an. Beim Zurücksenden des Funktionsaufrufs an die API muss dieses Feld unverändert erhalten bleiben, sonst lehnt die API die Folgeanfrage ab. Der Code gab vorher nur `{functionCall: ...}` zurück und verlor damit dieses Feld; jetzt wird das komplette Original-Objekt zurückgeschickt.

## Was NEXO jetzt kann
Auf Zuruf (z. B. "Öffne den Taschenrechner" oder "Suche im Internet nach ...") öffnet NEXO tatsächlich das entsprechende Programm oder eine Websuche und bestätigt das per Sprachausgabe. Funktioniert aktuell zuverlässig über Gemini (Modus Fokus); der Code-Pfad für OpenAI ist identisch aufgebaut, aber mangels Guthaben auf dem verwendeten Konto nicht Ende-zu-Ende mit einem echten Werkzeugaufruf getestet.

## Was noch fehlt
- Keine Bestätigungsschritte für diese Aktionen (bewusst so von Nutzer entschieden für diesen kleinen, risikoarmen Umfang).
- Keine weiteren Aktionstypen (Dateien, Systemeinstellungen, beliebige Befehle) – bewusst nicht umgesetzt.
- OpenAI-Tool-Calling-Pfad nur teilweise getestet (Konto ohne Guthaben).

## Prüfung
- `node --check Code/Server/server.js` und `Code/App/conversation.js` erfolgreich.
- Echte End-zu-Ende-Tests gegen die echten APIs (nicht nur Syntax), mit Wissen und Zustimmung des Nutzers, da dabei tatsächlich Programme auf seinem Computer geöffnet wurden:
  - "Öffne bitte den Taschenrechner" (Modus Fokus/Gemini) → Taschenrechner öffnete sich tatsächlich, per `Get-Process CalculatorApp` bestätigt, danach wieder geschlossen.
  - "Suche im Internet nach dem Wetter in Zürich" (Modus Fokus/Gemini) → Websuche öffnete sich im Standardbrowser.
  - Eine normale Frage ohne Werkzeug-Bedarf beantwortete das Modell weiterhin direkt, ohne unnötigen Werkzeugaufruf.
  - `mode:"standby"` (OpenAI) mit einer werkzeug-auslösenden Anfrage wurde nicht bis zum Ende getestet, da das OpenAI-Konto weiterhin kein Guthaben hat (siehe Schritt 013).

## Betroffene Dateien
- `Code/Server/server.js`
- `Code/App/conversation.js`
- `Code/README.md`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Nutzer testet die PC-Steuerung selbst per Sprachbefehl im echten Browser. Bei Bedarf weitere Programme zur erlaubten Liste hinzufügen, oder OpenAI-Guthaben hinterlegen, um den zweiten Anbieter für Werkzeuge ebenfalls zu bestätigen.
