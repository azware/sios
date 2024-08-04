    <script>
        $(document).ready(function(){
            function loadPage(url) {
                $.ajax({
                    url: url,
                    method: 'GET',
                    success: function(data) {
                        $('#main-content').html(data);
                        $('a.nav-link').removeClass('active');
                        $('a.nav-link[href="'+url+'"]').addClass('active');
                    },
                    error: function() {
                        alert('Gagal memuat halaman.');
                    }
                });
            }

            $('a.nav-link').on('click', function(e){
                e.preventDefault();
                var url = $(this).attr('href');
                loadPage(url);
            });

            // Load home content by default
            loadPage('/home');
        });
    </script>
