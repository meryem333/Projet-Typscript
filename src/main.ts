import {
  type Wizard,
  type NewWizard,
  type Spell,
  type AcademyEvent,
  type SpellCastEvent,
  type House,
  type HousePoints,
  type SpellCategory,
  type SpellOutput,
  type ArrayElement,
  type WizardSummary,
  type WizardUpdate,
  type AttackSpell,
  type NonHealingCategory,
} from "./types";

import { WizardRepository, SpellRepository } from "./repository";
import { Log, Cache } from "./decorators";

// Exercice 6 : type guard strict pour House
const validHouses: readonly House[] = [
  "Gryffindor",
  "Slytherin",
  "Ravenclaw",
  "Hufflepuff"
];

function isHouse(value: unknown): value is House {
  return (
    typeof value === "string" &&
    validHouses.some(house => house === value)
  );
}

// Type guard: safely narrow unknown data to a Wizard.
function isWizard(value: unknown): value is Wizard {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    isHouse(candidate.house) &&
    typeof candidate.level === "number" &&
    typeof candidate.active === "boolean"
  );
}

// Exercice 3 : gestionnaire qui n'accepte que les événements spell-cast
function handleSpellCast(event: SpellCastEvent): void {
  console.log(`Wizard ${event.wizardId} cast ${event.spellName}`);
}

class AcademyService {
  constructor(
    private readonly wizards: WizardRepository,
    private readonly spells: SpellRepository
  ) {}

  @Log
  castSpell(wizardId: number, spellId: number): string {
    const wizard = this.wizards.findById(wizardId);
    const spell = this.spells.findById(spellId);

    if (!wizard || !spell) {
      throw new Error("Wizard or spell not found");
    }

    return `${wizard.name} casts ${spell.name}!`;
  }

  // Exercice 1 : enregistrer un sorcier sans fournir d'id
  registerWizard(newWizard: NewWizard): Wizard {
    const nextId = Math.max(0, ...this.wizards.getAll().map(w => w.id)) + 1;
    const wizard = { ...newWizard, id: nextId } as Wizard;
    this.wizards.add(wizard);
    return wizard;
  }

  findByHouse(house: House): WizardSummary[] {
    return this.wizards
      .findByHouse(house)
      .map(({ id, name, house }) => ({ id, name, house }));
  }

  updateWizard(id: number, changes: WizardUpdate): boolean {
    return this.wizards.update(id, changes);
  }

  getSpellEvents(events: AcademyEvent[]): SpellCastEvent[] {
    return events.filter(
      (event): event is SpellCastEvent => event.type === "spell-cast"
    );
  }
}

// Exercice 5 : service avec méthode mise en cache
class SpellCalculator {
  @Cache
  calculatePower(basePower: number, multiplier: number): number {
    console.log("Calculating...");
    return basePower * multiplier;
  }
}

const wizards = new WizardRepository();
const spells = new SpellRepository();

wizards.add({
  id: 1,
  name: "Harry Potter",
  house: "Gryffindor",
  level: 5,
  active: true,
  patronus: "Stag"
});

wizards.add({
  id: 2,
  name: "Hermione Granger",
  house: "Gryffindor",
  level: 8,
  active: true
});

wizards.add({
  id: 3,
  name: "Draco Malfoy",
  house: "Slytherin",
  level: 6,
  active: true
});

spells.add({
  id: 101,
  name: "Expelliarmus",
  category: "attack",
  power: 80
});

spells.add({
  id: 102,
  name: "Protego",
  category: "defense",
  power: 60
});

const academy = new AcademyService(wizards, spells);

console.log("\n--- Cast a spell ---");
console.log(academy.castSpell(1, 101));

console.log("\n--- Find wizards by house ---");
console.log(academy.findByHouse("Gryffindor"));

console.log("\n--- Update a wizard ---");
academy.updateWizard(1, { level: 6 });
console.log(wizards.findById(1));

console.log("\n--- Type guard ---");
const unknownWizard: unknown = wizards.findById(1);
if (isWizard(unknownWizard)) {
  console.log(`${unknownWizard.name} belongs to ${unknownWizard.house}`);
}

console.log("\n--- Record utility type ---");
const points: HousePoints = {
  Gryffindor: 100,
  Slytherin: 80,
  Ravenclaw: 90,
  Hufflepuff: 70
};
console.log(points);

console.log("\n--- Extract spell-cast events ---");
const events: AcademyEvent[] = [
  { type: "spell-cast", wizardId: 1, spellName: "Lumos" },
  { type: "level-up", wizardId: 2, newLevel: 9 },
  { type: "wizard-expelled", wizardId: 3 }
];
console.log(academy.getSpellEvents(events));

// ---------------- TAF : tests des exercices ----------------

console.log("\n--- Ex1 : nouveau sorcier ---");
const luna = academy.registerWizard({
  name: "Luna Lovegood",
  house: "Ravenclaw",
  level: 4,
  active: true
});
console.log(luna); // id: 4

console.log("\n--- Ex2 : findByHouse (repository) ---");
console.log(wizards.findByHouse("Slytherin"));
// wizards.findByHouse("Durmstrang"); // ❌ erreur de compilation

console.log("\n--- Ex3 : handleSpellCast ---");
handleSpellCast({ type: "spell-cast", wizardId: 1, spellName: "Expelliarmus" });
// handleSpellCast({ type: "level-up", wizardId: 1, newLevel: 3 }); // ❌ erreur de compilation

console.log("\n--- Ex4 : validation de la puissance ---");
spells.add({ id: 104, name: "Protego Maxima", category: "defense", power: 50 });
try {
  spells.add({ id: 103, name: "Invalid Spell", category: "attack", power: -10 });
} catch (error) {
  console.log("Rejeté :", error instanceof Error ? error.message : error);
}

console.log("\n--- Ex5 : cache ---");
const calculator = new SpellCalculator();
console.log(calculator.calculatePower(10, 3)); // MISS
console.log(calculator.calculatePower(10, 3)); // HIT
console.log(calculator.calculatePower(5, 2));  // MISS

console.log("\n--- Ex6 : type guard strict ---");
const validData: unknown = {
  id: 1,
  name: "Harry Potter",
  house: "Gryffindor",
  level: 5,
  active: true
};
const invalidData: unknown = {
  id: 2,
  name: "Viktor",
  house: "Durmstrang",
  level: 5,
  active: true
};
console.log(isWizard(validData));   // true
console.log(isWizard(invalidData)); // false

// Compile-time demonstrations: these aliases are checked by TypeScript.
type CastArguments = Parameters<AcademyService["castSpell"]>;
type CastResult = ReturnType<AcademyService["castSpell"]>;
type AttackOutput = SpellOutput<"attack">; // number
type HealingOutput = SpellOutput<"healing">; // string
type SpellItem = ArrayElement<Spell[]>; // Spell
type AttackSpellExample = AttackSpell;
type RemainingCategories = NonHealingCategory;
type CategoryExample = SpellCategory;

const typeExamples: [
  CastArguments,
  CastResult,
  AttackOutput,
  HealingOutput,
  SpellItem,
  AttackSpellExample["category"],
  RemainingCategories,
  CategoryExample
] | null = null;

void typeExamples;