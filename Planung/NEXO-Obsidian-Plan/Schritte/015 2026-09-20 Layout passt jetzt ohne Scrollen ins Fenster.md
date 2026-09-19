# Schritt 015 – Layout passt jetzt ohne Scrollen ins Fenster

Datum: 20.09.2026 · Art: Umsetzung (Fehlerkorrektur)

## Auftrag
Nutzer hat das Sprachgespräch getestet (Mikrofon-Eingabe hat funktioniert, siehe Screenshot) und dabei bemerkt, dass die Seite immer gescrollt werden muss – der Header war im Screenshot bereits aus dem sichtbaren Bereich gescrollt. Auftrag: das HUD so anpassen, dass alles auf ein Fenster passt, auch wenn das Fenster verkleinert oder in den Vollbildmodus gebracht wird.

## Ursache
`main` hatte nur eine Mindesthöhe (`min-height:calc(100vh - 123px)`) statt einer festen Höhe. Sobald der Inhalt einer Spalte (z. B. das Aktivitätslog mit mehreren langen, unverkürzten API-Fehlermeldungen samt URL) mehr Platz brauchte, wuchs die ganze Seite über die Fensterhöhe hinaus und musste gescrollt werden. Zusätzlich hatte die Bühne (`.stage`) eine feste Mindesthöhe von 730px, unabhängig von der tatsächlich verfügbaren Höhe.

## Änderungen
- `Code/App/style.css`:
  - `body` ist jetzt eine Flexbox-Spalte mit `height:100vh`/`100dvh` und `overflow:hidden`; Header und Footer behalten ihre natürliche Höhe, `main` bekommt über `flex:1` genau den verbleibenden Platz.
  - `main` nutzt `grid-auto-rows:1fr`, damit die Spalten (links, Bühne, rechts) die volle verfügbare Höhe ausfüllen, plus `min-height:0;overflow:hidden`, damit `main` selbst nie über die Fensterhöhe hinauswächst.
  - `aside` (linke und rechte Spalte) scrollt jetzt intern (`overflow-y:auto`), falls die enthaltenen Panels zusammen mehr Platz brauchen als verfügbar ist – statt die ganze Seite zu strecken.
  - `.stage` füllt jetzt `height:100%` ihrer Spalte statt einer festen Mindesthöhe von 730px (mit einer kleinen Sicherheitsuntergrenze von 320px für sehr kleine Fenster).
  - Das Aktivitäts-Panel (`.activity ol`) scrollt jetzt ebenfalls intern statt unbegrenzt zu wachsen.
  - Der 1100px-Breakpoint (schmalere Fenster, rechte Spalte rutscht unter die linke) wurde angepasst, damit die neue `1fr`-Zeilenhöhe dort nicht die Bühne zusammenstaucht; stattdessen scrollt `main` in diesem schmalen Layout bei Bedarf als Ganzes.
  - Der Smartphone-Breakpoint (≤680px) bekommt wieder normales Seiten-Scrollen, weil auf einem Handy-Bildschirm ohnehin alles untereinander steht und ein erzwungenes Ein-Bildschirm-Layout dort nicht sinnvoll ist.
- `Code/App/conversation.js`: Fehlermeldungen im Zustand-Text und im Aktivitätslog werden jetzt auf den ersten Satz gekürzt (max. 70 Zeichen) statt der vollen, oft sehr langen API-Fehlermeldung samt URL – das war der konkrete Auslöser für den übervollen Log in diesem Fall.

## Was NEXO jetzt kann
Die Seite selbst scrollt nicht mehr, unabhängig von der Fenstergröße. Spalten mit viel Inhalt (z. B. viele Log-Einträge) scrollen bei Bedarf nur innerhalb ihrer eigenen Spalte.

## Prüfung
- `node --check Code/App/conversation.js` erfolgreich; CSS auf ausgeglichene Klammern geprüft (107 öffnende, 107 schließende).
- Per kurzem, gezieltem Browser-Test geprüft (Server gestartet, per `curl` erreichbar gemacht, dann im Browser): bei Fenstergrößen 1920×1080 (Standard), 1100×650 (Umbruch-Breakpoint) und 1000×500 (sehr klein) ist `document.documentElement.scrollHeight` in allen drei Fällen exakt gleich `clientHeight` – die Seite selbst überläuft nicht. Einzelne Spalten (links/rechts) überlaufen bei viel Inhalt weiterhin, scrollen dann aber nur intern, was dem Auftrag entspricht.
- Kein Test des Smartphone-Layouts unter 680px in dieser Sitzung (dort bewusst weiterhin normales Seiten-Scrollen).

## Betroffene Dateien
- `Code/App/style.css`
- `Code/App/conversation.js`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Nutzer prüft das neue Layout im echten Fenster/Vollbild sowie das Sprachgespräch im Modus Fokus (sollte jetzt auch ohne OpenAI-Guthaben funktionieren).
