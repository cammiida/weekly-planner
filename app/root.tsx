import { LinksFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts } from "@remix-run/react";

import tailwindStyles from "~/tailwind.css?url";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStyles }];
};

export default function App() {
  return (
    <html lang="nb">
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
