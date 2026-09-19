---
projekt: NEXO
typ: Systemübersicht
status: Planung
---

 NEXO – große Systemübersicht

> [!tip] Ansicht
> Öffne die **Leseansicht**. Die Grafik verwendet absichtlich große Schrift und darf breiter als das Notizfenster sein. Falls nötig, kannst du horizontal scrollen oder mit `Strg` + `+` die gesamte Obsidian-Ansicht vergrößern.

```mermaid
%%{init: {"flowchart": {"useMaxWidth": false, "htmlLabels": true, "nodeSpacing": 65, "rankSpacing": 85}, "themeVariables": {"fontSize": "24px"}}}%%
flowchart TB
    PC["🖥️ WINDOWS-APP<br/>Text · Mikrofon · Verlauf"]
    MOB["📱 HANDY-APP<br/>Sprachchat · Push"]
    TEL["📞 TELEFON<br/>Erinnerung · Rückfragen"]

    CORE["🧠 NEXO-KERN<br/>Agent · Gedächtnis · Berechtigungen"]

    AI["🤖 KI UND SPRACHE<br/>Ollama + lokales LLM<br/>Qwen / Gemma / gpt-oss<br/>Whisper + Piper"]
    TOOLS["🧰 PC-WERKZEUGE<br/>Programme · Dateien · Gaming<br/>Obsidian · Einstellungen"]
    CAL["📅 TERMINE<br/>Google oder Outlook<br/>Lesen · Entwurf · Bestätigung"]

    NET["🌐 VERBINDUNG<br/>Tailscale · Webhook-Dienst<br/>verschlüsselt"]
    ALERT["⏰ DRINGENDER TERMIN<br/>unter 60 Minuten<br/>Push → keine Antwort → Anruf"]
    SAFE["🛡️ SICHERHEIT<br/>Freigabeliste · Stoppschalter<br/>Protokoll · Kostenlimit"]

    PC --> CORE
    MOB --> NET --> CORE
    TEL --> NET

    CORE <--> AI
    CORE --> TOOLS
    CORE --> CAL
    SAFE -. kontrolliert .-> CORE
    SAFE -. begrenzt .-> TOOLS

    CAL --> ALERT
    ALERT --> MOB
    ALERT --> TEL

    classDef center fill:#5b4bdb,color:#ffffff,stroke:#8d83ff,stroke-width:4px;
    classDef input fill:#17324d,color:#ffffff,stroke:#4ea3ff,stroke-width:3px;
    classDef module fill:#183c32,color:#ffffff,stroke:#4fd1a1,stroke-width:3px;
    classDef service fill:#4a3217,color:#ffffff,stroke:#ffb84d,stroke-width:3px;
    classDef safety fill:#4b2028,color:#ffffff,stroke:#ff6b7a,stroke-width:3px;

    class CORE center;
    class PC,MOB,TEL input;
    class AI,TOOLS,CAL module;
    class NET,ALERT service;
    class SAFE safety;
```

## So liest du die Grafik

1. Du sprichst oder schreibst über die Windows-App, die Handy-App oder einen Telefonanruf.
2. Alles läuft im **NEXO-Kern** zusammen.
3. Das lokale Sprachmodell über **Ollama** versteht den Auftrag.
4. NEXO verwendet ein freigegebenes Werkzeug für Windows, Dateien, Obsidian oder Kalender.
5. Die Sicherheitsregeln entscheiden, ob NEXO sofort handeln darf oder zuerst nachfragen muss.
6. Bei einem neuen Termin in weniger als 60 Minuten kommt zuerst eine Push-Nachricht und danach bei ausbleibender Antwort ein Anruf.

> [!important] Noch nicht festgelegt
> Ob Qwen, Gemma oder gpt-oss verwendet wird, entscheidet ein Test mit deiner Grafikkarte. Die restliche Architektur bleibt bei einem Modellwechsel gleich.

