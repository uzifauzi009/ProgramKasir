from flask import Flask, jsonify, request
from flask_cors import CORS
import pg8000.dbapi
from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash
import os
import re
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    """Fungsi untuk membuat koneksi ke database PostgreSQL"""
    if DATABASE_URL:
        # Parse DATABASE_URL format: postgresql://user:pass@host:port/dbname
        match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', DATABASE_URL)
        if match:
            user, password, host, port, database = match.groups()
            conn = pg8000.dbapi.connect(
                host=host,
                user=user,
                password=password,
                database=database,
                port=int(port)
            )
            conn.autocommit = False
            return conn
    
    # Local development
    conn = pg8000.dbapi.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'db_kasir'),
        port=int(os.getenv('DB_PORT', '5432'))
    )
    conn.autocommit = False
    return conn


def ensure_default_user(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pengguna (
            id_pengguna SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            nama_lengkap VARCHAR(100) NOT NULL,
            role VARCHAR(30) NOT NULL DEFAULT 'kasir',
            dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("SELECT id_pengguna FROM pengguna WHERE username = %s", ('admin',))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO pengguna (username, password_hash, nama_lengkap, role) VALUES (%s, %s, %s, %s)",
            ('admin', generate_password_hash('admin123'), 'Administrator', 'admin')
        )


def ensure_product_status(cursor):
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'produk' AND column_name = 'aktif'
    """)
    result = cursor.fetchone()
    column_count = result[0] if result else 0
    if column_count == 0:
        cursor.execute("ALTER TABLE produk ADD COLUMN aktif SMALLINT NOT NULL DEFAULT 1")


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
        cursor = conn.cursor()
        ensure_default_user(cursor)
        conn.commit()

        cursor.execute(
            "SELECT username, password_hash, nama_lengkap, role FROM pengguna WHERE username = %s",
            (username,)
        )
        user = cursor.fetchone()

        if user is None or not check_password_hash(user[1], password):
            return jsonify({"success": False, "message": "Username atau password salah."}), 401

        return jsonify({
            "success": True,
            "data": {
                "username": user[0],
                "nama_lengkap": user[2],
                "role": user[3]
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/api/produk', methods=['GET', 'POST'])
def handle_produk():
    if request.method == 'GET':
        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            ensure_product_status(cursor)
            cursor.execute("SELECT * FROM produk WHERE aktif = 1 ORDER BY nama_produk ASC")
            produk_list = cursor.fetchall()
            # Convert tuple rows to dict
            columns = [desc[0] for desc in cursor.description]
            produk_dict = [dict(zip(columns, row)) for row in produk_list]
            return jsonify({"success": True, "data": produk_dict}), 200
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

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
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            ensure_product_status(cursor)

            cursor.execute(
                "SELECT id_produk FROM produk WHERE kode_produk = %s AND aktif = 0",
                (kode_produk,)
            )
            archived = cursor.fetchone()
            if archived:
                cursor.execute(
                    """UPDATE produk SET nama_produk = %s, kategori = %s, harga_jual = %s, stok = %s, aktif = 1
                       WHERE id_produk = %s""",
                    (nama_produk, kategori, harga_jual, stok, archived[0])
                )
                conn.commit()
                return jsonify({"success": True, "message": "Produk berhasil diaktifkan kembali."}), 200

            cursor.execute(
                "SELECT nama_produk FROM produk WHERE kode_produk = %s AND aktif = 1",
                (kode_produk,)
            )
            active = cursor.fetchone()
            if active:
                return jsonify({
                    "success": False,
                    "message": f"Kode {kode_produk} sudah digunakan oleh produk {active[0]}. Gunakan kode produk lain."
                }), 409

            cursor.execute(
                "INSERT INTO produk (kode_produk, nama_produk, kategori, harga_jual, stok) VALUES (%s, %s, %s, %s, %s)",
                (kode_produk, nama_produk, kategori, harga_jual, stok)
            )
            conn.commit()
            return jsonify({"success": True, "message": "Produk berhasil ditambahkan!"}), 201
        except Exception as e:
            if conn:
                conn.rollback()
            return jsonify({"success": False, "message": str(e)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
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
        conn.commit()
        return jsonify({"success": True, "message": "Produk berhasil dihapus dari daftar stok."}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


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
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        conn.autocommit = False

        cursor.execute(
            "INSERT INTO transaksi (no_nota, total_harga, bayar, kembali, catatan) VALUES (%s, %s, %s, %s, %s) RETURNING id_transaksi",
            (no_nota, total_harga, bayar, kembali, catatan)
        )
        result = cursor.fetchone()
        id_transaksi = result[0]

        for item in items:
            subtotal = item['harga_satuan'] * item['jumlah']
            cursor.execute(
                "INSERT INTO detail_transaksi (id_transaksi, id_produk, harga_satuan, jumlah, subtotal) VALUES (%s, %s, %s, %s, %s)",
                (id_transaksi, item['id_produk'], item['harga_satuan'], item['jumlah'], subtotal)
            )
            cursor.execute(
                "UPDATE produk SET stok = stok - %s WHERE id_produk = %s AND stok >= %s",
                (item['jumlah'], item['id_produk'], item['jumlah'])
            )
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

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/api/laporan/harian', methods=['GET'])
def get_laporan_harian():
    tanggal = request.args.get('tanggal', datetime.now().strftime('%Y-%m-%d'))

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                COUNT(id_transaksi) as total_transaksi,
                COALESCE(SUM(total_harga), 0) as total_pendapatan
            FROM transaksi 
            WHERE DATE(tanggal_waktu) = %s::date
        """, (tanggal,))
        ringkasan = cursor.fetchone()

        cursor.execute("""
            SELECT id_transaksi, no_nota, tanggal_waktu, total_harga, bayar, kembali, catatan
            FROM transaksi 
            WHERE DATE(tanggal_waktu) = %s::date
            ORDER BY tanggal_waktu DESC
        """, (tanggal,))
        daftar_transaksi = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        transaksi_dict = [dict(zip(columns, row)) for row in daftar_transaksi]

        return jsonify({
            "success": True,
            "tanggal": tanggal,
            "ringkasan": {"total_transaksi": ringkasan[0], "total_pendapatan": float(ringkasan[1])} if ringkasan else {},
            "transaksi": transaksi_dict
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route('/api/statistik', methods=['GET'])
def get_statistik():
    tanggal = request.args.get('tanggal', datetime.now().strftime('%Y-%m-%d'))

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT DATE(tanggal_waktu) AS tanggal,
                   COUNT(id_transaksi) AS total_transaksi,
                   COALESCE(SUM(total_harga), 0) AS total_pendapatan
            FROM transaksi
            WHERE DATE(tanggal_waktu) >= (%s::date - INTERVAL '29 days')
              AND DATE(tanggal_waktu) <= %s::date
            GROUP BY DATE(tanggal_waktu)
            ORDER BY tanggal ASC
        """, (tanggal, tanggal))
        tren_harian_rows = cursor.fetchall()
        tren_harian = [{"tanggal": str(row[0]), "total_transaksi": row[1], "total_pendapatan": float(row[2])} for row in tren_harian_rows]

        cursor.execute("""
            SELECT p.id_produk, p.nama_produk, p.kategori,
                   SUM(dt.jumlah) AS total_terjual,
                   COUNT(DISTINCT DATE(t.tanggal_waktu)) AS hari_terjual,
                   COALESCE(SUM(dt.subtotal), 0) AS total_pendapatan
            FROM detail_transaksi dt
            JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
            JOIN produk p ON p.id_produk = dt.id_produk
            WHERE DATE(t.tanggal_waktu) >= (%s::date - INTERVAL '29 days')
              AND DATE(t.tanggal_waktu) <= %s::date
            GROUP BY p.id_produk, p.nama_produk, p.kategori
            ORDER BY total_terjual DESC, hari_terjual DESC, total_pendapatan DESC
            LIMIT 5
        """, (tanggal, tanggal))
        makanan_rows = cursor.fetchall()
        makanan = [
            {
                "id_produk": row[0],
                "nama_produk": row[1],
                "kategori": row[2],
                "total_terjual": row[3],
                "hari_terjual": row[4],
                "total_pendapatan": float(row[5])
            }
            for row in makanan_rows
        ]

        for item in makanan:
            item['rata_rata_harian'] = round(float(item['total_terjual']) / 30, 1)
            item['perkiraan_7_hari'] = round(float(item['total_terjual']) / 30 * 7, 1)

        return jsonify({
            'success': True,
            'tanggal': tanggal,
            'tren_harian': tren_harian,
            'prediksi_makanan': makanan,
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == '__main__':
    print("Server Kasir Flask berjalan di http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
