import { Client, isFullPage } from "@notionhq/client";
import {
  ingredientSchema,
  mealIngredientRelationsSchema,
  mealSchema,
} from "./schema";
import { z } from "zod";
import { catchError, groupByMeal, mergeMealsAndIngredients } from "./utils";

export type Relation = z.infer<typeof mealIngredientRelationsSchema>;
export type Meal = z.infer<typeof mealSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type MealIngredientQuantity = {
  mealName: string;
  mealType: string;
  ingredient: string;
  quantity: number | null;
  unitOfMeasure: string | null;
};

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export async function getMealsDatabase() {
  const [error, res] = await catchError(
    notion.databases.query({
      database_id:
        process.env.NOTION_MEALS_INGREDIENTS_JUNCTION_DATABASE_ID ?? "",
    })
  );

  if (error) {
    throw error;
  }

  const mealIngredientRelations = mealIngredientRelationsSchema
    .array()
    .parse(
      res.results
        .filter((result) => isFullPage(result))
        .map((page) => page.properties)
    );

  const mealIds = new Set<string>(
    mealIngredientRelations
      .map((relation) => relation.mealId)
      .filter((id) => id != null)
  );

  const ingredientIds = new Set<string>(
    mealIngredientRelations
      .map((relation) => relation.ingredientId)
      .filter((id) => id != null)
  );

  const [meals, ingredients] = await Promise.all([
    getMeals(Array.from(mealIds)),
    getIngredients(Array.from(ingredientIds)),
  ]);

  const mealIngredientsWithQuantity: MealIngredientQuantity[] =
    mergeMealsAndIngredients({
      relations: mealIngredientRelations,
      meals,
      ingredients,
    });

  return groupByMeal(mealIngredientsWithQuantity);
}

async function getMeals(mealIds: string[]): Promise<Meal[]> {
  try {
    const res = await Promise.all(
      mealIds.map((mealId) =>
        notion.pages.retrieve({
          page_id: mealId,
        })
      )
    );

    return mealSchema.array().parse(res);
  } catch (error) {
    console.log(error);
    return [];
  }
}

async function getIngredients(ingredientIds: string[]): Promise<Ingredient[]> {
  try {
    const res = await Promise.all(
      ingredientIds.map((ingredientId) =>
        notion.pages.retrieve({
          page_id: ingredientId,
        })
      )
    );

    return ingredientSchema.array().parse(res);
  } catch (error) {
    console.log(error);
    return [];
  }
}
