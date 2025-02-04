import { z } from "zod";

export const calendarDateSchema = z
  .object({
    Date: z.object({ date: z.object({ start: z.string().date() }) }),
    Breakfast: z.object({
      type: z.literal("relation"),
      relation: z.array(z.object({ id: z.string() })),
    }),
    Lunch: z.object({
      type: z.literal("relation"),
      relation: z.array(z.object({ id: z.string() })),
    }),
    Snack: z.object({
      type: z.literal("relation"),
      relation: z.array(z.object({ id: z.string() })),
    }),
    Dinner: z.object({
      type: z.literal("relation"),
      relation: z.array(z.object({ id: z.string() })),
    }),
  })
  .transform((date) => ({
    date: date.Date.date.start,
    breakfastId: date.Breakfast.relation.at(0)?.id,
    lunchId: date.Lunch.relation.at(0)?.id,
    snackId: date.Snack.relation.at(0)?.id,
    dinnerId: date.Dinner.relation.at(0)?.id,
  }));

export const mealSchema = z
  .object({
    id: z.string(),
    properties: z.object({
      Type: z.object({ select: z.object({ name: z.string() }).nullable() }),
      Name: z.object({
        title: z.array(z.object({ plain_text: z.string() })),
      }),
    }),
  })
  .transform((meal) => ({
    id: meal.id,
    name: meal.properties.Name.title[0].plain_text,
    type: meal.properties.Type.select?.name ?? null,
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
    Meal: z.object({
      id: z.string(),
      type: z.literal("relation"),
      relation: z.array(z.object({ id: z.string() })),
    }),
    Ingredient: z.object({
      id: z.string(),
      type: z.literal("relation"),
      relation: z.array(z.object({ id: z.string() })),
    }),
  })

  .transform((relation) => ({
    id: relation.Meal.relation.at(0)?.id,
    quantity: relation.Quantity.number,
    unitOfMeasure: relation.Unit.select?.name ?? null,
    mealId: relation.Meal.relation.at(0)?.id,
    ingredientId: relation.Ingredient.relation.at(0)?.id,
  }));
