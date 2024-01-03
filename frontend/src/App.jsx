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

export const UserContext = createContext({});
const App = () => {
  const [userAuth, setUserAuth] = useState({ access_token: null });

  useEffect(() => {
    let userInSession = lookInSession("user");

    if (userInSession) {
      setUserAuth(JSON.parse(userInSession));
    } else {
      setUserAuth({ access_token: null });
    }
  }, []);
  return (
    <UserContext.Provider value={{ userAuth, setUserAuth }}>
      <Routes>
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/:blog_id" element={<Editor />} />
        <Route path="/" element={<Navbar />}>
          <Route index element={<HomePage />} />
          <Route path="settings" element={<SideNav />}>
            <Route path="edit-profile" element={<h1>edit</h1>} />
            <Route path="change-password" element={<h1>password</h1>} />
          </Route>
          <Route path="signin" element={<UserAuthForm type="sign-in" />} />
          <Route path="signup" element={<UserAuthForm type="sign-up" />} />
          <Route path="search/:query" element={<SearchPage />} />
          <Route path="user/:id" element={<ProfilePage />} />
          <Route path="blog/:blog_id" element={<BlogPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </UserContext.Provider>
  );
};

export default App;
