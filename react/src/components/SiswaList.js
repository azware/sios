import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function SiswaList() {
  const [siswa, setSiswa] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/siswa')
      .then(response => {
        // Periksa apakah data yang diterima adalah objek dengan properti "siswa" yang merupakan array
        if (response.data && response.data.data && Array.isArray(response.data.data.siswa)) {
          setSiswa(response.data.data.siswa);
        } else {
          console.error('Data yang diterima bukan array:', response.data);
        }
      })
      .catch(error => {
        console.error('Ada masalah saat mengambil data siswa:', error);
      });
  }, []);

  function handleDelete(id) {
    if (window.confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
      axios.delete(`http://localhost:8080/siswa/delete/${id}`)
        .then(() => {
          setSiswa(siswa.filter(s => s.id !== id));
        })
        .catch(error => {
          console.error('Ada masalah saat menghapus siswa:', error);
        });
    }
  }

  return (
    <div className="container mt-5">
      <h1>Daftar Siswa</h1>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Alamat</th>
            <th>Tanggal Lahir</th>
            <th>Jenis Kelamin</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {siswa.length > 0 ? (
            siswa.map(s => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.nama}</td>
                <td>{s.alamat}</td>
                <td>{s.tanggal_lahir}</td>
                <td>{s.jenis_kelamin}</td>
                <td>
                  <Link to={`/siswa/view/${s.id}`} className="btn btn-info btn-sm">Lihat</Link>
                  <Link to={`/siswa/edit/${s.id}`} className="btn btn-warning btn-sm">Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Hapus</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">Tidak ada data siswa</td>
            </tr>
          )}
        </tbody>
      </table>
      <Link to="/siswa/create" className="btn btn-primary">Tambah Siswa Baru</Link>
    </div>
  );
}

export default SiswaList;
