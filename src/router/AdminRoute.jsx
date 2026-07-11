import { Navigate } from "react-router-dom";


//mock זמני
//בהמשך:
//isLoggedIn
//isAdmin
//יגיעו מה-Auth MobX store.

function AdminRoute({ children }) {
  const isLoggedIn = true;  //  אם שניהם f 
  const isAdmin = true;     //  יחסום את תנסה להיכנס לאדמין 

  if (!isLoggedIn || !isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

export default AdminRoute;