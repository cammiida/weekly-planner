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
  recipes,
  ingredients,
  mealIngredientRelations,
}: {
  dates: CalendarDate[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  mealIngredientRelations: Relation[];
}) {
  const recipesWithIngredients = mergeRecipeAndIngredients({
    relations: mealIngredientRelations,
    recipes,
    ingredients,
  });

  const calendarMeals = mergeDatesAndMeals(dates, recipes);

  return mergeDateWithMealsAndIngredients(
    calendarMeals,
    recipesWithIngredients
  );
}

function mergeRecipeAndIngredients({
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
  meals: Record<Meal, (Recipe & { servings: number }) | null>;
};

function mergeDatesAndMeals(
  calendarDates: CalendarDate[],
  meals: Recipe[]
): DateWithMealsAndRecipes[] {
  const datesWithRecipes = calendarDates.map((date) => ({
    id: date.id,
    date: date.date,
    recipe: findRecipeById(date.recipeId, meals),
    servings: date.servings,
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
      dates[date.date].meals[date.meal] = date.recipe
        ? { ...date.recipe, servings: date.servings }
        : null;
    }
  }

  return Object.values(dates);
}

function getRecipeIngredients(
  recipeId: string | undefined,
  ingredients: RecipeIngredient[]
) {
  return recipeId
    ? ingredients
        .filter((it) => it.recipeId === recipeId)
        .map((it) => ({
          id: it.ingredientId,
          ingredient: it.ingredient,
          quantity: it.quantity,
          unitOfMeasure: it.unitOfMeasure,
        }))
    : [];
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
  return dateWithMeals.map((dateWithMeal) => ({
    id: dateWithMeal.id,
    date: dateWithMeal.date,
    meals: {
      breakfast: {
        ...dateWithMeal.meals.breakfast,
        ingredients: getRecipeIngredients(
          dateWithMeal.meals.breakfast?.id,
          mealIngredients
        ),
      },
      lunch: {
        ...dateWithMeal.meals.lunch,
        ingredients: getRecipeIngredients(
          dateWithMeal.meals.lunch?.id,
          mealIngredients
        ),
      },
      snack: {
        ...dateWithMeal.meals.snack,
        ingredients: getRecipeIngredients(
          dateWithMeal.meals.snack?.id,
          mealIngredients
        ),
      },
      dinner: {
        ...dateWithMeal.meals.dinner,
        ingredients: getRecipeIngredients(
          dateWithMeal.meals.dinner?.id,
          mealIngredients
        ),
      },
    },
  }));
}

export async function catchError<T>(
  promise: Promise<T>
): Promise<[Error] | [undefined, T]> {
  return promise
    .then((data) => [undefined, data] as [undefined, T])
    .catch((error) => [error] as [Error]);
}
