import {
  CalendarDate,
  Ingredient,
  Meal as Recipe,
  MealIngredientQuantity as RecipeIngredient,
  Relation,
} from "./notion";

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
    meals,
    ingredients,
  });

  return mergeDateWithMealsAndIngredients(calendarMeals, mealIngredients);
}

function mergeMealsAndIngredients({
  relations,
  meals,
  ingredients,
}: {
  relations: Relation[];
  meals: Recipe[];
  ingredients: Ingredient[];
}): RecipeIngredient[] {
  return relations.map((relation) => {
    const meal = meals.find((it) => it.id === relation.mealId);
    const ingredient = ingredients.find(
      (it) => it.id === relation.ingredientId
    );

    return {
      mealId: relation.mealId ?? null,
      mealName: meal?.name ?? null,
      mealType: meal?.type ?? null,
      ingredientId: relation.ingredientId ?? null,
      ingredient: ingredient?.name ?? null,
      quantity: relation.quantity,
      unitOfMeasure: relation.unitOfMeasure,
    };
  });
}

function findRecipeById(
  id: string | undefined,
  recipes: Recipe[]
): Recipe | null {
  if (!id) return null;

  return recipes.find((it) => it.id && it.id === id) ?? null;
}
type Meal = "breakfast" | "lunch" | "snack" | "dinner";

type DateWithMealsAndRecipes = {
  id: string;
  date: string;
  meals: Record<Meal, Recipe | null>;
};

function mergeDatesAndMeals(
  calendarDates: CalendarDate[],
  meals: Recipe[]
): DateWithMealsAndRecipes[] {
  return calendarDates.map((date) => ({
    id: date.id,
    date: date.date,
    meals: {
      breakfast: findRecipeById(date.breakfastId, meals),
      lunch: findRecipeById(date.lunchId, meals),
      snack: findRecipeById(date.snackId, meals),
      dinner: findRecipeById(date.dinnerId, meals),
    },
  }));
}

function getRecipeIngredients(
  meal: Recipe | null,
  ingredients: RecipeIngredient[]
) {
  if (!meal) return null;

  return {
    ...meal,
    ingredients: ingredients
      .filter((it) => it.mealId === meal.id)
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
