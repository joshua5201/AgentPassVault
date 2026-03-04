import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { readStartupConfigError } from "./config/env";

async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_API_MOCKING === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
    });
  }
}

void enableMocking()
  .catch((error) => {
    console.error("MSW bootstrap failed; continuing without mocks.", error);
  })
  .finally(() => {
    const startupConfigError = readStartupConfigError();
    if (startupConfigError) {
      console.error(startupConfigError);
      ReactDOM.createRoot(document.getElementById("root")!).render(
        <div className="mx-auto mt-12 max-w-xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <h1 className="text-lg font-semibold">Configuration Error</h1>
          <p className="mt-2 text-sm">{startupConfigError}</p>
        </div>,
      );
      return;
    }

    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
