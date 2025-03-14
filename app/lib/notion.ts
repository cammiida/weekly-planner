import { Client, isFullPage } from "@notionhq/client";
import { QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";
import { format } from "date-fns";
import { z } from "zod";
import {
  calendarDateSchema,
  ingredientSchema,
  Meal,
  mealIngredientRelationsSchema,
  mealSchema as recipeSchema,
} from "./schema";
import { catchError } from "./utils";
import { nb } from "date-fns/locale";

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

function formatNotionDate(date: Date) {
  return format(date, "yyyy-MM-dd", { locale: nb });
}

type Filter = {
  from: Date | null;
  to: Date | null;
};

export async function getCalendarTableData({ from, to }: Filter) {
  const dateFilter: QueryDatabaseParameters["filter"] = {
    and: [],
  };

  if (from) {
    dateFilter.and.push({
      property: "Date",
      date: {
        on_or_after: formatNotionDate(from),
      },
    });
  }
  if (to) {
    dateFilter.and.push({
      property: "Date",
      date: {
        on_or_before: formatNotionDate(to),
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
