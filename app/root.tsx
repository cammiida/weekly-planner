import { Links, Meta, Outlet, Scripts, useLoaderData } from "@remix-run/react";
import {
  getIngredients,
  getMealIngredientJunctionTable,
  getMeals,
  MealIngredientQuantity,
} from "./lib/notion";
import { groupByMeal, mergeMealsAndIngredients } from "./lib/utils";

export async function loader() {
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

  return Response.json({ groupedByMeal });
}

export default function App() {
  const res = useLoaderData<typeof loader>();

  return (
    <html>
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <Meta />
        <Links />
      </head>
      <body>
        <p>{JSON.stringify(res, null, 2)}</p>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
