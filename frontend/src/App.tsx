import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import Agendar from "@/pages/Agendar";
import Agendamento from "@/pages/Agendamento";
import PagamentoDemo from "@/pages/PagamentoDemo";
import PagamentoResultado from "@/pages/PagamentoResultado";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/agendamento/:id" element={<Agendamento />} />
        <Route path="/pagamento/resultado" element={<PagamentoResultado />} />
        <Route path="/pagamento/:id" element={<PagamentoDemo />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Toaster richColors />
    </>
  );
}
