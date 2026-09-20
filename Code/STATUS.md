# NEXO – aktueller Projektstand

Stand: 20.09.2026 · Schritt 024

## Aktueller Auftrag und Ergebnis
Der Sprachknopf war durch einen `Illegal invocation`-Fehler in `MicController` (entkoppelte `setTimeout`/`clearTimeout`) komplett tot; behoben. Sprachausgabe läuft jetzt über Gemini-TTS (männliche Stimme "Charon") statt ElevenLabs, das am Free-Tier-Library-Voice-Limit scheiterte. Gemini-"Thinking" ist für Chat deaktiviert, Sprachausgabe wird satzweise gestreamt – beides senkt die Antwortzeit spürbar. `standby` nutzt jetzt Gemini, `energy` bleibt OpenAI. UI: Statuszeile ist jetzt sichtbar, Mikrofon startet automatisch, drei nicht mehr benötigte Knöpfe entfernt.

## Implementiert
- Startbares Windows-HUD mit dem bestehenden Kopf aus 99.220 3D-Modell-Partikeln, Farbwechsel, Großansicht, Timer und Browsernotizen.
- Cloud-Modelle mit lokaler Oberfläche und lokalem Node-Server: Fokus/Bereit → Gemini; Energie → OpenAI. Modelle/Keys stehen in Server/.env. Kein in der Cloud gehosteter NEXO-Core.
- Sprachaufträge, begrenzter Gesprächsverlauf im Kern, Sprachausgabe über Gemini-TTS (`/api/speech`, Stimme konfigurierbar über `GEMINI_TTS_VOICE`) mit Browser-TTS als Fallback, satzweises Streaming für schnelleren Sprechbeginn, und Mundanimation beim Sprechen.
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

## Nachweise aus Schritt 024
- 35 Regressionstests erfolgreich (2 neu für `/api/speech`, 2 angepasst wegen Standby→Gemini).
- Mikrofon-Bug live im Browser reproduziert und nach dem Fix verifiziert (kein `Illegal invocation` mehr, Berechtigungsanfrage wird erreicht).
- `/api/speech` live gegen echte Gemini-API getestet: gültige WAV-Datei erhalten und angehört.
- `/api/chat` in Standby live gegen echte Gemini-API getestet; Latenz mit/ohne `thinkingConfig.thinkingBudget:0` verglichen (2,4s → 1,3s bei trivialer Anfrage).
- Echter OpenAI-Aufruf erneut geprüft: weiterhin 429 `insufficient_quota`, Guthaben fehlt weiterhin.

## Orientierung
Pfade ab Repository-Stamm:
- Code/App/: HUD, api.js, conversation-state.js, conversation.js.
- Code/Server/server.js: HTTP/Sitzungen, Stopp und Aufträge.
- Code/Server/agent.js: Anbieter und Werkzeugschleife.
- Code/Server/desktop.js, desktop.ps1, desktop-native.cs: Windows-Steuerung.
- Code/Server/launch.ps1: Start und Versionsprüfung.
- Code/Tests/regression.test.js: Tests ohne echte Desktop-Aktionen.
- Planung/NEXO-Obsidian-Plan/Schritte/024 2026-09-20 Mikrofon-Fix, Gemini-Stimme und Tempo.md: vollständige Übergabe.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md: langfristiges Ziel.

## Als Nächstes
NEXO starten.cmd neu starten (Serverversion 26), Mikrofon sollte automatisch aktiv sein, Statuszeile über dem Kopf beobachten, kurze und offene Fragen testen, neue Stimme und Antwortzeit beurteilen. "Energie" schlägt ohne neues OpenAI-Guthaben fehl. Weitere Umsetzung erfolgt nur nach Auftrag.
