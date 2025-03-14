import { z } from "zod";

export type Meal = "breakfast" | "lunch" | "dinner" | "snack";
type MealNorwegian = "Frokost" | "Lunsj" | "Middag" | "Snack";
const mealMapping = {
  Frokost: "breakfast",
  Lunsj: "lunch",
  Middag: "dinner",
  Snack: "snack",
} as const satisfies Record<MealNorwegian, Meal>;

function toMeal(meal: MealNorwegian | undefined): Meal | null {
  return meal ? mealMapping[meal] : null;
}

const mealSelect = z.enum([
  "Frokost",
  "Lunsj",
  "Middag",
  "Snack",
] as const satisfies MealNorwegian[]);

export const calendarDateSchema = z
  .object({
    id: z.string(),
    properties: z.object({
      Date: z.object({ date: z.object({ start: z.string().date() }) }),
      Meal: z.object({
        type: z.literal("rollup"),
        rollup: z.object({
          array: z.array(
            z.object({
              type: z.literal("select"),
              select: z.object({
                name: mealSelect,
              }),
            })
          ),
        }),
      }),
      Recipe: z.object({
        type: z.literal("relation"),
        relation: z.array(z.object({ id: z.string() })),
      }),
      Servings: z.object({ number: z.number().nullable() }).optional(),
    }),
  })
  .transform((date) => ({
    id: date.id,
    date: date.properties.Date.date.start,
    meal: toMeal(date.properties.Meal.rollup.array.at(0)?.select.name),
    recipeId: date.properties.Recipe.relation.at(0)?.id,
    servings: date.properties.Servings?.number ?? 1,
  }));

export const recipeSchema = z
  .object({
    id: z.string(),
    properties: z.object({
      Type: z.object({ select: z.object({ name: mealSelect }).nullish() }),
      Name: z.object({
        title: z.array(z.object({ plain_text: z.string() })),
      }),
    }),
  })
  .transform((recipe) => ({
    id: recipe.id,
    name: recipe.properties.Name.title[0].plain_text,
    type: toMeal(recipe.properties.Type.select?.name),
  }));

export const ingredientSchema = z
  .object({
    id: z.string(),
    properties: z.object({
      Name: z.object({
        title: z.array(z.object({ plain_text: z.string() })),
      }),
    }),
  })
  .transform((ingredient) => ({
    id: ingredient.id,
    name: ingredient.properties.Name.title[0].plain_text,
  }));

export const mealIngredientRelationsSchema = z
  .object({
    id: z.string(),
    properties: z.object({
      ID: z.object({
        id: z.string(),
        type: z.literal("unique_id"),
      }),
      Quantity: z.object({
        id: z.string(),
        number: z.number().nullable(),
      }),
      Unit: z.object({
        id: z.string(),
        select: z.object({ name: z.string(), color: z.string() }).nullable(),
      }),
      Recipe: z.object({
        id: z.string(),
        type: z.literal("relation"),
        relation: z.array(z.object({ id: z.string() })),
      }),
      Ingredient: z.object({
        id: z.string(),
        type: z.literal("relation"),
        relation: z.array(z.object({ id: z.string() })),
      }),
    }),
  })
  .transform((relation) => ({
    id: relation.id,
    quantity: relation.properties.Quantity.number,
    unitOfMeasure: relation.properties.Unit.select?.name ?? null,
    recipeId: relation.properties.Recipe.relation.at(0)?.id,
    ingredientId: relation.properties.Ingredient.relation.at(0)?.id,
  }));
