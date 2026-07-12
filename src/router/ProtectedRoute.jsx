import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "../stores/authStore";

function ProtectedRoute({ children }) {

 if (!authStore.isLoggedIn) {
    return <Navigate to="/access-denied" replace />;
  }
  return children;
}

export default ProtectedRoute;