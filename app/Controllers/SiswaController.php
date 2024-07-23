<?php

namespace App\Controllers;

use App\Models\SiswaModel;
use CodeIgniter\Controller;

class SiswaController extends Controller
{
    public function index()
    {
        $model = new SiswaModel();
        $data['siswa'] = $model->getSiswa();
        
        echo view('siswa/index', $data);
    }

    public function view($id)
    {
        $model = new SiswaModel();
        $data['siswa'] = $model->getSiswa($id);

        if (empty($data['siswa'])) {
            throw new \CodeIgniter\Exceptions\PageNotFoundException('Siswa dengan ID ' . $id . ' tidak ditemukan.');
        }

        echo view('siswa/view', $data);
    }

    public function create()
    {
        helper('form');

        if ($this->request->is('post') && $this->validate([
            'nama' => 'required|min_length[3]|max_length[100]',
            'alamat' => 'required',
            'tanggal_lahir' => 'required|valid_date',
            'jenis_kelamin' => 'required|in_list[Laki-laki,Perempuan]',
            'email' => 'required|valid_email',
            'nomor_telepon' => 'required|min_length[9]|max_length[15]'
        ])) {
            $model = new SiswaModel();
            $model->save([
                'nama' => $this->request->getPost('nama'),
                'alamat' => $this->request->getPost('alamat'),
                'tanggal_lahir' => $this->request->getPost('tanggal_lahir'),
                'jenis_kelamin' => $this->request->getPost('jenis_kelamin'),
                'informasi_keluarga' => $this->request->getPost('informasi_keluarga'),
                'sekolah_sebelumnya' => $this->request->getPost('sekolah_sebelumnya'),
                'email' => $this->request->getPost('email'),
                'nomor_telepon' => $this->request->getPost('nomor_telepon')
            ]);

            return redirect()->to('/siswa');
        }

        echo view('siswa/create');
    }

    public function edit($id)
    {
        helper('form');
        $model = new SiswaModel();
        $data['siswa'] = $model->getSiswa($id);

        if (empty($data['siswa'])) {
            throw new \CodeIgniter\Exceptions\PageNotFoundException('Siswa dengan ID ' . $id . ' tidak ditemukan.');
        }

        if ($this->request->getMethod() === 'post' && $this->validate([
            'nama' => 'required|min_length[3]|max_length[100]',
            'alamat' => 'required',
            'tanggal_lahir' => 'required|valid_date',
            'jenis_kelamin' => 'required|in_list[Laki-laki,Perempuan]',
            'email' => 'required|valid_email',
            'nomor_telepon' => 'required|min_length[10]|max_length[15]'
        ])) {
            $model->update($id, [
                'nama' => $this->request->getPost('nama'),
                'alamat' => $this->request->getPost('alamat'),
                'tanggal_lahir' => $this->request->getPost('tanggal_lahir'),
                'jenis_kelamin' => $this->request->getPost('jenis_kelamin'),
                'informasi_keluarga' => $this->request->getPost('informasi_keluarga'),
                'sekolah_sebelumnya' => $this->request->getPost('sekolah_sebelumnya'),
                'email' => $this->request->getPost('email'),
                'nomor_telepon' => $this->request->getPost('nomor_telepon')
            ]);

            return redirect()->to('/siswa');
        }

        echo view('siswa/edit', $data);
    }

    public function delete($id)
    {
        $model = new SiswaModel();
        $model->delete($id);

        return redirect()->to('/siswa');
    }
}
