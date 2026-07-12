import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "../stores/authStore";

//יגיעו מה-Auth MobX store.

function AdminRoute({ children }) {
  if (!authStore.isLoggedIn || !authStore.isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }
  return children;
}

export default observer(AdminRoute);