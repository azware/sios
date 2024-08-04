<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Siswa</title>
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
</head>
<body>
    <div class="container mt-5">
        <h1>Edit Siswa</h1>
        <form id="editSiswaForm">
            <div class="form-group">
                <label for="nama">Nama</label>
                <input type="text" class="form-control" id="nama" name="nama" required>
            </div>
            <div class="form-group">
                <label for="alamat">Alamat</label>
                <input type="text" class="form-control" id="alamat" name="alamat" required>
            </div>
            <div class="form-group">
                <label for="tanggal_lahir">Tanggal Lahir</label>
                <input type="date" class="form-control" id="tanggal_lahir" name="tanggal_lahir" required>
            </div>
            <div class="form-group">
                <label for="jenis_kelamin">Jenis Kelamin</label>
                <select class="form-control" id="jenis_kelamin" name="jenis_kelamin" required>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                </select>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" class="form-control" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="nomor_telepon">Nomor Telepon</label>
                <input type="text" class="form-control" id="nomor_telepon" name="nomor_telepon" required>
            </div>
            <div class="form-group">
                <label for="informasi_keluarga">Informasi Keluarga</label>
                <input type="text" class="form-control" id="informasi_keluarga" name="informasi_keluarga">
            </div>
            <div class="form-group">
                <label for="sekolah_sebelumnya">Sekolah Sebelumnya</label>
                <input type="text" class="form-control" id="sekolah_sebelumnya" name="sekolah_sebelumnya">
            </div>
            <button type="submit" class="btn btn-primary">Simpan</button>
        </form>
    </div>

    <script src="<?= base_url('assets/js/bootstrap.min.js') ?>"></script>
    <script>
        $(document).ready(function() {
            var id = <?= json_encode($id) ?>;

            $.ajax({
                url: 'http://localhost:8080/siswa/' + id,
                method: 'GET',
                success: function(data) {
                    $('#nama').val(data.nama);
                    $('#alamat').val(data.alamat);
                    $('#tanggal_lahir').val(data.tanggal_lahir);
                    $('#jenis_kelamin').val(data.jenis_kelamin);
                    $('#email').val(data.email);
                    $('#nomor_telepon').val(data.nomor_telepon);
                    $('#informasi_keluarga').val(data.informasi_keluarga);
                    $('#sekolah_sebelumnya').val(data.sekolah_sebelumnya);
                },
                error: function(error) {
                    console.error('Ada masalah saat mengambil data siswa:', error);
                }
            });

            $('#editSiswaForm').on('submit', function(event) {
                event.preventDefault();
                var formData = $(this).serialize();
                $.ajax({
                    url: 'http://localhost:8080/siswa/' + id,
                    method: 'PUT',
                    data: formData,
                    success: function() {
                        alert('Data siswa berhasil diubah');
                        window.location.href = 'http://localhost:8080/';
                    },
                    error: function(error) {
                        console.error('Ada masalah saat mengubah data siswa:', error);
                    }
                });
            });
        });
    </script>
</body>
</html>
