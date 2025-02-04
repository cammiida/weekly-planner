import { Links, Meta, Outlet, Scripts, useLoaderData } from "@remix-run/react";
import {
  getCalendarData,
  getCalendarMeals,
  getIngredients,
  getMealIngredientJunctionTable,
  getMeals,
  MealIngredientQuantity,
} from "./lib/notion";
import {
  mergeDatesAndMeals,
  mergeDateWithMealsAndIngredients,
  mergeMealsAndIngredients,
} from "./lib/utils";

export async function loader() {
  const calendarData = await getCalendarData();
  const calendarMeals = await getCalendarMeals(calendarData);
  const datesWithMeals = mergeDatesAndMeals(calendarData, calendarMeals);

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

  const result = mergeDateWithMealsAndIngredients(
    datesWithMeals,
    mealIngredientsWithQuantity
  );

  return Response.json({ result });
}

export default function App() {
  const result = useLoaderData<typeof loader>();

  return (
    <html>
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <Meta />
        <Links />
      </head>
      <body>
        <pre>
          <code>{JSON.stringify(result, null, 2)}</code>
        </pre>
        <pre></pre>
        <br />
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
