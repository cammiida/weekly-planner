import {
  CalendarDate,
  Ingredient,
  Meal,
  MealIngredientQuantity,
  Relation,
} from "./notion";

export async function catchError<T>(
  promise: Promise<T>
): Promise<[Error] | [undefined, T]> {
  return promise
    .then((data) => [undefined, data] as [undefined, T])
    .catch((error) => [error] as [Error]);
}

export function mergeData({
  dates,
  meals,
  ingredients,
  mealIngredientRelations,
}: {
  dates: CalendarDate[];
  meals: Meal[];
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
  meals: Meal[];
  ingredients: Ingredient[];
}): MealIngredientQuantity[] {
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

function findMealByMealId(
  mealId: string | undefined,
  meals: Meal[]
): Meal | null {
  if (!mealId) return null;

  return meals.find((it) => it.id && it.id === mealId) ?? null;
}
type MealName = "breakfast" | "lunch" | "snack" | "dinner";

type DateWithMeals = {
  id: string;
  date: string;
  meals: Record<MealName, Meal | null>;
};

function mergeDatesAndMeals(
  calendarDates: CalendarDate[],
  meals: Meal[]
): DateWithMeals[] {
  return calendarDates.map((date) => ({
    id: date.id,
    date: date.date,
    meals: {
      breakfast: findMealByMealId(date.breakfastId, meals),
      lunch: findMealByMealId(date.lunchId, meals),
      snack: findMealByMealId(date.snackId, meals),
      dinner: findMealByMealId(date.dinnerId, meals),
    },
  }));
}

function getMealIngredients(
  meal: Meal | null,
  ingredients: MealIngredientQuantity[]
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

function mergeDateWithMealsAndIngredients(
  dateWithMeals: DateWithMeals[],
  mealIngredients: MealIngredientQuantity[]
) {
  return dateWithMeals.map((dateWithMeal) => ({
    id: dateWithMeal.id,
    date: dateWithMeal.date,
    meals: {
      breakfast: getMealIngredients(
        dateWithMeal.meals.breakfast,
        mealIngredients
      ),
      lunch: getMealIngredients(dateWithMeal.meals.lunch, mealIngredients),
      snack: getMealIngredients(dateWithMeal.meals.snack, mealIngredients),
      dinner: getMealIngredients(dateWithMeal.meals.dinner, mealIngredients),
    },
  }));
}
