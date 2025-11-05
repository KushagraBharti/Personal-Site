import React, { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Desktop from "./app/desktop/Desktop";
import RouteBridge from "./app/routes/RouteBridge";
import { useTheme } from "./app/providers/ThemeProvider";
import BootPage, { BOOT_SESSION_KEY } from "./features/boot/BootPage";

const DesktopShell: React.FC = () => {
  const { skipBoot } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipBoot) return;
    if (location.pathname.startsWith("/boot")) return;
    if (sessionStorage.getItem(BOOT_SESSION_KEY) === "1") return;
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    navigate(`/boot?next=${next}`, { replace: true });
  }, [location.pathname, location.search, navigate, skipBoot]);

  return (
    <>
      <RouteBridge />
      <Desktop />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/boot" element={<BootPage />} />
      <Route path="/*" element={<DesktopShell />} />
    </Routes>
  );
};

export default App;
