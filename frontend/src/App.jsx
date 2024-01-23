import Navbar from "./components/navbar.component";
import { Routes, Route } from "react-router-dom";
import UserAuthForm from "./pages/userAuthForm.page";
import { createContext, useEffect, useState } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page.jsx";
import PageNotFound from "./pages/404.page.jsx";
import ProfilePage from "./pages/profile.page.jsx";
import BlogPage from "./pages/blog.page.jsx";
import SideNav from "./components/sidenavbar.component.jsx";
import ChangePassword from "./pages/change-password.page.jsx";
import EditProfile from "./pages/edit-profile.page.jsx";
import Notification from "./pages/notifications.page.jsx";
import ManageBlogs from "./pages/manage-blogs.page.jsx";

export const UserContext = createContext({});
export const ThemeContext = createContext({});

const darkThemePreference = () =>
  window.matchMedia("(prefers-color-scheme : dark)").matches;
const App = () => {
  const [userAuth, setUserAuth] = useState({ access_token: null });
  const [theme, setTheme] = useState(() =>
    darkThemePreference() ? "dark" : "light"
  );

  useEffect(() => {
    let userInSession = lookInSession("user");
    let themeInSession = lookInSession("theme");

    if (userInSession) {
      setUserAuth(JSON.parse(userInSession));
    } else {
      setUserAuth({ access_token: null });
    }
    if (themeInSession) {
      setTheme(() => {
        document.body.setAttribute("data-theme", themeInSession);
        return themeInSession;
      });
    } else {
      document.body.setAttribute("data-theme", theme);
    }
  }, []);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <UserContext.Provider value={{ userAuth, setUserAuth }}>
        <Routes>
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:blog_id" element={<Editor />} />
          <Route path="/" element={<Navbar />}>
            <Route index element={<HomePage />} />
            <Route path="settings" element={<SideNav />}>
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
            <Route path="dashboard" element={<SideNav />}>
              <Route path="notifications" element={<Notification />} />
              <Route path="blogs" element={<ManageBlogs />} />
            </Route>
            <Route path="signin" element={<UserAuthForm type="sign-in" />} />
            <Route path="signup" element={<UserAuthForm type="sign-up" />} />
            <Route path="search/:query" element={<SearchPage />} />
            <Route path="user/:id" element={<ProfilePage />} />
            <Route path="blog/:blog_id" element={<BlogPage />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
