/* eslint-disable react-refresh/only-export-components */

import { Navigate } from "react-router-dom";

import { Center, Loader } from "@mantine/core";

import { observer } from "mobx-react-lite";

import { authStore } from "../stores/authStore";

function AdminRoute({ children }) {
  /*
   * Do not redirect until the initial Supabase session
   * and profile check has finished.
   */
  if (!authStore.isInitialized) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (!authStore.isLoggedIn || !authStore.isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

export default observer(AdminRoute);
