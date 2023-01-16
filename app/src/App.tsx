import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import GameRoom from "./GameRoom";
import { GameFeed } from "./GameFeed";
import { Lobby } from "./Lobby";
import Root from "./Root";

// Font awesome icons
library.add(far);

/**
 * #d9832b  #de7e29
 * #433f4f #544b5b
 * #d6d1b7 #c5ccc3
 * #f6d06a #f9d45c
 * #833225 #873e36
 */

const App = () => {
  const browserRouter = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
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
