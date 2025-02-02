import { Client, isFullPage } from "@notionhq/client";
import {
  ingredientSchema,
  mealIngredientRelationsSchema,
  mealSchema,
} from "./schema";
import { z } from "zod";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

type MealIngredientQuantity = {
  mealName: string;
  mealType: string;
  ingredient: string;
  quantity: number | null;
  unitOfMeasure: string | null;
};

export async function getMealsDatabase() {
  try {
    const res = (
      await notion.databases.query({
        database_id:
          process.env.NOTION_MEALS_INGREDIENTS_JUNCTION_DATABASE_ID ?? "",
      })
    ).results
      .filter((result) => isFullPage(result))
      .map((page) => page.properties);

    const mealIngredientRelations = mealIngredientRelationsSchema.parse(res);

    const mealIds = new Set<string>(
      mealIngredientRelations
        .map((relation) => relation.Meal.relation.at(0)?.id)
        .filter((id) => id != null)
    );

    const ingredientIds = new Set<string>(
      mealIngredientRelations
        .map((relation) => relation.Ingredient.relation.at(0)?.id)
        .filter((id) => id != null)
    );

    const [meals, ingredients] = await Promise.all([
      getMeals(Array.from(mealIds)),
      getIngredients(Array.from(ingredientIds)),
    ]);

    const mealIngredientsWithQuantity: MealIngredientQuantity[] =
      mealIngredientRelations.map((relation) => {
        const meal = meals.find(
          (it) => it.id === relation.Meal.relation.at(0)?.id
        );
        const ingredient = ingredients.find(
          (it) => it.id === relation.Ingredient.relation.at(0)?.id
        );

        return {
          mealName: meal?.name ?? "",
          mealType: meal?.type ?? "",
          ingredient: ingredient?.name ?? "",
          quantity: relation.Quantity.number,
          unitOfMeasure: relation.Unit.select?.name ?? null,
        };
      });

    const groupedByMeal: Record<string, MealIngredientQuantity[]> = {};
    for (const mealIngredient of mealIngredientsWithQuantity) {
      if (Array.isArray(groupedByMeal[mealIngredient.mealName])) {
        groupedByMeal[mealIngredient.mealName] = [
          ...groupedByMeal[mealIngredient.mealName],
          mealIngredient,
        ];
      } else {
        groupedByMeal[mealIngredient.mealName] = [mealIngredient];
      }
    }

    return groupedByMeal;
  } catch (error) {
    console.log(error);
  }
}

type Meal = z.infer<typeof mealSchema>;
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

type Ingredient = z.infer<typeof ingredientSchema>;
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
