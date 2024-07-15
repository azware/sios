<?= $this->extend('layouts/main') ?>

<?= $this->section('content') ?>
<div class="row">
    <div class="col-12">
        <h1 class="mt-4">Detail Siswa</h1>
        <div class="card">
            <div class="card-body">
                <p><strong>Nama:</strong> <?= $siswa['nama'] ?></p>
                <p><strong>Alamat:</strong> <?= $siswa['alamat'] ?></p>
                <p><strong>Tanggal Lahir:</strong> <?= $siswa['tanggal_lahir'] ?></p>
                <p><strong>Jenis Kelamin:</strong> <?= $siswa['jenis_kelamin'] ?></p>
                <p><strong>Informasi Keluarga:</strong> <?= $siswa['informasi_keluarga'] ?></p>
                <p><strong>Sekolah Sebelumnya:</strong> <?= $siswa['sekolah_sebelumnya'] ?></p>
                <p><strong>Email:</strong> <?= $siswa['email'] ?></p>
                <p><strong>Nomor Telepon:</strong> <?= $siswa['nomor_telepon'] ?></p>
                <p><strong>Foto:</strong> <img src="/uploads/<?= $siswa['foto'] ?>" alt="Foto Siswa" class="img-thumbnail"></p>
                <a href="/siswa" class="btn btn-secondary">Kembali ke Daftar Siswa</a>
            </div>
        </div>
    </div>
</div>
<?= $this->endSection() ?>
