import { Links, Meta, Outlet, Scripts, useLoaderData } from "@remix-run/react";
import { getMealsDatabase } from "./lib/notion";

export async function loader() {
  const res = await getMealsDatabase();

  return Response.json({ res });
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
