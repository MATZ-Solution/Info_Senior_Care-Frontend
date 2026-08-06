import { useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const { pathname } = useLocation();

  // React Router preserves scroll position across navigations, so moving from a
  // scrolled-down page to a new one would leave you parked at the footer.
  // Reset to the top on every route change (but not on ?query changes -- Chat
  // swaps ?session= and Search pages via ?page=, which handle scroll themselves).
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
