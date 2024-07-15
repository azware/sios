import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SiswaList() {
  const [siswa, setSiswa] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8080/siswa')
      .then(response => {
        setSiswa(response.data);
      })
      .catch(error => {
        console.error('Ada masalah saat mengambil data siswa:', error);
      });
  }, []);

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
          {siswa.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.nama}</td>
              <td>{s.alamat}</td>
              <td>{s.tanggal_lahir}</td>
              <td>{s.jenis_kelamin}</td>
              <td>
                <a href={`/siswa/view/${s.id}`} className="btn btn-info btn-sm">Lihat</a>
                <a href={`/siswa/edit/${s.id}`} className="btn btn-warning btn-sm">Edit</a>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <a href="/siswa/create" className="btn btn-primary">Tambah Siswa Baru</a>
    </div>
  );

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
}

export default SiswaList;
