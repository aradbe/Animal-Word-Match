import { Navigate } from "react-router-dom";

//כרגע נעשה mock זמני. בהמשך זה יתחבר ל-authStore.
function ProtectedRoute({ children }) {

    const isLoggedIn = false;

  if (!isLoggedIn) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

export default ProtectedRoute;