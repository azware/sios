<?= $this->extend('layouts/main') ?>

<?= $this->section('content') ?>
<div class="row">
    <div class="col-12">
        <h1 class="mt-4">Daftar Siswa</h1>
        <a href="/siswa/create" class="btn btn-primary mb-3">Tambah Siswa Baru</a>
        <table class="table table-striped table-bordered">
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
                <?php foreach ($siswa as $s): ?>
                <tr>
                    <td><?= $s['id'] ?></td>
                    <td><?= $s['nama'] ?></td>
                    <td><?= $s['alamat'] ?></td>
                    <td><?= $s['tanggal_lahir'] ?></td>
                    <td><?= $s['jenis_kelamin'] ?></td>
                    <td>
                        <a href="/siswa/view/<?= $s['id'] ?>" class="btn btn-info btn-sm">Lihat</a>
                        <a href="/siswa/edit/<?= $s['id'] ?>" class="btn btn-warning btn-sm">Edit</a>
                        <a href="/siswa/delete/<?= $s['id'] ?>" class="btn btn-danger btn-sm" onclick="return confirm('Apakah Anda yakin?')">Hapus</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
<?= $this->endSection() ?>
