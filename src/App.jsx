//import { useState } from 'react'
import { MantineProvider } from "@mantine/core";
import AppRouter from "./router/AppRouter";
import "./App.css";


function App() {
  return (
    <MantineProvider>
      <AppRouter />
    </MantineProvider>
  );
}

export default App;


//להבדיקה של הניתוב לעשות

//http://localhost:פורט

//   /#/
//  /#/game
//  /#/game/play
//  /#/results
//  /#/progress

//  /#/admin
//  /#/access-denied

//  /#/sajdoiafjsodcvsd
