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
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Home</h1>

      <div className="shadow-md p-4 bg-white rounded-md">
        <h2 className="text-lg font-semibold">Shopping List</h2>
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
      </div>

      <div>
        <h2 className="text-lg font-semibold">Calendar</h2>
        <div className="flex flex-col gap-4">
          {result.map((date) => (
            <div key={date.id} className="shadow-md p-4 bg-white rounded-md">
              <h4 className="text-md font-semibold bg-green-100 w-fit p-1 rounded-md">
                {date.date}
              </h4>
              <ul>
                {Object.entries(date.meals).map(([key, meal]) => {
                  return (
                    <li key={`${date.id}-${meal?.id}`} className="list-none">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between  gap-2">
                          <h5 className="text-md font-semibold">
                            {pascalCase(key)}: {meal?.name}
                          </h5>
                          <div className="min-w-fit">
                            <label htmlFor="servings">Servings: </label>
                            <input
                              name="servings"
                              type="number"
                              className="border-2 w-10 text-center"
                              defaultValue={1}
                            />
                          </div>
                        </div>
                        {meal && (
                          <ul>
                            {meal.ingredients.map((ingredient) => (
                              <li
                                key={`${date.date}-${meal.name}-${ingredient.ingredient}`}
                              >
                                {ingredient.quantity}
                                {ingredient.unitOfMeasure}{" "}
                                {ingredient.ingredient}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function pascalCase(text: string) {
  return text
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
}
