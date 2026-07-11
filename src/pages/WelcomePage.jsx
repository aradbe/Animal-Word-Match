import { useNavigate } from "react-router-dom";

function WelcomePage() {
  const navigate = useNavigate();

  function handlePlayAsGuest() {
    navigate("/game");
  }

  function handleLoginClick() {
    console.log("Open login modal later");
  }

  return (
    <main>
      <h1>Animal Word Match</h1>
      <p>Learn animal words the fun way!</p>

      <button onClick={handlePlayAsGuest}>Play as guest</button>
      <button onClick={handleLoginClick}>Login</button>
    </main>
  );
}

export default WelcomePage;