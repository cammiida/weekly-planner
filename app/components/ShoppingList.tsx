import React from "react";
import { loader as indexLoader } from "~/routes/_index";

type ShoppingListProps = {
  calendarData: Awaited<ReturnType<typeof indexLoader>>;
};

export const ShoppingList: React.FC<ShoppingListProps> = ({ calendarData }) => {
  const shoppingList = getShoppingList(calendarData);

  return (
    <div className="shadow-md p-4 bg-white rounded-md">
      <h2 className="text-lg font-semibold">Shopping List</h2>
      <div>
        {Object.entries(shoppingList).map(
          ([ingredient, { amount, unitOfMeasure }]) => (
            <div key={ingredient} className="flex gap-2">
              <input
                id={ingredient}
                type="checkbox"
                key={ingredient}
                value={`${ingredient} ${amount}${unitOfMeasure}`}
              />
              <label htmlFor={ingredient}>
                {ingredient} {amount} {unitOfMeasure}
              </label>
            </div>
          )
        )}
      </div>
    </div>
  );
};

function getShoppingList(result: Awaited<ReturnType<typeof indexLoader>>) {
  const ingredientsWithQuantity: Record<
    string,
    { amount: number; unitOfMeasure: string | null }
  > = {};

  result.forEach((date) => {
    return Object.values(date.meals).forEach((meal) => {
      if (!meal) {
        return [];
      }

      for (const ingredient of meal.ingredients) {
        const key = ingredient.ingredient;
        if (!key) {
          continue;
        }

        if (ingredientsWithQuantity[key]) {
          ingredientsWithQuantity[key].amount += ingredient.quantity ?? 0;
          ingredientsWithQuantity[key].unitOfMeasure =
            ingredient.unitOfMeasure ??
            ingredientsWithQuantity[key].unitOfMeasure;
        } else {
          ingredientsWithQuantity[key] = {
            amount: ingredient.quantity ?? 0,
            unitOfMeasure: ingredient.unitOfMeasure ?? null,
          };
        }
      }
    });
  });

  return ingredientsWithQuantity;
}
