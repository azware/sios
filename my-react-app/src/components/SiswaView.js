import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function SiswaView() {
  const { id } = useParams();
  const [siswa, setSiswa] = useState({});

  useEffect(() => {
    axios.get(`http://localhost:8080/siswa/view/${id}`)
      .then(response => {
        setSiswa(response.data);
      })
      .catch(error => {
        console.error('Ada masalah saat mengambil data siswa:', error);
      });
  }, [id]);

  return (
    <div className="container mt-5">
      <h1>Detail Siswa</h1>
      <div className="card">
        <div className="card-body">
          <p><strong>Nama:</strong> {siswa.nama}</p>
          <p><strong>Alamat:</strong> {siswa.alamat}</p>
          <p><strong>Tanggal Lahir:</strong> {siswa.tanggal_lahir}</p>
          <p><strong>Jenis Kelamin:</strong> {siswa.jenis_kelamin}</p>
          <p><strong>Informasi Keluarga:</strong> {siswa.informasi_keluarga}</p>
          <p><strong>Sekolah Sebelumnya:</strong> {siswa.sekolah_sebelumnya}</p>
          <p><strong>Email:</strong> {siswa.email}</p>
          <p><strong>Nomor Telepon:</strong> {siswa.nomor_telepon}</p>
          <p><strong>Foto:</strong> <img src={`/uploads/${siswa.foto}`} alt="Foto Siswa" className="img-thumbnail" /></p>
          <a href="/siswa" className="btn btn-secondary">Kembali ke Daftar Siswa</a>
        </div>
      </div>
    </div>
  );
}

export default SiswaView;
