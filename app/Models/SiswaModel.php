<?php

namespace App\Models;

use CodeIgniter\Model;

class SiswaModel extends Model
{
    protected $table = 'siswa';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'nama', 'alamat', 'tanggal_lahir', 'jenis_kelamin', 
        'informasi_keluarga', 'sekolah_sebelumnya', 'email', 'nomor_telepon'
    ];
}


