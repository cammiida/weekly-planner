import { Links, Meta, Outlet, Scripts, useLoaderData } from "@remix-run/react";
import {
  getCalendarData,
  getIngredients,
  getMealIngredientJunctionTable,
  getMeals,
  MealIngredientQuantity,
} from "./lib/notion";
import { groupByMeal, mergeMealsAndIngredients } from "./lib/utils";

export async function loader() {
  const calendarData = await getCalendarData();
  const mealIngredientRelations = await getMealIngredientJunctionTable();

  const mealIds = new Set<string>(
    mealIngredientRelations
      .map((relation) => relation.mealId)
      .filter((id) => id != null)
  );

  const ingredientIds = new Set<string>(
    mealIngredientRelations
      .map((relation) => relation.ingredientId)
      .filter((id) => id != null)
  );

  const [meals, ingredients] = await Promise.all([
    getMeals(Array.from(mealIds)),
    getIngredients(Array.from(ingredientIds)),
  ]);

  const mealIngredientsWithQuantity: MealIngredientQuantity[] =
    mergeMealsAndIngredients({
      relations: mealIngredientRelations,
      meals,
      ingredients,
    });

  const groupedByMeal = groupByMeal(mealIngredientsWithQuantity);

  return Response.json({ calendarData, groupedByMeal });
}

export default function App() {
  const { groupedByMeal, calendarData } = useLoaderData<typeof loader>();

  return (
    <html>
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <Meta />
        <Links />
      </head>
      <body>
        <pre>
          <code>calendarData: {JSON.stringify(calendarData, null, 2)}</code>
        </pre>
        <pre>
          <code>groupedByMeal: {JSON.stringify(groupedByMeal, null, 2)}</code>
        </pre>
        <br />
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
