# The 21st Century Coder's Handbook

## Ein Manifest für Coder mit Respekt vor der Maschine

Version: 0.4  
Stand: 7.7.2026

### Präambel

AI kann Code schneller erzeugen, als Menschen ihn verstehen können. Das ist Macht und Risiko zugleich.

Der Coder des 21. Jahrhunderts nutzt AI nicht, um Urteilsvermögen zu ersetzen, sondern um Reibung zu senken. Geschwindigkeit ist willkommen. Blindheit nicht.

Code ist kein Text, der zufällig läuft. Code ist eine Verpflichtung gegenüber drei Lesern: der Maschine, die ihn ausführt; dem Menschen, der ihn warten muss; und dem System, das unter Fehlern, Last, Angriffen und Zeitdruck weiterleben soll.

Respekt vor der Maschine heißt: keine unnötigen Schichten, keine verschwendeten Ressourcen, keine unklare Kontrolle, keine versteckten Kosten.

Respekt vor Menschen heißt: klare Namen, kleine Änderungen, nachvollziehbare Entscheidungen, prüfbare Ergebnisse.

### 1. Die Grundhaltung

Wir verwechseln generierten Code nicht mit entwickeltem Code.

AI darf tippen. Der Coder entscheidet.

AI darf Vorschläge machen. Das Repo gibt die Form vor.

AI darf Geschwindigkeit bringen. Tests, Grenzen und Invarianten entscheiden, ob der Code bleiben darf.

Vibe Coding ist als Explorationsmodus erlaubt. Als Produktionsmodus braucht es Zügel: Repo-First, Minimal-Scope, Datenmodell zuerst, Beweis zuletzt.

Der Maßstab ist nicht Outputmenge. Der Maßstab ist Code, dessen Form am Repo belegbar ist, dessen Kontrollfluss zur Sprache passt, unter Last verständlich bleibt und von der Maschine ohne versteckte Verschwendung ausgeführt werden kann.

### 2. Die zwölf Gelöbnisse

1. Ich lese, was ich shippe.
2. Ich kann erklären, was ich committe.
3. Ich beginne im Repo, nicht im Prompt.
4. Ich suche vor jeder Änderung zwei bis drei ähnliche Stellen.
5. Ich ändere nur die kleinste notwendige Codefläche.
6. Ich baue keine Architektur für hypothetische Zukunft.
7. Ich modelliere Daten, Invarianten und Fehlergrenzen zuerst.
8. Ich mache Spezialfälle nach Möglichkeit zum Normalfall.
9. Ich bezahle jede Abstraktion mit einem echten Bedarf.
10. Ich behandle Security, Ressourcen und Fehlerpfade als Teil des Designs.
11. Ich beweise Verhalten durch Tests, Checks oder reproduzierbare Läufe.
12. Ich höre auf, wenn der Slice erfüllt ist.

### 3. Die Anti-Bloat-Gesetze

Keine neue Schicht ohne klaren zweiten Nutzen.

Kein generischer Helper für später.

Keine Option, kein Flag, kein Pluginpunkt ohne echte Anforderung.

Keine neue Dependency ohne zwingenden Grund und Prüfung der Kosten.

Keine Formatierungswelle im Feature-Patch.

Keine stillen Fehler.

Keine semantische Doppelspur.

Keine zwei Quellen der Wahrheit.

Keine Kommentare, die nur unklaren Code entschuldigen.

Keine Performancebehauptung ohne Messung oder mindestens nachvollziehbare Kostenanalyse.

Keine Securitybehauptung ohne geprüfte Boundary.

Kein DONE ohne Nachweis.

### 4. Das Repo ist der Stilgeber

Guter AI-Code wirkt nicht nach AI. Er wirkt nach dem Repo.

Vor jeder Implementierung gilt:

- zwei bis drei ähnliche Stellen finden,
- Naming, Struktur, Error-Handling, Tests und Tooling übernehmen,
- keine abstrakt schönere Lösung bauen, wenn sie nicht repo-nativ ist,
- keine neue Architektur einführen, wenn ein vorhandenes Muster reicht.

Das Ziel ist nicht, AI zu verstecken. Das Ziel ist Ownership.

Die Rangfolge lautet: erst konkrete Repo-Präzedenz, dann Idiom der Sprache und des Ökosystems, dann generische Stilregeln, zuletzt persönlicher Geschmack. Wer diese Reihenfolge umdreht, erzeugt Code, der zwar läuft, aber fremd wirkt.

Repo-First bedeutet nicht, alte Fehler blind zu kopieren. Wenn ein vorhandenes Muster unsicher, falsch oder offenkundig veraltet ist, wird das benannt und nicht still reproduziert. Die Abweichung bleibt dann klein, lokal und begründet.

### 5. Die Handschrift-Schicht

Die Handwriting Rules sind die operative Patch-Disziplin dieses Manifests.

Übernommen werden sollten:

- Repo-First und Pattern-Sampling,
- Minimal-Diff und klare Scope-Trennung,
- Anti-Cleverness und 60-Sekunden-Lesbarkeit,
- die 3-Schritt-Routine Rename & Shape, Delete the Weird, Prove It,
- Tests nach Repo-Standard mit mindestens einem relevanten Edge-Case,
- eine knappe PR-Beschreibung mit Problem, Ansatz, Risiken und How to test.

Diese Regeln sind der direkte Schutz gegen typische AI-Signaturen: zu generische Utilities, Pattern-Sprünge, Options-Orgien, Mikro-Abstraktionen und unbewiesene Verbesserungen.

Ihre Rolle im Gesamtsystem ist lokal und handwerklich: Sie beantworten die Frage, wie ein konkreter Patch geschrieben wird, damit er wie Arbeit eines guten Maintainers wirkt.

### 6. Die Motherlode-Schicht

Motherlode ist die Risiko-, Nachweis- und Betriebsschicht dieses Manifests.

Übernommen werden sollten:

- Correctness first,
- Security by default,
- Maintainability,
- Observability,
- Reproducibility,
- reversible Changes und Rollback-Fähigkeit,
- risk-driven Tests,
- explizite Trust Boundaries,
- Nachweisformate für Agenten.

Motherlode darf nicht selbst zu Bloat werden. Es ist eine Verfassung, kein Bürokratiemonster.

Die Agentenrollen aus Motherlode sind deshalb keine Pflichtbesetzung für jeden kleinen Slice. Sie sind Prüfperspektiven. Bei kleinen Änderungen reicht ein einzelner Agent, der die relevanten Perspektiven explizit abdeckt. Bei riskanten Änderungen werden Security, Performance, Migration, Rollback und Observability bewusst aktiviert.

Ihre Rolle im Gesamtsystem ist systemisch und betrieblich: Sie beantwortet die Frage, welche Risiken ein Patch beweisbar kontrollieren muss, bevor er als fertig gelten darf.

### 7. Auf den Schultern von Riesen

> "If I have seen further it is by standing on the shoulders of Giants."  
> Isaac Newton, letter to Robert Hooke, 5 February 1675/6

Dieses Manifest ist kein Versuch, alte Meister zu imitieren. Es ist der Versuch, ihren Qualitätsdruck in eine Zeit zu übertragen, in der Code schneller erzeugt wird, als Menschen ihn prüfen können.

Die Kernlehren sind einfach, aber hart:

Komplexität ist der Hauptgegner. Neue Werkzeuge entfernen sie nicht automatisch. Oft beschleunigen sie nur ihre Produktion.

Gute Form macht Spezialfälle kleiner. Der beste Zweig ist der, der durch eine bessere Datenform nicht mehr gebraucht wird.

Kleine Teile sind kein Selbstzweck. Sie sind nur dann gut, wenn sie klare Grenzen haben, eine erkennbare Aufgabe erfüllen und ohne versteckte Kopplung zusammenspielen.

Klarheit schlägt Cleverness. Code, der einen Trick braucht, um elegant zu wirken, wird unter Wartungsdruck teuer.

Korrektheit kommt vor Geschwindigkeit. Geschwindigkeit ohne Nachweis ist nur beschleunigtes Risiko.

Messen schlägt Behaupten. Wer Performance, Sicherheit oder Ressourcenschonung behauptet, muss Kosten, Grenzen und Fehlerpfade sichtbar machen.

Datenform schlägt Kontrollakrobatik. Wenn das Modell stimmt, wird der Kontrollfluss einfacher. Wenn das Modell schwach ist, wachsen Flags, Sonderzweige und Shadow-Konfiguration.

Eigentümlichkeit ist kein Stil. Stil entsteht, wenn Entscheidungen wiederholbar, begründet und im Kontext des Systems verständlich sind.

Das ist die Brücke zwischen klassischer Programmierdisziplin und AI-gestütztem Arbeiten: AI darf die Schreibgeschwindigkeit erhöhen. Sie darf aber nicht die Verantwortung für Form, Grenzen und Beweis übernehmen.

### 8. Sprach- und Idiom-Schicht

Repo-native ist nicht nur Architektur. Es ist auch Syntax, Kontrollfluss und Spracheigenheit.

AI-Code wird oft nicht durch große Fehler entlarvt, sondern durch kleine unnatürliche Nähte: Zeilenumbrüche, die gegen das Ökosystem arbeiten; Fortsetzungszeichen, die nur einen fremden Formatierungsstil retten; gemischte Kontrollstrukturen, die denselben Wert mehrfach befragen; Hilfsfunktionen, die eine einfache Entscheidung verstecken.

Die Regel lautet: Kämpfe nicht gegen die Sprache. Nutze ihre natürlichen Formen.

Ungewöhnliche Syntax ist nicht verboten. Sie ist begründungspflichtig. Wenn ein Sprachelement fragil, selten, schlecht sichtbar oder im Ökosystem ungern gesehen ist, braucht es einen konkreten Vorteil für diesen Slice. Sonst wird es entfernt.

Beispiele für verallgemeinerte Gerüche:

- Ein Fortsetzungszeichen, nur weil eine persönliche Klammer- oder Zeilenstilregel erzwungen wird. Besser: natürliche Zeilenumbrüche, Splatting, lokale Variablen oder kleinere Ausdrücke nach Idiom der Sprache.
- Mehrere `if`-Prüfungen und danach ein `switch` über denselben Entscheidungsraum. Besser: eine klare Normalisierung und eine erkennbare Dispatch-Form.
- Guard Clauses, die unterschiedliche Fehlergrenzen markieren, sind gut. Guard Clauses, die denselben Fall gestückelt behandeln, sind ein Nahtsignal.
- Eine Abstraktion, die nur existiert, damit generierter Code strukturierter aussieht. Besser: direkte lokale Form, bis echte Wiederholung einen Bedarf beweist.
- Kommentare, die einen seltsamen Kontrollfluss erklären, statt den Kontrollfluss zu vereinfachen.

Der Agent muss nach dem Patch einen Idiom-Pass machen:

- Gibt es Syntax, die in dieser Sprache als fragil oder ungewöhnlich gilt?
- Gibt es gemischte Kontrollstrukturen für dieselbe Entscheidung?
- Wurde ein Stil aus einer anderen Sprache importiert?
- Wurde eine persönliche Formatvorliebe gegen ein Ökosystemidiom durchgesetzt?
- Kann eine kleine lokale Umformung den Code natürlicher machen, ohne Scope zu erweitern?

Wenn ja, wird die Stelle entweder vereinfacht oder explizit begründet.

### 9. Der AI-Agenten-Workflow

Jeder Agent arbeitet in dieser Reihenfolge:

1. Context
   - Repo prüfen.
   - Zwei bis drei ähnliche Stellen lesen.
   - vorhandene Muster notieren.

2. Idiom
   - Sprache, Ökosystem und lokale Syntaxform prüfen.
   - Zeilenumbrüche, Aufrufmuster und Kontrollstrukturen aus Repo-Präzedenz ableiten.
   - fremde Stilregeln nicht gegen Sprachidiome erzwingen.

3. Slice
   - Ziel eng schneiden.
   - Nicht-Ziele explizit machen.
   - Stop-Bedingung definieren.

4. Shape
   - Datenform, Invarianten und Fehlergrenzen klären.
   - Trust Boundaries markieren.
   - Ressourcen- und Laufzeitkosten grob abschätzen.

5. Patch
   - kleinste Änderung umsetzen.
   - keine Nebenrefactors.
   - keine neuen Dependencies ohne harte Begründung.

6. Delete
   - Weirdness entfernen.
   - unnötige Optionen, Helper, Flags und Indirektionen streichen.
   - prüfen, ob ein Spezialfall durch bessere Datenform verschwinden kann.

7. Prove
   - Syntaxcheck.
   - Typecheck oder Build.
   - gezielte Tests oder reproduzierbarer Dry-Run.
   - relevante Security-, Boundary- und Ressourcenprüfung.

8. Report
   - DONE.
   - NOT DONE.
   - CHECKS.
   - READY FOR NEXT STEP.

9. Stop
   - Nicht organisch weiterbauen.

### 10. Maschinenrespekt praktisch

Maschinenrespekt bedeutet nicht, alles low-level zu schreiben. Es bedeutet, Kosten nicht zu verstecken.

Der Agent muss bei relevanten Änderungen beantworten können:

- Läuft das pro Request, pro Render, pro Element oder pro Datei?
- Werden Daten unnötig kopiert?
- Wird mehrfach geparst?
- Gibt es unkontrollierte Parallelität?
- Gibt es Backpressure, Timeout und Abbruch?
- Wird Zustand dupliziert?
- Ist die Public API größer als nötig?
- Kann ein Spezialfall durch bessere Datenform verschwinden?
- Ist die Änderung rollbackfähig?

Maschinennaher Code ist nicht zwangslaufig Low-Level-Code. Maschinennaher Code ist Code, dessen Kosten, Zustandsübergänge und Fehlergrenzen sichtbar bleiben.

### 11. Prompt-Grundformel

Du bist Senior-Maintainer dieses Repos.

Implementiere genau: [enger Slice].

Vor dem Patch:

- Prüfe zwei bis drei ähnliche Stellen.
- Folge Naming, Struktur, Error-Handling, Validation, Tests und Tooling des Repos.
- Folge den Idiomen der Sprache und des Ökosystems. Keine fragilen oder ungewöhnlichen Syntaxformen ohne konkrete Begründung.
- Beschreibe Datenform, Invarianten und Fehlerfälle kurz.

Harte Verbote:

- keine neue Architektur,
- keine neuen Dependencies,
- keine generischen Helper für hypothetische Zukunft,
- keine Options-/Flag-Orgie,
- keine Formatierungswelle,
- keine Nebenrefactors,
- keine stillen Fehler,
- keine fremden Stilregeln gegen Sprachidiome,
- keine gemischten Kontrollstrukturen für dieselbe Entscheidung ohne Begründung,
- kein ungetesteter Fertig-Anspruch.

Nach dem Patch:

- Delete-the-Weird-Pass,
- Syntax-/Typecheck,
- gezielte Tests oder reproduzierbarer Dry-Run,
- Abschluss mit DONE / NOT DONE / CHECKS / READY FOR NEXT STEP.

Stoppe nach Erfüllung des Slices.

### 12. Definition of Done

Repo-nativ ist kein Gefühl, sondern ein Nachweis.

Eine Änderung ist nur fertig, wenn:

- der Scope eingehalten wurde,
- vor der Änderung zwei bis drei konkrete ähnliche Stellen im Repo geprüft wurden,
- diese Vorbilder im Abschluss benannt werden,
- der Patch nachweisbar deren Muster folgt: Dateiplatzierung, Benennung, Kontrollfluss, Syntaxform, Fehlerbehandlung, Validierung, Typisierung, Teststil und Import-/Export-Muster,
- falls es kein Vorbild gibt, dies ausdrücklich gesagt wird und das neue Muster klein, lokal und begründet bleibt,
- Syntax und Kontrollfluss idiomatisch für Sprache und Repo sind oder jede Abweichung konkret begründet ist,
- gemischte Entscheidungsformen wie mehrere `if`-Prüfungen plus `switch` nur bleiben, wenn sie unterschiedliche Anliegen trennen und nicht denselben Fall gestückelt behandeln,
- Invarianten und Fehlerpfade klar sind,
- Security-relevante Grenzen geprüft wurden,
- die Änderung testbar und geprüft ist oder ausdrücklich als nicht verifiziert markiert wird,
- keine neue Abstraktion, Dependency, Helper-Schicht oder Konvention eingeführt wurde, sofern sie nicht für diesen Slice nötig ist,
- Ressourcen- und Laufzeitkosten verstanden sind,
- ein Maintainer in kurzer Zeit beantworten kann: Was wurde geändert? Warum hier? Welchem bestehenden Muster folgt es? Was wurde bewusst nicht geändert?

Wenn ein Check nicht ausgeführt werden konnte, wird das nicht kaschiert. Es wird als nicht verifiziert markiert.

### 13. Integrationskarte

Dieses Handbook vereint drei Schichten:

Manifest: dauerhafte Haltung. Es definiert Verantwortung, Maschinenrespekt, kleine reversible Änderungen und den Vorrang von Beweis vor Behauptung.

Handwriting Rules: konkrete Patch-Handschrift. Sie sorgen dafür, dass AI-Code nicht fremd wirkt, sondern sich an lokalen Repo-Mustern, Minimal-Diff und lesbarer Maintainer-Qualität orientiert.

Motherlode: Risiko- und Nachweissystem. Es stellt sicher, dass Correctness, Security, Observability, Reproducibility, Rollback und Tests nicht zufällig, sondern prüfbar behandelt werden.

Die stabile Reihenfolge lautet:

1. Manifest gibt Richtung.
2. Repo gibt Form.
3. Handwriting gibt Patch-Disziplin.
4. Motherlode gibt Risiko- und Nachweisgrenzen.
5. Tests und Checks geben Freigabe.

So entsteht ein System, das aktuelle Tool-Trends überdauern kann. Es hängt nicht an einem bestimmten Agenten, Editor oder Modell. Es hängt an dauerhaften Constraints: menschliche Aufmerksamkeit ist begrenzt, Maschinenressourcen sind endlich, Security-Grenzen müssen explizit sein, und große Systeme bleiben nur stabil, wenn kleine Änderungen klar, lokal und beweisbar bleiben.

### 14. Schlussformel

Der Coder des 21. Jahrhunderts schreibt nicht mehr jede Zeile selbst.

Aber er bleibt verantwortlich für jede Zeile.

AI gibt Tempo.

Das Repo gibt Form.

Die Maschine gibt Grenzen.

Der Beweis gibt Freigabe.
