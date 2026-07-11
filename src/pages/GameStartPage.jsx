
import { useNavigate } from "react-router-dom";

function GameStartPage() {
  const navigate = useNavigate();

  const isLoggedIn = true;

  return (
    <main>
      <h1>Ready to play?</h1>

      <button onClick={() => navigate("/game/play")}>
        Start Game
      </button>

      {isLoggedIn && (
        <button onClick={() => navigate("/progress")}>
          My Progress
        </button>
      )}
    </main>
  );
}

export default GameStartPage;