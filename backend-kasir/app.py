from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app) #untuk mengizinkan permintaan dari domain lain

#konfigurasi koneksi database
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'db_kasir'),
    'port': int(os.getenv('DB_PORT', '3306'))
}

def get_db_connection():
    """Fungsi untuk membuat koneksi ke database MySQL"""
    return mysql.connector.connect(**db_config)


def ensure_default_user(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pengguna (
            id_pengguna INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            nama_lengkap VARCHAR(100) NOT NULL,
            role VARCHAR(30) NOT NULL DEFAULT 'kasir',
            dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("SELECT id_pengguna FROM pengguna WHERE username = %s", ('admin',))
    if cursor.fetchone() is None:
        cursor.execute(
            "INSERT INTO pengguna (username, password_hash, nama_lengkap, role) VALUES (%s, %s, %s, %s)",
            ('admin', generate_password_hash('admin123'), 'Administrator', 'admin')
        )


def ensure_product_status(cursor):
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'produk' AND COLUMN_NAME = 'aktif'
    """, (db_config['database'],))
    column_info = cursor.fetchone()
    column_count = column_info['total'] if isinstance(column_info, dict) else column_info[0]
    if column_count == 0:
        cursor.execute("ALTER TABLE produk ADD COLUMN aktif TINYINT(1) NOT NULL DEFAULT 1")


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', ''))

    if not username or not password:
        return jsonify({"success": False, "message": "Username dan password wajib diisi."}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_default_user(cursor)
        conn.commit()
        cursor.execute(
            "SELECT username, password_hash, nama_lengkap, role FROM pengguna WHERE username = %s",
            (username,)
        )
        user = cursor.fetchone()

        if user is None or not check_password_hash(user['password_hash'], password):
            return jsonify({"success": False, "message": "Username atau password salah."}), 401

        return jsonify({
            "success": True,
            "data": {
                "username": user['username'],
                "nama_lengkap": user['nama_lengkap'],
                "role": user['role']
            }
        }), 200
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor and conn and conn.is_connected():
            cursor.close()
            conn.close()

# 1. Api produk (daftar produk)
@app.route('/api/produk', methods=['GET', 'POST'])
def handle_produk():
    # A. Mengambil Daftar Produk (GET)
    if request.method == 'GET':
        conn = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            ensure_product_status(cursor)
            cursor.execute("SELECT * FROM produk WHERE aktif = 1 ORDER BY nama_produk ASC")
            produk_list = cursor.fetchall()
            return jsonify({"success": True, "data": produk_list}), 200
        except Error as e:
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()

    # B. Menambah Produk Baru (POST)
    elif request.method == 'POST':
        data = request.json
        kode_produk = data.get('kode_produk')
        nama_produk = data.get('nama_produk')
        kategori = data.get('kategori', 'Umum')
        harga_jual = data.get('harga_jual')
        stok = data.get('stok', 0)

        if not kode_produk or not nama_produk or not harga_jual:
            return jsonify({"success": False, "message": "Kode, nama, dan harga wajib diisi!"}), 400

        conn = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            ensure_product_status(cursor)
            cursor.execute(
                "SELECT id_produk FROM produk WHERE kode_produk = %s AND aktif = 0",
                (kode_produk,)
            )
            archived_product = cursor.fetchone()

            if archived_product:
                cursor.execute(
                    """
                    UPDATE produk
                    SET nama_produk = %s, kategori = %s, harga_jual = %s, stok = %s, aktif = 1
                    WHERE id_produk = %s
                    """,
                    (nama_produk, kategori, harga_jual, stok, archived_product[0])
                )
                conn.commit()
                return jsonify({"success": True, "message": "Produk berhasil diaktifkan kembali."}), 200

            cursor.execute(
                "SELECT nama_produk FROM produk WHERE kode_produk = %s AND aktif = 1",
                (kode_produk,)
            )
            active_product = cursor.fetchone()
            if active_product:
                return jsonify({
                    "success": False,
                    "message": f"Kode {kode_produk} sudah digunakan oleh produk {active_product[0]}. Gunakan kode produk lain."
                }), 409

            query = "INSERT INTO produk (kode_produk, nama_produk, kategori, harga_jual, stok) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(query, (kode_produk, nama_produk, kategori, harga_jual, stok))
            conn.commit()
            return jsonify({"success": True, "message": "Produk berhasil ditambahkan!"}), 201
        except Error as e:
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            if conn and conn.is_connected():
                cursor.close()
                conn.close()


@app.route('/api/produk/<int:id_produk>', methods=['DELETE'])
def hapus_produk(id_produk):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        ensure_product_status(cursor)
        cursor.execute("UPDATE produk SET aktif = 0 WHERE id_produk = %s AND aktif = 1", (id_produk,))

        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "Produk tidak ditemukan."}), 404

        conn.commit()
        return jsonify({"success": True, "message": "Produk berhasil dihapus dari daftar stok."}), 200
    except Error as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor and conn and conn.is_connected():
            cursor.close()
            conn.close()


# 2. API TRANSAKSI / ORDER (Simpan Pembelian & Potong Stok)
@app.route('/api/transaksi', methods=['POST'])
def simpan_transaksi():
    data = request.json
    items = data.get('items', [])
    bayar = float(data.get('bayar', 0))
    catatan = data.get('catatan', '')

    if not items:
        return jsonify({"success": False, "message": "Keranjang belanja kosong!"}), 400

    total_harga = sum(item['harga_satuan'] * item['jumlah'] for item in items)

    if bayar < total_harga:
        return jsonify({"success": False, "message": "Uang pembayaran kurang!"}), 400

    kembali = bayar - total_harga
    no_nota = f"TRX-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    conn = None
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cursor = conn.cursor()

        query_tx = "INSERT INTO transaksi (no_nota, total_harga, bayar, kembali, catatan) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(query_tx, (no_nota, total_harga, bayar, kembali, catatan))
        id_transaksi = cursor.lastrowid

        query_detail = "INSERT INTO detail_transaksi (id_transaksi, id_produk, harga_satuan, jumlah, subtotal) VALUES (%s, %s, %s, %s, %s)"
        query_update_stok = "UPDATE produk SET stok = stok - %s WHERE id_produk = %s AND stok >= %s"

        for item in items:
            subtotal = item['harga_satuan'] * item['jumlah']
            cursor.execute(query_detail, (id_transaksi, item['id_produk'], item['harga_satuan'], item['jumlah'], subtotal))
            cursor.execute(query_update_stok, (item['jumlah'], item['id_produk'], item['jumlah']))
            
            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({"success": False, "message": f"Stok barang ID {item['id_produk']} tidak mencukupi!"}), 400

        conn.commit()
        return jsonify({
            "success": True,
            "message": "Transaksi berhasil disimpan!",
            "data": {
                "no_nota": no_nota,
                "total_harga": total_harga,
                "bayar": bayar,
                "kembali": kembali
            }
        }), 201

    except Error as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# 3. API REKAPAN PENJUALAN HARIAN
@app.route('/api/laporan/harian', methods=['GET'])
def get_laporan_harian():
    tanggal = request.args.get('tanggal', datetime.now().strftime('%Y-%m-%d'))

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query_ringkasan = """
            SELECT 
                COUNT(id_transaksi) as total_transaksi,
                IFNULL(SUM(total_harga), 0) as total_pendapatan
            FROM transaksi 
            WHERE DATE(tanggal_waktu) = %s
        """
        cursor.execute(query_ringkasan, (tanggal,))
        ringkasan = cursor.fetchone()

        query_list = """
            SELECT id_transaksi, no_nota, tanggal_waktu, total_harga, bayar, kembali, catatan
            FROM transaksi 
            WHERE DATE(tanggal_waktu) = %s
            ORDER BY tanggal_waktu DESC
        """
        cursor.execute(query_list, (tanggal,))
        daftar_transaksi = cursor.fetchall()

        return jsonify({
            "success": True,
            "tanggal": tanggal,
            "ringkasan": ringkasan,
            "transaksi": daftar_transaksi
        }), 200

    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


# 4. API STATISTIK & ESTIMASI KERAMAIAN
@app.route('/api/statistik', methods=['GET'])
def get_statistik():
    tanggal = request.args.get('tanggal', datetime.now().strftime('%Y-%m-%d'))

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query_harian = """
            SELECT DATE(tanggal_waktu) AS tanggal,
                   COUNT(id_transaksi) AS total_transaksi,
                   IFNULL(SUM(total_harga), 0) AS total_pendapatan
            FROM transaksi
            WHERE DATE(tanggal_waktu) >= DATE_SUB(%s, INTERVAL 29 DAY)
              AND DATE(tanggal_waktu) <= %s
            GROUP BY DATE(tanggal_waktu)
            ORDER BY tanggal ASC
        """
        cursor.execute(query_harian, (tanggal, tanggal))
        tren_harian = cursor.fetchall()

        query_makanan = """
            SELECT p.id_produk, p.nama_produk, p.kategori,
                   SUM(dt.jumlah) AS total_terjual,
                   COUNT(DISTINCT DATE(t.tanggal_waktu)) AS hari_terjual,
                   IFNULL(SUM(dt.subtotal), 0) AS total_pendapatan
            FROM detail_transaksi dt
            JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
            JOIN produk p ON p.id_produk = dt.id_produk
            WHERE DATE(t.tanggal_waktu) >= DATE_SUB(%s, INTERVAL 29 DAY)
              AND DATE(t.tanggal_waktu) <= %s
            GROUP BY p.id_produk, p.nama_produk, p.kategori
            ORDER BY total_terjual DESC, hari_terjual DESC, total_pendapatan DESC
            LIMIT 5
        """
        cursor.execute(query_makanan, (tanggal, tanggal))
        makanan = cursor.fetchall()

        for item in makanan:
            item['rata_rata_harian'] = round(float(item['total_terjual']) / 30, 1)
            item['perkiraan_7_hari'] = round(float(item['total_terjual']) / 30 * 7, 1)

        return jsonify({
            'success': True,
            'tanggal': tanggal,
            'tren_harian': tren_harian,
            'prediksi_makanan': makanan,
        }), 200
    except (Error, ValueError) as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


if __name__ == '__main__':
    print("Server Kasir Flask berjalan di http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
