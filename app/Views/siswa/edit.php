<?= $this->extend('layouts/main') ?>

<?= $this->section('content') ?>
<div class="row">
    <div class="col-12">
        <h1 class="mt-4">Edit Siswa</h1>
        <?= \Config\Services::validation()->listErrors() ?>
        <form action="/siswa/edit/<?= $siswa['id'] ?>" method="post" class="needs-validation" novalidate>
            <?= csrf_field() ?>
            <div class="form-group">
                <label for="nama">Nama:</label>
                <input type="text" name="nama" id="nama" class="form-control" value="<?= set_value('nama', $siswa['nama']) ?>" required>
                <div class="invalid-feedback">Nama wajib diisi.</div>
            </div>
            <div class="form-group">
                <label for="alamat">Alamat:</label>
                <textarea name="alamat" id="alamat" class="form-control" required><?= set_value('alamat', $siswa['alamat']) ?></textarea>
                <div class="invalid-feedback">Alamat wajib diisi.</div>
            </div>
            <div class="form-group">
                <label for="tanggal_lahir">Tanggal Lahir:</label>
                <input type="date" name="tanggal_lahir" id="tanggal_lahir" class="form-control" value="<?= set_value('tanggal_lahir', $siswa['tanggal_lahir']) ?>" required>
                <div class="invalid-feedback">Tanggal lahir wajib diisi.</div>
            </div>
            <div class="form-group">
                <label for="jenis_kelamin">Jenis Kelamin:</label>
                <select name="jenis_kelamin" id="jenis_kelamin" class="form-control" required>
                    <option value="Laki-laki" <?= set_select('jenis_kelamin', 'Laki-laki', $siswa['jenis_kelamin'] == 'Laki-laki') ?>>Laki-laki</option>
                    <option value="Perempuan" <?= set_select('jenis_kelamin', 'Perempuan', $siswa['jenis_kelamin'] == 'Perempuan') ?>>Perempuan</option>
                </select>
                <div class="invalid-feedback">Jenis kelamin wajib diisi.</div>
            </div>
            <div class="form-group">
                <label for="informasi_keluarga">Informasi Keluarga:</label>
                <textarea name="informasi_keluarga" id="informasi_keluarga" class="form-control"><?= set_value('informasi_keluarga', $siswa['informasi_keluarga']) ?></textarea>
            </div>
            <div class="form-group">
                <label for="sekolah_sebelumnya">Sekolah Sebelumnya:</label>
                <input type="text" name="sekolah_sebelumnya" id="sekolah_sebelumnya" class="form-control" value="<?= set_value('sekolah_sebelumnya', $siswa['sekolah_sebelumnya']) ?>">
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" name="email" id="email" class="form-control" value="<?= set_value('email', $siswa['email']) ?>" required>
                <div class="invalid-feedback">Email wajib diisi dan valid.</div>
            </div>
            <div class="form-group">
                <label for="nomor_telepon">Nomor Telepon:</label>
                <input type="text" name="nomor_telepon" id="nomor_telepon" class="form-control" value="<?= set_value('nomor_telepon', $siswa['nomor_telepon']) ?>" required>
                <div class="invalid-feedback">Nomor telepon wajib diisi.</div>
            </div>
            <button type="submit" class="btn btn-primary">Simpan</button>
        </form>
    </div>
</div>
<script>
    (function() {
        'use strict';
        window.addEventListener('load', function() {
            var forms = document.getElementsByClassName('needs-validation');
            Array.prototype.filter.call(forms, function(form) {
                form.addEventListener('submit', function(event) {
                    if (form.checkValidity() === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    form.classList.add('was-validated');
                }, false);
            });
        }, false);
    })();
</script>
<?= $this->endSection() ?>
