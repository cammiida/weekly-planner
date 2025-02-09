import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parse } from "date-fns";
import { CalendarDateComponent } from "~/components/CalendarDate";
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

      <div>
        <h2 className="text-lg font-semibold">Calendar</h2>
        <div className="flex flex-col gap-4">
          {result.map((date) => (
            <CalendarDateComponent key={date.id} date={date} />
          ))}
        </div>
      </div>
    </div>
  );
}
