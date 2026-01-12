import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Search from './pages/Search';
import Watch from './pages/Watch';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-bg-dark)]">
        <Header />
        <main className="pt-20 pb-8 px-4 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watch/:videoId" element={<Watch />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
