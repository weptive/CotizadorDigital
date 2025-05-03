export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="mt-8 md:mt-0">
          <p className="text-center text-sm text-gray-500">&copy; {new Date().getFullYear()} Sistema de Cotizaciones. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
