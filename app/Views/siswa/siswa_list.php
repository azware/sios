<div class="container mt-5">
    <h1>Daftar Siswa</h1>
    <button class="btn btn-primary mb-3" id="btnTambah">Tambah Siswa Baru</button>
    <table id="siswaTable" class="table table-bordered table-hover">
        <thead>
            <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Alamat</th>
                <th>Tanggal Lahir</th>
                <th>Jenis Kelamin</th>
                <th>Informasi Keluarga</th>
                <th>Sekolah Sebelumnya</th>
                <th>Email</th>
                <th>No HP</th>
                <th>Aksi</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($siswa as $s): ?>
                <tr>
                    <td><?php echo $s['id']; ?></td>
                    <td><?php echo $s['nama']; ?></td>
                    <td><?php echo $s['alamat']; ?></td>
                    <td><?php echo $s['tanggal_lahir']; ?></td>
                    <td><?php echo $s['jenis_kelamin']; ?></td>
                    <td><?php echo $s['informasi_keluarga']; ?></td>
                    <td><?php echo $s['sekolah_sebelumnya']; ?></td>
                    <td><?php echo $s['email']; ?></td>
                    <td><?php echo $s['nomor_telepon']; ?></td>
                    <td>
                        <button class="btn btn-info btn-sm btnEdit mb-1" data-id="<?= $s['id'] ?>">Edit</button>
                        <button class="btn btn-danger btn-sm btnDelete" data-id="<?= $s['id'] ?>">Hapus</button>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<!-- Modal untuk tambah/edit siswa -->
<div class="modal fade" id="siswaModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Form Siswa</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form id="siswaForm">
                    <input type="hidden" name="id" id="siswaId">
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
                        <label for="informasi_keluarga">Informasi Keluarga</label>
                        <textarea class="form-control" id="informasi_keluarga" name="informasi_keluarga"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="sekolah_sebelumnya">Sekolah Sebelumnya</label>
                        <input type="text" class="form-control" id="sekolah_sebelumnya" name="sekolah_sebelumnya">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" class="form-control" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="nomor_telepon">Nomor Telepon</label>
                        <input type="text" class="form-control" id="nomor_telepon" name="nomor_telepon" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    $(document).ready(function() {
        $('#siswaTable').DataTable();

        // Show the modal for adding a new siswa
        $('#btnTambah').click(function() {
            $('#siswaForm')[0].reset();
            $('#siswaModal').modal('show');
        });

        // Edit siswa
        $('.btnEdit').click(function() {
            var id = $(this).data('id');
            $.get('/siswa/' + id, function(data) {
                $('#siswaId').val(data.id);
                $('#nama').val(data.nama);
                $('#alamat').val(data.alamat);
                $('#tanggal_lahir').val(data.tanggal_lahir);
                $('#jenis_kelamin').val(data.jenis_kelamin);
                $('#informasi_keluarga').val(data.informasi_keluarga);
                $('#sekolah_sebelumnya').val(data.sekolah_sebelumnya);
                $('#email').val(data.email);
                $('#nomor_telepon').val(data.nomor_telepon);
                $('#siswaModal').modal('show');
            });
        });

        // Delete siswa
        $('.btnDelete').click(function() {
            var id = $(this).data('id');
            if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
                $.ajax({
                    url: '/siswa/delete/' + id,
                    method: 'DELETE',
                    success: function() {
                        location.reload();
                    }
                });
            }
        });

        // Handle form submission
        $('#siswaForm').submit(function(e) {
            e.preventDefault();
            var id = $('#siswaId').val();
            var url = id ? '/siswa/update/' + id : '/siswa/create';
            $.post(url, $(this).serialize(), function() {
                $('#siswaModal').modal('hide');
                location.reload();
            });
        });
    });

</script>
