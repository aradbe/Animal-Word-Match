//import { useState } from 'react'
import { MantineProvider } from "@mantine/core";
import AppRouter from "./router/AppRouter";
import AppInitializer from "./components/app/AppInitializer";
import "./App.css";


function App() {
  return (
    <MantineProvider>
      <AppInitializer>
        <AppRouter />
      </AppInitializer>
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
//  /#/progress /// משהו השתבש איתו 

//  /#/admin  /// משהו השתבש איתו 
//  /#/access-denied

//  /#/sajdoiafjsodcvsd
