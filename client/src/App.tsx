import { AuthProvider } from "./context/AuthContext";
import { FeedbackProvider } from "./context/FeedbackContext";
import { AppRouter } from "./routes/AppRouter";

export default function App() {
  return (
    <FeedbackProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </FeedbackProvider>
  );
}
