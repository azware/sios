<?php
namespace App\Controllers;

use App\Models\SiswaModel;
use CodeIgniter\API\ResponseTrait;

class SiswaController extends BaseController
{
    use ResponseTrait;

    public function index()
    {
        $model = new SiswaModel();
        $data['siswa'] = $model->findAll();
        return view('siswa/index', $data);
    }

    public function create()
    {
        $model = new SiswaModel();
        $data = $this->request->getPost();
        if ($model->insert($data)) {
            return $this->respondCreated($data);
        }
        return $this->failValidationErrors($model->errors());
    }

    public function edit($id)
    {
        $model = new SiswaModel();
        $data = $model->find($id);
        return $this->respond($data);
    }

    public function update($id)
    {
        $model = new SiswaModel();
        $data = $this->request->getRawInput();
        if ($model->update($id, $data)) {
            return $this->respond($data);
        }
        return $this->failValidationErrors($model->errors());
    }

    public function delete($id)
    {
        $model = new SiswaModel();
        if ($model->delete($id)) {
            return $this->respondDeleted(['id' => $id]);
        }
        return $this->failNotFound('Data not found');
    }
}

