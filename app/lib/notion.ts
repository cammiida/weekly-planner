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

export async function getMealIngredientJunctionTable() {
  const [error, res] = await catchError(
    notion.databases.query({
      database_id:
        process.env.NOTION_MEALS_INGREDIENTS_JUNCTION_DATABASE_ID ?? "",
    })
  );

  if (error) {
    throw error;
  }

  return mealIngredientRelationsSchema
    .array()
    .parse(
      res.results
        .filter((result) => isFullPage(result))
        .map((page) => page.properties)
    );
}

export async function getMeals(mealIds: string[]): Promise<Meal[]> {
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

export async function getIngredients(
  ingredientIds: string[]
): Promise<Ingredient[]> {
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
