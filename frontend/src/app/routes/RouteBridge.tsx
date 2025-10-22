import { matchPath, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { appDefinitions, appRegistry } from "./appRegistry";
import { useWindowActions } from "../wm/hooks";
import type { AppId } from "../wm/types";

const createWindowId = (appId: AppId, params: Record<string, string | undefined>) => {
  if (appId === "projectDetails" && params.id) {
    return `${appId}:${params.id}`;
  }
  return appId;
};

const RouteBridge = () => {
  const location = useLocation();
  const { createWindow } = useWindowActions();

  useEffect(() => {
    const pathname = location.pathname;
    const params = new URLSearchParams(location.search);

    for (const definition of appDefinitions) {
      const routes = definition.routes ?? [];
      for (const route of routes) {
        const match = matchPath(route, pathname);
        if (!match) continue;

        const windowId = createWindowId(definition.appId, match.params ?? {});
        const payload = definition.appId === "projectDetails" ? { projectId: match.params.id } : undefined;
        createWindow({
          appId: definition.appId,
          title: definition.title,
          icon: definition.icon,
          size: definition.defaultSize,
          payload,
          windowId,
          reuseExisting: true,
        });

        if (definition.appId === "projectDetails") {
          const projectsDefinition = appRegistry.get("projects" as AppId);
          if (projectsDefinition) {
            createWindow({
              appId: projectsDefinition.appId,
              title: projectsDefinition.title,
              icon: projectsDefinition.icon,
              size: projectsDefinition.defaultSize,
              windowId: projectsDefinition.appId,
              reuseExisting: true,
            });
          }
        }
      }
    }

    if (params.get("open") === "terminal") {
      const definition = appRegistry.get("terminal" as AppId);
      if (definition) {
        createWindow({
          appId: definition.appId,
          title: definition.title,
          icon: definition.icon,
          size: definition.defaultSize,
          windowId: definition.appId,
          reuseExisting: true,
        });
      }
    }
  }, [createWindow, location.pathname, location.search]);

  return null;
};

export default RouteBridge;

