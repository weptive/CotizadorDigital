import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/Home";
import CotizadorGeneral from "@/pages/CotizadorGeneral";
import CotizadorImpresion from "@/pages/CotizadorImpresion";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/cotizador-general" component={CotizadorGeneral} />
        <Route path="/cotizador-impresion" component={CotizadorImpresion} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
