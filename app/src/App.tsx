import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import GameRoom from "./GameRoom";
import { ErrorPage } from "./ErrorPage";
import { Lobby } from "./Lobby";
import Root from "./Root";

// Font awesome icons
library.add(far);

const App = () => {
  const browserRouter = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "/join",
          element: <Lobby />,
        },
        {
          path: "/rooms/:roomId",
          element: <GameRoom />,
        },
      ],
    },
  ]);

  return <RouterProvider router={browserRouter} />;
};

export default App;
