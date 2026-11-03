import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import {MantineProvider} from "@mantine/core";
import '@mantine/core/styles.css';
import {BrowserRouter} from "react-router-dom";
import {I18nProvider} from "./i18n";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MantineProvider defaultColorScheme="dark">
            <I18nProvider>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </I18nProvider>
        </MantineProvider>
    </React.StrictMode>,
);
