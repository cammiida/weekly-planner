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

export function mergeMealsAndIngredients({
  relations,
  meals,
  ingredients,
}: {
  relations: Relation[];
  meals: Meal[];
  ingredients: Ingredient[];
}) {
  return relations.map((relation) => {
    const meal = meals.find((it) => it.id === relation.mealId);
    const ingredient = ingredients.find(
      (it) => it.id === relation.ingredientId
    );

    return {
      mealId: relation.mealId,
      mealName: meal?.name ?? "",
      mealType: meal?.type ?? "",
      ingredient: ingredient?.name ?? "",
      quantity: relation.quantity,
      unitOfMeasure: relation.unitOfMeasure,
    } satisfies MealIngredientQuantity;
  });
}

export type DateWithMeals = {
  date: string;
  breakfast: Meal | undefined;
  lunch: Meal | undefined;
  snack: Meal | undefined;
  dinner: Meal | undefined;
};
export function mergeDatesAndMeals(
  calendarDates: CalendarDate[],
  meals: Meal[]
): DateWithMeals[] {
  return calendarDates.map((date) => ({
    date: date.date,
    breakfast: meals.find((meal) => meal.id === date.breakfastId),
    lunch: meals.find((meal) => meal.id === date.lunchId),
    snack: meals.find((meal) => meal.id === date.snackId),
    dinner: meals.find((meal) => meal.id === date.dinnerId),
  }));
}

export function mergeDateWithMealsAndIngredients(
  dateWithMeals: DateWithMeals[],
  mealIngredients: MealIngredientQuantity[]
) {
  function findIngredientByMealId(mealId: string | undefined) {
    return mealIngredients.filter((it) => it.mealId === mealId);
  }

  return dateWithMeals.map((dateWithMeal) => {
    const meals = ["breakfast", "lunch", "snack", "dinner"] satisfies Extract<
      keyof DateWithMeals,
      "breakfast" | "lunch" | "snack" | "dinner"
    >[];

    const mealsWithIngredients: Record<
      string,
      {
        name: string;
        type: string;
        ingredients: MealIngredientQuantity[];
      }
    > = {};

    for (const meal of meals) {
      mealsWithIngredients[meal] = {
        name: dateWithMeal[meal]?.name ?? "",
        type: dateWithMeal[meal]?.type ?? "",
        ingredients: findIngredientByMealId(dateWithMeal[meal]?.id),
      };
    }

    return {
      ...dateWithMeal,
      ...mealsWithIngredients,
    };
  });
}
