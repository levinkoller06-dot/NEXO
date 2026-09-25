# Schritt 035 – Jev-Integration über OpenRouter für click_by_name

Stand: 25.09.2026

Ausgangspunkt: [[034 2026-09-25 Jev-Key eingerichtet, Probe-Skript, Vercel-Zahlungsmethode fehlt noch]]

## Auftrag

Nutzer lieferte einen zweiten Key (`sk-or-v1-...`) mit der Anweisung, den vorigen Vercel-Key zu ersetzen und `typesafe/jev-1.13` zu nutzen. Auftrag: Key einbauen und die in Schritt 031 geplante Architektur jetzt tatsächlich umsetzen.

## Der Key ist ein OpenRouter-Key – und funktioniert direkt

Anders als der Vercel-Key aus Schritt 034 ist dieser echt nutzbar: OpenRouter listet Jev als `typesafe/jev-1.13` über eine **eigene "Decisions API"** (`POST https://openrouter.ai/api/alpha/decisions`, `Authorization: Bearer $OPENROUTER_API_KEY`), NICHT über die normale OpenAI-kompatible Chat-Completions-Schnittstelle. Diese Decisions API reicht das echte TypeSafe-Format (`state` + `questions` mit `noul`/`choice`/`score`) unverändert durch – genau das Format aus der ursprünglichen TypeSafe-Doku (Schritt 031). `Server/jev-probe.js` wurde entsprechend umgeschrieben und **live gegen die echte API getestet**: HTTP 200, korrekte Choice-Antwort mit Wahrscheinlichkeiten und Konfidenz für ein Beispiel aus dem NEXO-Kontext.

## Änderungen

- **`Server/.env`** (nicht committet): `AI_GATEWAY_API_KEY` durch `OPENROUTER_API_KEY` ersetzt, `JEV_MODEL=typesafe/jev-1.13`.
- **`Server/.env.example`**: entsprechend aktualisiert.
- **`Server/jev-probe.js`**: auf die Decisions API umgestellt, Beispiel mit echtem NEXO-Bezug (Intent-Klassifizierung + Sensitiv-Erkennung eines Sprachauftrags). Erfolgreich live getestet.
- **`Server/jev.js`** (neu): `chooseCandidate()` – schickt eine Choice-Frage mit geschlossener Kandidatenliste an Jev, liefert `{choice, confidence}`. Eigenständiges Modul, kein Einfluss auf den Rest des Systems, wenn nicht aufgerufen.
- **`Server/desktop-native.cs`**: `ClickByName` liefert jetzt `string[]` statt `void` und bekommt einen dritten Parameter `exact`. Erster Aufruf (Substring-Suche) sammelt ALLE Treffer statt beim ersten abzubrechen (das war die bisherige, unbemerkte Fehlerquelle: NEXO klickte bei mehreren gleich benannten Elementen einfach das im UI-Baum zufällig zuerst gefundene); bei genau einem Treffer wird direkt geklickt wie bisher; bei mehreren wird NICHTS geklickt, sondern die Namen zurückgegeben. Ein zweiter Aufruf mit `exact=true` matcht exakt und klickt garantiert das gewählte Element.
- **`Server/desktop.ps1`**: gibt bei mehreren Treffern `{ok:true, ambiguous:true, candidates:[...]}` zurück statt nur `{ok:true}`.
- **`Server/desktop.js`**: `DesktopController.clickByName` ruft bei `ambiguous:true` `jev.chooseCandidate()` mit dem Fenstertitel, dem gesuchten Namen und dem Auftragsgrund als `state` auf; die Kandidatennamen sind die `criteria`. Bei Erfolg wird mit der exakten Jev-Wahl erneut geklickt (`exact=true`). Schlägt Jev fehl (kein Key, Netzwerkfehler, ungültige Antwort) oder ist kein Key hinterlegt, fällt der Code auf den ersten Kandidaten zurück – identisch zum bisherigen (fehleranfälligen) Verhalten, aber nie schlimmer. `DesktopController` nimmt jetzt optional `jevOptions` (env/fetchImpl) für Tests entgegen.
- **`Server/agent.js`**: Beschreibung von `click_by_name` ergänzt (Jev übernimmt die Auswahl bei mehreren Treffern).

## Ehrliche Einordnung

- Das betrifft ausschließlich `click_by_name` (benannte Bedienelemente in nativen Windows-/UIA-Fenstern). Browser-DOM-Klicks (YouTube, generische Webseiten) sind NICHT Teil dieses Schritts – das bräuchte einen eigenen Kandidaten-Sammler für den Browser-Accessibility-Baum, wie in Schritt 031 skizziert. Das war mit dem heutigen Umfang nicht mehr sinnvoll zu schaffen.
- Kein echter Test mit einem tatsächlich mehrdeutigen Klick auf einem echten Fenster (Projektregel: keine beiläufigen echten Desktop-Aktionen als Test). Die Logik ist mit Fake-Bridges getestet, nicht am echten UI-Automation-Baum.
- Jev fügt bei Mehrdeutigkeit eine zusätzliche Netzwerk-Anfrage (Timeout 10s) in den Klick-Ablauf ein. Bei nur einem Treffer (der Normalfall) ändert sich nichts – kein zusätzlicher Aufruf, keine zusätzliche Latenz.

## Prüfung

- `node --test Code/Tests/*.test.js`: 63 Tests erfolgreich (2 neu: Jev wählt bei mehreren Treffern korrekt aus; Fallback auf ersten Kandidaten ohne Jev-Zugang funktioniert).
- `desktop.ps1 -CheckOnly`: kompiliert nach der `ClickByName`-Änderung erfolgreich.
- `node Server/jev-probe.js`: live gegen die echte OpenRouter-Decisions-API erfolgreich (HTTP 200, plausible Choice-Antwort mit Konfidenz).

## Betroffene Dateien

`Code/Server/.env` (lokal), `Code/Server/.env.example`, `Code/Server/jev-probe.js`, `Code/Server/jev.js` (neu), `Code/Server/desktop-native.cs`, `Code/Server/desktop.ps1`, `Code/Server/desktop.js`, `Code/Server/agent.js`, `Code/Tests/regression.test.js`, `Code/STATUS.md`, `Code/AGENTS.md`.

## Nächster Schritt

Im echten Gebrauch ein Fenster mit mehreren gleich benannten Elementen anklicken lassen (z.B. eine Liste mit mehreren "Play"-Knöpfen) und beobachten, ob NEXO das richtige trifft. Danach ggf. den Browser-Accessibility-Baum für Web-Klicks (YouTube etc.) als eigenen, größeren nächsten Schritt angehen.
