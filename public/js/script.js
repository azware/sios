document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('siswaTableBody')) {
        loadSiswa();
    }

    const form = document.getElementById('siswaForm');
    if (form) {
        form.addEventListener('submit', event => {
            event.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            fetch(form.action, {
                method: form.method.toUpperCase(),
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(() => {
                alert('Data siswa berhasil disimpan');
                window.location.href = 'siswa.html';
            })
            .catch(error => console.error('Error:', error));
        });
    }
});

function loadSiswa() {
    fetch('http://localhost:8080/siswa')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('siswaTableBody');
            tableBody.innerHTML = data.map(s => `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.nama}</td>
                    <td>${s.alamat}</td>
                    <td>${s.tanggal_lahir}</td>
                    <td>${s.jenis_kelamin}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="viewSiswa(${s.id})">Lihat</button>
                        <button class="btn btn-warning btn-sm" onclick="editSiswa(${s.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSiswa(${s.id})">Hapus</button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error fetching data:', error));
}

function viewSiswa(id) {
    // Implement view functionality here
}

function editSiswa(id) {
    // Implement edit functionality here
    window.location.href = `siswa-form.html?id=${id}`;
}

function deleteSiswa(id) {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
        fetch(`http://localhost:8080/siswa/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => {
            loadSiswa(); // Reload the siswa list after deletion
        })
        .catch(error => console.error('Error deleting data:', error));
    }
}
