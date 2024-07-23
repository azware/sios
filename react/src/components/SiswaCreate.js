import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SiswaCreate() {
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    informasi_keluarga: '',
    sekolah_sebelumnya: '',
    email: '',
    nomor_telepon: ''
  });
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Form submitted');
    axios.post('http://localhost:8080/siswa/create', formData)
      .then(response => {
        console.log('Siswa berhasil ditambahkan:', response.data);
        navigate('/'); // Redirect ke halaman daftar siswa setelah berhasil menambahkan siswa
      })
      .catch(error => {
        console.error('Ada masalah saat menambah siswa:', error);
      });
  };


  return (
    <div className="container mt-5">
      <h1>Tambah Siswa Baru</h1>
      <form onSubmit={handleSubmit}>
        {renderInput('nama', 'Nama')}
        {renderTextarea('alamat', 'Alamat')}
        {renderInput('tanggal_lahir', 'Tanggal Lahir', 'date')}
        {renderSelect('jenis_kelamin', 'Jenis Kelamin', ['Laki-laki', 'Perempuan'])}
        {renderTextarea('informasi_keluarga', 'Informasi Keluarga')}
        {renderInput('sekolah_sebelumnya', 'Sekolah Sebelumnya')}
        {renderInput('email', 'Email', 'email')}
        {renderInput('nomor_telepon', 'Nomor Telepon')}
        <button type="submit" className="btn btn-primary">Simpan</button>
      </form>
    </div>
  );

  function renderInput(name, label, type = 'text') {
    return (
      <div className="form-group">
        <label htmlFor={name}>{label}:</label>
        <input
          type={type}
          name={name}
          id={name}
          className="form-control"
          value={formData[name]}
          onChange={handleChange}
          required
        />
      </div>
    );
  }

  function renderTextarea(name, label) {
    return (
      <div className="form-group">
        <label htmlFor={name}>{label}:</label>
        <textarea
          name={name}
          id={name}
          className="form-control"
          value={formData[name]}
          onChange={handleChange}
        ></textarea>
      </div>
    );
  }

  function renderSelect(name, label, options) {
    return (
      <div className="form-group">
        <label htmlFor={name}>{label}:</label>
        <select
          name={name}
          id={name}
          className="form-control"
          value={formData[name]}
          onChange={handleChange}
          required
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }
}

export default SiswaCreate;
