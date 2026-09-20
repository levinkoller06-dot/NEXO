# Schritt 022 – Mikrofonzugriff und HUD-Texte bereinigt

Stand: 20.09.2026

Ausgangspunkt: [[021 2026-09-20 HUD vereinfacht und Mikrofon repariert]]

## Auftrag

Die Spracherkennung reagierte weiterhin nicht zuverlässig. Außerdem sollen die alten Status- und Hinweistexte vollständig aus der Oberfläche verschwinden. Die PC-Steuerung muss ohne sichtbaren Freigabe-Schalter dauerhaft aktiv sein.

## Änderungen

- Vor dem Einschalten der Spracherkennung fordert NEXO über `getUserMedia({audio:true})` die Browser-Mikrofonfreigabe an und beendet den kurzen Prüfstream direkt wieder.
- Der Mikrofonbutton schaltet jetzt nur noch zwischen aktiv und stumm; der Start wartet auf die Freigabe und fängt verweigerte oder nicht verfügbare Geräte ab.
- Sichtbare Texte zu Mikrofon, Gespräch, Neural Interface, Build, Mausverfolgung, Bereitschaft und Systemstatus entfernt.
- Verbindungs-/Statuspanel und sichtbarer Gesprächsstatus entfernt; Fehler bleiben nur für Screenreader und Diagnose im DOM.
- PC-Steuerungsbox und der Text „NEXO darf meinen PC bedienen“ sind nicht mehr im HUD vorhanden. Die Serverversion wurde auf 22 erhöht, damit der Starter alte Server ersetzt.
- Regressionstest ergänzt, der das Fehlen der entfernten UI-Elemente prüft.

## Prüfung und Grenzen

- 32 Regressionstests erfolgreich.
- JavaScript-Syntax, HTML-Verweise, Windows-Helper und Starthelfer erfolgreich geprüft.
- Die echte Browser-Mikrofonfreigabe muss einmal beim Neustart bestätigt werden, falls der Browser danach fragt.
- Eine bereits geöffnete alte HUD-Seite zeigt ihren alten DOM weiter; sie muss geschlossen und über `Code/NEXO starten.cmd` neu geöffnet werden.

## Nächster Testauftrag

Alte NEXO-Seite schließen, `Code/NEXO starten.cmd` öffnen, den Mikrofonbutton drücken, die Browserfreigabe zulassen, einen kurzen Satz sprechen, erneut drücken und wieder drücken. Danach einen harmlosen Desktopauftrag ohne Speichern sprechen.
