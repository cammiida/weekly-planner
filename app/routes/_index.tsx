import { LoaderFunctionArgs } from "@remix-run/node";
import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { format } from "date-fns";
import { CalendarDateComponent } from "~/components/CalendarDate";
import { ShoppingList } from "~/components/ShoppingList";
import { Calendar } from "~/components/ui/calendar";
import {
  getCalendarTableData,
  getIngredientsTableData,
  getMealIngredientJunctionTable,
  getMealsTableData,
} from "~/lib/notion";
import { mergeData } from "~/lib/utils";

function parseDate(dateString: string | null) {
  if (!dateString) {
    return null;
  }
  const [day, month, year] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // Month is zero-based in JavaScript
}

function toDateString(date: Date) {
  return format(date, "dd-MM-yyyy");
}

function getDatesFromSearchParams(searchParams: URLSearchParams) {
  const fromString = searchParams.get("from");
  const toString = searchParams.get("to");

  const from = parseDate(fromString);
  const to = parseDate(toString);

  return { from, to };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const queryParams = new URL(request.url).searchParams;
  const { from, to } = getDatesFromSearchParams(queryParams);

  const [dates, recipes, ingredients, mealIngredientRelations] =
    await Promise.all([
      getCalendarTableData({ from, to }),
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { from, to } = getDatesFromSearchParams(searchParams);
  const isLoading = useNavigation().state !== "idle";

  function handleDateChange(queryParamKey: "from" | "to", date: Date) {
    setSearchParams((prev) => {
      prev.set(queryParamKey, toDateString(date));
      return prev;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Home</h1>

      <div className="flex gap-4 justify-between">
        <label className="flex flex-col gap-1">
          From
          <Calendar
            mode="single"
            selected={from ?? undefined}
            onSelect={(_, selectedDate) =>
              handleDateChange("from", selectedDate)
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          To
          <Calendar
            mode="single"
            selected={to ?? undefined}
            onSelect={(_, selectedDate) => handleDateChange("to", selectedDate)}
          />
        </label>
      </div>

      {isLoading && "Loading..."}
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
