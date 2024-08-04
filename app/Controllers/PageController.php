<?php 

namespace App\Controllers;

use App\Models\SiswaModel;
use CodeIgniter\Controller;

class PageController extends Controller
{
    public function index()
    {
        echo view('templates/header');
        echo view('pages/main');
        //echo view('templates/footer');
    }

    public function home()
    {
        echo view('pages/home');
    }

    public function siswaList()
    {
        $model = new SiswaModel();
        try {
            $data['siswa'] = $model->findAll();
            return view('siswa/siswa_list', $data);
        } catch (\Exception $e) {
            return $this->response->setStatusCode(500)->setBody('Terjadi kesalahan saat mengambil data siswa.');
        }
    }

    /**
    public function siswaList()
    {
        $model = new SiswaModel();
        $data = $model->findAll();
        return $this->response->setJSON($data);
    }
    */

    public function getSiswa($id)
    {
        $model = new SiswaModel();
        try {
            $data = $model->find($id);
            if ($data) {
                return $this->response->setJSON($data);
            } else {
                return $this->response->setStatusCode(404)->setBody('Data siswa tidak ditemukan.');
            }
        } catch (\Exception $e) {
            return $this->response->setStatusCode(500)->setBody('Terjadi kesalahan saat mengambil data siswa.');
        }
    }

    public function createSiswa()
    {
        $model = new SiswaModel();
        try {
            $data = $this->request->getPost();
            $model->save($data);
            //return $this->response->setJSON(['success' => true]);
            return $this->response->setStatusCode(200)->setBody('Data berhasil ditambahkan');
        } catch (\Exception $e) {
            return $this->response->setStatusCode(500)->setBody('Terjadi kesalahan saat menyimpan data siswa.');
        }
    }

    public function updateSiswa($id)
    {
        $model = new SiswaModel();
        try {
            $data = $this->request->getPost();
            $model->update($id, $data);
            //return $this->response->setJSON(['success' => true]);
            return $this->response->setStatusCode(200)->setBody('Data berhasil diubah');
        } catch (\Exception $e) {
            return $this->response->setStatusCode(500)->setBody('Terjadi kesalahan saat memperbarui data siswa.');
        }
    }

    public function deleteSiswa($id)
    {
        $model = new SiswaModel();
        if ($model->find($id)) {
            $model->delete($id);
            return $this->response->setStatusCode(200)->setBody('Data berhasil dihapus');
        } else {
            return $this->response->setStatusCode(404)->setBody('Data tidak ditemukan');
        }
        /**
        try {
            $model->delete($id);
            return $this->response->setJSON(['success' => true]);
        } catch (\Exception $e) {
            return $this->response->setStatusCode(500)->setBody('Terjadi kesalahan saat menghapus data siswa.');
        } */
    }
}


