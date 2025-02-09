import {
  CalendarDate,
  Ingredient,
  Recipe,
  RecipeIngredientQuantity as RecipeIngredient,
  Relation,
} from "./notion";
import { Meal } from "./schema";

export function mergeData({
  dates,
  meals,
  ingredients,
  mealIngredientRelations,
}: {
  dates: CalendarDate[];
  meals: Recipe[];
  ingredients: Ingredient[];
  mealIngredientRelations: Relation[];
}) {
  const calendarMeals = mergeDatesAndMeals(dates, meals);
  const mealIngredients = mergeMealsAndIngredients({
    relations: mealIngredientRelations,
    recipes: meals,
    ingredients,
  });

  return mergeDateWithMealsAndIngredients(calendarMeals, mealIngredients);
}

function mergeMealsAndIngredients({
  relations,
  recipes,
  ingredients,
}: {
  relations: Relation[];
  recipes: Recipe[];
  ingredients: Ingredient[];
}): RecipeIngredient[] {
  return relations.map((relation) => {
    const recipe = recipes.find((it) => it.id === relation.recipeId);
    const ingredient = ingredients.find(
      (it) => it.id === relation.ingredientId
    );

    return {
      recipeId: relation.recipeId ?? null,
      name: recipe?.name ?? null,
      meal: recipe?.type ?? null,
      ingredientId: relation.ingredientId ?? null,
      ingredient: ingredient?.name ?? null,
      quantity: relation.quantity,
      unitOfMeasure: relation.unitOfMeasure,
    } satisfies RecipeIngredient;
  });
}

function findRecipeById(
  id: string | undefined,
  recipes: Recipe[]
): Recipe | null {
  if (!id) return null;

  return recipes.find((it) => it.id && it.id === id) ?? null;
}

type DateWithMealsAndRecipes = {
  id: string;
  date: string;
  meals: Record<Meal, Recipe | null>;
};

function mergeDatesAndMeals(
  calendarDates: CalendarDate[],
  meals: Recipe[]
): DateWithMealsAndRecipes[] {
  const datesWithRecipes = calendarDates.map((date) => ({
    id: date.id,
    date: date.date,
    recipe: findRecipeById(date.recipeId, meals),
    meal: date.meal,
  }));

  const dates: Record<string, DateWithMealsAndRecipes> = {};

  for (const date of datesWithRecipes) {
    if (!dates[date.date]) {
      dates[date.date] = {
        id: date.id,
        date: date.date,
        meals: {
          breakfast: null,
          lunch: null,
          snack: null,
          dinner: null,
        },
      };
    }

    if (date.meal) {
      dates[date.date].meals[date.meal] = date.recipe;
    }
  }

  return Object.values(dates);
}

function getRecipeIngredients(
  meal: Recipe | null,
  ingredients: RecipeIngredient[]
) {
  if (!meal) return null;

  return {
    ...meal,
    ingredients: ingredients
      .filter((it) => it.recipeId === meal.id)
      .map((it) => ({
        id: it.ingredientId,
        ingredient: it.ingredient,
        quantity: it.quantity,
        unitOfMeasure: it.unitOfMeasure,
      })),
  };
}

export type DateWithMealsRecipesAndIngredients = {
  id: string;
  date: string;
  meals: Record<Meal, ReturnType<typeof getRecipeIngredients> | null>;
};

function mergeDateWithMealsAndIngredients(
  dateWithMeals: DateWithMealsAndRecipes[],
  mealIngredients: RecipeIngredient[]
) {
  return dateWithMeals.map(
    (dateWithMeal) =>
      ({
        id: dateWithMeal.id,
        date: dateWithMeal.date,
        meals: {
          breakfast: getRecipeIngredients(
            dateWithMeal.meals.breakfast,
            mealIngredients
          ),
          lunch: getRecipeIngredients(
            dateWithMeal.meals.lunch,
            mealIngredients
          ),
          snack: getRecipeIngredients(
            dateWithMeal.meals.snack,
            mealIngredients
          ),
          dinner: getRecipeIngredients(
            dateWithMeal.meals.dinner,
            mealIngredients
          ),
        },
      } satisfies DateWithMealsRecipesAndIngredients)
  );
}

export async function catchError<T>(
  promise: Promise<T>
): Promise<[Error] | [undefined, T]> {
  return promise
    .then((data) => [undefined, data] as [undefined, T])
    .catch((error) => [error] as [Error]);
}
