import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

import ModuleView from "./pages/Intro";
import Results from "./pages/Result";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/page/:pageNumber" element={<ModuleView />} />

        <Route path="/result" element={<Results />} />

        <Route path="/" element={<Navigate to="/page/1" replace />} />

        <Route path="*" element={<Navigate to="/page/1" replace />} />
      </Routes>
    </Router>
  );
}

export default App;