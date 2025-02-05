import { Links, Meta, Outlet, Scripts, useLoaderData } from "@remix-run/react";
import {
  getCalendarTableData,
  getIngredientsTableData,
  getMealIngredientJunctionTable,
  getMealsTableData,
} from "./lib/notion";
import { mergeData } from "./lib/utils";

export async function loader() {
  const [dates, meals, ingredients, mealIngredientRelations] =
    await Promise.all([
      getCalendarTableData(),
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
