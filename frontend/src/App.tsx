import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { loadStoredAuth } from "./store/authSlice";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SkillAssessmentPage from "./components/assessment/SkillAssessmentPage";


// Initialize auth state from localStorage
store.dispatch(loadStoredAuth());

const App = () => (
  <Provider store={store}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<Index />} />
            <Route path="/skill-assessment" element={<SkillAssessmentPage/>}/>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
  </Provider>
);

export default App;
