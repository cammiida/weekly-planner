import { Ingredient, Meal, MealIngredientQuantity, Relation } from "./notion";

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
}): MealIngredientQuantity[] {
  return relations.map((relation) => {
    const meal = meals.find((it) => it.id === relation.mealId);
    const ingredient = ingredients.find(
      (it) => it.id === relation.ingredientId
    );

    return {
      mealName: meal?.name ?? "",
      mealType: meal?.type ?? "",
      ingredient: ingredient?.name ?? "",
      quantity: relation.quantity,
      unitOfMeasure: relation.unitOfMeasure,
    };
  });
}

export function groupByMeal(mealIngredients: MealIngredientQuantity[]) {
  const groupedByMeal: Record<string, MealIngredientQuantity[]> = {};
  for (const mealIngredient of mealIngredients) {
    if (!mealIngredient.mealName) {
      continue;
    }

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
}
