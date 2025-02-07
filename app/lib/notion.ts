import { Client, isFullPage } from "@notionhq/client";
import { z } from "zod";
import {
  calendarDateSchema,
  ingredientSchema,
  mealIngredientRelationsSchema,
  mealSchema,
} from "./schema";
import { format } from "date-fns";
import { catchError } from "./utils";
import { nb } from "date-fns/locale";
import { QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";

export type CalendarDate = z.infer<typeof calendarDateSchema>;
export type Relation = z.infer<typeof mealIngredientRelationsSchema>;
export type Meal = z.infer<typeof mealSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type MealIngredientQuantity = {
  mealId: string | undefined;
  mealName: string;
  mealType: string;
  ingredient: string;
  quantity: number | null;
  unitOfMeasure: string | null;
};

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

function formattedDate(date: Date) {
  return format(date, "yyyy-MM-dd", { locale: nb });
}

type CalendarFilter = {
  startDate?: Date;
  endDate?: Date;
};

export async function getCalendarTableData({
  startDate,
  endDate,
}: CalendarFilter) {
  const dateFilter: QueryDatabaseParameters["filter"] = {
    and: [],
  };

  if (startDate) {
    dateFilter.and.push({
      property: "Date",
      date: {
        on_or_after: formattedDate(startDate),
      },
    });
  }
  if (endDate) {
    dateFilter.and.push({
      property: "Date",
      date: {
        on_or_before: formattedDate(endDate),
      },
    });
  }

  const [error, res] = await catchError(
    notion.databases.query({
      database_id: process.env.NOTION_CALENDAR_DATABASE_ID ?? "",
      filter: dateFilter,
      sorts: [{ property: "Date", direction: "ascending" }],
    })
  );

  if (error) {
    throw error;
  }

  return calendarDateSchema
    .array()
    .parse(
      res.results
        .filter((result) => isFullPage(result))
        .map((page) => page.properties)
    );
}

export async function getMealsTableData() {
  const [error, res] = await catchError(
    notion.databases.query({
      database_id: process.env.NOTION_MEALS_DATABASE_ID ?? "",
    })
  );

  if (error) {
    throw error;
  }

  return mealSchema.array().parse(res.results);
}

export async function getIngredientsTableData() {
  const [error, res] = await catchError(
    notion.databases.query({
      database_id: process.env.NOTION_INGREDIENTS_DATABASE_ID ?? "",
    })
  );

  if (error) {
    throw error;
  }

  return ingredientSchema.array().parse(res.results);
}

export async function getCalendarMeals(calendarDates: CalendarDate[]) {
  const breakfastIds = new Set(
    calendarDates.map((date) => date.breakfastId).filter(Boolean)
  );
  const lunchIds = new Set(
    calendarDates.map((date) => date.lunchId).filter(Boolean)
  );
  const snackIds = new Set(
    calendarDates.map((date) => date.snackId).filter(Boolean)
  );
  const dinnerIds = new Set(
    calendarDates.map((date) => date.dinnerId).filter(Boolean)
  );

  const mealIds = [
    ...breakfastIds,
    ...lunchIds,
    ...snackIds,
    ...dinnerIds,
  ].filter((it) => it != null);

  return getMeals(mealIds);
}

export async function getMealIngredientJunctionTable() {
  const [error, res] = await catchError(
    notion.databases.query({
      database_id:
        process.env.NOTION_MEALS_INGREDIENTS_JUNCTION_DATABASE_ID ?? "",
    })
  );

  if (error) {
    throw error;
  }

  return mealIngredientRelationsSchema.array().parse(res.results);
}

export async function getMeals(mealIds: string[]): Promise<Meal[]> {
  try {
    const res = await Promise.all(
      mealIds.map((mealId) =>
        notion.pages.retrieve({
          page_id: mealId,
        })
      )
    );

    return mealSchema.array().parse(res);
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getIngredients(
  ingredientIds: string[]
): Promise<Ingredient[]> {
  try {
    const res = await Promise.all(
      ingredientIds.map((ingredientId) =>
        notion.pages.retrieve({
          page_id: ingredientId,
        })
      )
    );

    return ingredientSchema.array().parse(res);
  } catch (error) {
    console.log(error);
    return [];
  }
}
