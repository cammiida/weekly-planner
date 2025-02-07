import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRouteLoaderData } from "@remix-run/react";
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

  return { result };
}

export default function Home() {
  const { result } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Home</h1>

      <div>
        {result.map((date) => (
          <div key={date.date}>
            <h2>{date.date}</h2>
            <ul>
              {Object.entries(date.meals).map(([mealName, meal]) => {
                if (!meal) {
                  return null;
                }

                return (
                  <li key={meal.id}>
                    <h3>{meal.name}</h3>
                    <ul>
                      {meal.ingredients.map((ingredient) => (
                        <li key={ingredient.id}>
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
