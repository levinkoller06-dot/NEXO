# Schritt 027 – Karen-Techniken: UIA-Klicks, Websuche, Barge-in

Stand: 20.09.2026

Ausgangspunkt: [[026 2026-09-20 Denkbudget fuer PC-Steuerung und sicheres launch_app]]

## Auftrag

Der Nutzer hat ein eigenes, separates Projekt "Karen" (`C:\Users\levin\Desktop\RL Projekte\Spider man\karen2.0`), das beim Klicken/App-Öffnen/Suchen schneller und präziser ist und dabei den Mauszeiger nicht bewegt. Ausdrücklicher Auftrag: nicht den Code übernehmen, sondern nur die Technik hinter genau diesen drei Dingen (Klicken/Öffnen, Antwortgeschwindigkeit, Unterbrechen-können während NEXO spricht) verstehen und gezielt in NEXO einbauen. HUD und Stimme bleiben unverändert.

## Untersuchung

Ein Explore-Agent hat `karen2.0` (Python) analysiert:
- **Klicks ohne sichtbaren Mauszeiger**: Karen nutzt `pywinauto`/UI Automation und ruft `IUIAutomationInvokePattern.Invoke()` direkt auf dem gefundenen Element auf – es wird überhaupt kein Mausereignis simuliert, der Cursor bewegt sich nie. Fällt nur zurück auf echten Klick, wenn kein passendes Element existiert.
- **App öffnen/Suchen**: rein deterministisch (feste Alias-Tabelle → `Popen`/`os.startfile`; Google-Suche → fester URL-Template-String), keine KI-Bildanalyse für die Aktion selbst.
- **Antwortgeschwindigkeit**: Karens Kern läuft über die Gemini **Live API** (bidirektionales Audio-Streaming, STT+LLM+TTS in einer Verbindung statt drei Anfragen nacheinander) – eine grundlegend andere Architektur als NEXOs klassisches request/response.
- **Unterbrechen**: Mikrofon läuft bei Karen durchgehend, auch während der Sprachausgabe; die Live-API erkennt selbst, wenn der Nutzer dazwischenredet, und liefert ein `interrupted`-Ereignis.

## Übernommen (als Technik, nicht als Code)

1. **UI Automation als erste Klick-Strategie** (`desktop-native.cs`): `AutomationElement.FromPoint` + `InvokePattern`/`SelectionItemPattern`/`TogglePattern`, nur für Linksklick. Erfolgreich → fertig, kein Mausereignis nötig. Sonst Fallback auf die Fensternachricht-Methode aus Schritt 025, danach `pointer=visible` als letzte Stufe. Setzt `System.Windows.Automation` voraus (`UIAutomationClient`, `UIAutomationTypes`, `WindowsBase` als neue Assembly-Referenzen in `desktop.ps1`).
2. **`search_web`-Werkzeug**: öffnet `https://www.google.com/search?q=<Suchbegriff>` direkt per `Process.Start` im Standardbrowser – keine Bildschirmanalyse, keine Klicks nötig. Bewusst nur eine feste Google-Such-URL, kein beliebiger URL-Opener (Sicherheitsgrund: verhindert, dass ein Modellfehler eine beliebige/gefährliche URL öffnet).
3. **Barge-in** (`conversation.js`): Das Mikrofon war bisher während der GESAMTEN Auftragsdauer stumm geschaltet, inklusive der Sprachausgabe – der Nutzer konnte NEXO nicht unterbrechen. Jetzt bleibt das Mikrofon nur während der reinen Denkphase (Warten auf die Textantwort) stumm; sobald NEXO zu sprechen beginnt, hört es wieder zu. Erkennt es währenddessen einen Satz, wird die laufende Antwort sofort abgebrochen (`cancelSpeech()` + `queue.stop()`) und der neue Satz direkt verarbeitet, statt sich hinten anzustellen. Klick auf den Mikrofonknopf während der Sprachausgabe stoppt jetzt ebenfalls sofort die Ausgabe.

**Nicht übernommen** (bewusst, siehe Auftrag): Karens komplette Gemini-Live-API-Architektur (zu großer Umbau für dieses Mal, siehe "Fehlt/mögliche Zukunft" unten), feste App-Alias-Tabelle (widerspricht der in Schritt 020 bewusst getroffenen Entscheidung gegen feste App-Listen), Karens TTS/Stimme, Karens HUD.

## Prüfung und Grenzen

- 41 Regressionstests erfolgreich (2 neu für `search_web`).
- Nativer Helfer mit `-CheckOnly` kompiliert; `AutomationElement.FromPoint` zusätzlich direkt in PowerShell getestet (Assemblies laden, Aufruf funktioniert).
- Barge-in-Logik live im Browser verifiziert (Mikrofon-Zustandswechsel und Abbruchpfad simuliert, kein echtes Mikrofon nötig/verfügbar in der Testumgebung).
- Kein echter Test von UIA-Klicks oder `search_web` auf echten Programmen (Projektregel).
- Barge-in hat keine eigene Echo-Unterdrückung; ob NEXOs eigene Stimme aus dem Lautsprecher sich selbst triggert, hängt von der im Browser eingebauten Unterdrückung ab und ist auf dem echten PC noch ungetestet.
- Volle Umstellung auf die Gemini-Live-API (Karens eigentlicher Geschwindigkeitsvorteil) wäre ein großer, eigenständiger Umbau (bidirektionales Audio-Streaming statt Text-Chat+separater TTS) und wurde hier nicht angegangen.

## Nächster Testauftrag

NEXO neu starten (Serverversion 29). Prüfen: Klicks bewegen den sichtbaren Mauszeiger jetzt seltener/nie bei normalen Programmen (UI Automation), "such X bei Google" öffnet sofort eine Google-Suche, und man kann NEXO mitten im Sprechen etwas Neues sagen, ohne warten zu müssen.
