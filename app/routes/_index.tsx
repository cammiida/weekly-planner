import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parse } from "date-fns";
import { CalendarDateComponent } from "~/components/CalendarDate";
import { ShoppingList } from "~/components/ShoppingList";
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

  const [dates, recipes, ingredients, mealIngredientRelations] =
    await Promise.all([
      getCalendarTableData({
        startDate: startDate,
        endDate: endDate,
      }),
      getMealsTableData(),
      getIngredientsTableData(),
      getMealIngredientJunctionTable(),
    ]);

  const result = mergeData({
    dates,
    recipes,
    ingredients,
    mealIngredientRelations,
  });

  return result;
}

export default function Home() {
  const result = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Home</h1>

      <ShoppingList calendarData={result} />
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
