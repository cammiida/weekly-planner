import { Client, isFullPage } from "@notionhq/client";
import { z } from "zod";
import {
  calendarDateSchema,
  ingredientSchema,
  Meal,
  mealIngredientRelationsSchema,
  mealSchema as recipeSchema,
} from "./schema";
import { format } from "date-fns";
import { catchError } from "./utils";
import { nb } from "date-fns/locale";
import { QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";

export type CalendarDate = z.infer<typeof calendarDateSchema>;
export type Relation = z.infer<typeof mealIngredientRelationsSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type RecipeIngredientQuantity = {
  recipeId: string | null;
  name: string | null;
  meal: Meal | null;
  ingredientId: string | null;
  ingredient: string | null;
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
      database_id: process.env.NOTION_DATE_MEALS_VIEW_ID ?? "",
      filter: dateFilter,
      sorts: [{ property: "Date", direction: "ascending" }],
    })
  );

  if (error) {
    throw error;
  }

  return calendarDateSchema
    .array()
    .parse(res.results.filter((result) => isFullPage(result)));
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

  return recipeSchema.array().parse(res.results);
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

export async function getCalendarRecipes(calendarDates: CalendarDate[]) {
  const recipeIds = calendarDates
    .map((date) => date.recipeId)
    .filter((it) => it != null);

  return getMeals(recipeIds);
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

export async function getMeals(mealIds: string[]): Promise<Recipe[]> {
  try {
    const res = await Promise.all(
      mealIds.map((mealId) =>
        notion.pages.retrieve({
          page_id: mealId,
        })
      )
    );

    return recipeSchema.array().parse(res);
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
