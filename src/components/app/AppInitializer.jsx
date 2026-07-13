/* eslint-disable react-refresh/only-export-components */

import { useEffect, useState } from "react";
import { Center, Loader } from "@mantine/core";

import { authStore } from "../../stores/authStore";

function AppInitializer({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      await authStore.restoreSession();

      if (isMounted) {
        setIsReady(true);
      }
    }

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Only show the full-screen loader during
   * the first session restoration.
   *
   * Login/signup loading must not unmount
   * the router or authentication modal.
   */
  if (!isReady) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return children;
}

export default AppInitializer;
