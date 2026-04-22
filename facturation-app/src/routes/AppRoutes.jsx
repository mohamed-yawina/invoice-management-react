import Register from "../pages/Register";
import Login from "../pages/Login";
import App from "../App";

export const routes = [
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/app", element: <App /> },
];

