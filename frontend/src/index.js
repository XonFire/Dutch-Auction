import React from "react";
import ReactDOM from "react-dom";
import { Dapp } from "./components/Dapp";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { orange, red } from "@mui/material/colors";
import "bootstrap/dist/css/bootstrap.css";
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({});

// We import bootstrap here, but you can remove if you want

// This is the entry point of your application, but it just renders the Dapp
// react component. All of the logic is contained in it.

ReactDOM.render(
  <React.StrictMode>
     <ThemeProvider theme={theme}>
        <CssBaseline /> 
        <Dapp />
     </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
