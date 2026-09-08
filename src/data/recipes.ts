/**
 * AR Smart Cooking Assistant — Sample Recipe Data
 *
 * Local data source for Phase 2. In future phases this will be
 * replaced / augmented by a Supabase-backed API, but the same
 * Recipe interface will be used throughout.
 *
 * Recipe IDs use the format "recipe-<slug>" so that they can be
 * embedded directly as QR-code payloads in Phase 3, e.g.:
 *   https://arcook.app/scan?id=recipe-masala-maggi
 */

import type { Recipe } from "@/types/recipe";

// ─── 1. Masala Maggi ──────────────────────────────────────────────────────────

const masalaMaggi: Recipe = {
  id: "recipe-masala-maggi",
  name: "Masala Maggi",
  description:
    "A spiced-up twist on the classic instant noodles, loaded with vegetables, aromatic spices, and a rich masala base. Ready in minutes.",
  image: "/images/recipes/masala-maggi.jpg",
  difficulty: "Easy",
  cookingTime: 12,
  points: 50,
  ingredients: [
    { name: "Maggi noodles (with tastemaker)", quantity: "2 packets" },
    { name: "Water", quantity: "2½ cups" },
    { name: "Oil", quantity: "1 tbsp" },
    { name: "Onion, finely chopped", quantity: "1 medium" },
    { name: "Tomato, finely chopped", quantity: "1 medium" },
    { name: "Green chilli, slit", quantity: "1" },
    { name: "Ginger-garlic paste", quantity: "½ tsp" },
    { name: "Turmeric powder", quantity: "¼ tsp" },
    { name: "Red chilli powder", quantity: "½ tsp" },
    { name: "Garam masala", quantity: "¼ tsp" },
    { name: "Coriander leaves, chopped", quantity: "2 tbsp" },
    { name: "Salt", quantity: "to taste" },
    { name: "Mixed vegetables (peas, corn, carrot, capsicum)", quantity: "½ cup" },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        "Heat oil in a pan over medium heat. Add the chopped onion and green chilli. Sauté for 2 minutes until the onion turns translucent.",
      duration: 120,
      optionalTip: "A wider pan helps water evaporate faster, giving a drier, restaurant-style Maggi.",
    },
    {
      stepNumber: 2,
      instruction:
        "Add ginger-garlic paste and sauté for 30 seconds until the raw smell disappears.",
      duration: 30,
      optionalTip: null,
    },
    {
      stepNumber: 3,
      instruction:
        "Add the chopped tomato. Cook for 2 minutes, stirring occasionally, until the tomato softens and oil starts to separate.",
      duration: 120,
      optionalTip: "Adding a pinch of salt here helps the tomato break down faster.",
    },
    {
      stepNumber: 4,
      instruction:
        "Add turmeric powder, red chilli powder, and garam masala. Stir well and cook for 30 seconds.",
      duration: 30,
      optionalTip: null,
    },
    {
      stepNumber: 5,
      instruction:
        "Add the mixed vegetables and stir to coat them with the masala. Cook for 1 minute.",
      duration: 60,
      optionalTip: null,
    },
    {
      stepNumber: 6,
      instruction:
        "Pour in the water and bring to a boil over high heat. Once boiling, add the Maggi noodles and the tastemaker sachets.",
      duration: 90,
      optionalTip: "Break the noodle cake in half before adding so they cook evenly.",
    },
    {
      stepNumber: 7,
      instruction:
        "Cook for 2–3 minutes, stirring occasionally, until the noodles are cooked and the water is mostly absorbed. Adjust salt.",
      duration: 180,
      optionalTip: "Remove from heat while there's still a little moisture — it will absorb as you plate.",
    },
    {
      stepNumber: 8,
      instruction: "Garnish with fresh coriander leaves and serve immediately.",
      duration: 30,
      optionalTip: "A squeeze of lemon juice just before serving brightens all the flavours.",
    },
  ],
};

// ─── 2. Masala Pasta ──────────────────────────────────────────────────────────

const masalaPasta: Recipe = {
  id: "recipe-masala-pasta",
  name: "Masala Pasta",
  description:
    "Indian-style pasta cooked in a tangy tomato-onion masala with bell peppers and cheese. A perfect fusion dish for all ages.",
  image: "/images/recipes/masala-pasta.jpg",
  difficulty: "Easy",
  cookingTime: 25,
  points: 60,
  ingredients: [
    { name: "Penne or fusilli pasta", quantity: "1½ cups (150 g)" },
    { name: "Water (for boiling)", quantity: "4 cups" },
    { name: "Salt (for boiling)", quantity: "1 tsp" },
    { name: "Oil", quantity: "1½ tbsp" },
    { name: "Onion, finely chopped", quantity: "1 medium" },
    { name: "Garlic cloves, minced", quantity: "3" },
    { name: "Green capsicum, diced", quantity: "½" },
    { name: "Red capsicum, diced", quantity: "½" },
    { name: "Tomato, finely chopped", quantity: "2 medium" },
    { name: "Tomato ketchup", quantity: "2 tbsp" },
    { name: "Red chilli flakes", quantity: "½ tsp" },
    { name: "Dried oregano", quantity: "½ tsp" },
    { name: "Cumin powder", quantity: "¼ tsp" },
    { name: "Chaat masala", quantity: "½ tsp" },
    { name: "Salt", quantity: "to taste" },
    { name: "Grated cheese or paneer", quantity: "¼ cup" },
    { name: "Fresh coriander or basil", quantity: "2 tbsp" },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        "Bring 4 cups of salted water to a rolling boil in a large pot. Add pasta and cook according to package instructions (usually 8–10 min) until al dente. Reserve ¼ cup pasta water, then drain.",
      duration: 600,
      optionalTip: "Do not rinse the pasta after draining — the starch helps the sauce cling.",
    },
    {
      stepNumber: 2,
      instruction:
        "While pasta cooks, heat oil in a large pan over medium heat. Add onion and sauté for 3 minutes until golden.",
      duration: 180,
      optionalTip: null,
    },
    {
      stepNumber: 3,
      instruction:
        "Add minced garlic and sauté for 30 seconds until fragrant.",
      duration: 30,
      optionalTip: null,
    },
    {
      stepNumber: 4,
      instruction:
        "Add diced capsicums and cook for 2 minutes until slightly tender but still with a crunch.",
      duration: 120,
      optionalTip: "Keep the heat medium-high so the capsicums blister slightly for a smoky flavour.",
    },
    {
      stepNumber: 5,
      instruction:
        "Add chopped tomatoes. Cook for 3–4 minutes, pressing with the back of the spoon, until they break down into a thick sauce.",
      duration: 210,
      optionalTip: null,
    },
    {
      stepNumber: 6,
      instruction:
        "Stir in tomato ketchup, chilli flakes, oregano, cumin powder, chaat masala, and salt. Mix well and cook for 1 minute.",
      duration: 60,
      optionalTip: "Taste at this stage and adjust spice and salt before adding pasta.",
    },
    {
      stepNumber: 7,
      instruction:
        "Add the drained pasta to the pan. Toss well to coat every piece with the masala. Add a splash of reserved pasta water if the sauce seems too thick.",
      duration: 90,
      optionalTip: null,
    },
    {
      stepNumber: 8,
      instruction:
        "Remove from heat. Top with grated cheese and fresh coriander. Serve hot.",
      duration: 30,
      optionalTip: "For extra richness, cover the pan for 1 minute after adding cheese so it melts gently.",
    },
  ],
};

// ─── 3. Vegetable Sandwich ────────────────────────────────────────────────────

const vegetableSandwich: Recipe = {
  id: "recipe-vegetable-sandwich",
  name: "Vegetable Sandwich",
  description:
    "A hearty grilled sandwich stuffed with spiced potato filling, fresh vegetables, and green chutney. A popular Indian street-food classic.",
  image: "/images/recipes/vegetable-sandwich.jpg",
  difficulty: "Easy",
  cookingTime: 20,
  points: 40,
  ingredients: [
    { name: "Bread slices (white or brown)", quantity: "8 slices" },
    { name: "Butter (for spreading & grilling)", quantity: "3 tbsp" },
    { name: "Boiled potatoes, mashed", quantity: "2 medium" },
    { name: "Onion, thinly sliced", quantity: "1 small" },
    { name: "Tomato, thinly sliced", quantity: "1 medium" },
    { name: "Cucumber, thinly sliced", quantity: "½" },
    { name: "Green capsicum, thinly sliced", quantity: "½" },
    { name: "Green chutney", quantity: "4 tbsp" },
    { name: "Chaat masala", quantity: "1 tsp" },
    { name: "Red chilli powder", quantity: "½ tsp" },
    { name: "Cumin powder", quantity: "¼ tsp" },
    { name: "Salt", quantity: "to taste" },
    { name: "Grated cheese (optional)", quantity: "¼ cup" },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        "Season the mashed potatoes with chaat masala, red chilli powder, cumin powder, and salt. Mix thoroughly.",
      duration: 60,
      optionalTip: "Add a small handful of chopped coriander to the potato filling for extra freshness.",
    },
    {
      stepNumber: 2,
      instruction:
        "Lay out 4 bread slices. Spread a generous layer of green chutney on one side of each slice.",
      duration: 60,
      optionalTip: null,
    },
    {
      stepNumber: 3,
      instruction:
        "Spread the seasoned potato mixture evenly over the chutney on 4 slices.",
      duration: 60,
      optionalTip: null,
    },
    {
      stepNumber: 4,
      instruction:
        "Layer the onion slices, tomato slices, cucumber slices, and capsicum on top of the potato filling. Sprinkle a pinch of chaat masala over the vegetables.",
      duration: 90,
      optionalTip: "Pat the vegetable slices dry with a kitchen towel to prevent the bread from going soggy.",
    },
    {
      stepNumber: 5,
      instruction:
        "If using cheese, sprinkle grated cheese over the vegetables now. Place the remaining bread slices on top to form 4 sandwiches.",
      duration: 30,
      optionalTip: null,
    },
    {
      stepNumber: 6,
      instruction:
        "Butter both outer sides of each sandwich generously.",
      duration: 60,
      optionalTip: null,
    },
    {
      stepNumber: 7,
      instruction:
        "Heat a sandwich press or a flat griddle pan over medium heat. Place the sandwiches and grill for 2–3 minutes per side until golden-brown and crispy.",
      duration: 300,
      optionalTip: "Press down gently with a spatula to ensure even contact and golden crust.",
    },
    {
      stepNumber: 8,
      instruction:
        "Cut diagonally and serve immediately with extra green chutney and tomato ketchup on the side.",
      duration: 30,
      optionalTip: null,
    },
  ],
};

// ─── 4. Fried Rice ────────────────────────────────────────────────────────────

const friedRice: Recipe = {
  id: "recipe-fried-rice",
  name: "Fried Rice",
  description:
    "Classic Indo-Chinese fried rice tossed on high heat with vegetables, soy sauce, and aromatic spices. Best made with day-old cooked rice.",
  image: "/images/recipes/fried-rice.jpg",
  difficulty: "Medium",
  cookingTime: 20,
  points: 70,
  ingredients: [
    { name: "Cooked rice (day-old, cooled)", quantity: "2 cups" },
    { name: "Oil", quantity: "2 tbsp" },
    { name: "Garlic cloves, finely minced", quantity: "4" },
    { name: "Spring onion (white & green separated)", quantity: "3 stalks" },
    { name: "Carrot, finely diced", quantity: "½ cup" },
    { name: "French beans, finely chopped", quantity: "¼ cup" },
    { name: "Cabbage, finely shredded", quantity: "½ cup" },
    { name: "Green capsicum, diced", quantity: "½" },
    { name: "Eggs (optional)", quantity: "2" },
    { name: "Soy sauce", quantity: "2 tbsp" },
    { name: "Dark soy sauce", quantity: "1 tsp" },
    { name: "Rice vinegar", quantity: "1 tsp" },
    { name: "White pepper powder", quantity: "½ tsp" },
    { name: "Salt", quantity: "to taste" },
    { name: "Sesame oil (for finishing)", quantity: "1 tsp" },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        "Ensure the cooked rice is completely cooled and grains are separated. Refrigerated day-old rice works best. Break up any clumps with your fingers.",
      duration: 60,
      optionalTip: "Freshly cooked hot rice releases too much steam and turns mushy when fried. Plan ahead!",
    },
    {
      stepNumber: 2,
      instruction:
        "Heat oil in a wok or large pan over the highest heat your stove can produce. Add minced garlic and the white parts of spring onion. Stir-fry for 30 seconds.",
      duration: 30,
      optionalTip: "High heat (\"wok hei\") is the secret to restaurant-style fried rice. Don't lower the heat.",
    },
    {
      stepNumber: 3,
      instruction:
        "Add carrot and French beans. Stir-fry for 2 minutes until slightly tender.",
      duration: 120,
      optionalTip: null,
    },
    {
      stepNumber: 4,
      instruction:
        "Add cabbage and capsicum. Stir-fry for 1 minute — the vegetables should stay slightly crunchy.",
      duration: 60,
      optionalTip: null,
    },
    {
      stepNumber: 5,
      instruction:
        "(Optional) Push the vegetables to one side. Crack eggs into the pan and scramble them on medium heat until just set. Mix with the vegetables.",
      duration: 90,
      optionalTip: "For a vegan version, skip the eggs entirely or use scrambled tofu.",
    },
    {
      stepNumber: 6,
      instruction:
        "Add the cooled rice to the pan. Toss vigorously to combine with the vegetables. Spread the rice across the pan and let it sit for 30 seconds to pick up some colour.",
      duration: 90,
      optionalTip: null,
    },
    {
      stepNumber: 7,
      instruction:
        "Drizzle soy sauce, dark soy sauce, rice vinegar, and white pepper over the rice. Toss everything together for 2 minutes until evenly coloured and piping hot.",
      duration: 120,
      optionalTip: "Add the soy sauce around the edges of the wok, not directly on the rice, for a light smoky note.",
    },
    {
      stepNumber: 8,
      instruction:
        "Finish with a drizzle of sesame oil and top with spring onion greens. Serve immediately.",
      duration: 30,
      optionalTip: "Taste before adding salt — soy sauce is already salty.",
    },
  ],
};

// ─── 5. Pancakes ──────────────────────────────────────────────────────────────

const pancakes: Recipe = {
  id: "recipe-pancakes",
  name: "Pancakes",
  description:
    "Fluffy, golden American-style pancakes with a tender crumb. Perfect for a weekend breakfast, served with maple syrup and fresh fruit.",
  image: "/images/recipes/pancakes.jpg",
  difficulty: "Easy",
  cookingTime: 20,
  points: 45,
  ingredients: [
    { name: "All-purpose flour (maida)", quantity: "1 cup (120 g)" },
    { name: "Baking powder", quantity: "1½ tsp" },
    { name: "Baking soda", quantity: "¼ tsp" },
    { name: "Sugar", quantity: "2 tbsp" },
    { name: "Salt", quantity: "¼ tsp" },
    { name: "Egg", quantity: "1 large" },
    { name: "Milk", quantity: "¾ cup" },
    { name: "Yogurt or buttermilk", quantity: "2 tbsp" },
    { name: "Melted butter", quantity: "2 tbsp" },
    { name: "Vanilla extract", quantity: "½ tsp" },
    { name: "Butter or oil (for cooking)", quantity: "as needed" },
    { name: "Maple syrup (to serve)", quantity: "as needed" },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        "In a large bowl, whisk together flour, baking powder, baking soda, sugar, and salt until combined.",
      duration: 60,
      optionalTip: "Sifting the flour makes the pancakes slightly lighter.",
    },
    {
      stepNumber: 2,
      instruction:
        "In a separate bowl or jug, whisk together egg, milk, yogurt, melted butter, and vanilla extract.",
      duration: 60,
      optionalTip: "All wet ingredients should be at room temperature for the best rise.",
    },
    {
      stepNumber: 3,
      instruction:
        "Pour the wet ingredients into the dry ingredients. Stir gently with a fork or spatula until just combined. The batter will be lumpy — do not overmix.",
      duration: 60,
      optionalTip: "Overmixing develops gluten and results in tough, flat pancakes. Stop as soon as no dry flour streaks remain.",
    },
    {
      stepNumber: 4,
      instruction:
        "Rest the batter for 5 minutes. This allows the baking powder to activate and gives fluffier pancakes.",
      duration: 300,
      optionalTip: null,
    },
    {
      stepNumber: 5,
      instruction:
        "Heat a non-stick pan or griddle over medium-low heat. Add a small amount of butter. When it foams and subsides, pour ¼ cup of batter per pancake.",
      duration: 60,
      optionalTip: "Use medium-low heat — too hot and the outside burns before the inside cooks.",
    },
    {
      stepNumber: 6,
      instruction:
        "Cook until bubbles form across the surface and the edges look set, about 2–2½ minutes. Flip gently with a spatula.",
      duration: 150,
      optionalTip: "Only flip once. Flipping multiple times deflates the pancake.",
    },
    {
      stepNumber: 7,
      instruction:
        "Cook the second side for 1–1½ minutes until golden. Transfer to a warm plate. Repeat with remaining batter.",
      duration: 90,
      optionalTip: "Keep finished pancakes in a low oven (90°C / 200°F) on a baking tray to stay warm while you cook the rest.",
    },
    {
      stepNumber: 8,
      instruction:
        "Serve stacked with maple syrup, fresh fruit, or a dusting of powdered sugar.",
      duration: 30,
      optionalTip: "Add a small knob of butter between each pancake in the stack for extra richness.",
    },
  ],
};

// ─── Exported Collection ──────────────────────────────────────────────────────

/** All recipes, ordered for display */
export const recipes: Recipe[] = [
  masalaMaggi,
  masalaPasta,
  vegetableSandwich,
  friedRice,
  pancakes,
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Look up a recipe by its unique ID.
 * Returns `undefined` if no match is found.
 */
export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}

/**
 * Filter recipes by difficulty level.
 */
export function getRecipesByDifficulty(difficulty: Recipe["difficulty"]): Recipe[] {
  return recipes.filter((r) => r.difficulty === difficulty);
}

/**
 * Return all recipes sorted by total points (descending).
 */
export function getRecipesSortedByPoints(): Recipe[] {
  return [...recipes].sort((a, b) => b.points - a.points);
}
