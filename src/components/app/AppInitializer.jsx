/* eslint-disable react-refresh/only-export-components */
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Loader, Center } from "@mantine/core";
import { authStore } from "../../stores/authStore";

function AppInitializer({ children }) {
  useEffect(() => {
    authStore.restoreSession();
  }, []);

  if (authStore.isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return children;
}

export default observer(AppInitializer);