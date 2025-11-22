/// <reference types="vite/client" />
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { UserProvider } from "./components/contexts/UserContext";
import { MessageProvider } from "./components/contexts/MessageContext";
import { GitProvider } from "./components/contexts/GitContext";
import { EditorProvider } from "./components/contexts/EditorContext";
import { LayoutProvider } from "./components/contexts/LayoutContext";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <LayoutProvider>
      <UserProvider>
        <MessageProvider>
          <GitProvider>
            <EditorProvider>
              <App />
            </EditorProvider>
          </GitProvider>
        </MessageProvider>
      </UserProvider>
    </LayoutProvider>
  </ClerkProvider>
);
