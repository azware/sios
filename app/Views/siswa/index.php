<h2>Manajemen Siswa</h2>
<button class="btn btn-primary mb-3" onclick="showForm()">Tambah Siswa</button>
<table class="table table-bordered">
    <thead>
        <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Alamat</th>
            <th>Tanggal Lahir</th>
            <th>Jenis Kelamin</th>
            <th>Email</th>
            <th>Nomor Telepon</th>
            <th>Aksi</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($siswa as $s) : ?>
            <tr>
                <td><?= $s['id'] ?></td>
                <td><?= $s['nama'] ?></td>
                <td><?= $s['alamat'] ?></td>
                <td><?= $s['tanggal_lahir'] ?></td>
                <td><?= $s['jenis_kelamin'] ?></td>
                <td><?= $s['email'] ?></td>
                <td><?= $s['nomor_telepon'] ?></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editSiswa(<?= $s['id'] ?>)">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSiswa(<?= $s['id'] ?>)">Hapus</button>
                </td>
            </tr>
        <?php endforeach; ?>
    </tbody>
</table>
<div id="form-container"></div>
