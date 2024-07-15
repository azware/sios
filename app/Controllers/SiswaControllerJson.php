<?php namespace App\Controllers;

use App\Models\SiswaModel;
use CodeIgniter\RESTful\ResourceController;

class SiswaController extends ResourceController
{
    protected $modelName = 'App\Models\SiswaModel';
    protected $format    = 'json';

    public function index()
    {
        return $this->respond($this->model->findAll());
    }

    public function view($id = null)
    {
        $data = $this->model->find($id);
        if ($data) {
            return $this->respond($data);
        }
        return $this->failNotFound('Data siswa tidak ditemukan');
    }

    public function create()
    {
        $data = $this->request->getPost();
        if ($this->model->insert($data)) {
            return $this->respondCreated($data);
        }
        return $this->failValidationError($this->model->validation->getErrors());
    }

    public function edit($id = null)
    {
        $data = $this->request->getRawInput();
        if ($this->model->update($id, $data)) {
            return $this->respond($data);
        }
        return $this->failValidationError($this->model->validation->getErrors());
    }

    public function delete($id = null)
    {
        if ($this->model->delete($id)) {
            return $this->respondDeleted(['id' => $id]);
        }
        return $this->failNotFound('Data siswa tidak ditemukan');
    }
}
