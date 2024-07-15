<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSiswaTable extends Migration
{
    public function up()
    {
        // Tabel Siswa
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'nama' => [
                'type' => 'VARCHAR',
                'constraint' => '100',
            ],
            'alamat' => [
                'type' => 'TEXT',
            ],
            'tanggal_lahir' => [
                'type' => 'DATE',
            ],
            'jenis_kelamin' => [
                'type' => 'ENUM',
                'constraint' => ['Laki-laki', 'Perempuan'],
            ],
            'informasi_keluarga' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'sekolah_sebelumnya' => [
                'type' => 'VARCHAR',
                'constraint' => '100',
                'null' => true,
            ],
            'email' => [
                'type' => 'VARCHAR',
                'constraint' => '100',
                'null' => true,
            ],
            'nomor_telepon' => [
                'type' => 'VARCHAR',
                'constraint' => '15',
                'null' => true,
            ],
            'foto' => [
                'type' => 'VARCHAR',
                'constraint' => '255',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('siswa');

        // Tabel Orang Tua
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'siswa_id' => [
                'type' => 'INT',
                'unsigned' => true,
            ],
            'nama' => [
                'type' => 'VARCHAR',
                'constraint' => '100',
            ],
            'hubungan' => [
                'type' => 'ENUM',
                'constraint' => ['Ayah', 'Ibu', 'Wali'],
            ],
            'pekerjaan' => [
                'type' => 'VARCHAR',
                'constraint' => '100',
                'null' => true,
            ],
            'nomor_telepon' => [
                'type' => 'VARCHAR',
                'constraint' => '15',
                'null' => true,
            ],
            'email' => [
                'type' => 'VARCHAR',
                'constraint' => '100',
                'null' => true,
            ],
            'alamat' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('siswa_id', 'siswa', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('orang_tua');

        // Tabel Kehadiran
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'siswa_id' => [
                'type' => 'INT',
                'unsigned' => true,
            ],
            'tanggal' => [
                'type' => 'DATE',
            ],
            'status' => [
                'type' => 'ENUM',
                'constraint' => ['Hadir', 'Izin', 'Sakit', 'Alpha'],
            ],
            'keterangan' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('siswa_id', 'siswa', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('kehadiran');

        // Tabel Nilai
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'siswa_id' => [
                'type' => 'INT',
                'unsigned' => true,
            ],
            'mata_pelajaran' => [
                'type' => 'VARCHAR',
                'constraint' => '100',
            ],
            'jenis_nilai' => [
                'type' => 'ENUM',
                'constraint' => ['Ujian', 'Tugas', 'Aktivitas'],
            ],
            'nilai' => [
                'type' => 'DECIMAL',
                'constraint' => '5,2',
            ],
            'tanggal' => [
                'type' => 'DATE',
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('siswa_id', 'siswa', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('nilai');

        // Tabel Prestasi
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'siswa_id' => [
                'type' => 'INT',
                'unsigned' => true,
            ],
            'jenis_prestasi' => [
                'type' => 'VARCHAR',
                'constraint' => '100',
            ],
            'tanggal' => [
                'type' => 'DATE',
            ],
            'keterangan' => [
                'type' => 'TEXT',
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('siswa_id', 'siswa', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('prestasi');

        // Tabel Pengguna
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'username' => [
                'type' => 'VARCHAR',
                'constraint' => '50',
                'unique' => true,
            ],
            'password' => [
                'type' => 'VARCHAR',
                'constraint' => '255',
            ],
            'role' => [
                'type' => 'ENUM',
                'constraint' => ['Admin', 'Guru', 'Siswa', 'Orang Tua'],
            ],
            'siswa_id' => [
                'type' => 'INT',
                'unsigned' => true,
                'null' => true,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('siswa_id', 'siswa', 'id', 'CASCADE', 'SET NULL');
        $this->forge->createTable('pengguna');
    }

    public function down()
    {
        $this->forge->dropTable('pengguna');
        $this->forge->dropTable('prestasi');
        $this->forge->dropTable('nilai');
        $this->forge->dropTable('kehadiran');
        $this->forge->dropTable('orang_tua');
        $this->forge->dropTable('siswa');
    }
}
