import { LoaderFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, useLoaderData } from "@remix-run/react";
import { parse } from "date-fns";
import {
  getCalendarTableData,
  getIngredientsTableData,
  getMealIngredientJunctionTable,
  getMealsTableData,
} from "./lib/notion";
import { mergeData } from "./lib/utils";

export const loader: LoaderFunction = async ({ request }) => {
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

  return Response.json({ result });
};

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
