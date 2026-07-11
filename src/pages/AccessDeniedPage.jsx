

import { Link } from "react-router-dom";

function AccessDeniedPage() {
  return (
    <main>
      <h1>Access denied</h1>
      <p>You do not have permission to view this page.</p>

      <Link to="/">Back home</Link>
    </main>
  );
}

export default AccessDeniedPage;