import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { CreatePage } from "./pages/CreatePage";
import { SurveyPage } from "./pages/SurveyPage";
import { SurveysPage } from "./pages/SurveysPage";
import { ResponsesPage } from "./pages/ResponsesPage";

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/surveys" element={<SurveysPage />} />
        <Route path="/s/:surveyId" element={<SurveyPage />} />
        <Route path="/responses/:surveyId" element={<ResponsesPage />} />
      </Routes>
    </Layout>
  );
}
