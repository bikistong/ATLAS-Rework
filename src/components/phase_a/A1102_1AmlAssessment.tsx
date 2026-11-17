import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, X } from 'lucide-react';
import { getWorksheet } from '../../data/blueprintLoader';
import { useAtlas } from '../../store/AtlasContext';
import { isWorkpaperReadOnly } from '../../store/lockGuard';
import { A1102_1AmlItem } from '../../types/atlas';

type CategoryFilter = 'Semua' | A1102_1AmlItem['kategori'];
type RegTab = 'A1102.1A' | 'A1102.1B' | 'A1102.1C' | 'A1102.D';

export const A1102_1AmlAssessment: React.FC = () => {
  const { activeEngagement, dispatchAction, setActiveIndex } = useAtlas();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Semua');
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [activeRegTab, setActiveRegTab] = useState<RegTab>('A1102.1A');
  const [countryQuery, setCountryQuery] = useState('');

  const regListRows = useMemo(() => {
    const extractAbc = (sheetName: 'A1102.1A' | 'A1102.1B' | 'A1102.1C') => {
      const ws = getWorksheet('part1', sheetName);
      if (!ws) return [];
      return ws.non_empty_rows
        .filter((r) => r.row >= 3)
        .map((r) => {
          const b = r.cells.find((c) => c.cell.startsWith('B'))?.value ?? '';
          const c = r.cells.find((cell) => cell.cell.startsWith('C'))?.value ?? '';
          return { kode: b, uraian: c };
        })
        .filter((x) => x.kode || x.uraian);
    };
    const extractCpi = () => {
      const ws = getWorksheet('part1', 'A1102.D');
      if (!ws) return [];
      return ws.non_empty_rows
        .filter((r) => r.row >= 4)
        .map((r) => {
          const rank = r.cells.find((c) => c.cell.startsWith('B'))?.value ?? '';
          const country = r.cells.find((c) => c.cell.startsWith('C'))?.value ?? '';
          const scoreLatest = r.cells.find((c) => c.cell.startsWith('D'))?.value ?? '';
          const region = r.cells.find((c) => c.cell.startsWith('J'))?.value ?? '';
          return { rank, country, scoreLatest, region };
        })
        .filter((x) => x.country);
    };
    return {
      'A1102.1A': extractAbc('A1102.1A'),
      'A1102.1B': extractAbc('A1102.1B'),
      'A1102.1C': extractAbc('A1102.1C'),
      'A1102.D': extractCpi(),
    };
  }, []);

  if (!activeEngagement) return null;

  const isReadOnly = isWorkpaperReadOnly(activeEngagement, 'A1102.1');
  const { a1102_1, a1102 } = activeEngagement;

  const yaCount = a1102_1.filter((item) => item.jawaban === 'Ya').length;
  const visibleItems =
    activeCategory === 'Semua'
      ? a1102_1
      : a1102_1.filter((item) => item.kategori === activeCategory);

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'Semua', label: `Semua (${a1102_1.length})` },
    { key: 'Profil', label: `Profil Pengguna Jasa (${a1102_1.filter((i) => i.kategori === 'Profil').length})` },
    { key: 'Negara', label: `Yurisdiksi Negara (${a1102_1.filter((i) => i.kategori === 'Negara').length})` },
    { key: 'Bisnis', label: `Sektor Bisnis (${a1102_1.filter((i) => i.kategori === 'Bisnis').length})` },
    { key: 'Produk', label: `Produk/Jasa Finansial (${a1102_1.filter((i) => i.kategori === 'Produk').length})` },
  ];

  const filteredCountries = regListRows['A1102.D'].filter(
    (c) =>
      !countryQuery.trim() ||
      c.country.toLowerCase().includes(countryQuery.trim().toLowerCase()) ||
      c.region.toLowerCase().includes(countryQuery.trim().toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            PMK NO. 55/PMK.01/2017 · PMK NO. 155/PMK.01/2017 · PMPJ
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mt-0.5">
            A1102.1 — Daftar Uji Kepatuhan Anti Pencucian Uang & Pendanaan Terorisme (TPPU)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap jawaban &ldquo;Ya&rdquo; otomatis menandai indikasi TPPU pada A1102 (Butir 6) menjadi Ya.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="a1102_1-tppu-status"
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              a1102.q6IndikasiTppu === 'Ya'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            Indikasi TPPU: {a1102.q6IndikasiTppu} ({yaCount} kriteria)
          </span>
          <button
            type="button"
            data-testid="btn-open-pmk-modal"
            onClick={() => setRegModalOpen(true)}
            className="h-8 px-3 rounded border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-xs font-medium text-indigo-800 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Lihat Detail Regulasi PMK 55/155
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex('A1102')}
            className="h-8 px-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            A1102
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveCategory(cat.key)}
            className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer transition-colors ${
              activeCategory === cat.key
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Checklist Grid */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="py-2 px-3 text-left font-semibold w-20">Kode</th>
                <th className="py-2 px-3 text-left font-semibold w-24">Kategori</th>
                <th className="py-2 px-3 text-left font-semibold">Kriteria Pengguna Jasa / Risiko TPPU</th>
                <th className="py-2 px-3 text-center font-semibold w-28">Indikasi</th>
                <th className="py-2 px-3 text-left font-semibold w-64">Penjelasan / Mitigasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleItems.map((item) => (
                <tr key={item.kodeKriteria} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                    {item.kodeKriteria}
                  </td>
                  <td className="py-2 px-3 text-slate-600">{item.kategori}</td>
                  <td className="py-2 px-3 text-slate-800">{item.deskripsiKriteria}</td>
                  <td className="py-2 px-3 text-center">
                    <select
                      aria-label={item.deskripsiKriteria}
                      data-testid={`aml-select-${item.kodeKriteria}`}
                      disabled={isReadOnly}
                      value={item.jawaban}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPDATE_A1102_1',
                          kodeKriteria: item.kodeKriteria,
                          patch: { jawaban: e.target.value as 'Ya' | 'Tidak' },
                        })
                      }
                      className={`h-8 px-2 text-xs rounded border font-medium disabled:bg-slate-100 disabled:text-slate-500 ${
                        item.jawaban === 'Ya'
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      aria-label={`Penjelasan ${item.kodeKriteria}`}
                      disabled={isReadOnly}
                      value={item.penjelasan}
                      onChange={(e) =>
                        dispatchAction({
                          type: 'UPDATE_A1102_1',
                          kodeKriteria: item.kodeKriteria,
                          patch: { penjelasan: e.target.value },
                        })
                      }
                      placeholder={item.jawaban === 'Ya' ? 'Wajib jelaskan dasar identifikasi...' : 'Catatan opsional'}
                      className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Regulasi A1102.1A - A1102.D */}
      {regModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Referensi Regulasi PMK 55/155"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={() => setRegModalOpen(false)}
        >
          <div
            className="bg-white border border-slate-300 rounded-sm shadow-md w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Lampiran Regulasi PMK 55/155 & Indeks Persepsi Korupsi (A1102.1A – A1102.D)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sumber langsung blueprint ATLAS IAPI (Pejabat Negara, Strategis, LHKPN & CPI Negara).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegModalOpen(false)}
                aria-label="Tutup modal regulasi"
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-slate-200 flex flex-wrap gap-1.5 bg-white">
              {(
                [
                  { id: 'A1102.1A', label: 'A1102.1A · Pejabat Negara' },
                  { id: 'A1102.1B', label: 'A1102.1B · Jabatan Strategis' },
                  { id: 'A1102.1C', label: 'A1102.1C · Wajib LHKPN' },
                  { id: 'A1102.D', label: 'A1102.D · Indeks CPI Negara' },
                ] as { id: RegTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRegTab(tab.id)}
                  className={`h-8 px-3 rounded text-xs font-medium border cursor-pointer ${
                    activeRegTab === tab.id
                      ? 'bg-indigo-700 border-indigo-700 text-white'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeRegTab !== 'A1102.D' ? (
                <table className="w-full text-xs border border-slate-200 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <th className="py-2 px-3 text-left w-16">Butir</th>
                      <th className="py-2 px-3 text-left">Klasifikasi / Jabatan PEP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {regListRows[activeRegTab].map((r, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                          {r.kode || '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-800">{r.uraian}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Cari nama negara atau kawasan..."
                    className="w-full max-w-xs h-8 px-2.5 text-xs border border-slate-300 rounded"
                  />
                  <table className="w-full text-xs border border-slate-200 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                        <th className="py-2 px-3 text-right w-20">Peringkat</th>
                        <th className="py-2 px-3 text-left">Negara / Yurisdiksi</th>
                        <th className="py-2 px-3 text-right w-28">Skor CPI</th>
                        <th className="py-2 px-3 text-left">Kawasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredCountries.map((c, idx) => {
                        const numScore = Number(c.scoreLatest);
                        const isLowScore = Number.isFinite(numScore) && numScore < 40;
                        return (
                          <tr key={`${c.country}-${idx}`} className={isLowScore ? 'bg-rose-50/40' : ''}>
                            <td className="py-1.5 px-3 font-mono tabular-nums text-right text-slate-600">
                              {c.rank}
                            </td>
                            <td className="py-1.5 px-3 font-medium text-slate-800">{c.country}</td>
                            <td
                              className={`py-1.5 px-3 font-mono tabular-nums text-right font-semibold ${
                                isLowScore ? 'text-rose-700' : 'text-slate-700'
                              }`}
                            >
                              {c.scoreLatest}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600">{c.region}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
