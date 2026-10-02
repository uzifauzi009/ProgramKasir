import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getTodayDate = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
};

const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      if (response.data.success) onLogin(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Pastikan server backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page flex min-h-screen items-center justify-center p-4">
      <section className="login-card w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="brand-icon flex h-12 w-12 items-center justify-center rounded-2xl text-2xl">⚡</div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">KASIR<span className="brand-accent">KU</span></p>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">Toko & Penjualan</p>
          </div>
        </div>
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ad5f42]">Selamat datang</p>
          <h1 className="mt-2 text-3xl font-extrabold text-stone-800">Masuk ke kasir penjualan</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">Kelola penjualan dan laporan toko dari satu tempat.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="mb-1.5 block text-xs font-bold text-stone-600">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
              required
              className="login-input w-full rounded-xl px-4 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-stone-600">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
              className="login-input w-full rounded-xl px-4 py-3 text-sm outline-none"
            />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="login-button w-full rounded-xl py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Memeriksa...' : 'Masuk ke aplikasi'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-stone-400">Akun awal: admin / admin123</p>
      </section>
    </main>
  );
}

function NotificationPopup({ notification, onClose }) {
  if (!notification) return null;

  const isError = notification.type === 'error';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl sm:p-8">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold ${isError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {isError ? '!' : '✓'}
        </div>
        <p className={`mt-5 text-sm font-bold uppercase tracking-wider ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {isError ? 'Terjadi Kesalahan' : 'Berhasil'}
        </p>
        <p className="mt-2 text-base leading-relaxed text-gray-600">{notification.message}</p>
        <button type="button" onClick={onClose} className={`mt-7 w-full rounded-xl py-3 font-bold text-white shadow transition ${isError ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
          Tutup
        </button>
        <button type="button" onClick={onClose} className="mt-3 text-sm font-semibold text-gray-400 hover:text-gray-700">
          ×
        </button>
      </div>
    </div>
  );
}

function ConfirmPopup({ product, onConfirm, onClose }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">!</div>
        <p className="mt-5 text-sm font-bold uppercase tracking-wider text-amber-600">Konfirmasi Hapus</p>
        <p className="mt-2 text-base leading-relaxed text-gray-600">
          Hapus produk <span className="font-bold text-gray-800">&quot;{product.nama_produk}&quot;</span> dari daftar?
        </p>
        <div className="mt-7 flex gap-3">
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-gray-100 py-3 font-bold text-gray-600 transition hover:bg-gray-200">
            Batal
          </button>
          <button type="button" onClick={onConfirm} className="w-full rounded-xl bg-red-600 py-3 font-bold text-white shadow transition hover:bg-red-700">
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('kasir_user') || 'null');
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('kasir'); // 'kasir' atau 'laporan'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [qrisImage, setQrisImage] = useState(() => localStorage.getItem('kasir_qris_image') || '');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [notification, setNotification] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // State Modal Tambah Produk
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    kode_produk: '',
    nama_produk: '',
    kategori: 'Makanan',
    harga_jual: '',
    stok: ''
  });

  // State Laporan
  const [laporan, setLaporan] = useState({ ringkasan: {}, transaksi: [] });
  const [reportDate, setReportDate] = useState(getTodayDate);
  const [reportLoading, setReportLoading] = useState(false);
  const [statistik, setStatistik] = useState({ tren_harian: [], prediksi_makanan: [] });

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (currentUser) fetchProducts();
  }, [currentUser]);

  const handleLogin = (user) => {
    sessionStorage.setItem('kasir_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('kasir_user');
    setCurrentUser(null);
    setCart([]);
    setPaymentSuccess(null);
  };

  // Ambil data produk dari Flask
  async function fetchProducts() {
    try {
      const res = await axios.get(`${API_BASE_URL}/produk`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showNotification('Gagal mengambil data produk. Pastikan server Flask berjalan di port 5000.');
    }
  }

  // Ambil data laporan harian
  const fetchLaporan = async (tanggal = reportDate) => {
    setReportLoading(true);
    setLaporan((currentLaporan) => ({
      ...currentLaporan, 
      tanggal,
      ringkasan: {},
      transaksi: [],
    }));
    setStatistik({ tren_harian: [], prediksi_makanan: [] });
    try {
      const [laporanRes, statistikRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/laporan/harian`, { params: { tanggal } }),
        axios.get(`${API_BASE_URL}/statistik`, { params: { tanggal } }),
      ]);
      if (laporanRes.status === 'fulfilled' && laporanRes.value.data.success) {
        setLaporan(laporanRes.value.data);
      } else if (laporanRes.status === 'rejected') {
        throw laporanRes.reason;
      }
      if (statistikRes.status === 'fulfilled' && statistikRes.value.data.success) {
        setStatistik(statistikRes.value.data);
      } else {
        console.warn('Statistik tidak tersedia:', statistikRes.reason?.response?.data?.message || statistikRes.reason?.message);
      }
    } catch {
      showNotification('Gagal mengambil data laporan.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleReportDateChange = (event) => {
    const tanggal = event.target.value;
    setReportDate(tanggal);
    fetchLaporan(tanggal);
  };

  const downloadLaporanCsv = () => {
    const headers = ['No Nota', 'Tanggal', 'Waktu', 'Total Belanja', 'Uang Bayar', 'Kembalian', 'Catatan'];
    const rows = laporan.transaksi.map((tx) => [
      tx.no_nota,
      laporan.tanggal,
      new Date(tx.tanggal_waktu).toLocaleTimeString('id-ID'),
      tx.total_harga,
      tx.bayar,
      tx.kembali,
      tx.catatan || 'Lunas',
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-penjualan-${laporan.tanggal}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'laporan') fetchLaporan();
    else fetchProducts();
  };

  const handleQrisImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('File QRIS harus berupa gambar.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      setQrisImage(imageData);
      localStorage.setItem('kasir_qris_image', imageData);
    };
    reader.readAsDataURL(file);
  };

  // Submit Produk Baru ke API Flask
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        harga_jual: parseFloat(newProduct.harga_jual),
        stok: parseInt(newProduct.stok, 10)
      };
      const res = await axios.post(`${API_BASE_URL}/produk`, payload);
      if (res.data.success) {
        showNotification('Produk berhasil ditambahkan!', 'success');
        setIsModalOpen(false);
        setNewProduct({ kode_produk: '', nama_produk: '', kategori: 'Makanan', harga_jual: '', stok: '' });
        fetchProducts();
      }
    } catch (err) {
      showNotification('Gagal menambah produk: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProduct = async (event, product) => {
    event.stopPropagation();
    setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    const product = productToDelete;
    setProductToDelete(null);
    if (!product) return;

    try {
      const response = await axios.delete(`${API_BASE_URL}/produk/${product.id_produk}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Produk gagal dihapus.');
      }
      setCart((currentCart) => currentCart.filter((item) => item.id_produk !== product.id_produk));
      await fetchProducts();
    } catch (err) {
      showNotification('Produk gagal dihapus: ' + (err.response?.data?.message || err.message));
    }
  };

  // Tambah item ke keranjang
  const addToCart = (product) => {
    if (product.stok <= 0) return;

    const existingIndex = cart.findIndex((item) => item.id_produk === product.id_produk);
    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].jumlah + 1 > product.stok) {
        showNotification('Stok barang tidak mencukupi!');
        return;
      }
      updatedCart[existingIndex].jumlah += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id_produk: product.id_produk,
          nama_produk: product.nama_produk,
          harga_satuan: parseFloat(product.harga_jual),
          jumlah: 1,
        },
      ]);
    }
  };

  // Ubah jumlah item di keranjang
  const updateQuantity = (id_produk, delta) => {
    const updatedCart = cart
      .map((item) => {
        if (item.id_produk === id_produk) {
          const product = products.find((p) => p.id_produk === id_produk);
          const newQty = item.jumlah + delta;

          if (newQty > product.stok) {
            showNotification('Stok barang tidak mencukupi!');
            return item;
          }
          return { ...item, jumlah: newQty };
        }
        return item;
      })
      .filter((item) => item.jumlah > 0);

    setCart(updatedCart);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.harga_satuan * item.jumlah, 0);
  const numericPayAmount = parseFloat(payAmount) || 0;
  const changeAmount = numericPayAmount - totalPrice;
  const maxFoodSales = Math.max(...statistik.prediksi_makanan.map((item) => Number(item.total_terjual)), 1);

  // Proses Transaksi
  const handlePayment = async () => {
    if (cart.length === 0) return;
    if (numericPayAmount < totalPrice) {
      showNotification('Uang pembayaran kurang!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        bayar: numericPayAmount,
        catatan: paymentMethod,
        items: cart,
      };

      const res = await axios.post(`${API_BASE_URL}/transaksi`, payload);
      if (res.data.success) {
        setPaymentSuccess({ ...res.data.data, metode_pembayaran: paymentMethod });
        setCart([]);
        setPayAmount('');
        setPaymentMethod('Tunai');
        fetchProducts();
      }
    } catch (err) {
      showNotification('Transaksi gagal diproses: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="app-shell min-h-screen flex font-sans">
      <NotificationPopup notification={notification} onClose={() => setNotification(null)} />
      <ConfirmPopup product={productToDelete} onConfirm={confirmDeleteProduct} onClose={() => setProductToDelete(null)} />
      <aside className="app-sidebar hidden w-60 shrink-0 flex-col border-r px-5 py-6 lg:flex">
        <div className="brand-mark mb-10 flex items-center gap-3">
          <div className="brand-icon flex h-10 w-10 items-center justify-center rounded-xl text-xl">⚡</div>
          <div>
            <p className="text-sm font-extrabold tracking-tight">KASIR<span className="brand-accent">KU</span></p>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">Toko & Penjualan</p>
          </div>
        </div>
        <p className="nav-label mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em]">Menu utama</p>
        <nav className="space-y-2">
          <button
            onClick={() => handleTabChange('kasir')}
            className={`nav-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
              activeTab === 'kasir' ? 'nav-item-active' : ''
            }`}
          >
            <span>🛒</span> POS Kasir Penjualan
          </button>
          <button
            onClick={() => handleTabChange('laporan')}
            className={`nav-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
              activeTab === 'laporan' ? 'nav-item-active' : ''
            }`}
          >
            <span>📊</span> Laporan Penjualan
          </button>
        </nav>
        <button onClick={handleLogout} className="mt-auto border-t pt-5 text-left text-xs opacity-70 transition hover:text-[#ad5f42]">↪ Keluar dari aplikasi</button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="topbar flex items-center justify-between border-b px-4 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">Manajemen Kasir Penjualan</p>
            <h1 className="mt-1 text-lg font-extrabold text-stone-800">{activeTab === 'kasir' ? 'Point of Sale' : 'Laporan Penjualan'}</h1>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden text-xs sm:block"><p className="font-bold text-stone-700">{currentUser.nama_lengkap}</p><p className="opacity-60">{currentUser.role === 'admin' ? 'Administrator' : 'Kasir'}</p></div>
            <button onClick={handleLogout} title="Keluar" className="avatar flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold">{currentUser.nama_lengkap?.charAt(0).toUpperCase()}</button>
          </div>
        </header>

        <div className="mobile-nav flex gap-2 overflow-x-auto border-b px-4 py-3 lg:hidden">
          <button onClick={() => handleTabChange('kasir')} className={`nav-item whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold ${activeTab === 'kasir' ? 'nav-item-active' : ''}`}>🛒 POS Kasir Penjualan</button>
          <button onClick={() => handleTabChange('laporan')} className={`nav-item whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold ${activeTab === 'laporan' ? 'nav-item-active' : ''}`}>📊 Laporan Penjualan</button>
        </div>

      {/* MAIN CONTENT */}
      <main className="main-content flex-1 overflow-auto p-4 sm:p-7">
        {paymentSuccess ? (
          <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
                ✓
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-green-600">Pembayaran Berhasil</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-800">Transaksi Selesai</h2>
              <p className="mt-2 text-sm text-gray-500">Terima kasih, pembayaran telah tercatat di sistem.</p>

              <div className="mt-7 space-y-3 rounded-xl bg-gray-50 p-5 text-left">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Nomor Nota</span>
                  <span className="font-mono font-bold text-blue-600">{paymentSuccess.no_nota}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Total Belanja</span>
                  <span className="font-semibold text-gray-800">Rp {Number(paymentSuccess.total_harga).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Uang Dibayar</span>
                  <span className="font-semibold text-gray-800">Rp {Number(paymentSuccess.bayar).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Metode Pembayaran</span>
                  <span className="font-semibold text-gray-800">{paymentSuccess.metode_pembayaran}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 text-base">
                  <span className="font-semibold text-gray-700">Kembalian</span>
                  <span className="font-bold text-green-600">Rp {Number(paymentSuccess.kembali).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <button
                onClick={() => setPaymentSuccess(null)}
                className="mt-7 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow transition hover:bg-blue-700"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        ) : activeTab === 'kasir' ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:min-h-[calc(100vh-120px)]">
            {/* KIRI: DAFTAR PRODUK */}
            <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 overflow-y-auto lg:w-2/3">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Daftar Produk</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow"
                  >
                    + Tambah Produk
                  </button>
                  <button
                    onClick={fetchProducts}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg font-semibold mb-2">Belum ada produk</p>
                  <p className="text-xs">Klik tombol <b>"+ Tambah Produk"</b> di atas untuk memasukkan produk baru.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => (
                    <div
                      key={p.id_produk}
                      onClick={() => addToCart(p)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        p.stok <= 0
                          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                            {p.kategori}
                          </span>
                          <button
                            type="button"
                            title={`Hapus ${p.nama_produk}`}
                            onClick={(event) => handleDeleteProduct(event, p)}
                            className="rounded-md px-1.5 py-1 text-xs text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                        <h3 className="font-bold text-gray-800 mt-2">{p.nama_produk}</h3>
                        <p className="text-xs text-gray-400 mb-3">{p.kode_produk}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="font-bold text-blue-600 text-sm">
                          Rp {Number(p.harga_jual).toLocaleString('id-ID')}
                        </span>
                        <span className={`text-xs font-medium ${p.stok > 5 ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
                          Stok: {p.stok}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KANAN: DETAIL ORDER */}
            <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between lg:w-1/3">
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">Detail Order</h2>
                <div className="max-h-64 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <p className="text-center py-8 text-gray-400 text-sm">Keranjang belanja masih kosong</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id_produk} className="flex justify-between items-center border-b pb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-800">{item.nama_produk}</h4>
                            <p className="text-xs text-gray-500">
                              Rp {item.harga_satuan.toLocaleString('id-ID')} x {item.jumlah}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id_produk, -1)}
                              className="w-6 h-6 bg-gray-200 text-gray-700 font-bold rounded flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="text-sm font-semibold">{item.jumlah}</span>
                            <button
                              onClick={() => updateQuantity(item.id_produk, 1)}
                              className="w-6 h-6 bg-gray-200 text-gray-700 font-bold rounded flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                          <div className="w-20 text-right font-bold text-sm text-gray-800">
                            Rp {(item.harga_satuan * item.jumlah).toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TRANSAKSI */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-lg font-bold text-gray-800">
                  <span>Total:</span>
                  <span className="text-blue-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                  {paymentMethod !== 'Tunai' && (
                    <p className="mt-1 text-[11px] text-amber-600">
                      Pastikan pembayaran sudah diterima sebelum transaksi dikonfirmasi.
                    </p>
                  )}
                </div>

                {paymentMethod === 'QRIS' && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                    {qrisImage ? (
                      <img src={qrisImage} alt="Barcode QRIS pembayaran" className="mx-auto h-40 w-40 rounded-lg bg-white object-contain p-2" />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-white text-center text-xs text-gray-400">
                        Foto QRIS belum ditambahkan
                      </div>
                    )}
                    <label className="mt-3 block cursor-pointer rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-100">
                      {qrisImage ? 'Ganti Foto QRIS' : 'Upload Foto QRIS'}
                      <input type="file" accept="image/*" onChange={handleQrisImageChange} className="hidden" />
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nominal Pembayaran (Rp)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-right font-bold text-md"
                  />
                </div>

                <div className="flex justify-between text-sm font-semibold text-gray-700">
                  <span>Kembalian:</span>
                  <span className={changeAmount >= 0 ? 'text-green-600 font-bold' : 'text-red-500'}>
                    {numericPayAmount > 0
                      ? changeAmount >= 0
                        ? `Rp ${changeAmount.toLocaleString('id-ID')}`
                        : 'Uang Kurang!'
                      : 'Rp 0'}
                  </span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={cart.length === 0 || numericPayAmount < totalPrice || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl shadow transition"
                >
                  {loading ? 'Memproses...' : paymentMethod === 'Tunai' ? 'Selesaikan Transaksi' : `Konfirmasi ${paymentMethod}`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: LAPORAN */
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:justify-between lg:items-end">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Rekapan Penjualan Hari H</h2>
                <p className="text-xs text-gray-500">Tanggal: {laporan.tanggal}</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label htmlFor="report-date" className="mb-1 block text-xs font-semibold text-gray-600">Pilih tanggal</label>
                  <input
                    id="report-date"
                    type="date"
                    value={reportDate}
                    onChange={handleReportDateChange}
                    className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => fetchLaporan(reportDate)}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  🔄 Terapkan
                </button>
                <button
                  onClick={downloadLaporanCsv}
                  disabled={reportLoading || !laporan.transaksi?.length}
                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {reportLoading ? 'Memuat...' : '⬇ Download CSV'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <p className="text-xs text-blue-600 font-semibold uppercase">Total Transaksi {laporan.tanggal}</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-1">
                  {laporan.ringkasan?.total_transaksi || 0} Transaksi
                </h3>
              </div>
              <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                <p className="text-xs text-green-600 font-semibold uppercase">Total Pendapatan {laporan.tanggal}</p>
                <h3 className="text-2xl font-bold text-green-900 mt-1">
                  Rp {Number(laporan.ringkasan?.total_pendapatan || 0).toLocaleString('id-ID')}
                </h3>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
              <div className="rounded-xl border border-[#eadfd9] bg-[#fffdfb] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                      <h3 className="font-bold text-stone-800">Makanan paling laku</h3>
                      <p className="mt-1 text-xs text-stone-500">Urutan menu berdasarkan penjualan 30 hari terakhir.</p>
                  </div>
                    <span className="rounded-full bg-[#f3e2da] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#9d5238]">Rekomendasi</span>
                </div>
                  {statistik.prediksi_makanan.length === 0 ? (
                    <p className="py-8 text-center text-xs text-stone-400">Belum ada histori makanan terjual.</p>
                ) : (
                    <div className="space-y-3">
                      {statistik.prediksi_makanan.map((item, index) => (
                        <div key={item.id_produk} className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f3e2da] text-xs font-bold text-[#9d5238]">{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-3 text-xs font-bold text-stone-700">
                              <span className="truncate">{item.nama_produk}</span>
                              <span>{item.total_terjual} terjual</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f1e7e2]">
                              <div className="h-full rounded-full bg-[#c78368]" style={{ width: `${Math.max((Number(item.total_terjual) / maxFoodSales) * 100, 6)}%` }} />
                            </div>
                            <p className="mt-1 text-[10px] text-stone-400">{item.kategori} · terjual {item.hari_terjual} hari</p>
                          </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-[#eadfd9] bg-[#fffdfb] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Perkiraan stok 7 hari</p>
                  {statistik.prediksi_makanan[0] ? (
                    <>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3e2da] text-xl">★</div>
                        <div>
                          <h3 className="text-lg font-extrabold text-[#9d5238]">{statistik.prediksi_makanan[0].nama_produk}</h3>
                          <p className="text-xs text-stone-500">Menu dengan potensi penjualan tertinggi</p>
                        </div>
                      </div>
                      <div className="mt-5 border-t border-[#eadfd9] pt-3 text-xs text-stone-500">
                        Siapkan sekitar <strong className="text-stone-700">{statistik.prediksi_makanan[0].perkiraan_7_hari} porsi</strong> untuk 7 hari berikutnya.
                      </div>
                    </>
                  ) : (
                    <p className="mt-5 text-xs leading-relaxed text-stone-400">Prediksi akan muncul setelah ada transaksi makanan yang tersimpan.</p>
                  )}
                  <p className="mt-3 text-[11px] leading-relaxed text-stone-400">Estimasi dihitung dari rata-rata penjualan 30 hari terakhir, bukan jaminan penjualan.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b">
                    <th className="p-3">No Nota</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Total Belanja</th>
                    <th className="p-3">Uang Bayar</th>
                    <th className="p-3">Kembalian</th>
                    <th className="p-3">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {reportLoading ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-gray-400">
                        Memuat pembukuan tanggal {laporan.tanggal}...
                      </td>
                    </tr>
                  ) : laporan.transaksi?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-gray-400">
                        Belum ada transaksi pada tanggal yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    laporan.transaksi?.map((tx) => (
                      <tr key={tx.id_transaksi} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono font-bold text-blue-600">{tx.no_nota}</td>
                        <td className="p-3 text-gray-500">{new Date(tx.tanggal_waktu).toLocaleTimeString('id-ID')}</td>
                        <td className="p-3 font-bold text-gray-800">
                          Rp {Number(tx.total_harga).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-gray-600">Rp {Number(tx.bayar).toLocaleString('id-ID')}</td>
                        <td className="p-3 text-gray-600">Rp {Number(tx.kembali).toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 font-semibold rounded">
                            {tx.catatan || 'Lunas'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      </div>

      {/* MODAL FORM TAMBAH PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tambah Produk Baru</h3>
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kode / SKU Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PRD-006"
                  value={newProduct.kode_produk}
                  onChange={(e) => setNewProduct({ ...newProduct, kode_produk: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Es Teh Manis"
                  value={newProduct.nama_produk}
                  onChange={(e) => setNewProduct({ ...newProduct, nama_produk: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                  <select
                    value={newProduct.kategori}
                    onChange={(e) => setNewProduct({ ...newProduct, kategori: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Camilan">Camilan</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={newProduct.stok}
                    onChange={(e) => setNewProduct({ ...newProduct, stok: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Jual (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={newProduct.harga_jual}
                  onChange={(e) => setNewProduct({ ...newProduct, harga_jual: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}