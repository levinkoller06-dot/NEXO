# NEXO – aktueller Projektstand

Stand: 20.09.2026 · Schritt 023

## Aktueller Auftrag und Ergebnis
Die sieben Befunde aus Schritt 019 wurden bearbeitet. Die bisherige App-Liste wurde durch allgemeine, von der KI ausgewählte Bildschirm-, Maus- und Tastaturaktionen ersetzt. Der Nutzer hat diese Erweiterung ausdrücklich beauftragt. Historische Aussagen aus Schritt 018 zur fehlenden Maussteuerung beschreiben nicht mehr den aktuellen Stand.

## Implementiert
- Startbares Windows-HUD mit dem bestehenden Kopf aus 99.220 3D-Modell-Partikeln, Farbwechsel, Großansicht, Timer und Browsernotizen.
- Cloud-Modelle mit lokaler Oberfläche und lokalem Node-Server: Fokus → Gemini; Bereit/Energie → OpenAI. Modelle/Keys stehen in Server/.env. Kein in der Cloud gehosteter NEXO-Core.
- Sprachaufträge, begrenzter Gesprächsverlauf im Kern, Browser-TTS und Mundanimation beim Sprechen.
- Das sichtbare Gesprächsfenster und das Texteingabefeld sind entfernt; der Auftrag läuft über das Mikrofon.
- Separate Zustände für Gesprächswunsch, tatsächliches Mikrofon, laufenden Auftrag und Wiedergabe. Das Mikrofon pausiert vor der Netzwerkanfrage. Client-Warteschlange und serverweite Auftragssperre verhindern parallele PC-Aktionen.
- KI-Werkzeugschleife für beide Anbieter mit mehreren Runden und vollständigen Werkzeugergebnissen. Gemini-Signaturen und IDs bleiben erhalten.
- Desktop-Agent: Bildschirm ansehen, Maus bewegen/klicken/doppelklicken/ziehen/scrollen, einzeiligen Text tippen, Tastenkombinationen und Warten. Jeder Schritt wird vom Modell gewählt; danach erhält es ein neues Bildschirmbild.
- Keine festen App-Startmakros, keine Programmliste und kein taskkill-Werkzeug mehr. Programme werden über ihre sichtbare Oberfläche bedient.
- Windows-Helfer über feste lokale PowerShell/C#-Dateien, JSON über stdin statt Shell-Interpolation. Startfehler, Zeitlimits und Abbruch werden behandelt.
- Geschützte lokale API mit Host-/Origin-/Inhaltstypprüfung, Sitzungscookie, Sitzungstoken, Nachrichten-/Body-Limits und Pfadbegrenzung. Fehlerhafte URL-Codierung liefert 400.
- PC-Steuerung wird bei jeder neuen Sitzung automatisch aktiviert. Globale Stopp-Taste Strg+Alt+F12 und Verbindungsüberwachung bleiben als unsichtbare Notabschaltung erhalten.
- Konkrete Bestätigungsanfragen für als sensitive eingestufte Aktionen; Delete und Alt+F4 erzwingen die Freigabe zusätzlich im Code. Nach Freigabe ist eine neue Beobachtung erforderlich.
- Native Eingaben auf NEXOs eigenen Fenstern werden blockiert. Windows-Rechte/UAC werden nicht umgangen.
- Starter wartet auf den Server, berücksichtigt PORT und zeigt Fehler an. Ältere Server werden nur bei eindeutig zum Projekt gehörendem Prozesspfad ersetzt.

## Grenzen
- Ein erster Desktop-Agent, keine Garantie, dass jede beliebige Oberfläche korrekt erkannt/bedient wird.
- Die Risikoeinstufung beliebiger visueller Aktionen hängt vom Modell ab. Die Bestätigungslogik ist keine vollständige Sandbox.
- Kein echter Desktop-/Mikrofon-/Hotkey-End-to-End-Test in Schritt 021; native Kompilierung, Logik und API-Protokoll wurden geprüft.
- OpenAI meldet aktuell fehlendes API-Guthaben. Dies kann nicht durch eine Codeänderung behoben werden. Fokus/Gemini hat im echten Schnittstellentest funktioniert.
- Screenshots können alle sichtbaren Monitorinhalte enthalten. Sie bleiben bei NEXO im Arbeitsspeicher, maximal zwei im laufenden Modellkontext, und werden an den aktiven Cloud-Anbieter übertragen. Keine lokale Bildarchivierung.
- Pro Auftrag: maximal 24 Modellrunden, 40 Werkzeugaufrufe, vier Minuten. API-Aufrufzeitlimit 45 Sekunden; Freigaben verfallen nach 90 Sekunden. Ein verlorenes HUD entzieht nach spätestens 15 Sekunden ohne Statuskontakt die PC-Freigabe.
- Keine Kamera-Verfolgung, lautgenaue Lippensynchronisation, dauerhafte Erinnerung, Anmeldung über Geräte, Kalenderanbindung, Handy-App, Push oder Telefonie.
- Notizen bleiben browserlokal; kein Schreiben nach Obsidian aus der App.

## Nachweise aus Schritt 021
- 33 Regressionstests erfolgreich: automatische Sitzungsfreigabe, Entfernen des Gesprächsfensters und alter Status-Texte, Ent-/Stummschaltung einschließlich `aborted`-Recovery, Gemini-Audio-Fallback sowie die bisherigen R1–R7-Fälle.
- Windows-Helfer mit -CheckOnly kompiliert, native INPUT-Struktur auf diesem Windows-System 40 Byte.
- Starthelfer mit -CheckOnly geprüft: Node vorhanden, Port 4790.
- Echter Gemini-Aufruf mit künstlichem Testbild: computer_observe → set_mode → Antwort OK erfolgreich. Keine echten Desktop-Bilder übertragen oder PC-Aktionen dabei ausgeführt.
- Echter OpenAI-Aufruf: Anbieter antwortet 429, Guthaben fehlt. OpenAI-Werkzeug-/Bildablauf mit simulierten Antworten getestet.
- JavaScript-Syntax, HTML-Verweise und Git-Diff geprüft.

## Orientierung
Pfade ab Repository-Stamm:
- Code/App/: HUD, api.js, conversation-state.js, conversation.js.
- Code/Server/server.js: HTTP/Sitzungen, Stopp und Aufträge.
- Code/Server/agent.js: Anbieter und Werkzeugschleife.
- Code/Server/desktop.js, desktop.ps1, desktop-native.cs: Windows-Steuerung.
- Code/Server/launch.ps1: Start und Versionsprüfung.
- Code/Tests/regression.test.js: Tests ohne echte Desktop-Aktionen.
- Planung/NEXO-Obsidian-Plan/Schritte/023 2026-09-20 Audio-Fallback für Edge-App ergänzt.md: vollständige Übergabe.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md: langfristiges Ziel.

## Als Nächstes
NEXO starten.cmd öffnen, Fokus wählen, Mikrofon einschalten und einen einfachen Auftrag testen. Danach tatsächliche Klickgenauigkeit, Mikrofon, globalen Stopp und Darstellung prüfen. Weitere Umsetzung erfolgt nur nach Auftrag.
