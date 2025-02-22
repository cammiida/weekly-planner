import React from "react";
import { loader } from "~/routes/_index";

type CalendarDateProps = { date: Awaited<ReturnType<typeof loader>>[0] };

export const CalendarDateComponent: React.FC<CalendarDateProps> = ({
  date,
}) => {
  return (
    <div key={date.id} className="flex flex-col gap-2">
      <h4 className="text-md font-semibold bg-blue-100 border-blue-300 border-1 w-fit p-1 rounded-md">
        {date.date}
      </h4>
      <div key={date.id} className="shadow-md p-4 bg-white rounded-md">
        <ul className="flex flex-col gap-4">
          {Object.entries(date.meals).map(([meal, recipe]) => {
            return (
              <li key={`${date.id}-${meal}`} className="list-none">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between gap-2">
                    <h5 className="text-md font-semibold">
                      {pascalCase(meal)}: {recipe.name}
                    </h5>
                    <div className="min-w-fit">
                      <label htmlFor="servings">Servings: </label>
                      <input
                        name="servings"
                        type="number"
                        className="border-1 rounded-sm w-10 text-center"
                        defaultValue={recipe.servings}
                      />
                    </div>
                  </div>
                  <ul>
                    {recipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id}>
                        {ingredient.quantity}
                        {ingredient.unitOfMeasure} {ingredient.ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

function pascalCase(text: string) {
  return text
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
}
