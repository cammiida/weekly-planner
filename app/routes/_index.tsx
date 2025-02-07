import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parse } from "date-fns";
import {
  getCalendarTableData,
  getIngredientsTableData,
  getMealIngredientJunctionTable,
  getMealsTableData,
} from "~/lib/notion";
import { mergeData } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const queryParams = new URL(request.url).searchParams;
  const startDate = queryParams.get("start");
  const endDate = queryParams.get("end");

  const [dates, meals, ingredients, mealIngredientRelations] =
    await Promise.all([
      getCalendarTableData({
        startDate: startDate
          ? parse(startDate, "yyyy-MM-dd", new Date())
          : undefined,
        endDate: endDate ? parse(endDate, "yyyy-MM-dd", new Date()) : undefined,
      }),
      getMealsTableData(),
      getIngredientsTableData(),
      getMealIngredientJunctionTable(),
    ]);

  const result = mergeData({
    dates,
    meals,
    ingredients,
    mealIngredientRelations,
  });

  return result;
}

function getShoppingList(result: Awaited<ReturnType<typeof loader>>) {
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

export default function Home() {
  const result = useLoaderData<typeof loader>();

  const shoppingList = getShoppingList(result);

  return (
    <div>
      <h1>Home</h1>

      <h2>Shopping List</h2>
      <div>
        {Object.entries(shoppingList).map(
          ([ingredient, { amount, unitOfMeasure }]) => (
            <div key={ingredient}>
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

      <div>
        {result.map((date) => (
          <div key={date.id}>
            <h2>{date.date}</h2>
            <ul>
              {Object.values(date.meals)
                .filter((it) => it != null)
                .map((meal) => {
                  return (
                    <li key={`${date.id}-${meal.id}`}>
                      <h3>{meal.name}</h3>
                      <ul>
                        {meal.ingredients.map((ingredient) => (
                          <li
                            key={`${date.date}-${meal.name}-${ingredient.ingredient}`}
                          >
                            {ingredient.quantity} {ingredient.unitOfMeasure}{" "}
                            {ingredient.ingredient}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
