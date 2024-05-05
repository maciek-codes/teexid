import { library } from "@fortawesome/fontawesome-svg-core";
import { far } from "@fortawesome/free-regular-svg-icons";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import GameRoom from "./GameRoom";
import { ErrorPage } from "./ErrorPage";
import { Lobby } from "./Lobby";
import Root from "./Root";
import AboutPage from "./AboutPage";

// Font awesome icons
library.add(far);

const App = () => {
  const browserRouter = createBrowserRouter([
    {
      element: <Root />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "/",
          element: <Lobby />,
        },
        {
          path: "/room/:roomId",
          element: <GameRoom />,
        },
        {
          path: "/about",
          element: <AboutPage />,
        },
      ],
    },
  ]);

  return <RouterProvider router={browserRouter} />;
};

export default App;
