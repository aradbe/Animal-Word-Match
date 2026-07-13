
/* eslint-disable react-refresh/only-export-components */

import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { authStore } from "../stores/authStore";

function GameStartPage() {
  const navigate = useNavigate();

  return (
    <main>
      <h1>Ready to play?</h1>

      <button onClick={() => navigate("/game/play")}>
        Start Game
      </button>

      {authStore.isLoggedIn && (
        <button onClick={() => navigate("/progress")}>
          My Progress
        </button>
      )}
    </main>
  );
}

export default observer(GameStartPage);
