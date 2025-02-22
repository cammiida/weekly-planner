import React from "react";
import { loader as indexLoader } from "~/routes/_index";
import "core-js/actual";

type ShoppingListProps = {
  calendarData: Awaited<ReturnType<typeof indexLoader>>;
};

type RequiredShoppingIngredient = {
  ingredient: string;
  quantity: number;
  unitOfMeasure: string;
};

export const ShoppingList: React.FC<ShoppingListProps> = ({ calendarData }) => {
  const shoppingList = getShoppingList(calendarData);

  return (
    <div className="shadow-md p-4 bg-white rounded-md">
      <h2 className="text-lg font-semibold">Shopping List</h2>
      <div>
        {shoppingList.map(({ ingredient, quantity, unitOfMeasure }) => (
          <div key={ingredient} className="flex gap-2">
            <input
              id={ingredient}
              type="checkbox"
              key={ingredient}
              value={`${ingredient} ${quantity}${unitOfMeasure}`}
            />
            <label htmlFor={ingredient}>
              {ingredient} {quantity} {unitOfMeasure}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

function isRequiredIngredient(i: unknown): i is RequiredShoppingIngredient {
  return (
    typeof i === "object" &&
    i != null &&
    "ingredient" in i &&
    i.ingredient !== null &&
    "quantity" in i &&
    i.quantity !== null &&
    "unitOfMeasure" in i &&
    i.unitOfMeasure !== null
  );
}

function getShoppingList(
  result: Awaited<ReturnType<typeof indexLoader>>
): RequiredShoppingIngredient[] {
  const meals = result.flatMap((date) => Object.values(date.meals));

  const ingredients = meals.flatMap((meal) =>
    meal?.ingredients
      .filter((it) => isRequiredIngredient(it))
      .map((i) => ({
        ...i,
        servings: meal.servings ?? 0,
      }))
  );

  const ingredientsWQuantity = Object.values(
    Object.groupBy(ingredients, (i) => i.ingredient ?? "")
  )
    .map((ingredientEntries) =>
      ingredientEntries?.reduce<RequiredShoppingIngredient>(
        (acc, curr) => ({
          ...acc,
          ingredient: curr.ingredient ?? acc.ingredient,
          unitOfMeasure: curr.unitOfMeasure ?? acc.unitOfMeasure,
          quantity: (acc.quantity ?? 0) + curr.quantity * curr.servings,
        }),
        {} as RequiredShoppingIngredient
      )
    )
    .filter((it) => it != null)
    .filter((it) => it.quantity > 0);

  return ingredientsWQuantity;
}
